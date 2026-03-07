import { useState, useEffect, useCallback, useRef } from 'react';
import { useEnhancedConnectionDisplay } from './useEnhancedConnectionDisplay';
import { useUnifiedRealtime } from './useUnifiedRealtime';
import { useOptimizedAuth } from './useOptimizedAuth';

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: Date;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
}

interface MovementData {
  userId: string;
  path: LocationPoint[];
  velocity: number;
  direction: number;
  acceleration: number;
  isMoving: boolean;
  predictedNextPosition?: LocationPoint;
}

interface GeofenceArea {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number;
  type: 'safe_zone' | 'alert_zone' | 'restricted_zone';
  members: string[];
  alerts: boolean;
}

interface RouteOptimization {
  memberId: string;
  currentLocation: LocationPoint;
  destination?: LocationPoint;
  suggestedRoute: LocationPoint[];
  estimatedTime: number;
  distance: number;
  traffic: 'light' | 'moderate' | 'heavy';
}

interface EmergencyBroadcast {
  id: string;
  userId: string;
  location: LocationPoint;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  radius: number;
  acknowledgedBy: string[];
  isActive: boolean;
}

interface MapAnalytics {
  totalDistance: number;
  averageSpeed: number;
  timeSpent: number;
  frequentLocations: { location: LocationPoint; visits: number; duration: number }[];
  movementPatterns: MovementData[];
  safetyScore: number;
}

