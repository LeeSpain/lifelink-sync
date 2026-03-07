import { useEffect } from 'react';

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  imageLoadTimes: Record<string, number>;
}

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const metrics: PerformanceMetrics = {
      lcp: null,
      fid: null,
      cls: null,
      imageLoadTimes: {},
    };

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      metrics.lcp = lastEntry.startTime;
      console.log('LCP:', metrics.lcp);
    });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        metrics.fid = entry.processingStart - entry.startTime;
        console.log('FID:', metrics.fid);
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
      metrics.cls = clsValue;
      console.log('CLS:', metrics.cls);
    });

    // Image loading performance
    const imageObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes('/lovable-uploads/')) {
          const resourceEntry = entry as PerformanceResourceTiming;
          metrics.imageLoadTimes[entry.name] = resourceEntry.responseEnd - resourceEntry.startTime;
          console.log('Image load time:', entry.name, metrics.imageLoadTimes[entry.name]);
        }
      });
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      imageObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Performance monitoring not fully supported:', error);
    }

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      imageObserver.disconnect();
    };
  }, []);
};