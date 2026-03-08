import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { withTranslation, WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Auto-retry for certain errors
    if (this.shouldAutoRetry(error) && this.state.retryCount < 3) {
      this.retryTimeout = setTimeout(() => {
        this.setState(prev => ({ 
          hasError: false, 
          error: undefined, 
          retryCount: prev.retryCount + 1 
        }));
      }, 2000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  shouldAutoRetry(error: Error): boolean {
    // Auto-retry for network errors or chunk loading failures
    return error.message.includes('Loading chunk') || 
           error.message.includes('fetch') ||
           error.message.includes('NetworkError');
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined,
      retryCount: this.state.retryCount + 1 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-xl">{this.props.t('errorBoundary.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {this.state.error?.message?.includes('Loading chunk')
                  ? this.props.t('errorBoundary.chunkError')
                  : this.props.t('errorBoundary.genericError')}
              </p>

              {this.state.retryCount > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {this.props.t('errorBoundary.retryAttempt', { count: this.state.retryCount })}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {this.props.t('errorBoundary.tryAgain')}
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="outline"
                >
                  {this.props.t('errorBoundary.reloadPage')}
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    {this.props.t('errorBoundary.errorDetails')}
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(EnhancedErrorBoundary);