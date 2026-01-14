'use client';

/**
 * Simulation View
 * Clean, subtle dark UI for the city simulation
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
import { TooltipProvider } from '@/components/ui/tooltip';
import { Brain, Clock, Users, Radio, FastForward } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface SimulationViewProps {
  initialIsLeader?: boolean;
}

export function SimulationView({ initialIsLeader = false }: SimulationViewProps) {
  const { state, setSpeed, setDayNightMode } = useGame();
  const { governorState, setEnabled, forceDecision } = useGovernor();
  const [navigationTarget, setNavigationTarget] = useState<{ x: number; y: number } | null>(null);
  
  const { isLeader, viewerCount } = useGlobalSync(initialIsLeader);
  
  useClaudeDecisions();
  useDisasterEffects();
  
  useEffect(() => {
    const handleBuildLocation = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      if (customEvent.detail && typeof customEvent.detail.x === 'number') {
        setNavigationTarget({ x: customEvent.detail.x, y: customEvent.detail.y });
      }
    };
    
    window.addEventListener('claude-build-location', handleBuildLocation);
    return () => window.removeEventListener('claude-build-location', handleBuildLocation);
  }, []);
  
  useEffect(() => {
    setDayNightMode('day');
    
    if (isLeader) {
      setSpeed(3);
      setEnabled(true);
    } else {
      setSpeed(0);
      setEnabled(false);
    }
  }, [isLeader, setSpeed, setEnabled, setDayNightMode]);
  
  useEffect(() => {
    if (!isLeader) return;
    
    // Rapid-fire initial decisions to build city quickly
    const timers = [
      setTimeout(() => forceDecision(), 500),
      setTimeout(() => forceDecision(), 1500),
      setTimeout(() => forceDecision(), 2500),
      setTimeout(() => forceDecision(), 3500),
      setTimeout(() => forceDecision(), 4500),
      setTimeout(() => forceDecision(), 5500),
      setTimeout(() => forceDecision(), 6500),
      setTimeout(() => forceDecision(), 7500),
      setTimeout(() => forceDecision(), 8500),
      setTimeout(() => forceDecision(), 9500),
      setTimeout(() => forceDecision(), 11000),
      setTimeout(() => forceDecision(), 13000),
      setTimeout(() => forceDecision(), 15000),
      setTimeout(() => forceDecision(), 18000),
      setTimeout(() => forceDecision(), 22000),
    ];
    
    return () => timers.forEach(t => clearTimeout(t));
  }, [isLeader, forceDecision]);
  
  return (
    <TooltipProvider>
      <div className="w-full h-screen overflow-hidden flex flex-col bg-[#0a0a0c]">
        {/* Top Bar - minimal */}
        <header className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#0f1014]/80 backdrop-blur-sm z-50">
          {/* Left - Logo & Title */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Claude City" 
              className="w-7 h-7 opacity-90"
            />
            <span className="text-sm font-medium text-white/90">Claude City</span>
            <span className="text-[10px] text-white/30 px-2 py-0.5 rounded bg-white/5">
              SIMULATION
            </span>
          </div>
          
          {/* Center - Stats */}
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-white/40">Pop</span>
              <span className="font-semibold text-[#60a5fa]">{state.stats.population.toLocaleString()}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-white/40">Treasury</span>
              <span className="font-semibold text-[#4ade80]">${state.stats.money.toLocaleString()}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-white/40">Happy</span>
              <span className={`font-semibold ${state.stats.happiness > 60 ? 'text-[#4ade80]' : state.stats.happiness > 40 ? 'text-[#fbbf24]' : 'text-[#f87171]'}`}>
                {Math.round(state.stats.happiness)}%
              </span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-white/50">
              <Clock className="w-3 h-3" />
              <span>{MONTH_NAMES[state.month - 1]} {state.year}</span>
            </div>
          </div>
          
          {/* Right - Controls & Status */}
          <div className="flex items-center gap-3">
            {/* Speed indicator */}
            <div className="flex items-center gap-1.5 text-white/30 text-xs">
              <FastForward className="w-3 h-3" />
              <span>5x</span>
            </div>
            
            {/* Viewers */}
            <div className="flex items-center gap-1.5 text-white/40 text-xs">
              <Users className="w-3 h-3" />
              <span className="text-white/70">{viewerCount}</span>
            </div>
            
            {/* Status */}
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
              isLeader 
                ? 'bg-[#4ade80]/10 text-[#4ade80]' 
                : 'bg-[#5eead4]/10 text-[#5eead4]'
            }`}>
              <Radio className="w-2.5 h-2.5" />
              <span className="font-medium">{isLeader ? 'HOST' : 'SYNC'}</span>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex-1 relative flex overflow-hidden">
          {/* Left Panel */}
          <aside className="w-72 border-r border-white/5 bg-[#0f1014]/50 backdrop-blur-sm overflow-y-auto gold-scrollbar">
            <ClaudeMindPanelSimulation />
          </aside>
          
          {/* Center - City */}
          <main className="flex-1 relative bg-[#0a0a0c]">
            <CanvasIsometricGrid 
              overlayMode="none"
              selectedTile={null}
              setSelectedTile={() => {}}
              isMobile={false}
              navigationTarget={navigationTarget}
              onNavigationComplete={() => {
                setTimeout(() => setNavigationTarget(null), 100);
              }}
            />
            
            {/* Thinking Indicator */}
            {governorState.isThinking && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14161b]/90 border border-white/10 backdrop-blur-sm">
                  <Brain className="w-3.5 h-3.5 text-[#5eead4] animate-pulse" />
                  <span className="text-xs text-[#5eead4]">Thinking...</span>
                </div>
              </div>
            )}
          </main>
          
          {/* Right Panel */}
          <aside className="w-72 border-l border-white/5 bg-[#0f1014]/50 backdrop-blur-sm flex flex-col overflow-hidden">
            <SimulationStats />
            <div className="flex-1 overflow-hidden">
              <SimulationEventFeed />
            </div>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}
