#!/usr/bin/env node
/**
 * Retry fetching failed mentor images with fresh Wikipedia REST API URLs.
 * Longer delays between requests to avoid 429.
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../public/assets/mentors');
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');

const FAILED = [
  {
    slug: 'hayao-miyazaki',
    name: 'Hayao Miyazaki',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/HayaoMiyazakiCCJuly09.jpg/330px-HayaoMiyazakiCCJuly09.jpg',
    ],
  },
  {
    slug: 'steve-jobs',
    name: 'Steve Jobs',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/330px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg',
    ],
  },
  {
    slug: 'pikachu',
    name: 'Pikachu',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/thumb/a/a6/Pok%C3%A9mon_Pikachu_art.png/250px-Pok%C3%A9mon_Pikachu_art.png',
    ],
  },
  {
    slug: 'son-goku',
    name: 'Son Goku',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/GokumangaToriyama.png/250px-GokumangaToriyama.png',
    ],
  },
  {
    slug: 'link',
    name: 'Link',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/9/9d/Link_%28Hyrule_Historia%29.png',
    ],
  },
  {
    slug: 'lara-croft',
    name: 'Lara Croft',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/a/a8/LaraCroftInfobox.png',
    ],
  },
  {
    slug: 'lisa-su',
    name: 'Lisa Su',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/SXSW-2024-alih-OB7A0861-Lisa_Su_%28cropped_2%29.jpg/330px-SXSW-2024-alih-OB7A0861-Lisa_Su_%28cropped_2%29.jpg',
    ],
  },
  {
    slug: 'satya-nadella',
    name: 'Satya Nadella',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/MS-Exec-Nadella-Satya-2017-08-31-22_%28cropped%29.jpg/330px-MS-Exec-Nadella-Satya-2017-08-31-22_%28cropped%29.jpg',
    ],
  },
  {
    slug: 'taylor-swift',
    name: 'Taylor Swift',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/330px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png',
    ],
  },
];

function extFromContentType(ct) {
  if (!ct) return '.jpg';
  if (ct.includes('png')) return '.png';
  if (ct.includes('jpeg') || ct.includes('jpg')) return '.jpg';
  if (ct.includes('webp')) return '.webp';
  return '.jpg';
}

async function fetchWithRetry(url, retries = 4, delay = 4000) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ProblemSolverBot/1.0 (educational project; image caching)',
          Accept: 'image/*',
        },
      });
      clearTimeout(timer);
      if (res.status === 429) {
        const wait = delay * (i + 1);
        console.log(`  ⏳ 429, waiting ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) {
        console.log(`  ⚠ HTTP ${res.status}`);
        return null;
      }
      const ct = res.headers.get('content-type') || '';
      const ext = extFromContentType(ct);
      const buf = Buffer.from(await res.arrayBuffer());
      return { buf, ext };
    } catch (err) {
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delay));
    }
  }
  return null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let manifest = {};
  try {
    manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf-8'));
  } catch { /* start fresh if no manifest */ }

  let ok = 0;
  let fail = 0;

  for (const person of FAILED) {
    // Skip if already cached
    if (manifest[person.name]) {
      console.log(`✓ ${person.name} (already cached)`);
      ok++;
      continue;
    }

    for (const url of person.urls) {
      console.log(`⬇ ${person.name} — ${url.slice(0, 80)}...`);
      const result = await fetchWithRetry(url);
      if (result) {
        const outPath = path.join(OUT_DIR, `${person.slug}${result.ext}`);
        await writeFile(outPath, result.buf);
        manifest[person.name] = `/assets/mentors/${person.slug}${result.ext}`;
        console.log(`✓ ${person.name} (${(result.buf.length / 1024).toFixed(0)} KB)`);
        ok++;
        break;
      }
    }
    if (!manifest[person.name]) {
      console.log(`✗ ${person.name} — failed`);
      fail++;
    }
    // 3s between people to avoid rate limits
    await new Promise((r) => setTimeout(r, 3000));
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nDone: ${ok} OK, ${fail} failed`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
