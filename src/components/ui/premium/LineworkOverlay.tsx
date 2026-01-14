'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LineworkOverlayProps {
  variant?: 'grid' | 'circuit' | 'maze' | 'horizon';
  opacity?: number;
  animated?: boolean;
  className?: string;
}

export function LineworkOverlay({ 
  variant = 'grid', 
  opacity = 0.04,
  animated = false,
  className 
}: LineworkOverlayProps) {
  const patterns = {
    grid: (
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path 
              d="M 40 0 L 0 0 0 40" 
              fill="none" 
              stroke="var(--gold-1)" 
              strokeWidth="0.5"
            />
          </pattern>
          <pattern id="grid-pattern-large" width="120" height="120" patternUnits="userSpaceOnUse">
            <path 
              d="M 120 0 L 0 0 0 120" 
              fill="none" 
              stroke="var(--gold-0)" 
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        <rect width="100%" height="100%" fill="url(#grid-pattern-large)" />
      </svg>
    ),
    circuit: (
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuit-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
            <path 
              d="M40 0v20M40 60v20M0 40h20M60 40h20M40 40h20v20M20 20h20v20" 
              fill="none" 
              stroke="var(--gold-1)" 
              strokeWidth="0.5"
            />
            <circle cx="40" cy="40" r="2" fill="var(--gold-2)" />
            <circle cx="20" cy="20" r="1.5" fill="var(--gold-2)" />
            <circle cx="60" cy="60" r="1.5" fill="var(--gold-2)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
      </svg>
    ),
    maze: (
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="maze-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path 
              d="M0 30h15v15h15v-30h15v45h-30v-15h-15z" 
              fill="none" 
              stroke="var(--gold-1)" 
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#maze-pattern)" />
      </svg>
    ),
    horizon: null,
  };

  if (variant === 'horizon') {
    return (
      <div 
        className={cn(
          'absolute inset-0 pointer-events-none',
          animated && 'animate-pulse',
          className
        )}
        style={{ opacity }}
      >
        {/* Radial gradient center glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(231,210,178,0.08)_0%,transparent_70%)]" />
        
        {/* Horizon line */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[var(--gold-0)] to-transparent opacity-30" />
        
        {/* Perspective grid lines */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="horizon-fade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--gold-1)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--gold-1)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--gold-1)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Vertical perspective lines */}
          {[...Array(9)].map((_, i) => (
            <line
              key={`v-${i}`}
              x1={`${(i + 1) * 10}%`}
              y1="50%"
              x2={`${50 + (i - 4) * 5}%`}
              y2="100%"
              stroke="url(#horizon-fade)"
              strokeWidth="0.5"
            />
          ))}
          {/* Horizontal perspective lines */}
          {[...Array(5)].map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0%"
              y1={`${55 + i * 10}%`}
              x2="100%"
              y2={`${55 + i * 10}%`}
              stroke="var(--gold-1)"
              strokeWidth="0.3"
              opacity={0.2 - i * 0.03}
            />
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'absolute inset-0 pointer-events-none overflow-hidden',
        animated && 'animate-[linework-drift_60s_linear_infinite]',
        className
      )}
      style={{ opacity }}
    >
      {patterns[variant]}
    </div>
  );
}

// Animated shimmer effect for subtle ambience
export function ShimmerOverlay({ className }: { className?: string }) {
  return (
    <div className={cn(
      'absolute inset-0 pointer-events-none overflow-hidden',
      className
    )}>
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(231,210,178,0.03)] to-transparent"
        style={{
          animation: 'shimmer 8s ease-in-out infinite',
          transform: 'skewX(-20deg)',
        }}
      />
      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { transform: translateX(-200%) skewX(-20deg); }
          50% { transform: translateX(200%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
}
