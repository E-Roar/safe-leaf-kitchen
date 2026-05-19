import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USED_URLS = new Set();

const LEAF_TYPES = ['onion', 'beetroot', 'radish', 'fennel', 'turnip', 'carrot', 'artichoke', 'kohlrabi', 'leek', 'garlic'];
const FR_CATS = { oignon:'onion', betterave:'beetroot', radis:'radish', fenouil:'fennel',
  navet:'turnip', carotte:'carrot', artichaut:'artichoke', 'chou-rave':'kohlrabi', poireau:'leek', ail:'garlic' };

const STOP_WORDS = new Set(['the','and','for','with','from','that','this','are','was','were','had','has','have','not','but','all','can','une','des','les','dans','sur','pour','avec','est','sont','fait','plus','très','bien','jusqu']);

function getLeafType(title) {
  const lower = (title || '').toLowerCase();
  for (const lt of LEAF_TYPES) { if (lower.includes(lt)) return lt; }
  for (const [fr, en] of Object.entries(FR_CATS)) { if (lower.includes(fr)) return en; }
  return null;
}

function extractKeywords(title, leafType) {
  const lower = (title || '').toLowerCase();
  const withoutLeaf = lower
    .replace(new RegExp(`^${leafType}\\s+leaves?\\s*[—–-]?\\s*`, 'i'), '')
    .replace(new RegExp(`^${leafType}\\s+`, 'i'), '')
    .replace(/[^a-z0-9\sàâäéèêëîïôöùûü]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = withoutLeaf.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  return words.slice(0, 3);
}

function buildQueries(title, leafType) {
  const keywords = extractKeywords(title, leafType);
  const queries = [];

  if (keywords.length > 0) {
    queries.push(keywords.join(' '));
    queries.push([leafType, ...keywords].join(' '));
    queries.push(`${leafType} leaves ${keywords[0]}`);
  }

  queries.push(`${leafType} leaves food`);
  queries.push(`${leafType} leaves recipe`);
  queries.push(`${leafType} food`);
  queries.push(`${leafType} vegetable`);
  queries.push(`${leafType} leaves`);
  queries.push(leafType);

  return [...new Set(queries)];
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function searchFreeImages(query) {
  const url = `https://free-images.com/search/?q=${encodeURIComponent(query)}`;
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return null;
    const html = await resp.text();
    const matches = [...html.matchAll(/src="\/sm\/([^"]+\.jpg)"/g)];
    for (const m of matches) {
      const fullUrl = `https://free-images.com/lg/${m[1]}`;
      if (!USED_URLS.has(fullUrl)) {
        USED_URLS.add(fullUrl);
        return fullUrl;
      }
    }
  } catch {}
  return null;
}

async function findImageForRecipe(title, leafType) {
  const queries = buildQueries(title, leafType);
  const tried = new Set();

  for (const q of queries) {
    if (tried.has(q)) continue;
    tried.add(q);
    process.stdout.write(`  query="${q.slice(0, 55)}"... `);
    const url = await searchFreeImages(q);
    if (url) {
      console.log(`OK`);
      return url;
    }
    console.log(`-`);
    await sleep(300 + Math.random() * 300);
  }
  return null;
}

async function main() {
  const { data: recipes, count } = await supabase
    .from('recipes')
    .select('id, title', { count: 'exact' });

  const total = count || recipes?.length || 0;
  console.log(`Total recipes: ${total}`);

  let found = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < (recipes?.length || 0); i++) {
    const recipe = recipes[i];
    const title = recipe.title?.en || recipe.title?.fr || '';
    const progress = `[${i + 1}/${total}]`;

    if (!title) { skipped++; continue; }

    const { data: existing } = await supabase
      .from('recipes')
      .select('image_url')
      .eq('id', recipe.id)
      .single();

    if (existing?.image_url) {
      console.log(`${progress} "${title.slice(0, 45)}" ALREADY HAS IMAGE`);
      skipped++;
      continue;
    }

    const leafType = getLeafType(title);
    process.stdout.write(`${progress} "${(leafType || '?')}: ${title.slice(0, 40)}" `);

    let imgUrl = null;

    if (leafType) {
      imgUrl = await findImageForRecipe(title, leafType);
    } else {
      process.stdout.write(`no leaf type — `);
      const parts = title.split(/[—–-]/);
      imgUrl = await searchFreeImages(parts[0].trim());
      if (!imgUrl) {
        const words = title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
        for (const w of words) {
          imgUrl = await searchFreeImages(w);
          if (imgUrl) break;
          await sleep(300);
        }
      }
    }

    if (imgUrl) {
      const { error } = await supabase.from('recipes').update({ image_url: imgUrl }).eq('id', recipe.id);
      if (error) {
        console.log(`  → DB ERROR: ${error.message}`);
        failed++;
      } else {
        console.log(`  → OK`);
        found++;
      }
    } else {
      console.log(`  → NO IMAGE`);
      failed++;
    }

    await sleep(500 + Math.random() * 500);
  }

  console.log(`\n=== DONE ===`);
  console.log(`Assigned: ${found}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
}

main().catch(console.error);
