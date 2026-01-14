'use client';

/**
 * Simulation Stats - Clean minimal style
 */

import React from 'react';
import { useGame } from '@/context/GameContext';
import { 
  Users, Heart, Factory, Home, TreePine, 
  Zap, Droplets, Shield, Flame, GraduationCap, TrendingUp, TrendingDown, BarChart3
} from 'lucide-react';

function Stat({ icon: Icon, label, value, color }: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <Icon className="w-3 h-3" style={{ color: color || 'rgba(255,255,255,0.3)' }} />
        <span className="text-[11px] text-white/40">{label}</span>
      </div>
      <span className="text-[11px] font-medium" style={{ color: color || 'rgba(255,255,255,0.7)' }}>
        {value}
      </span>
    </div>
  );
}

export function SimulationStats() {
  const { state } = useGame();
  
  const count = (types: string[]) => {
    let c = 0;
    for (const row of state.grid) {
      for (const tile of row) {
        if (types.includes(tile.building.type)) c++;
      }
    }
    return c;
  };
  
  const housing = count(['house_small', 'house_medium', 'house_large', 'residential_small', 'residential_medium', 'residential_large', 'apartment_small', 'apartment_medium', 'apartment_large']);
  const industry = count(['factory_small', 'factory_medium', 'factory_large', 'industrial_small', 'industrial_medium', 'industrial_large']);
  const parks = count(['park', 'park_large', 'tennis', 'playground_small', 'playground_large']);
  const power = count(['power_plant']);
  const water = count(['water_tower']);
  const police = count(['police_station']);
  const fire = count(['fire_station']);
  const schools = count(['school', 'university']);
  
  const happyColor = state.stats.happiness > 70 ? '#4ade80' : state.stats.happiness > 40 ? '#fbbf24' : '#f87171';
  const trend = state.stats.income > state.stats.expenses ? 'up' : state.stats.income < state.stats.expenses ? 'down' : null;
  
  return (
    <div className="p-3 space-y-3 border-b border-white/5">
      {/* Key Stats */}
      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-3.5 h-3.5 text-white/40" />
          <span className="text-[11px] font-medium text-white/40">Stats</span>
        </div>
        <Stat icon={Users} label="Population" value={state.stats.population.toLocaleString()} color="#60a5fa" />
        <Stat icon={Heart} label="Happiness" value={`${Math.round(state.stats.happiness)}%`} color={happyColor} />
        <Stat icon={Factory} label="Jobs" value={state.stats.jobs.toLocaleString()} />
      </div>
      
      {/* Treasury */}
      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Treasury</div>
        <div className="text-lg font-semibold text-[#4ade80] mb-2">${state.stats.money.toLocaleString()}</div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-[#4ade80]">+${state.stats.income}</span>
          <span className="text-white/20">/</span>
          <span className="text-[#f87171]">-${state.stats.expenses}</span>
          <span className="ml-auto flex items-center gap-1">
            {trend === 'up' && <TrendingUp className="w-3 h-3 text-[#4ade80]" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 text-[#f87171]" />}
            <span className={trend === 'up' ? 'text-[#4ade80]' : trend === 'down' ? 'text-[#f87171]' : 'text-white/40'}>
              ${Math.abs(state.stats.income - state.stats.expenses)}
            </span>
          </span>
        </div>
      </div>
      
      {/* Infrastructure */}
      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Infrastructure</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <Stat icon={Home} label="Housing" value={housing} />
          <Stat icon={Factory} label="Industry" value={industry} />
          <Stat icon={TreePine} label="Parks" value={parks} color="#4ade80" />
          <Stat icon={Zap} label="Power" value={power} color="#fbbf24" />
          <Stat icon={Droplets} label="Water" value={water} color="#60a5fa" />
          <Stat icon={Shield} label="Police" value={police} />
          <Stat icon={Flame} label="Fire" value={fire} color="#fb923c" />
          <Stat icon={GraduationCap} label="Schools" value={schools} color="#5eead4" />
        </div>
      </div>
    </div>
  );
}
