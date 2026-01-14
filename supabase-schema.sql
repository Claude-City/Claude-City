-- ============================================
-- CLAUDE CITY GOVERNANCE SIMULATION
-- Database Schema v1.0
-- 
-- Project: claude_city
-- Tables are prefixed with 'claude_city_' to avoid
-- conflicts with other projects in the same database
-- ============================================

-- Drop existing tables if recreating (uncomment if needed)
-- DROP TABLE IF EXISTS claude_city_decisions CASCADE;
-- DROP TABLE IF EXISTS claude_city_sessions CASCADE;

-- ============================================
-- SESSIONS TABLE
-- Tracks each simulation session
-- ============================================
CREATE TABLE IF NOT EXISTS claude_city_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id TEXT NOT NULL,
  city_name TEXT DEFAULT 'Claude City',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_decisions INTEGER DEFAULT 0,
  total_interventions INTEGER DEFAULT 0,
  total_restraints INTEGER DEFAULT 0,
  governance_style TEXT DEFAULT 'emerging',
  final_population INTEGER,
  final_happiness INTEGER,
  final_treasury INTEGER,
  project_id TEXT DEFAULT 'claude_city' -- Project identifier for filtering
);

-- ============================================
-- DECISIONS TABLE
-- Records each decision Claude makes
-- ============================================
CREATE TABLE IF NOT EXISTS claude_city_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES claude_city_sessions(id) ON DELETE CASCADE,
  city_id TEXT NOT NULL,
  tick INTEGER NOT NULL,
  game_year INTEGER,
  game_month INTEGER,
  decision_type TEXT NOT NULL,
  decision_target TEXT,
  decision_amount INTEGER,
  reasoning TEXT,
  observation TEXT,
  concern TEXT,
  goal TEXT,
  city_population INTEGER,
  city_happiness INTEGER,
  city_treasury INTEGER,
  city_era TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  project_id TEXT DEFAULT 'claude_city' -- Project identifier for filtering
);

-- ============================================
-- INDEXES
-- For query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cc_sessions_city ON claude_city_sessions(city_id);
CREATE INDEX IF NOT EXISTS idx_cc_sessions_project ON claude_city_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_cc_sessions_started ON claude_city_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_cc_decisions_session ON claude_city_decisions(session_id);
CREATE INDEX IF NOT EXISTS idx_cc_decisions_city ON claude_city_decisions(city_id);
CREATE INDEX IF NOT EXISTS idx_cc_decisions_created ON claude_city_decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_cc_decisions_project ON claude_city_decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_cc_decisions_type ON claude_city_decisions(decision_type);

-- ============================================
-- DISABLE ROW LEVEL SECURITY
-- Open access for the simulation
-- ============================================
ALTER TABLE claude_city_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE claude_city_decisions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- GRANT PERMISSIONS
-- Allow anon and authenticated users full access
-- ============================================
GRANT ALL ON claude_city_sessions TO anon, authenticated;
GRANT ALL ON claude_city_decisions TO anon, authenticated;

-- ============================================
-- DISASTER SYSTEM TABLES
-- Global spectator-triggered disasters
-- ============================================

-- Disaster cooldowns (one row per disaster type)
CREATE TABLE IF NOT EXISTS claude_city_disaster_cooldowns (
  disaster_id TEXT NOT NULL,
  last_triggered TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  triggered_by TEXT NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'claude_city',
  PRIMARY KEY (disaster_id, project_id)
);

-- Disaster log (history of all disasters)
CREATE TABLE IF NOT EXISTS claude_city_disaster_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id TEXT NOT NULL,
  triggered_by TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  project_id TEXT NOT NULL DEFAULT 'claude_city'
);

-- Disaster indexes
CREATE INDEX IF NOT EXISTS idx_disaster_cooldowns_project ON claude_city_disaster_cooldowns(project_id);
CREATE INDEX IF NOT EXISTS idx_disaster_log_project ON claude_city_disaster_log(project_id);
CREATE INDEX IF NOT EXISTS idx_disaster_log_time ON claude_city_disaster_log(triggered_at DESC);

-- Disable RLS for disasters
ALTER TABLE claude_city_disaster_cooldowns DISABLE ROW LEVEL SECURITY;
ALTER TABLE claude_city_disaster_log DISABLE ROW LEVEL SECURITY;

-- Grant access for disasters
GRANT ALL ON claude_city_disaster_cooldowns TO anon, authenticated;
GRANT ALL ON claude_city_disaster_log TO anon, authenticated;

-- ============================================
-- GLOBAL STATE SYNC TABLES
-- For synchronized simulation across all viewers
-- ============================================

-- Global game state (single row for the simulation)
CREATE TABLE IF NOT EXISTS claude_city_global_state (
  id TEXT NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'claude_city',
  state_json TEXT NOT NULL,
  tick INTEGER DEFAULT 0,
  population INTEGER DEFAULT 0,
  happiness INTEGER DEFAULT 50,
  treasury INTEGER DEFAULT 100000,
  year INTEGER DEFAULT 2024,
  month INTEGER DEFAULT 1,
  hour INTEGER DEFAULT 12,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, project_id)
);

-- Leader tracking (who runs the simulation)
CREATE TABLE IF NOT EXISTS claude_city_leader (
  project_id TEXT PRIMARY KEY DEFAULT 'claude_city',
  client_id TEXT NOT NULL,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Active viewers
CREATE TABLE IF NOT EXISTS claude_city_viewers (
  client_id TEXT NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'claude_city',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (client_id, project_id)
);

-- Global state indexes
CREATE INDEX IF NOT EXISTS idx_global_state_updated ON claude_city_global_state(updated_at);
CREATE INDEX IF NOT EXISTS idx_viewers_last_seen ON claude_city_viewers(last_seen);

-- Enable realtime for global state (important for sync!)
ALTER PUBLICATION supabase_realtime ADD TABLE claude_city_global_state;

-- Disable RLS for global state
ALTER TABLE claude_city_global_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE claude_city_leader DISABLE ROW LEVEL SECURITY;
ALTER TABLE claude_city_viewers DISABLE ROW LEVEL SECURITY;

-- Grant access for global state
GRANT ALL ON claude_city_global_state TO anon, authenticated;
GRANT ALL ON claude_city_leader TO anon, authenticated;
GRANT ALL ON claude_city_viewers TO anon, authenticated;

-- ============================================
-- USEFUL QUERIES (for reference)
-- ============================================

-- Get all sessions for this project:
-- SELECT * FROM claude_city_sessions WHERE project_id = 'claude_city' ORDER BY started_at DESC;

-- Get decisions for a session:
-- SELECT * FROM claude_city_decisions WHERE session_id = 'your-session-id' ORDER BY created_at DESC;

-- Get decision type distribution:
-- SELECT decision_type, COUNT(*) FROM claude_city_decisions WHERE project_id = 'claude_city' GROUP BY decision_type;

-- Get governance style over time:
-- SELECT governance_style, COUNT(*) FROM claude_city_sessions WHERE project_id = 'claude_city' GROUP BY governance_style;

-- ============================================
-- END CLAUDE CITY SCHEMA
-- ============================================
