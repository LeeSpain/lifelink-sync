import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Clock, Zap, Eye } from 'lucide-react';

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  pageLoadTime: number | null;
  ttfb: number | null; // Time to First Byte
}

interface PerformanceMonitorProps {
  show?: boolean;
  onError?: (error: Error) => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  show = false, 
  onError 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    pageLoadTime: null,
    ttfb: null,
  });

  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
      });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          setMetrics(prev => ({ ...prev, fid }));
        });
      });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        setMetrics(prev => ({ ...prev, cls: clsValue }));
      });

      // Navigation timing for page load and TTFB
      const updateNavigationMetrics = () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
          const ttfb = navigation.responseStart - navigation.requestStart;
          setMetrics(prev => ({ 
            ...prev, 
            pageLoadTime: pageLoadTime > 0 ? pageLoadTime : null,
            ttfb: ttfb > 0 ? ttfb : null
          }));
        }
      };

      // Observe performance entries
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Update navigation metrics when page loads
      if (document.readyState === 'complete') {
        updateNavigationMetrics();
      } else {
        window.addEventListener('load', updateNavigationMetrics);
      }

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        window.removeEventListener('load', updateNavigationMetrics);
      };
    } catch (error) {
      console.error('Performance monitoring setup failed:', error);
      onError?.(error as Error);
    }
  }, [onError]);

  const getScoreColor = (value: number | null, thresholds: { good: number; poor: number }): "secondary" | "default" | "destructive" | "outline" => {
    if (value === null) return 'secondary';
    if (value <= thresholds.good) return 'default';
    if (value <= thresholds.poor) return 'outline';
    return 'destructive';
  };

  const getScoreText = (value: number | null, thresholds: { good: number; poor: number }) => {
    if (value === null) return 'N/A';
    if (value <= thresholds.good) return 'Good';
    if (value <= thresholds.poor) return 'Needs Improvement';
    return 'Poor';
  };

  const formatTime = (ms: number | null) => {
    if (ms === null) return 'N/A';
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  // Core Web Vitals thresholds
  const thresholds = {
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    pageLoad: { good: 3000, poor: 5000 },
    ttfb: { good: 600, poor: 1500 },
  };

  if (!isVisible && !show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-background/95 backdrop-blur border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Monitor
            </CardTitle>
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="text-xs hover:text-primary"
            >
              {isVisible ? 'Hide' : 'Show'}
            </button>
          </div>
        </CardHeader>
        
        {isVisible && (
          <CardContent className="space-y-3 pt-0">
            {/* Core Web Vitals */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Core Web Vitals</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  <span className="text-xs">LCP</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">{formatTime(metrics.lcp)}</span>
                  <Badge variant={getScoreColor(metrics.lcp, thresholds.lcp)} className="text-xs">
                    {getScoreText(metrics.lcp, thresholds.lcp)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  <span className="text-xs">FID</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">{formatTime(metrics.fid)}</span>
                  <Badge variant={getScoreColor(metrics.fid, thresholds.fid)} className="text-xs">
                    {getScoreText(metrics.fid, thresholds.fid)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3" />
                  <span className="text-xs">CLS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">
                    {metrics.cls !== null ? metrics.cls.toFixed(3) : 'N/A'}
                  </span>
                  <Badge variant={getScoreColor(metrics.cls, thresholds.cls)} className="text-xs">
                    {getScoreText(metrics.cls, thresholds.cls)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="text-xs font-medium text-muted-foreground">Loading Metrics</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">Page Load</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">{formatTime(metrics.pageLoadTime)}</span>
                  <Badge variant={getScoreColor(metrics.pageLoadTime, thresholds.pageLoad)} className="text-xs">
                    {getScoreText(metrics.pageLoadTime, thresholds.pageLoad)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3" />
                  <span className="text-xs">TTFB</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">{formatTime(metrics.ttfb)}</span>
                  <Badge variant={getScoreColor(metrics.ttfb, thresholds.ttfb)} className="text-xs">
                    {getScoreText(metrics.ttfb, thresholds.ttfb)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Overall Performance Score */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Overall Score</span>
                <Badge variant="default" className="text-xs">
                  Monitoring
                </Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default PerformanceMonitor;