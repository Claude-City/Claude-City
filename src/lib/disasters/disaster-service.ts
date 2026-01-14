/**
 * Global Disaster Service
 * Handles triggering disasters with global cooldowns via Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DisasterType, DISASTERS, DisasterCooldown } from './types';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const PROJECT_ID = 'claude_city';

// Singleton client
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// Generate anonymous user ID (stored in localStorage)
function getAnonymousUserId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let id = localStorage.getItem('claude_city_user_id');
  if (!id) {
    id = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('claude_city_user_id', id);
  }
  return id;
}

// Check if a disaster is on cooldown
export async function getDisasterCooldowns(): Promise<Map<DisasterType, { onCooldown: boolean; remainingMinutes: number; lastTriggeredBy: string }>> {
  const result = new Map<DisasterType, { onCooldown: boolean; remainingMinutes: number; lastTriggeredBy: string }>();
  
  // Initialize all disasters as available
  Object.keys(DISASTERS).forEach(id => {
    result.set(id as DisasterType, { onCooldown: false, remainingMinutes: 0, lastTriggeredBy: '' });
  });
  
  const client = getSupabaseClient();
  if (!client) return result;
  
  try {
    const { data, error } = await client
      .from('claude_city_disaster_cooldowns')
      .select('*')
      .eq('project_id', PROJECT_ID);
    
    if (error) {
      console.error('Failed to fetch cooldowns:', error);
      return result;
    }
    
    const now = new Date();
    
    (data || []).forEach((cooldown: DisasterCooldown) => {
      const disaster = DISASTERS[cooldown.disaster_id];
      if (!disaster) return;
      
      const lastTriggered = new Date(cooldown.last_triggered);
      const cooldownEnd = new Date(lastTriggered.getTime() + disaster.cooldownMinutes * 60 * 1000);
      const remainingMs = cooldownEnd.getTime() - now.getTime();
      
      if (remainingMs > 0) {
        result.set(cooldown.disaster_id, {
          onCooldown: true,
          remainingMinutes: Math.ceil(remainingMs / 60000),
          lastTriggeredBy: cooldown.triggered_by,
        });
      }
    });
  } catch (error) {
    console.error('Error checking cooldowns:', error);
  }
  
  return result;
}

// Check single disaster cooldown
export async function checkCooldown(disasterId: DisasterType): Promise<{ canTrigger: boolean; remainingMinutes: number }> {
  const cooldowns = await getDisasterCooldowns();
  const cooldown = cooldowns.get(disasterId);
  
  if (!cooldown) {
    return { canTrigger: true, remainingMinutes: 0 };
  }
  
  return {
    canTrigger: !cooldown.onCooldown,
    remainingMinutes: cooldown.remainingMinutes,
  };
}

// Trigger a disaster (updates global cooldown)
export async function triggerDisaster(disasterId: DisasterType): Promise<{ success: boolean; message: string }> {
  const disaster = DISASTERS[disasterId];
  if (!disaster) {
    return { success: false, message: 'Unknown disaster type' };
  }
  
  // Check cooldown first
  const { canTrigger, remainingMinutes } = await checkCooldown(disasterId);
  if (!canTrigger) {
    return { 
      success: false, 
      message: `${disaster.name} is on cooldown! ${remainingMinutes} minutes remaining.` 
    };
  }
  
  const client = getSupabaseClient();
  if (!client) {
    // No Supabase - allow local triggering
    dispatchDisasterEvent(disasterId);
    return { success: true, message: `${disaster.name} triggered! (Local mode)` };
  }
  
  const userId = getAnonymousUserId();
  const now = new Date().toISOString();
  
  try {
    // Upsert the cooldown record
    const { error } = await client
      .from('claude_city_disaster_cooldowns')
      .upsert({
        disaster_id: disasterId,
        last_triggered: now,
        triggered_by: userId,
        project_id: PROJECT_ID,
      }, {
        onConflict: 'disaster_id,project_id',
      });
    
    if (error) {
      console.error('Failed to record disaster:', error);
      // Still trigger locally
      dispatchDisasterEvent(disasterId);
      return { success: true, message: `${disaster.name} triggered!` };
    }
    
    // Record in disaster log
    await client
      .from('claude_city_disaster_log')
      .insert({
        disaster_id: disasterId,
        triggered_by: userId,
        triggered_at: now,
        project_id: PROJECT_ID,
      });
    
    // Dispatch the disaster event
    dispatchDisasterEvent(disasterId);
    
    return { success: true, message: `${disaster.name} unleashed upon the city!` };
  } catch (error) {
    console.error('Error triggering disaster:', error);
    dispatchDisasterEvent(disasterId);
    return { success: true, message: `${disaster.name} triggered!` };
  }
}

// Dispatch disaster event for the game to handle
function dispatchDisasterEvent(disasterId: DisasterType) {
  const disaster = DISASTERS[disasterId];
  const event = new CustomEvent('global-disaster', {
    detail: {
      disasterId,
      disaster,
      timestamp: Date.now(),
    },
  });
  window.dispatchEvent(event);
}

// Subscribe to real-time disaster updates (for multi-user sync)
export function subscribeToDisasters(callback: (disasterId: DisasterType) => void): () => void {
  const client = getSupabaseClient();
  if (!client) {
    return () => {};
  }
  
  const channel = client
    .channel('disasters')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'claude_city_disaster_log',
        filter: `project_id=eq.${PROJECT_ID}`,
      },
      (payload) => {
        const disasterId = payload.new.disaster_id as DisasterType;
        callback(disasterId);
      }
    )
    .subscribe();
  
  return () => {
    client.removeChannel(channel);
  };
}

// SQL to create disaster tables
export const DISASTER_TABLES_SQL = `
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disaster_cooldowns_project ON claude_city_disaster_cooldowns(project_id);
CREATE INDEX IF NOT EXISTS idx_disaster_log_project ON claude_city_disaster_log(project_id);
CREATE INDEX IF NOT EXISTS idx_disaster_log_time ON claude_city_disaster_log(triggered_at DESC);

-- Disable RLS
ALTER TABLE claude_city_disaster_cooldowns DISABLE ROW LEVEL SECURITY;
ALTER TABLE claude_city_disaster_log DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON claude_city_disaster_cooldowns TO anon, authenticated;
GRANT ALL ON claude_city_disaster_log TO anon, authenticated;
`;
