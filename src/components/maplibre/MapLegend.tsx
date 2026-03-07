import React from 'react';
import { cn } from '@/lib/utils';

interface MapLegendProps {
  className?: string;
}

const LEGEND_ITEMS = [
  { color: '#22c55e', label: 'Active / Online' },
  { color: '#f59e0b', label: 'Away / Idle' },
  { color: '#ef4444', label: 'SOS / Urgent' },
  { color: '#94a3b8', label: 'Offline / Paused' },
  { color: '#3b82f6', label: 'Operational / Admin' },
];

export function MapLegend({ className }: MapLegendProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">
        Legend
      </div>
      {LEGEND_ITEMS.map(item => (
        <div key={item.label} className="flex items-center gap-2 px-1 py-0.5">
          <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: item.color }} />
          <span className="text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
