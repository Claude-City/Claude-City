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
      <div 
        className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'var(--bg-0)' }}>
        
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="loading-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="var(--gold-0)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#loading-grid)" />
          </svg>
        </div>
        
        {/* Horizon glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(231,210,178,0.05)_0%,transparent_60%)]" />
        
        <div className="flex flex-col items-center gap-8 relative z-10">
          <div className="relative">
            <div 
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--bg-1) 100%)',
                border: '1px solid var(--panel-border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 60px rgba(231,210,178,0.1)'
              }}>
              <Brain className="w-12 h-12" style={{ color: 'var(--teal-0)' }} />
            </div>
            {!isError ? (
              <div 
                className="absolute -bottom-3 -right-3 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'var(--bg-1)',
                  border: '1px solid var(--panel-border)'
                }}>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--gold-0)' }} />
              </div>
            ) : (
              <div 
                className="absolute -bottom-3 -right-3 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid rgba(248, 113, 113, 0.3)'
                }}>
                <WifiOff className="w-5 h-5" style={{ color: 'var(--stat-happiness)' }} />
              </div>
            )}
          </div>
          
          <div className="text-center">
            <h1 
              className="text-3xl font-light tracking-wide mb-3"
              style={{ color: 'var(--text-0)' }}>
              Claude City
            </h1>
            <p 
              className="text-base"
              style={{ color: isError ? 'var(--stat-happiness)' : 'var(--text-1)' }}>
              {statusMessages[status]}
            </p>
            
            {!isError && (
              <div 
                className="mt-5 flex items-center justify-center gap-2"
                style={{ color: 'var(--gold-1)' }}>
                <Wifi className="w-4 h-4 animate-pulse" />
                <span className="text-sm tracking-wide">Syncing with global simulation</span>
              </div>
            )}
            
            {isError && (
              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2.5 rounded-xl font-medium transition-all duration-300"
                style={{ 
                  background: 'linear-gradient(180deg, rgba(127, 231, 225, 0.15) 0%, rgba(127, 231, 225, 0.08) 100%)',
                  border: '1px solid rgba(127, 231, 225, 0.3)',
                  color: 'var(--teal-0)'
                }}>
                Retry Connection
              </button>
            )}
          </div>
          
          {/* Progress bar */}
          {!isError && (
            <div 
              className="w-72 h-1 rounded-full overflow-hidden"
              style={{ background: 'var(--bg-2)' }}>
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${Math.min((retryCount / 30) * 100 + 10, 95)}%`,
                  background: 'linear-gradient(90deg, var(--gold-2) 0%, var(--gold-0) 100%)'
                }}
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
