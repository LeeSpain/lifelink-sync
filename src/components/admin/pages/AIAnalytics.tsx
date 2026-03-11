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
  BarChart3,
  MessageSquare,
  Clock,
  TrendingUp,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

type DateRange = '7d' | '30d' | '90d';

interface DailyInteraction {
  date: string;
  clara: number;
  riven: number;
}

interface ContentPerformance {
  id: string;
  title: string;
  platform: string;
  status: string;
  created_at: string;
}

const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'];

const AIAnalytics = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>('7d');
  const [kpis, setKpis] = useState({
    totalInteractions: 0,
    avgResponseTime: '< 2s',
    leadsGenerated: 0,
    estimatedCost: '$0',
  });
  const [dailyData, setDailyData] = useState<DailyInteraction[]>([]);
  const [topTopics, setTopTopics] = useState<{ topic: string; count: number }[]>([]);
  const [langDist, setLangDist] = useState<{ name: string; value: number }[]>([]);
  const [topContent, setTopContent] = useState<ContentPerformance[]>([]);

  const getDaysFromRange = (r: DateRange) => {
    switch (r) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const days = getDaysFromRange(range);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      const startISO = startDate.toISOString();

      // KPIs
      const [claraCount, rivenCount, leadsCount] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }).gte('created_at', startISO),
        supabase.from('marketing_content').select('id', { count: 'exact', head: true }).gte('created_at', startISO),
        supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', startISO),
      ]);

      const totalClara = claraCount.count ?? 0;
      const totalRiven = rivenCount.count ?? 0;
      const total = totalClara + totalRiven;

      // Cost estimate: ~$0.001 per Clara message, ~$0.01 per Riven generation
      const cost = (totalClara * 0.001 + totalRiven * 0.01).toFixed(2);

      setKpis({
        totalInteractions: total,
        avgResponseTime: '< 2s',
        leadsGenerated: leadsCount.count ?? 0,
        estimatedCost: `$${cost}`,
      });

      // Daily interactions (Clara vs Riven)
      const dailyArr: DailyInteraction[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const nextD = new Date(d);
        nextD.setDate(nextD.getDate() + 1);
        const dISO = d.toISOString();
        const nISO = nextD.toISOString();

        const [cC, rC] = await Promise.all([
          supabase.from('conversations').select('id', { count: 'exact', head: true }).gte('created_at', dISO).lt('created_at', nISO),
          supabase.from('marketing_content').select('id', { count: 'exact', head: true }).gte('created_at', dISO).lt('created_at', nISO),
        ]);

        const label = days <= 7
          ? d.toLocaleDateString([], { weekday: 'short' })
          : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

        dailyArr.push({
          date: label,
          clara: cC.count ?? 0,
          riven: rC.count ?? 0,
        });
      }
      setDailyData(dailyArr);

      // Top conversation topics (from training_data)
      const { data: topics } = await supabase
        .from('training_data')
        .select('category, usage_count')
        .order('usage_count', { ascending: false })
        .limit(5);

      setTopTopics(
        (topics || []).map((t: any) => ({
          topic: t.category || 'General',
          count: t.usage_count || 0,
        }))
      );

      // Language distribution
      const { data: langData } = await supabase
        .from('conversations')
        .select('metadata')
        .gte('created_at', startISO)
        .not('metadata', 'is', null)
        .limit(500);

      const langMap = new Map<string, number>();
      (langData || []).forEach((r: any) => {
        const lang = r.metadata?.language || r.metadata?.lang || 'EN';
        const key = String(lang).toUpperCase().substring(0, 2);
        langMap.set(key, (langMap.get(key) || 0) + 1);
      });
      if (langMap.size === 0 && totalClara > 0) {
        langMap.set('EN', totalClara);
      }
      setLangDist(
        Array.from(langMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );

      // Best performing Riven content
      const { data: bestContent } = await supabase
        .from('marketing_content')
        .select('id, title, platform, status, created_at')
        .gte('created_at', startISO)
        .order('created_at', { ascending: false })
        .limit(10);

      setTopContent(bestContent || []);
    } catch (err) {
      toast({ title: 'Load Error', description: 'Failed to load AI analytics data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {t('ai.analytics.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('ai.analytics.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as DateRange[]).map((r) => (
            <Button
              key={r}
              variant={range === r ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setRange(r)}
            >
              {r}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-7">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <MessageSquare className="h-4 w-4 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{kpis.totalInteractions.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{t('ai.analytics.totalInteractions')}</p>
        </Card>
        <Card className="p-3 text-center">
          <Clock className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
          <p className="text-2xl font-bold">{kpis.avgResponseTime}</p>
          <p className="text-[10px] text-muted-foreground">{t('ai.analytics.avgResponseTime')}</p>
        </Card>
        <Card className="p-3 text-center">
          <TrendingUp className="h-4 w-4 mx-auto mb-1 text-purple-500" />
          <p className="text-2xl font-bold">{kpis.leadsGenerated}</p>
          <p className="text-[10px] text-muted-foreground">{t('ai.analytics.leadsGenerated')}</p>
        </Card>
        <Card className="p-3 text-center">
          <DollarSign className="h-4 w-4 mx-auto mb-1 text-amber-500" />
          <p className="text-2xl font-bold">{kpis.estimatedCost}</p>
          <p className="text-[10px] text-muted-foreground">{t('ai.analytics.estCost')}</p>
        </Card>
      </div>

      {/* Daily Interactions Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('ai.analytics.dailyInteractions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="clara" name="Clara" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="riven" name="Riven" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Topics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('ai.analytics.topTopics')}</CardTitle>
          </CardHeader>
          <CardContent>
            {topTopics.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTopics}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="topic" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">{t('ai.analytics.noTopicData')}</p>
            )}
          </CardContent>
        </Card>

        {/* Language Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('ai.analytics.languageDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            {langDist.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={langDist}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {langDist.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">{t('ai.analytics.noLanguageData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Best Performing Content */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('ai.analytics.recentRivenContent')}</CardTitle>
        </CardHeader>
        <CardContent>
          {topContent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('ai.analytics.noContent')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t('ai.analytics.titleCol')}</TableHead>
                  <TableHead className="text-xs">{t('ai.analytics.platform')}</TableHead>
                  <TableHead className="text-xs">{t('ai.analytics.status')}</TableHead>
                  <TableHead className="text-xs">{t('ai.analytics.created')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topContent.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs max-w-[250px] truncate">{item.title || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{item.platform}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          item.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : item.status === 'scheduled'
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAnalytics;
