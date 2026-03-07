import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { MapFilterState, MemberStatus, STATUS_LABELS } from '@/types/map';
import { cn } from '@/lib/utils';

interface MapFiltersPanelProps {
  filters: MapFilterState;
  onSearchChange: (q: string) => void;
  onToggleStatus: (status: MemberStatus) => void;
  className?: string;
}

const STATUS_CONFIGS: { status: MemberStatus; color: string }[] = [
  { status: 'live', color: 'bg-emerald-500' },
  { status: 'idle', color: 'bg-amber-500' },
  { status: 'offline', color: 'bg-slate-400' },
  { status: 'paused', color: 'bg-violet-400' },
];

export function MapFiltersPanel({ filters, onSearchChange, onToggleStatus, className }: MapFiltersPanelProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      <div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">
          Search
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={filters.searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-8 pr-8 h-9 text-sm"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Status Filters */}
      <div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">
          Status
        </div>
        <div className="space-y-1">
          {STATUS_CONFIGS.map(({ status, color }) => {
            const isActive = filters.statusFilters.includes(status);
            return (
              <button
                key={status}
                onClick={() => onToggleStatus(status)}
                className={cn(
                  'flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'
                )}
              >
                <div className={cn('w-2.5 h-2.5 rounded-full', color, !isActive && 'opacity-40')} />
                <span>{STATUS_LABELS[status]}</span>
                {isActive && (
                  <Badge variant="secondary" className="ml-auto text-xs px-1 py-0 h-4">
                    on
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
