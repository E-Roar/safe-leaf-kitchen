-- Allow PDF uploads to content bucket (if not already allowed)
-- Reuse 'content' bucket but ensure mime-types include application/pdf

BEGIN;

-- Update the storage allowed_mime_types if restricted (usually it's * or list)
-- For Supabase Storage, permissions are Policy based. 
-- We assume the 'content' bucket exists.

-- 1. Ensure 'content' bucket is public and allows PDFs
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('content', 'content', true, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'])
ON CONFLICT (id) DO UPDATE
SET allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];

-- 2. Ensure Authenticated Admins can upload to booklets/ folder
CREATE POLICY "Admin Upload Booklets" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'content' AND (storage.foldername(name))[1] = 'booklets');

-- 3. Ensure Public can download/read booklets
CREATE POLICY "Public Read Booklets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'content');

COMMIT;
