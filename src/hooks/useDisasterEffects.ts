'use client';

/**
 * Hook to apply disaster effects to the game
 * Listens for global disaster events and modifies game state
 */

import { useEffect, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { DISASTERS, DisasterType, Disaster } from '@/lib/disasters';

export function useDisasterEffects() {
  const { applyDisasterEffects, addNotification } = useGame();
  
  // Apply disaster effects to the game
  const applyDisaster = useCallback((disaster: Disaster) => {
    // Calculate effects based on disaster severity
    const effects = {
      populationLoss: Math.floor(disaster.effects.killPopulation * 10), // Scale for effect
      moneyLoss: Math.floor(disaster.effects.reduceTreasury * 1000), // Scale for effect
      happinessLoss: disaster.effects.reduceHappiness,
      buildingsToAbandon: Math.floor(disaster.effects.destroyBuildings / 5) + 1, // At least 1 building
    };
    
    // Apply the effects
    applyDisasterEffects(effects);
    
    // Show notification
    addNotification(
      `${disaster.icon} ${disaster.name}!`,
      `${disaster.description} The city has suffered damage.`,
      disaster.icon
    );
    
    console.log(`🌋 DISASTER: ${disaster.name} - ${effects.buildingsToAbandon} buildings damaged`);
  }, [applyDisasterEffects, addNotification]);
  
  // Listen for global disaster events
  useEffect(() => {
    const handleDisaster = (e: Event) => {
      const customEvent = e as CustomEvent<{ disasterId: DisasterType; disaster: Disaster }>;
      const { disaster } = customEvent.detail;
      
      if (disaster) {
        applyDisaster(disaster);
      }
    };
    
    window.addEventListener('global-disaster', handleDisaster);
    return () => {
      window.removeEventListener('global-disaster', handleDisaster);
    };
  }, [applyDisaster]);
}
