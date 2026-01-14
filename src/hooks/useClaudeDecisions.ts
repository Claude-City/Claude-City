'use client';

/**
 * Hook to listen for and apply Claude's governance decisions
 */

import { useEffect, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { ClaudeDecision, BuildTarget, ZoneTarget } from '@/lib/claude-governor/types';
import { TOOL_INFO, Tool, GameState } from '@/types/game';

// Map decision targets to tools
const BUILD_TOOL_MAP: Record<string, Tool> = {
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

const ZONE_TOOL_MAP: Record<string, Tool> = {
  residential: 'zone_residential',
  commercial: 'zone_commercial',
  industrial: 'zone_industrial',
  dezone: 'zone_dezone',
};

// Find a suitable location for a road
function findRoadLocation(state: GameState): { x: number; y: number } | null {
  const grid = state.grid;
  const size = state.gridSize;
  const center = Math.floor(size / 2);
  
  // First, check if there are any existing roads
  let hasRoads = false;
  for (const row of grid) {
    for (const tile of row) {
      if (tile.building.type === 'road') {
        hasRoads = true;
        break;
      }
    }
    if (hasRoads) break;
  }
  
  // If no roads, start from center
  if (!hasRoads) {
    const tile = grid[center]?.[center];
    if (tile && tile.building.type === 'grass' && tile.zone === 'none') {
      return { x: center, y: center };
    }
  }
  
  // Find spots adjacent to existing roads
  interface Candidate { x: number; y: number; score: number }
  const candidates: Candidate[] = [];
  
  for (let y = 2; y < size - 2; y++) {
    for (let x = 2; x < size - 2; x++) {
      const tile = grid[y][x];
      if (tile.building.type !== 'grass' || tile.zone !== 'none') continue;
      
      let score = 0;
      
      // Check for adjacent roads (extend road network)
      const adjacentTiles = [
        { tile: grid[y - 1]?.[x], dy: -1, dx: 0 },
        { tile: grid[y + 1]?.[x], dy: 1, dx: 0 },
        { tile: grid[y]?.[x - 1], dy: 0, dx: -1 },
        { tile: grid[y]?.[x + 1], dy: 0, dx: 1 },
      ];
      
      for (const { tile: adj } of adjacentTiles) {
        if (adj?.building.type === 'road') score += 100; // Strongly prefer extending roads
      }
      
      // Also like being near buildings/zones
      for (const { tile: adj } of adjacentTiles) {
        if (adj?.zone !== 'none') score += 20;
        if (adj?.building.type && adj.building.type !== 'grass' && adj.building.type !== 'water' && adj.building.type !== 'road') {
          score += 15;
        }
      }
      
      // Prefer central locations
      const distFromCenter = Math.abs(x - center) + Math.abs(y - center);
      score -= distFromCenter / 2;
      
      // Avoid edges
      const distFromEdge = Math.min(x, y, size - x, size - y);
      if (distFromEdge < 5) score -= 50;
      
      if (score > 0 || !hasRoads) {
        candidates.push({ x, y, score: hasRoads ? score : -distFromCenter });
      }
    }
  }
  
  candidates.sort((a, b) => b.score - a.score);
  return candidates.length > 0 ? { x: candidates[0].x, y: candidates[0].y } : null;
}

// Find a suitable location for a building - ALWAYS returns a valid location!
function findBuildLocation(
  state: GameState,
  buildingSize: number,
  buildingType?: string
): { x: number; y: number } | null {
  // Roads get special handling
  if (buildingType === 'road') {
    return findRoadLocation(state);
  }
  
  const grid = state.grid;
  const size = state.gridSize;
  const center = Math.floor(size / 2);
  
  interface Candidate {
    x: number;
    y: number;
    score: number;
  }
  const candidates: Candidate[] = [];
  
  for (let y = 2; y < size - buildingSize - 1; y++) {
    for (let x = 2; x < size - buildingSize - 1; x++) {
      // Check if the entire area is buildable
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
      
      // Base score - start positive so we always find locations!
      let score = 100;
      
      // Check for adjacent roads - bonus but NOT required
      const adjacentTiles = [
        grid[y - 1]?.[x],
        grid[y + buildingSize]?.[x],
        grid[y]?.[x - 1],
        grid[y]?.[x + buildingSize],
      ];
      
      for (const adj of adjacentTiles) {
        if (adj?.building.type === 'road') score += 50;
        if (adj?.building.type && adj.building.type !== 'grass' && adj.building.type !== 'water') {
          score += 10;
        }
      }
      
      score += grid[y][x].landValue / 10;
      score -= grid[y][x].pollution;
      
      // Prefer central locations
      const distFromCenter = Math.abs(x - center) + Math.abs(y - center);
      score -= distFromCenter / 2;
      
      // Avoid edges
      const distFromEdge = Math.min(x, y, size - x - buildingSize, size - y - buildingSize);
      if (distFromEdge < 3) score -= 50;
      
      candidates.push({ x, y, score });
    }
  }
  
  candidates.sort((a, b) => b.score - a.score);
  
  if (candidates.length === 0) {
    console.error(`❌ No valid locations found for building size ${buildingSize}!`);
    return null;
  }
  
  console.log(`✅ Found ${candidates.length} build locations, best score: ${candidates[0].score}`);
  return { x: candidates[0].x, y: candidates[0].y };
}

// Find a location for zoning - ALWAYS returns a valid location!
function findZoneLocation(
  state: GameState,
  zoneType: string
): { x: number; y: number } | null {
  const grid = state.grid;
  const size = state.gridSize;
  const center = Math.floor(size / 2);
  
  interface Candidate {
    x: number;
    y: number;
    score: number;
  }
  const candidates: Candidate[] = [];
  
  for (let y = 2; y < size - 2; y++) {
    for (let x = 2; x < size - 2; x++) {
      const tile = grid[y][x];
      
      if (tile.building.type !== 'grass' || tile.zone !== 'none') {
        continue;
      }
      
      // Base score - start positive so we always find locations!
      let score = 100;
      
      const adjacentTiles = [
        grid[y - 1]?.[x],
        grid[y + 1]?.[x],
        grid[y]?.[x - 1],
        grid[y]?.[x + 1],
      ];
      
      // Bonus for adjacent roads - but NOT required
      for (const adj of adjacentTiles) {
        if (adj?.building.type === 'road') score += 50;
      }
      
      // Prefer near center
      const distFromCenter = Math.abs(x - center) + Math.abs(y - center);
      score -= distFromCenter;
      
      // Avoid edges
      const distFromEdge = Math.min(x, y, size - x, size - y);
      if (distFromEdge < 3) score -= 100;
      
      if (zoneType === 'residential') {
        score -= tile.pollution * 2;
        score += tile.landValue / 5;
        // Cluster residential together
        for (const adj of adjacentTiles) {
          if (adj?.zone === 'residential') score += 20;
        }
      } else if (zoneType === 'commercial') {
        score += tile.traffic;
        score += tile.landValue / 3;
      } else if (zoneType === 'industrial') {
        // Put industrial away from center
        score += distFromCenter / 2;
      }
      
      candidates.push({ x, y, score });
    }
  }
  
  candidates.sort((a, b) => b.score - a.score);
  
  if (candidates.length === 0) {
    console.error('❌ No valid zone locations found!');
    return null;
  }
  
  console.log(`✅ Found ${candidates.length} zone locations, best score: ${candidates[0].score}`);
  return { x: candidates[0].x, y: candidates[0].y };
}

export function useClaudeDecisions() {
  const { 
    state, 
    latestStateRef, 
    placeAtTile, 
    setTool, 
    setTaxRate,
    setBudgetFunding,
    addNotification,
  } = useGame();
  
  const handleDecision = useCallback((event: CustomEvent<{ decision: ClaudeDecision; reasoning: string }>) => {
    const { decision, reasoning } = event.detail;
    
    console.log('🎯 Applying decision:', decision.type, decision.target);
    
    // Add notification about Claude's decision
    addNotification(
      `🧠 Claude: ${decision.type}`,
      reasoning,
      'brain'
    );
    
    switch (decision.type) {
      case 'build': {
        const tool = BUILD_TOOL_MAP[decision.target as string];
        if (!tool) {
          console.error('❌ Unknown build target:', decision.target);
          break;
        }
        
        const buildingSize = TOOL_INFO[tool]?.size || 1;
        console.log(`🏗️ Building ${decision.target} (size ${buildingSize})...`);
        const location = findBuildLocation(latestStateRef.current, buildingSize, decision.target as string);
        
        if (location) {
          console.log(`📍 Placing at (${location.x}, ${location.y})`);
          
          // Dispatch event to navigate camera to build location
          window.dispatchEvent(new CustomEvent('claude-build-location', {
            detail: { x: location.x, y: location.y }
          }));
          
          // Set the tool and place at the location
          setTool(tool);
          // Small delay to ensure tool is set
          setTimeout(() => {
            placeAtTile(location.x, location.y);
            setTool('select'); // Reset to select after placing
            console.log('✅ Build complete!');
          }, 50);
        } else {
          console.error('❌ No valid location found for building!');
        }
        break;
      }
      
      case 'zone': {
        const tool = ZONE_TOOL_MAP[decision.target as string];
        if (!tool) {
          console.error('❌ Unknown zone target:', decision.target);
          break;
        }
        
        console.log(`🏘️ Zoning ${decision.target}...`);
        const location = findZoneLocation(latestStateRef.current, decision.target as string);
        
        if (location) {
          console.log(`📍 Zoning at (${location.x}, ${location.y})`);
          
          // Dispatch event to navigate camera to zone location
          window.dispatchEvent(new CustomEvent('claude-build-location', {
            detail: { x: location.x, y: location.y }
          }));
          
          setTool(tool);
          setTimeout(() => {
            placeAtTile(location.x, location.y);
            setTool('select');
            console.log('✅ Zoning complete!');
          }, 50);
        } else {
          console.error('❌ No valid location found for zoning!');
        }
        break;
      }
      
      case 'tax': {
        const currentRate = latestStateRef.current.taxRate;
        const amount = decision.amount || 1;
        const newRate = decision.target === 'raise' 
          ? currentRate + amount 
          : currentRate - amount;
        setTaxRate(Math.max(0, Math.min(20, newRate)));
        break;
      }
      
      case 'allocate': {
        const category = decision.target as string;
        const amount = decision.amount || 100;
        
        const categoryMap: Record<string, 'police' | 'fire' | 'health' | 'education' | 'transportation'> = {
          police: 'police',
          fire: 'fire',
          health: 'health',
          education: 'education',
          transportation: 'transportation',
        };
        
        const budgetKey = categoryMap[category];
        if (budgetKey) {
          setBudgetFunding(budgetKey, amount);
        }
        break;
      }
      
      case 'observe':
        // Claude chose to do nothing - this is intentional
        break;
      
      default:
        console.log('Unhandled decision type:', decision.type);
    }
  }, [latestStateRef, setTool, placeAtTile, setTaxRate, setBudgetFunding, addNotification]);
  
  // Listen for Claude's decisions
  useEffect(() => {
    const handler = (e: Event) => handleDecision(e as CustomEvent<{ decision: ClaudeDecision; reasoning: string }>);
    window.addEventListener('claude-decision', handler);
    
    return () => {
      window.removeEventListener('claude-decision', handler);
    };
  }, [handleDecision]);
}
