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

mkdirSync(TMP_DIR, { recursive: true });
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const images = [
  { type: 'onion', slug: 'onion-leaves', url: 'https://c.pxhere.com/photos/27/07/green_onion_spring_onions_vegetables-1078863.jpg!d' },
  { type: 'fennel', slug: 'fennel-leaves', url: 'https://c.pxhere.com/photos/64/28/fennel_vegetables_healthy_frisch_tuber_food_eat-772544.jpg!d' },
];

async function download(url, filepath, label) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  writeFileSync(filepath, buf);
  console.log(`  Downloaded (${(buf.length / 1024).toFixed(0)}KB)`);
}

function convertToWebp(input, output) {
  execSync(`convert "${input}" -resize ${MAX_WIDTH}x${MAX_WIDTH} -quality ${QUALITY} -strip "${output}"`, { stdio: 'pipe' });
  const stats = readFileSync(output);
  console.log(`  Converted to webp (${(stats.length / 1024).toFixed(0)}KB)`);
}

async function upload(filepath, storagePath) {
  const buf = readFileSync(filepath);
  const { error } = await supabase.storage.from('content').upload(storagePath, buf, {
    contentType: 'image/webp', upsert: true, cacheControl: '31536000'
  });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('content').getPublicUrl(storagePath);
  return publicUrl;
}

async function main() {
  const urls = {};

  // Step 1: Upload onion and fennel leaf images
  console.log('=== Uploading leaf images ===');
  for (const item of images) {
    console.log(`\n[${item.type}]`);
    const origPath = resolve(TMP_DIR, `${item.slug}_original`);
    const webpPath = resolve(TMP_DIR, `${item.slug}.webp`);
    const storagePath = `leaves/${item.slug}.webp`;

    try {
      await download(item.url, origPath, item.type);
      convertToWebp(origPath, webpPath);
      const publicUrl = await upload(webpPath, storagePath);
      urls[item.type] = publicUrl;
      console.log(`  Uploaded: ${publicUrl}`);
      unlinkSync(origPath);
      unlinkSync(webpPath);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
    }
  }

  // Step 2: Update leaves table
  console.log('\n=== Updating leaves table ===');
  for (const [type, url] of Object.entries(urls)) {
    const { data: leaf } = await supabase.from('leaves').select('id').ilike('name->>en', `${type}%`);
    if (leaf && leaf.length > 0) {
      const { error } = await supabase.from('leaves').update({ image_url: url }).eq('id', leaf[0].id);
      if (error) console.error(`  DB update failed for ${type}: ${error.message}`);
      else console.log(`  Updated ${type} leaves`);
    }
  }

  // Step 3: Update recipes without images (onion and fennel types)
  console.log('\n=== Updating remaining recipes ===');
  const allUrls = {
    onion: urls.onion || 'https://oqogytrxruwxrlzfgwbt.supabase.co/storage/v1/object/public/content/leaves/onion-leaves.webp',
    fennel: urls.fennel || 'https://oqogytrxruwxrlzfgwbt.supabase.co/storage/v1/object/public/content/leaves/fennel-leaves.webp',
  };

  for (const [type, url] of Object.entries(allUrls)) {
    const { data: recipes } = await supabase
      .from('recipes')
      .select('id, title->>en')
      .ilike('title->>en', `${type}%`)
      .is('image_url', null);

    for (const recipe of recipes || []) {
      await supabase.from('recipes').update({ image_url: url }).eq('id', recipe.id);
    }
    console.log(`  Updated ${recipes?.length || 0} ${type} recipes`);
  }

  // Also handle "stuffed msemen" etc (onion-based, title doesn't start with "onion")
  const { data: otherOnion } = await supabase
    .from('recipes')
    .select('id, title->>en')
    .in('title->>en', [
      'Stuffed Msemen with Onion Leaves',
      'Barley Flatbread with Onion Leaves',
      'Omelette with Onion Leaves',
      'Powdered Dried Onion Leaves'
    ])
    .is('image_url', null);

  for (const recipe of otherOnion || []) {
    await supabase.from('recipes').update({ image_url: allUrls.onion }).eq('id', recipe.id);
  }
  console.log(`  Updated ${otherOnion?.length || 0} other onion-based recipes`);

  console.log('\n=== DONE ===');
  console.log('Leaf image URLs:');
  for (const [type, url] of Object.entries(allUrls)) {
    console.log(`  ${type}: ${url}`);
  }
}

main().catch(console.error);
