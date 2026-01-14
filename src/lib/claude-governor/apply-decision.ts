/**
 * Apply Claude's decisions to the game state
 */

import { GameState, BuildingType, ZoneType, TOOL_INFO, Tool } from '@/types/game';
import { ClaudeDecision } from './types';
import { placeBuilding, bulldozeTile } from '@/lib/simulation';

// Map decision targets to building types
const BUILD_TARGET_MAP: Record<string, BuildingType> = {
  hospital: 'hospital',
  school: 'school',
  university: 'university',
  police_station: 'police_station',
  fire_station: 'fire_station',
  park: 'park',
  park_large: 'park_large',
  power_plant: 'power_plant',
  water_tower: 'water_tower',
  road: 'road',
  rail: 'rail',
  subway_station: 'subway_station',
  stadium: 'stadium',
  museum: 'museum',
  airport: 'airport',
};

// Map zone targets to zone types
const ZONE_TARGET_MAP: Record<string, ZoneType> = {
  residential: 'residential',
  commercial: 'commercial',
  industrial: 'industrial',
  dezone: 'none',
};

// Find a suitable location to place a building
function findBuildLocation(
  state: GameState,
  buildingType: BuildingType
): { x: number; y: number } | null {
  const grid = state.grid;
  const size = state.gridSize;
  
  // Get building size from TOOL_INFO
  const toolKey = Object.keys(TOOL_INFO).find(
    key => BUILD_TARGET_MAP[key] === buildingType || key === buildingType
  ) as Tool | undefined;
  const buildingSize = toolKey ? TOOL_INFO[toolKey]?.size || 1 : 1;
  
  // Strategy: Find a spot near existing development but with room to build
  // Prioritize areas near roads for accessibility
  
  interface Candidate {
    x: number;
    y: number;
    score: number;
  }
  const candidates: Candidate[] = [];
  
  for (let y = 1; y < size - buildingSize; y++) {
    for (let x = 1; x < size - buildingSize; x++) {
      // Check if the entire area is buildable (grass/empty)
      let canBuild = true;
      for (let dy = 0; dy < buildingSize && canBuild; dy++) {
        for (let dx = 0; dx < buildingSize && canBuild; dx++) {
          const tile = grid[y + dy]?.[x + dx];
          if (!tile || 
              tile.building.type !== 'grass' || 
              tile.zone !== 'none') {
            canBuild = false;
          }
        }
      }
      
      if (!canBuild) continue;
      
      // Calculate score based on nearby infrastructure
      let score = 0;
      
      // Check for adjacent roads (very important)
      const adjacentTiles = [
        grid[y - 1]?.[x], // top
        grid[y + buildingSize]?.[x], // bottom
        grid[y]?.[x - 1], // left
        grid[y]?.[x + buildingSize], // right
      ];
      
      for (const adj of adjacentTiles) {
        if (adj?.building.type === 'road') {
          score += 50; // Roads are very important
        }
        if (adj?.building.type && adj.building.type !== 'grass' && adj.building.type !== 'water') {
          score += 10; // Near other development
        }
      }
      
      // Bonus for land value
      score += grid[y][x].landValue / 10;
      
      // Penalty for pollution (for residential/commercial)
      if (buildingType.includes('hospital') || buildingType.includes('school')) {
        score -= grid[y][x].pollution * 2;
      }
      
      // Penalty for edges (prefer interior locations)
      const distFromEdge = Math.min(x, y, size - x - buildingSize, size - y - buildingSize);
      score += distFromEdge;
      
      if (score > 0) {
        candidates.push({ x, y, score });
      }
    }
  }
  
  // Sort by score and pick the best
  candidates.sort((a, b) => b.score - a.score);
  
  return candidates.length > 0 ? { x: candidates[0].x, y: candidates[0].y } : null;
}

// Find a location for zoning
function findZoneLocation(
  state: GameState,
  zoneType: ZoneType
): { x: number; y: number } | null {
  const grid = state.grid;
  const size = state.gridSize;
  
  interface Candidate {
    x: number;
    y: number;
    score: number;
  }
  const candidates: Candidate[] = [];
  
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const tile = grid[y][x];
      
      // Must be grass with no zone
      if (tile.building.type !== 'grass' || tile.zone !== 'none') {
        continue;
      }
      
      let score = 0;
      
      // Check for adjacent roads
      const adjacentTiles = [
        grid[y - 1]?.[x],
        grid[y + 1]?.[x],
        grid[y]?.[x - 1],
        grid[y]?.[x + 1],
      ];
      
      for (const adj of adjacentTiles) {
        if (adj?.building.type === 'road') {
          score += 30;
        }
      }
      
      // Zone-specific scoring
      if (zoneType === 'residential') {
        // Residential prefers low pollution, near parks
        score -= tile.pollution * 2;
        score += tile.landValue / 5;
        
        // Near parks is good
        for (const adj of adjacentTiles) {
          if (adj?.building.type.includes('park')) score += 20;
        }
      } else if (zoneType === 'commercial') {
        // Commercial prefers high traffic, central locations
        score += tile.traffic;
        score += tile.landValue / 3;
      } else if (zoneType === 'industrial') {
        // Industrial prefers edges, away from residential
        const distFromEdge = Math.min(x, y, size - x, size - y);
        if (distFromEdge < 10) score += 20;
        score -= tile.landValue / 5; // Prefers lower land value
      }
      
      if (score > 0) {
        candidates.push({ x, y, score });
      }
    }
  }
  
  candidates.sort((a, b) => b.score - a.score);
  return candidates.length > 0 ? { x: candidates[0].x, y: candidates[0].y } : null;
}

