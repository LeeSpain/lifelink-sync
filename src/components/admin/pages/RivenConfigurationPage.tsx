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
  Bot, 
  Settings, 
  Zap,
  Clock,
  DollarSign,
  Target,
  Save,
  RotateCcw,
  Brain,
  MessageSquare,
  Shield,
  Cpu,
  CheckCircle,
  AlertCircle,
  TestTube
} from 'lucide-react';

interface RivenSettings {
  id?: string;
  ai_model: string;
  temperature: number;
  max_tokens: number;
  brand_voice: string;
  content_guidelines: string;
  auto_approve_content: boolean;
  preferred_posting_times: string[];
  default_budget: number;
  campaign_approval_required: boolean;
  content_moderation_level: string;
  seo_optimization: boolean;
  platform_priorities: string[];
  response_tone: string;
  creativity_level: number;
  content_length_preference: string;
  hashtag_strategy: string;
  emoji_usage: string;
  cta_style: string;
  audience_targeting: string;
}

export default function RivenConfigurationPage() {
  const [settings, setSettings] = useState<RivenSettings>({
    ai_model: 'gpt-4.1-2025-04-14',
    temperature: 0.7,
    max_tokens: 2000,
    brand_voice: 'professional and caring',
    content_guidelines: '',
    auto_approve_content: false,
    preferred_posting_times: ['09:00', '12:00', '17:00'],
    default_budget: 1000,
    campaign_approval_required: true,
    content_moderation_level: 'moderate',
    seo_optimization: true,
    platform_priorities: ['Facebook', 'Instagram', 'LinkedIn'],
    response_tone: 'helpful',
    creativity_level: 0.7,
    content_length_preference: 'medium',
    hashtag_strategy: 'moderate',
    emoji_usage: 'minimal',
    cta_style: 'direct',
    audience_targeting: 'families'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [testingProvider, setTestingProvider] = useState(false);
  const { toast } = useToast();

  const availableModels = [
    { value: 'gpt-5-2025-08-07', label: 'GPT-5 (Latest)', description: 'Most advanced model' },
    { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1 (Recommended)', description: 'Reliable flagship model' },
    { value: 'gpt-5-mini-2025-08-07', label: 'GPT-5 Mini', description: 'Fast and efficient' },
    { value: 'o3-2025-04-16', label: 'O3 Reasoning', description: 'Advanced reasoning' }
  ];

  const contentModerationLevels = [
    { value: 'strict', label: 'Strict', description: 'High content filtering' },
    { value: 'moderate', label: 'Moderate', description: 'Balanced filtering' },
    { value: 'relaxed', label: 'Relaxed', description: 'Minimal filtering' }
  ];

  const contentLengthOptions = [
    { value: 'short', label: 'Short', description: 'Concise content' },
    { value: 'medium', label: 'Medium', description: 'Balanced length' },
    { value: 'long', label: 'Long', description: 'Detailed content' }
  ];

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'helpful', label: 'Helpful' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'caring', label: 'Caring' }
  ];

  const platforms = ['Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'TikTok', 'YouTube'];

  useEffect(() => {
    loadSettings();
    loadAiProviderConfig();
  }, []);

  const loadAiProviderConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', 'ai_providers_config')
        .maybeSingle();
      
      if (!error && data) {
        setAiConfig(data.value);
      }
    } catch (error) {
      console.error('Error loading AI provider config:', error);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('riven_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      if (data) {
        setSettings({
          ...settings,
          ...data,
          preferred_posting_times: Array.isArray(data.preferred_posting_times) 
            ? data.preferred_posting_times.map(t => String(t))
            : ['09:00', '12:00', '17:00'],
          platform_priorities: Array.isArray((data as any).platform_priorities)
            ? (data as any).platform_priorities.map((p: any) => String(p))
            : ['Facebook', 'Instagram', 'LinkedIn']
        });
      }
    } catch (error) {
      console.error('Error loading Riven settings:', error);
      toast({
        title: "Error",
        description: "Failed to load Riven configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Get current user for user_id requirement
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Only save the fields that exist in the riven_settings table
      const settingsToSave = {
        ai_model: settings.ai_model,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        brand_voice: settings.brand_voice,
        content_guidelines: settings.content_guidelines,
        auto_approve_content: settings.auto_approve_content,
        preferred_posting_times: JSON.stringify(settings.preferred_posting_times),
        default_budget: settings.default_budget,
        user_id: userData.user.id
      };

      const { data, error } = await supabase
        .from('riven_settings')
        .upsert(settingsToSave, { 
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      setSettings({ ...settings, id: data.id });

      toast({
        title: "Success",
        description: "Riven configuration saved successfully"
      });
    } catch (error) {
      console.error('Error saving Riven settings:', error);
      toast({
        title: "Error",
        description: "Failed to save Riven configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testProviderConnection = async () => {
    setTestingProvider(true);
    try {
      const { data, error } = await supabase.functions.invoke('riven-marketing-enhanced', {
        body: { 
          action: 'provider_status'
        }
      });

      if (error) throw error;

      toast({
        title: "Provider Test Results",
        description: data.success ? "All AI providers are working correctly!" : "Some AI providers may have issues. Check Edge Function logs.",
        variant: data.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Provider test failed:', error);
      toast({
        title: "Provider Test Failed",
        description: "Unable to test AI providers. Check your configuration.",
        variant: "destructive"
      });
    } finally {
      setTestingProvider(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      ai_model: 'gpt-4.1-2025-04-14',
      temperature: 0.7,
      max_tokens: 2000,
      brand_voice: 'professional and caring',
      content_guidelines: '',
      auto_approve_content: false,
      preferred_posting_times: ['09:00', '12:00', '17:00'],
      default_budget: 1000,
      campaign_approval_required: true,
      content_moderation_level: 'moderate',
      seo_optimization: true,
      platform_priorities: ['Facebook', 'Instagram', 'LinkedIn'],
      response_tone: 'helpful',
      creativity_level: 0.7,
      content_length_preference: 'medium',
      hashtag_strategy: 'moderate',
      emoji_usage: 'minimal',
      cta_style: 'direct',
      audience_targeting: 'families'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Riven Configuration</h1>
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🤖 Riven Configuration</h1>
          <p className="text-muted-foreground">Configure Riven's AI behavior, brand voice, and content generation preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={testProviderConnection} disabled={testingProvider}>
            <TestTube className="h-4 w-4 mr-2" />
            {testingProvider ? 'Testing...' : 'Test Providers'}
          </Button>
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {/* Active AI Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Active AI Provider Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Primary Content Generation</Label>
                <div className="flex items-center gap-2 mt-1">
                  {aiConfig?.stages?.text?.provider === 'xai' ? (
                    <>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Grok (xAI) Active
                      </Badge>
                      <span className="text-sm text-muted-foreground">Using {aiConfig?.providers?.xai?.model || 'grok-beta'}</span>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline">
                        <Bot className="h-3 w-3 mr-1" />
                        OpenAI Active
                      </Badge>
                      <span className="text-sm text-muted-foreground">Using {aiConfig?.providers?.openai?.model || 'gpt-4.1'}</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Command Analysis</Label>
                <div className="flex items-center gap-2 mt-1">
                  {aiConfig?.stages?.overview?.provider === 'xai' ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Grok (xAI)
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Bot className="h-3 w-3 mr-1" />
                      OpenAI
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Image Generation</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    <Bot className="h-3 w-3 mr-1" />
                    OpenAI DALL-E
                  </Badge>
                  <span className="text-sm text-muted-foreground">Image generation always uses OpenAI</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Final Review</Label>
                <div className="flex items-center gap-2 mt-1">
                  {aiConfig?.stages?.finalize?.provider === 'xai' ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Grok (xAI)
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Bot className="h-3 w-3 mr-1" />
                      OpenAI
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              To change AI providers, go to <strong>Admin → System Settings → AI Providers</strong>. 
              Current configuration shows {aiConfig?.stages?.text?.provider === 'xai' ? 'Grok is actively being used' : 'OpenAI is being used'} for content generation.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Model & Intelligence
            {aiConfig?.stages?.text?.provider === 'xai' && (
              <Badge variant="outline" className="ml-2">Grok Active - Limited Configuration</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Primary AI Model</Label>
                {aiConfig?.stages?.text?.provider === 'xai' ? (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Grok ({aiConfig?.providers?.xai?.model || 'grok-beta'})</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Grok model is configured in System Settings. This setting only applies when OpenAI is the active provider.
                    </p>
                  </div>
                ) : (
                  <Select value={settings.ai_model} onValueChange={(value) => setSettings({...settings, ai_model: value})}>
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
                )}
              </div>

              <div>
                <Label>Creativity Level: {settings.creativity_level}</Label>
                <Slider
                  value={[settings.creativity_level]}
                  onValueChange={([value]) => setSettings({...settings, creativity_level: value})}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">0 = Conservative, 1 = Highly Creative</p>
              </div>

              <div>
                <Label>Max Response Length</Label>
                <Input 
                  type="number" 
                  value={settings.max_tokens}
                  onChange={(e) => setSettings({...settings, max_tokens: parseInt(e.target.value)})}
                />
                <p className="text-xs text-muted-foreground">Maximum tokens per response</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Response Tone</Label>
                <Select value={settings.response_tone} onValueChange={(value) => setSettings({...settings, response_tone: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map(tone => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Content Length Preference</Label>
                <Select value={settings.content_length_preference} onValueChange={(value) => setSettings({...settings, content_length_preference: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentLengthOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Content Moderation Level</Label>
                <Select value={settings.content_moderation_level} onValueChange={(value) => setSettings({...settings, content_moderation_level: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentModerationLevels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-muted-foreground">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Voice & Content Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Brand Voice & Content Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Brand Voice Description</Label>
            <Input 
              value={settings.brand_voice}
              onChange={(e) => setSettings({...settings, brand_voice: e.target.value})}
              placeholder="e.g., professional and caring, friendly but authoritative"
            />
            <p className="text-xs text-muted-foreground">How should Riven communicate your brand's personality?</p>
          </div>

          <div>
            <Label>Content Guidelines</Label>
            <Textarea 
              value={settings.content_guidelines}
              onChange={(e) => setSettings({...settings, content_guidelines: e.target.value})}
              placeholder="Specific guidelines for content creation, topics to avoid, messaging priorities, etc."
              rows={6}
            />
            <p className="text-xs text-muted-foreground">Detailed instructions for Riven's content generation</p>
          </div>

          <div>
            <Label>Target Audience</Label>
            <Input 
              value={settings.audience_targeting}
              onChange={(e) => setSettings({...settings, audience_targeting: e.target.value})}
              placeholder="e.g., families, seniors, parents, safety-conscious individuals"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Content Strategy & Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <Label>Hashtag Strategy</Label>
              <Select value={settings.hashtag_strategy} onValueChange={(value) => setSettings({...settings, hashtag_strategy: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal (1-3 hashtags)</SelectItem>
                  <SelectItem value="moderate">Moderate (4-8 hashtags)</SelectItem>
                  <SelectItem value="aggressive">Aggressive (10+ hashtags)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Emoji Usage</Label>
              <Select value={settings.emoji_usage} onValueChange={(value) => setSettings({...settings, emoji_usage: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="frequent">Frequent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Call-to-Action Style</Label>
              <Select value={settings.cta_style} onValueChange={(value) => setSettings({...settings, cta_style: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="subtle">Subtle</SelectItem>
                  <SelectItem value="question">Question-based</SelectItem>
                  <SelectItem value="urgency">Urgency-driven</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Priorities & Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Platform Priorities & Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Platform Priorities (drag to reorder)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {platforms.map(platform => (
                <Badge 
                  key={platform}
                  variant={settings.platform_priorities.includes(platform) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const priorities = settings.platform_priorities.includes(platform)
                      ? settings.platform_priorities.filter(p => p !== platform)
                      : [...settings.platform_priorities, platform];
                    setSettings({...settings, platform_priorities: priorities});
                  }}
                >
                  {platform}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Preferred Posting Times</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {settings.preferred_posting_times.map((time, index) => (
                <Input
                  key={index}
                  type="time"
                  value={time}
                  onChange={(e) => {
                    const newTimes = [...settings.preferred_posting_times];
                    newTimes[index] = e.target.value;
                    setSettings({...settings, preferred_posting_times: newTimes});
                  }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation & Approval Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Automation & Approval Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-approve Content</Label>
                  <p className="text-xs text-muted-foreground">Automatically approve generated content</p>
                </div>
                <Switch 
                  checked={settings.auto_approve_content}
                  onCheckedChange={(checked) => setSettings({...settings, auto_approve_content: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Campaign Approval Required</Label>
                  <p className="text-xs text-muted-foreground">Require manual approval for campaigns</p>
                </div>
                <Switch 
                  checked={settings.campaign_approval_required}
                  onCheckedChange={(checked) => setSettings({...settings, campaign_approval_required: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>SEO Optimization</Label>
                  <p className="text-xs text-muted-foreground">Automatically optimize for search engines</p>
                </div>
                <Switch 
                  checked={settings.seo_optimization}
                  onCheckedChange={(checked) => setSettings({...settings, seo_optimization: checked})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Default Campaign Budget</Label>
                <Input 
                  type="number" 
                  value={settings.default_budget}
                  onChange={(e) => setSettings({...settings, default_budget: parseInt(e.target.value)})}
                />
                <p className="text-xs text-muted-foreground">Default budget for new campaigns (EUR)</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Riven Status</span>
                </div>
                <p className="text-sm text-blue-700">AI Model: {settings.ai_model}</p>
                <p className="text-sm text-blue-700">Status: Ready & Configured</p>
                <p className="text-sm text-blue-700">Brand Voice: {settings.brand_voice}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}