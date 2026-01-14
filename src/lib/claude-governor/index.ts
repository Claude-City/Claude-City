/**
 * Claude Governor Module
 * Main export file for the AI governance system
 */

// Types
export * from './types';

// Services
export { 
  askClaudeToGovern, 
  updateGovernorState, 
  createGovernorEvent,
  DEFAULT_CONFIG,
} from './governor-service';
export type { GovernorConfig } from './governor-service';

// State extraction
export { extractCityState } from './extract-city-state';

// Decision application
export { applyClaudeDecision } from './apply-decision';

// Persistence
export {
  generateSessionId,
  initializeDatabase,
  startSession,
  endSession,
  recordDecision,
  getSessionHistory,
  getDecisionHistory,
  getCityStats,
  CREATE_TABLES_SQL,
} from './supabase-persistence';
