import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  Zap,
  Brain,
  Image,
  Database,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProviderStatus {
  openai: boolean;
  xai: boolean;
}

interface ProviderDetails {
  openai: {
    status: string;
    models: string[];
  };
  xai: {
    status: string;
    models: string[];
  };
  supabase: {
    status: string;
    url: string;
  };
}

interface AIProviderStatusProps {
  onStatusUpdate?: (status: ProviderStatus) => void;
}

export const AIProviderStatus: React.FC<AIProviderStatusProps> = ({ onStatusUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [status, setStatus] = useState<ProviderStatus>({
    openai: false,
    xai: false
  });
  const [details, setDetails] = useState<ProviderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkProviderStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('riven-marketing-enhanced', {
        body: { action: 'provider_status' }
      });

      if (error) throw error;

      if (data.success) {
        setStatus(data.providers);
        setDetails(data.details);
        setLastCheck(new Date());
        
        if (onStatusUpdate) {
          onStatusUpdate(data.providers);
        }
      } else {
        throw new Error('Failed to check provider status');
      }
    } catch (err) {
      console.error('Error checking AI provider status:', err);
      setError(err.message || 'Failed to check provider status');
    } finally {
      setIsLoading(false);
    }
  };

  // Check status on component mount
  useEffect(() => {
    checkProviderStatus();
  }, []);

  const getStatusIcon = (connected: boolean) => {
    if (connected) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (connected: boolean) => {
    if (connected) {
      return <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>;
    }
    return <Badge variant="destructive">Offline</Badge>;
  };

  const overallStatus = status.openai || status.xai;

  return (
    <Card className={`border-l-4 ${overallStatus ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Provider Status
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkProviderStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* OpenAI Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-sm">OpenAI</div>
              <div className="text-xs text-muted-foreground">
                Text & Image Generation
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(status.openai)}
            {getStatusBadge(status.openai)}
          </div>
        </div>

        {/* xAI Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-purple-600" />
            <div>
              <div className="font-medium text-sm">xAI (Grok)</div>
              <div className="text-xs text-muted-foreground">
                Advanced Content Analysis
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(status.xai)}
            {getStatusBadge(status.xai)}
          </div>
        </div>

        {/* Supabase Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium text-sm">Supabase</div>
              <div className="text-xs text-muted-foreground">
                Database & Functions
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
          </div>
        </div>

        {/* Available Models */}
        {details && (
          <div className="pt-2 border-t">
            <div className="text-xs font-medium text-muted-foreground mb-2">Available Models:</div>
            <div className="space-y-1">
              {details.openai.models.length > 0 && (
                <div className="text-xs">
                  <span className="font-medium">OpenAI:</span> {details.openai.models.join(', ')}
                </div>
              )}
              {details.xai.models.length > 0 && (
                <div className="text-xs">
                  <span className="font-medium">xAI:</span> {details.xai.models.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {lastCheck && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
            <Clock className="h-3 w-3" />
            Last checked: {lastCheck.toLocaleTimeString()}
          </div>
        )}

        {!overallStatus && (
          <div className="mt-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                No AI providers available. Content generation will use fallback methods.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};