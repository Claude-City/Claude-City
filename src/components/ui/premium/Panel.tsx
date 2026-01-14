'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  hover?: boolean;
  style?: React.CSSProperties;
}

export function Panel({ children, className, noPadding = false, hover = true, style }: PanelProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-b from-[var(--bg-1)] to-[var(--bg-2)]',
        'border border-[var(--panel-border)]',
        'shadow-[0_4px_24px_rgba(0,0,0,0.4)]',
        // Inner top highlight
        'before:absolute before:inset-x-0 before:top-0 before:h-px',
        'before:bg-gradient-to-r before:from-transparent before:via-[rgba(231,210,178,0.1)] before:to-transparent',
        hover && 'transition-all duration-300 hover:border-[var(--panel-border-hover)] hover:shadow-[0_4px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(231,210,178,0.05)]',
        !noPadding && 'p-4',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

interface PanelHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PanelHeader({ icon, title, subtitle, action, className }: PanelHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgba(191,160,122,0.1)] text-[var(--gold-0)]">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-[var(--text-0)] font-semibold tracking-tight text-sm">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[var(--text-2)] text-xs tracking-wide uppercase mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

interface PanelDividerProps {
  className?: string;
  dotted?: boolean;
}

export function PanelDivider({ className, dotted = false }: PanelDividerProps) {
  return (
    <div 
      className={cn(
        'w-full my-3',
        dotted 
          ? 'border-t border-dotted border-[rgba(191,160,122,0.15)]'
          : 'h-px bg-gradient-to-r from-transparent via-[rgba(191,160,122,0.15)] to-transparent',
        className
      )}
    />
  );
}
