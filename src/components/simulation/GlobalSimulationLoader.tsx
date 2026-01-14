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
import '@/styles/theme.css';

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
            // We're the host - create and save new city
            console.log('🖥️ Becoming HOST - this browser will run Claude...');
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
            // Not host, wait for host to create simulation
            console.log('⏳ Waiting for host to start simulation...');
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
      connecting: 'Connecting...',
      loading: 'Loading simulation...',
      creating: 'Creating city...',
      saving: 'Saving...',
      waiting: 'Waiting for host...',
      retrying: `Retry ${retryCount}/30`,
      ready: 'Ready!',
      error: errorMessage || 'Connection failed',
    };

    const isError = status === 'error';

    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-white/5">
              <Brain className={`w-10 h-10 text-[#5eead4] ${!isError ? 'animate-pulse' : ''}`} />
            </div>
            {!isError ? (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center bg-[#14161b] border border-white/10">
                <Loader2 className="w-4 h-4 animate-spin text-white/50" />
              </div>
            ) : (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center bg-[#f87171]/10 border border-[#f87171]/20">
                <WifiOff className="w-4 h-4 text-[#f87171]" />
              </div>
            )}
          </div>
          
          <div className="text-center">
            <h1 className="text-xl font-medium text-white/90 mb-2">Claude City</h1>
            <p className={`text-sm ${isError ? 'text-[#f87171]' : 'text-white/40'}`}>
              {statusMessages[status]}
            </p>
            
            {!isError && (
              <div className="mt-4 flex items-center justify-center gap-2 text-white/30 text-xs">
                <Wifi className="w-3 h-3 animate-pulse" />
                <span>Syncing</span>
              </div>
            )}
            
            {isError && (
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-lg text-sm bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
          
          {!isError && (
            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#5eead4]/50 transition-all duration-500 rounded-full"
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
