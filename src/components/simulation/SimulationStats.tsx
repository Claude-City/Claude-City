'use client';

/**
 * Simulation Stats Panel - Premium Edition
 * Gold linework theme with elegant stat display
 */

import React from 'react';
import { useGame } from '@/context/GameContext';
import { Panel, PanelDivider } from '@/components/ui/premium';
import { 
  Users, Heart, GraduationCap, Factory, Home, TreePine, 
  Zap, Droplets, Shield, Flame, TrendingUp, TrendingDown, BarChart3
} from 'lucide-react';

interface StatRowProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatRow({ icon: Icon, label, value, color, subValue, trend }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: color || 'var(--text-2)' }} />
        <span className="text-xs" style={{ color: 'var(--text-2)' }}>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold" style={{ color: color || 'var(--text-0)' }}>
          {value}
        </span>
        {subValue && (
          <span className="text-[10px]" style={{ color: 'var(--text-2)' }}>{subValue}</span>
        )}
        {trend === 'up' && <TrendingUp className="w-3 h-3" style={{ color: 'var(--stat-money)' }} />}
        {trend === 'down' && <TrendingDown className="w-3 h-3" style={{ color: 'var(--stat-happiness)' }} />}
      </div>
    </div>
  );
}

export function SimulationStats() {
  const { state } = useGame();
  
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
  
  const industrialCount = countBuildings([
    'factory_small', 'factory_medium', 'factory_large',
    'industrial_small', 'industrial_medium', 'industrial_large'
  ]);
  
  const parks = countBuildings(['park', 'park_large', 'tennis', 'playground_small', 'playground_large']);
  const powerPlants = countBuildings(['power_plant']);
  const waterTowers = countBuildings(['water_tower']);
  const schools = countBuildings(['school', 'university']);
  const police = countBuildings(['police_station']);
  const fire = countBuildings(['fire_station']);
  
  const happinessColor = state.stats.happiness > 70 
    ? 'var(--stat-money)' 
    : state.stats.happiness > 40 
    ? 'var(--stat-warning)' 
    : 'var(--stat-happiness)';
  
  const moneyTrend = state.stats.income > state.stats.expenses 
    ? 'up' 
    : state.stats.income < state.stats.expenses 
    ? 'down' 
    : 'neutral';
  
  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <Panel className="!p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4" style={{ color: 'var(--gold-0)' }} />
          <span 
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--gold-0)' }}>
            City Statistics
          </span>
        </div>
        
        {/* Key Metrics */}
        <div className="space-y-1">
          <StatRow 
            icon={Users} 
            label="Population" 
            value={state.stats.population.toLocaleString()}
            color="var(--stat-population)"
          />
          <StatRow 
            icon={Heart} 
            label="Happiness" 
            value={`${Math.round(state.stats.happiness)}%`}
            color={happinessColor}
          />
          <StatRow 
            icon={Factory} 
            label="Employment" 
            value={state.stats.jobs.toLocaleString()}
            subValue={state.stats.population > 0 
              ? `${Math.round((state.stats.jobs / state.stats.population) * 100)}%` 
              : '0%'}
            color="var(--text-0)"
          />
        </div>
      </Panel>
      
      {/* Treasury */}
      <Panel className="!p-4">
        <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-2)' }}>
          Treasury
        </div>
        <div 
          className="text-2xl font-semibold stat-glow-money"
          style={{ color: 'var(--stat-money)' }}>
          ${state.stats.money.toLocaleString()}
        </div>
        
        <PanelDivider className="!my-3" />
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--stat-money)' }}>
              +${state.stats.income.toLocaleString()}
            </span>
            <span style={{ color: 'var(--gold-2)' }}>/</span>
            <span style={{ color: 'var(--stat-happiness)' }}>
              -${state.stats.expenses.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {moneyTrend === 'up' ? (
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--stat-money)' }} />
            ) : moneyTrend === 'down' ? (
              <TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--stat-happiness)' }} />
            ) : (
              <span style={{ color: 'var(--text-2)' }}>→</span>
            )}
            <span style={{ 
              color: moneyTrend === 'up' 
                ? 'var(--stat-money)' 
                : moneyTrend === 'down' 
                ? 'var(--stat-happiness)' 
                : 'var(--text-2)'
            }}>
              ${Math.abs(state.stats.income - state.stats.expenses).toLocaleString()}
            </span>
          </div>
        </div>
      </Panel>
      
      {/* Infrastructure */}
      <Panel className="!p-4">
        <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--text-2)' }}>
          Infrastructure
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <StatRow icon={Home} label="Housing" value={residentialCount} color="var(--text-0)" />
          <StatRow icon={Factory} label="Industry" value={industrialCount} color="var(--text-0)" />
          <StatRow icon={TreePine} label="Parks" value={parks} color="var(--stat-money)" />
          <StatRow icon={Zap} label="Power" value={powerPlants} color="var(--stat-warning)" />
          <StatRow icon={Droplets} label="Water" value={waterTowers} color="var(--stat-population)" />
          <StatRow icon={Shield} label="Police" value={police} color="var(--stat-info)" />
          <StatRow icon={Flame} label="Fire" value={fire} color="#FB923C" />
          <StatRow icon={GraduationCap} label="Schools" value={schools} color="var(--teal-0)" />
        </div>
      </Panel>
    </div>
  );
}
