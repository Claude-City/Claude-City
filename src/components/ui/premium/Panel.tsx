'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  hover?: boolean;
  style?: React.CSSProperties;
  glass?: boolean;
}

export function Panel({ children, className, noPadding = false, hover = false, style, glass = true }: PanelProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl',
        glass && 'backdrop-blur-sm',
        hover && 'transition-all duration-200 hover:bg-white/[0.03]',
        !noPadding && 'p-4',
        className
      )}
      style={{
        background: glass ? 'rgba(20, 22, 27, 0.6)' : 'var(--bg-2)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        ...style
      }}
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
    <div className={cn('flex items-center justify-between mb-3', className)}>
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="opacity-60">
            {icon}
          </span>
        )}
        <div>
          <h3 className="text-[13px] font-medium" style={{ color: 'var(--text-0)' }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-2)' }}>
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
      className={cn('w-full my-3', className)}
      style={{
        height: '1px',
        background: dotted ? 'none' : 'rgba(255, 255, 255, 0.05)',
        borderTop: dotted ? '1px dashed rgba(255, 255, 255, 0.08)' : 'none'
      }}
    />
  );
}
