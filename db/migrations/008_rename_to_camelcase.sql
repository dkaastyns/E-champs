-- Migration 008: Rename columns to camelCase for Better Auth consistency
-- This migration renames all snake_case columns to camelCase

-- Rename columns in registered_teams
ALTER TABLE registered_teams RENAME COLUMN team_name TO "teamName";
ALTER TABLE registered_teams RENAME COLUMN captain_id TO "captainId";
ALTER TABLE registered_teams RENAME COLUMN category_id TO "categoryId";
ALTER TABLE registered_teams RENAME COLUMN payment_status TO "paymentStatus";
ALTER TABLE registered_teams RENAME COLUMN payment_proof_url TO "paymentProofUrl";
ALTER TABLE registered_teams RENAME COLUMN payment_verified_at TO "paymentVerifiedAt";
ALTER TABLE registered_teams RENAME COLUMN payment_verified_by TO "paymentVerifiedBy";
ALTER TABLE registered_teams RENAME COLUMN contact_email TO "contactEmail";
ALTER TABLE registered_teams RENAME COLUMN contact_phone TO "contactPhone";
ALTER TABLE registered_teams RENAME COLUMN is_deleted TO "isDeleted";
ALTER TABLE registered_teams RENAME COLUMN deleted_at TO "deletedAt";
ALTER TABLE registered_teams RENAME COLUMN deleted_reason TO "deletedReason";
ALTER TABLE registered_teams RENAME COLUMN current_bracket TO "currentBracket";
ALTER TABLE registered_teams RENAME COLUMN is_eliminated TO "isEliminated";
ALTER TABLE registered_teams RENAME COLUMN final_placement TO "finalPlacement";
ALTER TABLE registered_teams RENAME COLUMN created_at TO "createdAt";
ALTER TABLE registered_teams RENAME COLUMN updated_at TO "updatedAt";

-- Rename columns in competition_categories
ALTER TABLE competition_categories RENAME COLUMN max_teams TO "maxTeams";
ALTER TABLE competition_categories RENAME COLUMN team_size TO "teamSize";
ALTER TABLE competition_categories RENAME COLUMN registration_fee TO "registrationFee";
ALTER TABLE competition_categories RENAME COLUMN tournament_start_date TO "tournamentStartDate";
ALTER TABLE competition_categories RENAME COLUMN tournament_end_date TO "tournamentEndDate";
ALTER TABLE competition_categories RENAME COLUMN created_at TO "createdAt";
ALTER TABLE competition_categories RENAME COLUMN updated_at TO "updatedAt";

-- Rename columns in tournament_matches
ALTER TABLE tournament_matches RENAME COLUMN display_id TO "displayId";
ALTER TABLE tournament_matches RENAME COLUMN category_id TO "categoryId";
ALTER TABLE tournament_matches RENAME COLUMN match_number TO "matchNumber";
ALTER TABLE tournament_matches RENAME COLUMN team_a_id TO "teamAId";
ALTER TABLE tournament_matches RENAME COLUMN team_b_id TO "teamBId";
ALTER TABLE tournament_matches RENAME COLUMN winner_id TO "winnerId";
ALTER TABLE tournament_matches RENAME COLUMN is_bye TO "isBye";
ALTER TABLE tournament_matches RENAME COLUMN scheduled_at TO "scheduledAt";
ALTER TABLE tournament_matches RENAME COLUMN played_at TO "playedAt";
ALTER TABLE tournament_matches RENAME COLUMN next_match_winners_id TO "nextMatchWinnersId";
ALTER TABLE tournament_matches RENAME COLUMN next_match_losers_id TO "nextMatchLosersId";
ALTER TABLE tournament_matches RENAME COLUMN created_at TO "createdAt";
ALTER TABLE tournament_matches RENAME COLUMN updated_at TO "updatedAt";

-- Create teamMembers table if it doesn't exist (for normalized team member data)
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  "teamId" INTEGER NOT NULL REFERENCES registered_teams(id) ON DELETE CASCADE,
  "userId" TEXT,
  "nickname" TEXT NOT NULL,
  "gameId" TEXT,
  "role" TEXT DEFAULT 'member',
  "isCaptain" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on teamId for team_members
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members("teamId");

-- Drop the old team_members JSONB column if it exists
ALTER TABLE registered_teams DROP COLUMN IF EXISTS team_members;

-- Recreate indexes with new column names
DROP INDEX IF EXISTS idx_teams_category;
DROP INDEX IF EXISTS idx_teams_captain;
DROP INDEX IF EXISTS idx_teams_payment_status;
DROP INDEX IF EXISTS idx_teams_active;
DROP INDEX IF EXISTS idx_matches_category;
DROP INDEX IF EXISTS idx_matches_display_id;
DROP INDEX IF EXISTS idx_matches_teams;
DROP INDEX IF EXISTS idx_matches_next_winners;
DROP INDEX IF EXISTS idx_matches_next_losers;
DROP INDEX IF EXISTS idx_matches_category_bracket;
DROP INDEX IF EXISTS idx_matches_ready;

-- Create new indexes with camelCase column names
CREATE INDEX idx_teams_category ON registered_teams("categoryId");
CREATE INDEX idx_teams_captain ON registered_teams("captainId");
CREATE INDEX idx_teams_payment_status ON registered_teams("paymentStatus");
CREATE INDEX idx_teams_active ON registered_teams("isDeleted") WHERE "isDeleted" = FALSE;
CREATE INDEX idx_matches_category ON tournament_matches("categoryId");
CREATE INDEX idx_matches_display_id ON tournament_matches("displayId");
CREATE INDEX idx_matches_teams ON tournament_matches("teamAId", "teamBId");
CREATE INDEX idx_matches_next_winners ON tournament_matches("nextMatchWinnersId");
CREATE INDEX idx_matches_next_losers ON tournament_matches("nextMatchLosersId");
CREATE INDEX idx_matches_category_bracket ON tournament_matches("categoryId", "bracket", "round");
CREATE INDEX idx_matches_ready ON tournament_matches("categoryId", "status") WHERE status = 'ready';

-- Add CHECK constraints if they don't exist
DO $$
BEGIN
  -- Drop existing constraints if any
  ALTER TABLE competition_categories DROP CONSTRAINT IF EXISTS check_category_status;
  ALTER TABLE registered_teams DROP CONSTRAINT IF EXISTS check_payment_status;
  ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS check_match_status;
  ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS check_bracket_type;
  
  -- Add new constraints
  ALTER TABLE competition_categories ADD CONSTRAINT check_category_status 
    CHECK (status IN ('open', 'closed', 'ongoing', 'completed'));
  
  ALTER TABLE registered_teams ADD CONSTRAINT check_payment_status 
    CHECK ("paymentStatus" IN ('pending', 'paid', 'verified', 'rejected'));
  
  ALTER TABLE tournament_matches ADD CONSTRAINT check_match_status 
    CHECK (status IN ('pending', 'ready', 'ongoing', 'completed'));
  
  ALTER TABLE tournament_matches ADD CONSTRAINT check_bracket_type 
    CHECK ("bracket" IN ('winners', 'losers', 'finals'));
END $$;
