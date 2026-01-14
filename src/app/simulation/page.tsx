'use client';

/**
 * Claude City Simulation
 * A pure simulation where Claude AI governs and builds the city.
 * Players are spectators - they can only watch Claude's decisions.
 */

import React, { useEffect, useState } from 'react';
import { GameProvider } from '@/context/GameContext';
import { GovernorProvider } from '@/context/GovernorContext';
import { SimulationView } from '@/components/simulation/SimulationView';
import { Brain, Play, Loader2 } from 'lucide-react';

export default function SimulationPage() {
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    setIsLoading(true);
    // Small delay for effect
    setTimeout(() => {
      setIsStarted(true);
      setIsLoading(false);
    }, 1000);
  };

  if (!isStarted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
        <div className="max-w-2xl text-center space-y-8">
          {/* Title */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Brain className="w-12 h-12 text-cyan-400 animate-pulse" />
              <h1 className="text-6xl font-light tracking-wider text-white/90">
                Claude City
              </h1>
            </div>
            <p className="text-xl text-slate-400 font-light">
              AI Governance Simulation
            </p>
          </div>

          {/* Description */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 space-y-4">
            <p className="text-slate-300 leading-relaxed">
              Watch as <span className="text-cyan-400 font-medium">Claude</span>, an AI governor, 
              builds and manages a city from scratch. Claude will make all decisions about 
              zoning, infrastructure, taxes, and development.
            </p>
            <p className="text-slate-400 text-sm">
              You are a spectator. Observe Claude&apos;s reasoning, watch the city grow, 
              and see how an AI approaches urban planning and governance.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-800/20 border border-slate-700/30 rounded-lg p-4">
              <div className="text-cyan-400 font-medium mb-1">🏗️ Building</div>
              <div className="text-slate-400">Claude places infrastructure</div>
            </div>
            <div className="bg-slate-800/20 border border-slate-700/30 rounded-lg p-4">
              <div className="text-cyan-400 font-medium mb-1">📊 Planning</div>
              <div className="text-slate-400">Zone residential, commercial, industrial</div>
            </div>
            <div className="bg-slate-800/20 border border-slate-700/30 rounded-lg p-4">
              <div className="text-cyan-400 font-medium mb-1">💭 Reasoning</div>
              <div className="text-slate-400">See Claude&apos;s thought process</div>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="px-12 py-4 text-xl font-light tracking-wide bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 rounded-lg transition-all duration-300 flex items-center gap-3 mx-auto disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                Begin Simulation
              </>
            )}
          </button>

          {/* Credits */}
          <p className="text-slate-600 text-xs">
            Powered by Claude (Anthropic) • Based on IsoCity
          </p>
        </div>
      </main>
    );
  }

  return (
    <GameProvider startFresh={true}>
      <GovernorProvider>
        <SimulationView />
      </GovernorProvider>
    </GameProvider>
  );
}
