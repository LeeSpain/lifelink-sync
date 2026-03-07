import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Zap,
  Cpu,
  HardDrive,
  Activity,
  TrendingUp,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceMetrics {
  frameRate: number;
  renderTime: number;
  memoryUsage: number;
  isOptimal: boolean;
}

interface OptimizationSettings {
  enableClustering: boolean;
  clusterThreshold: number;
  enableTrailOptimization: boolean;
  maxTrailPoints: number;
  enableLOD: boolean; // Level of Detail
  lodDistance: number;
  enableBackgroundSync: boolean;
  syncInterval: number;
  enablePredictiveLoading: boolean;
  cacheSize: number;
}

interface RenderStats {
  totalMarkers: number;
  visibleMarkers: number;
  clusteredMarkers: number;
  animatingMarkers: number;
  cacheHitRate: number;
  networkRequests: number;
}

export const MapPerformanceOptimizer: React.FC<{
  performance: PerformanceMetrics;
  onSettingsChange: (settings: OptimizationSettings) => void;
  className?: string;
}> = ({ performance, onSettingsChange, className }) => {
  const [settings, setSettings] = useState<OptimizationSettings>({
    enableClustering: true,
    clusterThreshold: 100, // meters
    enableTrailOptimization: true,
    maxTrailPoints: 10,
    enableLOD: true,
    lodDistance: 1000, // meters
    enableBackgroundSync: true,
    syncInterval: 30000, // 30 seconds
    enablePredictiveLoading: false,
    cacheSize: 50 // MB
  });

  const [renderStats, setRenderStats] = useState<RenderStats>({
    totalMarkers: 0,
    visibleMarkers: 0,
    clusteredMarkers: 0,
    animatingMarkers: 0,
    cacheHitRate: 0,
    networkRequests: 0
  });

  const [autoOptimize, setAutoOptimize] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Performance monitoring
  const frameTimeRef = useRef<number[]>([]);
  const lastOptimizationRef = useRef<number>(Date.now());

  // Auto-optimization logic
  const autoOptimizeSettings = useCallback(() => {
    if (!autoOptimize) return;

    const now = Date.now();
    if (now - lastOptimizationRef.current < 5000) return; // Throttle to every 5 seconds

    let newSettings = { ...settings };
    let changed = false;

    // Aggressive optimization if performance is poor
    if (performance.frameRate < 30) {
      if (!newSettings.enableClustering) {
        newSettings.enableClustering = true;
        changed = true;
      }
      if (newSettings.maxTrailPoints > 5) {
        newSettings.maxTrailPoints = 5;
        changed = true;
      }
      if (!newSettings.enableLOD) {
        newSettings.enableLOD = true;
        changed = true;
      }
    }
    // Conservative optimization if performance is moderate
    else if (performance.frameRate < 50) {
      if (newSettings.maxTrailPoints > 15) {
        newSettings.maxTrailPoints = 15;
        changed = true;
      }
      if (newSettings.clusterThreshold > 50) {
        newSettings.clusterThreshold = 50;
        changed = true;
      }
    }
    // Relax optimization if performance is good
    else if (performance.frameRate >= 55) {
      if (newSettings.maxTrailPoints < 20) {
        newSettings.maxTrailPoints = Math.min(20, newSettings.maxTrailPoints + 2);
        changed = true;
      }
    }

    // Memory-based optimizations
    if (performance.memoryUsage > 150) {
      if (newSettings.cacheSize > 25) {
        newSettings.cacheSize = 25;
        changed = true;
      }
      if (newSettings.maxTrailPoints > 8) {
        newSettings.maxTrailPoints = 8;
        changed = true;
      }
    }

    if (changed) {
      setSettings(newSettings);
      onSettingsChange(newSettings);
      lastOptimizationRef.current = now;
    }
  }, [performance, settings, autoOptimize, onSettingsChange]);

  // Run auto-optimization
  useEffect(() => {
    autoOptimizeSettings();
  }, [autoOptimizeSettings]);

  // Track frame times for smoothness analysis
  useEffect(() => {
    const now = Date.now();
    frameTimeRef.current.push(now);
    
    // Keep only last 60 frames (1 second at 60fps)
    if (frameTimeRef.current.length > 60) {
      frameTimeRef.current = frameTimeRef.current.slice(-60);
    }
  }, [performance.frameRate]);

  const updateSetting = <K extends keyof OptimizationSettings>(
    key: K,
    value: OptimizationSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const getPerformanceColor = (metric: 'fps' | 'memory' | 'render') => {
    switch (metric) {
      case 'fps':
        return performance.frameRate >= 55 ? 'text-green-500' :
               performance.frameRate >= 30 ? 'text-yellow-500' : 'text-red-500';
      case 'memory':
        return performance.memoryUsage < 50 ? 'text-green-500' :
               performance.memoryUsage < 100 ? 'text-yellow-500' : 'text-red-500';
      case 'render':
        return performance.renderTime < 8 ? 'text-green-500' :
               performance.renderTime < 16 ? 'text-yellow-500' : 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const calculateFrameTimeVariance = () => {
    if (frameTimeRef.current.length < 2) return 0;
    
    const intervals = frameTimeRef.current.slice(1).map((time, i) => 
      time - frameTimeRef.current[i]
    );
    
    const avg = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avg, 2), 0) / intervals.length;
    
    return Math.sqrt(variance);
  };

  const frameVariance = calculateFrameTimeVariance();
  const isSmooth = frameVariance < 5; // Less than 5ms variance is considered smooth

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Performance Optimizer</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={performance.isOptimal ? "default" : "secondary"}>
              {performance.isOptimal ? "Optimal" : "Optimizing"}
            </Badge>
            <Switch
              checked={autoOptimize}
              onCheckedChange={setAutoOptimize}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Frame Rate</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={cn("font-bold", getPerformanceColor('fps'))}>
                {performance.frameRate} FPS
              </span>
              {isSmooth ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Memory</span>
            </div>
            <span className={cn("font-bold", getPerformanceColor('memory'))}>
              {performance.memoryUsage.toFixed(1)} MB
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Render Time</span>
            </div>
            <span className={cn("font-bold", getPerformanceColor('render'))}>
              {performance.renderTime.toFixed(1)} ms
            </span>
          </div>
        </div>

        {/* Quick Optimization Presets */}
        <div className="space-y-3">
          <h4 className="font-medium">Quick Presets</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSetting('maxTrailPoints', 5)}
              className="flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>Performance</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSetting('maxTrailPoints', 15)}
              className="flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Balanced</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSetting('maxTrailPoints', 25)}
              className="flex items-center space-x-2"
            >
              <Cpu className="h-4 w-4" />
              <span>Quality</span>
            </Button>
          </div>
        </div>

        {/* Core Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Core Optimizations</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Clustering</label>
                <p className="text-sm text-muted-foreground">Group nearby markers for better performance</p>
              </div>
              <Switch
                checked={settings.enableClustering}
                onCheckedChange={(checked) => updateSetting('enableClustering', checked)}
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Trail Points: {settings.maxTrailPoints}</label>
              <Slider
                value={[settings.maxTrailPoints]}
                onValueChange={([value]) => updateSetting('maxTrailPoints', value)}
                min={3}
                max={30}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Minimal</span>
                <span>Detailed</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Level of Detail</label>
                <p className="text-sm text-muted-foreground">Reduce detail for distant markers</p>
              </div>
              <Switch
                checked={settings.enableLOD}
                onCheckedChange={(checked) => updateSetting('enableLOD', checked)}
              />
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-background/30 rounded-lg">
            <h4 className="font-medium">Advanced Settings</h4>
            
            <div className="space-y-2">
              <label className="font-medium">Cluster Threshold: {settings.clusterThreshold}m</label>
              <Slider
                value={[settings.clusterThreshold]}
                onValueChange={([value]) => updateSetting('clusterThreshold', value)}
                min={10}
                max={500}
                step={10}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium">Cache Size: {settings.cacheSize}MB</label>
              <Slider
                value={[settings.cacheSize]}
                onValueChange={([value]) => updateSetting('cacheSize', value)}
                min={10}
                max={200}
                step={5}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Background Sync</label>
                <p className="text-sm text-muted-foreground">Update data in background</p>
              </div>
              <Switch
                checked={settings.enableBackgroundSync}
                onCheckedChange={(checked) => updateSetting('enableBackgroundSync', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Predictive Loading</label>
                <p className="text-sm text-muted-foreground">Preload based on movement patterns</p>
              </div>
              <Switch
                checked={settings.enablePredictiveLoading}
                onCheckedChange={(checked) => updateSetting('enablePredictiveLoading', checked)}
              />
            </div>
          </div>
        )}

        {/* Render Statistics */}
        <div className="space-y-3">
          <h4 className="font-medium">Render Statistics</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Markers:</span>
              <span className="font-medium">{renderStats.totalMarkers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Visible:</span>
              <span className="font-medium">{renderStats.visibleMarkers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Clustered:</span>
              <span className="font-medium">{renderStats.clusteredMarkers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Animating:</span>
              <span className="font-medium">{renderStats.animatingMarkers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cache Hit Rate:</span>
              <span className="font-medium">{renderStats.cacheHitRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frame Variance:</span>
              <span className={cn("font-medium", isSmooth ? "text-green-500" : "text-yellow-500")}>
                {frameVariance.toFixed(1)}ms
              </span>
            </div>
          </div>
        </div>

        {/* Performance Warnings */}
        {!performance.isOptimal && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Performance Notice</p>
                <p className="text-yellow-700">
                  {performance.frameRate < 30 && "Low frame rate detected. "}
                  {performance.memoryUsage > 100 && "High memory usage detected. "}
                  {performance.renderTime > 16 && "Slow rendering detected. "}
                  {autoOptimize ? "Auto-optimization is active." : "Consider enabling auto-optimization."}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
