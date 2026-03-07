import React from 'react';

// Performance monitoring utilities
export const performanceMonitor = {
  // Mark performance points
  mark: (name: string) => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },

  // Measure between two marks
  measure: (name: string, startMark: string, endMark?: string) => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark);
        } else {
          performance.measure(name, startMark);
        }
        
        const measure = performance.getEntriesByName(name)[0];
        console.log(`⚡ Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
        return measure.duration;
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
    return 0;
  },

  // Monitor component render times
  measureRender: (componentName: string, renderFn: () => void) => {
    const startMark = `${componentName}-render-start`;
    const endMark = `${componentName}-render-end`;
    
    performanceMonitor.mark(startMark);
    renderFn();
    performanceMonitor.mark(endMark);
    performanceMonitor.measure(`${componentName}-render`, startMark, endMark);
  },

  // Monitor API call performance
  measureAPI: async <T>(apiName: string, apiCall: () => Promise<T>): Promise<T> => {
    const startMark = `${apiName}-start`;
    const endMark = `${apiName}-end`;
    
    performanceMonitor.mark(startMark);
    try {
      const result = await apiCall();
      performanceMonitor.mark(endMark);
      performanceMonitor.measure(`API: ${apiName}`, startMark, endMark);
      return result;
    } catch (error) {
      performanceMonitor.mark(endMark);
      performanceMonitor.measure(`API: ${apiName} (error)`, startMark, endMark);
      throw error;
    }
  },

  // Get Core Web Vitals
  getCoreWebVitals: () => {
    if (typeof performance !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        // First Contentful Paint
        FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        
        // Largest Contentful Paint (approximation)
        LCP: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
        
        // Time to Interactive (approximation)
        TTI: navigation?.domInteractive - navigation?.fetchStart || 0,
        
        // First Input Delay (requires real user interaction)
        FID: 0, // Would need to be measured with actual user interaction
        
        // Page Load Time
        pageLoad: navigation?.loadEventEnd - navigation?.fetchStart || 0,
        
        // DOM Ready Time
        domReady: navigation?.domContentLoadedEventEnd - navigation?.fetchStart || 0,
      };
    }
    return {};
  },

  // Log performance summary
  logSummary: () => {
    const vitals = performanceMonitor.getCoreWebVitals();
    console.group('🚀 Performance Summary');
    console.log('📊 Core Web Vitals:', vitals);
    console.log('📈 All Performance Entries:', performance.getEntries());
    console.groupEnd();
  }
};

// React component performance wrapper
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    React.useEffect(() => {
      performanceMonitor.mark(`${componentName}-mount`);
      return () => {
        performanceMonitor.mark(`${componentName}-unmount`);
        performanceMonitor.measure(`${componentName}-lifecycle`, `${componentName}-mount`, `${componentName}-unmount`);
      };
    }, []);

    return React.createElement(Component, props);
  };
}

// Batch API calls for better performance
export async function batchRequests<T>(
  requests: Array<() => Promise<T>>,
  batchSize: number = 5
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(request => request()));
    results.push(...batchResults);
  }
  
  return results;
}