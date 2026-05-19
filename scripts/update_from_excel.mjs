import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import XLSX from 'xlsx';

import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LEAF_TYPES = ['onion', 'beetroot', 'radish', 'fennel', 'turnip', 'carrot', 'artichoke', 'kohlrabi', 'leek', 'garlic'];
const FR_CATS = { oignon:'onion', betterave:'beetroot', radis:'radish', fenouil:'fennel',
  navet:'turnip', carotte:'carrot', artichaut:'artichoke', 'chou-rave':'kohlrabi', poireau:'leek', ail:'garlic' };
const SPECIES_MAP = {
  'Oignon':'onion', 'Betterave':'beetroot', 'Radis':'radish', 'Fenouil':'fennel',
  'Navet':'turnip', 'Carotte':'carrot', 'Artichaut':'artichoke', 'Chou-rave':'kohlrabi', 'Poireau':'leek'
};

function getLeafType(title) {
  const lower = (title || '').toLowerCase();
  for (const lt of LEAF_TYPES) { if (lower.includes(lt)) return lt; }
  for (const [fr, en] of Object.entries(FR_CATS)) { if (lower.includes(fr)) return en; }
  return 'other';
}

function normalize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[""''«»]/g, '').toLowerCase().trim();
}

function parseExcel() {
  const wb = XLSX.readFile('/home/glitcher/Codebases/safe-leaf-kitchen/les recettes 222.xlsx');
  const ws = wb.Sheets['Feuil1'];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const n = row[0];
    if (n == null || String(n).trim() === '' || String(n) === 'N°') continue;
    const speciesFull = String(row[2] || '');
    const col3 = String(row[3] || '');
    const col5 = String(row[4] || '');
    const col6 = String(row[5] || '');
    const person = String(row[1] || '');

    let lt = 'other';
    for (const [fr, en] of Object.entries(SPECIES_MAP)) {
      if (speciesFull.includes(fr)) { lt = en; break; }
    }

    rows.push({ n: Number(n), person, lt, col3, col5, col6, speciesFull });
  }
  return rows;
}

