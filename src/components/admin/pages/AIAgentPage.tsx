import React, { useState, useEffect } from 'react';
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
  Database,
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
  Sparkles
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TrainingManager from '@/components/admin/TrainingManager';

interface TrainingDataItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  confidence_score: number;
  usage_count?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  last_used_at?: string;
}

interface AISettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  responseStyle: string;
  contextWindow: number;
  memoryEnabled: boolean;
  learningMode: boolean;
}

interface NewTrainingItem {
  content_type: string;
  title: string;
  content: string;
  tags: string[];
  is_active: boolean;
}

const AIAgentPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [aiSettings, setAiSettings] = useState<AISettings>({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 500,
    systemPrompt: '',
    responseStyle: 'helpful',
    contextWindow: 4000,
    memoryEnabled: true,
    learningMode: true
  });

  const [trainingData, setTrainingData] = useState<TrainingDataItem[]>([]);
  const [newTrainingItem, setNewTrainingItem] = useState<NewTrainingItem>({
    content_type: 'faq',
    title: '',
    content: '',
    tags: [],
    is_active: true
  });

  const [claraMetrics] = useState({
    total_conversations: 1234,
    avg_response_time: 2.3,
    satisfaction_score: 4.8,
    resolution_rate: 94.2,
    active_sessions: 12
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([loadAISettings(), loadTrainingData()]);
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
          responseStyle: settings.response_style || 'helpful',
          contextWindow: Number(settings.context_window) || 4000,
          memoryEnabled: Boolean(settings.memory_enabled),
          learningMode: Boolean(settings.learning_mode)
        });
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
    }
  };

  const loadTrainingData = async () => {
    try {
      // For now, just set some demo data since table structure is different
      setTrainingData([
        {
          id: '1',
          question: 'What is LifeLink Sync?',
          answer: 'LifeLink Sync is a comprehensive personal emergency protection service...',
          category: 'product_info',
          confidence_score: 1.0,
          usage_count: 45
        },
        {
          id: '2', 
          question: 'How much does it cost?',
          answer: 'We offer Family Connection at €2.99/month and Premium Protection at €9.99/month...',
          category: 'pricing',
          confidence_score: 1.0,
          usage_count: 32
        }
      ]);
    } catch (error) {
      console.error('Error loading training data:', error);
      setTrainingData([]);
    }
  };

  const saveAISettings = async () => {
    try {
      setSaving(true);
      const settingsToSave = [
        { setting_key: 'model', setting_value: aiSettings.model },
        { setting_key: 'temperature', setting_value: aiSettings.temperature },
        { setting_key: 'max_tokens', setting_value: aiSettings.maxTokens },
        { setting_key: 'system_prompt', setting_value: aiSettings.systemPrompt },
        { setting_key: 'response_style', setting_value: aiSettings.responseStyle },
        { setting_key: 'context_window', setting_value: aiSettings.contextWindow },
        { setting_key: 'memory_enabled', setting_value: aiSettings.memoryEnabled },
        { setting_key: 'learning_mode', setting_value: aiSettings.learningMode }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clara AI Agent</h1>
            <p className="text-muted-foreground">Complete AI assistant management - settings, training, and performance</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open('/#chat', '_blank')}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Test Clara Chat
          </Button>
          <Button variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            View Logs
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Model Settings</TabsTrigger>
          <TabsTrigger value="training">Training Data</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                    <p className="text-2xl font-bold">{claraMetrics.total_conversations.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">{claraMetrics.avg_response_time}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Satisfaction Score</p>
                    <p className="text-2xl font-bold">{claraMetrics.satisfaction_score}/5</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                    <p className="text-2xl font-bold">{claraMetrics.resolution_rate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                    <p className="text-2xl font-bold">{claraMetrics.active_sessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Model Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Clara's AI Model Configuration
              </CardTitle>
              <CardDescription>Configure Clara's AI behavior and model settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>AI Model</Label>
                  <Select value={aiSettings.model} onValueChange={(value) => setAiSettings({...aiSettings, model: value})}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1</SelectItem>
                      <SelectItem value="gpt-5">GPT-5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Temperature: {aiSettings.temperature}</Label>
                  <Slider
                    value={[aiSettings.temperature]}
                    onValueChange={([value]) => setAiSettings({...aiSettings, temperature: value})}
                    min={0}
                    max={1}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label>System Prompt</Label>
                <Textarea
                  value={aiSettings.systemPrompt}
                  onChange={(e) => setAiSettings({...aiSettings, systemPrompt: e.target.value})}
                  rows={8}
                  className="mt-2"
                />
              </div>
              <Button onClick={saveAISettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Data Tab */}
        <TabsContent value="training" className="space-y-4">
          <TrainingManager compact />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Clara's Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
                <p className="text-muted-foreground">Detailed performance metrics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAgentPage;