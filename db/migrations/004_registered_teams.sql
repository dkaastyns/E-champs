CREATE TABLE registered_teams (
  id SERIAL PRIMARY KEY,
  team_name VARCHAR(100) NOT NULL,
  captain_id TEXT NOT NULL REFERENCES "user"(id),
  category_id INT NOT NULL REFERENCES competition_categories(id),
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_proof_url TEXT,
  payment_verified_at TIMESTAMPTZ,
  payment_verified_by TEXT REFERENCES "user"(id),
  team_members JSONB DEFAULT '[]',
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_reason TEXT,
  current_bracket VARCHAR(20) DEFAULT NULL,
  is_eliminated BOOLEAN DEFAULT FALSE,
  final_placement INT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_team_per_category UNIQUE (team_name, category_id),
  CONSTRAINT unique_captain_per_category UNIQUE (captain_id, category_id)
);

CREATE INDEX idx_teams_category ON registered_teams(category_id);
CREATE INDEX idx_teams_captain ON registered_teams(captain_id);
CREATE INDEX idx_teams_payment ON registered_teams(payment_status);
CREATE INDEX idx_teams_deleted ON registered_teams(is_deleted);
CREATE INDEX idx_teams_bracket ON registered_teams(current_bracket);
CREATE INDEX idx_teams_eliminated ON registered_teams(is_eliminated);
