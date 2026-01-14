'use client';

/**
 * Simulation View
 * A spectator view of Claude's city governance.
 * No player controls - just watching Claude build.
 */

import React, { useEffect, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { useGovernor } from '@/context/GovernorContext';
import { useClaudeDecisions } from '@/hooks/useClaudeDecisions';
import { useDisasterEffects } from '@/hooks/useDisasterEffects';
import { useGlobalSync } from '@/hooks/useGlobalSync';
import { CanvasIsometricGrid } from '@/components/game/CanvasIsometricGrid';
import { ClaudeMindPanelSimulation } from './ClaudeMindPanelSimulation';
import { SimulationStats } from './SimulationStats';
import { SimulationEventFeed } from './SimulationEventFeed';
import { DisasterPanel } from './DisasterPanel';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Brain, Clock, Users, Radio } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface SimulationViewProps {
  initialIsLeader?: boolean;
}

export function SimulationView({ initialIsLeader = false }: SimulationViewProps) {
  const { state, setSpeed, setDayNightMode } = useGame();
  const { isEnabled, setEnabled, forceDecision, governorState } = useGovernor();
  const [navigationTarget, setNavigationTarget] = useState<{ x: number; y: number } | null>(null);
  
  // Global sync - ensures everyone sees the same simulation
  // Pass initialIsLeader to start with correct state
  const { isLeader, viewerCount } = useGlobalSync(initialIsLeader);
  
  // Listen for and apply Claude's decisions (only leader runs AI)
  useClaudeDecisions();
  
  // Listen for and apply disaster effects
  useDisasterEffects();
  
  // Listen for build locations to navigate camera
  useEffect(() => {
    const handleBuildLocation = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      if (customEvent.detail && typeof customEvent.detail.x === 'number') {
        setNavigationTarget({ x: customEvent.detail.x, y: customEvent.detail.y });
      }
    };
    
    window.addEventListener('claude-build-location', handleBuildLocation);
    return () => {
      window.removeEventListener('claude-build-location', handleBuildLocation);
    };
  }, []);
  
  // Auto-start the simulation - behavior depends on leader status
  useEffect(() => {
    // Force daytime - no dark/grey screen
    setDayNightMode('day');
    
    if (isLeader) {
      // Leader: runs simulation at full speed
      setSpeed(3);
      setEnabled(true);
      console.log('👑 Running as LEADER - simulation active');
    } else {
      // Follower: PAUSE local simulation - only receive updates from global
      setSpeed(0);
      setEnabled(false);
      console.log('👁️ Running as VIEWER - receiving updates from leader');
    }
  }, [isLeader, setSpeed, setEnabled, setDayNightMode]);
  
  // Leader only: Make Claude decisions
  useEffect(() => {
    if (!isLeader) return;
    
    // Make many decisions at start to build city infrastructure quickly
    const timers = [
      setTimeout(() => forceDecision(), 1000),
      setTimeout(() => forceDecision(), 3000),
      setTimeout(() => forceDecision(), 5000),
      setTimeout(() => forceDecision(), 7000),
      setTimeout(() => forceDecision(), 9000),
      setTimeout(() => forceDecision(), 11000),
      setTimeout(() => forceDecision(), 14000),
      setTimeout(() => forceDecision(), 17000),
      setTimeout(() => forceDecision(), 20000),
      setTimeout(() => forceDecision(), 24000),
    ];
    
    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [isLeader, forceDecision]);
  
  return (
    <TooltipProvider>
      <div className="w-full h-screen overflow-hidden bg-slate-950 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-4 z-50">
          {/* Left - Title with Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Claude City" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-light tracking-wide text-white/90">
              Claude City
            </h1>
            <span className="text-xs text-slate-500 border border-slate-700 px-2 py-0.5 rounded">
              SIMULATION
            </span>
          </div>
          
          {/* Center - Quick Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-slate-400">
              <span className="text-white font-medium">{state.stats.population.toLocaleString()}</span> pop
            </div>
            <div className="text-slate-400">
              <span className="text-emerald-400 font-medium">${state.stats.money.toLocaleString()}</span>
            </div>
            <div className="text-slate-400">
              <span className={`font-medium ${state.stats.happiness > 60 ? 'text-green-400' : state.stats.happiness > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                {Math.round(state.stats.happiness)}%
              </span> happy
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>
                <span className="text-white font-medium">{MONTH_NAMES[state.month - 1]} {state.year}</span>
                <span className="text-slate-500 mx-1.5">·</span>
                <span className="text-slate-300">
                  {state.hour === 0 ? '12' : state.hour > 12 ? state.hour - 12 : state.hour}:00 {state.hour >= 12 ? 'PM' : 'AM'}
                </span>
              </span>
            </div>
          </div>
          
          {/* Right - Viewer count & status */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-4 h-4" />
              <span className="text-white font-medium">{viewerCount}</span>
              <span className="text-slate-500">watching</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Radio className={`w-3 h-3 ${isLeader ? 'text-green-400' : 'text-cyan-400'}`} />
              <span className={`text-xs ${isLeader ? 'text-green-400' : 'text-cyan-400'}`}>
                {isLeader ? 'HOSTING' : 'SYNCED'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 relative flex">
          {/* Left Panel - Claude's Mind */}
          <div className="w-80 bg-slate-900/50 border-r border-slate-800 overflow-y-auto">
            <ClaudeMindPanelSimulation />
          </div>
          
          {/* Center - City View */}
          <div className="flex-1 relative">
            <CanvasIsometricGrid 
              overlayMode="none"
              selectedTile={null}
              setSelectedTile={() => {}}
              isMobile={false}
              navigationTarget={navigationTarget}
              onNavigationComplete={() => {
                // Small delay before clearing to ensure camera moved
                setTimeout(() => setNavigationTarget(null), 100);
              }}
            />
            
            {/* Thinking Indicator - subtle, doesn't block view */}
            {governorState.isThinking && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                <div className="bg-slate-900/80 border border-cyan-500/30 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
                  <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-cyan-300 text-sm">Claude is thinking...</span>
                </div>
              </div>
            )}
            
            {/* Disaster Panel - Spectator chaos controls */}
            <DisasterPanel />
          </div>
          
          {/* Right Panel - Stats & Events */}
          <div className="w-80 bg-slate-900/50 border-l border-slate-800 flex flex-col">
            <SimulationStats />
            <div className="flex-1 overflow-hidden">
              <SimulationEventFeed />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
