import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, AlertTriangle, Users, Smartphone } from 'lucide-react';
import { MapMode } from '@/types/map';
import { cn } from '@/lib/utils';

interface MapModeSwitcherProps {
  mode: MapMode;
  onChange: (mode: MapMode) => void;
  className?: string;
}

const MODES: { id: MapMode; label: string; icon: React.ElementType; available: boolean }[] = [
  { id: 'overview', label: 'Overview', icon: Eye, available: true },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, available: true },
  { id: 'members', label: 'Members', icon: Users, available: true },
  { id: 'devices', label: 'Devices', icon: Smartphone, available: true },
];

export function MapModeSwitcher({ mode, onChange, className }: MapModeSwitcherProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1 mb-2">
        Map Mode
      </div>
      {MODES.map(m => (
        <Button
          key={m.id}
          variant={mode === m.id ? 'default' : 'ghost'}
          size="sm"
          disabled={!m.available}
          onClick={() => onChange(m.id)}
          className={cn(
            'w-full justify-start gap-2 text-sm',
            mode === m.id && 'shadow-sm'
          )}
        >
          <m.icon className="w-4 h-4" />
          {m.label}
        </Button>
      ))}
    </div>
  );
}
