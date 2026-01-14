'use client';

/**
 * Global Simulation Loader
 * MANDATORY global sync - waits until connected, no local fallback
 * Everyone sees the SAME simulation or nothing
 */

import React, { useEffect, useState, useRef } from 'react';
import { GameProvider } from '@/context/GameContext';
import { GovernorProvider } from '@/context/GovernorContext';
import { SimulationView } from './SimulationView';
import { loadGlobalState, saveGlobalState, checkLeadership } from '@/lib/global-state';
import { GameState } from '@/types/game';
import { generateRandomAdvancedCity, DEFAULT_GRID_SIZE } from '@/lib/simulation';
import { Brain, Loader2, Wifi, WifiOff } from 'lucide-react';

type LoadingStatus = 
  | 'connecting'
  | 'loading'
  | 'creating'
  | 'saving'
  | 'waiting'
  | 'retrying'
  | 'ready'
  | 'error';

export function GlobalSimulationLoader() {
  const [initialState, setInitialState] = useState<GameState | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [status, setStatus] = useState<LoadingStatus>('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    async function initializeSimulation() {
      const MAX_RETRIES = 30; // Try for 60 seconds (2s intervals)
      
      while (mountedRef.current && retryCount < MAX_RETRIES) {
        try {
          setStatus('loading');
          console.log(`🌐 Attempt ${retryCount + 1}: Checking for global simulation...`);
          
          // Try to load existing global state
          const globalState = await loadGlobalState();
          
          if (globalState && globalState.tick > 0) {
            // Found existing simulation - use it!
            console.log('📡 Connected to global simulation! Pop:', globalState.stats.population);
            setInitialState(globalState);
            setIsLeader(false);
            setStatus('ready');
            return; // Success!
          }
          
          // No global state exists yet
          setStatus('creating');
          console.log('📭 No global simulation found, checking leadership...');
          
          const { isLeader: shouldLead } = await checkLeadership();
          
          if (shouldLead) {
            // We're the leader - create and save new city
            console.log('👑 Becoming leader, creating new simulation...');
            setStatus('saving');
            
            const newCity = generateRandomAdvancedCity(DEFAULT_GRID_SIZE, 'Claude City');
            const saved = await saveGlobalState(newCity);
            
            if (saved) {
              console.log('✅ New simulation created and saved!');
              setInitialState(newCity);
              setIsLeader(true);
              setStatus('ready');
              return; // Success!
            } else {
              console.log('❌ Failed to save, will retry...');
            }
          } else {
            // Not leader, wait for leader to create simulation
            console.log('⏳ Waiting for leader to create simulation...');
            setStatus('waiting');
          }
          
          // Wait before retrying
          setStatus('retrying');
          setRetryCount(prev => prev + 1);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (err) {
          console.error('❌ Connection error:', err);
          setErrorMessage(err instanceof Error ? err.message : 'Connection failed');
          setStatus('retrying');
          setRetryCount(prev => prev + 1);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Max retries reached
      if (mountedRef.current) {
        setStatus('error');
        setErrorMessage('Could not connect to global simulation after 60 seconds');
      }
    }

    initializeSimulation();
    
    return () => {
      mountedRef.current = false;
    };
  }, []); // Only run once on mount

  // Loading screen with status
  if (status !== 'ready') {
    const statusMessages: Record<LoadingStatus, string> = {
      connecting: 'Connecting to server...',
      loading: 'Loading global simulation...',
      creating: 'Creating new simulation...',
      saving: 'Saving to cloud...',
      waiting: 'Waiting for simulation host...',
      retrying: `Retrying... (${retryCount}/30)`,
      ready: 'Ready!',
      error: errorMessage || 'Connection failed',
    };

    const isError = status === 'error';

    return (
      <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Brain className="w-20 h-20 text-cyan-400" />
            {!isError ? (
              <Loader2 className="w-10 h-10 text-cyan-300 animate-spin absolute -bottom-2 -right-2" />
            ) : (
              <WifiOff className="w-10 h-10 text-red-400 absolute -bottom-2 -right-2" />
            )}
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-light text-white mb-3">Claude City</h1>
            <p className={`text-lg ${isError ? 'text-red-400' : 'text-slate-400'}`}>
              {statusMessages[status]}
            </p>
            
            {!isError && (
              <div className="mt-4 flex items-center justify-center gap-2 text-slate-500">
                <Wifi className="w-4 h-4 animate-pulse" />
                <span className="text-sm">Syncing with global simulation</span>
              </div>
            )}
            
            {isError && (
              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
              >
                Retry Connection
              </button>
            )}
          </div>
          
          {/* Progress bar */}
          {!isError && (
            <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
              <div 
                className="h-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${Math.min((retryCount / 30) * 100 + 10, 95)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
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
