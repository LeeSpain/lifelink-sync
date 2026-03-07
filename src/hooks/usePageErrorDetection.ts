import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageError {
  message: string;
  timestamp: Date;
  url: string;
  type: 'chunk_load_error' | 'network_error' | 'js_error' | 'timeout';
}

interface PagePerformance {
  isSlowLoading: boolean;
  hasErrors: boolean;
  errors: PageError[];
  loadTime?: number;
}

export const usePageErrorDetection = () => {
  const location = useLocation();
  const [performance, setPerformance] = useState<PagePerformance>({
    isSlowLoading: false,
    hasErrors: false,
    errors: [],
  });

  useEffect(() => {
    // Reset state on route change
    setPerformance({
      isSlowLoading: false,
      hasErrors: false,
      errors: [],
    });

    const startTime = Date.now();
    const timeoutId = setTimeout(() => {
      setPerformance(prev => ({
        ...prev,
        isSlowLoading: true,
      }));
    }, 3000); // Consider page slow if it takes more than 3 seconds

    // Error handler for JavaScript errors
    const handleError = (event: ErrorEvent) => {
      const error: PageError = {
        message: event.message,
        timestamp: new Date(),
        url: event.filename || location.pathname,
        type: event.message.includes('Loading chunk') ? 'chunk_load_error' : 'js_error',
      };

      setPerformance(prev => ({
        ...prev,
        hasErrors: true,
        errors: [...prev.errors, error],
      }));

      console.error('🚨 Page Error Detected:', error);
    };

    // Handler for unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const error: PageError = {
        message: event.reason?.message || 'Unhandled promise rejection',
        timestamp: new Date(),
        url: location.pathname,
        type: event.reason?.message?.includes('fetch') ? 'network_error' : 'js_error',
      };

      setPerformance(prev => ({
        ...prev,
        hasErrors: true,
        errors: [...prev.errors, error],
      }));

      console.error('🚨 Promise Rejection Detected:', error);
    };

    // Handler for resource loading errors
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        const error: PageError = {
          message: `Failed to load resource: ${target.getAttribute('src') || target.getAttribute('href')}`,
          timestamp: new Date(),
          url: location.pathname,
          type: 'chunk_load_error',
        };

        setPerformance(prev => ({
          ...prev,
          hasErrors: true,
          errors: [...prev.errors, error],
        }));

        console.error('🚨 Resource Load Error:', error);
      }
    };

    // Track when page load completes
    const handleLoad = () => {
      clearTimeout(timeoutId);
      const loadTime = Date.now() - startTime;
      
      setPerformance(prev => ({
        ...prev,
        isSlowLoading: false,
        loadTime,
      }));

      // Log performance
      console.log(`📊 Page loaded in ${loadTime}ms`);
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    document.addEventListener('error', handleResourceError, true);
    window.addEventListener('load', handleLoad);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      document.removeEventListener('error', handleResourceError, true);
      window.removeEventListener('load', handleLoad);
    };
  }, [location.pathname]);

  // Auto-retry function for chunk loading errors
  const retryChunkLoading = () => {
    const chunkErrors = performance.errors.filter(error => error.type === 'chunk_load_error');
    if (chunkErrors.length > 0) {
      console.log('🔄 Retrying chunk loading...');
      window.location.reload();
    }
  };

  // Clear errors function
  const clearErrors = () => {
    setPerformance(prev => ({
      ...prev,
      hasErrors: false,
      errors: [],
    }));
  };

  return {
    ...performance,
    retryChunkLoading,
    clearErrors,
  };
};

export default usePageErrorDetection;