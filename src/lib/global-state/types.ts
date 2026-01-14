/**
 * Global State Types
 * For synchronized simulation across all viewers
 */

export interface GlobalGameState {
  id: string;
  state_json: string;  // Compressed game state
  updated_at: string;
  tick: number;
  population: number;
  happiness: number;
  treasury: number;
  year: number;
  month: number;
}

export interface GlobalStateConfig {
  syncInterval: number;      // How often to sync (ms)
  isLeader: boolean;         // Is this client the simulation leader?
  projectId: string;
}
