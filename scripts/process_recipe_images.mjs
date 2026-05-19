import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP_DIR = resolve(__dirname, '..', 'tmp', 'recipe-images');
const QUALITY = 75;
const MAX_WIDTH = 800;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'content';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase env vars.');
  process.exit(1);
}

mkdirSync(TMP_DIR, { recursive: true });
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const recipes = [
  {
    id: 5, slug: 'beet-leaf-salad',
    url: 'https://cdn.pixabay.com/photo/2017/09/16/19/21/salad-2756467_1280.jpg',
    alt: null,
    name: 'Beet Leaf Salad with Lemon Vinaigrette'
  },
  {
    id: 6, slug: 'sauteed-beet-greens',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chard_%28Beta_vulgaris_var_cicla%29.jpg',
    alt: null,
    name: 'Sautéed Beet Greens with Garlic'
  },
  {
    id: 7, slug: 'carrot-leaf-pesto',
    url: 'https://free-images.com/lg/38bb/pesto_bowl_spaghetti_noodles.jpg',
    alt: null,
    name: 'Carrot Leaf Pesto'
  },
  {
    id: 8, slug: 'fennel-leaf-rice',
    url: 'https://free-images.com/lg/e165/fennel_vegetables_fennel_bulb.jpg',
    alt: null,
    name: 'Fennel Leaf and Lemon Rice'
  },
  {
    id: 9, slug: 'kohlrabi-leaf-stirfry',
    url: 'https://pixnio.com/free-images/2020/01/28/2020-01-28-08-47-18.jpg',
    alt: null,
    name: 'Kohlrabi Leaf Stir-fry with Tomatoes'
  },
  {
    id: 10, slug: 'leek-leaf-soup',
    url: 'https://pixnio.com/free-images/2017/11/05/2017-11-05-07-42-40.jpg',
    alt: null,
    name: 'Leek Leaf and Potato Soup'
  }
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function downloadImage(url, filepath, label) {
  const resp = await fetch(url);
  if (resp.status === 429) throw new Error('RATE_LIMITED');
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${label}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  writeFileSync(filepath, buf);
  console.log(`  Downloaded (${(buf.length / 1024).toFixed(0)}KB)`);
}

function convertToWebp(input, output) {
  execSync(`convert "${input}" -resize ${MAX_WIDTH}x${MAX_WIDTH} -quality ${QUALITY} -strip "${output}"`, { stdio: 'pipe' });
  const stats = readFileSync(output);
  console.log(`  Converted to webp (${(stats.length / 1024).toFixed(0)}KB)`);
}

async function uploadToSupabase(filepath, storagePath) {
  const buf = readFileSync(filepath);
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
    contentType: 'image/webp', upsert: true, cacheControl: '31536000'
  });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return publicUrl;
}

async function main() {
  const results = [];

  for (const recipe of recipes) {
    console.log(`\n[${recipe.name}]`);

    const origPath = resolve(TMP_DIR, `${recipe.slug}_original`);
    const webpPath = resolve(TMP_DIR, `${recipe.slug}.webp`);
    const storagePath = `recipes/${recipe.slug}.webp`;

    let success = false;
    const urls = [recipe.url];
    if (recipe.alt) urls.push(recipe.alt);

    for (const url of urls) {
      if (success) break;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await downloadImage(url, origPath, recipe.name);
          convertToWebp(origPath, webpPath);
          const publicUrl = await uploadToSupabase(webpPath, storagePath);
          console.log(`  Uploaded: ${publicUrl}`);
          results.push({ id: recipe.id, slug: recipe.slug, url: publicUrl });
          unlinkSync(origPath);
          unlinkSync(webpPath);
          success = true;
          break;
        } catch (err) {
          if (err.message === 'RATE_LIMITED') {
            console.log(`  Rate limited, retrying in ${(attempt + 1) * 5}s...`);
            await sleep((attempt + 1) * 5000);
          } else {
            console.log(`  ${err.message} (tried ${url})`);
            break;
          }
        }
      }
    }
    if (!success) console.error(`  FAILED all attempts for ${recipe.name}`);
  }

  console.log('\n=== RESULTS ===');
  for (const r of results) {
    console.log(`id: ${r.id}, image_url: "${r.url}"`);
  }

  // Note: These 6 recipes are not in the Supabase DB (different recipe set).
  // Update the image_url in src/data/recipes.ts manually with the URLs above.
}

main().catch(console.error);
