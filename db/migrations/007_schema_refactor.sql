-- Migration 007: Comprehensive Schema Refactor - camelCase Migration
-- This migration:
-- 1. Creates teamMembers table (normalized, replaces JSONB)
-- 2. Renames all columns to camelCase
-- 3. Adds CHECK constraints for status fields
-- 4. Adds optimized indexes
-- 5. Drops team_members JSONB column
-- 6. Updates FK constraints

-- ============================================
-- PART 1: Create teamMembers table
-- ============================================

CREATE TABLE IF NOT EXISTS teamMembers (
    id SERIAL PRIMARY KEY,
    teamId INT NOT NULL REFERENCES registered_teams(id) ON DELETE CASCADE,
    userId TEXT REFERENCES "user"(id),
    name VARCHAR(100) NOT NULL,
    gameId VARCHAR(50),
    role VARCHAR(50),
    isCaptain BOOLEAN DEFAULT FALSE,
    joinedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON teamMembers(teamId);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON teamMembers(userId);

-- ============================================
-- PART 2: Rename competition_categories columns to camelCase
-- ============================================

-- Rename columns
ALTER TABLE competition_categories 
    RENAME COLUMN name TO "name";
    
ALTER TABLE competition_categories 
    RENAME COLUMN slug TO "slug";
    
ALTER TABLE competition_categories 
    RENAME COLUMN description TO "description";
    
ALTER TABLE competition_categories 
    RENAME COLUMN image_url TO "imageUrl";
    
ALTER TABLE competition_categories 
    RENAME COLUMN max_teams TO "maxTeams";
    
ALTER TABLE competition_categories 
    RENAME COLUMN team_size TO "teamSize";
    
ALTER TABLE competition_categories 
    RENAME COLUMN registration_fee TO "registrationFee";
    
ALTER TABLE competition_categories 
    RENAME COLUMN tournament_start_date TO "tournamentStartDate";
    
ALTER TABLE competition_categories 
    RENAME COLUMN tournament_end_date TO "tournamentEndDate";
    
ALTER TABLE competition_categories 
    RENAME COLUMN status TO "status";
    
ALTER TABLE competition_categories 
    RENAME COLUMN created_at TO "createdAt";
    
ALTER TABLE competition_categories 
    RENAME COLUMN updated_at TO "updatedAt";

-- ============================================
-- PART 3: Rename registered_teams columns to camelCase
-- ============================================

ALTER TABLE registered_teams 
    RENAME COLUMN team_name TO "teamName";
    
ALTER TABLE registered_teams 
    RENAME COLUMN captain_id TO "captainId";
    
ALTER TABLE registered_teams 
    RENAME COLUMN category_id TO "categoryId";
    
ALTER TABLE registered_teams 
    RENAME COLUMN payment_status TO "paymentStatus";
    
ALTER TABLE registered_teams 
    RENAME COLUMN payment_proof_url TO "paymentProofUrl";
    
ALTER TABLE registered_teams 
    RENAME COLUMN payment_verified_at TO "paymentVerifiedAt";
    
ALTER TABLE registered_teams 
    RENAME COLUMN payment_verified_by TO "paymentVerifiedBy";
    
ALTER TABLE registered_teams 
    RENAME COLUMN team_members TO "teamMembers";
    
ALTER TABLE registered_teams 
    RENAME COLUMN contact_email TO "contactEmail";
    
ALTER TABLE registered_teams 
    RENAME COLUMN contact_phone TO "contactPhone";
    
ALTER TABLE registered_teams 
    RENAME COLUMN is_deleted TO "isDeleted";
    
ALTER TABLE registered_teams 
    RENAME COLUMN deleted_at TO "deletedAt";
    
ALTER TABLE registered_teams 
    RENAME COLUMN deleted_reason TO "deletedReason";
    
ALTER TABLE registered_teams 
    RENAME COLUMN current_bracket TO "currentBracket";
    
ALTER TABLE registered_teams 
    RENAME COLUMN is_eliminated TO "isEliminated";
    
ALTER TABLE registered_teams 
    RENAME COLUMN final_placement TO "finalPlacement";
    
ALTER TABLE registered_teams 
    RENAME COLUMN created_at TO "createdAt";
    
ALTER TABLE registered_teams 
    RENAME COLUMN updated_at TO "updatedAt";

-- Drop the teamMembers JSONB column (replaced by teamMembers table)
ALTER TABLE registered_teams 
    DROP COLUMN IF EXISTS "teamMembers";

-- ============================================
-- PART 4: Rename tournament_matches columns to camelCase
-- ============================================

ALTER TABLE tournament_matches 
    RENAME COLUMN category_id TO "categoryId";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN bracket TO "bracket";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN round TO "round";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN match_number TO "matchNumber";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN team_a_id TO "teamAId";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN team_b_id TO "teamBId";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN winner_id TO "winnerId";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN is_bye TO "isBye";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN scheduled_at TO "scheduledAt";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN played_at TO "playedAt";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN status TO "status";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN next_match_winners_id TO "nextMatchWinnersId";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN next_match_losers_id TO "nextMatchLosersId";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN display_id TO "displayId";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN created_at TO "createdAt";
    
ALTER TABLE tournament_matches 
    RENAME COLUMN updated_at TO "updatedAt";

-- ============================================
-- PART 5: Drop and recreate indexes with camelCase column references
-- ============================================

-- Drop old indexes
DROP INDEX IF EXISTS idx_categories_status;
DROP INDEX IF EXISTS idx_categories_dates;
DROP INDEX IF EXISTS idx_teams_category;
DROP INDEX IF EXISTS idx_teams_captain;
DROP INDEX IF EXISTS idx_teams_payment;
DROP INDEX IF EXISTS idx_teams_deleted;
DROP INDEX IF EXISTS idx_teams_bracket;
DROP INDEX IF EXISTS idx_teams_eliminated;
DROP INDEX IF EXISTS idx_matches_category;
DROP INDEX IF EXISTS idx_matches_bracket;
DROP INDEX IF EXISTS idx_matches_status;
DROP INDEX IF EXISTS idx_matches_teams;
DROP INDEX IF EXISTS idx_matches_display;

-- Recreate indexes with camelCase columns
-- competition_categories indexes
CREATE INDEX idx_categories_status ON competition_categories("status");
CREATE INDEX idx_categories_dates ON competition_categories("tournamentStartDate", "tournamentEndDate");
CREATE INDEX idx_categories_active ON competition_categories("status", "tournamentStartDate") 
    WHERE "status" IN ('open', 'ongoing');

-- registered_teams indexes
CREATE INDEX idx_teams_category ON registered_teams("categoryId");
CREATE INDEX idx_teams_captain ON registered_teams("captainId");
CREATE INDEX idx_teams_payment ON registered_teams("paymentStatus");
CREATE INDEX idx_teams_deleted ON registered_teams("isDeleted");
CREATE INDEX idx_teams_bracket ON registered_teams("currentBracket");
CREATE INDEX idx_teams_eliminated ON registered_teams("isEliminated");

-- Optimized partial indexes for soft deletes
CREATE INDEX idx_teams_active ON registered_teams("categoryId") 
    WHERE "isDeleted" = FALSE;

CREATE INDEX idx_teams_captain_active ON registered_teams("captainId") 
    WHERE "isDeleted" = FALSE;

CREATE INDEX idx_teams_deleted_date ON registered_teams("deletedAt") 
    WHERE "isDeleted" = TRUE;

-- tournament_matches indexes
CREATE INDEX idx_matches_category ON tournament_matches("categoryId");
CREATE INDEX idx_matches_bracket ON tournament_matches("bracket", "round");
CREATE INDEX idx_matches_status ON tournament_matches("status");
CREATE INDEX idx_matches_teams ON tournament_matches("teamAId", "teamBId");
CREATE INDEX idx_matches_display ON tournament_matches("categoryId", "displayId");

-- Composite indexes for common queries
CREATE INDEX idx_matches_bracket_round ON tournament_matches("categoryId", "bracket", "round");
CREATE INDEX idx_matches_team_a ON tournament_matches("teamAId", "status");
CREATE INDEX idx_matches_team_b ON tournament_matches("teamBId", "status");
CREATE INDEX idx_matches_winner ON tournament_matches("winnerId");

-- ============================================
-- PART 6: Add CHECK constraints
-- ============================================

-- competition_categories status
ALTER TABLE competition_categories 
    DROP CONSTRAINT IF EXISTS check_competition_categories_status;

ALTER TABLE competition_categories 
    ADD CONSTRAINT check_competition_categories_status 
    CHECK ("status" IN ('open', 'closed', 'ongoing', 'completed'));

-- registered_teams paymentStatus
ALTER TABLE registered_teams 
    DROP CONSTRAINT IF EXISTS check_registered_teams_payment_status;

ALTER TABLE registered_teams 
    ADD CONSTRAINT check_registered_teams_payment_status 
    CHECK ("paymentStatus" IN ('pending', 'paid', 'verified'));

-- registered_teams currentBracket
ALTER TABLE registered_teams 
    DROP CONSTRAINT IF EXISTS check_registered_teams_current_bracket;

ALTER TABLE registered_teams 
    ADD CONSTRAINT check_registered_teams_current_bracket 
    CHECK ("currentBracket" IS NULL OR "currentBracket" IN ('winners', 'losers', 'finals'));

-- tournament_matches bracket
ALTER TABLE tournament_matches 
    DROP CONSTRAINT IF EXISTS check_tournament_matches_bracket;

ALTER TABLE tournament_matches 
    ADD CONSTRAINT check_tournament_matches_bracket 
    CHECK ("bracket" IN ('winners', 'losers', 'finals'));

-- tournament_matches status
ALTER TABLE tournament_matches 
    DROP CONSTRAINT IF EXISTS check_tournament_matches_status;

ALTER TABLE tournament_matches 
    ADD CONSTRAINT check_tournament_matches_status 
    CHECK ("status" IN ('pending', 'ready', 'ongoing', 'completed', 'cancelled'));

-- ============================================
-- PART 7: Update FK constraints
-- ============================================

-- Fix paymentVerifiedBy to use SET NULL
ALTER TABLE registered_teams 
    DROP CONSTRAINT IF EXISTS registered_teams_payment_verified_by_fkey;

ALTER TABLE registered_teams 
    ADD CONSTRAINT registered_teams_payment_verified_by_fkey 
    FOREIGN KEY ("paymentVerifiedBy") REFERENCES "user"(id) ON DELETE SET NULL;

-- Update unique constraints with camelCase
ALTER TABLE registered_teams 
    DROP CONSTRAINT IF EXISTS unique_team_per_category;

ALTER TABLE registered_teams 
    ADD CONSTRAINT unique_team_per_category 
    UNIQUE ("teamName", "categoryId");

ALTER TABLE registered_teams 
    DROP CONSTRAINT IF EXISTS unique_captain_per_category;

ALTER TABLE registered_teams 
    ADD CONSTRAINT unique_captain_per_category 
    UNIQUE ("captainId", "categoryId");

-- Update tournament_matches unique constraint
ALTER TABLE tournament_matches 
    DROP CONSTRAINT IF EXISTS unique_match_position;

ALTER TABLE tournament_matches 
    ADD CONSTRAINT unique_match_position 
    UNIQUE ("categoryId", "bracket", "round", "matchNumber");

-- Update tournament_matches unique constraint for displayId
ALTER TABLE tournament_matches 
    DROP CONSTRAINT IF EXISTS unique_display_per_category;

ALTER TABLE tournament_matches 
    ADD CONSTRAINT unique_display_per_category 
    UNIQUE ("categoryId", "displayId");

-- ============================================
-- Migration Complete
-- ============================================
