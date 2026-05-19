import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadRecipes() {
  try {
    const dataPath = path.join(__dirname, 'extracted_recipes.json');
    if (!fs.existsSync(dataPath)) {
      console.error("extracted_recipes.json not found! Run the extraction script first.");
      return;
    }
    
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    console.log(`Found ${rawData.length} recipes. Uploading to Supabase recipes table...`);
    
    // Transform data to match the official recipes table
    const mappedData = rawData.map(row => {
      const respondent = row['Répondant'] || 'Unknown';
      const species = row['Espèce'] || 'Unknown';
      const method = row['Recette ou méthode de préparation'] || 'Unknown';
      
      return {
        title: {
          en: `Recipe by ${respondent} (${species})`,
          fr: `Recette par ${respondent} (${species})`,
          ar: `وصفة بواسطة ${respondent} (${species})`
        },
        ingredients: {
          en: [species],
          fr: [species],
          ar: [species]
        },
        steps: {
          en: [method],
          fr: [method],
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
        sources: [`Respondent: ${respondent}`]
      };
    });
    
    // Batch insert
    const { data, error } = await supabase
      .from('recipes')
      .insert(mappedData)
      .select();
      
    if (error) {
      console.error("Error inserting data:", error);
    } else {
      console.log(`Successfully inserted ${data.length} recipes!`);
    }
    
  } catch (err) {
    console.error("Upload failed:", err);
  }
}

uploadRecipes();