// Apply a build decision
function applyBuildDecision(
  state: GameState,
  decision: ClaudeDecision
): GameState {
  if (!decision.target || typeof decision.target !== 'string') {
    console.warn('Build decision missing target');
    return state;
  }
  
  const buildingType = BUILD_TARGET_MAP[decision.target];
  if (!buildingType) {
    console.warn(`Unknown build target: ${decision.target}`);
    return state;
  }
  
  // Get building cost
  const toolKey = Object.keys(TOOL_INFO).find(
    key => BUILD_TARGET_MAP[key] === buildingType || key === buildingType
  ) as Tool | undefined;
  const cost = toolKey ? TOOL_INFO[toolKey]?.cost || 0 : 0;
  
  // Check if we can afford it
  if (state.stats.money < cost) {
    console.warn(`Cannot afford ${buildingType}, need $${cost}, have $${state.stats.money}`);
    return state;
  }
  
  // Find location
  const location = decision.location || findBuildLocation(state, buildingType);
  if (!location) {
    console.warn(`No suitable location found for ${buildingType}`);
    return state;
  }
  
  // Place the building
  const newState = placeBuilding(state, location.x, location.y, buildingType, null);
  
  // Deduct cost if placement succeeded
  if (newState !== state) {
    return {
      ...newState,
      stats: {
        ...newState.stats,
        money: newState.stats.money - cost,
      },
    };
  }
  
  return state;
}

// Apply a zone decision
function applyZoneDecision(
  state: GameState,
  decision: ClaudeDecision
): GameState {
  if (!decision.target || typeof decision.target !== 'string') {
    console.warn('Zone decision missing target');
    return state;
  }
  
  const zoneType = ZONE_TARGET_MAP[decision.target];
  if (!zoneType) {
    console.warn(`Unknown zone target: ${decision.target}`);
    return state;
  }
  
  // Get zoning cost
  const cost = 50; // Standard zoning cost
  
  if (state.stats.money < cost && zoneType !== 'none') {
    console.warn(`Cannot afford zoning, need $${cost}`);
    return state;
  }
  
  // Find location
  const location = decision.location || findZoneLocation(state, zoneType);
  if (!location) {
    console.warn(`No suitable location found for ${zoneType} zone`);
    return state;
  }
  
  // Place the zone
  const newState = placeBuilding(state, location.x, location.y, null, zoneType);
  
  // Deduct cost if placement succeeded
  if (newState !== state && zoneType !== 'none') {
    return {
      ...newState,
      stats: {
        ...newState.stats,
        money: newState.stats.money - cost,
      },
    };
  }
  
  return newState;
}

// Apply a tax decision
function applyTaxDecision(
  state: GameState,
  decision: ClaudeDecision
): GameState {
  const amount = decision.amount || 1;
  const direction = decision.target === 'raise' ? 1 : -1;
  const newTaxRate = Math.max(0, Math.min(20, state.taxRate + (amount * direction)));
  
  return {
    ...state,
    taxRate: newTaxRate,
  };
}

// Apply a budget allocation decision
function applyAllocateDecision(
  state: GameState,
  decision: ClaudeDecision
): GameState {
  const category = decision.target as string;
  const amount = decision.amount || 100;
  
  // Map category to budget key
  const budgetKeyMap: Record<string, keyof typeof state.budget> = {
    police: 'police',
    fire: 'fire',
    health: 'health',
    education: 'education',
    transportation: 'transportation',
  };
  
  const budgetKey = budgetKeyMap[category];
  if (!budgetKey || !state.budget[budgetKey]) {
    console.warn(`Unknown budget category: ${category}`);
    return state;
  }
  
  return {
    ...state,
    budget: {
      ...state.budget,
      [budgetKey]: {
        ...state.budget[budgetKey],
        funding: Math.max(0, Math.min(100, amount)),
      },
    },
  };
}

// Main function to apply Claude's decision to game state
export function applyClaudeDecision(
  state: GameState,
  decision: ClaudeDecision
): GameState {
  switch (decision.type) {
    case 'build':
      return applyBuildDecision(state, decision);
    
    case 'zone':
      return applyZoneDecision(state, decision);
    
    case 'tax':
      return applyTaxDecision(state, decision);
    
    case 'allocate':
      return applyAllocateDecision(state, decision);
    
    case 'observe':
      // Do nothing - this is intentional restraint
      return state;
    
    case 'policy':
      // Policies are informational only for now
      // Could be expanded to actually modify game behavior
      console.log(`Policy enacted: ${decision.target} - ${decision.policyEffect}`);
      return state;
    
    case 'demolish':
      // Find and demolish a building
      if (decision.location) {
        return bulldozeTile(state, decision.location.x, decision.location.y);
      }
      return state;
    
    default:
      console.warn(`Unknown decision type: ${decision.type}`);
      return state;
  }
}
