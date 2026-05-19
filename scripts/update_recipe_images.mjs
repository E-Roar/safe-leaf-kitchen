import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USED_URLS = new Set();

const LEAF_TYPES = ['onion','beetroot','radish','fennel','turnip','carrot','artichoke','kohlrabi','leek','garlic'];
const FR_CATS = {oignon:'onion',betterave:'beetroot',radis:'radish',fenouil:'fennel',navet:'turnip',carotte:'carrot',artichaut:'artichoke','chou-rave':'kohlrabi',poireau:'leek',ail:'garlic'};

const FOOD_QUERIES = {
  onion: ['onion soup','onion salad','onion food','onions','onion vegetable'],
  beetroot: ['beetroot salad','beet soup','beetroot food','beet','beetroot vegetable'],
  radish: ['radish salad','radish food','radish','radish vegetable'],
  fennel: ['fennel salad','fennel soup','fennel food','fennel','fennel vegetable'],
  turnip: ['turnip stew','turnip food','turnip greens','turnip','turnip vegetable'],
  carrot: ['carrot soup','carrot salad','carrot food','carrot','carrot vegetable'],
  artichoke: ['artichoke food','artichoke salad','artichoke','artichoke vegetable'],
  kohlrabi: ['kohlrabi food','kohlrabi','kohlrabi vegetable','kohlrabi leaves'],
  leek: ['leek soup','leek salad','leek food','leek','leek vegetable'],
  garlic: ['garlic food','garlic','garlic vegetable'],
};

function getLeafType(title) {
  const lower = (title || '').toLowerCase();
  for (const lt of LEAF_TYPES) { if (lower.includes(lt)) return lt; }
  for (const [fr, en] of Object.entries(FR_CATS)) { if (lower.includes(fr)) return en; }
  return null;
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

async function findImage(leafType) {
  const queries = FOOD_QUERIES[leafType] || [leafType, `${leafType} food`, `${leafType} vegetable`];

  for (const q of queries) {
    process.stdout.write(`  q="${q}"... `);
    const url = await searchFreeImages(q);
    if (url) { console.log(`OK`); return url; }
    console.log(`-`);
    await sleep(300 + Math.random() * 300);
  }
  return null;
}

async function main() {
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, title');

  console.log(`Processing ${recipes?.length || 0} recipes...`);

  let found = 0;
  let failed = 0;

  for (let i = 0; i < (recipes?.length || 0); i++) {
    const recipe = recipes[i];
    const title = recipe.title?.en || recipe.title?.fr || '';
    const progress = `[${i + 1}/${recipes.length}]`;

    if (!title) { continue; }

    const leafType = getLeafType(title);
    if (!leafType) { continue; }

    process.stdout.write(`${progress} "${leafType}: ${title.slice(0, 35)}" `);

    const imgUrl = await findImage(leafType);

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
  console.log(`Updated: ${found}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
