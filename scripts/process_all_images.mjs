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

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase env vars.');
  process.exit(1);
}

mkdirSync(TMP_DIR, { recursive: true });
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

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
  const { error } = await supabase.storage.from('content').upload(storagePath, buf, {
    contentType: 'image/webp', upsert: true, cacheControl: '31536000'
  });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('content').getPublicUrl(storagePath);
  return publicUrl;
}

// Leaf type -> image URL mapping (using existing storage URLs for 7, uploading new for 2)
const LEAF_IMAGE_URLS = {
  onion: null,     // will be uploaded
  beetroot: 'https://oqogytrxruwxrlzfgwbt.supabase.co/storage/v1/object/public/content/leaves/beet-leaves.webp',
  carrot: 'https://oqogytrxruwxrlzfgwbt.supabase.co/storage/v1/object/public/content/leaves/carrot-leaves.webp',
  fennel: null,    // will be uploaded
  kohlrabi: 'https://oqogytrxruwxrlzfgwbt.supabase.co/storage/v1/object/public/content/leaves/kohlrabi-leaves.webp',
  leek: 'https://oqogytrxruwxrlzfgwbt.supabase.co/storage/v1/object/public/content/leaves/leek-leaves.webp',
  radish: 'https://oqogytrxruwxrlzfgwbt.supabase.co/storage/v1/object/public/content/leaves/radish-leaves.webp',
  turnip: 'https://oqogytrxruwxrlzfgwbt.supabase.co/storage/v1/object/public/content/leaves/turnip-leaves.webp',
  artichoke: 'https://oqogytrxruwxrlzfgwbt.supabase.co/storage/v1/object/public/content/leaves/artichoke-leaves.webp',
};

const LEAF_IMAGES_TO_UPLOAD = [
  { type: 'onion', slug: 'onion-leaves', url: 'https://free-images.com/lg/84e6/scallions_white_onion_onion.jpg' },
  { type: 'fennel', slug: 'fennel-leaves', url: 'https://free-images.com/lg/09f4/fennel_herb_foeniculum_vulgare.jpg' },
];

async function main() {
  // Step 1: Upload onion and fennel leaf images
  console.log('=== Step 1: Upload missing leaf images ===');
  for (const item of LEAF_IMAGES_TO_UPLOAD) {
    console.log(`\n[${item.type}]`);
    const origPath = resolve(TMP_DIR, `${item.slug}_original`);
    const webpPath = resolve(TMP_DIR, `${item.slug}.webp`);
    const storagePath = `leaves/${item.slug}.webp`;

    try {
      await downloadImage(item.url, origPath, item.type);
      convertToWebp(origPath, webpPath);
      const publicUrl = await uploadToSupabase(webpPath, storagePath);
      console.log(`  Uploaded: ${publicUrl}`);
      LEAF_IMAGE_URLS[item.type] = publicUrl;
      unlinkSync(origPath);
      unlinkSync(webpPath);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
    }
  }

  // Step 2: Update leaves table for onion and fennel
  console.log('\n=== Step 2: Update leaves table ===');
  const { data: leavesData } = await supabase.from('leaves').select('id, name->>en, image_url');
  for (const leaf of leavesData || []) {
    const en = (leaf.en || '').toLowerCase();
    let type = null;
    if (en.startsWith('onion')) type = 'onion';
    else if (en.startsWith('fennel')) type = 'fennel';
    else continue;

    const url = LEAF_IMAGE_URLS[type];
    if (!url) continue;

    const { error } = await supabase.from('leaves').update({ image_url: url }).eq('id', leaf.id);
    if (error) console.error(`  DB update failed for ${leaf.en}: ${error.message}`);
    else console.log(`  DB updated: ${leaf.en} -> ${url}`);
  }

  // Also update fennel by alternative name
  const { data: fennelCheck } = await supabase.from('leaves').select('id, name->>en').eq('name->>en', 'Fennel leaves');
  console.log('  Fennel lookup:', JSON.stringify(fennelCheck));

  // Step 3: Update all 359 recipe records
  console.log('\n=== Step 3: Update recipes table ===');
  const { data: recipes } = await supabase.from('recipes').select('id, title->>en, image_url');
  let updated = 0;
  let skipped = 0;

  for (const recipe of recipes || []) {
    const t = (recipe.en || '').toLowerCase();
    let type = 'other';

    // Match prefix against known leaf types
    if (t.startsWith('onion')) type = 'onion';
    else if (t.startsWith('beetroot')) type = 'beetroot';
    else if (t.startsWith('carrot')) type = 'carrot';
    else if (t.startsWith('fennel')) type = 'fennel';
    else if (t.startsWith('kohlrabi')) type = 'kohlrabi';
    else if (t.startsWith('leek')) type = 'leek';
    else if (t.startsWith('radish')) type = 'radish';
    else if (t.startsWith('turnip')) type = 'turnip';
    else if (t.startsWith('artichoke')) type = 'artichoke';
    else type = 'onion'; // fallback: "stuffed msemen" etc are onion-based

    const url = LEAF_IMAGE_URLS[type];
    if (!url) { skipped++; continue; }

    if (recipe.image_url === url) { skipped++; continue; }

    const { error } = await supabase.from('recipes').update({ image_url: url }).eq('id', recipe.id);
    if (error) {
      console.error(`  Failed for ${recipe.en?.slice(0, 50)}: ${error.message}`);
    } else {
      updated++;
      if (updated % 50 === 0) console.log(`  ${updated} recipes updated...`);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Recipes updated: ${updated}`);
  console.log(`Recipes skipped: ${skipped}`);

  // Print leaf image URLs
  console.log('\n=== Leaf Image URLs ===');
  for (const [type, url] of Object.entries(LEAF_IMAGE_URLS)) {
    console.log(`${type}: ${url}`);
  }
}

main().catch(console.error);
