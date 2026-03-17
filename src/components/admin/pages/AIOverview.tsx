import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Brain,
  MessageSquare,
  TrendingUp,
  Clock,
  Activity,
  ArrowRight,
  Zap,
  Users,
  FileText,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface AgentStatus {
  name: string;
  icon: React.ElementType;
  status: 'online' | 'offline';
  color: string;
  metrics: { label: string; value: string | number }[];
  route: string;
  description: string;
}

interface RecentEvent {
  id: string;
  agent: 'Clara' | 'Riven';
  type: string;
  summary: string;
  created_at: string;
}

const AIOverview = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [claraStats, setClaraStats] = useState({
    messagesToday: 0,
    activeSessions: 0,
    avgResponseTime: '< 2s',
    totalConversations: 0,
  });
  const [rivenStats, setRivenStats] = useState({
    activeCampaigns: 0,
    scheduledToday: 0,
    lastGeneration: '—',
    totalContent: 0,
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Clara stats
      const [convAll, convToday, sessionsToday] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('conversations').select('session_id').gte('created_at', todayISO),
      ]);

      const uniqueSessions = new Set((sessionsToday.data || []).map((r: any) => r.session_id)).size;

      setClaraStats({
        messagesToday: convToday.count ?? 0,
        activeSessions: uniqueSessions,
        avgResponseTime: '< 2s',
        totalConversations: convAll.count ?? 0,
      });

      // Riven stats
      const [campaigns, contentAll, contentToday] = await Promise.all([
        supabase.from('marketing_campaigns').select('id', { count: 'exact', head: true }).in('status', ['active', 'running']),
        supabase.from('marketing_content').select('id', { count: 'exact', head: true }),
        supabase.from('marketing_content').select('id', { count: 'exact', head: true }).gte('scheduled_at', todayISO).lte('scheduled_at', new Date(today.getTime() + 86400000).toISOString()),
      ]);

      const { data: lastContent } = await supabase
        .from('marketing_content')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      setRivenStats({
        activeCampaigns: campaigns.count ?? 0,
        scheduledToday: contentToday.count ?? 0,
        lastGeneration: lastContent?.[0]?.created_at
          ? new Date(lastContent[0].created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : '—',
        totalContent: contentAll.count ?? 0,
      });

      setTotalInteractions((convToday.count ?? 0) + (contentToday.count ?? 0));

      // Recent events — combine last Clara conversations and Riven content
      const [recentConvs, recentContent] = await Promise.all([
        supabase.from('conversations').select('id, session_id, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('marketing_content').select('id, platform, title, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const events: RecentEvent[] = [
        ...(recentConvs.data || []).map((c: any) => ({
          id: c.id,
          agent: 'Clara' as const,
          type: 'Conversation',
          summary: `Session ${c.session_id?.substring(0, 8) || 'unknown'}`,
          created_at: c.created_at,
        })),
        ...(recentContent.data || []).map((c: any) => ({
          id: c.id,
          agent: 'Riven' as const,
          type: c.platform || 'Content',
          summary: c.title || 'Generated content',
          created_at: c.created_at,
        })),
      ];
      events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentEvents(events.slice(0, 10));
    } catch (err) {
      toast({ title: 'Load Error', description: 'Failed to load AI overview data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const agents: AgentStatus[] = [
    {
      name: 'Clara',
      icon: Bot,
      status: 'online',
      color: 'emerald',
      description: t('ai.overview.claraDesc'),
      route: '/admin-dashboard/clara-activity',
      metrics: [
        { label: t('ai.overview.messagestoday'), value: claraStats.messagesToday },
        { label: t('ai.overview.activeSessions'), value: claraStats.activeSessions },
        { label: t('ai.overview.avgResponse'), value: claraStats.avgResponseTime },
        { label: t('ai.overview.totalConversations'), value: claraStats.totalConversations },
      ],
    },
    {
      name: 'Riven',
      icon: Brain,
      status: rivenStats.activeCampaigns > 0 ? 'online' : 'offline',
      color: 'purple',
      description: t('ai.overview.rivenDesc'),
      route: '/admin-dashboard/riven-marketing',
      metrics: [
        { label: t('ai.overview.activeCampaigns'), value: rivenStats.activeCampaigns },
        { label: t('ai.overview.scheduledToday'), value: rivenStats.scheduledToday },
        { label: t('ai.overview.lastGeneration'), value: rivenStats.lastGeneration },
        { label: t('ai.overview.totalContent'), value: rivenStats.totalContent },
      ],
    },
  ];

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return t('ai.overview.justNow');
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="px-8 py-6 w-full space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('ai.overview.title')}</h1>
          <p className="text-muted-foreground">{t('ai.overview.subtitle')}</p>
        </div>
      </div>

      {/* Combined stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <Zap className="h-5 w-5 mx-auto mb-1 text-amber-500" />
          <p className="text-2xl font-bold">{totalInteractions}</p>
          <p className="text-xs text-muted-foreground">{t('ai.overview.interactionsToday')}</p>
        </Card>
        <Card className="p-3 text-center">
          <MessageSquare className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{claraStats.messagesToday}</p>
          <p className="text-xs text-muted-foreground">{t('ai.overview.claraMessages')}</p>
        </Card>
        <Card className="p-3 text-center">
          <FileText className="h-5 w-5 mx-auto mb-1 text-purple-500" />
          <p className="text-2xl font-bold">{rivenStats.scheduledToday}</p>
          <p className="text-xs text-muted-foreground">{t('ai.overview.rivenPostsToday')}</p>
        </Card>
        <Card className="p-3 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
          <p className="text-2xl font-bold">{claraStats.activeSessions}</p>
          <p className="text-xs text-muted-foreground">{t('ai.overview.activeSessions')}</p>
        </Card>
      </div>

      {/* Agent Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <Card key={agent.name} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${agent.color === 'emerald' ? 'bg-emerald-500/10' : 'bg-purple-500/10'}`}>
                    <agent.icon className={`h-6 w-6 ${agent.color === 'emerald' ? 'text-emerald-500' : 'text-purple-500'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{agent.description}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={agent.status === 'online'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}
                >
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${agent.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {agent.status === 'online' ? t('ai.overview.online') : t('ai.overview.idle')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {agent.metrics.map((m) => (
                  <div key={m.label} className="bg-muted/50 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-sm font-semibold mt-0.5">{m.value}</p>
                  </div>
                ))}
              </div>
              <Link to={agent.route}>
                <Button variant="outline" size="sm" className="w-full text-xs">
                  {t('ai.overview.viewDetails')} <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('ai.overview.recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('ai.overview.loading')}</p>
          ) : recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('ai.overview.noRecentActivity')}</p>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className={`p-1.5 rounded-md ${event.agent === 'Clara' ? 'bg-emerald-500/10' : 'bg-purple-500/10'}`}>
                    {event.agent === 'Clara' ? (
                      <Bot className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Brain className="h-3.5 w-3.5 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{event.agent}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{event.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{event.summary}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(event.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/admin-dashboard/clara-activity">
          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer text-center">
            <Bot className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-xs font-medium">Clara Activity</p>
          </Card>
        </Link>
        <Link to="/admin-dashboard/riven-marketing">
          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer text-center">
            <Brain className="h-5 w-5 mx-auto mb-1 text-purple-500" />
            <p className="text-xs font-medium">Riven Marketing</p>
          </Card>
        </Link>
        <Link to="/admin-dashboard/ai-settings">
          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xs font-medium">AI Settings</p>
          </Card>
        </Link>
        <Link to="/admin-dashboard/ai-analytics">
          <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-xs font-medium">AI Analytics</p>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default AIOverview;
