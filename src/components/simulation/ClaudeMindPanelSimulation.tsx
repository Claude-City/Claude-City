'use client';

/**
 * Claude Mind Panel - Premium Edition
 * Gold linework theme with elegant typography
 */

import React from 'react';
import { useGovernor } from '@/context/GovernorContext';
import { Panel, PanelHeader, PanelDivider } from '@/components/ui/premium';
import { Brain, Target, Eye, AlertTriangle, Zap, Activity } from 'lucide-react';

const STYLE_DESCRIPTIONS: Record<string, { text: string; color: string }> = {
  authoritarian: { text: 'Active Interventionist', color: 'var(--stat-happiness)' },
  libertarian: { text: 'Minimal Intervention', color: 'var(--stat-money)' },
  balanced: { text: 'Balanced Approach', color: 'var(--stat-population)' },
  reactive: { text: 'Reactive Governance', color: 'var(--stat-warning)' },
  emerging: { text: 'Developing Style', color: 'var(--teal-0)' },
};

export function ClaudeMindPanelSimulation() {
  const { governorState } = useGovernor();
  
  const styleInfo = STYLE_DESCRIPTIONS[governorState.governanceStyle] || STYLE_DESCRIPTIONS.emerging;
  
  const totalActions = governorState.interventionCount + governorState.restraintCount;
  const interventionRatio = totalActions > 0 
    ? Math.round((governorState.interventionCount / totalActions) * 100) 
    : 50;
  
  return (
    <div className="h-full flex flex-col p-3 gap-3">
      {/* Header Card */}
      <Panel className="!p-4">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, rgba(127, 231, 225, 0.15) 0%, rgba(127, 231, 225, 0.05) 100%)',
              border: '1px solid rgba(127, 231, 225, 0.2)'
            }}>
            <Brain 
              className={`w-5 h-5 ${governorState.isThinking ? 'animate-pulse' : ''}`}
              style={{ color: 'var(--teal-0)' }} 
            />
          </div>
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-0)' }}>
              Claude&apos;s Mind
            </h2>
            <p className="text-xs" style={{ color: styleInfo.color }}>
              {styleInfo.text}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-2)' }}>
            Total Decisions
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--gold-0)' }}>
            {governorState.totalDecisions}
          </span>
        </div>
      </Panel>
      
      {/* Current Goals */}
      <Panel className="!p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4" style={{ color: 'var(--stat-money)' }} />
          <span 
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--stat-money)' }}>
            Current Goal
          </span>
        </div>
        {governorState.currentGoals.length > 0 ? (
          <div className="space-y-2">
            {governorState.currentGoals.map((goal, i) => (
              <p 
                key={i} 
                className="text-sm leading-relaxed pl-2"
                style={{ 
                  color: 'var(--text-0)',
                  borderLeft: '2px solid var(--stat-money)',
                  paddingLeft: '12px'
                }}>
                {goal}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm italic pl-2" style={{ color: 'var(--text-2)' }}>
            Formulating strategy...
          </p>
        )}
      </Panel>
      
      {/* Observations */}
      <Panel className="!p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4" style={{ color: 'var(--stat-population)' }} />
          <span 
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--stat-population)' }}>
            Observations
          </span>
        </div>
        {governorState.observations.length > 0 ? (
          <ul className="space-y-2">
            {governorState.observations.slice(-3).map((obs, i) => (
              <li 
                key={i} 
                className="text-sm leading-relaxed flex items-start gap-2"
                style={{ color: 'var(--text-1)' }}>
                <span style={{ color: 'var(--stat-population)', marginTop: '4px' }}>•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--text-2)' }}>
            Analyzing city data...
          </p>
        )}
      </Panel>
      
      {/* Concerns */}
      {governorState.concerns.length > 0 && (
        <Panel 
          className="!p-4"
          style={{ 
            background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.02) 100%)',
            borderColor: 'rgba(251, 191, 36, 0.2)'
          }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" style={{ color: 'var(--stat-warning)' }} />
            <span 
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--stat-warning)' }}>
              Concerns
            </span>
          </div>
          <ul className="space-y-2">
            {governorState.concerns.map((concern, i) => (
              <li 
                key={i} 
                className="text-sm leading-relaxed flex items-start gap-2"
                style={{ color: 'var(--stat-warning)' }}>
                <span style={{ marginTop: '2px' }}>⚠</span>
                <span style={{ color: 'var(--text-0)' }}>{concern}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      
      {/* Last Decision */}
      <Panel className="!p-4 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" style={{ color: 'var(--teal-0)' }} />
          <span 
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--teal-0)' }}>
            Last Decision
          </span>
        </div>
        {governorState.lastDecision ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span 
                className="px-2.5 py-1 rounded text-xs font-bold uppercase"
                style={{ 
                  background: governorState.lastDecision.type === 'observe' 
                    ? 'rgba(148, 163, 184, 0.15)'
                    : governorState.lastDecision.type === 'build'
                    ? 'rgba(74, 222, 128, 0.15)'
                    : governorState.lastDecision.type === 'zone'
                    ? 'rgba(96, 165, 250, 0.15)'
                    : 'rgba(127, 231, 225, 0.15)',
                  color: governorState.lastDecision.type === 'observe' 
                    ? 'var(--stat-neutral)'
                    : governorState.lastDecision.type === 'build'
                    ? 'var(--stat-money)'
                    : governorState.lastDecision.type === 'zone'
                    ? 'var(--stat-population)'
                    : 'var(--teal-0)',
                  border: `1px solid ${governorState.lastDecision.type === 'observe' 
                    ? 'rgba(148, 163, 184, 0.3)'
                    : governorState.lastDecision.type === 'build'
                    ? 'rgba(74, 222, 128, 0.3)'
                    : governorState.lastDecision.type === 'zone'
                    ? 'rgba(96, 165, 250, 0.3)'
                    : 'rgba(127, 231, 225, 0.3)'}`
                }}>
                {governorState.lastDecision.type}
              </span>
              {governorState.lastDecision.target && (
                <span className="text-sm" style={{ color: 'var(--text-1)' }}>
                  {governorState.lastDecision.target}
                </span>
              )}
            </div>
            <p 
              className="text-sm leading-relaxed"
              style={{ 
                color: 'var(--text-1)',
                borderLeft: '2px solid var(--gold-2)',
                paddingLeft: '12px'
              }}>
              {governorState.reasoning}
            </p>
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: 'var(--text-2)' }}>
            Awaiting first decision...
          </p>
        )}
      </Panel>
      
      {/* Governance Stats */}
      <Panel className="!p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4" style={{ color: 'var(--gold-0)' }} />
          <span 
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--gold-0)' }}>
            Governance Style
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs mb-2">
          <span style={{ color: 'var(--text-2)' }}>Intervention Tendency</span>
          <span style={{ color: 'var(--text-0)' }}>{interventionRatio}%</span>
        </div>
        
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-2)' }}>
          <div 
            className="h-full transition-all duration-500"
            style={{ 
              width: `${interventionRatio}%`,
              background: 'linear-gradient(90deg, var(--stat-money) 0%, var(--stat-population) 50%, var(--stat-happiness) 100%)'
            }}
          />
        </div>
        
        <div className="flex justify-between text-[10px] mt-1.5" style={{ color: 'var(--text-2)' }}>
          <span>Hands-off</span>
          <span>Balanced</span>
          <span>Active</span>
        </div>
        
        <PanelDivider dotted className="!my-3" />
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div 
            className="rounded-lg p-2.5"
            style={{ background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.15)' }}>
            <div style={{ color: 'var(--text-2)' }}>Interventions</div>
            <div className="font-semibold" style={{ color: 'var(--stat-money)' }}>
              {governorState.interventionCount}
            </div>
          </div>
          <div 
            className="rounded-lg p-2.5"
            style={{ background: 'rgba(96, 165, 250, 0.08)', border: '1px solid rgba(96, 165, 250, 0.15)' }}>
            <div style={{ color: 'var(--text-2)' }}>Restraints</div>
            <div className="font-semibold" style={{ color: 'var(--stat-population)' }}>
              {governorState.restraintCount}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
