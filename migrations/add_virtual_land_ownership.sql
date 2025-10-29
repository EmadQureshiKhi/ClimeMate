-- Virtual Land Ownership System for EV Charging Map
-- Hexagonal plot system using H3 geographic indexing

-- Virtual plots (hexagons on world map)
CREATE TABLE IF NOT EXISTS virtual_plots (
  id SERIAL PRIMARY KEY,
  h3_index VARCHAR(15) UNIQUE NOT NULL,  -- H3 hexagon ID
  center_lat DECIMAL(10, 7) NOT NULL,
  center_lng DECIMAL(10, 7) NOT NULL,
  resolution INT NOT NULL DEFAULT 8,      -- H3 resolution level
  owner_wallet VARCHAR(44),
  nft_mint VARCHAR(44),
  purchased_at TIMESTAMP,
  purchase_price_sol DECIMAL(10,4),
  current_price_sol DECIMAL(10,4),
  has_charger BOOLEAN DEFAULT false,
  charger_level INT DEFAULT 0,            -- 0=none, 1=basic, 2=fast, 3=ultra
  station_count INT DEFAULT 0,            -- Real stations in this hex
  is_premium BOOLEAN DEFAULT false,       -- Premium location (city center, etc)
  total_virtual_charges INT DEFAULT 0,
  total_real_charges INT DEFAULT 0,
  total_earnings_sol DECIMAL(10,4) DEFAULT 0,
  last_charge_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_virtual_plots_h3 ON virtual_plots(h3_index);
CREATE INDEX IF NOT EXISTS idx_virtual_plots_owner ON virtual_plots(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_virtual_plots_location ON virtual_plots(center_lat, center_lng);

-- Map real charging stations to hexagons
CREATE TABLE IF NOT EXISTS station_hex_mapping (
  id SERIAL PRIMARY KEY,
  station_code VARCHAR(50) UNIQUE NOT NULL,
  station_name VARCHAR(255) NOT NULL,
  h3_index VARCHAR(15) NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  city VARCHAR(100),
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_station_hex_mapping_h3 ON station_hex_mapping(h3_index);
CREATE INDEX IF NOT EXISTS idx_station_hex_mapping_code ON station_hex_mapping(station_code);

-- Virtual charging sessions (in-game charges)
CREATE TABLE IF NOT EXISTS virtual_charging_sessions (
  id SERIAL PRIMARY KEY,
  plot_id INT REFERENCES virtual_plots(id),
  h3_index VARCHAR(15) NOT NULL,
  charger_wallet VARCHAR(44) NOT NULL,
  energy_kwh DECIMAL(10,2) NOT NULL,
  fee_paid_sol DECIMAL(10,4) NOT NULL,
  owner_earnings_sol DECIMAL(10,4) NOT NULL,
  is_real_charge BOOLEAN DEFAULT false,  -- Linked to real DeCharge session
  real_session_id VARCHAR(100),
  charged_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_virtual_charging_plot ON virtual_charging_sessions(plot_id);
CREATE INDEX IF NOT EXISTS idx_virtual_charging_wallet ON virtual_charging_sessions(charger_wallet);
CREATE INDEX IF NOT EXISTS idx_virtual_charging_date ON virtual_charging_sessions(charged_at);

-- Plot marketplace listings
CREATE TABLE IF NOT EXISTS plot_marketplace (
  id SERIAL PRIMARY KEY,
  plot_id INT REFERENCES virtual_plots(id) UNIQUE,
  h3_index VARCHAR(15) NOT NULL,
  seller_wallet VARCHAR(44) NOT NULL,
  asking_price_sol DECIMAL(10,4) NOT NULL,
  listed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  sold_at TIMESTAMP,
  buyer_wallet VARCHAR(44)
);

CREATE INDEX IF NOT EXISTS idx_plot_marketplace_active ON plot_marketplace(is_active, asking_price_sol);
CREATE INDEX IF NOT EXISTS idx_plot_marketplace_seller ON plot_marketplace(seller_wallet);

-- Territories (groups of adjacent hexes)
CREATE TABLE IF NOT EXISTS territories (
  id SERIAL PRIMARY KEY,
  owner_wallet VARCHAR(44) NOT NULL,
  name VARCHAR(100),
  hex_count INT DEFAULT 0,
  center_h3_index VARCHAR(15),
  bonus_multiplier DECIMAL(4,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_territories_owner ON territories(owner_wallet);

-- Territory membership (which hexes belong to which territory)
CREATE TABLE IF NOT EXISTS territory_hexes (
  id SERIAL PRIMARY KEY,
  territory_id INT REFERENCES territories(id) ON DELETE CASCADE,
  h3_index VARCHAR(15) NOT NULL,
  plot_id INT REFERENCES virtual_plots(id),
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(territory_id, h3_index)
);

CREATE INDEX IF NOT EXISTS idx_territory_hexes_territory ON territory_hexes(territory_id);
CREATE INDEX IF NOT EXISTS idx_territory_hexes_h3 ON territory_hexes(h3_index);

-- Leaderboards (cached for performance)
CREATE TABLE IF NOT EXISTS plot_leaderboards (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  total_plots INT DEFAULT 0,
  total_earnings_sol DECIMAL(10,4) DEFAULT 0,
  total_charges INT DEFAULT 0,
  territory_count INT DEFAULT 0,
  rank INT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plot_leaderboards_rank ON plot_leaderboards(rank);
CREATE INDEX IF NOT EXISTS idx_plot_leaderboards_earnings ON plot_leaderboards(total_earnings_sol DESC);

-- Comments for documentation
COMMENT ON TABLE virtual_plots IS 'Hexagonal plots on world map that users can own';
COMMENT ON TABLE station_hex_mapping IS 'Maps real DeCharge stations to H3 hexagons';
COMMENT ON TABLE virtual_charging_sessions IS 'In-game charging sessions on virtual plots';
COMMENT ON TABLE plot_marketplace IS 'Marketplace for buying/selling plots';
COMMENT ON TABLE territories IS 'Groups of adjacent hexes owned by same user';
