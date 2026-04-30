CREATE TABLE tournament_matches (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES competition_categories(id),
  bracket VARCHAR(20) NOT NULL,
  round INT NOT NULL,
  match_number INT NOT NULL,
  team_a_id INT REFERENCES registered_teams(id),
  team_b_id INT REFERENCES registered_teams(id),
  winner_id INT REFERENCES registered_teams(id),
  is_bye BOOLEAN DEFAULT FALSE,
  scheduled_at TIMESTAMPTZ,
  played_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending',
  next_match_winners_id INT REFERENCES tournament_matches(id),
  next_match_losers_id INT REFERENCES tournament_matches(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_match_position UNIQUE (category_id, bracket, round, match_number)
);

CREATE INDEX idx_matches_category ON tournament_matches(category_id);
CREATE INDEX idx_matches_bracket ON tournament_matches(bracket, round);
CREATE INDEX idx_matches_status ON tournament_matches(status);
CREATE INDEX idx_matches_teams ON tournament_matches(team_a_id, team_b_id);
