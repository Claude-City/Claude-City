'use client';

/**
 * Simulation Event Feed
 * Shows a live feed of Claude's governance decisions
 */

import React, { useRef, useEffect } from 'react';
import { useGovernor } from '@/context/GovernorContext';
import { Scroll, Building, MapPin, Percent, FileText, Eye, AlertCircle } from 'lucide-react';

// Format relative time
function formatTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// Get icon for decision type
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

// Get color for decision type
function getDecisionColor(type: string) {
  switch (type) {
    case 'build': return 'text-emerald-400 bg-emerald-900/20 border-emerald-500/30';
    case 'zone': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
    case 'tax': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
    case 'policy': return 'text-purple-400 bg-purple-900/20 border-purple-500/30';
    case 'allocate': return 'text-cyan-400 bg-cyan-900/20 border-cyan-500/30';
    case 'observe': return 'text-slate-400 bg-slate-800/50 border-slate-600/30';
    default: return 'text-slate-400 bg-slate-800/50 border-slate-600/30';
  }
}

export function SimulationEventFeed() {
  const { events, governorState } = useGovernor();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Scroll className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-medium text-white">Decision Feed</h3>
          <span className="text-xs text-slate-500 ml-auto">{events.length} events</span>
        </div>
      </div>
      
      {/* Event List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-2"
      >
        {/* Thinking indicator */}
        {governorState.isThinking && (
          <div className="p-3 rounded-lg bg-cyan-900/20 border border-cyan-500/30 animate-pulse">
            <div className="flex items-center gap-2 text-sm text-cyan-300">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Claude is analyzing the city...
            </div>
          </div>
        )}
        
        {events.length === 0 && !governorState.isThinking ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Scroll className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Waiting for first decision...</p>
            <p className="text-xs mt-1 opacity-60">Claude is observing the city</p>
          </div>
        ) : (
          events.map((event) => {
            const Icon = getDecisionIcon(event.decision?.type || event.type);
            const colorClass = getDecisionColor(event.decision?.type || event.type);
            
            return (
              <div
                key={event.id}
                className={`p-3 rounded-lg border ${colorClass} transition-all duration-300`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {event.decision?.type || event.type}
                    </span>
                    {event.decision?.target && (
                      <span className="text-xs opacity-70">
                        → {event.decision.target}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] opacity-50">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                
                {/* Reasoning */}
                <p className="text-xs leading-relaxed opacity-90">
                  {event.message.replace('CLAUDE: ', '').replace(/^[A-Za-z]+ [a-z]+\. /, '')}
                </p>
                
                {/* Tick indicator */}
                <div className="mt-2 text-[10px] opacity-40">
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
