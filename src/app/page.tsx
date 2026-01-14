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
  return (
    <GameProvider startFresh={true}>
      <GovernorProvider>
        <SimulationView />
      </GovernorProvider>
    </GameProvider>
  );
}
