'use client';

/**
 * Simulation Stats Panel
 * Shows city statistics in a compact format
 */

import React from 'react';
import { useGame } from '@/context/GameContext';
import { 
  Users, Heart, GraduationCap, Factory, Home, TreePine, 
  Zap, Droplets, Shield, Flame, TrendingUp, TrendingDown
} from 'lucide-react';

function StatRow({ 
  icon: Icon, 
  label, 
  value, 
  color = 'text-slate-300',
  subValue,
  trend
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  color?: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-slate-400 text-xs">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-sm font-medium ${color}`}>{value}</span>
        {subValue && <span className="text-[10px] text-slate-500">{subValue}</span>}
        {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
        {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
      </div>
    </div>
  );
}

export function SimulationStats() {
  const { state } = useGame();
  
  // Count buildings
  const countBuildings = (types: string[]) => {
    let count = 0;
    for (const row of state.grid) {
      for (const tile of row) {
        if (types.includes(tile.building.type)) count++;
      }
    }
    return count;
  };
  
  const residentialCount = countBuildings([
    'house_small', 'house_medium', 'house_large',
    'residential_small', 'residential_medium', 'residential_large',
    'apartment_small', 'apartment_medium', 'apartment_large'
  ]);
  
  const commercialCount = countBuildings([
    'shop_small', 'shop_medium', 'shop_large',
    'commercial_small', 'commercial_medium', 'commercial_large',
    'office_small', 'office_medium', 'office_large'
  ]);
  
  const industrialCount = countBuildings([
    'factory_small', 'factory_medium', 'factory_large',
    'industrial_small', 'industrial_medium', 'industrial_large'
  ]);
  
  const roads = countBuildings(['road', 'bridge']);
  const parks = countBuildings(['park', 'park_large', 'tennis', 'playground_small', 'playground_large']);
  const powerPlants = countBuildings(['power_plant']);
  const waterTowers = countBuildings(['water_tower']);
  const hospitals = countBuildings(['hospital']);
  const schools = countBuildings(['school', 'university']);
  const police = countBuildings(['police_station']);
  const fire = countBuildings(['fire_station']);
  
  // Determine happiness color
  const happinessColor = state.stats.happiness > 70 
    ? 'text-green-400' 
    : state.stats.happiness > 40 
    ? 'text-yellow-400' 
    : 'text-red-400';
  
  // Determine money trend
  const moneyTrend = state.stats.income > state.stats.expenses 
    ? 'up' 
    : state.stats.income < state.stats.expenses 
    ? 'down' 
    : 'neutral';
  
  return (
    <div className="p-4 border-b border-slate-800">
      <h3 className="text-sm font-medium text-white mb-3">City Statistics</h3>
      
      {/* Key Metrics */}
      <div className="space-y-0.5 mb-4">
        <StatRow 
          icon={Users} 
          label="Population" 
          value={state.stats.population.toLocaleString()}
          color="text-white"
        />
        <StatRow 
          icon={Heart} 
          label="Happiness" 
          value={`${Math.round(state.stats.happiness)}%`}
          color={happinessColor}
        />
        <StatRow 
          icon={Factory} 
          label="Jobs" 
          value={state.stats.jobs.toLocaleString()}
          subValue={state.stats.population > 0 
            ? `${Math.round((state.stats.jobs / state.stats.population) * 100)}%` 
            : '0%'}
        />
      </div>
      
      {/* Finances */}
      <div className="bg-slate-800/30 rounded-lg p-2 mb-4">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Treasury</div>
        <div className="text-lg font-medium text-emerald-400">${state.stats.money.toLocaleString()}</div>
        <div className="flex items-center gap-2 text-[10px] mt-1">
          <span className="text-green-400">+${state.stats.income}</span>
          <span className="text-slate-600">/</span>
          <span className="text-red-400">-${state.stats.expenses}</span>
          <span className={`ml-auto ${moneyTrend === 'up' ? 'text-green-400' : moneyTrend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
            {moneyTrend === 'up' ? '↑' : moneyTrend === 'down' ? '↓' : '→'} 
            ${Math.abs(state.stats.income - state.stats.expenses)}
          </span>
        </div>
      </div>
      
      {/* Infrastructure Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
        <StatRow icon={Home} label="Housing" value={residentialCount} />
        <StatRow icon={Factory} label="Industry" value={industrialCount} />
        <StatRow icon={TreePine} label="Parks" value={parks} color="text-green-400" />
        <StatRow icon={Zap} label="Power" value={powerPlants} color="text-yellow-400" />
        <StatRow icon={Droplets} label="Water" value={waterTowers} color="text-blue-400" />
        <StatRow icon={Shield} label="Police" value={police} color="text-blue-300" />
        <StatRow icon={Flame} label="Fire" value={fire} color="text-orange-400" />
        <StatRow icon={GraduationCap} label="Schools" value={schools} color="text-purple-400" />
      </div>
    </div>
  );
}
