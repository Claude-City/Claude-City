'use client';

/**
 * Simulation Event Feed - Premium Edition
 * Gold linework theme with elegant event cards
 */

import React, { useRef, useEffect } from 'react';
import { useGovernor } from '@/context/GovernorContext';
import { Panel } from '@/components/ui/premium';
import { Scroll, Building, MapPin, Percent, FileText, Eye, AlertCircle, Activity } from 'lucide-react';

function formatTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function getDecisionIcon(type: string) {
  switch (type) {
    case 'build': return Building;
    case 'zone': return MapPin;
    case 'tax': return Percent;
    case 'policy': return FileText;
    case 'observe': return Eye;
    default: return AlertCircle;
  }
}

function getDecisionStyle(type: string) {
  switch (type) {
    case 'build': return {
      color: 'var(--stat-money)',
      bg: 'rgba(74, 222, 128, 0.08)',
      border: 'rgba(74, 222, 128, 0.2)',
      accent: 'var(--stat-money)'
    };
    case 'zone': return {
      color: 'var(--stat-population)',
      bg: 'rgba(96, 165, 250, 0.08)',
      border: 'rgba(96, 165, 250, 0.2)',
      accent: 'var(--stat-population)'
    };
    case 'tax': return {
      color: 'var(--stat-warning)',
      bg: 'rgba(251, 191, 36, 0.08)',
      border: 'rgba(251, 191, 36, 0.2)',
      accent: 'var(--stat-warning)'
    };
    case 'policy': return {
      color: 'var(--teal-0)',
      bg: 'rgba(127, 231, 225, 0.08)',
      border: 'rgba(127, 231, 225, 0.2)',
      accent: 'var(--teal-0)'
    };
    case 'allocate': return {
      color: 'var(--teal-1)',
      bg: 'rgba(31, 189, 180, 0.08)',
      border: 'rgba(31, 189, 180, 0.2)',
      accent: 'var(--teal-1)'
    };
    default: return {
      color: 'var(--text-1)',
      bg: 'rgba(148, 163, 184, 0.05)',
      border: 'rgba(148, 163, 184, 0.15)',
      accent: 'var(--gold-2)'
    };
  }
}

export function SimulationEventFeed() {
  const { events, governorState } = useGovernor();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length]);
  
  return (
    <div className="flex flex-col h-full p-3">
      {/* Header */}
      <Panel className="!p-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: 'var(--gold-0)' }} />
            <span 
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--gold-0)' }}>
              Decision Feed
            </span>
          </div>
          <span 
            className="text-xs px-2 py-0.5 rounded"
            style={{ 
              color: 'var(--text-1)',
              background: 'var(--bg-2)'
            }}>
            {events.length} events
          </span>
        </div>
      </Panel>
      
      {/* Event List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 gold-scrollbar"
      >
        {/* Thinking indicator */}
        {governorState.isThinking && (
          <div 
            className="p-3 rounded-xl animate-pulse"
            style={{ 
              background: 'linear-gradient(180deg, rgba(127, 231, 225, 0.1) 0%, rgba(127, 231, 225, 0.05) 100%)',
              border: '1px solid rgba(127, 231, 225, 0.2)'
            }}>
            <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--teal-0)' }}>
              <div 
                className="w-2 h-2 rounded-full animate-ping"
                style={{ background: 'var(--teal-0)' }} 
              />
              Claude is analyzing the city...
            </div>
          </div>
        )}
        
        {events.length === 0 && !governorState.isThinking ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Scroll className="w-10 h-10 mb-3" style={{ color: 'var(--gold-2)', opacity: 0.3 }} />
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Waiting for first decision...
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-2)', opacity: 0.6 }}>
              Claude is observing the city
            </p>
          </div>
        ) : (
          events.map((event) => {
            const Icon = getDecisionIcon(event.decision?.type || event.type);
            const style = getDecisionStyle(event.decision?.type || event.type);
            
            return (
              <div
                key={event.id}
                className="p-3 rounded-xl transition-all duration-300 relative overflow-hidden"
                style={{ 
                  background: style.bg,
                  border: `1px solid ${style.border}`
                }}
              >
                {/* Left accent line */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-0.5"
                  style={{ background: style.accent }}
                />
                
                {/* Header */}
                <div className="flex items-start justify-between mb-2 pl-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: style.color }} />
                    <span 
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: style.color }}>
                      {event.decision?.type || event.type}
                    </span>
                    {event.decision?.target && (
                      <span className="text-xs" style={{ color: 'var(--text-1)' }}>
                        → {event.decision.target}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--text-2)' }}>
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                
                {/* Reasoning */}
                <p 
                  className="text-xs leading-relaxed pl-2"
                  style={{ color: 'var(--text-1)' }}>
                  {event.message.replace('CLAUDE: ', '').replace(/^[A-Za-z]+ [a-z]+\. /, '')}
                </p>
                
                {/* Tick indicator */}
                <div 
                  className="mt-2 text-[10px] pl-2"
                  style={{ color: 'var(--text-2)', opacity: 0.5 }}>
                  Tick #{event.tick}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
