'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type StatVariant = 'money' | 'happiness' | 'population' | 'warning' | 'info' | 'neutral' | 'gold';

interface StatLineProps {
  label: string;
  value: string | number;
  variant?: StatVariant;
  icon?: React.ReactNode;
  suffix?: string;
  glow?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles: Record<StatVariant, { text: string; glow: string }> = {
  money: {
    text: 'text-[var(--stat-money)]',
    glow: 'text-shadow-[0_0_12px_var(--stat-money-glow)]',
  },
  happiness: {
    text: 'text-[var(--stat-happiness)]',
    glow: 'text-shadow-[0_0_12px_var(--stat-happiness-glow)]',
  },
  population: {
    text: 'text-[var(--stat-population)]',
    glow: 'text-shadow-[0_0_12px_var(--stat-population-glow)]',
  },
  warning: {
    text: 'text-[var(--stat-warning)]',
    glow: '',
  },
  info: {
    text: 'text-[var(--stat-info)]',
    glow: '',
  },
  neutral: {
    text: 'text-[var(--stat-neutral)]',
    glow: '',
  },
  gold: {
    text: 'text-[var(--gold-0)]',
    glow: 'text-shadow-[0_0_12px_rgba(231,210,178,0.2)]',
  },
};

const sizeStyles = {
  sm: { value: 'text-sm', label: 'text-[10px]' },
  md: { value: 'text-base', label: 'text-xs' },
  lg: { value: 'text-lg', label: 'text-xs' },
};

export function StatLine({ 
  label, 
  value, 
  variant = 'neutral', 
  icon, 
  suffix,
  glow = false,
  size = 'md',
  className 
}: StatLineProps) {
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {icon && (
        <span className={cn('opacity-60', styles.text)}>
          {icon}
        </span>
      )}
      <div className="flex flex-col">
        <span className={cn(
          'uppercase tracking-wider text-[var(--text-2)] font-medium',
          sizes.label
        )}>
          {label}
        </span>
        <span className={cn(
          'font-semibold tracking-tight',
          styles.text,
          glow && styles.glow,
          sizes.value
        )}>
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix && <span className="text-[var(--text-2)] font-normal ml-1">{suffix}</span>}
        </span>
      </div>
    </div>
  );
}

interface StatPillProps {
  label: string;
  value: string | number;
  variant?: StatVariant;
  className?: string;
}

export function StatPill({ label, value, variant = 'neutral', className }: StatPillProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg',
      'bg-[rgba(11,16,26,0.6)] border border-[rgba(191,160,122,0.1)]',
      className
    )}>
      <span className="text-[10px] uppercase tracking-wider text-[var(--text-2)] font-medium">
        {label}
      </span>
      <span className={cn('font-semibold text-sm', styles.text)}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ children, columns = 2, className }: StatGridProps) {
  const colsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', colsClass[columns], className)}>
      {children}
    </div>
  );
}
