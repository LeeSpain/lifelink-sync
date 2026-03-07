import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Database, Shield, Mail, Zap, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useAuth } from '@/contexts/AuthContext';
import { AIProviderDiagnostics } from '@/components/admin/AIProviderDiagnostics';
import { CronApiSettings } from '@/components/admin/CronApiSettings';

interface HealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  response_time: number;
  details: string;
}

export default function SystemSettingsPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [healthLoading, setHealthLoading] = useState(false);

  // AI Providers configuration stored in site_content for flexibility
  const { value: aiProvidersConfig, save: saveAiProvidersConfig, isLoading: aiConfigLoading } = useSiteContent('ai_providers_config', {
    providers: {
      openai: { enabled: true, model: 'gpt-5' },
      xai: { enabled: false, model: 'grok-beta' },
      openrouter: { enabled: false, model: 'google/gemma-2-9b-it:free' }
    },
    stages: {
      overview: { provider: 'openai' },
      text: { provider: 'openai' },
      image: { provider: 'openai' },
      finalize: { provider: 'openai' }
    }
  });

  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});

  const testProviders = async () => {
    try {
      setProviderStatus({}); // Clear previous status
      toast.info('Testing AI provider connections...');
      
      console.log('🔍 Testing providers with session:', !!session?.access_token);
      
      const { data, error } = await supabase.functions.invoke('riven-marketing-enhanced', {
        body: { action: 'provider_status' },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });
      
      console.log('📡 Provider test response:', { data, error });
      
      if (error) {
        console.error('❌ Provider test error:', error);
        throw error;
      }
      
      if (!data || data.success === false) {
        console.error('❌ Provider test failed:', data);
        throw new Error(data?.error || 'Provider test returned no data');
      }
      
      setProviderStatus(data?.providers || {});
      
      // Show detailed status
      const openaiStatus = data?.providers?.openai ? '✅ Connected' : '❌ Missing Key';
      const xaiStatus = data?.providers?.xai ? '✅ Connected' : '❌ Missing Key';
      const openrouterStatus = data?.providers?.openrouter ? '✅ Connected' : '❌ Missing Key';
      
      toast.success(`Provider Status: OpenAI: ${openaiStatus}, xAI: ${xaiStatus}, OpenRouter: ${openrouterStatus}`);
    } catch (err) {
      console.error('Provider status error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to check provider connections: ${errorMsg}`);
      setProviderStatus({});
    }
  };

  useEffect(() => {
    setLoading(false); // No longer loading settings from database
    loadSystemHealth();
  }, []);


  const loadSystemHealth = async () => {
    try {
      setHealthLoading(true);

      // Call the edge function directly via GET (it returns overall_status and checks[])
      const functionUrl = 'https://rqahqicfafnxlmdjcozu.supabase.co/functions/v1/system-health';
      const res = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        }
      });

      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);

      const data = await res.json() as {
        overall_status?: string;
        checks?: Array<{ component: string; status: 'healthy' | 'warning' | 'error'; response_time: number; details: string; }>;
      };

      if (Array.isArray(data.checks)) {
        setHealthChecks(
          data.checks.map((c) => ({
            component: c.component,
            status: c.status,
            response_time: c.response_time,
            details: c.details,
          }))
        );
      } else {
        throw new Error('Invalid health response');
      }
    } catch (error) {
      console.error('Error loading system health:', error);
      toast.error('Failed to load system health (showing last known status)');
      if (healthChecks.length === 0) {
        setHealthChecks([
          { component: 'edge_functions', status: 'warning', response_time: 0, details: 'No health data available' }
        ]);
      }
    } finally {
      setHealthLoading(false);
    }
  };

  const refreshSystemHealth = async () => {
    await loadSystemHealth();
    toast.success('System health refreshed');
  };

  // Real-time auto-refresh for provider status
  useEffect(() => {
    if (aiProvidersConfig) {
      testProviders(); // Test providers when config loads
    }
  }, [aiProvidersConfig]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Check className="h-4 w-4 text-white" />;
      case 'warning': return <X className="h-4 w-4 text-white" />;
      case 'error': return <X className="h-4 w-4 text-white" />;
      default: return <X className="h-4 w-4 text-white" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Loading system configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and monitor health</p>
        </div>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Monitor the status of core system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Real-time system component status
            </p>
            <Button variant="outline" size="sm" onClick={refreshSystemHealth} disabled={healthLoading}>
              {healthLoading ? 'Checking...' : 'Refresh'}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {healthChecks.map((check) => (
              <div key={check.component} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {check.component?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-muted-foreground">{check.details}</p>
                  </div>
                </div>
                <Badge className={`${getStatusColor(check.status)} text-white`}>
                  {getStatusIcon(check.status)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Providers & Models */}
      <Card>
        <CardHeader>
          <CardTitle>AI Providers & Models</CardTitle>
          <CardDescription>
            Enable providers, pick default models, and assign which provider powers each stage. You can add keys later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">API Key Status</p>
                <p className="text-sm text-muted-foreground">Real-time connection testing</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testProviders} 
                disabled={aiConfigLoading}
                className="relative"
              >
                {Object.keys(providerStatus).length > 0 && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                )}
                Test Connections
              </Button>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* OpenAI */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">OpenAI</span>
                    {providerStatus.openai !== undefined && (
                      <Badge 
                        variant="outline" 
                        className={`${providerStatus.openai ? 'border-green-500 text-green-600 bg-green-50' : 'border-red-500 text-red-600 bg-red-50'} transition-colors`}
                      >
                        {providerStatus.openai ? '✅ Connected' : '❌ Missing Key'}
                      </Badge>
                    )}
                  </div>
                <Switch
                  checked={!!aiProvidersConfig?.providers?.openai?.enabled}
                  onCheckedChange={async (val) => {
                    const next = {
                      ...aiProvidersConfig!,
                      providers: {
                        ...aiProvidersConfig!.providers,
                        openai: { ...aiProvidersConfig!.providers.openai, enabled: val }
                      }
                    } as any;
                    await saveAiProvidersConfig(next);
                    toast.success(`OpenAI ${val ? 'enabled' : 'disabled'}`);
                  }}
                />
              </div>
              <div>
                <Label>Model</Label>
                <Select
                  value={aiProvidersConfig?.providers?.openai?.model || 'gpt-5'}
                  onValueChange={async (value) => {
                    const next = {
                      ...aiProvidersConfig!,
                      providers: {
                        ...aiProvidersConfig!.providers,
                        openai: { ...aiProvidersConfig!.providers.openai, model: value }
                      }
                    } as any;
                    await saveAiProvidersConfig(next);
                    toast.success(`OpenAI model set to ${value}`);
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-5">GPT-5</SelectItem>
                    <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* xAI Grok */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">xAI (Grok)</span>
                     {providerStatus.xai !== undefined && (
                       <Badge 
                         variant="outline" 
                         className={`${providerStatus.xai ? 'border-green-500 text-green-600 bg-green-50' : 'border-red-500 text-red-600 bg-red-50'} transition-colors`}
                       >
                         {providerStatus.xai ? '✅ Connected' : '❌ Connection Failed'}
                       </Badge>
                     )}
                  </div>
                <Switch
                  checked={!!aiProvidersConfig?.providers?.xai?.enabled}
                  onCheckedChange={async (val) => {
                    const next = {
                      ...aiProvidersConfig!,
                      providers: {
                        ...aiProvidersConfig!.providers,
                        xai: { ...aiProvidersConfig!.providers.xai, enabled: val }
                      }
                    } as any;
                    await saveAiProvidersConfig(next);
                    toast.success(`xAI ${val ? 'enabled' : 'disabled'}`);
                  }}
                />
              </div>
              <div>
                <Label>Model</Label>
                <Select
                  value={aiProvidersConfig?.providers?.xai?.model || 'grok-beta'}
                  onValueChange={async (value) => {
                    const next = {
                      ...aiProvidersConfig!,
                      providers: {
                        ...aiProvidersConfig!.providers,
                        xai: { ...aiProvidersConfig!.providers.xai, model: value }
                      }
                    } as any;
                    await saveAiProvidersConfig(next);
                    toast.success(`xAI model set to ${value}`);
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grok-beta">grok-beta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* OpenRouter */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">OpenRouter</span>
                     {providerStatus.openrouter !== undefined && (
                       <Badge 
                         variant="outline" 
                         className={`${providerStatus.openrouter ? 'border-green-500 text-green-600 bg-green-50' : 'border-red-500 text-red-600 bg-red-50'} transition-colors`}
                       >
                         {providerStatus.openrouter ? '✅ Connected' : '❌ Missing Key'}
                       </Badge>
                     )}
                  </div>
                <Switch
                  checked={!!aiProvidersConfig?.providers?.openrouter?.enabled}
                  onCheckedChange={async (val) => {
                    const next = {
                      ...aiProvidersConfig!,
                      providers: {
                        ...aiProvidersConfig!.providers,
                        openrouter: { ...aiProvidersConfig!.providers.openrouter, enabled: val }
                      }
                    } as any;
                    await saveAiProvidersConfig(next);
                    toast.success(`OpenRouter ${val ? 'enabled' : 'disabled'}`);
                  }}
                />
              </div>
              <div>
                <Label>Model</Label>
                <Select
                  value={aiProvidersConfig?.providers?.openrouter?.model || 'google/gemma-2-9b-it:free'}
                  onValueChange={async (value) => {
                    const next = {
                      ...aiProvidersConfig!,
                      providers: {
                        ...aiProvidersConfig!.providers,
                        openrouter: { ...aiProvidersConfig!.providers.openrouter, model: value }
                      }
                    } as any;
                    await saveAiProvidersConfig(next);
                    toast.success(`OpenRouter model set to ${value}`);
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meta-llama/llama-3.1-8b-instruct:free">Llama 3.1 8B (Free)</SelectItem>
                    <SelectItem value="google/gemma-2-9b-it:free">Gemma 2 9B (Free)</SelectItem>
                    <SelectItem value="microsoft/phi-3-mini-128k-instruct:free">Phi-3 Mini (Free)</SelectItem>
                    <SelectItem value="qwen/qwen-2-7b-instruct:free">Qwen 2 7B (Free)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>


          {/* Stage Mapping */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['overview','text','image','finalize'] as const).map((stage) => (
              <div key={stage} className="space-y-2">
                <Label className="capitalize">{stage} Provider</Label>
                <Select
                  value={aiProvidersConfig?.stages?.[stage]?.provider || 'openai'}
                  onValueChange={async (value) => {
                    const next: any = {
                      ...aiProvidersConfig!,
                      stages: { ...aiProvidersConfig!.stages, [stage]: { provider: value } }
                    };
                    await saveAiProvidersConfig(next);
                    toast.success(`${stage} stage now uses ${value}`);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="xai">xAI (Grok)</SelectItem>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={async () => {
                try {
                  await saveAiProvidersConfig(aiProvidersConfig!);
                  toast.success('AI provider settings saved successfully');
                } catch (error) {
                  console.error('Error saving provider settings:', error);
                  toast.error('Failed to save provider settings');
                }
              }} 
              disabled={aiConfigLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {aiConfigLoading ? 'Saving...' : 'Save Provider Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Provider Diagnostics */}
      <AIProviderDiagnostics />

      {/* Cron API Settings */}
      <CronApiSettings />

    </div>
  );
}