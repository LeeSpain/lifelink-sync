import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bot,
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Globe,
} from 'lucide-react';
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
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface DailyVolume {
  date: string;
  messages: number;
}

interface ConversationRow {
  session_id: string;
  count: number;
  last_active: string;
  language: string;
}

const LANG_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

const ClaraActivity = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeSessions: 0,
    messagesToday: 0,
    leadsGenerated: 0,
    avgMsgsPerSession: 0,
    sosHandled: 0,
    totalMessages: 0,
  });
  const [dailyVolume, setDailyVolume] = useState<DailyVolume[]>([]);
  const [languageDist, setLanguageDist] = useState<{ name: string; value: number }[]>([]);
  const [recentConversations, setRecentConversations] = useState<ConversationRow[]>([]);
  const [topQuestions, setTopQuestions] = useState<{ question: string; count: number }[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Messages today
      const { count: msgToday } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO);

      // Total messages
      const { count: totalMsgs } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true });

      // Active sessions today
      const { data: sessData } = await supabase
        .from('conversations')
        .select('session_id')
        .gte('created_at', todayISO);
      const uniqueSessions = new Set((sessData || []).map((r: any) => r.session_id)).size;

      // Leads
      const { count: leads } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true });

      // All sessions for avg calc
      const { data: allSess } = await supabase
        .from('conversations')
        .select('session_id');
      const sessMap = new Map<string, number>();
      (allSess || []).forEach((r: any) => {
        sessMap.set(r.session_id, (sessMap.get(r.session_id) || 0) + 1);
      });
      const totalSessions = sessMap.size || 1;
      const avgMsgs = Math.round((totalMsgs ?? 0) / totalSessions * 10) / 10;

      // SOS handled (approximate from conversations mentioning emergency)
      const { count: sosCount } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .ilike('conversation_summary', '%emergency%');

      setMetrics({
        activeSessions: uniqueSessions,
        messagesToday: msgToday ?? 0,
        leadsGenerated: leads ?? 0,
        avgMsgsPerSession: avgMsgs,
        sosHandled: sosCount ?? 0,
        totalMessages: totalMsgs ?? 0,
      });

      // Daily volume (last 7 days)
      const days: DailyVolume[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const nextD = new Date(d);
        nextD.setDate(nextD.getDate() + 1);
        const { count } = await supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', d.toISOString())
          .lt('created_at', nextD.toISOString());
        days.push({
          date: d.toLocaleDateString([], { weekday: 'short' }),
          messages: count ?? 0,
        });
      }
      setDailyVolume(days);

      // Language distribution (from metadata)
      const { data: langData } = await supabase
        .from('conversations')
        .select('metadata')
        .not('metadata', 'is', null)
        .limit(500);

      const langMap = new Map<string, number>();
      (langData || []).forEach((r: any) => {
        const lang = r.metadata?.language || r.metadata?.lang || 'EN';
        const key = String(lang).toUpperCase().substring(0, 2);
        langMap.set(key, (langMap.get(key) || 0) + 1);
      });
      if (langMap.size === 0) {
        langMap.set('EN', totalMsgs ?? 1);
      }
      setLanguageDist(
        Array.from(langMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );

      // Recent conversations (grouped by session)
      const { data: recentSess } = await supabase
        .from('conversations')
        .select('session_id, created_at, metadata')
        .order('created_at', { ascending: false })
        .limit(200);

      const sessGroups = new Map<string, { count: number; last: string; lang: string }>();
      (recentSess || []).forEach((r: any) => {
        const existing = sessGroups.get(r.session_id);
        const lang = r.metadata?.language || r.metadata?.lang || 'EN';
        if (!existing) {
          sessGroups.set(r.session_id, { count: 1, last: r.created_at, lang: String(lang).toUpperCase().substring(0, 2) });
        } else {
          existing.count++;
          if (r.created_at > existing.last) existing.last = r.created_at;
        }
      });
      setRecentConversations(
        Array.from(sessGroups.entries())
          .map(([session_id, data]) => ({
            session_id,
            count: data.count,
            last_active: data.last,
            language: data.lang,
          }))
          .sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime())
          .slice(0, 20)
      );

      // Top questions (from conversation_summary or training_data)
      const { data: trainingItems } = await supabase
        .from('training_data')
        .select('question, usage_count')
        .order('usage_count', { ascending: false })
        .limit(5);

      setTopQuestions(
        (trainingItems || []).map((t: any) => ({
          question: t.question || 'Unknown',
          count: t.usage_count || 0,
        }))
      );
    } catch (err) {
      console.error('ClaraActivity load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-emerald-500" />
            Clara Activity
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live activity feed, metrics, and conversation analytics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3 text-center">
          <MessageSquare className="h-4 w-4 mx-auto mb-1 text-blue-500" />
          <p className="text-xl font-bold">{metrics.activeSessions}</p>
          <p className="text-[10px] text-muted-foreground">Active Sessions</p>
        </Card>
        <Card className="p-3 text-center">
          <TrendingUp className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
          <p className="text-xl font-bold">{metrics.messagesToday}</p>
          <p className="text-[10px] text-muted-foreground">Messages Today</p>
        </Card>
        <Card className="p-3 text-center">
          <Users className="h-4 w-4 mx-auto mb-1 text-purple-500" />
          <p className="text-xl font-bold">{metrics.leadsGenerated}</p>
          <p className="text-[10px] text-muted-foreground">Leads Generated</p>
        </Card>
        <Card className="p-3 text-center">
          <Clock className="h-4 w-4 mx-auto mb-1 text-amber-500" />
          <p className="text-xl font-bold">{metrics.avgMsgsPerSession}</p>
          <p className="text-[10px] text-muted-foreground">Avg Msgs/Session</p>
        </Card>
        <Card className="p-3 text-center">
          <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-red-500" />
          <p className="text-xl font-bold">{metrics.sosHandled}</p>
          <p className="text-[10px] text-muted-foreground">SOS Handled</p>
        </Card>
        <Card className="p-3 text-center">
          <Globe className="h-4 w-4 mx-auto mb-1 text-blue-400" />
          <p className="text-xl font-bold">{metrics.totalMessages}</p>
          <p className="text-[10px] text-muted-foreground">Total Messages</p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversation Volume (7 days) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Conversation Volume (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="messages" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Language Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Language Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] flex items-center justify-center">
              {languageDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languageDist}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {languageDist.map((_, i) => (
                        <Cell key={i} fill={LANG_COLORS[i % LANG_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Questions */}
      {topQuestions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Questions Asked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topQuestions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    dataKey="question"
                    type="category"
                    width={180}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => v.length > 30 ? v.substring(0, 30) + '...' : v}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Conversations Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {recentConversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Session</TableHead>
                  <TableHead className="text-xs">Messages</TableHead>
                  <TableHead className="text-xs">Language</TableHead>
                  <TableHead className="text-xs">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentConversations.map((row) => (
                  <TableRow key={row.session_id}>
                    <TableCell className="text-xs font-mono">
                      {row.session_id?.substring(0, 12)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{row.count}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{row.language}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTime(row.last_active)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClaraActivity;
