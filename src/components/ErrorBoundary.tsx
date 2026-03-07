import React from 'react';
import { errorReporter } from '@/utils/errorReporting';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    // Report error to internal monitoring system
    errorReporter.reportError(error, {
      category: 'react_error_boundary',
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      critical: true
    });
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.reset} />;
      }

      return (
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. Our team has been notified.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-50 rounded p-4 mb-6 text-left">
                  <p className="text-sm font-mono text-red-600 mb-2">
                    {this.state.error.message}
                  </p>
                  <details className="text-xs text-gray-600">
                    <summary className="cursor-pointer font-semibold mb-2">
                      Stack Trace
                    </summary>
                    <pre className="overflow-auto max-h-40 text-xs whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </details>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <button
                  onClick={this.reset}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Go to Homepage
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;