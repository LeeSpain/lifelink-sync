import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Zap, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Settings,
  TrendingUp,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProviderMetrics {
  openai: {
    status: 'connected' | 'error' | 'not_configured';
    models: string[];
    lastCheck: string;
    responseTime?: number;
  };
  xai: {
    status: 'connected' | 'error' | 'not_configured';
    models: string[];
    lastCheck: string;
    responseTime?: number;
  };
  fallbackMode: boolean;
  systemHealth: number;
}

export const EnhancedAIStatus: React.FC = () => {
  const [metrics, setMetrics] = useState<ProviderMetrics>({
    openai: { status: 'not_configured', models: [], lastCheck: '' },
    xai: { status: 'not_configured', models: [], lastCheck: '' },
    fallbackMode: false,
    systemHealth: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const checkSystemStatus = async () => {
    setIsLoading(true);
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('riven-marketing-enhanced', {
        body: { action: 'provider_status' }
      });

      const responseTime = Date.now() - startTime;

      if (error) throw error;

      if (data.success) {
        const openaiConnected = data.providers.openai;
        const xaiConnected = data.providers.xai;
        
        setMetrics({
          openai: {
            status: openaiConnected ? 'connected' : 'error',
            models: data.details.openai.models || [],
            lastCheck: new Date().toISOString(),
            responseTime: responseTime
          },
          xai: {
            status: xaiConnected ? 'connected' : 'error',
            models: data.details.xai.models || [],
            lastCheck: new Date().toISOString(),
            responseTime: responseTime
          },
          fallbackMode: !openaiConnected && !xaiConnected,
          systemHealth: calculateSystemHealth(openaiConnected, xaiConnected, responseTime)
        });
        
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error checking system status:', err);
      setMetrics(prev => ({
        ...prev,
        fallbackMode: true,
        systemHealth: 0
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSystemHealth = (openai: boolean, xai: boolean, responseTime: number): number => {
    let health = 0;
    
    if (openai) health += 40;
    if (xai) health += 40;
    
    // Response time bonus (up to 20 points)
    if (responseTime < 1000) health += 20;
    else if (responseTime < 3000) health += 10;
    else if (responseTime < 5000) health += 5;
    
    return Math.min(health, 100);
  };

  useEffect(() => {
    checkSystemStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-600';
    if (health >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBg = (health: number) => {
    if (health >= 80) return 'bg-green-500';
    if (health >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            AI System Status
          </CardTitle>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Health:</span>
              <span className={`text-lg font-bold ${getHealthColor(metrics.systemHealth)}`}>
                {metrics.systemHealth}%
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={checkSystemStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* System Health Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>System Health</span>
            <span className={getHealthColor(metrics.systemHealth)}>
              {metrics.systemHealth}%
            </span>
          </div>
          <Progress 
            value={metrics.systemHealth} 
            className="h-2"
          />
        </div>

        {/* Provider Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OpenAI Status */}
          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">OpenAI</span>
              </div>
              {getStatusIcon(metrics.openai.status)}
            </div>
            
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Models: {metrics.openai.models.length}</div>
              {metrics.openai.responseTime && (
                <div>Response: {metrics.openai.responseTime}ms</div>
              )}
            </div>
          </div>

          {/* xAI Status */}
          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">xAI (Grok)</span>
              </div>
              {getStatusIcon(metrics.xai.status)}
            </div>
            
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Models: {metrics.xai.models.length}</div>
              {metrics.xai.responseTime && (
                <div>Response: {metrics.xai.responseTime}ms</div>
              )}
            </div>
          </div>
        </div>

        {/* Fallback Mode Alert */}
        {metrics.fallbackMode && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              <strong>Fallback Mode Active:</strong> AI providers are offline. 
              Using intelligent templates for content generation.
            </AlertDescription>
          </Alert>
        )}

        {/* System Recommendations */}
        {metrics.systemHealth < 80 && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-900">
                  System Optimization Suggestions
                </div>
                <div className="text-xs text-blue-700 mt-1 space-y-1">
                  {metrics.openai.status !== 'connected' && (
                    <div>• Configure OpenAI API key for enhanced generation</div>
                  )}
                  {metrics.xai.status !== 'connected' && (
                    <div>• Configure xAI API key for advanced analysis</div>
                  )}
                  {(metrics.openai.responseTime || 0) > 3000 && (
                    <div>• Network latency detected - check connection</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last Update Info */}
        {lastUpdate && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};