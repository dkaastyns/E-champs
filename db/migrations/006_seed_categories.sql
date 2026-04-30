INSERT INTO competition_categories (name, slug, description, max_teams, team_size, registration_fee, tournament_start_date, tournament_end_date, status) VALUES
(
  'Mobile Legends: Bang Bang', 
  'mlbb', 
  '5v5 MOBA action. Strategy, teamwork, and quick reflexes decide the winner.',
  64,
  5,
  150000,
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '21 days',
  'open'
),
(
  'Valorant',
  'valorant',
  'Tactical FPS with unique agent abilities. Precision shooting meets strategic gameplay.',
  32,
  5,
  200000,
  NOW() + INTERVAL '10 days',
  NOW() + INTERVAL '16 days',
  'open'
),
(
  'PUBG Mobile',
  'pubg',
  'Battle Royale squad competition. Survive, loot, and be the last team standing.',
  48,
  4,
  100000,
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '12 days',
  'open'
),
(
  'Dota 2',
  'dota2',
  'The classic MOBA. Deep strategy, hero mastery, and team coordination.',
  16,
  5,
  250000,
  NOW() + INTERVAL '21 days',
  NOW() + INTERVAL '28 days',
  'open'
),
(
  'Counter-Strike 2',
  'cs2',
  'The legendary tactical shooter. Economy, aim, and team play at its finest.',
  32,
  5,
  175000,
  NOW() + INTERVAL '5 days',
  NOW() + INTERVAL '10 days',
  'open'
);
