'use client';

/**
 * Claude Mind Panel for Simulation
 * Shows Claude's thought process in a more prominent way
 */

import React from 'react';
import { useGovernor } from '@/context/GovernorContext';
import { Brain, Target, Eye, AlertTriangle, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Style descriptions
const STYLE_DESCRIPTIONS: Record<string, { text: string; color: string }> = {
  authoritarian: { text: 'Active Interventionist', color: 'text-red-400' },
  libertarian: { text: 'Minimal Intervention', color: 'text-green-400' },
  balanced: { text: 'Balanced Approach', color: 'text-blue-400' },
  reactive: { text: 'Reactive Governance', color: 'text-yellow-400' },
  emerging: { text: 'Developing Style', color: 'text-purple-400' },
};

export function ClaudeMindPanelSimulation() {
  const { governorState, forceDecision } = useGovernor();
  
  const styleInfo = STYLE_DESCRIPTIONS[governorState.governanceStyle] || STYLE_DESCRIPTIONS.emerging;
  
  // Calculate intervention ratio
  const totalActions = governorState.interventionCount + governorState.restraintCount;
  const interventionRatio = totalActions > 0 
    ? Math.round((governorState.interventionCount / totalActions) * 100) 
    : 50;
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <Brain className={`w-5 h-5 ${governorState.isThinking ? 'text-cyan-400 animate-pulse' : 'text-cyan-500'}`} />
          <h2 className="font-semibold text-white">Claude&apos;s Mind</h2>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className={styleInfo.color}>{styleInfo.text}</span>
          <span className="text-slate-500">{governorState.totalDecisions} decisions</span>
        </div>
      </div>
      
      {/* Current Goals */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-sm font-medium">Current Goal</span>
        </div>
        {governorState.currentGoals.length > 0 ? (
          <div className="space-y-2">
            {governorState.currentGoals.map((goal, i) => (
              <p key={i} className="text-white text-sm leading-relaxed pl-6">
                {goal}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm italic pl-6">Formulating strategy...</p>
        )}
      </div>
      
      {/* Observations */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-blue-400" />
          <span className="text-blue-400 text-sm font-medium">Observations</span>
        </div>
        {governorState.observations.length > 0 ? (
          <ul className="space-y-2">
            {governorState.observations.slice(-3).map((obs, i) => (
              <li key={i} className="text-slate-300 text-sm leading-relaxed pl-6 flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm italic pl-6">Analyzing city data...</p>
        )}
      </div>
      
      {/* Concerns */}
      {governorState.concerns.length > 0 && (
        <div className="p-4 border-b border-slate-800 bg-amber-900/10">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Concerns</span>
          </div>
          <ul className="space-y-2">
            {governorState.concerns.map((concern, i) => (
              <li key={i} className="text-amber-200 text-sm leading-relaxed pl-6 flex items-start gap-2">
                <span className="text-amber-500 mt-1">⚠</span>
                <span>{concern}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Last Decision */}
      <div className="p-4 border-b border-slate-800 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="text-purple-400 text-sm font-medium">Last Decision</span>
        </div>
        {governorState.lastDecision ? (
          <div className="space-y-3 pl-6">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                governorState.lastDecision.type === 'observe' 
                  ? 'bg-slate-700 text-slate-300'
                  : governorState.lastDecision.type === 'build'
                  ? 'bg-emerald-900/50 text-emerald-300'
                  : governorState.lastDecision.type === 'zone'
                  ? 'bg-blue-900/50 text-blue-300'
                  : 'bg-purple-900/50 text-purple-300'
              }`}>
                {governorState.lastDecision.type}
              </span>
              {governorState.lastDecision.target && (
                <span className="text-slate-400 text-sm">
                  {governorState.lastDecision.target}
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {governorState.reasoning}
            </p>
          </div>
        ) : (
          <p className="text-slate-500 text-sm italic pl-6">Awaiting first decision...</p>
        )}
      </div>
      
      {/* Governance Stats */}
      <div className="p-4 bg-slate-800/30">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Intervention Tendency</span>
          <span>{interventionRatio}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-red-500 transition-all duration-500"
            style={{ width: `${interventionRatio}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>Hands-off</span>
          <span>Balanced</span>
          <span>Active</span>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/50 rounded p-2">
            <div className="text-slate-500">Interventions</div>
            <div className="text-white font-medium">{governorState.interventionCount}</div>
          </div>
          <div className="bg-slate-800/50 rounded p-2">
            <div className="text-slate-500">Restraints</div>
            <div className="text-white font-medium">{governorState.restraintCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
