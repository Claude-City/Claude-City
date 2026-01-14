'use client';

/**
 * Hook for Global State Synchronization
 * Ensures all viewers see the same simulation
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useGame } from '@/context/GameContext';
import {
  checkLeadership,
  sendHeartbeat,
  saveGlobalState,
  loadGlobalState,
  subscribeToStateUpdates,
  registerViewer,
  getViewerCount,
} from '@/lib/global-state';

interface GlobalSyncState {
  isLeader: boolean;
  viewerCount: number;
  isSyncing: boolean;
  lastSync: number;
}

export function useGlobalSync() {
  const { state, loadState } = useGame();
  // Start as leader by default - ensures simulation runs immediately
  // Will sync with others once Supabase connection is established
  const [syncState, setSyncState] = useState<GlobalSyncState>({
    isLeader: true, // Default to leader so simulation starts immediately!
    viewerCount: 1,
    isSyncing: false,
    lastSync: Date.now(),
  });
  
  const isLeaderRef = useRef(true); // Start as leader
  const lastSaveTickRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const supabaseAvailable = useRef(true);

  // Check and claim leadership
  const checkAndClaimLeadership = useCallback(async (): Promise<boolean> => {
    const result = await checkLeadership();
    isLeaderRef.current = result.isLeader;
    setSyncState(prev => ({ ...prev, isLeader: result.isLeader }));
    return result.isLeader;
  }, []);

  // Save state to global (leader only)
  const saveToGlobal = useCallback(async () => {
    if (!isLeaderRef.current) return;
    if (state.tick === lastSaveTickRef.current) return;
    
    setSyncState(prev => ({ ...prev, isSyncing: true }));
    const success = await saveGlobalState(state);
    if (success) {
      lastSaveTickRef.current = state.tick;
    }
    setSyncState(prev => ({ 
      ...prev, 
      isSyncing: false, 
      lastSync: success ? Date.now() : prev.lastSync 
    }));
  }, [state]);

  // Load state from global (followers)
  const loadFromGlobal = useCallback(async () => {
    if (isLeaderRef.current) return false;
    
    const globalState = await loadGlobalState();
    if (globalState && globalState.tick > state.tick) {
      // Load the global state
      loadState(JSON.stringify(globalState));
      return true;
    }
    return false;
  }, [state.tick, loadState]);

  // Initialize on mount
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const init = async () => {
      try {
        // Register as viewer
        await registerViewer();
        
        // ALWAYS try to load global state first
        // This ensures everyone syncs to the same state
        const globalState = await loadGlobalState();
        
        if (globalState && globalState.tick > 0) {
          // Global state exists - load it and become follower
          console.log('📡 Found existing global simulation, syncing...');
          loadState(JSON.stringify(globalState));
          isLeaderRef.current = false;
          setSyncState(prev => ({ ...prev, isLeader: false, lastSync: Date.now() }));
          
          // Check if we should take over as leader
          const leaderCheck = await checkAndClaimLeadership();
          if (leaderCheck) {
            console.log('👑 Becoming leader of the simulation');
            isLeaderRef.current = true;
            setSyncState(prev => ({ ...prev, isLeader: true }));
          }
        } else {
          // No global state - we're the first one, become leader
          console.log('🆕 No existing simulation, starting as leader');
          await checkAndClaimLeadership();
          isLeaderRef.current = true;
          setSyncState(prev => ({ ...prev, isLeader: true }));
          
          // Save initial state immediately
          await saveGlobalState(state);
        }
        
        // Get viewer count
        const count = await getViewerCount();
        setSyncState(prev => ({ ...prev, viewerCount: count }));
      } catch (error) {
        // Supabase not available - run locally as leader
        console.log('⚠️ Global sync not available, running locally');
        supabaseAvailable.current = false;
        isLeaderRef.current = true;
        setSyncState(prev => ({ ...prev, isLeader: true }));
      }
    };

    init();
  }, [checkAndClaimLeadership, loadState, state]);

  // Leader: Save state frequently for real-time sync
  useEffect(() => {
    if (!isLeaderRef.current) return;

    // Save every 2 seconds for smooth sync
    const saveInterval = setInterval(() => {
      saveToGlobal();
    }, 2000);

    // Also save on every 20 tick changes
    if (state.tick - lastSaveTickRef.current >= 20) {
      saveToGlobal();
    }

    return () => clearInterval(saveInterval);
  }, [state.tick, saveToGlobal]);

  // Leader: Send heartbeat
  useEffect(() => {
    if (!isLeaderRef.current) return;

    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 10000); // Every 10 seconds

    return () => clearInterval(heartbeatInterval);
  }, []);

  // Follower: Subscribe to real-time updates + polling fallback
  useEffect(() => {
    if (isLeaderRef.current) return;

    // Realtime subscription
    const unsubscribe = subscribeToStateUpdates((newState) => {
      if (newState.tick > state.tick) {
        loadState(JSON.stringify(newState));
        setSyncState(prev => ({ ...prev, lastSync: Date.now() }));
      }
    });
    
    // Also poll every 3 seconds as fallback (realtime can be unreliable)
    const pollInterval = setInterval(async () => {
      try {
        const globalState = await loadGlobalState();
        if (globalState && globalState.tick > state.tick) {
          loadState(JSON.stringify(globalState));
          setSyncState(prev => ({ ...prev, lastSync: Date.now() }));
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [state.tick, loadState]);

  // Update viewer count periodically
  useEffect(() => {
    const countInterval = setInterval(async () => {
      await registerViewer();
      const count = await getViewerCount();
      setSyncState(prev => ({ ...prev, viewerCount: count }));
    }, 30000); // Every 30 seconds

    return () => clearInterval(countInterval);
  }, []);

  // Re-check leadership if we're a follower and haven't received updates
  useEffect(() => {
    if (isLeaderRef.current) return;

    const checkInterval = setInterval(async () => {
      // If no updates in 30 seconds, try to become leader
      const timeSinceSync = Date.now() - syncState.lastSync;
      if (timeSinceSync > 30000) {
        await checkAndClaimLeadership();
      }
    }, 15000);

    return () => clearInterval(checkInterval);
  }, [syncState.lastSync, checkAndClaimLeadership]);

  return {
    isLeader: syncState.isLeader,
    viewerCount: syncState.viewerCount,
    isSyncing: syncState.isSyncing,
  };
}
