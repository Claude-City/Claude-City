/**
 * Global Disaster System Types
 * Spectators can trigger disasters with global cooldowns
 */

export type DisasterType = 
  | 'meteor'
  | 'earthquake'
  | 'fire'
  | 'flood'
  | 'tornado'
  | 'plague'
  | 'alien_invasion'
  | 'godzilla';

export interface Disaster {
  id: DisasterType;
  name: string;
  description: string;
  icon: string;
  cooldownMinutes: number;
  severity: 'minor' | 'moderate' | 'catastrophic';
  effects: {
    destroyBuildings: number;      // percentage of buildings affected
    killPopulation: number;        // percentage of population affected
    damageInfrastructure: number;  // percentage of roads/utilities affected
    reduceTreasury: number;        // percentage of money lost
    reduceHappiness: number;       // happiness points lost
  };
}

export interface DisasterCooldown {
  disaster_id: DisasterType;
  last_triggered: string;          // ISO timestamp
  triggered_by: string;            // anonymous user ID
  project_id: string;
}

export interface DisasterEvent {
  id: string;
  disaster_id: DisasterType;
  triggered_at: string;
  affected_tiles: { x: number; y: number }[];
  damage_report: {
    buildingsDestroyed: number;
    populationLost: number;
    moneyLost: number;
  };
}

// All available disasters
export const DISASTERS: Record<DisasterType, Disaster> = {
  meteor: {
    id: 'meteor',
    name: 'Meteor Strike',
    description: 'A massive meteor crashes into the city!',
    icon: '☄️',
    cooldownMinutes: 60,
    severity: 'catastrophic',
    effects: {
      destroyBuildings: 15,
      killPopulation: 10,
      damageInfrastructure: 20,
      reduceTreasury: 5,
      reduceHappiness: 25,
    },
  },
  earthquake: {
    id: 'earthquake',
    name: 'Earthquake',
    description: 'The ground shakes violently!',
    icon: '🌋',
    cooldownMinutes: 45,
    severity: 'catastrophic',
    effects: {
      destroyBuildings: 20,
      killPopulation: 5,
      damageInfrastructure: 30,
      reduceTreasury: 10,
      reduceHappiness: 20,
    },
  },
  fire: {
    id: 'fire',
    name: 'Wildfire',
    description: 'Flames spread across the city!',
    icon: '🔥',
    cooldownMinutes: 30,
    severity: 'moderate',
    effects: {
      destroyBuildings: 10,
      killPopulation: 3,
      damageInfrastructure: 5,
      reduceTreasury: 3,
      reduceHappiness: 15,
    },
  },
  flood: {
    id: 'flood',
    name: 'Great Flood',
    description: 'Waters rise and engulf the city!',
    icon: '🌊',
    cooldownMinutes: 40,
    severity: 'moderate',
    effects: {
      destroyBuildings: 8,
      killPopulation: 2,
      damageInfrastructure: 25,
      reduceTreasury: 8,
      reduceHappiness: 18,
    },
  },
  tornado: {
    id: 'tornado',
    name: 'Tornado',
    description: 'A massive twister tears through!',
    icon: '🌪️',
    cooldownMinutes: 35,
    severity: 'moderate',
    effects: {
      destroyBuildings: 12,
      killPopulation: 4,
      damageInfrastructure: 15,
      reduceTreasury: 5,
      reduceHappiness: 20,
    },
  },
  plague: {
    id: 'plague',
    name: 'Plague',
    description: 'A deadly disease spreads!',
    icon: '🦠',
    cooldownMinutes: 50,
    severity: 'moderate',
    effects: {
      destroyBuildings: 0,
      killPopulation: 15,
      damageInfrastructure: 0,
      reduceTreasury: 15,
      reduceHappiness: 30,
    },
  },
  alien_invasion: {
    id: 'alien_invasion',
    name: 'Alien Invasion',
    description: 'UFOs attack the city!',
    icon: '👽',
    cooldownMinutes: 90,
    severity: 'catastrophic',
    effects: {
      destroyBuildings: 25,
      killPopulation: 8,
      damageInfrastructure: 20,
      reduceTreasury: 20,
      reduceHappiness: 35,
    },
  },
  godzilla: {
    id: 'godzilla',
    name: 'Godzilla',
    description: 'A giant monster attacks!',
    icon: '🦖',
    cooldownMinutes: 120,
    severity: 'catastrophic',
    effects: {
      destroyBuildings: 30,
      killPopulation: 5,
      damageInfrastructure: 35,
      reduceTreasury: 15,
      reduceHappiness: 40,
    },
  },
};
