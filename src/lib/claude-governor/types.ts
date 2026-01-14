/**
 * Claude Governor Types
 * Defines the interfaces for Claude's AI governance system
 */

// City state as observed by Claude
export interface CityState {
  // Population metrics
  population: number;
  happiness: number;        // 0-100
  health: number;           // 0-100
  education: number;        // 0-100
  
  // Economy
  treasury: number;         // money available
  income: number;           // per month
  expenses: number;         // per month
  unemployment: number;     // percentage (derived from jobs vs population)
  
  // Infrastructure counts
  housing: number;          // residential building count
  hospitals: number;
  schools: number;
  factories: number;
  roads: number;
  parks: number;
  powerPlants: number;
  waterTowers: number;
  
  // Social metrics
  crimeRate: number;        // 0-100
  pollution: number;        // 0-100
  landValue: number;        // average
  
  // Time
  tick: number;
  year: number;
  month: number;
  hour: number;
  era: 'founding' | 'growth' | 'prosperity' | 'stagnation' | 'crisis';
}

// Decision types Claude can make
export type ClaudeDecisionType = 
  | 'build'
  | 'demolish'
  | 'zone'
  | 'tax'
  | 'policy'
  | 'allocate'
  | 'observe';

export type BuildTarget = 
  | 'hospital' | 'school' | 'university'
  | 'police_station' | 'fire_station'
  | 'park' | 'park_large'
  | 'power_plant' | 'water_tower'
  | 'road' | 'rail' | 'subway_station'
  | 'stadium' | 'museum' | 'airport';

export type ZoneTarget = 
  | 'residential' | 'commercial' | 'industrial' | 'dezone';

export interface ClaudeDecision {
  type: ClaudeDecisionType;
  target?: BuildTarget | ZoneTarget | string;
  location?: { x: number; y: number };
  amount?: number;
  policyName?: string;
  policyEffect?: string;
  category?: string;
  reason?: string;
}

// What Claude tracks about itself
export interface ClaudeGovernorState {
  // Current thinking
  currentGoals: string[];           // What Claude is trying to achieve
  observations: string[];           // What Claude has noticed
  concerns: string[];               // What worries Claude
  
  // Decision history
  lastDecision: ClaudeDecision | null;
  reasoning: string;                // Why Claude made that decision
  decisionHistory: {
    decision: ClaudeDecision;
    reasoning: string;
    tick: number;
    timestamp: number;
  }[];
  
  // Governance metrics
  interventionCount: number;        // Times Claude acted
  restraintCount: number;           // Times Claude chose NOT to act
  governanceStyle: 'authoritarian' | 'libertarian' | 'balanced' | 'reactive' | 'emerging';
  
  // Session info
  sessionStartTick: number;
  totalDecisions: number;
  lastDecisionTick: number;
  isThinking: boolean;
  lastError?: string;
}

// Response from Claude API
export interface ClaudeResponse {
  decision: ClaudeDecision;
  reasoning: string;
  observation: string;
  concern: string;
  goal: string;
  mood?: string;
}

// Event log entry for the UI
export interface GovernorEvent {
  id: string;
  type: 'decision' | 'observation' | 'warning' | 'error';
  message: string;
  timestamp: number;
  tick: number;
  decision?: ClaudeDecision;
}

// Configuration for the governor
export interface GovernorConfig {
  decisionInterval: number;         // Ticks between decisions
  enabled: boolean;
  apiKey: string;
  model: string;
  maxHistoryLength: number;
  persistToSupabase: boolean;
}

// Initial state for Claude Governor
export function createInitialGovernorState(): ClaudeGovernorState {
  return {
    currentGoals: [
      'Build roads first - zones need road access',
      'Build power plant and water tower for utilities',
      'ZONE RESIDENTIAL to bring citizens (this is how you get population!)',
      'ZONE COMMERCIAL and INDUSTRIAL for jobs',
      'Build services: police, fire, hospital, school',
      'Keep zoning more areas to grow the city!',
    ],
    observations: [],
    concerns: [],
    lastDecision: null,
    reasoning: '',
    decisionHistory: [],
    interventionCount: 0,
    restraintCount: 0,
    governanceStyle: 'emerging',
    sessionStartTick: 0,
    totalDecisions: 0,
    lastDecisionTick: 0,
    isThinking: false,
  };
}
