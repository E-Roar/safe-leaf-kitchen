-- Phase 6: Multi-Image Support
-- Run this in Supabase SQL Editor

ALTER TABLE leaves 
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';

-- Verify
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'leaves';
