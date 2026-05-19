import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Species normalization ──────────────────────────────────────
// Maps raw Excel species strings to clean short names + emojis
const SPECIES_MAP = {
  // Full Latin names
  'Allium cepa (Oignon)':      { fr: 'Oignon',    en: 'Onion',       ar: 'البصل',    emoji: '🧅' },
  'Beta vulgaris (Betterave)':  { fr: 'Betterave',  en: 'Beetroot',    ar: 'الشمندر',   emoji: '🥬' },
  'Raphanus sativus (Radis)':   { fr: 'Radis',      en: 'Radish',      ar: 'الفجل',    emoji: '🌱' },
  'Foeniculum vulgare (Fenouil)':{ fr: 'Fenouil',   en: 'Fennel',      ar: 'الشمر',    emoji: '🌿' },
  'Brassica rapa (Navet)':      { fr: 'Navet',      en: 'Turnip',      ar: 'اللفت',    emoji: '🥕' },
  'Daucus carota (Carotte)':    { fr: 'Carotte',    en: 'Carrot',      ar: 'الجزر',    emoji: '🥕' },
  'Cynara scolymus (Artichaut)':{ fr: 'Artichaut',  en: 'Artichoke',   ar: 'الخرشوف',  emoji: '🌺' },
  'Brassica oleracea (Chou-rave)':{ fr: 'Chou-rave', en: 'Kohlrabi',   ar: 'الكرنب',   emoji: '🥦' },
  'Allium porrum (Poireau)':    { fr: 'Poireau',    en: 'Leek',        ar: 'الكراث',   emoji: '🧅' },
  // Short names (some respondents used abbreviated forms)
  'Oignon':    { fr: 'Oignon',    en: 'Onion',     ar: 'البصل',   emoji: '🧅' },
  'Betterave': { fr: 'Betterave', en: 'Beetroot',  ar: 'الشمندر',  emoji: '🥬' },
  'Radis':     { fr: 'Radis',     en: 'Radish',    ar: 'الفجل',   emoji: '🌱' },
  'Fenouil':   { fr: 'Fenouil',   en: 'Fennel',    ar: 'الشمر',   emoji: '🌿' },
  'Navet':     { fr: 'Navet',     en: 'Turnip',    ar: 'اللفت',   emoji: '🥕' },
  'Carotte':   { fr: 'Carotte',   en: 'Carrot',    ar: 'الجزر',   emoji: '🥕' },
  'Artichaut': { fr: 'Artichaut', en: 'Artichoke', ar: 'الخرشوف', emoji: '🌺' },
  'Chou-rave': { fr: 'Chou-rave', en: 'Kohlrabi',  ar: 'الكرنب',  emoji: '🥦' },
  'Poireau':   { fr: 'Poireau',   en: 'Leek',      ar: 'الكراث',  emoji: '🧅' },
};

function normalizeSpecies(raw) {
  if (!raw) return { fr: 'Inconnu', en: 'Unknown', ar: 'غير معروف', emoji: '🌿' };
  // Try exact match
  if (SPECIES_MAP[raw]) return SPECIES_MAP[raw];
  // Try partial match
  for (const [key, val] of Object.entries(SPECIES_MAP)) {
    if (raw.includes(key) || key.includes(raw)) return val;
  }
  // Fallback: use raw string
  return { fr: raw, en: raw, ar: raw, emoji: '🌿' };
}

// ── Title generation ───────────────────────────────────────────
// Create a descriptive recipe title from the preparation method + species
function generateTitle(preparation, species) {
  const sp = normalizeSpecies(species);
  
  // Truncate long preparation methods to create a reasonable title
  let prepSnippet = preparation || '';
  // Take the first sentence or first 60 chars
  const firstSentence = prepSnippet.split(/[.!;:]/).filter(Boolean)[0]?.trim() || prepSnippet;
  const titleBase = firstSentence.length > 80 
    ? firstSentence.substring(0, 77) + '...' 
    : firstSentence;
  
  return {
    fr: `${titleBase} — Feuilles de ${sp.fr}`,
    en: `${sp.en} Leaves — ${titleBase}`,
    ar: `أوراق ${sp.ar} — ${titleBase}`
  };
}

// ── Main ───────────────────────────────────────────────────────
async function cleanAndReupload() {
  const dataPath = path.join(__dirname, 'extracted_recipes.json');
  if (!fs.existsSync(dataPath)) {
    console.error("extracted_recipes.json not found!");
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  // Filter out header/garbage rows
  const validRows = rawData.filter(row => {
    const species = row['Espèce'] || '';
    const method = row['Recette ou méthode de préparation'] || '';
    // Skip rows where species is literally "Espèce" (header row) or empty
    if (!species || species === 'Espèce' || species === 'Espèce utilisée') return false;
    if (!method || method.length < 5) return false;
    return true;
  });

  console.log(`Valid recipes after filtering: ${validRows.length} / ${rawData.length}`);

  // ── Step 1: Delete old survey recipes ──
  console.log('Deleting old survey recipes...');
  const { error: delError, count } = await supabase
    .from('recipes')
    .delete()
    .eq('origin', 'survey');
  
  if (delError) {
    console.error('Delete failed:', delError);
    process.exit(1);
  }
  console.log(`Deleted old survey recipes.`);

  // ── Step 2: Build properly formatted recipes ──
  const recipes = validRows.map(row => {
    const respondent = row['Répondant'] || 'Anonymous';
    const species = row['Espèce'] || '';
    const method = row['Recette ou méthode de préparation'] || '';
    const sp = normalizeSpecies(species);
    const title = generateTitle(method, species);

    return {
      title,
      ingredients: {
        fr: [`Feuilles de ${sp.fr}`],
        en: [`${sp.en} leaves`],
        ar: [`أوراق ${sp.ar}`]
      },
      steps: {
        fr: [method],
        en: [method],  // Original is French — keeping as-is for now
        ar: [method]
      },
      nutrition: {
        proteins_g: 0,
        fats_g: 0,
        ash_g: 0,
        moisture_percent: 0,
        polyphenols_mg: 0,
        flavonoids_mg: 0,
        antioxidant_score: 'N/A'
      },
      origin: 'survey',
      sources: [`Survey respondent: ${respondent}`],
      dietary_tags: ['leaf-based'],
    };
  });

  // ── Step 3: Batch insert (in chunks of 50 to avoid payload limits) ──
  const BATCH_SIZE = 50;
  let inserted = 0;
  
  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('recipes')
      .insert(batch)
      .select('id');
    
    if (error) {
      console.error(`Batch ${i}-${i + batch.length} failed:`, error);
    } else {
      inserted += data.length;
      console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${data.length} recipes (total: ${inserted})`);
    }
  }

  console.log(`\n✅ Done! Inserted ${inserted} properly formatted recipes.`);
  
  // ── Step 4: Verify sample ──
  const { data: sample } = await supabase
    .from('recipes')
    .select('title, origin, sources')
    .eq('origin', 'survey')
    .limit(3);
  
  console.log('\nSample of new recipes:');
  sample?.forEach(r => {
    console.log(`  📖 ${r.title?.fr}`);
    console.log(`     ${r.sources?.[0]}`);
  });
}

cleanAndReupload();