async function main() {
  const excelRows = parseExcel();
  console.log(`Excel rows: ${excelRows.length}`);

  const { data: dbRecipes } = await supabase
    .from('recipes')
    .select('id, title, origin')
    .order('created_at');

  console.log(`DB recipes: ${dbRecipes.length}`);

  let matched = 0;
  let unmatched = 0;
  let updated = 0;
  let errors = 0;

  // Group Excel rows by leaf type
  const excelByLt = {};
  for (const er of excelRows) {
    if (!excelByLt[er.lt]) excelByLt[er.lt] = [];
    excelByLt[er.lt].push(er);
  }

  const usedExcelRows = new Set();

  for (const recipe of dbRecipes) {
    const title = recipe.title?.en || recipe.title?.fr || '';
    if (!title) continue;

    const lt = getLeafType(title);

    // Skip static recipes (origin already not survey)
    if (recipe.origin !== 'survey') {
      console.log(`SKIP: ${title.slice(0, 40)} (origin=${recipe.origin})`);
      continue;
    }

    // Extract the excerpt after " — "
    const excerpt = title.includes(' — ') ? title.split(' — ').slice(1).join(' — ') : title;
    const excerptNorm = normalize(excerpt);

    // Find best matching Excel row
    const candidates = excelByLt[lt] || [];
    let bestMatch = null;
    let bestScore = 0;

    for (const er of candidates) {
      if (usedExcelRows.has(er.n + ':' + er.lt)) continue;

      const combined = (er.col3 + ' ' + er.col5).trim();
      const combinedNorm = normalize(combined);

      // Check if excerpt is a substring of combined text
      if (combinedNorm.includes(excerptNorm) || excerptNorm.includes(combinedNorm)) {
        const ratio = Math.max(excerptNorm.length / combinedNorm.length, combinedNorm.length / excerptNorm.length);
        if (ratio > bestScore) {
          bestScore = ratio;
          bestMatch = er;
        }
      }
    }

    if (!bestMatch && candidates.length > 0) {
      // Try simpler matching: just check first 30 chars
      for (const er of candidates) {
        if (usedExcelRows.has(er.n + ':' + er.lt)) continue;
        const combined = normalize((er.col3 + ' ' + er.col5).trim());
        const excerptShort = excerptNorm.slice(0, 30);
        if (combined.includes(excerptShort)) {
          bestMatch = er;
          bestScore = 0.5;
          break;
        }
      }
    }

    if (!bestMatch) {
      console.log(`NO MATCH: ${lt}: ${excerpt.slice(0, 50)}`);
      unmatched++;
      continue;
    }

    usedExcelRows.add(bestMatch.n + ':' + bestMatch.lt);
    matched++;

    // Build the full recipe text
    const fullText = bestMatch.col5 ? bestMatch.col5 : bestMatch.col3;

    // Parse text into ingredients (common Moroccan ingredients)
    const ingredientKeywords = [
      'huile d\'olive', 'huile', 'ail', 'oignon', 'citron', 'sel', 'poivre', 'cumin',
      'paprika', 'coriandre', 'persil', 'curcuma', 'cannelle', 'gingembre', 'menthe',
      'tomate', 'tomates', 'pommes de terre', 'carottes', 'carotte', 'pois chiches',
      'lentilles', 'riz', 'semoule', 'farine', 'œufs', 'œuf', 'beurre', 'fromage',
      'viande', 'poulet', 'bœuf', 'agneau', 'poisson', 'sardines', 'olives', 'khlii',
      'miel', 'sucre', 'levure', 'lait', 'crème', 'pain', 'vermicelles', 'pâtes',
      'courgettes', 'navet', 'betterave', 'radis', 'fenouil', 'carotte', 'chou',
      'épices', 'cheese', 'légumes', 'bouillon', 'eau'
    ];

    const lowerText = fullText.toLowerCase();
    const found = ingredientKeywords.filter(k => lowerText.includes(k));

    const ingredients = {
      fr: found.map(k => {
        // Capitalize first letter
        const firstLetter = k.charAt(0).toUpperCase();
        const rest = k.slice(1);
        // Add quantities where possible
        if (k === 'huile d\'olive') return 'Huile d\'olive';
        if (k === 'ail') return 'Ail';
        if (k === 'oignon') return 'Oignon';
        if (k === 'citron') return 'Citron confit ou jus de citron';
        return firstLetter + rest;
      }),
      en: found.map(() => 'See preparation'),
      ar: found.map(() => 'انظر التحضير')
    };

    // If no specific ingredients found, use a generic one
    if (ingredients.fr.length === 0) {
      ingredients.fr = [bestMatch.speciesFull.split('(').pop()?.replace(')', '').trim() + ' leaves'];
    }

    // Split into steps
    const sentences = fullText
      .replace(/\.\.\./g, '.')
      .split(/[.;]/)
      .map(s => s.trim())
      .filter(s => s.length > 5);

    const steps = {
      fr: sentences.length > 0 ? sentences : [fullText],
      en: sentences.length > 0 ? sentences : [fullText],
      ar: sentences.map(() => 'انظر التحضير بالفرنسية')
    };

    // Update DB
    const { error } = await supabase
      .from('recipes')
      .update({
        origin: 'admin',
        ingredients,
        steps,
      })
      .eq('id', recipe.id);

    if (error) {
      console.log(`DB ERROR [${lt}] ${title.slice(0, 40)}: ${error.message}`);
      errors++;
    } else {
      console.log(`OK [${lt}] ${title.slice(0, 40)} -> N°${bestMatch.n} (${bestMatch.person.slice(0, 15)})`);
      updated++;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Matched: ${matched}`);
  console.log(`Updated: ${updated}`);
  console.log(`Unmatched: ${unmatched}`);
  console.log(`Errors: ${errors}`);
  console.log(`Unused Excel rows: ${excelRows.length - usedExcelRows.size}`);
}

main().catch(console.error);
