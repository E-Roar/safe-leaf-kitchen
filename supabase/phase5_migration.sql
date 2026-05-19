-- Phase 5 Migration: Analytics, Metadata & History
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. APP_EVENTS TABLE (Anonymous Analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- 'scan', 'leaf_view', 'recipe_view', 'recipe_use', 'chat_message'
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_app_events_type_date ON app_events(event_type, created_at DESC);

-- RLS: Public can insert (anonymous tracking), Admin can read
ALTER TABLE app_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon insert" ON app_events;
CREATE POLICY "Allow anon insert" ON app_events FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read" ON app_events;
CREATE POLICY "Allow authenticated read" ON app_events FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 2. LEAVES TABLE ENHANCEMENTS (Scientific Metadata)
-- ============================================================
ALTER TABLE leaves
ADD COLUMN IF NOT EXISTS scientific_name TEXT,
ADD COLUMN IF NOT EXISTS family TEXT,
ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]', -- [{ "title": "...", "url": "...", "doi": "..." }]
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add foreign key if not exists (safe approach)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leaves_created_by_fkey'
    ) THEN
        ALTER TABLE leaves ADD CONSTRAINT leaves_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- 3. RECIPES TABLE ENHANCEMENTS (Metadata)
-- ============================================================
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS dietary_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add foreign key if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'recipes_created_by_fkey'
    ) THEN
        ALTER TABLE recipes ADD CONSTRAINT recipes_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- 4. CONTENT_HISTORY TABLE (Change Tracking / Audit Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL, -- 'leaves' or 'recipes'
    record_id UUID NOT NULL,
    changed_by UUID,
    change_type TEXT NOT NULL, -- 'create', 'update', 'delete'
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_content_history_record ON content_history(table_name, record_id, created_at DESC);

-- RLS: Only authenticated users can read history
ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read history" ON content_history;
CREATE POLICY "Authenticated read history" ON content_history FOR SELECT TO authenticated USING (true);

-- Allow service_role to insert (Edge Functions)
DROP POLICY IF EXISTS "Service role insert history" ON content_history;
CREATE POLICY "Service role insert history" ON content_history FOR INSERT TO service_role WITH CHECK (true);

-- ============================================================
-- 5. AUTOMATIC updated_at TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for leaves
DROP TRIGGER IF EXISTS set_leaves_updated_at ON leaves;
CREATE TRIGGER set_leaves_updated_at
    BEFORE UPDATE ON leaves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for recipes
DROP TRIGGER IF EXISTS set_recipes_updated_at ON recipes;
CREATE TRIGGER set_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DONE: Verify by checking table structures
-- ============================================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leaves';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'recipes';
-- SELECT * FROM app_events LIMIT 5;
-- SELECT * FROM content_history LIMIT 5;
