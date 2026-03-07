import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Brain, 
  Cpu, 
  Zap,
  Database,
  Activity,
  AlertCircle,
  CheckCircle,
  Save,
  RotateCcw,
  TrendingUp,
  Clock
} from 'lucide-react';

interface ModelConfiguration {
  model: string;
  temperature: number;
  max_tokens: number;
  frequency_penalty: number;
  presence_penalty: number;
}

interface ResponseSettings {
  response_delay: number;
  enable_logging: boolean;
  auto_learn: boolean;
}

interface PerformanceLimits {
  daily_request_limit: number;
  rate_limit_per_minute: number;
  context_window: number;
}

interface SystemPromptTemplates {
  default: string;
  technical: string;
  sales: string;
}

export default function AIModelSettingsPage() {
  const [modelConfig, setModelConfig] = useState<ModelConfiguration>({
    model: 'gpt-4.1-2025-04-14',
    temperature: 0.7,
    max_tokens: 500,
    frequency_penalty: 0,
    presence_penalty: 0
  });

  const [responseSettings, setResponseSettings] = useState<ResponseSettings>({
    response_delay: 0.5,
    enable_logging: true,
    auto_learn: false
  });

  const [performanceLimits, setPerformanceLimits] = useState<PerformanceLimits>({
    daily_request_limit: 10000,
    rate_limit_per_minute: 60,
    context_window: 4096
  });

  const [promptTemplates, setPromptTemplates] = useState<SystemPromptTemplates>({
    default: '',
    technical: '',
    sales: ''
  });

  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  const availableModels = [
    { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1 (Recommended)', description: 'Latest flagship model' },
    { value: 'o3-2025-04-16', label: 'O3 Reasoning', description: 'Advanced reasoning model' },
    { value: 'o4-mini-2025-04-16', label: 'O4 Mini', description: 'Fast reasoning model' },
    { value: 'gpt-4.1-mini-2025-04-14', label: 'GPT-4.1 Mini', description: 'Efficient model with vision' }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const { data: settings, error } = await supabase
        .from('ai_model_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Parse settings data
      settings?.forEach(setting => {
        switch (setting.setting_key) {
          case 'model_configuration':
            setModelConfig(setting.setting_value as unknown as ModelConfiguration);
            break;
          case 'response_settings':
            setResponseSettings(setting.setting_value as unknown as ResponseSettings);
            break;
          case 'performance_limits':
            setPerformanceLimits(setting.setting_value as unknown as PerformanceLimits);
            break;
          case 'system_prompt_templates':
            setPromptTemplates(setting.setting_value as unknown as SystemPromptTemplates);
            break;
        }
      });

    } catch (error) {
      console.error('Error loading AI settings:', error);
      toast({
        title: "Error",
        description: "Failed to load AI settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const updates = [
        {
          setting_key: 'model_configuration',
          setting_value: JSON.parse(JSON.stringify(modelConfig)),
          description: 'Core AI model configuration'
        },
        {
          setting_key: 'response_settings',
          setting_value: JSON.parse(JSON.stringify(responseSettings)),
          description: 'Response behavior settings'
        },
        {
          setting_key: 'performance_limits',
          setting_value: JSON.parse(JSON.stringify(performanceLimits)),
          description: 'Performance and rate limiting'
        },
        {
          setting_key: 'system_prompt_templates',
          setting_value: JSON.parse(JSON.stringify(promptTemplates)),
          description: 'System prompt templates'
        }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('ai_model_settings')
          .upsert(update, { onConflict: 'setting_key' });
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "AI model settings saved successfully"
      });

    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({
        title: "Error",
        description: "Failed to save AI settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setModelConfig({
      model: 'gpt-4.1-2025-04-14',
      temperature: 0.7,
      max_tokens: 500,
      frequency_penalty: 0,
      presence_penalty: 0
    });
    setResponseSettings({
      response_delay: 0.5,
      enable_logging: true,
      auto_learn: false
    });
    setPerformanceLimits({
      daily_request_limit: 10000,
      rate_limit_per_minute: 60,
      context_window: 4096
    });
  };

  const testModelConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: 'Test connection with current model settings',
          sessionId: 'admin-model-test-' + Date.now(),
          userId: null
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Model connection test successful"
      });

      console.log('Model test response:', data);
    } catch (error) {
      console.error('Model test error:', error);
      toast({
        title: "Error",
        description: "Model connection test failed",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Model Settings</h1>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">⚙️ AI Model Settings</h1>
          <p className="text-muted-foreground">Configure advanced AI model parameters and behavior</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={testModelConnection}>
            <Zap className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Model Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>AI Model</Label>
                <Select value={modelConfig.model} onValueChange={(value) => setModelConfig(prev => ({...prev, model: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        <div>
                          <div className="font-medium">{model.label}</div>
                          <div className="text-xs text-muted-foreground">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Temperature: {modelConfig.temperature}</Label>
                <Slider
                  value={[modelConfig.temperature]}
                  onValueChange={([value]) => setModelConfig(prev => ({...prev, temperature: value}))}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Controls randomness (0 = deterministic, 1 = creative)</p>
              </div>

              <div>
                <Label>Max Tokens</Label>
                <Input 
                  type="number" 
                  value={modelConfig.max_tokens}
                  onChange={(e) => setModelConfig(prev => ({...prev, max_tokens: parseInt(e.target.value)}))}
                />
                <p className="text-xs text-muted-foreground">Maximum response length</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Frequency Penalty: {modelConfig.frequency_penalty}</Label>
                <Slider
                  value={[modelConfig.frequency_penalty]}
                  onValueChange={([value]) => setModelConfig(prev => ({...prev, frequency_penalty: value}))}
                  max={2}
                  min={-2}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Reduces repetition of words</p>
              </div>

              <div>
                <Label>Presence Penalty: {modelConfig.presence_penalty}</Label>
                <Slider
                  value={[modelConfig.presence_penalty]}
                  onValueChange={([value]) => setModelConfig(prev => ({...prev, presence_penalty: value}))}
                  max={2}
                  min={-2}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Encourages topic diversity</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Current Model Status</span>
                </div>
                <p className="text-sm text-blue-700">Model: {modelConfig.model}</p>
                <p className="text-sm text-blue-700">Status: Active & Responding</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Response Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <Label>Response Delay (seconds)</Label>
              <Input 
                type="number" 
                step="0.1"
                value={responseSettings.response_delay}
                onChange={(e) => setResponseSettings(prev => ({...prev, response_delay: parseFloat(e.target.value)}))}
              />
              <p className="text-xs text-muted-foreground">Delay before sending response</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Conversation Logging</Label>
                <p className="text-xs text-muted-foreground">Store conversations for analysis</p>
              </div>
              <Switch 
                checked={responseSettings.enable_logging}
                onCheckedChange={(checked) => setResponseSettings(prev => ({...prev, enable_logging: checked}))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Learning</Label>
                <p className="text-xs text-muted-foreground">Learn from interactions</p>
              </div>
              <Switch 
                checked={responseSettings.auto_learn}
                onCheckedChange={(checked) => setResponseSettings(prev => ({...prev, auto_learn: checked}))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance & Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <Label>Daily Request Limit</Label>
              <Input 
                type="number" 
                value={performanceLimits.daily_request_limit}
                onChange={(e) => setPerformanceLimits(prev => ({...prev, daily_request_limit: parseInt(e.target.value)}))}
              />
              <p className="text-xs text-muted-foreground">Maximum requests per day</p>
            </div>

            <div>
              <Label>Rate Limit (per minute)</Label>
              <Input 
                type="number" 
                value={performanceLimits.rate_limit_per_minute}
                onChange={(e) => setPerformanceLimits(prev => ({...prev, rate_limit_per_minute: parseInt(e.target.value)}))}
              />
              <p className="text-xs text-muted-foreground">Requests per minute</p>
            </div>

            <div>
              <Label>Context Window</Label>
              <Input 
                type="number" 
                value={performanceLimits.context_window}
                onChange={(e) => setPerformanceLimits(prev => ({...prev, context_window: parseInt(e.target.value)}))}
              />
              <p className="text-xs text-muted-foreground">Token context limit</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Prompt Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Assistant</SelectItem>
                <SelectItem value="technical">Technical Support</SelectItem>
                <SelectItem value="sales">Sales Assistant</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="self-center">
              {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Template
            </Badge>
          </div>

          <div>
            <Label>System Prompt</Label>
            <Textarea 
              value={promptTemplates[selectedTemplate as keyof SystemPromptTemplates] || ''}
              onChange={(e) => setPromptTemplates(prev => ({
                ...prev,
                [selectedTemplate]: e.target.value
              }))}
              rows={8}
              placeholder="Enter the system prompt that defines the AI's behavior and knowledge..."
            />
            <p className="text-xs text-muted-foreground mt-2">
              This prompt defines how the AI behaves for {selectedTemplate} interactions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-lg bg-green-50 border border-green-200">
              <Cpu className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900 mb-1">Model Efficiency</h3>
              <p className="text-2xl font-bold text-green-900">94%</p>
              <p className="text-xs text-green-700">Average performance</p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-blue-50 border border-blue-200">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900 mb-1">Response Time</h3>
              <p className="text-2xl font-bold text-blue-900">1.2s</p>
              <p className="text-xs text-blue-700">Average latency</p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-purple-50 border border-purple-200">
              <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900 mb-1">Daily Usage</h3>
              <p className="text-2xl font-bold text-purple-900">847</p>
              <p className="text-xs text-purple-700">Requests today</p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-orange-50 border border-orange-200">
              <CheckCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-900 mb-1">Success Rate</h3>
              <p className="text-2xl font-bold text-orange-900">99.7%</p>
              <p className="text-xs text-orange-700">Successful responses</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}