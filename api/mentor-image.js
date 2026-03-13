/**
 * GET /api/mentor-image?name=Lisa+Su
 *
 * Server-side image proxy + cache for mentor photos.
 * 1. Check local disk cache (public/assets/mentors/<slug>.<ext>)
 * 2. If not cached, query Wikipedia REST API for the person's thumbnail
 * 3. Fetch the image server-side (no CORS/rate-limit issues for client)
 * 4. Save to disk cache and serve
 *
 * Works for ANY person/character searchable on Wikipedia.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CACHE_DIR = path.resolve(__dirname, '../public/assets/mentors');
const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const WIKI_API = 'https://en.wikipedia.org/w/api.php';

function toSlug(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function findCached(slug) {
  for (const ext of ['.jpg', '.png', '.webp']) {
    const p = path.join(CACHE_DIR, slug + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function extFromContentType(ct) {
  if (!ct) return '.jpg';
  if (ct.includes('png')) return '.png';
  if (ct.includes('webp')) return '.webp';
  return '.jpg';
}

function mimeFromExt(ext) {
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

/**
 * Fetch a URL and return { buffer, contentType } or null.
 * Follows redirects, retries on 429.
 */
function fetchBuffer(url, retries = 3, accept = 'image/*') {
  return new Promise((resolve) => {
    const attempt = (n) => {
      const mod = url.startsWith('https') ? https : http;
      const req = mod.get(url, {
        headers: {
          'User-Agent': 'ProblemSolverBot/1.0 (educational; image cache)',
          Accept: accept,
        },
        timeout: 10000,
      }, (res) => {
        // Follow redirects
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          resolve(fetchBuffer(res.headers.location, n, accept));
          return;
        }
        if (res.statusCode === 429 && n > 0) {
          setTimeout(() => attempt(n - 1), 2000);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          resolve(null);
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            buffer: Buffer.concat(chunks),
            contentType: res.headers['content-type'] || '',
          });
        });
        res.on('error', () => resolve(null));
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    };
    attempt(retries);
  });
}

/**
 * Fetch JSON from a URL.
 */
async function fetchJson(url) {
  const result = await fetchBuffer(url, 2, 'application/json');
  if (!result) return null;
  try {
    return JSON.parse(result.buffer.toString('utf-8'));
  } catch {
    return null;
  }
}

/**
 * Find the best image URL for a person via Wikipedia.
 * Tries REST API summary first, then search API.
 */
async function findWikipediaImageUrl(name) {
  // 1. Try REST API summary (most reliable for well-known people)
  const title = name.trim().replace(/\s+/g, '_');
  const summary = await fetchJson(`${WIKI_REST}${encodeURIComponent(title)}`);
  if (summary?.thumbnail?.source) {
    // Try original size from API first (most reliable), then attempt larger
    const original = summary.thumbnail.source;
    const larger = original.replace(/\/\d+px-/, '/512px-');
    return larger !== original ? [larger, original] : [original];
  }

  // 2. Fall back to search API
  const searchParams = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    list: 'search',
    srsearch: name,
    srnamespace: '0',
    srlimit: '3',
  });
  const searchData = await fetchJson(`${WIKI_API}?${searchParams}`);
  const titles = (searchData?.query?.search || []).map((r) => r.title);

  for (const t of titles) {
    const pageParams = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: '512',
      titles: t,
    });
    const pageData = await fetchJson(`${WIKI_API}?${pageParams}`);
    const pages = pageData?.query?.pages ? Object.values(pageData.query.pages) : [];
    const page = pages.find((p) => p?.thumbnail?.source);
    if (page?.thumbnail?.source) return [page.thumbnail.source];
  }

  return null;
}

module.exports = async function mentorImageHandler(req, res) {
  const name = (req.query.name || '').trim();
  if (!name) {
    res.status(400).json({ error: 'name parameter required' });
    return;
  }

  const slug = toSlug(name);
  if (!slug) {
    res.status(400).json({ error: 'invalid name' });
    return;
  }

  // 1. Check disk cache
  const cached = findCached(slug);
  if (cached) {
    const ext = path.extname(cached);
    res.setHeader('Content-Type', mimeFromExt(ext));
    res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
    fs.createReadStream(cached).pipe(res);
    return;
  }

  // 2. Find image URL(s) from Wikipedia
  const imageUrls = await findWikipediaImageUrl(name);
  if (!imageUrls) {
    res.status(404).json({ error: 'no image found', name });
    return;
  }

  // 3. Fetch image server-side — try each candidate URL
  const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
  let result = null;
  for (const url of urls) {
    result = await fetchBuffer(url);
    if (result && result.buffer.length >= 100) break;
    result = null;
  }
  if (!result) {
    res.status(502).json({ error: 'failed to fetch image', name });
    return;
  }

  // 4. Save to cache
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const ext = extFromContentType(result.contentType);
  const cachePath = path.join(CACHE_DIR, slug + ext);
  fs.writeFileSync(cachePath, result.buffer);

  // 5. Serve
  res.setHeader('Content-Type', mimeFromExt(ext));
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.end(result.buffer);
};
