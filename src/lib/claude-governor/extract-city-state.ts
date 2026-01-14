/**
 * Extract city state from GameState for Claude to observe
 */

import { GameState } from '@/types/game';
import { CityState } from './types';

// Count buildings of specific types in the grid
function countBuildings(grid: GameState['grid'], types: string[]): number {
  let count = 0;
  for (const row of grid) {
    for (const tile of row) {
      if (types.includes(tile.building.type)) {
        count++;
      }
    }
  }
  return count;
}

// Calculate average value across the grid
function calculateGridAverage(grid: GameState['grid'], getValue: (tile: GameState['grid'][0][0]) => number): number {
  let total = 0;
  let count = 0;
  for (const row of grid) {
    for (const tile of row) {
      total += getValue(tile);
      count++;
    }
  }
  return count > 0 ? Math.round(total / count) : 0;
}

// Determine city era based on metrics
function determineEra(state: GameState): CityState['era'] {
  const { population, happiness, money } = state.stats;
  
  // Crisis: very low happiness or negative funds
  if (happiness < 25 || money < -10000) {
    return 'crisis';
  }
  
  // Founding: very small population
  if (population < 500) {
    return 'founding';
  }
  
  // Prosperity: high happiness and good population
  if (happiness > 70 && population > 5000) {
    return 'prosperity';
  }
  
  // Stagnation: medium metrics, slow growth
  if (happiness < 50 || population < 2000) {
    return 'stagnation';
  }
  
  // Growth: default state
  return 'growth';
}

// Calculate unemployment as percentage
function calculateUnemployment(state: GameState): number {
  const { population, jobs } = state.stats;
  if (population === 0) return 0;
  
  // If more jobs than population, 0% unemployment
  if (jobs >= population) return 0;
  
  // Calculate working age population (assume 60% of population works)
  const workingPopulation = population * 0.6;
  const unemployed = Math.max(0, workingPopulation - jobs);
  return Math.round((unemployed / workingPopulation) * 100);
}

export function extractCityState(gameState: GameState): CityState {
  const grid = gameState.grid;
  
  // Count various building types
  const hospitals = countBuildings(grid, ['hospital']);
  const schools = countBuildings(grid, ['school', 'university']);
  const factories = countBuildings(grid, [
    'factory_small', 'factory_medium', 'factory_large',
    'industrial_small', 'industrial_medium', 'industrial_large'
  ]);
  const housing = countBuildings(grid, [
    'house_small', 'house_medium', 'house_large',
    'residential_small', 'residential_medium', 'residential_large',
    'apartment_small', 'apartment_medium', 'apartment_large'
  ]);
  const roads = countBuildings(grid, ['road', 'bridge']);
  const parks = countBuildings(grid, [
    'park', 'park_large', 'tennis', 'playground_small', 'playground_large',
    'basketball_courts', 'swimming_pool', 'community_garden'
  ]);
  const powerPlants = countBuildings(grid, ['power_plant']);
  const waterTowers = countBuildings(grid, ['water_tower']);
  
  // Calculate average metrics
  const avgCrime = calculateGridAverage(grid, tile => tile.crime);
  const avgPollution = calculateGridAverage(grid, tile => tile.pollution);
  const avgLandValue = calculateGridAverage(grid, tile => tile.landValue);
  
  // Derive health and education from service coverage
  // These are approximations based on building counts and coverage
  const healthCoverage = hospitals > 0 
    ? Math.min(100, Math.round((hospitals * 20) + (gameState.budget.health?.funding || 0) / 2))
    : 0;
  const educationCoverage = schools > 0
    ? Math.min(100, Math.round((schools * 15) + (gameState.budget.education?.funding || 0) / 2))
    : 0;
  
  return {
    population: gameState.stats.population,
    happiness: gameState.stats.happiness,
    health: healthCoverage,
    education: educationCoverage,
    
    treasury: gameState.stats.money,
    income: gameState.stats.income,
    expenses: gameState.stats.expenses,
    unemployment: calculateUnemployment(gameState),
    
    housing,
    hospitals,
    schools,
    factories,
    roads,
    parks,
    powerPlants,
    waterTowers,
    
    crimeRate: avgCrime,
    pollution: avgPollution,
    landValue: avgLandValue,
    
    tick: gameState.tick,
    year: gameState.year,
    month: gameState.month,
    hour: gameState.hour,
    era: determineEra(gameState),
  };
}
