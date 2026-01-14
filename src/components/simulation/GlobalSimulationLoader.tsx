'use client';

/**
 * Global Simulation Loader
 * Ensures everyone sees the SAME simulation by loading global state first
 */

import React, { useEffect, useState } from 'react';
import { GameProvider } from '@/context/GameContext';
import { GovernorProvider } from '@/context/GovernorContext';
import { SimulationView } from './SimulationView';
import { loadGlobalState, saveGlobalState, checkLeadership } from '@/lib/global-state';
import { GameState } from '@/types/game';
import { generateRandomAdvancedCity, DEFAULT_GRID_SIZE } from '@/lib/simulation';
import { Brain, Loader2 } from 'lucide-react';

export function GlobalSimulationLoader() {
  const [initialState, setInitialState] = useState<GameState | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeSimulation() {
      try {
        console.log('🌐 Checking for global simulation...');
        
        // Try to load existing global state
        const globalState = await loadGlobalState();
        
        if (globalState && globalState.tick > 0) {
          // Found existing simulation - use it
          console.log('📡 Found global simulation! Population:', globalState.stats.population, 'Tick:', globalState.tick);
          setInitialState(globalState);
          setIsLeader(false);
        } else {
          // No global state - check if we should be leader
          const { isLeader: shouldLead } = await checkLeadership();
          
          if (shouldLead) {
            // We're the first one - create new city and save it
            console.log('🆕 No simulation exists. Creating new city as LEADER...');
            const newCity = generateRandomAdvancedCity(DEFAULT_GRID_SIZE, 'Claude City');
            
            // Save to global immediately
            const saved = await saveGlobalState(newCity);
            console.log('💾 Saved new city to global:', saved);
            
            setInitialState(newCity);
            setIsLeader(true);
          } else {
            // Someone else is leader but no state yet - wait and retry
            console.log('⏳ Waiting for leader to create simulation...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const retryState = await loadGlobalState();
            if (retryState) {
              setInitialState(retryState);
              setIsLeader(false);
            } else {
              // Still nothing - create locally
              console.log('⚠️ No global state available, creating local simulation');
              setInitialState(generateRandomAdvancedCity(DEFAULT_GRID_SIZE, 'Claude City'));
              setIsLeader(true);
            }
          }
        }
      } catch (err) {
        console.error('❌ Error initializing simulation:', err);
        setError('Failed to connect to global simulation. Starting local...');
        // Fallback to local
        setInitialState(generateRandomAdvancedCity(DEFAULT_GRID_SIZE, 'Claude City'));
        setIsLeader(true);
      } finally {
        setIsLoading(false);
      }
    }

    initializeSimulation();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Brain className="w-16 h-16 text-cyan-400" />
            <Loader2 className="w-8 h-8 text-cyan-300 animate-spin absolute -bottom-1 -right-1" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-light text-white mb-2">Claude City</h1>
            <p className="text-slate-400">Connecting to global simulation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.warn(error);
  }

  if (!initialState) {
    return (
      <div className="w-full h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-red-400">Failed to initialize simulation</p>
      </div>
    );
  }

  return (
    <GameProvider 
      startFresh={true} 
      startWithGeneratedCity={false}
      initialState={initialState}
    >
      <GovernorProvider>
        <SimulationView initialIsLeader={isLeader} />
      </GovernorProvider>
    </GameProvider>
  );
}