export const useAdvancedMapFeatures = (familyGroupId?: string) => {
  const { user } = useOptimizedAuth();
  const connectionDisplay = useEnhancedConnectionDisplay(familyGroupId);
  const realtime = useUnifiedRealtime();

  // Advanced tracking state
  const [movementData, setMovementData] = useState<Map<string, MovementData>>(new Map());
  const [geofences, setGeofences] = useState<GeofenceArea[]>([]);
  const [routeOptimizations, setRouteOptimizations] = useState<RouteOptimization[]>([]);
  const [emergencyBroadcasts, setEmergencyBroadcasts] = useState<EmergencyBroadcast[]>([]);
  const [mapAnalytics, setMapAnalytics] = useState<MapAnalytics>({
    totalDistance: 0,
    averageSpeed: 0,
    timeSpent: 0,
    frequentLocations: [],
    movementPatterns: [],
    safetyScore: 85
  });

  // Performance tracking
  const [frameRate, setFrameRate] = useState(60);
  const [renderTime, setRenderTime] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);

  // Refs for performance monitoring
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());
  const renderStartRef = useRef(0);

  // Calculate movement data from location history
  const calculateMovementData = useCallback((userId: string, locations: LocationPoint[]) => {
    if (locations.length < 2) return null;

    const path = locations.slice(-10); // Keep last 10 points
    const latest = path[path.length - 1];
    const previous = path[path.length - 2];

    // Calculate velocity (m/s)
    const timeDiff = (latest.timestamp.getTime() - previous.timestamp.getTime()) / 1000;
    const distance = calculateDistance(previous, latest);
    const velocity = timeDiff > 0 ? distance / timeDiff : 0;

    // Calculate direction (degrees)
    const direction = calculateBearing(previous, latest);

    // Calculate acceleration
    const prevMovement = movementData.get(userId);
    const acceleration = prevMovement ? (velocity - prevMovement.velocity) / timeDiff : 0;

    // Predict next position based on current velocity and direction
    const predictedNextPosition = velocity > 0.1 ? predictNextLocation(latest, velocity, direction, 30) : undefined;

    return {
      userId,
      path,
      velocity,
      direction,
      acceleration,
      isMoving: velocity > 0.1, // Moving if velocity > 0.1 m/s
      predictedNextPosition
    };
  }, [movementData]);

  // Distance calculation using Haversine formula
  const calculateDistance = useCallback((point1: LocationPoint, point2: LocationPoint): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  // Calculate bearing between two points
  const calculateBearing = useCallback((point1: LocationPoint, point2: LocationPoint): number => {
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return ((θ * 180 / Math.PI) + 360) % 360;
  }, []);

  // Predict next location based on current movement
  const predictNextLocation = useCallback((
    current: LocationPoint, 
    velocity: number, 
    bearing: number, 
    timeSeconds: number
  ): LocationPoint => {
    const R = 6371e3; // Earth's radius in meters
    const d = velocity * timeSeconds; // Distance to travel
    const φ1 = current.lat * Math.PI / 180;
    const λ1 = current.lng * Math.PI / 180;
    const θ = bearing * Math.PI / 180;

    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d/R) + Math.cos(φ1) * Math.sin(d/R) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(d/R) * Math.cos(φ1), Math.cos(d/R) - Math.sin(φ1) * Math.sin(φ2));

    return {
      lat: φ2 * 180 / Math.PI,
      lng: λ2 * 180 / Math.PI,
      timestamp: new Date(current.timestamp.getTime() + timeSeconds * 1000)
    };
  }, []);

  // Check geofence violations
  const checkGeofenceViolations = useCallback((userId: string, location: LocationPoint) => {
    const violations: { geofence: GeofenceArea; type: 'enter' | 'exit' }[] = [];

    geofences.forEach(geofence => {
      const distance = calculateDistance(location, {
        lat: geofence.center.lat,
        lng: geofence.center.lng,
        timestamp: new Date()
      });

      const isInside = distance <= geofence.radius;
      const wasInside = geofence.members.includes(userId);

      if (isInside && !wasInside) {
        violations.push({ geofence, type: 'enter' });
        geofence.members.push(userId);
      } else if (!isInside && wasInside) {
        violations.push({ geofence, type: 'exit' });
        geofence.members = geofence.members.filter(id => id !== userId);
      }
    });

    // Trigger alerts for violations
    violations.forEach(({ geofence, type }) => {
      if (geofence.alerts) {
        console.log(`Geofence ${type}: ${userId} ${type}ed ${geofence.name}`);
        // Implement actual alert system here
      }
    });

    return violations;
  }, [geofences, calculateDistance]);

  // Create emergency broadcast
  const createEmergencyBroadcast = useCallback(async (
    urgency: EmergencyBroadcast['urgency'],
    message: string,
    radius: number = 5000
  ) => {
    if (!user || !connectionDisplay.currentUser?.location) return;

    const broadcast: EmergencyBroadcast = {
      id: `emergency-${Date.now()}`,
      userId: user.id,
      location: {
        lat: connectionDisplay.currentUser.location.lat,
        lng: connectionDisplay.currentUser.location.lng,
        timestamp: new Date()
      },
      urgency,
      message,
      timestamp: new Date(),
      radius,
      acknowledgedBy: [],
      isActive: true
    };

    setEmergencyBroadcasts(prev => [...prev, broadcast]);

    // Notify family members in range
    connectionDisplay.onlineMembers.forEach(member => {
      if (member.location && member.id !== user.id) {
        const distance = calculateDistance(broadcast.location, {
          lat: member.location.lat,
          lng: member.location.lng,
          timestamp: new Date()
        });

        if (distance <= radius) {
          // Send emergency notification
          console.log(`Emergency broadcast sent to ${member.name}`);
          // Implement actual notification system here
        }
      }
    });

    return broadcast;
  }, [user, connectionDisplay, calculateDistance]);

  // Acknowledge emergency broadcast
  const acknowledgeEmergencyBroadcast = useCallback((broadcastId: string) => {
    if (!user) return;

    setEmergencyBroadcasts(prev => prev.map(broadcast => {
      if (broadcast.id === broadcastId && !broadcast.acknowledgedBy.includes(user.id)) {
        return {
          ...broadcast,
          acknowledgedBy: [...broadcast.acknowledgedBy, user.id]
        };
      }
      return broadcast;
    }));
  }, [user]);

  // Optimize route between two points
  const optimizeRoute = useCallback(async (
    fromLocation: LocationPoint,
    toLocation: LocationPoint,
    memberId: string
  ): Promise<RouteOptimization> => {
    // Mock route optimization - in real implementation, use routing service
    const distance = calculateDistance(fromLocation, toLocation);
    const estimatedTime = distance / 13.89; // Assume 50 km/h average speed
    
    // Generate simple route points (in real implementation, use routing API)
    const routePoints: LocationPoint[] = [
      fromLocation,
      {
        lat: (fromLocation.lat + toLocation.lat) / 2,
        lng: (fromLocation.lng + toLocation.lng) / 2,
        timestamp: new Date()
      },
      toLocation
    ];

    const optimization: RouteOptimization = {
      memberId,
      currentLocation: fromLocation,
      destination: toLocation,
      suggestedRoute: routePoints,
      estimatedTime,
      distance,
      traffic: distance > 10000 ? 'heavy' : distance > 5000 ? 'moderate' : 'light'
    };

    setRouteOptimizations(prev => {
      const filtered = prev.filter(r => r.memberId !== memberId);
      return [...filtered, optimization];
    });

    return optimization;
  }, [calculateDistance]);

  // Performance monitoring
  const updatePerformanceMetrics = useCallback(() => {
    const now = Date.now();
    frameCountRef.current++;

    // Calculate frame rate
    if (now - lastFrameTimeRef.current >= 1000) {
      setFrameRate(frameCountRef.current);
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }

    // Calculate render time
    const renderTime = now - renderStartRef.current;
    setRenderTime(renderTime);

    // Calculate memory usage (if available)
    if ('memory' in performance) {
      setMemoryUsage((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }

    renderStartRef.current = now;
  }, []);

  // Update movement data when family member locations change
  useEffect(() => {
    connectionDisplay.familyMembers.forEach(member => {
      if (member.location) {
        const currentMovement = movementData.get(member.id);
        const locationHistory = currentMovement?.path || [];
        
        const newLocation: LocationPoint = {
          lat: member.location.lat,
          lng: member.location.lng,
          timestamp: new Date(),
          accuracy: member.location.accuracy
        };

        const updatedHistory = [...locationHistory, newLocation].slice(-20); // Keep last 20 points
        const movementInfo = calculateMovementData(member.id, updatedHistory);

        if (movementInfo) {
          setMovementData(prev => new Map(prev.set(member.id, movementInfo)));
          
          // Check geofence violations
          checkGeofenceViolations(member.id, newLocation);
        }
      }
    });
  }, [connectionDisplay.familyMembers, calculateMovementData, checkGeofenceViolations]);

  // Initialize default geofences
  useEffect(() => {
    if (geofences.length === 0 && connectionDisplay.familyMembers.length > 0) {
      const firstMember = connectionDisplay.familyMembers[0];
      if (firstMember.location) {
        setGeofences([
          {
            id: 'home-zone',
            name: 'Home Zone',
            center: { lat: firstMember.location.lat, lng: firstMember.location.lng },
            radius: 500,
            type: 'safe_zone',
            members: [],
            alerts: true
          }
        ]);
      }
    }
  }, [connectionDisplay.familyMembers, geofences]);

  // Performance monitoring loop
  useEffect(() => {
    const interval = setInterval(updatePerformanceMetrics, 16); // ~60fps
    return () => clearInterval(interval);
  }, [updatePerformanceMetrics]);

  return {
    // Movement tracking
    movementData: Array.from(movementData.values()),
    
    // Geofencing
    geofences,
    checkGeofenceViolations,
    
    // Route optimization
    routeOptimizations,
    optimizeRoute,
    
    // Emergency features
    emergencyBroadcasts,
    createEmergencyBroadcast,
    acknowledgeEmergencyBroadcast,
    
    // Analytics
    mapAnalytics,
    
    // Performance metrics
    performance: {
      frameRate,
      renderTime,
      memoryUsage,
      isOptimal: frameRate >= 55 && renderTime < 16 && memoryUsage < 100
    },
    
    // Utility functions
    calculateDistance,
    calculateBearing,
    predictNextLocation,
    
    // Integration with connection display
    ...connectionDisplay
  };
};