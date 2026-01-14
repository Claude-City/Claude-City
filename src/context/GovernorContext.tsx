'use client';

/**
 * Governor Context
 * Manages Claude's AI governance state and decision loop
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  useRef 
} from 'react';
import { useGame } from './GameContext';
import {
  ClaudeGovernorState,
  GovernorEvent,
  GovernorConfig,
  createInitialGovernorState,
  askClaudeToGovern,
  updateGovernorState,
  createGovernorEvent,
  extractCityState,
  applyClaudeDecision,
  DEFAULT_CONFIG,
} from '@/lib/claude-governor';

// Claude API key - read from environment variable (set in .env.local)
const CLAUDE_API_KEY = process.env.NEXT_PUBLIC_CLAUDE_API_KEY || '';

interface GovernorContextValue {
  // State
  governorState: ClaudeGovernorState;
  events: GovernorEvent[];
  config: GovernorConfig;
  isEnabled: boolean;
  
  // Actions
  setEnabled: (enabled: boolean) => void;
  setDecisionInterval: (interval: number) => void;
  forceDecision: () => Promise<void>;
  clearHistory: () => void;
}

const GovernorContext = createContext<GovernorContextValue | null>(null);

export function GovernorProvider({ children }: { children: React.ReactNode }) {
  const { state: gameState, latestStateRef } = useGame();
  
  // Governor state
  const [governorState, setGovernorState] = useState<ClaudeGovernorState>(
    createInitialGovernorState()
  );
  const [events, setEvents] = useState<GovernorEvent[]>([]);
  const [config, setConfig] = useState<GovernorConfig>({
    ...DEFAULT_CONFIG,
    apiKey: CLAUDE_API_KEY,
    decisionInterval: 10, // Very fast decisions - build city quickly!
  });
  const [isEnabled, setIsEnabled] = useState(true);
  
  // Refs for the decision loop
  const lastDecisionTickRef = useRef(0);
  const isThinkingRef = useRef(false);
  const governorStateRef = useRef(governorState);
  governorStateRef.current = governorState;
  
  // Add an event to the log
  const addEvent = useCallback((event: GovernorEvent) => {
    setEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events
  }, []);
  
  // Make a governance decision
  const makeDecision = useCallback(async () => {
    if (isThinkingRef.current) {
      return;
    }
    
    if (!config.apiKey) {
      console.warn('⚠️ Claude API key not configured. Set NEXT_PUBLIC_CLAUDE_API_KEY environment variable.');
      // Add error event so user can see it
      addEvent({
        id: `no-api-key-${Date.now()}`,
        type: 'error',
        message: 'Claude API key not configured. Set NEXT_PUBLIC_CLAUDE_API_KEY in environment variables.',
        timestamp: Date.now(),
        tick: latestStateRef.current.tick,
      });
      return;
    }
    
    isThinkingRef.current = true;
    setGovernorState(prev => ({ ...prev, isThinking: true }));
    
    try {
      const currentGameState = latestStateRef.current;
      const cityState = extractCityState(currentGameState);
      
      // Ask Claude for a decision
      const response = await askClaudeToGovern(
        cityState,
        governorStateRef.current,
        { apiKey: config.apiKey, model: config.model }
      );
      
      if (response) {
        // Update governor state
        const newGovernorState = updateGovernorState(
          governorStateRef.current,
          response,
          currentGameState.tick
        );
        setGovernorState(newGovernorState);
        
        // Create and add event
        const event = createGovernorEvent(response, currentGameState.tick);
        addEvent(event);
        
        // Apply the decision to the game (except observe)
        if (response.decision.type !== 'observe') {
          // We need to apply this through the game context
          // For now, we'll dispatch a custom event that the game can listen to
          const decisionEvent = new CustomEvent('claude-decision', {
            detail: {
              decision: response.decision,
              reasoning: response.reasoning,
            },
          });
          window.dispatchEvent(decisionEvent);
        }
        
        lastDecisionTickRef.current = currentGameState.tick;
      } else {
        // Add error event
        addEvent({
          id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'error',
          message: 'Failed to get response from Claude',
          timestamp: Date.now(),
          tick: currentGameState.tick,
        });
      }
    } catch (error) {
      console.error('Governor decision error:', error);
      setGovernorState(prev => ({
        ...prev,
        isThinking: false,
        lastError: error instanceof Error ? error.message : 'Unknown error',
      }));
      
      addEvent({
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'error',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
        tick: latestStateRef.current.tick,
      });
    } finally {
      isThinkingRef.current = false;
      setGovernorState(prev => ({ ...prev, isThinking: false }));
    }
  }, [config.apiKey, config.model, latestStateRef, addEvent]);
  
  // Decision loop - check if it's time to make a decision
  useEffect(() => {
    if (!isEnabled || gameState.speed === 0) {
      return;
    }
    
    const currentTick = gameState.tick;
    const ticksSinceLastDecision = currentTick - lastDecisionTickRef.current;
    
    // Make a decision every N ticks
    if (ticksSinceLastDecision >= config.decisionInterval && !isThinkingRef.current) {
      makeDecision();
    }
  }, [gameState.tick, gameState.speed, isEnabled, config.decisionInterval, makeDecision]);
  
  // Initialize session start tick
  useEffect(() => {
    if (governorState.sessionStartTick === 0 && gameState.tick > 0) {
      setGovernorState(prev => ({
        ...prev,
        sessionStartTick: gameState.tick,
      }));
      lastDecisionTickRef.current = gameState.tick;
    }
  }, [gameState.tick, governorState.sessionStartTick]);
  
  // Actions
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    const now = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    if (enabled) {
      addEvent({
        id: `system-resume-${now}-${randomSuffix}`,
        type: 'observation',
        message: 'CLAUDE: I have resumed governance of this city.',
        timestamp: now,
        tick: latestStateRef.current.tick,
      });
    } else {
      addEvent({
        id: `system-pause-${now}-${randomSuffix}`,
        type: 'observation',
        message: 'CLAUDE: I am stepping back. The city is in your hands.',
        timestamp: now,
        tick: latestStateRef.current.tick,
      });
    }
  }, [addEvent, latestStateRef]);
  
  const setDecisionInterval = useCallback((interval: number) => {
    setConfig(prev => ({ ...prev, decisionInterval: Math.max(10, interval) }));
  }, []);
  
  const forceDecision = useCallback(async () => {
    await makeDecision();
  }, [makeDecision]);
  
  const clearHistory = useCallback(() => {
    setEvents([]);
    setGovernorState(prev => ({
      ...prev,
      decisionHistory: [],
      observations: [],
      concerns: [],
    }));
  }, []);
  
  const value: GovernorContextValue = {
    governorState,
    events,
    config,
    isEnabled,
    setEnabled,
    setDecisionInterval,
    forceDecision,
    clearHistory,
  };
  
  return (
    <GovernorContext.Provider value={value}>
      {children}
    </GovernorContext.Provider>
  );
}

export function useGovernor() {
  const ctx = useContext(GovernorContext);
  if (!ctx) {
    throw new Error('useGovernor must be used within a GovernorProvider');
  }
  return ctx;
}
