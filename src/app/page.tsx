'use client';

/**
 * Claude City - AI Governance Simulation
 * Auto-starting simulation where Claude governs the city
 */

import React from 'react';
import { GameProvider } from '@/context/GameContext';
import { GovernorProvider } from '@/context/GovernorContext';
import { SimulationView } from '@/components/simulation/SimulationView';

export default function HomePage() {
  // Simulation starts automatically - no landing page
  // Start with a generated city so Claude has buildings and population to manage
  return (
    <GameProvider startFresh={true} startWithGeneratedCity={true}>
      <GovernorProvider>
        <SimulationView />
      </GovernorProvider>
    </GameProvider>
  );
}
