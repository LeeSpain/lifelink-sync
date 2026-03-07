// Error reporting and monitoring utilities

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

class ErrorReporter {
  private isProduction = process.env.NODE_ENV === 'production';
  private queue: ErrorReport[] = [];
  private maxQueueSize = 50;

  reportError(error: Error, metadata?: Record<string, any>) {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      metadata,
    };

    // Add to queue
    this.queue.push(report);
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift(); // Remove oldest
    }

    // Log to console in development
    if (!this.isProduction) {
      console.error('Error reported:', report);
    }

    // In production, you would send to error tracking service
    if (this.isProduction) {
      this.sendToErrorService(report);
    }
  }

  reportPaymentError(error: Error, paymentDetails?: Record<string, any>) {
    this.reportError(error, {
      category: 'payment',
      ...paymentDetails,
    });
  }

  reportAuthError(error: Error, authAction?: string) {
    this.reportError(error, {
      category: 'authentication',
      action: authAction,
    });
  }

  reportEmergencyError(error: Error, emergencyType?: string) {
    this.reportError(error, {
      category: 'emergency',
      type: emergencyType,
      critical: true,
    });
  }

  private async sendToErrorService(report: ErrorReport) {
    try {
      // Send to internal production monitoring edge function
      const response = await fetch('/api/v1/production-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track_error',
          data: {
            message: report.message,
            stack: report.stack,
            url: report.url,
            timestamp: report.timestamp,
            user_agent: report.userAgent,
            user_id: report.userId,
            session_id: report.sessionId,
            metadata: report.metadata,
            severity: report.metadata?.critical ? 'critical' : 'error'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Error tracking failed: ${response.status}`);
      }
    } catch (e) {
      console.error('Failed to send error report to internal system:', e);
      // Fallback to local storage for offline scenarios
      this.storeErrorLocally(report);
    }
  }

  private storeErrorLocally(report: ErrorReport) {
    try {
      const stored = localStorage.getItem('pending_errors');
      const pendingErrors = stored ? JSON.parse(stored) : [];
      pendingErrors.push(report);
      
      // Keep only last 20 errors in local storage
      if (pendingErrors.length > 20) {
        pendingErrors.splice(0, pendingErrors.length - 20);
      }
      
      localStorage.setItem('pending_errors', JSON.stringify(pendingErrors));
    } catch (e) {
      console.error('Failed to store error locally:', e);
    }
  }

  getRecentErrors(): ErrorReport[] {
    return [...this.queue];
  }

  clearErrors() {
    this.queue = [];
  }
}

// Global error reporter instance
export const errorReporter = new ErrorReporter();

// Global error handlers
window.addEventListener('error', (event) => {
  errorReporter.reportError(new Error(event.message), {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  errorReporter.reportError(
    new Error(event.reason?.message || 'Unhandled Promise Rejection'),
    {
      reason: event.reason,
      type: 'unhandledrejection',
    }
  );
});

// Utility functions
export const withErrorReporting = <T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorReporter.reportError(error, { context, args });
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      errorReporter.reportError(error as Error, { context, args });
      throw error;
    }
  }) as T;
};

export const safeAsync = async <T>(
  operation: () => Promise<T>,
  context?: string,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    errorReporter.reportError(error as Error, { context });
    return fallback;
  }
};