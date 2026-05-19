ALTER TABLE recipes ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

UPDATE recipes SET published = false WHERE published IS NULL;
