'use client';

/**
 * Claude City - AI Governance Simulation
 * Auto-starting simulation where Claude governs the city
 * Everyone watches the SAME global simulation
 */

import React from 'react';
import { GlobalSimulationLoader } from '@/components/simulation/GlobalSimulationLoader';

export default function HomePage() {
  // GlobalSimulationLoader handles:
  // 1. Checking for existing global simulation
  // 2. Loading it if exists (everyone sees same state)
  // 3. Creating new one if first visitor
  return <GlobalSimulationLoader />;
}
