import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Zap,
  Brain,
  Database,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  component: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export const AIProviderDiagnostics: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runFullDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    const diagnostics: DiagnosticResult[] = [];
    
    try {
      // Test 1: Edge Function Connectivity
      diagnostics.push({
        component: 'Edge Function',
        status: 'success',
        message: 'Starting diagnostics...'
      });

      // Test 2: Provider Status Check
      const { data: providerData, error: providerError } = await supabase.functions.invoke('riven-marketing-enhanced', {
        body: { action: 'provider_status' }
      });

      if (providerError) {
        diagnostics.push({
          component: 'Provider Status API',
          status: 'error',
          message: `Failed to call provider status: ${providerError.message}`,
          details: providerError
        });
      } else {
        diagnostics.push({
          component: 'Provider Status API',
          status: 'success',
          message: 'Successfully called provider status endpoint',
          details: providerData
        });

        // Test 3: OpenAI Status
        const openaiStatus = providerData?.providers?.openai;
        diagnostics.push({
          component: 'OpenAI Connection',
          status: openaiStatus ? 'success' : 'error',
          message: openaiStatus ? 'OpenAI API connected successfully' : 'OpenAI API connection failed',
          details: providerData?.details?.openai
        });

        // Test 4: xAI Status
        const xaiStatus = providerData?.providers?.xai;
        diagnostics.push({
          component: 'xAI (Grok) Connection',
          status: xaiStatus ? 'success' : 'error',
          message: xaiStatus ? 'xAI API connected successfully' : 'xAI API connection failed',
          details: providerData?.details?.xai
        });

        // Test 5: OpenRouter Status
        const openrouterConnected = providerData?.providers?.openrouter;
        const openrouterDetails = providerData?.details?.openrouter;
        let openrouterDiagStatus: 'success' | 'warning' | 'error' = openrouterConnected ? 'success' : 'error';
        let openrouterMessage = openrouterConnected
          ? 'OpenRouter API connected successfully'
          : 'OpenRouter API connection failed';

        if (!openrouterConnected && openrouterDetails?.status === 'warning') {
          openrouterDiagStatus = 'warning';
          // Try to extract a friendly message from the error payload
          let friendly = 'OpenRouter rate limited; please retry after reset.';
          try {
            const parsed = typeof openrouterDetails.error === 'string' 
              ? JSON.parse(openrouterDetails.error) 
              : openrouterDetails.error;
            if (parsed?.message) friendly = parsed.message;
            if (parsed?.resetAt) friendly += ` (resets at ${new Date(parsed.resetAt).toLocaleString()})`;
          } catch {}
          openrouterMessage = friendly;
        }

        diagnostics.push({
          component: 'OpenRouter Connection',
          status: openrouterDiagStatus,
          message: openrouterMessage,
          details: openrouterDetails
        });

        // Test 6: Content Generation Test
        if (openaiStatus || xaiStatus || openrouterConnected) {
          try {
            const { data: testContent, error: testError } = await supabase.functions.invoke('riven-marketing-enhanced', {
              body: { 
                command: 'Test connection for diagnostics',
                title: 'Diagnostic Test',
                settings: { word_count: 100 }
              }
            });

            if (testError) {
              diagnostics.push({
                component: 'Content Generation',
                status: 'error',
                message: `Content generation test failed: ${testError.message}`,
                details: testError
              });
            } else {
              diagnostics.push({
                component: 'Content Generation',
                status: 'success',
                message: 'Content generation workflow is working',
                details: testContent
              });
            }
          } catch (error) {
            diagnostics.push({
              component: 'Content Generation',
              status: 'error',
              message: `Content generation test error: ${error.message}`,
              details: error
            });
          }
        }
      }

      // Test 6: Database Connectivity
      const { data: dbTest, error: dbError } = await supabase
        .from('marketing_campaigns')
        .select('id')
        .limit(1);

      diagnostics.push({
        component: 'Database Connection',
        status: dbError ? 'error' : 'success',
        message: dbError ? `Database error: ${dbError.message}` : 'Database connection successful',
        details: dbError || { recordCount: dbTest?.length || 0 }
      });

    } catch (error) {
      diagnostics.push({
        component: 'General Error',
        status: 'error',
        message: `Unexpected error: ${error.message}`,
        details: error
      });
    }

    setResults(diagnostics);
    setLastRun(new Date());
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Success</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Provider Diagnostics
          </CardTitle>
          <Button
            onClick={runFullDiagnostics}
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Running...' : 'Run Full Diagnostics'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Click "Run Full Diagnostics" to test all AI provider connections and system components.
            </AlertDescription>
          </Alert>
        )}

        {results.map((result, index) => (
          <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
            <div className="flex items-start gap-3 flex-1">
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <div className="font-medium text-sm">{result.component}</div>
                <div className="text-sm text-muted-foreground">{result.message}</div>
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                      View Details
                    </summary>
                    <pre className="text-xs mt-1 p-2 bg-muted rounded text-muted-foreground overflow-auto max-h-32">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
            {getStatusBadge(result.status)}
          </div>
        ))}

        {lastRun && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Last run: {lastRun.toLocaleString()}
          </div>
        )}

        {results.length > 0 && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Common xAI Issues:</strong>
              <ul className="list-disc list-inside mt-1 text-sm space-y-1">
                <li>Verify your xAI API key is correct (starts with "xai-")</li>
                <li>Check if your account has access to Grok models</li>
                <li>Ensure your API key has the correct permissions</li>
                <li>Try regenerating your API key from the xAI dashboard</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};