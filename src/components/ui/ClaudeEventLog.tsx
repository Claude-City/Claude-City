'use client';

/**
 * Claude Event Log
 * A floating log that shows Claude's governance decisions in real-time
 */

import React, { useState, useEffect, useRef } from 'react';
import { useGovernor } from '@/context/GovernorContext';
import { Scroll, ChevronDown, ChevronUp, X } from 'lucide-react';

// Format time ago
function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function ClaudeEventLog() {
  const { events } = useGovernor();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to newest events
  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events, isExpanded]);
  
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-40 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-400 hover:bg-slate-800 transition-colors flex items-center gap-2"
      >
        <Scroll className="w-4 h-4" />
        Show Governor Log
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 w-96 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl z-40 font-mono text-sm">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-800/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Scroll className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Governor Log</span>
          <span className="text-xs text-slate-500">({events.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200"
          >
            <X className="w-3 h-3" />
          </button>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
      
      {isExpanded && (
        <div 
          ref={scrollRef}
          className="max-h-64 overflow-y-auto p-2 space-y-2"
        >
          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <Scroll className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No governance events yet.</p>
              <p className="mt-1">Claude is observing the city...</p>
            </div>
          ) : (
            events.slice(0, 15).map((event) => (
              <div 
                key={event.id}
                className={`p-2 rounded border-l-2 ${
                  event.type === 'error' 
                    ? 'bg-red-900/20 border-red-500 text-red-200'
                    : event.type === 'warning'
                    ? 'bg-amber-900/20 border-amber-500 text-amber-200'
                    : event.decision?.type === 'observe'
                    ? 'bg-slate-800/30 border-slate-500 text-slate-300'
                    : 'bg-cyan-900/20 border-cyan-500 text-cyan-100'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] uppercase font-bold ${
                    event.type === 'error' ? 'text-red-400' :
                    event.type === 'warning' ? 'text-amber-400' :
                    event.decision?.type === 'observe' ? 'text-slate-400' :
                    'text-cyan-400'
                  }`}>
                    {event.decision?.type || event.type}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {timeAgo(event.timestamp)}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">
                  {event.message.replace('CLAUDE: ', '')}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
