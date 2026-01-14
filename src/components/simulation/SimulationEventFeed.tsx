'use client';

/**
 * Simulation Event Feed - Clean minimal style
 */

import React, { useRef, useEffect } from 'react';
import { useGovernor } from '@/context/GovernorContext';
import { Scroll, Building, MapPin, Percent, FileText, Eye, AlertCircle, Activity } from 'lucide-react';

function formatTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return 'now';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

const ICONS: Record<string, React.ElementType> = {
  build: Building,
  zone: MapPin,
  tax: Percent,
  policy: FileText,
  observe: Eye,
};

const COLORS: Record<string, string> = {
  build: '#4ade80',
  zone: '#60a5fa',
  tax: '#fbbf24',
  policy: '#5eead4',
  allocate: '#5eead4',
  observe: 'rgba(255,255,255,0.4)',
};

export function SimulationEventFeed() {
  const { events, governorState } = useGovernor();
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [events.length]);
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-white/40" />
            <span className="text-[11px] font-medium text-white/40">Feed</span>
          </div>
          <span className="text-[10px] text-white/30">{events.length}</span>
        </div>
      </div>
      
      {/* Events */}
      <div ref={ref} className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 gold-scrollbar">
        {governorState.isThinking && (
          <div className="p-2.5 rounded-lg bg-[#5eead4]/5 border border-[#5eead4]/10 animate-pulse">
            <div className="flex items-center gap-2 text-[11px] text-[#5eead4]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#5eead4] animate-ping" />
              Analyzing...
            </div>
          </div>
        )}
        
        {events.length === 0 && !governorState.isThinking ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Scroll className="w-6 h-6 text-white/10 mb-2" />
            <p className="text-[11px] text-white/30">Waiting...</p>
          </div>
        ) : (
          events.map((e) => {
            const type = e.decision?.type || e.type;
            const Icon = ICONS[type] || AlertCircle;
            const color = COLORS[type] || COLORS.observe;
            
            return (
              <div
                key={e.id}
                className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 relative overflow-hidden"
              >
                {/* Accent */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: color }} />
                
                {/* Content */}
                <div className="pl-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3 h-3" style={{ color }} />
                      <span className="text-[10px] font-medium uppercase" style={{ color }}>
                        {type}
                      </span>
                      {e.decision?.target && (
                        <span className="text-[10px] text-white/30">→ {e.decision.target}</span>
                      )}
                    </div>
                    <span className="text-[9px] text-white/20">{formatTime(e.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    {e.message.replace('CLAUDE: ', '').replace(/^[A-Za-z]+ [a-z]+\. /, '')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
