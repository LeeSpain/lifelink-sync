import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, MessageCircle, Phone, Navigation, AlertTriangle, Battery, Clock, MapPin } from 'lucide-react';
import { MapEntity, STATUS_LABELS, getStatusFromPresence, STATUS_COLORS, getUrgencyFromStatus } from '@/types/map';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface MapDetailsDrawerProps {
  entity: MapEntity | null;
  onClose: () => void;
  className?: string;
}

export function MapDetailsDrawer({ entity, onClose, className }: MapDetailsDrawerProps) {
  if (!entity) return null;

  const status = entity.status || getStatusFromPresence(entity.last_seen, entity.is_paused);
  const urgency = getUrgencyFromStatus(status);
  const color = STATUS_COLORS[urgency];

  const initials = getInitials(entity);
  const displayName = entity.first_name
    ? `${entity.first_name} ${entity.last_name || ''}`.trim()
    : entity.label || 'Member';

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${entity.lat},${entity.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className={cn(
      'bg-background border-l shadow-lg flex flex-col w-80 overflow-y-auto',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Entity Info */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-14 h-14 border-2" style={{ borderColor: color }}>
            {entity.avatar_url && <AvatarImage src={entity.avatar_url} />}
            <AvatarFallback className="text-white font-bold" style={{ background: color }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{displayName}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-sm text-muted-foreground">{STATUS_LABELS[status]}</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-mono text-xs">{entity.lat.toFixed(6)}, {entity.lng.toFixed(6)}</span>
          </div>
          {entity.last_seen && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{formatDistanceToNow(new Date(entity.last_seen), { addSuffix: true })}</span>
            </div>
          )}
          {entity.battery != null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Battery className="w-4 h-4 flex-shrink-0" />
              <span>{entity.battery}%</span>
              {entity.battery < 20 && (
                <Badge variant="destructive" className="text-xs px-1 py-0">Low</Badge>
              )}
            </div>
          )}
          {entity.accuracy != null && (
            <div className="text-xs text-muted-foreground">
              Accuracy: &plusmn;{Math.round(entity.accuracy)}m
            </div>
          )}
          {entity.speed != null && entity.speed > 0 && (
            <div className="text-xs text-muted-foreground">
              Speed: {Math.round(entity.speed * 3.6)} km/h
            </div>
          )}
        </div>

        {/* Paused warning */}
        {entity.is_paused && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="text-sm text-amber-800 dark:text-amber-200">
              Location sharing paused. Location shown may not be current.
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            Message
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            Call
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleNavigate}>
            <Navigation className="w-3.5 h-3.5" />
            Navigate
          </Button>
          <Button variant="destructive" size="sm" className="gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Emergency
          </Button>
        </div>
      </div>
    </div>
  );
}

function getInitials(entity: MapEntity): string {
  if (entity.first_name && entity.last_name) {
    return `${entity.first_name[0]}${entity.last_name[0]}`.toUpperCase();
  }
  if (entity.first_name) return entity.first_name[0].toUpperCase();
  if (entity.label) return entity.label.slice(0, 2).toUpperCase();
  return entity.id.slice(0, 2).toUpperCase();
}
