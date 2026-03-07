import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useCanvasMap } from '@/hooks/useCanvasMap';
import { useEnhancedConnectionDisplay } from '@/hooks/useEnhancedConnectionDisplay';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Navigation, 
  Users, 
  Route,
  Zap,
  Target,
  TrendingUp,
  Battery,
  Signal,
  AlertTriangle,
  Eye,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: Date;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface AnimatedMarker {
  id: string;
  currentPosition: LocationPoint;
  targetPosition: LocationPoint;
  animationProgress: number;
  trail: LocationPoint[];
  isMoving: boolean;
}

interface HeatMapPoint {
  lat: number;
  lng: number;
  intensity: number;
  visits: number;
  duration: number;
}

interface MapCluster {
  id: string;
  center: { lat: number; lng: number };
  members: string[];
  radius: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface RouteSegment {
  from: string;
  to: string;
  path: LocationPoint[];
  distance: number;
  duration: number;
  isActive: boolean;
}

const AdvancedFamilyMarker: React.FC<{
  member: any;
  position: LocationPoint;
  trail: LocationPoint[];
  batteryLevel?: number;
  signalStrength?: number;
  isMoving: boolean;
  isEmergency?: boolean;
  onClick?: () => void;
}> = ({ 
  member, 
  position, 
  trail, 
  batteryLevel, 
  signalStrength, 
  isMoving, 
  isEmergency = false,
  onClick 
}) => {
  return (
    <div className="relative">
      {/* Accuracy Circle */}
      {position.accuracy && (
        <div 
          className="absolute bg-blue-500/20 border border-blue-500/40 rounded-full"
          style={{
            width: `${Math.max(20, position.accuracy * 2)}px`,
            height: `${Math.max(20, position.accuracy * 2)}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}

      {/* Movement Trail */}
      {trail.length > 1 && (
        <svg className="absolute inset-0 pointer-events-none">
          <polyline
            points={trail.map(point => `${point.lat},${point.lng}`).join(' ')}
            stroke={isEmergency ? '#ef4444' : '#3b82f6'}
            strokeWidth="2"
            strokeOpacity="0.6"
            fill="none"
            strokeDasharray={isMoving ? "5,5" : "none"}
            className={isMoving ? "animate-pulse" : ""}
          />
        </svg>
      )}

      {/* Main Marker */}
      <div 
        className={cn(
          "relative w-12 h-12 rounded-full border-4 cursor-pointer transition-all duration-300",
          isEmergency 
            ? "bg-red-500 border-red-600 shadow-lg shadow-red-500/50 animate-pulse" 
            : "bg-white border-blue-500 shadow-lg hover:scale-110",
          isMoving && "animate-bounce"
        )}
        onClick={onClick}
      >
        {/* Avatar */}
        <div className="w-full h-full rounded-full overflow-hidden">
          {member.avatar ? (
            <img 
              src={member.avatar} 
              alt={member.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="absolute -top-1 -right-1 flex flex-col space-y-1">
          {/* Battery Level */}
          {batteryLevel !== undefined && (
            <div className={cn(
              "w-4 h-2 rounded-sm border",
              batteryLevel > 20 ? "bg-green-500 border-green-600" : "bg-red-500 border-red-600"
            )}>
              <div 
                className="h-full bg-white rounded-sm transition-all duration-300"
                style={{ width: `${batteryLevel}%` }}
              />
            </div>
          )}

          {/* Signal Strength */}
          {signalStrength !== undefined && (
            <div className="flex space-x-0.5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-sm transition-all duration-300",
                    i < Math.floor(signalStrength / 25) ? "bg-green-500" : "bg-gray-300"
                  )}
                  style={{ height: `${4 + i * 2}px` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Emergency Pulse */}
        {isEmergency && (
          <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping" />
        )}

        {/* Movement Direction Indicator */}
        {isMoving && position.heading !== undefined && (
          <div 
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '6px solid #3b82f6',
              transform: `translateX(-50%) rotate(${position.heading}deg)`
            }}
          />
        )}
      </div>

      {/* Name Label */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <div className={cn(
          "px-2 py-1 rounded-md text-xs font-medium",
          isEmergency 
            ? "bg-red-500 text-white" 
            : "bg-white/90 text-gray-800 border border-gray-200"
        )}>
          {member.name}
        </div>
      </div>
    </div>
  );
};

const MapClusterMarker: React.FC<{
  cluster: MapCluster;
  members: any[];
  onClick?: () => void;
}> = ({ cluster, members, onClick }) => {
  const memberCount = cluster.members.length;
  
  return (
    <div 
      className="relative cursor-pointer transition-all duration-300 hover:scale-110"
      onClick={onClick}
    >
      {/* Cluster Circle */}
      <div className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center font-bold text-white shadow-lg",
        memberCount >= 5 ? "bg-purple-500" :
        memberCount >= 3 ? "bg-blue-500" : "bg-green-500"
      )}>
        <Users className="w-6 h-6 mr-1" />
        {memberCount}
      </div>

      {/* Member Avatars Preview */}
      <div className="absolute -top-2 -right-2 flex">
        {members.slice(0, 3).map((member, index) => (
          <div 
            key={member.id}
            className="w-6 h-6 rounded-full border-2 border-white overflow-hidden"
            style={{ 
              marginLeft: index > 0 ? '-8px' : '0',
              zIndex: 10 - index
            }}
          >
            {member.avatar ? (
              <img src={member.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs flex items-center justify-center">
                {member.name.charAt(0)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const HeatMapLayer: React.FC<{
  heatPoints: HeatMapPoint[];
  opacity?: number;
}> = ({ heatPoints, opacity = 0.6 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || heatPoints.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw heat points
    heatPoints.forEach(point => {
      const gradient = ctx.createRadialGradient(
        point.lat, point.lng, 0,
        point.lat, point.lng, 50
      );
      
      const alpha = Math.min(1, point.intensity / 100);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 0, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.lat, point.lng, 50, 0, 2 * Math.PI);
      ctx.fill();
    });

    canvas.style.opacity = opacity.toString();
  }, [heatPoints, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
};

export const AdvancedMapFeatures: React.FC = () => {
  const { data: familyRole } = useFamilyRole();
  const { MapView } = useCanvasMap();
  const {
    familyMembers,
    connectionMetrics,
    onlineMembers
  } = useEnhancedConnectionDisplay(familyRole?.familyGroupId);

  // Advanced map state
  const [animatedMarkers, setAnimatedMarkers] = useState<Map<string, AnimatedMarker>>(new Map());
  const [mapClusters, setMapClusters] = useState<MapCluster[]>([]);
  const [heatMapPoints, setHeatMapPoints] = useState<HeatMapPoint[]>([]);
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(true);

  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(Date.now());

  // Animation loop for smooth marker movement
  const animateMarkers = useCallback(() => {
    const now = Date.now();
    const deltaTime = now - lastUpdateRef.current;
    lastUpdateRef.current = now;

    setAnimatedMarkers(prev => {
      const updated = new Map(prev);
      
      updated.forEach((marker, id) => {
        if (marker.isMoving && marker.animationProgress < 1) {
          const progress = Math.min(1, marker.animationProgress + (deltaTime * animationSpeed) / 2000);
          
          // Smooth interpolation between current and target position
          const currentLat = marker.currentPosition.lat + 
            (marker.targetPosition.lat - marker.currentPosition.lat) * progress;
          const currentLng = marker.currentPosition.lng + 
            (marker.targetPosition.lng - marker.currentPosition.lng) * progress;

          updated.set(id, {
            ...marker,
            currentPosition: {
              ...marker.currentPosition,
              lat: currentLat,
              lng: currentLng
            },
            animationProgress: progress,
            isMoving: progress < 1
          });
        }
      });

      return updated;
    });

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animateMarkers);
    }
  }, [animationSpeed, isPlaying]);

  // Start/stop animation
  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animateMarkers);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animateMarkers]);

  // Update markers based on family member locations
  useEffect(() => {
    familyMembers.forEach(member => {
      if (member.location) {
        const newPosition: LocationPoint = {
          lat: member.location.lat,
          lng: member.location.lng,
          timestamp: new Date(),
          accuracy: member.location.accuracy,
          speed: 0, // Will be calculated from movement
          heading: undefined // Will be calculated from movement direction
        };

        setAnimatedMarkers(prev => {
          const existing = prev.get(member.id);
          const updated = new Map(prev);

          if (existing) {
            // Calculate movement
            const latDiff = newPosition.lat - existing.currentPosition.lat;
            const lngDiff = newPosition.lng - existing.currentPosition.lng;
            const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
            
            if (distance > 0.0001) { // Significant movement threshold
              const heading = Math.atan2(lngDiff, latDiff) * (180 / Math.PI);
              const speed = distance * 111000; // Rough conversion to meters

              updated.set(member.id, {
                ...existing,
                targetPosition: { ...newPosition, heading, speed },
                trail: [...existing.trail.slice(-20), existing.currentPosition], // Keep last 20 points
                animationProgress: 0,
                isMoving: true
              });
            }
          } else {
            // New marker
            updated.set(member.id, {
              id: member.id,
              currentPosition: newPosition,
              targetPosition: newPosition,
              animationProgress: 1,
              trail: [newPosition],
              isMoving: false
            });
          }

          return updated;
        });
      }
    });
  }, [familyMembers]);

  // Calculate clusters when members are close together
  const calculateClusters = useCallback(() => {
    const clusters: MapCluster[] = [];
    const processed = new Set<string>();
    const threshold = 0.01; // Clustering distance threshold

    familyMembers.forEach(member => {
      if (processed.has(member.id) || !member.location) return;

      const cluster: MapCluster = {
        id: `cluster-${member.id}`,
        center: { lat: member.location.lat, lng: member.location.lng },
        members: [member.id],
        radius: 0,
        bounds: {
          north: member.location.lat,
          south: member.location.lat,
          east: member.location.lng,
          west: member.location.lng
        }
      };

      // Find nearby members
      familyMembers.forEach(otherMember => {
        if (otherMember.id === member.id || processed.has(otherMember.id) || !otherMember.location) return;

        const distance = Math.sqrt(
          Math.pow(member.location!.lat - otherMember.location!.lat, 2) +
          Math.pow(member.location!.lng - otherMember.location!.lng, 2)
        );

        if (distance <= threshold) {
          cluster.members.push(otherMember.id);
          processed.add(otherMember.id);
          
          // Update cluster bounds
          cluster.bounds.north = Math.max(cluster.bounds.north, otherMember.location.lat);
          cluster.bounds.south = Math.min(cluster.bounds.south, otherMember.location.lat);
          cluster.bounds.east = Math.max(cluster.bounds.east, otherMember.location.lng);
          cluster.bounds.west = Math.min(cluster.bounds.west, otherMember.location.lng);
        }
      });

      // Calculate cluster center and radius
      if (cluster.members.length > 1) {
        const centerLat = (cluster.bounds.north + cluster.bounds.south) / 2;
        const centerLng = (cluster.bounds.east + cluster.bounds.west) / 2;
        cluster.center = { lat: centerLat, lng: centerLng };
        cluster.radius = Math.max(
          cluster.bounds.north - cluster.bounds.south,
          cluster.bounds.east - cluster.bounds.west
        ) / 2;
        clusters.push(cluster);
      }

      processed.add(member.id);
    });

    setMapClusters(clusters);
  }, [familyMembers]);

  // Generate heat map data from frequent locations
  const generateHeatMap = useCallback(() => {
    const heatPoints: HeatMapPoint[] = [];
    
    // Mock heat map data based on member locations
    familyMembers.forEach(member => {
      if (member.location) {
        // Add some variation for demonstration
        for (let i = 0; i < 5; i++) {
          const offsetLat = (Math.random() - 0.5) * 0.01;
          const offsetLng = (Math.random() - 0.5) * 0.01;
          
          heatPoints.push({
            lat: member.location.lat + offsetLat,
            lng: member.location.lng + offsetLng,
            intensity: Math.random() * 100,
            visits: Math.floor(Math.random() * 20) + 1,
            duration: Math.random() * 120 // minutes
          });
        }
      }
    });

    setHeatMapPoints(heatPoints);
  }, [familyMembers]);

  // Update clusters and heat map periodically
  useEffect(() => {
    calculateClusters();
    if (showHeatMap) {
      generateHeatMap();
    }
  }, [familyMembers, showHeatMap, calculateClusters, generateHeatMap]);

  // Prepare map markers
  const mapMarkers = useMemo(() => {
    const markers: any[] = [];
    
    // Add individual markers or clusters
    if (mapClusters.length > 0) {
      // Show clusters for grouped members
      mapClusters.forEach(cluster => {
        const clusterMembers = familyMembers.filter(m => cluster.members.includes(m.id));
        markers.push({
          id: cluster.id,
          lat: cluster.center.lat,
          lng: cluster.center.lng,
          render: () => (
            <MapClusterMarker
              cluster={cluster}
              members={clusterMembers}
              onClick={() => {
                // Handle cluster click - maybe zoom in or show member list
                console.log('Cluster clicked:', cluster);
              }}
            />
          )
        });
      });

      // Show individual markers for non-clustered members
      const clusteredMemberIds = new Set(mapClusters.flatMap(c => c.members));
      familyMembers.forEach(member => {
        if (!clusteredMemberIds.has(member.id) && member.location) {
          const animatedMarker = animatedMarkers.get(member.id);
          const position = animatedMarker?.currentPosition || {
            lat: member.location.lat,
            lng: member.location.lng,
            timestamp: new Date()
          };

          markers.push({
            id: member.id,
            lat: position.lat,
            lng: position.lng,
            render: () => (
              <AdvancedFamilyMarker
                member={member}
                position={position}
                trail={showTrails ? (animatedMarker?.trail || []) : []}
                batteryLevel={member.battery}
                signalStrength={member.connectionHealth.latency ? 
                  Math.max(0, 100 - member.connectionHealth.latency / 10) : undefined}
                isMoving={animatedMarker?.isMoving || false}
                isEmergency={emergencyMode}
                onClick={() => {
                  console.log('Member clicked:', member);
                }}
              />
            )
          });
        }
      });
    } else {
      // Show all individual markers when no clustering
      familyMembers.forEach(member => {
        if (member.location) {
          const animatedMarker = animatedMarkers.get(member.id);
          const position = animatedMarker?.currentPosition || {
            lat: member.location.lat,
            lng: member.location.lng,
            timestamp: new Date()
          };

          markers.push({
            id: member.id,
            lat: position.lat,
            lng: position.lng,
            render: () => (
              <AdvancedFamilyMarker
                member={member}
                position={position}
                trail={showTrails ? (animatedMarker?.trail || []) : []}
                batteryLevel={member.battery}
                signalStrength={member.connectionHealth.latency ? 
                  Math.max(0, 100 - member.connectionHealth.latency / 10) : undefined}
                isMoving={animatedMarker?.isMoving || false}
                isEmergency={emergencyMode}
                onClick={() => {
                  console.log('Member clicked:', member);
                }}
              />
            )
          });
        }
      });
    }

    return markers;
  }, [familyMembers, animatedMarkers, mapClusters, showTrails, emergencyMode]);

  return (
    <div className="space-y-6">
      {/* Advanced Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Advanced Map Features</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={emergencyMode ? "destructive" : "secondary"}>
                {emergencyMode ? "Emergency Mode" : "Normal Mode"}
              </Badge>
              <Button
                variant={isPlaying ? "secondary" : "default"}
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Feature Toggles */}
            <div className="space-y-3">
              <h4 className="font-medium">Display Options</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showTrails}
                    onChange={(e) => setShowTrails(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Movement Trails</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showHeatMap}
                    onChange={(e) => setShowHeatMap(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Heat Map</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showRoutes}
                    onChange={(e) => setShowRoutes(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Route Lines</span>
                </label>
              </div>
            </div>

            {/* Animation Controls */}
            <div className="space-y-3">
              <h4 className="font-medium">Animation</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-sm text-muted-foreground">Speed: {animationSpeed.toFixed(1)}x</label>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAnimatedMarkers(new Map());
                    setAnimationSpeed(1.0);
                  }}
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </Button>
              </div>
            </div>

            {/* Emergency Controls */}
            <div className="space-y-3">
              <h4 className="font-medium">Emergency</h4>
              <div className="space-y-2">
                <Button
                  variant={emergencyMode ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setEmergencyMode(!emergencyMode)}
                  className="flex items-center space-x-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>{emergencyMode ? "Exit Emergency" : "Emergency Mode"}</span>
                </Button>
                {emergencyMode && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Emergency mode activated. All markers will pulse and show priority indicators.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Markers</p>
                <p className="text-2xl font-bold">{animatedMarkers.size}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Moving Members</p>
                <p className="text-2xl font-bold text-green-600">
                  {Array.from(animatedMarkers.values()).filter(m => m.isMoving).length}
                </p>
              </div>
              <Navigation className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clusters</p>
                <p className="text-2xl font-bold text-purple-600">{mapClusters.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Heat Points</p>
                <p className="text-2xl font-bold text-orange-600">{heatMapPoints.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Map Display */}
      <Card>
        <CardContent className="p-0">
          <div className="relative h-[600px]">
            <MapView
              className="w-full h-full rounded-lg"
              markers={mapMarkers}
              center={
                familyMembers.length > 0 && familyMembers[0].location
                  ? { lat: familyMembers[0].location.lat, lng: familyMembers[0].location.lng }
                  : { lat: 40.7589, lng: -73.9851 }
              }
              zoom={15}
              showControls={true}
              interactive={true}
            />
            
            {/* Heat Map Overlay */}
            {showHeatMap && (
              <HeatMapLayer heatPoints={heatMapPoints} opacity={0.6} />
            )}

            {/* Performance Indicator */}
            <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <Zap className="h-4 w-4" />
                <span>60 FPS</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Live</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};