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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Brain,
  Activity,
  Settings,
  Save,
  RotateCcw,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  Sparkles,
  FileText,
  Megaphone,
  Palette,
  Calendar,
  BarChart3,
  Zap,
  RefreshCw,
  Loader2,
  Trash2,
  TestTube,
  Globe,
  Hash,
  Target,
  Pencil,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

// ============================================================
// Types
// ============================================================

interface RivenSettings {
  aiModel: string;
  temperature: number;
  maxTokens: number;
  autoApproveContent: boolean;
  brandVoice: string;
  contentGuidelines: string;
  defaultBudget: number;
  preferredPostingTimes: Record<string, string[]>;
}

interface RivenMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalContent: number;
  publishedContent: number;
  scheduledContent: number;
  draftContent: number;
  platformsActive: number;
}

interface ContentAngleConfig {
  angle: string;
  enabled: boolean;
  usageCount: number;
}

interface HookStyleConfig {
  style: string;
  enabled: boolean;
  label: string;
}

interface CTAConfig {
  type: string;
  enabled: boolean;
  label: string;
}

interface PlatformConfig {
  platform: string;
  enabled: boolean;
  postsPerDay: number;
  bestTimes: string[];
  maxHashtags: number;
  maxLength: number;
}

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

const DEFAULT_ANGLES: ContentAngleConfig[] = [
  { angle: 'story', enabled: true, usageCount: 0 },
  { angle: 'statistic', enabled: true, usageCount: 0 },
  { angle: 'question', enabled: true, usageCount: 0 },
  { angle: 'testimonial', enabled: true, usageCount: 0 },
  { angle: 'educational', enabled: true, usageCount: 0 },
  { angle: 'urgent', enabled: true, usageCount: 0 },
  { angle: 'behind_scenes', enabled: true, usageCount: 0 },
  { angle: 'myth_busting', enabled: true, usageCount: 0 },
];

const DEFAULT_HOOKS: HookStyleConfig[] = [
  { style: 'question_hook', enabled: true, label: 'Question Hook' },
  { style: 'bold_statement', enabled: true, label: 'Bold Statement' },
  { style: 'story_hook', enabled: true, label: 'Story Hook' },
  { style: 'statistic_hook', enabled: true, label: 'Statistic Hook' },
  { style: 'challenge_hook', enabled: true, label: 'Challenge Hook' },
];

const DEFAULT_CTAS: CTAConfig[] = [
  { type: 'learn_more', enabled: true, label: 'Learn More' },
  { type: 'book_free_trial', enabled: true, label: 'Book Free Trial' },
  { type: 'share_with_family', enabled: true, label: 'Share With Family' },
  { type: 'comment_below', enabled: true, label: 'Comment Below' },
  { type: 'save_for_later', enabled: true, label: 'Save For Later' },
  { type: 'visit_link_in_bio', enabled: true, label: 'Visit Link In Bio' },
  { type: 'tag_someone', enabled: true, label: 'Tag Someone' },
  { type: 'download_guide', enabled: true, label: 'Download Guide' },
];

const DEFAULT_PLATFORMS: PlatformConfig[] = [
  { platform: 'twitter', enabled: true, postsPerDay: 2, bestTimes: ['09:00', '14:00'], maxHashtags: 3, maxLength: 280 },
  { platform: 'linkedin', enabled: true, postsPerDay: 1, bestTimes: ['08:00', '12:00'], maxHashtags: 5, maxLength: 3000 },
  { platform: 'facebook', enabled: true, postsPerDay: 1, bestTimes: ['10:00', '15:00'], maxHashtags: 5, maxLength: 5000 },
  { platform: 'instagram', enabled: true, postsPerDay: 1, bestTimes: ['11:00', '19:00'], maxHashtags: 30, maxLength: 2200 },
  { platform: 'tiktok', enabled: false, postsPerDay: 1, bestTimes: ['12:00', '20:00'], maxHashtags: 5, maxLength: 2200 },
  { platform: 'blog', enabled: true, postsPerDay: 0, bestTimes: ['10:00'], maxHashtags: 0, maxLength: 10000 },
  { platform: 'email', enabled: true, postsPerDay: 0, bestTimes: ['09:00'], maxHashtags: 0, maxLength: 5000 },
];

// ============================================================
// Component
// ============================================================

const RivenAgentPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<RivenSettings>({
    aiModel: 'claude-sonnet-4-20250514',
    temperature: 0.8,
    maxTokens: 4096,
    autoApproveContent: false,
    brandVoice: '',
    contentGuidelines: '',
    defaultBudget: 0,
    preferredPostingTimes: {},
  });

  // Metrics state
  const [metrics, setMetrics] = useState<RivenMetrics>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalContent: 0,
    publishedContent: 0,
    scheduledContent: 0,
    draftContent: 0,
    platformsActive: 0,
  });

  // Content configuration state
  const [angles, setAngles] = useState<ContentAngleConfig[]>(DEFAULT_ANGLES);
  const [hooks, setHooks] = useState<HookStyleConfig[]>(DEFAULT_HOOKS);
  const [ctas, setCtas] = useState<CTAConfig[]>(DEFAULT_CTAS);

  // Platform state
  const [platforms, setPlatforms] = useState<PlatformConfig[]>(DEFAULT_PLATFORMS);

  // Performance state
  const [dailyContent, setDailyContent] = useState<{ date: string; generated: number; published: number }[]>([]);
  const [platformDist, setPlatformDist] = useState<{ name: string; value: number }[]>([]);
  const [angleDist, setAngleDist] = useState<{ name: string; value: number }[]>([]);
  const [recentContent, setRecentContent] = useState<any[]>([]);
  const [campaignStats, setCampaignStats] = useState<{ name: string; posts: number; status: string }[]>([]);

  // ============================================================
  // Data Loading
  // ============================================================

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSettings(),
        loadMetrics(),
        loadContentAngles(),
        loadPerformanceData(),
      ]);
    } catch (err) {
      console.error('RivenAgentPage load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('riven_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (data) {
      setSettings({
        aiModel: (data as any).ai_model || 'claude-sonnet-4-20250514',
        temperature: (data as any).temperature || 0.8,
        maxTokens: (data as any).max_tokens || 4096,
        autoApproveContent: (data as any).auto_approve_content || false,
        brandVoice: (data as any).brand_voice || '',
        contentGuidelines: (data as any).content_guidelines || '',
        defaultBudget: (data as any).default_budget || 0,
        preferredPostingTimes: (data as any).preferred_posting_times || {},
      });
    }
  };

  const loadMetrics = async () => {
    const [campaignsAll, campaignsActive, contentAll, contentPublished, contentScheduled, contentDraft] = await Promise.all([
      supabase.from('marketing_campaigns').select('id', { count: 'exact', head: true }),
      supabase.from('marketing_campaigns').select('id', { count: 'exact', head: true }).in('status', ['active', 'running']),
      supabase.from('marketing_content').select('id', { count: 'exact', head: true }),
      supabase.from('marketing_content').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('marketing_content').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
      supabase.from('marketing_content').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    ]);

    // Count unique platforms from content
    const { data: platData } = await supabase
      .from('marketing_content')
      .select('platform')
      .limit(500);
    const uniquePlats = new Set((platData || []).map((r: any) => r.platform)).size;

    setMetrics({
      totalCampaigns: campaignsAll.count ?? 0,
      activeCampaigns: campaignsActive.count ?? 0,
      totalContent: contentAll.count ?? 0,
      publishedContent: contentPublished.count ?? 0,
      scheduledContent: contentScheduled.count ?? 0,
      draftContent: contentDraft.count ?? 0,
      platformsActive: uniquePlats,
    });
  };

  const loadContentAngles = async () => {
    const { data } = await supabase
      .from('riven_content_angles')
      .select('content_angle');

    if (data && data.length > 0) {
      const countMap = new Map<string, number>();
      data.forEach((r: any) => {
        const a = r.content_angle || 'unknown';
        countMap.set(a, (countMap.get(a) || 0) + 1);
      });
      setAngles(prev =>
        prev.map(a => ({
          ...a,
          usageCount: countMap.get(a.angle) || 0,
        }))
      );
    }
  };

  const loadPerformanceData = async () => {
    // Daily content generation (last 30 days)
    const days: { date: string; generated: number; published: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      const dISO = d.toISOString();
      const nISO = nextD.toISOString();

      const [gen, pub] = await Promise.all([
        supabase.from('marketing_content').select('id', { count: 'exact', head: true }).gte('created_at', dISO).lt('created_at', nISO),
        supabase.from('marketing_content').select('id', { count: 'exact', head: true }).gte('created_at', dISO).lt('created_at', nISO).eq('status', 'published'),
      ]);

      if ((gen.count ?? 0) > 0 || i < 7) {
        days.push({
          date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          generated: gen.count ?? 0,
          published: pub.count ?? 0,
        });
      }
    }
    setDailyContent(days.length > 0 ? days : days.slice(-7));

    // Platform distribution
    const { data: platContent } = await supabase
      .from('marketing_content')
      .select('platform')
      .limit(1000);

    const platMap = new Map<string, number>();
    (platContent || []).forEach((r: any) => {
      const p = r.platform || 'unknown';
      platMap.set(p, (platMap.get(p) || 0) + 1);
    });
    setPlatformDist(
      Array.from(platMap.entries())
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        .sort((a, b) => b.value - a.value)
    );

    // Angle distribution
    const { data: angleData } = await supabase
      .from('marketing_content')
      .select('content_angle')
      .not('content_angle', 'is', null)
      .limit(1000);

    const angleMap = new Map<string, number>();
    (angleData || []).forEach((r: any) => {
      const a = r.content_angle || 'unknown';
      angleMap.set(a, (angleMap.get(a) || 0) + 1);
    });
    setAngleDist(
      Array.from(angleMap.entries())
        .map(([name, value]) => ({ name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value }))
        .sort((a, b) => b.value - a.value)
    );

    // Recent content
    const { data: recent } = await supabase
      .from('marketing_content')
      .select('id, title, platform, status, content_angle, hook_style, cta_type, created_at')
      .order('created_at', { ascending: false })
      .limit(15);
    setRecentContent(recent || []);

    // Campaign stats
    const { data: camps } = await supabase
      .from('marketing_campaigns')
      .select('id, title, status')
      .order('created_at', { ascending: false })
      .limit(10);

    if (camps) {
      const statsPromises = camps.map(async (c: any) => {
        const { count } = await supabase
          .from('marketing_content')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', c.id);
        return { name: c.title || 'Untitled', posts: count ?? 0, status: c.status };
      });
      setCampaignStats(await Promise.all(statsPromises));
    }
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ============================================================
  // Save Handlers
  // ============================================================

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('riven_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      const payload = {
        ai_model: settings.aiModel,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        auto_approve_content: settings.autoApproveContent,
        brand_voice: settings.brandVoice,
        content_guidelines: settings.contentGuidelines,
        default_budget: settings.defaultBudget,
        preferred_posting_times: settings.preferredPostingTimes,
      };

      if (existing) {
        await supabase.from('riven_settings').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('riven_settings').insert(payload);
      }

      toast({ title: 'Settings Saved', description: 'Riven settings updated successfully.' });
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Save Failed', description: 'Could not save settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      aiModel: 'claude-sonnet-4-20250514',
      temperature: 0.8,
      maxTokens: 4096,
      autoApproveContent: false,
      brandVoice: '',
      contentGuidelines: '',
      defaultBudget: 0,
      preferredPostingTimes: {},
    });
    toast({ title: 'Reset', description: 'Settings reset to defaults.' });
  };

  const testConnection = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('riven-content-single', {
        body: {
          goal: 'test',
          audience: 'test',
          tone: 'professional',
          platforms: ['blog'],
          topic: 'LifeLink Sync connection test',
          word_count: 50,
          seo_optimize: false,
        },
      });
      if (error) throw error;
      toast({ title: 'Connection Successful', description: `Riven responded with ${data?.results?.length || 0} content piece(s).` });
    } catch (err: any) {
      toast({ title: 'Connection Failed', description: err.message || 'Could not reach Riven API.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            Riven Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Full configuration for the Riven AI Marketing Engine
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAllData} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="text-xs gap-1"><Activity className="h-3 w-3" /> Overview</TabsTrigger>
          <TabsTrigger value="model" className="text-xs gap-1"><Settings className="h-3 w-3" /> Model</TabsTrigger>
          <TabsTrigger value="brand" className="text-xs gap-1"><Palette className="h-3 w-3" /> Brand Voice</TabsTrigger>
          <TabsTrigger value="angles" className="text-xs gap-1"><Sparkles className="h-3 w-3" /> Content Engine</TabsTrigger>
          <TabsTrigger value="platforms" className="text-xs gap-1"><Globe className="h-3 w-3" /> Platforms</TabsTrigger>
          <TabsTrigger value="scheduling" className="text-xs gap-1"><Calendar className="h-3 w-3" /> Scheduling</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs gap-1"><BarChart3 className="h-3 w-3" /> Performance</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs gap-1"><Zap className="h-3 w-3" /> Advanced</TabsTrigger>
        </TabsList>

        {/* ============================== TAB 1: OVERVIEW ============================== */}
        <TabsContent value="overview" className="space-y-4">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Card className="p-3 text-center">
              <Megaphone className="h-4 w-4 mx-auto mb-1 text-purple-500" />
              <p className="text-xl font-bold">{metrics.totalCampaigns}</p>
              <p className="text-[10px] text-muted-foreground">Total Campaigns</p>
            </Card>
            <Card className="p-3 text-center">
              <Activity className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
              <p className="text-xl font-bold">{metrics.activeCampaigns}</p>
              <p className="text-[10px] text-muted-foreground">Active</p>
            </Card>
            <Card className="p-3 text-center">
              <FileText className="h-4 w-4 mx-auto mb-1 text-blue-500" />
              <p className="text-xl font-bold">{metrics.totalContent}</p>
              <p className="text-[10px] text-muted-foreground">Total Content</p>
            </Card>
            <Card className="p-3 text-center">
              <CheckCircle className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
              <p className="text-xl font-bold">{metrics.publishedContent}</p>
              <p className="text-[10px] text-muted-foreground">Published</p>
            </Card>
            <Card className="p-3 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-amber-500" />
              <p className="text-xl font-bold">{metrics.scheduledContent}</p>
              <p className="text-[10px] text-muted-foreground">Scheduled</p>
            </Card>
            <Card className="p-3 text-center">
              <Pencil className="h-4 w-4 mx-auto mb-1 text-gray-400" />
              <p className="text-xl font-bold">{metrics.draftContent}</p>
              <p className="text-[10px] text-muted-foreground">Drafts</p>
            </Card>
            <Card className="p-3 text-center">
              <Globe className="h-4 w-4 mx-auto mb-1 text-blue-400" />
              <p className="text-xl font-bold">{metrics.platformsActive}</p>
              <p className="text-[10px] text-muted-foreground">Platforms</p>
            </Card>
          </div>

          {/* Current Configuration Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Current Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">AI Model</p>
                  <p className="text-sm font-semibold mt-0.5">{settings.aiModel}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Temperature</p>
                  <p className="text-sm font-semibold mt-0.5">{settings.temperature}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Max Tokens</p>
                  <p className="text-sm font-semibold mt-0.5">{settings.maxTokens.toLocaleString()}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Auto-Approve</p>
                  <Badge className={settings.autoApproveContent ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'}>
                    {settings.autoApproveContent ? 'On' : 'Off'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Overview */}
          {campaignStats.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Campaign Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Campaign</TableHead>
                      <TableHead className="text-xs">Posts</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignStats.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{c.name}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{c.posts}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${
                            c.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : c.status === 'completed' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                          }`}>
                            {c.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================== TAB 2: MODEL SETTINGS ============================== */}
        <TabsContent value="model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI Model Configuration</CardTitle>
              <CardDescription>Configure the Claude model Riven uses for content generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">AI Model</Label>
                <Select value={settings.aiModel} onValueChange={(v) => setSettings(s => ({ ...s, aiModel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4 (Recommended)</SelectItem>
                    <SelectItem value="claude-opus-4-20250514">Claude Opus 4</SelectItem>
                    <SelectItem value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Fast)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Temperature</Label>
                  <Badge variant="secondary" className="text-[10px]">{settings.temperature}</Badge>
                </div>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={([v]) => setSettings(s => ({ ...s, temperature: Math.round(v * 100) / 100 }))}
                  min={0}
                  max={1}
                  step={0.05}
                />
                <p className="text-[10px] text-muted-foreground">
                  Lower = more focused content, Higher = more creative variety
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Max Tokens</Label>
                  <Badge variant="secondary" className="text-[10px]">{settings.maxTokens.toLocaleString()}</Badge>
                </div>
                <Slider
                  value={[settings.maxTokens]}
                  onValueChange={([v]) => setSettings(s => ({ ...s, maxTokens: v }))}
                  min={256}
                  max={8192}
                  step={256}
                />
                <p className="text-[10px] text-muted-foreground">
                  Maximum response length. Blog posts need more, tweets need less.
                </p>
              </div>

              {/* Default Budget */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Default Campaign Budget ($)</Label>
                <Input
                  type="number"
                  value={settings.defaultBudget}
                  onChange={(e) => setSettings(s => ({ ...s, defaultBudget: parseFloat(e.target.value) || 0 }))}
                  className="max-w-[200px]"
                />
              </div>

              {/* Provider Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <span className="text-sm text-muted-foreground">Provider</span>
                  <span className="text-sm font-medium">Anthropic</span>
                </div>
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <span className="text-sm text-muted-foreground">API Key</span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Configured</Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={saveSettings} disabled={saving} size="sm">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Save className="h-3 w-3 mr-1.5" />}
                  Save Settings
                </Button>
                <Button variant="outline" onClick={resetSettings} size="sm">
                  <RotateCcw className="h-3 w-3 mr-1.5" /> Reset Defaults
                </Button>
                <Button variant="outline" onClick={testConnection} disabled={saving} size="sm">
                  <TestTube className="h-3 w-3 mr-1.5" /> Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================== TAB 3: BRAND VOICE ============================== */}
        <TabsContent value="brand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Brand Voice & Tone</CardTitle>
              <CardDescription>Define how Riven speaks as your brand across all platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Brand Voice Description</Label>
                <Textarea
                  value={settings.brandVoice}
                  onChange={(e) => setSettings(s => ({ ...s, brandVoice: e.target.value }))}
                  placeholder="Describe your brand's voice and personality. E.g., 'Warm, empathetic, and safety-focused. We speak to families with care and urgency about personal safety. Professional but never cold.'"
                  rows={4}
                />
                <p className="text-[10px] text-muted-foreground">
                  This description is included in every AI content generation prompt to maintain consistency.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Content Guidelines</CardTitle>
              <CardDescription>Rules and constraints Riven must follow when generating content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Content Rules & Guidelines</Label>
                <Textarea
                  value={settings.contentGuidelines}
                  onChange={(e) => setSettings(s => ({ ...s, contentGuidelines: e.target.value }))}
                  placeholder={`Example guidelines:\n- Always mention LifeLink Sync by name at least once\n- Never make medical claims or diagnoses\n- Include a clear call-to-action\n- Use inclusive, non-ageist language\n- Emphasise AI-powered protection, not surveillance\n- Reference the 7-day free trial when appropriate`}
                  rows={8}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveSettings} disabled={saving} size="sm">
                  <Save className="h-3 w-3 mr-1.5" /> Save Brand Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tone Presets</CardTitle>
              <CardDescription>Quick-select tones used in campaign wizard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['Professional', 'Friendly', 'Urgent', 'Empathetic', 'Educational', 'Inspiring', 'Conversational', 'Authoritative'].map((tone) => (
                  <Badge key={tone} variant="secondary" className="text-xs cursor-default">{tone}</Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                These tones are available in the campaign wizard Step 2 (Audience & Tone).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================== TAB 4: CONTENT ENGINE ============================== */}
        <TabsContent value="angles" className="space-y-4">
          {/* Content Angles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Content Angles</CardTitle>
              <CardDescription>Riven rotates through these angles to prevent repetitive content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {angles.map((angle, i) => (
                  <div key={angle.angle} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={angle.enabled}
                        onCheckedChange={(v) => {
                          const updated = [...angles];
                          updated[i] = { ...updated[i], enabled: v };
                          setAngles(updated);
                        }}
                      />
                      <span className="text-sm font-medium capitalize">{angle.angle.replace(/_/g, ' ')}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {angle.usageCount} uses
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hook Styles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Hook Styles</CardTitle>
              <CardDescription>Opening styles rotated to grab attention differently each time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hooks.map((hook, i) => (
                  <div key={hook.style} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={hook.enabled}
                        onCheckedChange={(v) => {
                          const updated = [...hooks];
                          updated[i] = { ...updated[i], enabled: v };
                          setHooks(updated);
                        }}
                      />
                      <span className="text-sm">{hook.label}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">{hook.style}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Call-to-Action Types</CardTitle>
              <CardDescription>CTAs rotated across posts to maintain engagement variety</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ctas.map((cta, i) => (
                  <div key={cta.type} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={cta.enabled}
                        onCheckedChange={(v) => {
                          const updated = [...ctas];
                          updated[i] = { ...updated[i], enabled: v };
                          setCtas(updated);
                        }}
                      />
                      <span className="text-sm">{cta.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================== TAB 5: PLATFORMS ============================== */}
        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Platform Configuration</CardTitle>
              <CardDescription>Enable/disable platforms and set content limits per platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platforms.map((plat, i) => (
                  <div key={plat.platform} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={plat.enabled}
                          onCheckedChange={(v) => {
                            const updated = [...platforms];
                            updated[i] = { ...updated[i], enabled: v };
                            setPlatforms(updated);
                          }}
                        />
                        <span className="text-sm font-semibold capitalize">{plat.platform}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${plat.enabled
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}
                      >
                        {plat.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    {plat.enabled && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Posts/Day</Label>
                          <Input
                            type="number"
                            value={plat.postsPerDay}
                            onChange={(e) => {
                              const updated = [...platforms];
                              updated[i] = { ...updated[i], postsPerDay: parseInt(e.target.value) || 0 };
                              setPlatforms(updated);
                            }}
                            className="h-8 text-sm mt-1"
                            min={0}
                            max={10}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Max Hashtags</Label>
                          <Input
                            type="number"
                            value={plat.maxHashtags}
                            onChange={(e) => {
                              const updated = [...platforms];
                              updated[i] = { ...updated[i], maxHashtags: parseInt(e.target.value) || 0 };
                              setPlatforms(updated);
                            }}
                            className="h-8 text-sm mt-1"
                            min={0}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Max Length</Label>
                          <Input
                            type="number"
                            value={plat.maxLength}
                            onChange={(e) => {
                              const updated = [...platforms];
                              updated[i] = { ...updated[i], maxLength: parseInt(e.target.value) || 0 };
                              setPlatforms(updated);
                            }}
                            className="h-8 text-sm mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Best Times</Label>
                          <p className="text-xs mt-1.5">{plat.bestTimes.join(', ')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Connected Accounts</CardTitle>
              <CardDescription>Social media accounts linked for auto-publishing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Twitter', 'LinkedIn', 'Facebook', 'Instagram', 'TikTok'].map((p) => (
                  <div key={p} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{p}</span>
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                      Not Connected
                    </Badge>
                  </div>
                ))}
                {['Blog', 'Email (Resend)'].map((p) => (
                  <div key={p} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{p}</span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Built-in
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================== TAB 6: SCHEDULING ============================== */}
        <TabsContent value="scheduling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Default Posting Schedule</CardTitle>
              <CardDescription>Default posting times used when creating new campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platforms.filter(p => p.enabled && p.postsPerDay > 0).map((plat, i) => (
                  <div key={plat.platform} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold capitalize">{plat.platform}</span>
                      <Badge variant="secondary" className="text-[10px]">{plat.postsPerDay} posts/day</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {plat.bestTimes.map((time, ti) => (
                        <div key={ti} className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <Input
                            type="time"
                            value={time}
                            onChange={(e) => {
                              const updatedPlats = [...platforms];
                              const platIdx = updatedPlats.findIndex(p => p.platform === plat.platform);
                              const newTimes = [...updatedPlats[platIdx].bestTimes];
                              newTimes[ti] = e.target.value;
                              updatedPlats[platIdx] = { ...updatedPlats[platIdx], bestTimes: newTimes };
                              setPlatforms(updatedPlats);
                            }}
                            className="h-7 w-[110px] text-xs"
                          />
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const updatedPlats = [...platforms];
                          const platIdx = updatedPlats.findIndex(p => p.platform === plat.platform);
                          updatedPlats[platIdx] = {
                            ...updatedPlats[platIdx],
                            bestTimes: [...updatedPlats[platIdx].bestTimes, '12:00'],
                          };
                          setPlatforms(updatedPlats);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Time
                      </Button>
                    </div>
                  </div>
                ))}
                {platforms.filter(p => p.enabled && p.postsPerDay > 0).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No platforms configured with daily posts. Enable platforms and set posts/day in the Platforms tab.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Auto-Publishing</CardTitle>
              <CardDescription>Configure automatic content publishing behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Auto-Approve Content</p>
                  <p className="text-[10px] text-muted-foreground">Skip manual review and publish directly when scheduled</p>
                </div>
                <Switch
                  checked={settings.autoApproveContent}
                  onCheckedChange={(v) => setSettings(s => ({ ...s, autoApproveContent: v }))}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Daily Publisher</p>
                  <p className="text-[10px] text-muted-foreground">Cron job that publishes scheduled content at posting times</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Daily Summary Email</p>
                  <p className="text-[10px] text-muted-foreground">Receive a daily email summary of published and failed posts</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Via Resend</Badge>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveSettings} disabled={saving} size="sm">
                  <Save className="h-3 w-3 mr-1.5" /> Save Schedule Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================== TAB 7: PERFORMANCE ============================== */}
        <TabsContent value="performance" className="space-y-4">
          {/* Daily Content Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Content Generation vs Publishing (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyContent.length > 0 ? (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyContent}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="generated" name="Generated" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="published" name="Published" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No content data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Platform Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Content by Platform</CardTitle>
              </CardHeader>
              <CardContent>
                {platformDist.length > 0 ? (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={platformDist}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {platformDist.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No platform data</p>
                )}
              </CardContent>
            </Card>

            {/* Angle Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Content Angles Used</CardTitle>
              </CardHeader>
              <CardContent>
                {angleDist.length > 0 ? (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={angleDist}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No angle data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Content Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent Generated Content</CardTitle>
            </CardHeader>
            <CardContent>
              {recentContent.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No content generated yet</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Title</TableHead>
                        <TableHead className="text-xs">Platform</TableHead>
                        <TableHead className="text-xs">Angle</TableHead>
                        <TableHead className="text-xs">Hook</TableHead>
                        <TableHead className="text-xs">CTA</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentContent.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs max-w-[200px] truncate">{item.title || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{item.platform}</Badge>
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground capitalize">
                            {item.content_angle?.replace(/_/g, ' ') || '—'}
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground capitalize">
                            {item.hook_style?.replace(/_/g, ' ') || '—'}
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground capitalize">
                            {item.cta_type?.replace(/_/g, ' ') || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                item.status === 'published' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : item.status === 'scheduled' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(item.created_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================== TAB 8: ADVANCED ============================== */}
        <TabsContent value="advanced" className="space-y-4">
          {/* Edge Function Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Edge Functions</CardTitle>
              <CardDescription>Riven's serverless functions for content generation and publishing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: 'riven-campaign-generator', desc: 'Full campaign generation with Claude AI' },
                  { name: 'riven-content-single', desc: 'Single content piece generation' },
                  { name: 'riven-social-publisher', desc: 'Routes content to platform APIs' },
                  { name: 'riven-daily-publisher', desc: 'Cron: publishes scheduled content daily' },
                  { name: 'riven-marketing-enhanced', desc: 'Enhanced multi-stage workflow' },
                ].map((fn) => (
                  <div key={fn.name} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-mono">{fn.name}</p>
                      <p className="text-[10px] text-muted-foreground">{fn.desc}</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                      Deployed
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Engine Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Content Engine Settings</CardTitle>
              <CardDescription>Advanced content generation parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Default Word Count</Label>
                  <Input type="number" defaultValue={500} className="h-8" />
                  <p className="text-[10px] text-muted-foreground">Target word count for generated content</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">API Timeout (seconds)</Label>
                  <Input type="number" defaultValue={50} className="h-8" />
                  <p className="text-[10px] text-muted-foreground">Max wait time for AI response</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Batch Size</Label>
                  <Input type="number" defaultValue={5} className="h-8" />
                  <p className="text-[10px] text-muted-foreground">Content pieces generated per API call</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Daily Publish Limit</Label>
                  <Input type="number" defaultValue={50} className="h-8" />
                  <p className="text-[10px] text-muted-foreground">Max posts the daily publisher handles per run</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">SEO Configuration</CardTitle>
              <CardDescription>Search engine optimization for blog and long-form content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">SEO Optimization</p>
                  <p className="text-[10px] text-muted-foreground">Generate meta descriptions, keywords, slugs, and alt text</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Auto-Generate Slugs</p>
                  <p className="text-[10px] text-muted-foreground">Create URL-friendly slugs from content titles</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Reading Time Calculation</p>
                  <p className="text-[10px] text-muted-foreground">Estimate reading time for blog posts</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Enabled</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="text-sm text-red-500">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Clear All Draft Content</p>
                  <p className="text-[10px] text-muted-foreground">Remove all unpublished draft content</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs text-red-500 border-red-500/20 hover:bg-red-500/10">
                  <Trash2 className="h-3 w-3 mr-1.5" /> Clear Drafts
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Reset Angle Tracking</p>
                  <p className="text-[10px] text-muted-foreground">Clear content angle usage history</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs text-red-500 border-red-500/20 hover:bg-red-500/10">
                  <RotateCcw className="h-3 w-3 mr-1.5" /> Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RivenAgentPage;
