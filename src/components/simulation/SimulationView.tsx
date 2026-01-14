'use client';

/**
 * Simulation View - Premium Edition
 * Gold linework on black - elegant simulation console
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
import { Panel, LineworkOverlay, ShimmerOverlay } from '@/components/ui/premium';
import { Brain, Clock, Users, Radio, Zap } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface SimulationViewProps {
  initialIsLeader?: boolean;
}

export function SimulationView({ initialIsLeader = false }: SimulationViewProps) {
  const { state, setSpeed, setDayNightMode } = useGame();
  const { isEnabled, setEnabled, forceDecision, governorState } = useGovernor();
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
    
    return () => timers.forEach(t => clearTimeout(t));
  }, [isLeader, forceDecision]);
  
  return (
    <TooltipProvider>
      <div className="w-full h-screen overflow-hidden flex flex-col" style={{ background: 'var(--bg-0)' }}>
        {/* Premium Top Bar */}
        <header className="h-14 relative z-50 flex items-center justify-between px-5"
          style={{ 
            background: 'linear-gradient(180deg, var(--bg-1) 0%, var(--bg-0) 100%)',
            borderBottom: '1px solid var(--panel-border)'
          }}>
          {/* Subtle top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold-0)] to-transparent opacity-10" />
          
          {/* Left - Logo & Title */}
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="Claude City" 
              className="w-9 h-9 drop-shadow-[0_0_8px_rgba(231,210,178,0.3)]"
            />
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-light tracking-wide" style={{ color: 'var(--text-0)' }}>
                Claude City
              </h1>
              <span 
                className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded font-medium"
                style={{ 
                  color: 'var(--gold-0)',
                  background: 'rgba(191, 160, 122, 0.1)',
                  border: '1px solid rgba(191, 160, 122, 0.2)'
                }}>
                SIMULATION
              </span>
            </div>
          </div>
          
          {/* Center - Quick Stats */}
          <div className="flex items-center gap-1">
            {/* Population */}
            <div className="flex flex-col items-center px-4 py-1 border-r" style={{ borderColor: 'rgba(191, 160, 122, 0.1)' }}>
              <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: 'var(--text-2)' }}>
                Population
              </span>
              <span className="text-sm font-semibold stat-glow-population" style={{ color: 'var(--stat-population)' }}>
                {state.stats.population.toLocaleString()}
              </span>
            </div>
            
            {/* Treasury */}
            <div className="flex flex-col items-center px-4 py-1 border-r" style={{ borderColor: 'rgba(191, 160, 122, 0.1)' }}>
              <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: 'var(--text-2)' }}>
                Treasury
              </span>
              <span className="text-sm font-semibold stat-glow-money" style={{ color: 'var(--stat-money)' }}>
                ${state.stats.money.toLocaleString()}
              </span>
            </div>
            
            {/* Happiness */}
            <div className="flex flex-col items-center px-4 py-1 border-r" style={{ borderColor: 'rgba(191, 160, 122, 0.1)' }}>
              <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: 'var(--text-2)' }}>
                Happiness
              </span>
              <span 
                className="text-sm font-semibold"
                style={{ 
                  color: state.stats.happiness > 60 ? 'var(--stat-money)' : state.stats.happiness > 40 ? 'var(--stat-warning)' : 'var(--stat-happiness)',
                  textShadow: '0 0 12px rgba(248, 113, 113, 0.15)'
                }}>
                {Math.round(state.stats.happiness)}%
              </span>
            </div>
            
            {/* Date/Time */}
            <div className="flex flex-col items-center px-4 py-1">
              <span className="text-[9px] uppercase tracking-widest font-medium flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
                <Clock className="w-3 h-3" />
                Time
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-0)' }}>
                {MONTH_NAMES[state.month - 1]} {state.year}
                <span className="mx-1.5 opacity-30">·</span>
                <span style={{ color: 'var(--text-1)' }}>
                  {state.hour === 0 ? '12' : state.hour > 12 ? state.hour - 12 : state.hour}:00 {state.hour >= 12 ? 'PM' : 'AM'}
                </span>
              </span>
            </div>
          </div>
          
          {/* Right - Status */}
          <div className="flex items-center gap-4">
            {/* Viewers */}
            <div className="flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
              <Users className="w-4 h-4" style={{ color: 'var(--gold-1)' }} />
              <span className="font-semibold" style={{ color: 'var(--text-0)' }}>{viewerCount}</span>
              <span className="text-xs" style={{ color: 'var(--text-2)' }}>watching</span>
            </div>
            
            {/* Sync Status */}
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ 
                background: isLeader ? 'rgba(74, 222, 128, 0.1)' : 'rgba(127, 231, 225, 0.1)',
                border: `1px solid ${isLeader ? 'rgba(74, 222, 128, 0.3)' : 'rgba(127, 231, 225, 0.3)'}`
              }}>
              <Radio className="w-3 h-3" style={{ color: isLeader ? 'var(--stat-money)' : 'var(--teal-0)' }} />
              <span 
                className="text-xs font-semibold tracking-wide"
                style={{ color: isLeader ? 'var(--stat-money)' : 'var(--teal-0)' }}>
                {isLeader ? 'HOSTING' : 'SYNCED'}
              </span>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex-1 relative flex overflow-hidden">
          {/* Left Panel - Claude's Mind */}
          <aside 
            className="w-80 flex flex-col overflow-hidden"
            style={{ 
              background: 'linear-gradient(180deg, var(--bg-1) 0%, var(--bg-0) 100%)',
              borderRight: '1px solid var(--panel-border)'
            }}>
            <div className="flex-1 overflow-y-auto gold-scrollbar">
              <ClaudeMindPanelSimulation />
            </div>
          </aside>
          
          {/* Center - City View */}
          <main className="flex-1 relative">
            {/* Background linework pattern */}
            <LineworkOverlay variant="horizon" opacity={0.06} />
            <ShimmerOverlay />
            
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
            
            {/* Thinking Indicator - Premium style */}
            {governorState.isThinking && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                <div 
                  className="px-5 py-2.5 rounded-full flex items-center gap-3"
                  style={{ 
                    background: 'linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)',
                    border: '1px solid var(--panel-border)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 30px rgba(127, 231, 225, 0.1)'
                  }}>
                  <Brain className="w-5 h-5 animate-pulse" style={{ color: 'var(--teal-0)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--teal-0)' }}>
                    Claude is thinking...
                  </span>
                  <Zap className="w-4 h-4 animate-pulse" style={{ color: 'var(--gold-0)', opacity: 0.6 }} />
                </div>
              </div>
            )}
            
            {/* Disaster Panel */}
            <DisasterPanel />
          </main>
          
          {/* Right Panel - Stats & Events */}
          <aside 
            className="w-80 flex flex-col overflow-hidden"
            style={{ 
              background: 'linear-gradient(180deg, var(--bg-1) 0%, var(--bg-0) 100%)',
              borderLeft: '1px solid var(--panel-border)'
            }}>
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
