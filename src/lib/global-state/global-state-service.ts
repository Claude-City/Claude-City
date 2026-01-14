/**
 * Global State Service
 * Synchronizes game state across all viewers via Supabase
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { GameState } from '@/types/game';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const PROJECT_ID = 'claude_city';
const GLOBAL_STATE_ID = 'main_simulation';

let supabaseClient: SupabaseClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase not configured. URL:', !!SUPABASE_URL, 'KEY:', !!SUPABASE_ANON_KEY);
    return null;
  }
  if (!supabaseClient) {
    console.log('🔌 Creating Supabase client...');
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// Compress game state for storage
function compressState(state: GameState): string {
  // Remove non-essential data to reduce size
  const minimalState = {
    ...state,
    notifications: [], // Don't sync notifications
    advisorMessages: [],
    history: state.history.slice(-10), // Keep only recent history
  };
  return compressToUTF16(JSON.stringify(minimalState));
}

// Decompress game state
function decompressState(compressed: string): GameState | null {
  try {
    const json = decompressFromUTF16(compressed);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Check if this client should be the leader (runs the simulation)
export async function checkLeadership(): Promise<{ isLeader: boolean; leaderId: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { isLeader: true, leaderId: null }; // No Supabase = local leader
  }

  const clientId = getClientId();
  const now = new Date();
  const leaderTimeout = 30000; // 30 seconds - if leader hasn't updated, take over

  try {
    // Check current leader
    const { data: leaderData } = await client
      .from('claude_city_leader')
      .select('*')
      .eq('project_id', PROJECT_ID)
      .single();

    if (!leaderData) {
      // No leader - claim leadership
      await claimLeadership(clientId);
      return { isLeader: true, leaderId: clientId };
    }

    const lastHeartbeat = new Date(leaderData.last_heartbeat);
    const timeSinceHeartbeat = now.getTime() - lastHeartbeat.getTime();

    if (leaderData.client_id === clientId) {
      // We are the leader
      return { isLeader: true, leaderId: clientId };
    }

    if (timeSinceHeartbeat > leaderTimeout) {
      // Leader is dead - take over
      await claimLeadership(clientId);
      return { isLeader: true, leaderId: clientId };
    }

    // Someone else is leader
    return { isLeader: false, leaderId: leaderData.client_id };
  } catch {
    return { isLeader: true, leaderId: null };
  }
}

// Claim leadership
async function claimLeadership(clientId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  await client
    .from('claude_city_leader')
    .upsert({
      project_id: PROJECT_ID,
      client_id: clientId,
      last_heartbeat: new Date().toISOString(),
    }, {
      onConflict: 'project_id',
    });
}

// Send leader heartbeat
export async function sendHeartbeat(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const clientId = getClientId();

  await client
    .from('claude_city_leader')
    .update({ last_heartbeat: new Date().toISOString() })
    .eq('project_id', PROJECT_ID)
    .eq('client_id', clientId);
}

// Get or create client ID
function getClientId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let id = sessionStorage.getItem('claude_city_client_id');
  if (!id) {
    id = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('claude_city_client_id', id);
  }
  return id;
}

// Save global state (leader only)
export async function saveGlobalState(state: GameState): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('❌ Cannot save - no Supabase client');
    return false;
  }

  const compressed = compressState(state);
  console.log('💾 Saving global state... Tick:', state.tick, 'Pop:', state.stats.population);

  try {
    const { error } = await client
      .from('claude_city_global_state')
      .upsert({
        id: GLOBAL_STATE_ID,
        project_id: PROJECT_ID,
        state_json: compressed,
        tick: state.tick,
        population: state.stats.population,
        happiness: Math.round(state.stats.happiness),
        treasury: state.stats.money,
        year: state.year,
        month: state.month,
        hour: state.hour, // Include hour for time sync
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id,project_id',
      });

    if (error) {
      console.error('❌ Save error:', error.message);
      return false;
    }
    
    console.log('✅ Saved to global!');
    return true;
  } catch (err) {
    console.error('❌ Save exception:', err);
    return false;
  }
}

// Load global state (followers)
export async function loadGlobalState(): Promise<GameState | null> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('❌ No Supabase client - check env vars');
    return null;
  }

  try {
    console.log('🔍 Loading global state from Supabase...');
    const { data, error } = await client
      .from('claude_city_global_state')
      .select('*')
      .eq('id', GLOBAL_STATE_ID)
      .eq('project_id', PROJECT_ID)
      .single();

    if (error) {
      console.log('⚠️ Supabase query error:', error.message);
      return null;
    }
    
    if (!data) {
      console.log('📭 No global state found in database');
      return null;
    }

    console.log('✅ Found global state! Tick:', data.tick, 'Pop:', data.population);
    const state = decompressState(data.state_json);
    if (!state) {
      console.log('❌ Failed to decompress state');
    }
    return state;
  } catch (err) {
    console.error('❌ Load error:', err);
    return null;
  }
}

// Subscribe to real-time state updates
export function subscribeToStateUpdates(
  onUpdate: (state: GameState) => void
): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  realtimeChannel = client
    .channel('global-state')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'claude_city_global_state',
        filter: `project_id=eq.${PROJECT_ID}`,
      },
      (payload) => {
        const stateJson = payload.new.state_json;
        if (stateJson) {
          const state = decompressState(stateJson);
          if (state) {
            onUpdate(state);
          }
        }
      }
    )
    .subscribe();

  return () => {
    if (realtimeChannel) {
      client.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };
}

// Get viewer count (approximate)
export async function getViewerCount(): Promise<number> {
  const client = getSupabaseClient();
  if (!client) return 1;

  try {
    const { count } = await client
      .from('claude_city_viewers')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', PROJECT_ID)
      .gte('last_seen', new Date(Date.now() - 60000).toISOString()); // Active in last minute

    return count || 1;
  } catch {
    return 1;
  }
}

// Register as viewer
export async function registerViewer(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const clientId = getClientId();

  try {
    await client
      .from('claude_city_viewers')
      .upsert({
        client_id: clientId,
        project_id: PROJECT_ID,
        last_seen: new Date().toISOString(),
      }, {
        onConflict: 'client_id,project_id',
      });
  } catch {
    // Ignore errors
  }
}

// Reset global state - clears everything for a fresh start
export async function resetGlobalState(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    console.log('⚠️ No Supabase client - cannot reset server state');
    return false;
  }

  try {
    console.log('🧹 Clearing global state from Supabase...');
    
    // Delete global state
    await client
      .from('claude_city_global_state')
      .delete()
      .eq('project_id', PROJECT_ID);
    
    // Delete leader
    await client
      .from('claude_city_leader')
      .delete()
      .eq('project_id', PROJECT_ID);
    
    // Delete viewers
    await client
      .from('claude_city_viewers')
      .delete()
      .eq('project_id', PROJECT_ID);
    
    console.log('✅ Global state cleared!');
    return true;
  } catch (error) {
    console.error('❌ Failed to reset global state:', error);
    return false;
  }
}

// SQL to create the tables
export const GLOBAL_STATE_TABLES_SQL = `
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_global_state_updated ON claude_city_global_state(updated_at);
CREATE INDEX IF NOT EXISTS idx_viewers_last_seen ON claude_city_viewers(last_seen);

-- Enable realtime for global state
ALTER PUBLICATION supabase_realtime ADD TABLE claude_city_global_state;

-- Disable RLS
ALTER TABLE claude_city_global_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE claude_city_leader DISABLE ROW LEVEL SECURITY;
ALTER TABLE claude_city_viewers DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON claude_city_global_state TO anon, authenticated;
GRANT ALL ON claude_city_leader TO anon, authenticated;
GRANT ALL ON claude_city_viewers TO anon, authenticated;
`;
