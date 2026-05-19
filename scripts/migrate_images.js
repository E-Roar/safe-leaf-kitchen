import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY; // Using Anon Key, hoping for open storage policies

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

// Slugify helper to match the frontend logic
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
}

async function migrateLeaves() {
    console.log('\n🍃 Migrating Leaves...');
    const { data: leaves, error } = await supabase.from('leaves').select('*');

    if (error) {
        console.error('Error fetching leaves:', error);
        return;
    }

    for (const leaf of leaves) {
        const slug = slugify(leaf.name.en);
        const localDir = path.join(PUBLIC_DIR, 'images', 'leaves', slug);

        if (!fs.existsSync(localDir)) {
            console.log(`⚠️  No local folder for: ${leaf.name.en} (checked: ${localDir})`);
            continue;
        }

        const files = fs.readdirSync(localDir).filter(f => f.match(/\.(png|jpg|jpeg|webp)$/i));
        if (files.length === 0) continue;

        console.log(`Processing ${leaf.name.en} (${files.length} images)...`);

        const galleryUrls = leaf.gallery_images || [];
        let mainImageUrl = leaf.image_url;
        let updated = false;

        // Sort files to keep order 1.png, 2.png
        files.sort((a, b) => parseInt(a) - parseInt(b));

        for (const file of files) {
            const filePath = path.join(localDir, file);
            const fileBuffer = fs.readFileSync(filePath);
            const storagePath = `leaves/${slug}/${file}`;

            // Upload
            const { error: uploadError } = await supabase.storage
                .from('content')
                .upload(storagePath, fileBuffer, { upsert: true });

            if (uploadError) {
                console.error(`   ❌ Failed to upload ${file}:`, uploadError.message);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('content')
                .getPublicUrl(storagePath);

            console.log(`   ✅ Uploaded: ${file} -> ${publicUrl}`);

            // Logic: If main image is missing or looks like a local path (starts with /), replace it
            if (!mainImageUrl || mainImageUrl.startsWith('/')) {
                mainImageUrl = publicUrl;
                updated = true;
            }

            // Add to gallery if not present
            if (!galleryUrls.includes(publicUrl)) {
                galleryUrls.push(publicUrl);
                updated = true;
            }
        }

        if (updated) {
            const { error: updateError } = await supabase
                .from('leaves')
                .update({
                    image_url: mainImageUrl,
                    gallery_images: galleryUrls
                })
                .eq('id', leaf.id);

            if (updateError) console.error(`   ❌ DB Update failed:`, updateError.message);
            else console.log(`   ✨ DB Updated!`);
        }
    }
}

async function migrateRecipes() {
    console.log('\n🍲 Migrating Recipes...');
    const { data: recipes, error } = await supabase.from('recipes').select('*');

    if (error) {
        console.error('Error fetching recipes:', error);
        return;
    }

    for (const recipe of recipes) {
        const slug = slugify(recipe.title.en);
        const localDir = path.join(PUBLIC_DIR, 'images', 'recipes', slug);

        if (!fs.existsSync(localDir)) {
            console.log(`⚠️  No local folder for: ${recipe.title.en}`);
            continue;
        }

        const files = fs.readdirSync(localDir).filter(f => f.match(/\.(png|jpg|jpeg|webp)$/i));
        if (files.length === 0) continue;

        console.log(`Processing ${recipe.title.en} (${files.length} images)...`);

        const galleryUrls = recipe.gallery_images || [];
        let mainImageUrl = recipe.image_url;
        let updated = false;

        files.sort((a, b) => parseInt(a) - parseInt(b));

        for (const file of files) {
            const filePath = path.join(localDir, file);
            const fileBuffer = fs.readFileSync(filePath);
            const storagePath = `recipes/${slug}/${file}`;

            const { error: uploadError } = await supabase.storage
                .from('content')
                .upload(storagePath, fileBuffer, { upsert: true });

            if (uploadError) {
                console.error(`   ❌ Failed to upload ${file}:`, uploadError.message);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('content')
                .getPublicUrl(storagePath);

            if (!mainImageUrl || mainImageUrl.startsWith('/')) {
                mainImageUrl = publicUrl;
                updated = true;
            }

            if (!galleryUrls.includes(publicUrl)) {
                galleryUrls.push(publicUrl);
                updated = true;
            }
        }

        if (updated) {
            const { error: updateError } = await supabase
                .from('recipes')
                .update({
                    image_url: mainImageUrl,
                    gallery_images: galleryUrls
                })
                .eq('id', recipe.id);

            if (updateError) console.error(`   ❌ DB Update failed:`, updateError.message);
            else console.log(`   ✨ DB Updated!`);
        }
    }
}

async function main() {
    console.log('🚀 Starting Migration...');
    await migrateLeaves();
    await migrateRecipes();
    console.log('\n🏁 Migration Complete.');
}

main();
