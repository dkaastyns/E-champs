CREATE TABLE competition_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  max_teams INT DEFAULT 32,
  team_size INT DEFAULT 5,
  registration_fee DECIMAL(10,2) DEFAULT 0,
  tournament_start_date TIMESTAMPTZ,
  tournament_end_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_status ON competition_categories(status);
CREATE INDEX idx_categories_dates ON competition_categories(tournament_start_date, tournament_end_date);
