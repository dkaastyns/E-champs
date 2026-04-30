ALTER TABLE tournament_matches ADD COLUMN IF NOT EXISTS display_id UUID DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_matches_display ON tournament_matches(category_id, display_id);

UPDATE tournament_matches SET display_id = gen_random_uuid() WHERE display_id IS NULL;

ALTER TABLE tournament_matches 
DROP CONSTRAINT IF EXISTS unique_display_per_category;

ALTER TABLE tournament_matches 
ADD CONSTRAINT unique_display_per_category 
UNIQUE (category_id, display_id);
