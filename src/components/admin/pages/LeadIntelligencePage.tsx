import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, TrendingUp, Flame, Clock, AlertCircle,
  Loader2, Zap, Target, BarChart3, Users,
} from 'lucide-react';

interface LeadRow {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  lead_source?: string;
  lead_score?: number;
  interest_level?: number;
  status?: string;
  language?: string;
  last_contacted_at?: string;
  next_follow_up_at?: string;
  created_at: string;
}

interface ClaraInsight {
  title: string;
  insight: string;
  action: string;
  icon: string;
}

const LeadIntelligencePage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, hot: 0, stale: 0, followUpsDue: 0, avgScore: 0, conversionRate: 0, pipelineValue: 0 });
  const [scoreBuckets, setScoreBuckets] = useState({ cold: 0, cool: 0, warm: 0, hot: 0, veryHot: 0 });
  const [sourceBreakdown, setSourceBreakdown] = useState<Array<{ lead_source: string; count: number }>>([]);
  const [hotLeadsList, setHotLeadsList] = useState<LeadRow[]>([]);
  const [followUpList, setFollowUpList] = useState<LeadRow[]>([]);
  const [staleList, setStaleList] = useState<LeadRow[]>([]);
  const [claraInsights, setClaraInsights] = useState<ClaraInsight[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadIntelligence();
  }, []);

  const loadIntelligence = async () => {
    setLoading(true);
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const now = new Date().toISOString();

      const [allLeadsRes, hotRes, followUpRes, staleRes] = await Promise.all([
        supabase.from('leads').select('id, lead_score, lead_source, status, last_contacted_at, next_follow_up_at, created_at'),
        supabase.from('leads').select('*').gte('lead_score', 70).neq('status', 'converted').order('lead_score', { ascending: false }).limit(8),
        supabase.from('leads').select('*').lte('next_follow_up_at', now).not('status', 'in', '(converted,lost)').order('next_follow_up_at', { ascending: true }).limit(8),
        supabase.from('leads').select('*').or(`last_contacted_at.lt.${sevenDaysAgo},last_contacted_at.is.null`).not('status', 'in', '(converted,lost)').order('created_at', { ascending: true }).limit(8),
      ]);

      const leads = allLeadsRes.data || [];
      const total = leads.length;
      const hot = leads.filter(l => (l.lead_score || 0) >= 70).length;
      const staleCount = (staleRes.data || []).length;
      const followUpsDue = (followUpRes.data || []).length;
      const avgScore = total > 0 ? Math.round(leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / total) : 0;
      const converted = leads.filter(l => l.status === 'converted').length;
      const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
      const activeLeads = leads.filter(l => l.status !== 'converted' && l.status !== 'lost').length;

      setStats({ total, hot, stale: staleCount, followUpsDue, avgScore, conversionRate, pipelineValue: Math.round(activeLeads * 9.99) });

      setScoreBuckets({
        cold: leads.filter(l => (l.lead_score || 0) <= 20).length,
        cool: leads.filter(l => (l.lead_score || 0) > 20 && (l.lead_score || 0) <= 40).length,
        warm: leads.filter(l => (l.lead_score || 0) > 40 && (l.lead_score || 0) <= 60).length,
        hot: leads.filter(l => (l.lead_score || 0) > 60 && (l.lead_score || 0) <= 80).length,
        veryHot: leads.filter(l => (l.lead_score || 0) > 80).length,
      });

      // Source breakdown
      const counts: Record<string, number> = {};
      leads.forEach(l => { const src = l.lead_source || 'unknown'; counts[src] = (counts[src] || 0) + 1; });
      setSourceBreakdown(Object.entries(counts).map(([lead_source, count]) => ({ lead_source, count })).sort((a, b) => b.count - a.count));

      setHotLeadsList(hotRes.data || []);
      setFollowUpList(followUpRes.data || []);
      setStaleList(staleRes.data || []);
    } catch (e) {
      console.error('Load intelligence error:', e);
    } finally {
      setLoading(false);
    }
  };

  const runClaraAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `You are CLARA, the AI assistant for LifeLink Sync. Analyze this sales pipeline data and give Lee 3 specific, actionable insights.

Total leads: ${stats.total}
Hot leads (score 70+): ${stats.hot}
Stale leads (7+ days no contact): ${stats.stale}
Follow-ups due: ${stats.followUpsDue}
Average score: ${stats.avgScore}/100
Pipeline value: ${stats.pipelineValue} EUR/month
Conversion rate: ${stats.conversionRate}%
Top source: ${sourceBreakdown[0]?.lead_source || 'unknown'} (${sourceBreakdown[0]?.count || 0} leads)

For each insight: give a specific observation, one clear action Lee should take, keep under 3 sentences.

Return as JSON array of 3 objects: [{"title":"","insight":"","action":"","icon":""}]
Icons: fire, target, clock, trending-up, alert, zap`,
          language: 'en',
          isOwnerPersonal: true,
        },
      });

      const text = data?.response || data?.reply || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        setClaraInsights(JSON.parse(jsonMatch[0]));
      } else {
        throw new Error('No JSON');
      }
    } catch {
      setClaraInsights([
        { title: 'Focus on hot leads', insight: `You have ${stats.hot} hot leads scoring 70+. These are your best conversion opportunities right now.`, action: 'Contact hot leads', icon: 'fire' },
        { title: 'Chase stale pipeline', insight: `${stats.stale} leads haven't been contacted in 7+ days. A quick WhatsApp could reactivate them.`, action: 'Send follow-ups', icon: 'clock' },
        { title: 'Follow-up queue', insight: `${stats.followUpsDue} follow-ups are overdue. Clearing these today could significantly boost conversion.`, action: 'Clear follow-ups', icon: 'alert' },
      ]);
    } finally {
      setAnalyzing(false);
    }
  };

  const getInsightIcon = (icon: string) => {
    const cls = 'w-5 h-5';
    switch (icon) {
      case 'fire': return <Flame className={`${cls} text-red-500`} />;
      case 'target': return <Target className={`${cls} text-blue-500`} />;
      case 'clock': return <Clock className={`${cls} text-amber-500`} />;
      case 'trending-up': return <TrendingUp className={`${cls} text-green-500`} />;
      case 'alert': return <AlertCircle className={`${cls} text-red-500`} />;
      case 'zap': return <Zap className={`${cls} text-purple-500`} />;
      default: return <BarChart3 className={`${cls} text-gray-500`} />;
    }
  };

  const timeAgo = (date: string) => {
    const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    return `${d}d ago`;
  };

  const getInitials = (lead: LeadRow) => {
    const f = lead.first_name?.[0] || lead.full_name?.[0] || '?';
    const l = lead.last_name?.[0] || '';
    return (f + l).toUpperCase();
  };

  const getName = (lead: LeadRow) => lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email || 'Unknown';

  const sourceColors: Record<string, string> = {
    manual_invite: 'bg-blue-400', clara_invite: 'bg-purple-400', whatsapp_chat: 'bg-green-400',
    contact_form: 'bg-amber-400', referral: 'bg-pink-400', website: 'bg-indigo-400', unknown: 'bg-gray-400',
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto w-full flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const bucketEntries = [
    { label: 'Very hot', count: scoreBuckets.veryHot, color: 'bg-red-500' },
    { label: 'Hot', count: scoreBuckets.hot, color: 'bg-orange-500' },
    { label: 'Warm', count: scoreBuckets.warm, color: 'bg-amber-400' },
    { label: 'Cool', count: scoreBuckets.cool, color: 'bg-blue-400' },
    { label: 'Cold', count: scoreBuckets.cold, color: 'bg-gray-400' },
  ];

  const renderLeadRow = (lead: LeadRow, rightContent: React.ReactNode) => (
    <div key={lead.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2" onClick={() => navigate('/admin-dashboard/leads')}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{getInitials(lead)}</div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{getName(lead)}</p>
          <p className="text-xs text-gray-400">{lead.lead_source || 'unknown'} · {timeAgo(lead.created_at)}</p>
        </div>
      </div>
      {rightContent}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Intelligence</h1>
          <p className="text-sm text-gray-500">AI-powered scoring and pipeline insights</p>
        </div>
        <Button onClick={runClaraAnalysis} disabled={analyzing} className="bg-red-500 hover:bg-red-600 text-white">
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
          Run CLARA Analysis
        </Button>
      </div>

      {/* Row 1: 5 stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <Card><CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.pipelineValue}</p><p className="text-xs text-gray-400">Potential MRR</p></div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.avgScore}/100</p><p className="text-xs text-gray-400">Avg lead score</p></div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><Flame className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.hot}</p><p className="text-xs text-gray-400">Hot leads (70+)</p></div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.followUpsDue}</p><p className="text-xs text-gray-400">Follow-ups due</p></div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{stats.stale}</p><p className="text-xs text-gray-400">Needs attention</p></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Row 2: Score distribution + Source breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-gray-700">Lead score distribution</CardTitle></CardHeader>
          <CardContent>
            {bucketEntries.map(b => (
              <div key={b.label} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 w-20">{b.label}</span>
                  <span className="text-xs font-bold text-gray-700 w-6 text-right">{b.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${b.color} rounded-full transition-all`} style={{ width: `${stats.total > 0 ? (b.count / stats.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-gray-700">Leads by source</CardTitle></CardHeader>
          <CardContent>
            {sourceBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No data</p>
            ) : sourceBreakdown.map(s => (
              <div key={s.lead_source} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${sourceColors[s.lead_source] || 'bg-gray-400'}`} />
                  <span className="text-sm text-gray-700">{s.lead_source.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                    <div className={`h-full ${sourceColors[s.lead_source] || 'bg-gray-400'} rounded-full`} style={{ width: `${stats.total > 0 ? (s.count / stats.total) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-8 text-right">{s.count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Hot / Follow-ups / Stale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Hot leads — act now</CardTitle>
            <p className="text-xs text-gray-400">Score 70+, not yet converted</p>
          </CardHeader>
          <CardContent>
            {hotLeadsList.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">None</p> : hotLeadsList.map(lead =>
              renderLeadRow(lead, (
                <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{lead.lead_score}</span>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Follow-ups due</CardTitle>
            <p className="text-xs text-gray-400">Scheduled follow-up past due</p>
          </CardHeader>
          <CardContent>
            {followUpList.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">None overdue</p> : followUpList.map(lead => {
              const daysPast = lead.next_follow_up_at ? Math.floor((Date.now() - new Date(lead.next_follow_up_at).getTime()) / 86400000) : 0;
              return renderLeadRow(lead, (
                <span className={`text-xs ${daysPast > 2 ? 'text-red-600 font-bold' : 'text-amber-600'}`}>{daysPast}d overdue</span>
              ));
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Stale — no contact</CardTitle>
            <p className="text-xs text-gray-400">No contact in 7+ days</p>
          </CardHeader>
          <CardContent>
            {staleList.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">All contacted recently</p> : staleList.map(lead => {
              const days = lead.last_contacted_at ? Math.floor((Date.now() - new Date(lead.last_contacted_at).getTime()) / 86400000) : 999;
              return renderLeadRow(lead, (
                <span className={`text-xs ${days > 14 ? 'text-red-600 font-bold' : 'text-amber-600'}`}>{days > 900 ? 'Never' : `${days}d`}</span>
              ));
            })}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: CLARA Intelligence Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-red-500" /> CLARA Intelligence
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">AI-generated insights about your pipeline</p>
            </div>
            {claraInsights.length === 0 && (
              <Button variant="outline" size="sm" onClick={runClaraAnalysis} disabled={analyzing}>
                {analyzing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                Analyze
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {claraInsights.length === 0 && !analyzing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Pipeline health', 'Best leads to contact today', 'Conversion opportunities'].map(title => (
                <div key={title} className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-5 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={runClaraAnalysis}>
                  <BarChart3 className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500">{title}</p>
                  <p className="text-xs text-gray-400 mt-1">Click to analyze</p>
                </div>
              ))}
            </div>
          ) : analyzing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-red-400 mr-3" />
              <span className="text-sm text-gray-500">CLARA is analyzing your pipeline...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {claraInsights.map((insight, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {getInsightIcon(insight.icon)}
                    <h3 className="font-bold text-gray-900 text-sm">{insight.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{insight.insight}</p>
                  <button className="w-full py-2 bg-red-50 text-red-700 rounded-xl text-xs font-semibold hover:bg-red-100 border border-red-200 transition-colors" onClick={() => navigate('/admin-dashboard/leads')}>
                    {insight.action} &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadIntelligencePage;
