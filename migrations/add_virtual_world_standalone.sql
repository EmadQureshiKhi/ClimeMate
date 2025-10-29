-- ============================================
-- Phase 4: Virtual World Database Schema
-- Standalone version for Supabase SQL Editor
-- ============================================

-- User profiles for virtual world
CREATE TABLE IF NOT EXISTS virtual_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL UNIQUE,
  avatar_type TEXT DEFAULT 'default',
  avatar_color TEXT DEFAULT '#3B82F6',
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  forest_level INTEGER DEFAULT 1,
  trees_planted INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Achievements catalog
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  reward_points INTEGER DEFAULT 0,
  reward_xp INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User achievements tracking
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_wallet, achievement_id)
);

-- Mini-game scores
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL,
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  duration_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Social connections
CREATE TABLE IF NOT EXISTS user_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL,
  friend_wallet TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  UNIQUE(user_wallet, friend_wallet),
  CHECK (user_wallet != friend_wallet)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_virtual_profiles_wallet ON virtual_profiles(user_wallet);
CREATE INDEX IF NOT EXISTS idx_virtual_profiles_level ON virtual_profiles(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_wallet ON user_achievements(user_wallet);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(completed);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_wallet ON game_scores(user_wallet);
CREATE INDEX IF NOT EXISTS idx_game_scores_type ON game_scores(game_type);
CREATE INDEX IF NOT EXISTS idx_game_scores_created ON game_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_friends_wallet ON user_friends(user_wallet);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend ON user_friends(friend_wallet);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);

-- Function to update virtual profile timestamp
CREATE OR REPLACE FUNCTION update_virtual_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS trigger_update_virtual_profile_timestamp ON virtual_profiles;
CREATE TRIGGER trigger_update_virtual_profile_timestamp
  BEFORE UPDATE ON virtual_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_virtual_profile_timestamp();

-- Seed initial achievements
INSERT INTO achievements (id, name, description, icon, category, requirement_type, requirement_value, reward_points, reward_xp) VALUES
-- Charging Achievements
('first-charge', 'First Charge', 'Complete your first charging session', 'Zap', 'charging', 'sessions', 1, 10, 50),
('regular-charger', 'Regular Charger', 'Complete 10 charging sessions', 'Battery', 'charging', 'sessions', 10, 50, 100),
('power-user', 'Power User', 'Complete 50 charging sessions', 'BatteryCharging', 'charging', 'sessions', 50, 200, 500),
('century-club', 'Century Club', 'Charge 100 kWh total', 'Zap', 'charging', 'kwh', 100, 100, 200),
('kilowatt-king', 'Kilowatt King', 'Charge 500 kWh total', 'Crown', 'charging', 'kwh', 500, 500, 1000),
('fast-charger-master', 'Fast Charger Master', 'Use fast chargers 10 times', 'Rocket', 'charging', 'sessions', 10, 150, 300),

-- Environmental Achievements
('co2e-hero', 'CO₂e Hero', 'Save 100 kg CO₂e', 'Leaf', 'environmental', 'co2e', 100, 100, 200),
('climate-champion', 'Climate Champion', 'Save 500 kg CO₂e', 'Award', 'environmental', 'co2e', 500, 500, 1000),
('forest-guardian', 'Forest Guardian', 'Plant 100 trees', 'Trees', 'environmental', 'co2e', 100, 200, 400),
('green-warrior', 'Green Warrior', 'Reach forest level 5', 'Shield', 'environmental', 'co2e', 500, 300, 600),
('eco-legend', 'Eco Legend', 'Save 1000 kg CO₂e', 'Trophy', 'environmental', 'co2e', 1000, 1000, 2000),

-- Social Achievements
('social-butterfly', 'Social Butterfly', 'Add 5 friends', 'Users', 'social', 'friends', 5, 50, 100),
('community-leader', 'Community Leader', 'Reach top 10 on leaderboard', 'Star', 'social', 'sessions', 50, 200, 400),
('helpful-driver', 'Helpful Driver', 'Complete 25 charging sessions', 'Heart', 'social', 'sessions', 25, 100, 200),

-- Gaming Achievements
('speed-demon', 'Speed Demon', 'Win 5 charging races', 'Flame', 'gaming', 'games', 5, 150, 300),
('master-builder', 'Master Builder', 'Score 1000+ in forest builder', 'Hammer', 'gaming', 'games', 10, 200, 400),
('quiz-master', 'Quiz Master', 'Score 100% on energy quiz', 'Brain', 'gaming', 'games', 1, 100, 200),
('game-champion', 'Game Champion', 'Play 50 mini-games', 'Gamepad', 'gaming', 'games', 50, 300, 600)
ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Virtual World tables created successfully!';
  RAISE NOTICE '📊 Created 5 tables: virtual_profiles, achievements, user_achievements, game_scores, user_friends';
  RAISE NOTICE '🏆 Seeded 17 achievements across 4 categories';
  RAISE NOTICE '🚀 Ready to use!';
END $$;
