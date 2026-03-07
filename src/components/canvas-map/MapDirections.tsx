import React, { useState, useCallback } from 'react';
import { Navigation, MapPin, Clock, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DirectionsProps {
  onDirectionsCalculated: (route: RouteData) => void;
  fromLocation?: { lat: number; lng: number; name?: string };
  toLocation?: { lat: number; lng: number; name?: string };
  className?: string;
}

interface RouteData {
  coordinates: Array<[number, number]>; // [lng, lat] pairs
  distance: number; // in meters
  duration: number; // in seconds
  instructions: Array<{
    instruction: string;
    distance: number;
    time: number;
  }>;
}

export const MapDirections: React.FC<DirectionsProps> = ({
  onDirectionsCalculated,
  fromLocation,
  toLocation,
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateDirections = useCallback(async () => {
    if (!fromLocation || !toLocation) {
      setError('Please select both start and end locations');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // No external API configured: use a direct route approximation
      const directRoute = calculateDirectRoute(fromLocation, toLocation);
      setRoute(directRoute);
      onDirectionsCalculated(directRoute);
    } catch (err) {
      console.error('Directions error:', err);
      setError('Failed to calculate route');
    } finally {
      setIsLoading(false);
    }
  }, [fromLocation, toLocation, onDirectionsCalculated]);

  // Simple direct route calculation as fallback
  const calculateDirectRoute = (from: { lat: number; lng: number }, to: { lat: number; lng: number }): RouteData => {
    const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
    const duration = Math.round(distance / 50 * 3600); // Assume 50 km/h average speed

    return {
      coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
      distance: distance * 1000, // Convert to meters
      duration,
      instructions: [
        {
          instruction: `Head towards ${to.lat.toFixed(4)}, ${to.lng.toFixed(4)}`,
          distance: distance * 1000,
          time: duration
        }
      ]
    };
  };

  // Haversine formula for distance calculation
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
  }, []);

  return (
    <div className={cn("bg-background/90 backdrop-blur-sm border rounded-lg p-3", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Navigation className="h-4 w-4" />
        <span className="font-medium text-sm">Directions</span>
      </div>

      {/* Location Summary */}
      {(fromLocation || toLocation) && (
        <div className="space-y-2 mb-3 text-xs">
          {fromLocation && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
              <span className="truncate">{fromLocation.name || `${fromLocation.lat.toFixed(4)}, ${fromLocation.lng.toFixed(4)}`}</span>
            </div>
          )}
          {toLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-red-500 flex-shrink-0" />
              <span className="truncate">{toLocation.name || `${toLocation.lat.toFixed(4)}, ${toLocation.lng.toFixed(4)}`}</span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        <Button
          onClick={calculateDirections}
          disabled={!fromLocation || !toLocation || isLoading}
          size="sm"
          className="text-xs h-7 flex-1"
        >
          <Route className="h-3 w-3 mr-1" />
          {isLoading ? 'Calculating...' : 'Get Route'}
        </Button>
        {route && (
          <Button
            onClick={clearRoute}
            variant="outline"
            size="sm"
            className="text-xs h-7"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Route Info */}
      {route && (
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Route className="h-3 w-3" />
              <span>{formatDistance(route.distance)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(route.duration)}</span>
            </div>
          </div>
          
          {route.instructions.length > 1 && (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {route.instructions.map((step, index) => (
                <div key={index} className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                  {step.instruction}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};