import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  MessageSquare,
  Activity,
  Settings,
  Save,
  Trash2,
  Edit3,
  RotateCcw,
  Plus,
  Brain,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Sparkles,
  Eye,
  EyeOff,
  Shield,
  Globe,
  DollarSign,
  BookOpen,
  Zap,
  AlertTriangle,
  RefreshCw,
  TestTube
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TrainingManager from '@/components/admin/TrainingManager';

// ============================================================
// Types
// ============================================================

interface AISettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  systemPromptMode: string;
  responseStyle: string;
  contextWindow: number;
  memoryEnabled: boolean;
  learningMode: boolean;
  frequencyPenalty: number;
  presencePenalty: number;
  responseDelay: number;
  rateLimitPerMinute: number;
  dailyRequestLimit: number;
  enableLogging: boolean;
}

interface KnowledgeSection {
  id: string;
  language: string;
  section: string;
  content: string;
  sort_order: number;
  is_active: boolean;
}

interface VisibilityRule {
  id: string;
  route_pattern: string;
  is_visible: boolean;
  description: string;
}

interface RestrictedPattern {
  id: string;
  pattern: string;
  replacement_message: string;
  is_active: boolean;
}

interface CurrencyConfig {
  id: string;
  currency_code: string;
  rate_to_eur: number;
  is_active: boolean;
}

interface ClaraMetrics {
  totalConversations: number;
  totalSessions: number;
  activeSessions: number;
  totalLeads: number;
  avgMessagesPerSession: number;
}

// ============================================================
// Component
// ============================================================

const AIAgentPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Model Settings state
  const [aiSettings, setAiSettings] = useState<AISettings>({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 500,
    systemPrompt: '',
    systemPromptMode: 'append',
    responseStyle: 'helpful',
    contextWindow: 4000,
    memoryEnabled: true,
    learningMode: true,
    frequencyPenalty: 0,
    presencePenalty: 0,
    responseDelay: 0.5,
    rateLimitPerMinute: 60,
    dailyRequestLimit: 10000,
    enableLogging: true,
  });

  // Real metrics state
  const [metrics, setMetrics] = useState<ClaraMetrics>({
    totalConversations: 0,
    totalSessions: 0,
    activeSessions: 0,
    totalLeads: 0,
    avgMessagesPerSession: 0,
  });

  // Knowledge base state
  const [knowledgeSections, setKnowledgeSections] = useState<KnowledgeSection[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Visibility & Restrictions state
  const [visibilityRules, setVisibilityRules] = useState<VisibilityRule[]>([]);
  const [restrictedPatterns, setRestrictedPatterns] = useState<RestrictedPattern[]>([]);
  const [testPatternInput, setTestPatternInput] = useState('');
  const [testPatternResult, setTestPatternResult] = useState<string | null>(null);

  // Currency state
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>([]);

  // Performance state
  const [dailyStats, setDailyStats] = useState<Array<{ date: string; count: number }>>([]);
  const [topTrainingItems, setTopTrainingItems] = useState<Array<{ question: string; usage_count: number }>>([]);

  // ============================================================
  // Data Loading
  // ============================================================

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      loadAISettings(),
      loadMetrics(),
      loadKnowledgeBase(),
      loadVisibilityRules(),
      loadRestrictedPatterns(),
      loadCurrencies(),
      loadPerformanceData(),
    ]);
    setLoading(false);
  };

  const loadAISettings = async () => {
    try {
      const { data, error } = await supabase.from('ai_model_settings').select('*');
      if (error) throw error;

      if (data?.length > 0) {
        const settings = data.reduce((acc: Record<string, any>, setting: any) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {});

        setAiSettings({
          model: settings.model || 'gpt-4o-mini',
          temperature: Number(settings.temperature) || 0.7,
          maxTokens: Number(settings.max_tokens) || 500,
          systemPrompt: settings.system_prompt || '',
          systemPromptMode: settings.system_prompt_mode || 'append',
          responseStyle: settings.response_style || 'helpful',
          contextWindow: Number(settings.context_window) || 4000,
          memoryEnabled: settings.memory_enabled !== 'false',
          learningMode: settings.learning_mode !== 'false',
          frequencyPenalty: Number(settings.frequency_penalty) || 0,
          presencePenalty: Number(settings.presence_penalty) || 0,
          responseDelay: Number(settings.response_delay) || 0.5,
          rateLimitPerMinute: Number(settings.rate_limit_per_minute) || 60,
          dailyRequestLimit: Number(settings.daily_request_limit) || 10000,
          enableLogging: settings.enable_logging !== 'false',
        });
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      // Total conversations (messages)
      const { count: totalConversations } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true });

      // Total unique sessions
      const { data: sessionData } = await supabase
        .from('conversations')
        .select('session_id');
      const uniqueSessions = new Set(sessionData?.map(r => r.session_id) || []);

      // Active sessions (last hour)
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      const { data: activeData } = await supabase
        .from('conversations')
        .select('session_id')
        .gte('created_at', oneHourAgo);
      const activeSessions = new Set(activeData?.map(r => r.session_id) || []);

      // Total leads
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true });

      const total = totalConversations || 0;
      const sessions = uniqueSessions.size;

      setMetrics({
        totalConversations: total,
        totalSessions: sessions,
        activeSessions: activeSessions.size,
        totalLeads: totalLeads || 0,
        avgMessagesPerSession: sessions > 0 ? Math.round((total / sessions) * 10) / 10 : 0,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const loadKnowledgeBase = async () => {
    try {
      const { data, error } = await supabase
        .from('clara_knowledge_base')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data) setKnowledgeSections(data);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  };

  const loadVisibilityRules = async () => {
    try {
      const { data, error } = await supabase
        .from('clara_visibility_rules')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) setVisibilityRules(data);
    } catch (error) {
      console.error('Error loading visibility rules:', error);
    }
  };

  const loadRestrictedPatterns = async () => {
    try {
      const { data, error } = await supabase
        .from('clara_restricted_patterns')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) setRestrictedPatterns(data);
    } catch (error) {
      console.error('Error loading restricted patterns:', error);
    }
  };

  const loadCurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from('clara_currency_config')
        .select('*')
        .order('currency_code', { ascending: true });
      if (!error && data) setCurrencies(data);
    } catch (error) {
      console.error('Error loading currencies:', error);
    }
  };

  const loadPerformanceData = async () => {
    try {
      // Get conversations per day for last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: convData } = await supabase
        .from('conversations')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo)
        .eq('message_type', 'user');

      if (convData) {
        const dayCounts: Record<string, number> = {};
        convData.forEach(row => {
          const day = row.created_at.slice(0, 10);
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
        setDailyStats(
          Object.entries(dayCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, count]) => ({ date, count }))
        );
      }

      // Top training items by usage
      const { data: trainingData } = await supabase
        .from('training_data')
        .select('question, usage_count')
        .order('usage_count', { ascending: false })
        .limit(10);
      if (trainingData) setTopTrainingItems(trainingData);
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  // ============================================================
  // Save Handlers
  // ============================================================

  const saveAISettings = async () => {
    try {
      setSaving(true);
      const settingsToSave = [
        { setting_key: 'model', setting_value: aiSettings.model },
        { setting_key: 'temperature', setting_value: String(aiSettings.temperature) },
        { setting_key: 'max_tokens', setting_value: String(aiSettings.maxTokens) },
        { setting_key: 'system_prompt', setting_value: aiSettings.systemPrompt },
        { setting_key: 'system_prompt_mode', setting_value: aiSettings.systemPromptMode },
        { setting_key: 'response_style', setting_value: aiSettings.responseStyle },
        { setting_key: 'context_window', setting_value: String(aiSettings.contextWindow) },
        { setting_key: 'memory_enabled', setting_value: String(aiSettings.memoryEnabled) },
        { setting_key: 'learning_mode', setting_value: String(aiSettings.learningMode) },
        { setting_key: 'frequency_penalty', setting_value: String(aiSettings.frequencyPenalty) },
        { setting_key: 'presence_penalty', setting_value: String(aiSettings.presencePenalty) },
        { setting_key: 'response_delay', setting_value: String(aiSettings.responseDelay) },
        { setting_key: 'rate_limit_per_minute', setting_value: String(aiSettings.rateLimitPerMinute) },
        { setting_key: 'daily_request_limit', setting_value: String(aiSettings.dailyRequestLimit) },
        { setting_key: 'enable_logging', setting_value: String(aiSettings.enableLogging) },
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase.from('ai_model_settings').upsert(setting, { onConflict: 'setting_key' });
        if (error) throw error;
      }

      toast({ title: 'Settings Saved', description: 'Clara\'s AI settings updated successfully.' });
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({ title: 'Error', description: 'Failed to save AI settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetSettingsToDefaults = () => {
    setAiSettings({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 500,
      systemPrompt: '',
      systemPromptMode: 'append',
      responseStyle: 'helpful',
      contextWindow: 4000,
      memoryEnabled: true,
      learningMode: true,
      frequencyPenalty: 0,
      presencePenalty: 0,
      responseDelay: 0.5,
      rateLimitPerMinute: 60,
      dailyRequestLimit: 10000,
      enableLogging: true,
    });
    toast({ title: 'Reset', description: 'Settings reset to defaults. Click Save to apply.' });
  };

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: 'Hello, this is a test message from admin.',
          sessionId: 'admin-test-' + Date.now(),
        }
      });
      if (error) throw error;
      toast({ title: 'Connection OK', description: `Clara responded: "${(data?.response || '').slice(0, 100)}..."` });
    } catch (error) {
      toast({ title: 'Connection Failed', description: 'Could not reach Clara. Check edge function deployment.', variant: 'destructive' });
    }
  };

  // ============================================================
  // Knowledge Base Handlers
  // ============================================================

  const filteredKB = knowledgeSections.filter(s => s.language === selectedLanguage);
  const availableLanguages = [...new Set(knowledgeSections.map(s => s.language))];

  const updateKBSection = async (id: string, updates: Partial<KnowledgeSection>) => {
    const { error } = await supabase
      .from('clara_knowledge_base')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update section.', variant: 'destructive' });
    } else {
      setKnowledgeSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      toast({ title: 'Updated', description: 'Knowledge base section saved.' });
    }
  };

  const addKBSection = async () => {
    const maxOrder = filteredKB.reduce((max, s) => Math.max(max, s.sort_order), -1);
    const { data, error } = await supabase
      .from('clara_knowledge_base')
      .insert({
        language: selectedLanguage,
        section: 'custom',
        content: 'New section content...',
        sort_order: maxOrder + 1,
        is_active: true,
      })
      .select()
      .single();
    if (!error && data) {
      setKnowledgeSections(prev => [...prev, data]);
      toast({ title: 'Added', description: 'New knowledge section created.' });
    }
  };

  const deleteKBSection = async (id: string) => {
    const { error } = await supabase.from('clara_knowledge_base').delete().eq('id', id);
    if (!error) {
      setKnowledgeSections(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Deleted', description: 'Knowledge section removed.' });
    }
  };

  // ============================================================
  // Visibility Rules Handlers
  // ============================================================

  const addVisibilityRule = async () => {
    const { data, error } = await supabase
      .from('clara_visibility_rules')
      .insert({ route_pattern: '/new-route', is_visible: false, description: '' })
      .select()
      .single();
    if (!error && data) {
      setVisibilityRules(prev => [...prev, data]);
    }
  };

  const updateVisibilityRule = async (id: string, updates: Partial<VisibilityRule>) => {
    const { error } = await supabase
      .from('clara_visibility_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setVisibilityRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    }
  };

  const deleteVisibilityRule = async (id: string) => {
    const { error } = await supabase.from('clara_visibility_rules').delete().eq('id', id);
    if (!error) {
      setVisibilityRules(prev => prev.filter(r => r.id !== id));
    }
  };

  // ============================================================
  // Restricted Patterns Handlers
  // ============================================================

  const addRestrictedPattern = async () => {
    const { data, error } = await supabase
      .from('clara_restricted_patterns')
      .insert({ pattern: 'new_pattern', is_active: true })
      .select()
      .single();
    if (!error && data) {
      setRestrictedPatterns(prev => [...prev, data]);
    }
  };

  const updateRestrictedPattern = async (id: string, updates: Partial<RestrictedPattern>) => {
    const { error } = await supabase
      .from('clara_restricted_patterns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setRestrictedPatterns(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  };

  const deleteRestrictedPattern = async (id: string) => {
    const { error } = await supabase.from('clara_restricted_patterns').delete().eq('id', id);
    if (!error) {
      setRestrictedPatterns(prev => prev.filter(p => p.id !== id));
    }
  };

  const testPattern = () => {
    if (!testPatternInput.trim()) return;
    const matched = restrictedPatterns
      .filter(p => p.is_active)
      .find(p => {
        try {
          return new RegExp(p.pattern, 'i').test(testPatternInput);
        } catch { return false; }
      });
    setTestPatternResult(
      matched
        ? `BLOCKED by pattern "${matched.pattern}"`
        : 'PASSED - No patterns matched'
    );
  };

  // ============================================================
  // Currency Handlers
  // ============================================================

  const addCurrency = async () => {
    const { data, error } = await supabase
      .from('clara_currency_config')
      .insert({ currency_code: 'NEW', rate_to_eur: 1, is_active: true })
      .select()
      .single();
    if (!error && data) {
      setCurrencies(prev => [...prev, data]);
    }
  };

  const updateCurrency = async (id: string, updates: Partial<CurrencyConfig>) => {
    const { error } = await supabase
      .from('clara_currency_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setCurrencies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }
  };

  const deleteCurrency = async (id: string) => {
    const { error } = await supabase.from('clara_currency_config').delete().eq('id', id);
    if (!error) {
      setCurrencies(prev => prev.filter(c => c.id !== id));
    }
  };

  // ============================================================
  // Render
  // ============================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary animate-pulse" />
          <h1 className="text-2xl font-bold">Loading Clara AI Agent...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clara AI Agent</h1>
            <p className="text-muted-foreground">Complete AI assistant management - settings, knowledge, visibility, and performance</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadAllData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={testConnection}>
            <TestTube className="h-4 w-4 mr-2" />
            Test Clara
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Model: {aiSettings.model}</Badge>
        <Badge variant={aiSettings.enableLogging ? 'default' : 'secondary'}>
          Logging: {aiSettings.enableLogging ? 'ON' : 'OFF'}
        </Badge>
        <Badge variant="outline">Temp: {aiSettings.temperature}</Badge>
        <Badge variant="outline">Rate: {aiSettings.rateLimitPerMinute}/min</Badge>
        <Badge variant="outline">Prompt Mode: {aiSettings.systemPromptMode}</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Model</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="visibility">Visibility</TabsTrigger>
          <TabsTrigger value="currency">Currency</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* TAB 1: Overview - Real Metrics */}
        {/* ============================================================ */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                    <p className="text-2xl font-bold">{metrics.totalConversations.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                    <p className="text-2xl font-bold">{metrics.totalSessions.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                    <p className="text-2xl font-bold">{metrics.activeSessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Leads Generated</p>
                    <p className="text-2xl font-bold">{metrics.totalLeads.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Avg Msgs/Session</p>
                    <p className="text-2xl font-bold">{metrics.avgMessagesPerSession}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Config Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Current Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground">Model:</span> <span className="font-medium">{aiSettings.model}</span></div>
                <div><span className="text-muted-foreground">Temperature:</span> <span className="font-medium">{aiSettings.temperature}</span></div>
                <div><span className="text-muted-foreground">Max Tokens:</span> <span className="font-medium">{aiSettings.maxTokens}</span></div>
                <div><span className="text-muted-foreground">Prompt Mode:</span> <span className="font-medium">{aiSettings.systemPromptMode}</span></div>
                <div><span className="text-muted-foreground">Freq Penalty:</span> <span className="font-medium">{aiSettings.frequencyPenalty}</span></div>
                <div><span className="text-muted-foreground">Pres Penalty:</span> <span className="font-medium">{aiSettings.presencePenalty}</span></div>
                <div><span className="text-muted-foreground">Rate Limit:</span> <span className="font-medium">{aiSettings.rateLimitPerMinute}/min</span></div>
                <div><span className="text-muted-foreground">Daily Limit:</span> <span className="font-medium">{aiSettings.dailyRequestLimit.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Logging:</span> <span className="font-medium">{aiSettings.enableLogging ? 'Enabled' : 'Disabled'}</span></div>
                <div><span className="text-muted-foreground">Languages:</span> <span className="font-medium">{availableLanguages.join(', ').toUpperCase()}</span></div>
                <div><span className="text-muted-foreground">Visibility Rules:</span> <span className="font-medium">{visibilityRules.length}</span></div>
                <div><span className="text-muted-foreground">Restricted Patterns:</span> <span className="font-medium">{restrictedPatterns.filter(p => p.is_active).length}</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 2: Model Settings - All Parameters */}
        {/* ============================================================ */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Model Configuration
              </CardTitle>
              <CardDescription>All settings are saved as flat keys and wired directly to the backend edge function.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <Label>AI Model</Label>
                    <Select value={aiSettings.model} onValueChange={(value) => setAiSettings(s => ({...s, model: value}))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1</SelectItem>
                        <SelectItem value="gpt-4.1-mini-2025-04-14">GPT-4.1 Mini</SelectItem>
                        <SelectItem value="o3-2025-04-16">O3 Reasoning</SelectItem>
                        <SelectItem value="o4-mini-2025-04-16">O4 Mini</SelectItem>
                        <SelectItem value="gpt-5">GPT-5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Temperature: {aiSettings.temperature}</Label>
                    <Slider
                      value={[aiSettings.temperature]}
                      onValueChange={([value]) => setAiSettings(s => ({...s, temperature: value}))}
                      min={0} max={1} step={0.1}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground">0 = deterministic, 1 = creative</p>
                  </div>

                  <div>
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      value={aiSettings.maxTokens}
                      onChange={(e) => setAiSettings(s => ({...s, maxTokens: parseInt(e.target.value) || 500}))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground">Maximum response length</p>
                  </div>

                  <div>
                    <Label>Context Window</Label>
                    <Input
                      type="number"
                      value={aiSettings.contextWindow}
                      onChange={(e) => setAiSettings(s => ({...s, contextWindow: parseInt(e.target.value) || 4000}))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground">Token context limit</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <Label>Frequency Penalty: {aiSettings.frequencyPenalty}</Label>
                    <Slider
                      value={[aiSettings.frequencyPenalty]}
                      onValueChange={([value]) => setAiSettings(s => ({...s, frequencyPenalty: value}))}
                      min={-2} max={2} step={0.1}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground">Reduces word repetition</p>
                  </div>

                  <div>
                    <Label>Presence Penalty: {aiSettings.presencePenalty}</Label>
                    <Slider
                      value={[aiSettings.presencePenalty]}
                      onValueChange={([value]) => setAiSettings(s => ({...s, presencePenalty: value}))}
                      min={-2} max={2} step={0.1}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground">Encourages topic diversity</p>
                  </div>

                  <div>
                    <Label>Response Delay (seconds)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={aiSettings.responseDelay}
                      onChange={(e) => setAiSettings(s => ({...s, responseDelay: parseFloat(e.target.value) || 0}))}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Rate Limit / min</Label>
                      <Input
                        type="number"
                        value={aiSettings.rateLimitPerMinute}
                        onChange={(e) => setAiSettings(s => ({...s, rateLimitPerMinute: parseInt(e.target.value) || 60}))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Daily Limit</Label>
                      <Input
                        type="number"
                        value={aiSettings.dailyRequestLimit}
                        onChange={(e) => setAiSettings(s => ({...s, dailyRequestLimit: parseInt(e.target.value) || 10000}))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggles Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Conversation Logging</Label>
                    <p className="text-xs text-muted-foreground">Store all conversations</p>
                  </div>
                  <Switch
                    checked={aiSettings.enableLogging}
                    onCheckedChange={(checked) => setAiSettings(s => ({...s, enableLogging: checked}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Memory</Label>
                    <p className="text-xs text-muted-foreground">Remember conversation context</p>
                  </div>
                  <Switch
                    checked={aiSettings.memoryEnabled}
                    onCheckedChange={(checked) => setAiSettings(s => ({...s, memoryEnabled: checked}))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Learning Mode</Label>
                    <p className="text-xs text-muted-foreground">Learn from interactions</p>
                  </div>
                  <Switch
                    checked={aiSettings.learningMode}
                    onCheckedChange={(checked) => setAiSettings(s => ({...s, learningMode: checked}))}
                  />
                </div>
              </div>

              {/* System Prompt */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <Label>Custom System Prompt</Label>
                  <Select value={aiSettings.systemPromptMode} onValueChange={(value) => setAiSettings(s => ({...s, systemPromptMode: value}))}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="append">Append Mode</SelectItem>
                      <SelectItem value="override">Override Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {aiSettings.systemPromptMode === 'override' && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">Override mode replaces the entire knowledge base including guardrails!</span>
                  </div>
                )}
                <Textarea
                  value={aiSettings.systemPrompt}
                  onChange={(e) => setAiSettings(s => ({...s, systemPrompt: e.target.value}))}
                  rows={6}
                  placeholder="Additional instructions for Clara (leave empty to use knowledge base only)..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {aiSettings.systemPromptMode === 'append'
                    ? 'This text is appended after the knowledge base. Guardrails are always preserved.'
                    : 'This text completely replaces the knowledge base. Use with caution!'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={saveAISettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save All Settings'}
                </Button>
                <Button variant="outline" onClick={resetSettingsToDefaults}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button variant="outline" onClick={testConnection}>
                  <Zap className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 3: Training Data */}
        {/* ============================================================ */}
        <TabsContent value="training" className="space-y-4">
          <TrainingManager compact />
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 4: Knowledge Base (NEW) */}
        {/* ============================================================ */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Clara's Knowledge Base
                  </CardTitle>
                  <CardDescription>Edit what Clara knows per language. Uses {'{currency}'}, {'{memberPrice}'}, {'{familyPrice}'} placeholders for dynamic pricing.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map(lang => (
                        <SelectItem key={lang} value={lang}>{lang.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={addKBSection}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Section
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-4">
                  {filteredKB.map((section) => (
                    <div key={section.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={section.is_active ? 'default' : 'secondary'}>
                            {section.section}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Order: {section.sort_order}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={section.is_active}
                            onCheckedChange={(checked) => updateKBSection(section.id, { is_active: checked })}
                          />
                          <Input
                            type="number"
                            value={section.sort_order}
                            onChange={(e) => updateKBSection(section.id, { sort_order: parseInt(e.target.value) || 0 })}
                            className="w-16 h-8 text-xs"
                          />
                          <Button variant="ghost" size="sm" onClick={() => deleteKBSection(section.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={section.content}
                        onChange={(e) => {
                          // Update local state immediately
                          setKnowledgeSections(prev =>
                            prev.map(s => s.id === section.id ? { ...s, content: e.target.value } : s)
                          );
                        }}
                        onBlur={(e) => {
                          // Save to DB on blur
                          updateKBSection(section.id, { content: e.target.value });
                        }}
                        rows={4}
                        className="font-mono text-sm"
                      />
                    </div>
                  ))}
                  {filteredKB.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No knowledge sections for {selectedLanguage.toUpperCase()}. Click "Add Section" to create one.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 5: Visibility & Restrictions (NEW) */}
        {/* ============================================================ */}
        <TabsContent value="visibility" className="space-y-4">
          {/* Visibility Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Visibility Rules
                  </CardTitle>
                  <CardDescription>Control which routes Clara appears on. Routes not listed default to visible.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addVisibilityRule}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {visibilityRules.map(rule => (
                  <div key={rule.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 min-w-[60px]">
                      {rule.is_visible ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-red-500" />
                      )}
                      <Switch
                        checked={rule.is_visible}
                        onCheckedChange={(checked) => updateVisibilityRule(rule.id, { is_visible: checked })}
                      />
                    </div>
                    <Input
                      value={rule.route_pattern}
                      onChange={(e) => updateVisibilityRule(rule.id, { route_pattern: e.target.value })}
                      className="flex-1 font-mono text-sm"
                      placeholder="/route-path"
                    />
                    <Input
                      value={rule.description || ''}
                      onChange={(e) => updateVisibilityRule(rule.id, { description: e.target.value })}
                      className="flex-1 text-sm"
                      placeholder="Description..."
                    />
                    <Button variant="ghost" size="sm" onClick={() => deleteVisibilityRule(rule.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {visibilityRules.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">No visibility rules. Clara is visible everywhere by default.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Restricted Patterns */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Restricted Response Patterns
                  </CardTitle>
                  <CardDescription>Regex patterns that trigger Clara's safety filter. If a response matches, it's replaced with the safety message.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addRestrictedPattern}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Pattern
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {restrictedPatterns.map(pattern => (
                  <div key={pattern.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Switch
                      checked={pattern.is_active}
                      onCheckedChange={(checked) => updateRestrictedPattern(pattern.id, { is_active: checked })}
                    />
                    <Input
                      value={pattern.pattern}
                      onChange={(e) => updateRestrictedPattern(pattern.id, { pattern: e.target.value })}
                      className="w-48 font-mono text-sm"
                      placeholder="regex pattern"
                    />
                    <Input
                      value={pattern.replacement_message || ''}
                      onChange={(e) => updateRestrictedPattern(pattern.id, { replacement_message: e.target.value })}
                      className="flex-1 text-sm"
                      placeholder="Custom replacement message (leave empty for default)"
                    />
                    <Button variant="ghost" size="sm" onClick={() => deleteRestrictedPattern(pattern.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Pattern Tester */}
              <div className="pt-4 border-t">
                <Label className="mb-2 block">Test Pattern Filter</Label>
                <div className="flex gap-2">
                  <Input
                    value={testPatternInput}
                    onChange={(e) => { setTestPatternInput(e.target.value); setTestPatternResult(null); }}
                    placeholder="Type sample text to test against patterns..."
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={testPattern}>
                    <TestTube className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                </div>
                {testPatternResult && (
                  <div className={`mt-2 p-2 rounded text-sm ${
                    testPatternResult.startsWith('BLOCKED')
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-green-50 text-green-800 border border-green-200'
                  }`}>
                    {testPatternResult}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 6: Languages & Currency (NEW) */}
        {/* ============================================================ */}
        <TabsContent value="currency" className="space-y-4">
          {/* Supported Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Supported Languages
              </CardTitle>
              <CardDescription>Languages derived from Knowledge Base sections. Add new language content in the Knowledge tab.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableLanguages.map(lang => (
                  <Badge key={lang} variant="outline" className="text-sm px-3 py-1">
                    {lang.toUpperCase()} - {knowledgeSections.filter(s => s.language === lang).length} sections
                  </Badge>
                ))}
                {availableLanguages.length === 0 && (
                  <p className="text-muted-foreground">No languages configured. Add knowledge base content to enable languages.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Currency Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Currency Exchange Rates
                  </CardTitle>
                  <CardDescription>All rates are relative to EUR (base). Clara uses these to convert pricing in responses.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addCurrency}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Currency
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currencies.map(curr => (
                  <div key={curr.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Switch
                      checked={curr.is_active}
                      onCheckedChange={(checked) => updateCurrency(curr.id, { is_active: checked })}
                    />
                    <Input
                      value={curr.currency_code}
                      onChange={(e) => updateCurrency(curr.id, { currency_code: e.target.value.toUpperCase() })}
                      className="w-24 font-mono text-sm font-bold"
                      placeholder="USD"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">1 EUR =</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={curr.rate_to_eur}
                        onChange={(e) => updateCurrency(curr.id, { rate_to_eur: parseFloat(e.target.value) || 1 })}
                        className="w-24 text-sm"
                      />
                      <span className="text-sm font-mono">{curr.currency_code}</span>
                    </div>
                    {curr.currency_code === 'EUR' ? (
                      <Badge variant="secondary">Base</Badge>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => deleteCurrency(curr.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 7: Performance (Upgraded from placeholder) */}
        {/* ============================================================ */}
        <TabsContent value="performance" className="space-y-4">
          {/* Daily Conversations Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Conversations Per Day (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyStats.length > 0 ? (
                <div className="space-y-2">
                  {dailyStats.map(stat => {
                    const maxCount = Math.max(...dailyStats.map(s => s.count), 1);
                    const widthPercent = Math.max((stat.count / maxCount) * 100, 2);
                    return (
                      <div key={stat.date} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-20 shrink-0">{stat.date.slice(5)}</span>
                        <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-10 text-right">{stat.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No conversation data yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Top Training Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Top Training Items by Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topTrainingItems.length > 0 ? (
                <div className="space-y-2">
                  {topTrainingItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm truncate flex-1">{item.question}</span>
                      <Badge variant="outline">{item.usage_count || 0} uses</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No training usage data yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{metrics.totalConversations}</p>
                <p className="text-sm text-muted-foreground">Total Messages (All Time)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{metrics.totalSessions}</p>
                <p className="text-sm text-muted-foreground">Unique Sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{metrics.totalLeads}</p>
                <p className="text-sm text-muted-foreground">Leads Generated</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAgentPage;
