import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ingredientKeywords = [
  'huile d\'olive', 'huile', 'ail', 'oignon', 'citron', 'sel', 'poivre', 'cumin',
  'paprika', 'coriandre', 'persil', 'curcuma', 'cannelle', 'gingembre', 'menthe',
  'tomate', 'tomates', 'pommes de terre', 'carottes', 'carotte', 'pois chiches',
  'lentilles', 'riz', 'semoule', 'farine', 'œufs', 'œuf', 'beurre', 'fromage',
  'viande', 'poulet', 'bœuf', 'agneau', 'poisson', 'sardines', 'olives', 'khlii',
  'miel', 'sucre', 'levure', 'lait', 'crème', 'pain', 'vermicelles', 'pâtes',
  'courgettes', 'navet', 'betterave', 'radis', 'fenouil', 'carotte', 'chou',
  'épices', 'cheese', 'légumes', 'bouillon', 'eau', 'poivrons', 'raisins'
];

function parseIngredients(fullText) {
  const lowerText = fullText.toLowerCase();
  const found = ingredientKeywords.filter(k => lowerText.includes(k));
  const fr = found.map(k => k.charAt(0).toUpperCase() + k.slice(1)).map(k => {
    if (k === 'Huile d\'olive') return 'Huile d\'olive';
    if (k === 'Ail') return 'Ail';
    if (k === 'Oignon') return 'Oignon';
    if (k === 'Citron') return 'Citron confit ou jus de citron';
    return k;
  });
  return {
    fr: fr.length > 0 ? [...new Set(fr)] : ['Feuilles'],
    en: fr.length > 0 ? [...new Set(fr.map(() => 'See preparation'))] : ['See preparation'],
    ar: fr.length > 0 ? [...new Set(fr.map(() => 'انظر التحضير'))] : ['انظر التحضير']
  };
}

function parseSteps(fullText) {
  const sentences = fullText
    .replace(/\.\.\./g, '.')
    .split(/[.;]/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
  return {
    fr: sentences.length > 0 ? sentences : [fullText],
    en: sentences.length > 0 ? sentences : [fullText],
    ar: sentences.map(() => 'انظر التحضير بالفرنسية')
  };
}

const fixMappings = [
  {
    titleMatch: 'Galette farcie au poireau',
    col3: 'Galette farcie au poireau',
    col5: 'Pain roulé farci de poireau sauté aux épices.'
  },
  {
    titleMatch: 'Bakoula rouge soussi',
    col3: 'Bakoula rouge soussi',
    col5: 'Feuilles sautées avec huile d\'argan, ail, cumin et olives rouges.'
  },
  {
    titleMatch: 'Feuilles bouillies et servies avec vinaigrette citronnée',
    col3: 'Feuilles bouillies et servies avec vinaigrette citronnée.',
    col5: ''
  },
  {
    titleMatch: 'Omelette aux feuilles d\u2019oignon',
    col3: 'Omelette aux feuilles d\u2019oignon',
    col5: 'Feuilles fraîches hachées intégrées à des œufs battus et cuites à la poêle.'
  },
  {
    titleMatch: 'Bakoula aux feuilles de betterave',
    col3: 'Bakoula aux feuilles de betterave',
    col5: 'Feuilles bouillies puis sautées avec ail, citron, olives noires, cumin et huile d\'olive.'
  },
  {
    titleMatch: 'Tajine aux feuilles d\u2019oignon',
    col3: 'Tajine aux feuilles d\u2019oignon',
    col5: 'Feuilles coupées finement, revenues avec oignons, tomates et épices, puis mijotées avec viande.'
  },
  {
    titleMatch: 'Rghaïf farci aux feuilles',
    col3: 'Rghaïf farci aux feuilles',
    col5: 'Pain farci aux feuilles de carottes et poivrons.'
  },
  {
    titleMatch: 'Rghaïf printanier',
    col3: 'Rghaïf printanier',
    col5: 'Feuilles sautées et intégrées à une pâte roulée puis cuite.'
  }
];

async function main() {
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, title')
    .eq('origin', 'survey');

  let fixed = 0;
  let errors = 0;

  for (const recipe of recipes) {
    const title = recipe.title?.en || recipe.title?.fr || '';
    const excerpt = title.includes(' — ') ? title.split(' — ').slice(1).join(' — ') : title;

    const mapping = fixMappings.find(m => excerpt === m.titleMatch);
    if (!mapping) continue;

    const fullText = mapping.col5 || mapping.col3;
    const ingredients = parseIngredients(fullText);
    const steps = parseSteps(fullText);

    const { error } = await supabase
      .from('recipes')
      .update({ origin: 'admin', ingredients, steps })
      .eq('id', recipe.id);

    if (error) {
      console.log(`ERROR: ${excerpt}: ${error.message}`);
      errors++;
    } else {
      console.log(`FIXED: ${excerpt}`);
      fixed++;
    }
  }

  console.log(`\nDone: ${fixed} fixed, ${errors} errors`);
}

main().catch(console.error);
