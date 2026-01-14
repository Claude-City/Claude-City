'use client';

/**
 * Claude Mind Panel - Clean minimal style
 */

import React from 'react';
import { useGovernor } from '@/context/GovernorContext';
import { Brain, Target, Eye, AlertTriangle, Zap, Activity } from 'lucide-react';

const STYLE_INFO: Record<string, { text: string; color: string }> = {
  authoritarian: { text: 'Active', color: '#f87171' },
  libertarian: { text: 'Minimal', color: '#4ade80' },
  balanced: { text: 'Balanced', color: '#60a5fa' },
  reactive: { text: 'Reactive', color: '#fbbf24' },
  emerging: { text: 'Learning', color: '#5eead4' },
};

export function ClaudeMindPanelSimulation() {
  const { governorState } = useGovernor();
  const style = STYLE_INFO[governorState.governanceStyle] || STYLE_INFO.emerging;
  
  const totalActions = governorState.interventionCount + governorState.restraintCount;
  const ratio = totalActions > 0 ? Math.round((governorState.interventionCount / totalActions) * 100) : 50;
  
  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2.5 mb-2">
          <div className={`p-1.5 rounded-lg bg-[#5eead4]/10 ${governorState.isThinking ? 'animate-pulse' : ''}`}>
            <Brain className="w-4 h-4 text-[#5eead4]" />
          </div>
          <div>
            <div className="text-sm font-medium text-white/90">Claude&apos;s Mind</div>
            <div className="text-[10px]" style={{ color: style.color }}>{style.text}</div>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span>Decisions</span>
          <span className="text-white/70">{governorState.totalDecisions}</span>
        </div>
      </div>
      
      {/* Goals */}
      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-3.5 h-3.5 text-[#4ade80]" />
          <span className="text-[11px] font-medium text-[#4ade80]">Goal</span>
        </div>
        {governorState.currentGoals.length > 0 ? (
          <div className="space-y-1.5">
            {governorState.currentGoals.map((goal, i) => (
              <p key={i} className="text-xs text-white/70 leading-relaxed pl-5">
                {goal}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/30 italic pl-5">Planning...</p>
        )}
      </div>
      
      {/* Observations */}
      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-3.5 h-3.5 text-[#60a5fa]" />
          <span className="text-[11px] font-medium text-[#60a5fa]">Observations</span>
        </div>
        {governorState.observations.length > 0 ? (
          <ul className="space-y-1.5">
            {governorState.observations.slice(-3).map((obs, i) => (
              <li key={i} className="text-xs text-white/60 leading-relaxed pl-5 flex gap-2">
                <span className="text-[#60a5fa]/50">•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-white/30 italic pl-5">Analyzing...</p>
        )}
      </div>
      
      {/* Concerns */}
      {governorState.concerns.length > 0 && (
        <div className="p-3 rounded-lg bg-[#fbbf24]/5 border border-[#fbbf24]/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span className="text-[11px] font-medium text-[#fbbf24]">Concerns</span>
          </div>
          <ul className="space-y-1.5">
            {governorState.concerns.map((c, i) => (
              <li key={i} className="text-xs text-white/70 leading-relaxed pl-5 flex gap-2">
                <span className="text-[#fbbf24]/60">!</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Last Decision */}
      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-3.5 h-3.5 text-[#5eead4]" />
          <span className="text-[11px] font-medium text-[#5eead4]">Last Action</span>
        </div>
        {governorState.lastDecision ? (
          <div className="pl-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                governorState.lastDecision.type === 'build' ? 'bg-[#4ade80]/10 text-[#4ade80]' :
                governorState.lastDecision.type === 'zone' ? 'bg-[#60a5fa]/10 text-[#60a5fa]' :
                'bg-white/5 text-white/50'
              }`}>
                {governorState.lastDecision.type.toUpperCase()}
              </span>
              {governorState.lastDecision.target && (
                <span className="text-xs text-white/40">{governorState.lastDecision.target}</span>
              )}
            </div>
            <p className="text-xs text-white/50 leading-relaxed">{governorState.reasoning}</p>
          </div>
        ) : (
          <p className="text-xs text-white/30 italic pl-5">Waiting...</p>
        )}
      </div>
      
      {/* Stats */}
      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5 text-white/40" />
          <span className="text-[11px] font-medium text-white/40">Style</span>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-white/40 mb-1">
            <span>Intervention</span>
            <span>{ratio}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${ratio}%`,
                background: 'linear-gradient(90deg, #4ade80, #60a5fa, #f87171)'
              }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-white/[0.03] rounded p-2">
            <div className="text-white/40">Active</div>
            <div className="text-white/80 font-medium">{governorState.interventionCount}</div>
          </div>
          <div className="bg-white/[0.03] rounded p-2">
            <div className="text-white/40">Passive</div>
            <div className="text-white/80 font-medium">{governorState.restraintCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
