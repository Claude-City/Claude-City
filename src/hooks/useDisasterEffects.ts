'use client';

/**
 * Hook to apply disaster effects to the game
 * Listens for global disaster events and modifies game state
 */

import { useEffect, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { DISASTERS, DisasterType, Disaster } from '@/lib/disasters';
import { GameState, Tile } from '@/types/game';

export function useDisasterEffects() {
  const { state, setState } = useGame();
  
  // Apply disaster effects to the game
  const applyDisaster = useCallback((disaster: Disaster) => {
    setState((prevState: GameState) => {
      const newState = { ...prevState };
      const grid = newState.grid.map(row => row.map(tile => ({ ...tile })));
      
      // Get all developed tiles (non-grass, non-water)
      const developedTiles: { x: number; y: number; tile: Tile }[] = [];
      grid.forEach((row, y) => {
        row.forEach((tile, x) => {
          if (tile.building.type !== 'grass' && 
              tile.building.type !== 'water' && 
              tile.building.type !== 'empty') {
            developedTiles.push({ x, y, tile });
          }
        });
      });
      
      // Calculate affected tiles based on disaster severity
      const numToDestroy = Math.floor(developedTiles.length * (disaster.effects.destroyBuildings / 100));
      
      // Randomly select tiles to destroy
      const shuffled = developedTiles.sort(() => Math.random() - 0.5);
      const toDestroy = shuffled.slice(0, numToDestroy);
      
      // Destroy selected tiles
      let buildingsDestroyed = 0;
      toDestroy.forEach(({ x, y }) => {
        const tile = grid[y][x];
        // Set building to abandoned or destroyed state
        if (tile.building.type !== 'road') {
          tile.building = {
            ...tile.building,
            abandoned: true,
            onFire: disaster.id === 'fire' || disaster.id === 'meteor',
            fireProgress: disaster.id === 'fire' ? 50 : 0,
          };
          buildingsDestroyed++;
        }
      });
      
      // Apply population effects
      const populationLoss = Math.floor(newState.stats.population * (disaster.effects.killPopulation / 100));
      newState.stats.population = Math.max(0, newState.stats.population - populationLoss);
      
      // Apply treasury effects
      const moneyLoss = Math.floor(newState.stats.money * (disaster.effects.reduceTreasury / 100));
      newState.stats.money = Math.max(0, newState.stats.money - moneyLoss);
      
      // Apply happiness effects
      newState.stats.happiness = Math.max(0, newState.stats.happiness - disaster.effects.reduceHappiness);
      
      // Add notification
      newState.notifications = [
        {
          id: `disaster-${Date.now()}`,
          type: 'disaster',
          title: `${disaster.icon} ${disaster.name}!`,
          message: `${disaster.description} ${buildingsDestroyed} buildings damaged, ${populationLoss} citizens lost.`,
          priority: 'critical',
          timestamp: Date.now(),
          read: false,
        },
        ...newState.notifications.slice(0, 19),
      ];
      
      newState.grid = grid;
      return newState;
    });
  }, [setState]);
  
  // Listen for global disaster events
  useEffect(() => {
    const handleDisaster = (e: Event) => {
      const customEvent = e as CustomEvent<{ disasterId: DisasterType; disaster: Disaster }>;
      const { disaster } = customEvent.detail;
      
      if (disaster) {
        console.log(`🌋 DISASTER: ${disaster.name} triggered!`);
        applyDisaster(disaster);
      }
    };
    
    window.addEventListener('global-disaster', handleDisaster);
    return () => {
      window.removeEventListener('global-disaster', handleDisaster);
    };
  }, [applyDisaster]);
}
