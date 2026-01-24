-- Create Leaves Table
-- Stores comprehensive information about leaves, corresponding to src/data/leaves.ts
create table if not exists leaves (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null, -- Stores { "en": "...", "fr": "..." }
  aliases text[],
  highlights jsonb, -- Stores key-value pairs for nutritional highlights
  compounds text[],
  safety text,
  summary text,
  image_url text, -- URL to Supabase Storage 'scans' or new 'content' bucket
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create Recipes Table
-- Stores recipes linked to leaves, corresponding to src/data/recipes.ts
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  leaf_id uuid references leaves(id), -- Optional link to a specific leaf
  title jsonb not null, -- { "en": "...", "fr": "...", "ar": "..." }
  ingredients jsonb, -- { "en": [], "fr": [], "ar": [] }
  steps jsonb, -- { "en": [], "fr": [], "ar": [] }
  nutrition jsonb, -- Structured nutrition data
  image_url text, -- URL to Supabase Storage
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS (Row Level Security)
alter table leaves enable row level security;
alter table recipes enable row level security;

-- Policies for Leaves
-- Everyone can read leaves
create policy "Public read access for leaves" 
on leaves for select 
using (true);

-- Authenticated users (Admin) can insert/update/delete
-- Note: In a production app, checking for an 'admin' role would be better.
-- For this prototype where we use local password 'hidachi', we will rely on client-side restricted UI
-- OR temporarily allow anon writes if using a custom header logic, but best practice is:
create policy "Authenticated users can manage leaves"
on leaves for all
using (auth.role() = 'authenticated');

-- Policies for Recipes
-- Everyone can read recipes
create policy "Public read access for recipes" 
on recipes for select 
using (true);

create policy "Authenticated users can manage recipes"
on recipes for all
using (auth.role() = 'authenticated');

-- Create New Storage Bucket for Content (Leaves/Recipes images)
insert into storage.buckets (id, name, public)
values ('content', 'content', true) -- Public bucket for serving images
on conflict (id) do nothing;

-- Storage Policies for 'content' bucket
-- Public read
create policy "Public Read Content"
on storage.objects for select
using ( bucket_id = 'content' );

-- Auth upload
create policy "Authenticated Upload Content"
on storage.objects for insert
with check ( bucket_id = 'content' and auth.role() = 'authenticated' );

-- NOTE: To enable the Admin Dashboard to write to these tables without a full Auth implementation,
-- we will use Supabase Access Tokens or rely on our custom Edge Function 'manage-content'.
