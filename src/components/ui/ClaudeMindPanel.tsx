'use client';

/**
 * Claude Mind Panel
 * Displays Claude's thoughts, decisions, and governance style
 */

import React, { useState } from 'react';
import { useGovernor } from '@/context/GovernorContext';
import { Brain, Target, Eye, AlertTriangle, History, Settings, Pause, Play, Zap, ChevronDown, ChevronUp } from 'lucide-react';

// Mood emoji mapping
const MOOD_EMOJI: Record<string, string> = {
  hopeful: '🌟',
  concerned: '😟',
  determined: '💪',
  contemplative: '🤔',
  satisfied: '😊',
  worried: '😰',
  optimistic: '🌈',
  cautious: '⚠️',
  proud: '🏆',
  frustrated: '😤',
  default: '🧠',
};

// Style descriptions
const STYLE_DESCRIPTIONS: Record<string, string> = {
  authoritarian: 'Actively intervenes to shape the city',
  libertarian: 'Prefers minimal intervention, lets the city grow naturally',
  balanced: 'Intervenes when necessary, restrains when stable',
  reactive: 'Responds to issues as they arise',
  emerging: 'Still developing governance approach',
};

// Style colors
const STYLE_COLORS: Record<string, string> = {
  authoritarian: 'text-red-400',
  libertarian: 'text-green-400',
  balanced: 'text-blue-400',
  reactive: 'text-yellow-400',
  emerging: 'text-purple-400',
};

export function ClaudeMindPanel() {
  const { 
    governorState, 
    events, 
    config,
    isEnabled,
    setEnabled,
    setDecisionInterval,
    forceDecision,
    clearHistory,
  } = useGovernor();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const moodEmoji = MOOD_EMOJI[governorState.reasoning?.toLowerCase().includes('concern') ? 'concerned' : 'default'] || MOOD_EMOJI.default;
  
  return (
    <div className="fixed left-4 top-20 w-80 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl z-50 font-mono text-sm">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-800/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Brain className={`w-5 h-5 ${isEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="font-bold text-cyan-300">CLAUDE&apos;S MIND</span>
          {governorState.isThinking && (
            <span className="text-yellow-400 text-xs animate-pulse">thinking...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setEnabled(!isEnabled); }}
            className={`p-1 rounded ${isEnabled ? 'text-green-400 hover:bg-green-900/30' : 'text-red-400 hover:bg-red-900/30'}`}
            title={isEnabled ? 'Disable Governor' : 'Enable Governor'}
          >
            {isEnabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Current Goals */}
          <div className="p-3 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Current Goals</span>
            </div>
            {governorState.currentGoals.length > 0 ? (
              <ul className="space-y-1">
                {governorState.currentGoals.map((goal, i) => (
                  <li key={i} className="text-slate-300 text-xs flex items-start gap-1">
                    <span className="text-emerald-500">→</span>
                    {goal}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-xs italic">Formulating goals...</p>
            )}
          </div>
          
          {/* Observations */}
          <div className="p-3 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-semibold">Observations</span>
            </div>
            {governorState.observations.length > 0 ? (
              <ul className="space-y-1">
                {governorState.observations.slice(-3).map((obs, i) => (
                  <li key={i} className="text-slate-300 text-xs flex items-start gap-1">
                    <span className="text-blue-500">•</span>
                    {obs}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-xs italic">Observing the city...</p>
            )}
          </div>
          
          {/* Concerns */}
          {governorState.concerns.length > 0 && (
            <div className="p-3 border-b border-slate-800 bg-amber-900/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-semibold">Concerns</span>
              </div>
              <ul className="space-y-1">
                {governorState.concerns.map((concern, i) => (
                  <li key={i} className="text-amber-200 text-xs flex items-start gap-1">
                    <span className="text-amber-500">⚠</span>
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Last Decision */}
          <div className="p-3 border-b border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-400 font-semibold">Last Decision</span>
              <span className="text-2xl">{moodEmoji}</span>
            </div>
            {governorState.lastDecision ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    governorState.lastDecision.type === 'observe' 
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-purple-900/50 text-purple-300'
                  }`}>
                    {governorState.lastDecision.type}
                  </span>
                  {governorState.lastDecision.target && (
                    <span className="text-slate-400 text-xs">
                      {governorState.lastDecision.target}
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {governorState.reasoning}
                </p>
              </div>
            ) : (
              <p className="text-slate-500 text-xs italic">No decisions made yet</p>
            )}
          </div>
          
          {/* Governance Style */}
          <div className="p-3 border-b border-slate-800">
            <div className="text-slate-400 text-xs mb-2">Governance Style</div>
            <div className="flex items-center justify-between">
              <span className={`font-bold capitalize ${STYLE_COLORS[governorState.governanceStyle]}`}>
                {governorState.governanceStyle}
              </span>
              <div className="text-slate-500 text-xs">
                {governorState.interventionCount}↑ / {governorState.restraintCount}○
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              {STYLE_DESCRIPTIONS[governorState.governanceStyle]}
            </p>
          </div>
          
          {/* Event Log Toggle */}
          <div className="p-3 border-b border-slate-800">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors w-full"
            >
              <History className="w-4 h-4" />
              <span className="text-xs">Decision History ({events.length})</span>
              {showHistory ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            
            {showHistory && (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-2">
                {events.slice(0, 10).map((event) => (
                  <div 
                    key={event.id}
                    className={`text-xs p-2 rounded ${
                      event.type === 'error' 
                        ? 'bg-red-900/20 text-red-300'
                        : event.type === 'warning'
                        ? 'bg-amber-900/20 text-amber-300'
                        : 'bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Tick {event.tick}</span>
                      <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {event.message}
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-slate-500 text-xs italic">No events yet</p>
                )}
              </div>
            )}
          </div>
          
          {/* Settings Toggle */}
          <div className="p-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors w-full"
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs">Settings</span>
              {showSettings ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
            </button>
            
            {showSettings && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1">
                    Decision Interval (ticks)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={config.decisionInterval}
                    onChange={(e) => setDecisionInterval(parseInt(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                  <div className="text-slate-500 text-xs text-center">
                    Every {config.decisionInterval} ticks
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={forceDecision}
                    disabled={governorState.isThinking || !isEnabled}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-300 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-3 h-3" />
                    Force Decision
                  </button>
                  <button
                    onClick={clearHistory}
                    className="flex-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                  >
                    Clear History
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Minimized View */}
      {!isExpanded && (
        <div className="p-2 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {governorState.totalDecisions} decisions
          </span>
          <span className={STYLE_COLORS[governorState.governanceStyle]}>
            {governorState.governanceStyle}
          </span>
        </div>
      )}
    </div>
  );
}
