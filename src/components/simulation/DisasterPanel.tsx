'use client';

/**
 * Disaster Panel
 * Global spectator controls to unleash chaos on the city
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  DISASTERS, 
  DisasterType, 
  getDisasterCooldowns, 
  triggerDisaster 
} from '@/lib/disasters';
import { Skull, Loader2 } from 'lucide-react';

interface CooldownState {
  onCooldown: boolean;
  remainingMinutes: number;
  lastTriggeredBy: string;
}

export function DisasterPanel() {
  const [cooldowns, setCooldowns] = useState<Map<DisasterType, CooldownState>>(new Map());
  const [loading, setLoading] = useState<DisasterType | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Fetch cooldowns on mount and periodically
  const fetchCooldowns = useCallback(async () => {
    const data = await getDisasterCooldowns();
    setCooldowns(data);
  }, []);
  
  useEffect(() => {
    fetchCooldowns();
    const interval = setInterval(fetchCooldowns, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchCooldowns]);
  
  // Handle disaster trigger
  const handleTrigger = async (disasterId: DisasterType) => {
    setLoading(disasterId);
    setMessage(null);
    
    const result = await triggerDisaster(disasterId);
    
    setLoading(null);
    setMessage(result.message);
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
    
    // Refresh cooldowns
    await fetchCooldowns();
  };
  
  const disasterList = Object.values(DISASTERS);
  
  return (
    <div className="absolute bottom-4 left-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          isExpanded 
            ? 'bg-red-600 text-white' 
            : 'bg-slate-800/90 text-red-400 hover:bg-slate-700'
        }`}
      >
        <Skull className="w-5 h-5" />
        <span className="font-medium">Unleash Chaos</span>
      </button>
      
      {/* Disaster Grid */}
      {isExpanded && (
        <div className="mt-2 p-4 bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl backdrop-blur-sm w-80">
          <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
            <span>🌋</span> GLOBAL DISASTERS
            <span className="text-xs text-slate-500">(affects everyone)</span>
          </h3>
          
          {/* Message */}
          {message && (
            <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-sm text-red-300">
              {message}
            </div>
          )}
          
          {/* Disaster Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {disasterList.map((disaster) => {
              const cooldown = cooldowns.get(disaster.id);
              const isOnCooldown = cooldown?.onCooldown ?? false;
              const isLoading = loading === disaster.id;
              
              return (
                <button
                  key={disaster.id}
                  onClick={() => handleTrigger(disaster.id)}
                  disabled={isOnCooldown || isLoading}
                  className={`relative p-3 rounded-lg text-left transition-all ${
                    isOnCooldown
                      ? 'bg-slate-800/50 cursor-not-allowed opacity-60'
                      : 'bg-slate-800 hover:bg-red-900/50 hover:border-red-500/50 border border-transparent'
                  }`}
                  title={disaster.description}
                >
                  {/* Icon and Name */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{disaster.icon}</span>
                    <span className="text-sm font-medium text-white truncate">
                      {disaster.name}
                    </span>
                  </div>
                  
                  {/* Cooldown or Ready */}
                  <div className="text-xs">
                    {isLoading ? (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Triggering...
                      </span>
                    ) : isOnCooldown ? (
                      <span className="text-slate-500">
                        ⏱️ {cooldown?.remainingMinutes}m cooldown
                      </span>
                    ) : (
                      <span className="text-green-400">✓ Ready</span>
                    )}
                  </div>
                  
                  {/* Severity Badge */}
                  <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    disaster.severity === 'catastrophic' 
                      ? 'bg-red-500/30 text-red-300'
                      : disaster.severity === 'moderate'
                      ? 'bg-yellow-500/30 text-yellow-300'
                      : 'bg-blue-500/30 text-blue-300'
                  }`}>
                    {disaster.severity === 'catastrophic' ? '💀' : disaster.severity === 'moderate' ? '⚠️' : '•'}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Info */}
          <p className="mt-3 text-xs text-slate-500 text-center">
            Cooldowns are global — if someone triggers a disaster, everyone must wait!
          </p>
        </div>
      )}
    </div>
  );
}
