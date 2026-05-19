ALTER TABLE recipes ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category TEXT;

UPDATE recipes SET published = false WHERE published IS NULL;
