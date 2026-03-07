import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Loader2, RotateCcw, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { enhancedTileCache } from './EnhancedTileCache';
import { MapSearch } from './MapSearch';
import { MapDirections } from './MapDirections';
import { MarkerRenderer } from './MarkerRenderer';
import { PLATFORM_MAP_CONFIG, MAP_CONTROLS, MAP_ANIMATIONS } from '@/config/mapConfig';

interface CanvasMapProps {
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMapReady?: () => void;
  showControls?: boolean;
  interactive?: boolean;
}

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  render?: () => React.ReactNode;
  avatar?: string;
  name?: string;
  status?: 'online' | 'idle' | 'offline';
  isEmergency?: boolean;
  accuracy?: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
}

interface Viewport {
  centerLat: number;
  centerLng: number;
  zoom: number;
  width: number;
  height: number;
}

interface RenderStats {
  tilesLoaded: number;
  totalTiles: number;
  cacheHitRate: number;
}

const CanvasMap: React.FC<CanvasMapProps> = ({
  className,
  center = { lat: 0, lng: 0 }, // Will be updated by parent component
  zoom = 13,
  markers = [],
  onMapReady,
  showControls = true,
  interactive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRenderer = useRef<MarkerRenderer>(new MarkerRenderer());
  const animationFrameRef = useRef<number | null>(null);
  const prevViewportKeyRef = useRef<string | null>(null);
  const prevMapModeRef = useRef<'standard' | 'satellite' | 'dark' | null>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const redrawScheduledRef = useRef(false);
  const prevIsLoadingRef = useRef<boolean>(true);
  const prevRenderStatsRef = useRef<RenderStats>({ tilesLoaded: 0, totalTiles: 0, cacheHitRate: 0 });
  
  const [viewport, setViewport] = useState<Viewport>({
    centerLat: center.lat,
    centerLng: center.lng,
    zoom,
    width: 800,
    height: 600
  });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [mapMode, setMapMode] = useState<'standard' | 'satellite' | 'dark'>('standard');
  const [showSearch, setShowSearch] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [renderStats, setRenderStats] = useState<RenderStats>({ 
    tilesLoaded: 0, 
    totalTiles: 0, 
    cacheHitRate: 0 
  });
  const [showAccuracy, setShowAccuracy] = useState(true);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<string>('OSM');
  const [retryCount, setRetryCount] = useState(0);
  const [failureDetected, setFailureDetected] = useState(false);
  const retryTimeoutRef = useRef<number | null>(null);
  const [useEmbedFallback, setUseEmbedFallback] = useState(false);

  // Reset fallback when tiles start loading successfully
  useEffect(() => {
    if (renderStats.tilesLoaded > 0 && useEmbedFallback) {
      setUseEmbedFallback(false);
    }
  }, [renderStats.tilesLoaded, useEmbedFallback]);

  // Convert lat/lng to pixel coordinates
  const latLngToPixel = useCallback((lat: number, lng: number): { x: number; y: number } => {
    const scale = Math.pow(2, viewport.zoom);
    const worldWidth = 256 * scale;
    const worldHeight = 256 * scale;

    const x = (lng + 180) * (worldWidth / 360);
    const y = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * worldHeight;

    const viewportX = x - (viewport.centerLng + 180) * (worldWidth / 360) + viewport.width / 2;
    const viewportY = y - (1 - Math.log(Math.tan(viewport.centerLat * Math.PI / 180) + 1 / Math.cos(viewport.centerLat * Math.PI / 180)) / Math.PI) / 2 * worldHeight + viewport.height / 2;

    return { x: viewportX, y: viewportY };
  }, [viewport]);

  // Convert pixel coordinates to lat/lng
  const pixelToLatLng = useCallback((x: number, y: number): { lat: number; lng: number } => {
    const scale = Math.pow(2, viewport.zoom);
    const worldWidth = 256 * scale;
    const worldHeight = 256 * scale;

    const worldX = x - viewport.width / 2 + (viewport.centerLng + 180) * (worldWidth / 360);
    const worldY = y - viewport.height / 2 + (1 - Math.log(Math.tan(viewport.centerLat * Math.PI / 180) + 1 / Math.cos(viewport.centerLat * Math.PI / 180)) / Math.PI) / 2 * worldHeight;

    const lng = (worldX / worldWidth) * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * worldY / worldHeight)));
    const lat = latRad * 180 / Math.PI;

    return { lat, lng };
  }, [viewport]);

  // Get tile coordinates from lat/lng and zoom
  const getTileCoords = useCallback((lat: number, lng: number, zoom: number) => {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y, z: zoom };
  }, []);

  // Offscreen buffer to prevent flicker and a single-flight scheduler
  const ensureBufferCanvas = useCallback(() => {
    if (!bufferCanvasRef.current) {
      bufferCanvasRef.current = document.createElement('canvas');
    }
    const buf = bufferCanvasRef.current;
    if (!buf) return null;
    if (buf.width !== viewport.width || buf.height !== viewport.height) {
      buf.width = viewport.width;
      buf.height = viewport.height;
    }
    return buf.getContext('2d');
  }, [viewport.width, viewport.height]);

  const drawScene = useCallback(async () => {
    const canvas = canvasRef.current;
    const bctx = ensureBufferCanvas();
    if (!canvas || !bctx) return;

    // Draw everything to the offscreen buffer in CSS pixels
    const dpr = 1;
    bctx.imageSmoothingEnabled = true;
    bctx.imageSmoothingQuality = 'high';

    // Clear only when needed to reduce flicker
    const viewportKey = `${viewport.centerLat.toFixed(5)}_${viewport.centerLng.toFixed(5)}_${Math.floor(viewport.zoom)}_${viewport.width}x${viewport.height}`;
    const shouldClear = prevViewportKeyRef.current !== viewportKey || prevMapModeRef.current !== mapMode;

    // Always paint a solid background to avoid transparent frames
    const gradient = bctx.createLinearGradient(0, 0, 0, viewport.height);
    gradient.addColorStop(0, '#a7c8ed');
    gradient.addColorStop(1, '#8bb5e8');
    bctx.fillStyle = gradient;
    bctx.fillRect(0, 0, viewport.width, viewport.height);

    const tileSize = 256;
    const centerTile = getTileCoords(viewport.centerLat, viewport.centerLng, Math.floor(viewport.zoom));
    const tilesNeeded = Math.ceil(Math.max(viewport.width, viewport.height) / tileSize) + 2;

    let tilesLoaded = 0;
    let totalTiles = 0;

    const tilePromises: Promise<void>[] = [];

    for (let dx = -tilesNeeded; dx <= tilesNeeded; dx++) {
      for (let dy = -tilesNeeded; dy <= tilesNeeded; dy++) {
        const tileX = centerTile.x + dx;
        const tileY = centerTile.y + dy;
        const tileZ = Math.floor(viewport.zoom);

        if (tileX < 0 || tileY < 0 || tileX >= Math.pow(2, tileZ) || tileY >= Math.pow(2, tileZ)) continue;

        totalTiles++;

        const pixelX = ((tileX * tileSize) - (centerTile.x * tileSize)) + (viewport.width) / 2;
        const pixelY = ((tileY * tileSize) - (centerTile.y * tileSize)) + (viewport.height) / 2;

        // Handle satellite mode with labels overlay
        if (mapMode === 'satellite') {
          const cachedSatellite = enhancedTileCache.getTile(tileX, tileY, tileZ, 'satellite');
          if (cachedSatellite) {
            bctx.drawImage(cachedSatellite, pixelX, pixelY, tileSize, tileSize);
            tilesLoaded++;
          } else if (!enhancedTileCache.isLoading(tileX, tileY, tileZ, 'satellite')) {
            const tilePromise = enhancedTileCache.loadTile(tileX, tileY, tileZ, 'satellite').then(() => {
              scheduleDraw();
            });
            tilePromises.push(tilePromise);
          }
        } else {
          const cachedTile = enhancedTileCache.getTile(tileX, tileY, tileZ, mapMode);
          if (cachedTile) {
            bctx.drawImage(cachedTile, pixelX, pixelY, tileSize, tileSize);
            tilesLoaded++;
          } else if (!enhancedTileCache.isLoading(tileX, tileY, tileZ, mapMode)) {
            const tilePromise = enhancedTileCache.loadTile(tileX, tileY, tileZ, mapMode).then(() => {
              scheduleDraw();
            });
            tilePromises.push(tilePromise);
          }
        }
      }
    }

    const isMapLoading = tilesLoaded < totalTiles * 0.7;
    if (isMapLoading !== prevIsLoadingRef.current) {
      prevIsLoadingRef.current = isMapLoading;
      setIsLoading(isMapLoading);
    }

    // Detect tile loading failure; rotate providers and eventually fall back to OSM embed
    if (isMapLoading && totalTiles > 0 && tilesLoaded === 0) {
      if (!failureDetected) {
        setFailureDetected(true);
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = window.setTimeout(() => {
          if (retryCount < 3) {
            console.log(`[CanvasMap] No tiles loaded, rotating provider (attempt ${retryCount + 1})`);
            enhancedTileCache.rotateToNextProvider();
            enhancedTileCache.clear();
            setCurrentProvider(enhancedTileCache.getCurrentProviderName());
            setRetryCount(prev => prev + 1);
            setFailureDetected(false);
            scheduleDraw();
          }
        }, 2000);
      }
      if (retryCount >= 2) {
        setUseEmbedFallback(true);
      }
    } else {
      // We have tiles; disable failure state and fallback
      if (failureDetected) {
        setFailureDetected(false);
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      }
      if (tilesLoaded > 0) setUseEmbedFallback(false);
    }

    const cacheStats = enhancedTileCache.getStats();
    const nextStats = { tilesLoaded, totalTiles, cacheHitRate: cacheStats.hitRate };
    const prevStats = prevRenderStatsRef.current;
    if (prevStats.tilesLoaded !== nextStats.tilesLoaded || prevStats.totalTiles !== nextStats.totalTiles || prevStats.cacheHitRate !== nextStats.cacheHitRate) {
      prevRenderStatsRef.current = nextStats;
      setRenderStats(nextStats);
    }

    const markerPromises = markers.map(async (marker) => {
      const { x, y } = latLngToPixel(marker.lat, marker.lng);
      if (x >= -50 && x <= viewport.width + 50 && y >= -50 && y <= viewport.height + 50) {
        await markerRenderer.current.renderMarker(
          bctx,
          {
            id: marker.id,
            lat: marker.lat,
            lng: marker.lng,
            name: marker.name,
            avatar: marker.avatar,
            status: marker.status,
            isEmergency: marker.isEmergency,
            accuracy: marker.accuracy,
            speed: marker.speed,
            heading: marker.heading,
            batteryLevel: marker.batteryLevel
          },
          x,
          y,
          viewport.zoom,
          {
            size: 32,
            showAccuracy,
            showLabel: true,
            animateStatus: true,
            pixelRatio: dpr
          }
        );
      }
    });

    await Promise.all(markerPromises);

    // Draw route if available
    if (routeData && routeData.coordinates) {
      bctx.strokeStyle = '#3b82f6';
      bctx.lineWidth = 3;
      bctx.lineCap = 'round';
      bctx.lineJoin = 'round';
      bctx.beginPath();
      
      routeData.coordinates.forEach((coord: [number, number], index: number) => {
        const { x, y } = latLngToPixel(coord[1], coord[0]); // coord is [lng, lat]
        if (index === 0) {
          bctx.moveTo(x, y);
        } else {
          bctx.lineTo(x, y);
        }
      });
      bctx.stroke();
    }

    // Draw selected location
    if (selectedLocation) {
      const { x, y } = latLngToPixel(selectedLocation.lat, selectedLocation.lng);
      bctx.fillStyle = '#ef4444';
      bctx.beginPath();
      bctx.arc(x, y, 8, 0, 2 * Math.PI);
      bctx.fill();
      bctx.strokeStyle = '#ffffff';
      bctx.lineWidth = 2;
      bctx.stroke();
    }

    prevViewportKeyRef.current = viewportKey;
    prevMapModeRef.current = mapMode;

    if (showControls) {
      bctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      bctx.lineWidth = 2;
      bctx.setLineDash([2, 2]);
      const centerX = (viewport.width) / 2;
      const centerY = (viewport.height) / 2;
      bctx.beginPath();
      bctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
      bctx.stroke();
      bctx.setLineDash([]);

      if (process.env.NODE_ENV === 'development') {
        bctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        bctx.font = `10px monospace`;
        bctx.fillText(`Tiles: ${tilesLoaded}/${totalTiles} | Provider: ${currentProvider}` , 10, 20);
      }
    }

    // Blit buffer to visible canvas (which is DPR-scaled already)
    const vctx = canvas.getContext('2d');
    if (vctx) {
      vctx.clearRect(0, 0, viewport.width, viewport.height);
      vctx.drawImage(bufferCanvasRef.current!, 0, 0, viewport.width, viewport.height);
    }
  }, [ensureBufferCanvas, viewport, markers, latLngToPixel, getTileCoords, showControls, mapMode, showAccuracy]);

  const scheduleDraw = useCallback(() => {
    if (isDrawingRef.current) {
      redrawScheduledRef.current = true;
      return;
    }
    isDrawingRef.current = true;
    animationFrameRef.current = requestAnimationFrame(async () => {
      await drawScene();
      isDrawingRef.current = false;
      if (redrawScheduledRef.current) {
        redrawScheduledRef.current = false;
        scheduleDraw();
      }
    });
  }, [drawScene]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [interactive]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !interactive) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    // Convert pixel movement to lat/lng movement with smoother calculation
    const scale = Math.pow(2, viewport.zoom);
    const worldSize = 256 * scale;
    
    const lngDelta = -deltaX / worldSize * 360;
    const latRad = viewport.centerLat * Math.PI / 180;
    const latDelta = deltaY / worldSize * 360 * Math.cos(latRad);

    setViewport(prev => ({
      ...prev,
      centerLat: Math.max(-85, Math.min(85, prev.centerLat + latDelta)),
      centerLng: ((prev.centerLng + lngDelta + 180) % 360) - 180
    }));

    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMousePos, viewport, interactive]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!interactive) return;
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.5 : 0.5;
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(3, Math.min(18, prev.zoom + zoomDelta))
    }));
  }, [interactive]);

  // Reset to center
  const resetToCenter = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      centerLat: center.lat,
      centerLng: center.lng,
      zoom: zoom
    }));
  }, [center, zoom]);

  // Try alternate provider
  const tryAlternateProvider = useCallback(() => {
    enhancedTileCache.rotateToNextProvider();
    setCurrentProvider(enhancedTileCache.getCurrentProviderName());
    setRetryCount(0);
    setFailureDetected(false);
    enhancedTileCache.clear(); // Clear failed tiles
    scheduleDraw();
  }, [scheduleDraw]);

  // Handle location search
  const handleLocationSelect = useCallback((lat: number, lng: number, name: string) => {
    setSelectedLocation({ lat, lng, name });
    setViewport(prev => ({
      ...prev,
      centerLat: lat,
      centerLng: lng,
      zoom: Math.max(prev.zoom, 15) // Zoom in when searching
    }));
  }, []);

  // Handle directions
  const handleDirectionsCalculated = useCallback((route: any) => {
    setRouteData(route);
  }, []);

  // Build a resilient OSM embed URL as a last-resort fallback
  const getOsmEmbedUrl = useCallback(() => {
    const lat = viewport.centerLat;
    const lng = viewport.centerLng;
    const z = Math.floor(viewport.zoom);
    const scale = Math.pow(2, z);
    const degPerPixel = 360 / (256 * scale);
    const widthDeg = degPerPixel * Math.max(256, viewport.width);
    const heightDeg = degPerPixel * Math.max(256, viewport.height);
    const minLng = lng - widthDeg / 2;
    const maxLng = lng + widthDeg / 2;
    const latFactor = Math.cos((lat * Math.PI) / 180) || 0.0001;
    const minLat = lat - (heightDeg / 2) * latFactor;
    const maxLat = lat + (heightDeg / 2) * latFactor;
    const bbox = `${minLng.toFixed(6)},${minLat.toFixed(6)},${maxLng.toFixed(6)},${maxLat.toFixed(6)}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)},${lng.toFixed(6)}`;
  }, [viewport.centerLat, viewport.centerLng, viewport.zoom, viewport.width, viewport.height]);
  // Update center when prop changes (only if not being dragged and significantly different)
  useEffect(() => {
    if (isDragging) return; // Don't update center while user is interacting
    
    const latDiff = Math.abs(viewport.centerLat - center.lat);
    const lngDiff = Math.abs(viewport.centerLng - center.lng);
    
    // Only update if center changed significantly (> 0.001 degrees ~ 100m)
    if (latDiff > 0.001 || lngDiff > 0.001 || viewport.zoom !== zoom) {
      setViewport(prev => ({
        ...prev,
        centerLat: center.lat,
        centerLng: center.lng,
        zoom
      }));
    }
  }, [center.lat, center.lng, zoom, viewport.centerLat, viewport.centerLng, viewport.zoom, isDragging]);

  // Update canvas size with high DPI support
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const canvas = canvasRef.current;
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Reset any previous transforms before applying DPR scale
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(dpr, dpr);
        }
        
        setViewport(prev => ({
          ...prev,
          width: rect.width,
          height: rect.height
        }));
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Start marker animations
  useEffect(() => {
    markerRenderer.current.startAnimation();
    return () => markerRenderer.current.stopAnimation();
  }, []);

  // Smooth animation loop for redraws
  useEffect(() => {
    let lastDrawTime = 0;
    const fps = 30; // Limit to 30fps for performance
    const frameTime = 1000 / fps;

    const animate = (currentTime: number) => {
      if (currentTime - lastDrawTime >= frameTime) {
        scheduleDraw();
        lastDrawTime = currentTime;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const hasAnimatedMarkers = markers.some(m => m.isEmergency || m.status === 'online');
    if (hasAnimatedMarkers) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      scheduleDraw(); // Single draw for static markers
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scheduleDraw, markers]);

  // Redraw on view-related changes (without RAF flood thanks to scheduler)
  useEffect(() => {
    scheduleDraw();
  }, [viewport, mapMode, showAccuracy, markers, routeData, selectedLocation, scheduleDraw]);

  // Detect prolonged tile loading
  useEffect(() => {
    if (!isLoading) {
      setLoadingTooLong(false);
      return;
    }
    const t = setTimeout(() => {
      setLoadingTooLong(true);
      setUseEmbedFallback(true); // force guaranteed visible map
    }, 2000);
    return () => clearTimeout(t);
  }, [isLoading]);

  // Call onMapReady when component is ready
  useEffect(() => {
    if (onMapReady) {
      const timer = setTimeout(onMapReady, 100);
      return () => clearTimeout(timer);
    }
  }, [onMapReady]);

  // Initialize current provider label
  useEffect(() => {
    setCurrentProvider(enhancedTileCache.getCurrentProviderName());
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative w-full h-full overflow-hidden",
        "bg-map-background border border-map-border",
        "shadow-map transition-map",
        PLATFORM_MAP_CONFIG.appearance.borderRadius === '0.75rem' && "rounded-xl",
        className
      )}
      style={{
        borderRadius: PLATFORM_MAP_CONFIG.appearance.borderRadius
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          borderRadius: PLATFORM_MAP_CONFIG.appearance.borderRadius
        }}
      />
      
      {/* Transparent overlay for interaction */}
      <div
        className={cn(
          "absolute inset-0",
          interactive ? "cursor-move" : "cursor-default",
          MAP_ANIMATIONS.pan
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          borderRadius: PLATFORM_MAP_CONFIG.appearance.borderRadius
        }}
      />

      {/* Fallback iframe map - only show when primary map completely fails */}
      {useEmbedFallback && renderStats.tilesLoaded === 0 && (
        <iframe
          title="Map fallback"
          src={getOsmEmbedUrl()}
          className="absolute inset-0 w-full h-full border-0 z-10 rounded-xl"
          loading="lazy"
          referrerPolicy="no-referrer"
          style={{
            borderRadius: PLATFORM_MAP_CONFIG.appearance.borderRadius
          }}
        />
      )}

      {/* Diagnostic: container size */}
      {(viewport.width < 100 || viewport.height < 100) && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-background/90 backdrop-blur-sm border rounded-md px-3 py-2 text-sm">
            Map container has no size. Add min-h-[500px] to the map container.
          </div>
        </div>
      )}
      
      {/* Loading indicator with progress */}
      {isLoading && !useEmbedFallback && (
        <div className={cn(
          "absolute top-4 left-4 flex items-center gap-2 px-3 py-2 text-sm rounded-lg shadow-map border border-map-border",
          MAP_CONTROLS.professional.background,
          "text-map-control-foreground"
        )}>
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Loading tiles... ({renderStats.tilesLoaded}/{renderStats.totalTiles})</span>
        </div>
      )}

      {/* Prolonged-loading hint */}
      {loadingTooLong && !useEmbedFallback && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
          <div className={cn(
            "px-3 py-2 text-xs flex items-center gap-2 rounded-lg shadow-map border border-map-border",
            MAP_CONTROLS.professional.background,
            "text-map-control-foreground"
          )}>
            <span>Tiles are taking longer than usual to load.</span>
            <span className="text-muted-foreground">Provider: {currentProvider}</span>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={tryAlternateProvider} 
              className="h-7 px-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Try alternate
            </Button>
            {renderStats.tilesLoaded === 0 && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setUseEmbedFallback(true)} 
                className="h-7 px-2 bg-emergency text-emergency-foreground hover:bg-emergency/90"
              >
                Use fallback
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Controls */}
      {showControls && (
        <>
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewport(prev => ({ ...prev, zoom: Math.min(PLATFORM_MAP_CONFIG.maxZoom, prev.zoom + 1) }))}
              className={cn(
                "w-10 h-10 p-0 shadow-map border-map-border transition-map",
                MAP_CONTROLS.professional.background,
                MAP_CONTROLS.professional.foreground,
                MAP_CONTROLS.professional.hover,
                MAP_CONTROLS.professional.rounded
              )}
              disabled={!interactive}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewport(prev => ({ ...prev, zoom: Math.max(PLATFORM_MAP_CONFIG.minZoom, prev.zoom - 1) }))}
              className={cn(
                "w-10 h-10 p-0 shadow-map border-map-border transition-map",
                MAP_CONTROLS.professional.background,
                MAP_CONTROLS.professional.foreground,
                MAP_CONTROLS.professional.hover,
                MAP_CONTROLS.professional.rounded
              )}
              disabled={!interactive}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={resetToCenter}
              className={cn(
                "w-10 h-10 p-0 shadow-map border-map-border transition-map",
                MAP_CONTROLS.professional.background,
                MAP_CONTROLS.professional.foreground,
                MAP_CONTROLS.professional.hover,
                MAP_CONTROLS.professional.rounded
              )}
              disabled={!interactive}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAccuracy(!showAccuracy)}
              className={cn(
                "w-10 h-10 p-0 shadow-map border-map-border transition-map",
                MAP_CONTROLS.professional.background,
                MAP_CONTROLS.professional.foreground,
                MAP_CONTROLS.professional.hover,
                MAP_CONTROLS.professional.rounded,
                showAccuracy && "bg-primary text-primary-foreground"
              )}
              disabled={!interactive}
              title="Toggle accuracy circles"
            >
              <Layers className="h-4 w-4" />
            </Button>
          </div>

          {/* Enhanced controls */}
          <div className="absolute top-4 left-4 space-y-2">
            {/* Map mode toggle */}
            <div className="flex gap-1 p-1 rounded-lg bg-map-control shadow-map border border-map-border">
              <Button
                variant={mapMode === 'standard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMapMode('standard')}
                className={cn(
                  "text-xs h-7 px-3 transition-map",
                  mapMode === 'standard' 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-map-control-foreground hover:bg-map-control-hover"
                )}
                disabled={!interactive}
              >
                Map
              </Button>
              <Button
                variant={mapMode === 'satellite' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMapMode('satellite')}
                className={cn(
                  "text-xs h-7 px-3 transition-map",
                  mapMode === 'satellite' 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-map-control-foreground hover:bg-map-control-hover"
                )}
                disabled={!interactive}
              >
                Satellite
              </Button>
              <Button
                variant={mapMode === 'dark' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMapMode('dark')}
                className={cn(
                  "text-xs h-7 px-3 transition-map",
                  mapMode === 'dark' 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-map-control-foreground hover:bg-map-control-hover"
                )}
                disabled={!interactive}
              >
                Dark
              </Button>
            </div>

            {/* Search and Directions toggles */}
            <div className="flex gap-1 p-1 rounded-lg bg-map-control shadow-map border border-map-border">
              <Button
                variant={showSearch ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                  "text-xs h-7 px-3 transition-map",
                  showSearch 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-map-control-foreground hover:bg-map-control-hover"
                )}
                disabled={!interactive}
              >
                Search
              </Button>
              <Button
                variant={showDirections ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowDirections(!showDirections)}
                className={cn(
                  "text-xs h-7 px-3 transition-map",
                  showDirections 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-map-control-foreground hover:bg-map-control-hover"
                )}
                disabled={!interactive}
              >
                Routes
              </Button>
            </div>
          </div>

          {/* Map info and cache stats */}
          {!useEmbedFallback && PLATFORM_MAP_CONFIG.appearance.showCoordinates && (
            <div className={cn(
              "absolute bottom-4 left-4 rounded-lg px-3 py-2 text-xs shadow-map border border-map-border",
              MAP_CONTROLS.professional.background,
              "text-map-control-foreground"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-3 w-3" />
                <span>
                  {viewport.centerLat.toFixed(4)}, {viewport.centerLng.toFixed(4)} • Z{Math.floor(viewport.zoom)}
                </span>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-muted-foreground/70">
                  Cache: {Math.round(renderStats.cacheHitRate * 100)}% • {renderStats.tilesLoaded}/{renderStats.totalTiles}
                </div>
              )}
              <div className="text-xs text-muted-foreground/70 mt-1">
                {enhancedTileCache.getAttribution(mapMode)}
              </div>
            </div>
          )}

          {/* Search Panel */}
          {showSearch && (
            <div className="absolute top-16 left-4 w-80 max-w-[calc(100vw-2rem)]">
              <MapSearch
                onLocationSelect={handleLocationSelect}
                className="w-full"
              />
            </div>
          )}

          {/* Directions Panel */}
          {showDirections && (
            <div className="absolute top-16 right-4 w-80 max-w-[calc(100vw-2rem)]">
              <MapDirections
                fromLocation={selectedLocation ? { lat: viewport.centerLat, lng: viewport.centerLng, name: 'Current View' } : undefined}
                toLocation={selectedLocation}
                onDirectionsCalculated={handleDirectionsCalculated}
                className="w-full"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CanvasMap;