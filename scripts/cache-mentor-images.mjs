#!/usr/bin/env node
/**
 * Fetches verified mentor profile images and saves them locally.
 * Run: node scripts/cache-mentor-images.mjs
 *
 * Output: public/assets/mentors/<slug>.jpg (or .png)
 * Manifest: public/assets/mentors/manifest.json
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../public/assets/mentors');

// Mirror of VERIFIED_PEOPLE — canonical name + image URLs to try in order
const PEOPLE = [
  {
    slug: 'bill-gates',
    name: 'Bill Gates',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/8/88/Bill_Gates_at_the_European_Commission_-_2025_-_P067383-987995_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Bill_Gates_2018.jpg/512px-Bill_Gates_2018.jpg',
    ],
  },
  {
    slug: 'oprah-winfrey',
    name: 'Oprah Winfrey',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Oprah_Winfrey_2016.jpg/960px-Oprah_Winfrey_2016.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Oprah_Winfrey_2014.jpg/512px-Oprah_Winfrey_2014.jpg',
    ],
  },
  {
    slug: 'kobe-bryant',
    name: 'Kobe Bryant',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Kobe_Bryant_Dec_2014.jpg/960px-Kobe_Bryant_Dec_2014.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Kobe_Bryant_2019.jpg/512px-Kobe_Bryant_2019.jpg',
    ],
  },
  {
    slug: 'hayao-miyazaki',
    name: 'Hayao Miyazaki',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Hayao_Miyazaki_%282019%29.jpg/512px-Hayao_Miyazaki_%282019%29.jpg',
    ],
  },
  {
    slug: 'elon-musk',
    name: 'Elon Musk',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Elon_Musk_-_54820081119_%28cropped%29.jpg/512px-Elon_Musk_-_54820081119_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Elon_Musk_-_54820081119_%28cropped%29.jpg/960px-Elon_Musk_-_54820081119_%28cropped%29.jpg',
    ],
  },
  {
    slug: 'steve-jobs',
    name: 'Steve Jobs',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/512px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg',
    ],
  },
  {
    slug: 'super-mario',
    name: 'Super Mario',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/5/5c/Mario_by_Shigehisa_Nakaue.png',
    ],
  },
  {
    slug: 'iron-man',
    name: 'Iron Man',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/4/47/Iron_Man_%28circa_2018%29.png',
    ],
  },
  {
    slug: 'pikachu',
    name: 'Pikachu',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/a/a9/Pikachu.png',
    ],
  },
  {
    slug: 'naruto-uzumaki',
    name: 'Naruto Uzumaki',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg',
    ],
  },
  {
    slug: 'monkey-d-luffy',
    name: 'Monkey D. Luffy',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/c/cb/Monkey_D_Luffy.png',
    ],
  },
  {
    slug: 'son-goku',
    name: 'Son Goku',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/6/6f/Son_Goku_Character.jpg',
    ],
  },
  {
    slug: 'spider-man',
    name: 'Spider-Man',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/b/b3/Spider-Man_characters.jpeg',
    ],
  },
  {
    slug: 'batman',
    name: 'Batman',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/1/17/Batman-BenAffleck.jpg',
    ],
  },
  {
    slug: 'link',
    name: 'Link',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/2/2f/Link_Hyrule_Warriors.png',
    ],
  },
  {
    slug: 'lara-croft',
    name: 'Lara Croft',
    urls: [
      'https://upload.wikimedia.org/wikipedia/en/7/7e/Lara_Croft.png',
    ],
  },
  {
    slug: 'lisa-su',
    name: 'Lisa Su',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Lisa_Su_2024_%28cropped%29.jpg/512px-Lisa_Su_2024_%28cropped%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/AMD_CEO_Lisa_Su_20130415_cropped.jpg/512px-AMD_CEO_Lisa_Su_20130415_cropped.jpg',
    ],
  },
  {
    slug: 'satya-nadella',
    name: 'Satya Nadella',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/MS-Exec-Nadella-Satya-2017-08-31-22_%28cropped%29.jpg/512px-MS-Exec-Nadella-Satya-2017-08-31-22_%28cropped%29.jpg',
    ],
  },
  {
    slug: 'taylor-swift',
    name: 'Taylor Swift',
    urls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/512px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png',
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

async function fetchWithRetry(url, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
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
        console.log(`  ⏳ 429 rate-limited, waiting ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) {
        console.log(`  ⚠ HTTP ${res.status} for ${url}`);
        return null;
      }
      const ct = res.headers.get('content-type') || '';
      const ext = extFromContentType(ct);
      const buf = Buffer.from(await res.arrayBuffer());
      return { buf, ext };
    } catch (err) {
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  return null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const manifest = {};
  let ok = 0;
  let fail = 0;

  // Process one at a time to avoid concurrent rate-limits
  for (const person of PEOPLE) {
    const cached = path.join(OUT_DIR, person.slug);
    // Skip if already cached (any extension)
    const extensions = ['.jpg', '.png', '.webp'];
    const alreadyCached = extensions.some((ext) => existsSync(cached + ext));
    if (alreadyCached) {
      const ext = extensions.find((e) => existsSync(cached + e));
      manifest[person.name] = `/assets/mentors/${person.slug}${ext}`;
      console.log(`✓ ${person.name} (cached)`);
      ok++;
      continue;
    }

    let saved = false;
    for (const url of person.urls) {
      console.log(`⬇ ${person.name} — trying ${url.slice(0, 80)}...`);
      const result = await fetchWithRetry(url);
      if (result) {
        const outPath = path.join(OUT_DIR, `${person.slug}${result.ext}`);
        await writeFile(outPath, result.buf);
        manifest[person.name] = `/assets/mentors/${person.slug}${result.ext}`;
        console.log(`✓ ${person.name} saved (${(result.buf.length / 1024).toFixed(0)} KB)`);
        ok++;
        saved = true;
        break;
      }
      // Small pause between candidate URLs
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!saved) {
      console.log(`✗ ${person.name} — all URLs failed`);
      fail++;
    }
    // Stagger requests to avoid 429
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Write manifest
  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nDone: ${ok} cached, ${fail} failed`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
