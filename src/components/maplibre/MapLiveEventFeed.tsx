import React from 'react';
import { ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface MapEvent {
  id: string;
  type: 'enter' | 'exit' | 'sos' | 'update';
  user_id: string;
  user_label?: string;
  place_name?: string;
  timestamp: string;
}

interface MapLiveEventFeedProps {
  events: MapEvent[];
  className?: string;
  maxItems?: number;
}

export function MapLiveEventFeed({ events, className, maxItems = 5 }: MapLiveEventFeedProps) {
  if (events.length === 0) return null;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
        Live Events
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {events.slice(0, maxItems).map(event => (
          <div
            key={event.id}
            className={cn(
              'flex items-start gap-2 p-2 rounded-md text-xs',
              event.type === 'sos' ? 'bg-red-50 dark:bg-red-950/20' : 'bg-muted/50'
            )}
          >
            {event.type === 'enter' && <ArrowRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />}
            {event.type === 'exit' && <ArrowLeft className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />}
            {event.type === 'sos' && <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <span className="font-medium">
                {event.user_label || event.user_id.slice(0, 8)}
              </span>
              {' '}
              {event.type === 'enter' && <>arrived at <span className="font-medium">{event.place_name}</span></>}
              {event.type === 'exit' && <>left <span className="font-medium">{event.place_name}</span></>}
              {event.type === 'sos' && <span className="text-red-600 font-medium">triggered SOS</span>}
              <div className="text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
