-- Migration 009: Rename competition_categories to tournaments
-- This migration performs a comprehensive rename of the competition_categories table
-- to tournaments, updating all related foreign keys, indexes, and constraints

-- ============================================
-- PART 1: Rename the main table
-- ============================================
ALTER TABLE competition_categories RENAME TO tournaments;

-- ============================================
-- PART 2: Update foreign key constraints on registered_teams
-- ============================================

-- Drop existing FK constraint
ALTER TABLE registered_teams 
    DROP CONSTRAINT IF EXISTS registered_teams_category_id_fkey;

-- Recreate FK constraint pointing to tournaments
ALTER TABLE registered_teams 
    ADD CONSTRAINT registered_teams_category_id_fkey 
    FOREIGN KEY ("categoryId") REFERENCES tournaments(id) ON DELETE CASCADE;

-- ============================================
-- PART 3: Update foreign key constraints on tournament_matches
-- ============================================

-- Drop existing FK constraint
ALTER TABLE tournament_matches 
    DROP CONSTRAINT IF EXISTS tournament_matches_category_id_fkey;

-- Recreate FK constraint pointing to tournaments
ALTER TABLE tournament_matches 
    ADD CONSTRAINT tournament_matches_category_id_fkey 
    FOREIGN KEY ("categoryId") REFERENCES tournaments(id) ON DELETE CASCADE;

-- ============================================
-- PART 4: Drop and recreate indexes
-- ============================================

-- Drop old indexes
DROP INDEX IF EXISTS idx_categories_status;
DROP INDEX IF EXISTS idx_categories_dates;
DROP INDEX IF EXISTS idx_categories_active;

-- Recreate indexes on tournaments table
CREATE INDEX idx_tournaments_status ON tournaments("status");
CREATE INDEX idx_tournaments_dates ON tournaments("tournamentStartDate", "tournamentEndDate");
CREATE INDEX idx_tournaments_active ON tournaments("status", "tournamentStartDate") 
    WHERE "status" IN ('open', 'ongoing');

-- ============================================
-- PART 5: Update CHECK constraint name
-- ============================================
ALTER TABLE tournaments 
    DROP CONSTRAINT IF EXISTS check_category_status;

ALTER TABLE tournaments 
    DROP CONSTRAINT IF EXISTS check_competition_categories_status;

ALTER TABLE tournaments 
    ADD CONSTRAINT check_tournaments_status 
    CHECK ("status" IN ('open', 'closed', 'ongoing', 'completed'));

-- ============================================
-- PART 6: Update unique constraints
-- ============================================

-- Drop old constraints if they exist
ALTER TABLE tournaments 
    DROP CONSTRAINT IF EXISTS unique_competition_categories_slug;

ALTER TABLE tournaments 
    DROP CONSTRAINT IF EXISTS unique_competition_categories_name;

-- Recreate unique constraints with new names
ALTER TABLE tournaments 
    ADD CONSTRAINT unique_tournaments_slug UNIQUE ("slug");

ALTER TABLE tournaments 
    ADD CONSTRAINT unique_tournaments_name UNIQUE ("name");

-- ============================================
-- Migration Complete
-- ============================================