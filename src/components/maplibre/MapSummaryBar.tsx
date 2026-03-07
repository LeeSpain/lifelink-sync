import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle, WifiOff, Pause, Activity } from 'lucide-react';
import { MapSummary } from '@/types/map';
import { cn } from '@/lib/utils';

interface MapSummaryBarProps {
  summary: MapSummary;
  className?: string;
}

export function MapSummaryBar({ summary, className }: MapSummaryBarProps) {
  return (
    <div className={cn(
      'flex items-center gap-4 px-4 py-2 bg-background/95 backdrop-blur-sm border-b text-sm',
      className
    )}>
      <div className="flex items-center gap-1.5">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{summary.totalMembers}</span>
        <span className="text-muted-foreground hidden sm:inline">members</span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="font-medium text-emerald-600">{summary.activeMembers}</span>
        <span className="text-muted-foreground hidden sm:inline">active</span>
      </div>

      {summary.offlineMembers > 0 && (
        <div className="flex items-center gap-1.5">
          <WifiOff className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">{summary.offlineMembers}</span>
          <span className="text-muted-foreground hidden sm:inline">offline</span>
        </div>
      )}

      {summary.pausedMembers > 0 && (
        <div className="flex items-center gap-1.5">
          <Pause className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">{summary.pausedMembers}</span>
          <span className="text-muted-foreground hidden sm:inline">paused</span>
        </div>
      )}

      {summary.activeIncidents > 0 && (
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <Badge variant="destructive" className="text-xs px-1.5 py-0">
            {summary.activeIncidents} SOS
          </Badge>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5 text-muted-foreground">
        <Activity className="w-3.5 h-3.5" />
        <span className="text-xs">{summary.filteredCount} shown</span>
      </div>
    </div>
  );
}
