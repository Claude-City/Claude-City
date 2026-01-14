/**
 * Supabase persistence for Claude Governor
 * Stores governance decisions and city state history
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ClaudeGovernorState, GovernorEvent, CityState } from './types';

// Supabase configuration - read from environment variables (set in .env.local)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Database types - prefixed with claude_city_ to avoid conflicts
interface GovernorDecisionRow {
  id?: string;
  session_id: string;
  city_id: string;
  tick: number;
  game_year?: number;
  game_month?: number;
  decision_type: string;
  decision_target: string | null;
  decision_amount: number | null;
  reasoning: string;
  observation?: string;
  concern?: string;
  goal?: string;
  city_population: number;
  city_happiness: number;
  city_treasury: number;
  city_era: string;
  created_at?: string;
  project_id?: string;
}

interface GovernorSessionRow {
  id?: string;
  city_id: string;
  city_name?: string;
  started_at: string;
  ended_at?: string;
  total_decisions: number;
  total_interventions: number;
  total_restraints: number;
  governance_style: string;
  final_population?: number;
  final_happiness?: number;
  final_treasury?: number;
  project_id?: string;
}

// Singleton client
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// Generate a unique session ID
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize database tables (run once)
export async function initializeDatabase(): Promise<boolean> {
  const client = getSupabaseClient();
  
  // Check if tables exist by attempting a simple query
  const { error } = await client
    .from('claude_city_sessions')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log('Database tables may need to be created. Error:', error.message);
    // Tables will be created via Supabase dashboard or migrations
    return false;
  }
  
  return true;
}

// Start a new governance session
export async function startSession(
  cityId: string,
  sessionId: string
): Promise<string | null> {
  const client = getSupabaseClient();
  
  const session: GovernorSessionRow = {
    id: sessionId,
    city_id: cityId,
    city_name: 'Claude City',
    started_at: new Date().toISOString(),
    total_decisions: 0,
    total_interventions: 0,
    total_restraints: 0,
    governance_style: 'emerging',
    project_id: 'claude_city',
  };
  
  const { data, error } = await client
    .from('claude_city_sessions')
    .insert(session)
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to start session:', error);
    return null;
  }
  
  return data?.id || null;
}

// End a governance session
export async function endSession(
  sessionId: string,
  governorState: ClaudeGovernorState,
  cityState: CityState
): Promise<boolean> {
  const client = getSupabaseClient();
  
  const { error } = await client
    .from('claude_city_sessions')
    .update({
      ended_at: new Date().toISOString(),
      total_decisions: governorState.totalDecisions,
      total_interventions: governorState.interventionCount,
      total_restraints: governorState.restraintCount,
      governance_style: governorState.governanceStyle,
      final_population: cityState.population,
      final_happiness: cityState.happiness,
      final_treasury: cityState.treasury,
    })
    .eq('id', sessionId);
  
  if (error) {
    console.error('Failed to end session:', error);
    return false;
  }
  
  return true;
}

// Record a governance decision
export async function recordDecision(
  sessionId: string,
  cityId: string,
  event: GovernorEvent,
  cityState: CityState
): Promise<boolean> {
  const client = getSupabaseClient();
  
  const decision: GovernorDecisionRow = {
    session_id: sessionId,
    city_id: cityId,
    tick: event.tick,
    game_year: cityState.year,
    game_month: cityState.month,
    decision_type: event.decision?.type || 'unknown',
    decision_target: event.decision?.target?.toString() || null,
    decision_amount: event.decision?.amount || null,
    reasoning: event.message,
    city_population: cityState.population,
    city_happiness: cityState.happiness,
    city_treasury: cityState.treasury,
    city_era: cityState.era,
    project_id: 'claude_city',
  };
  
  const { error } = await client
    .from('claude_city_decisions')
    .insert(decision);
  
  if (error) {
    console.error('Failed to record decision:', error);
    return false;
  }
  
  return true;
}

// Get session history for a city
export async function getSessionHistory(
  cityId: string,
  limit: number = 10
): Promise<GovernorSessionRow[]> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('claude_city_sessions')
    .select('*')
    .eq('city_id', cityId)
    .eq('project_id', 'claude_city')
    .order('started_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Failed to get session history:', error);
    return [];
  }
  
  return data || [];
}

// Get decision history for a session
export async function getDecisionHistory(
  sessionId: string,
  limit: number = 50
): Promise<GovernorDecisionRow[]> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('claude_city_decisions')
    .select('*')
    .eq('session_id', sessionId)
    .eq('project_id', 'claude_city')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Failed to get decision history:', error);
    return [];
  }
  
  return data || [];
}

// Get city statistics over time
export async function getCityStats(
  cityId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ population: number; happiness: number; timestamp: string }[]> {
  const client = getSupabaseClient();
  
  let query = client
    .from('claude_city_decisions')
    .select('city_population, city_happiness, created_at')
    .eq('city_id', cityId)
    .eq('project_id', 'claude_city')
    .order('created_at', { ascending: true });
  
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Failed to get city stats:', error);
    return [];
  }
  
  return (data || []).map(row => ({
    population: row.city_population,
    happiness: row.city_happiness,
    timestamp: row.created_at,
  }));
}

// SQL to create the necessary tables (run in Supabase SQL editor)
// Tables are prefixed with 'claude_city_' to avoid conflicts with other projects
export const CREATE_TABLES_SQL = `
-- ============================================
-- CLAUDE CITY GOVERNANCE SIMULATION
-- Database Schema v1.0
-- Project: claude_city
-- ============================================

-- Drop existing tables if recreating (uncomment if needed)
-- DROP TABLE IF EXISTS claude_city_decisions CASCADE;
-- DROP TABLE IF EXISTS claude_city_sessions CASCADE;

-- Governor Sessions table
-- Tracks each simulation session
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
  project_id TEXT DEFAULT 'claude_city' -- Project identifier
);

-- Governor Decisions table
-- Records each decision Claude makes
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
  project_id TEXT DEFAULT 'claude_city' -- Project identifier
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cc_sessions_city ON claude_city_sessions(city_id);
CREATE INDEX IF NOT EXISTS idx_cc_sessions_project ON claude_city_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_cc_decisions_session ON claude_city_decisions(session_id);
CREATE INDEX IF NOT EXISTS idx_cc_decisions_city ON claude_city_decisions(city_id);
CREATE INDEX IF NOT EXISTS idx_cc_decisions_created ON claude_city_decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_cc_decisions_project ON claude_city_decisions(project_id);

-- DISABLE Row Level Security for open access
ALTER TABLE claude_city_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE claude_city_decisions DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon and authenticated users
GRANT ALL ON claude_city_sessions TO anon, authenticated;
GRANT ALL ON claude_city_decisions TO anon, authenticated;

-- ============================================
-- END CLAUDE CITY SCHEMA
-- ============================================
`;
