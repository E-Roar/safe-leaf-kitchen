-- ==========================================
-- SafeLeafKitchen Permissions Fix Script
-- ==========================================

-- 1. Ensure 'content' bucket exists and is public
insert into storage.buckets (id, name, public)
values ('content', 'content', true)
on conflict (id) do update
set public = true;

-- 2. Drop existing conflicting policies to ensure a clean state
drop policy if exists "Authenticated Upload Content" on storage.objects;
drop policy if exists "Public Upload Content" on storage.objects;
drop policy if exists "Public Read Content" on storage.objects;
drop policy if exists "Public Update Content" on storage.objects;
drop policy if exists "Public Delete Content" on storage.objects;

-- 3. Create Permissive Policies for the 'content' bucket
-- These allow ANYONE to read/write to the 'content' bucket.
-- REQUIRED because our Admin UI currently simulates auth client-side.

-- Allow Public Read
create policy "Public Read Content"
on storage.objects for select
using ( bucket_id = 'content' );

-- Allow Public Insert (Upload)
create policy "Public Upload Content"
on storage.objects for insert
with check ( bucket_id = 'content' );

-- Allow Public Update
create policy "Public Update Content"
on storage.objects for update
using ( bucket_id = 'content' );

-- Allow Public Delete
create policy "Public Delete Content"
on storage.objects for delete
using ( bucket_id = 'content' );

-- 4. Grant Admin Role to 'doc.jamila' (for potential future Row Level Security)
update auth.users
set raw_app_meta_data = 
  case 
    when raw_app_meta_data is null then '{"role": "admin"}'::jsonb
    else jsonb_set(raw_app_meta_data, '{role}', '"admin"')
  end
where email = 'doc.jamila@admin2026.slk';
