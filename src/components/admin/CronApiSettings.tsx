import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, AlertCircle, CheckCircle2, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSiteContent } from '@/hooks/useSiteContent';

export function CronApiSettings() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [showSecret, setShowSecret] = useState(false);
  
  // Store cron config in site_content for admin-managed settings
  const { value: cronConfig, save: saveCronConfig, isLoading } = useSiteContent('cron_api_config', {
    secret: '',
    lastTestAt: null,
    lastTestSuccess: null,
    scheduleMinutes: 5
  });

  const handleSecretChange = async (newSecret: string) => {
    try {
      await saveCronConfig({
        ...cronConfig!,
        secret: newSecret
      });
      toast.success('Cron secret updated');
    } catch (error) {
      console.error('Failed to save cron config:', error);
      toast.error('Failed to save cron secret');
    }
  };

  const handleTestAutomation = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Call automation-runner with the configured secret
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (cronConfig?.secret) {
        headers['x-cron-secret'] = cronConfig.secret;
      }
      
      const { data, error } = await supabase.functions.invoke('automation-runner', {
        body: {},
        headers
      });
      
      if (error) {
        throw error;
      }
      
      setTestResult(data);
      
      // Save test result
      await saveCronConfig({
        ...cronConfig!,
        lastTestAt: new Date().toISOString(),
        lastTestSuccess: data?.success ?? false
      });
      
      if (data?.success) {
        toast.success(`Automation ran successfully! Email: ${data.email?.processed ?? 0}, Posting: ${data.posting?.processed ?? 0}`);
      } else {
        toast.warning('Automation completed with errors - check results below');
      }
    } catch (error: any) {
      console.error('Automation test failed:', error);
      setTestResult({ success: false, error: error.message });
      toast.error(`Test failed: ${error.message}`);
      
      await saveCronConfig({
        ...cronConfig!,
        lastTestAt: new Date().toISOString(),
        lastTestSuccess: false
      });
    } finally {
      setTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'mqroziggaalltuzoyyao';
    const url = `https://${projectId}.supabase.co/functions/v1/automation-runner`;
    navigator.clipboard.writeText(url);
    toast.success('Webhook URL copied to clipboard');
  };

  const copyCurlCommand = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'mqroziggaalltuzoyyao';
    const secret = cronConfig?.secret || 'YOUR_CRON_SECRET';
    const cmd = `curl -X POST "https://${projectId}.supabase.co/functions/v1/automation-runner" \\
  -H "Content-Type: application/json" \\
  -H "x-cron-secret: ${secret}" \\
  -d '{}'`;
    navigator.clipboard.writeText(cmd);
    toast.success('cURL command copied to clipboard');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Cron Automation Settings
        </CardTitle>
        <CardDescription>
          Configure automated email and social media posting schedules. 
          Set up a cron job service (like cron-job.org, EasyCron, or Supabase pg_cron) to call the automation endpoint.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cron Secret */}
        <div className="space-y-2">
          <Label htmlFor="cronSecret">Cron API Secret</Label>
          <p className="text-sm text-muted-foreground">
            This secret must be sent in the <code className="bg-muted px-1 rounded">x-cron-secret</code> header when calling the automation endpoint.
            Add this same value to your Supabase Edge Function secrets as <code className="bg-muted px-1 rounded">CRON_SECRET</code>.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="cronSecret"
                type={showSecret ? 'text' : 'password'}
                value={cronConfig?.secret || ''}
                onChange={(e) => handleSecretChange(e.target.value)}
                placeholder="Enter a secure random string..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const secret = crypto.randomUUID();
                handleSecretChange(secret);
              }}
            >
              Generate
            </Button>
          </div>
        </div>

        {/* Webhook URL */}
        <div className="space-y-2">
          <Label>Automation Webhook URL</Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'mqroziggaalltuzoyyao'}.supabase.co/functions/v1/automation-runner`}
              className="font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* cURL Example */}
        <div className="space-y-2">
          <Label>Example cURL Command</Label>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all">
{`curl -X POST "https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'mqroziggaalltuzoyyao'}.supabase.co/functions/v1/automation-runner" \\
  -H "Content-Type: application/json" \\
  -H "x-cron-secret: ${cronConfig?.secret || 'YOUR_SECRET'}" \\
  -d '{}'`}
              </pre>
            </div>
            <Button variant="outline" size="icon" onClick={copyCurlCommand}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Test Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-1">
            <p className="font-medium">Test Automation</p>
            <p className="text-sm text-muted-foreground">
              Run the automation now to process email queue and social posts
            </p>
            {cronConfig?.lastTestAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Last test: {new Date(cronConfig.lastTestAt).toLocaleString()}</span>
                {cronConfig.lastTestSuccess ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Success
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Failed
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Button onClick={handleTestAutomation} disabled={testing}>
            <Play className="h-4 w-4 mr-2" />
            {testing ? 'Running...' : 'Run Now'}
          </Button>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className={`p-4 rounded-lg border ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              {testResult.success ? (
                <><CheckCircle2 className="h-4 w-4 text-green-600" /> Automation Results</>
              ) : (
                <><AlertCircle className="h-4 w-4 text-red-600" /> Automation Failed</>
              )}
            </h4>
            <pre className="text-xs overflow-auto max-h-48 bg-background/50 p-2 rounded">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Setup Instructions */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
          <h4 className="font-medium">Setup Instructions</h4>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Generate or enter a secure secret above</li>
            <li>Add <code className="bg-muted px-1 rounded">CRON_SECRET</code> to your Supabase Edge Function secrets with the same value</li>
            <li>Set up a cron job service to call the webhook URL every 5 minutes (or your preferred interval)</li>
            <li>Include the <code className="bg-muted px-1 rounded">x-cron-secret</code> header in your cron job request</li>
            <li>Test the automation using the "Run Now" button</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
