import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Activity, Megaphone, ShoppingCart, ListChecks, MessageCircle,
  HeartPulse, Wallet, Zap, Loader2, RefreshCw, CheckCircle,
  XCircle, Clock, AlertTriangle, ArrowRight, Play, Pause,
  DollarSign, Users, Bot, Send, TrendingUp, Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────

interface FeedItem {
  id: string;
  source: string;
  action: string;
  detail: string;
  created_at: string;
  status?: string;
}

interface CampaignRow {
  id: string;
  campaign_name: string;
  channel: string;
  status: string;
  sent_count: number;
  open_rate: number;
  created_at: string;
}

interface SalesAction {
  id: string;
  action_type: string;
  lead_name: string;
  channel: string;
  status: string;
  result: string;
  created_at: string;
}

interface PlanExecution {
  id: string;
  plan_name: string;
  status: string;
  progress: number;
  steps_total: number;
  steps_done: number;
  created_at: string;
  updated_at: string;
}

interface PendingAction {
  id: string;
  action_type: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

interface WhatsAppSignup {
  id: string;
  phone: string;
  name: string;
  step: string;
  status: string;
  created_at: string;
}

interface OpsLogEntry {
  id: string;
  function_name: string;
  status: string;
  message: string;
  duration_ms: number;
  created_at: string;
}

interface BudgetRow {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  currency: string;
  period: string;
}

interface RivenCommand {
  id: string;
  command_type: string;
  payload: string;
  status: string;
  result: string;
  created_at: string;
}

interface RivenPerf {
  id: string;
  metric: string;
  value: number;
  period: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'bg-green-500/10 text-green-500',
    completed: 'bg-blue-500/10 text-blue-500',
    success: 'bg-green-500/10 text-green-500',
    running: 'bg-amber-500/10 text-amber-500',
    pending: 'bg-yellow-500/10 text-yellow-500',
    failed: 'bg-red-500/10 text-red-500',
    error: 'bg-red-500/10 text-red-500',
    paused: 'bg-gray-500/10 text-gray-400',
    queued: 'bg-purple-500/10 text-purple-500',
    sent: 'bg-blue-500/10 text-blue-500',
    draft: 'bg-gray-500/10 text-gray-400',
    approved: 'bg-green-500/10 text-green-500',
    rejected: 'bg-red-500/10 text-red-500',
  };
  return map[status?.toLowerCase()] || 'bg-muted text-muted-foreground';
};

const sourceIcon = (source: string) => {
  switch (source) {
    case 'campaign': return <Megaphone className="h-4 w-4 text-purple-400" />;
    case 'sales': return <ShoppingCart className="h-4 w-4 text-green-400" />;
    case 'plan': return <ListChecks className="h-4 w-4 text-blue-400" />;
    case 'whatsapp': return <MessageCircle className="h-4 w-4 text-emerald-400" />;
    case 'ops': return <HeartPulse className="h-4 w-4 text-red-400" />;
    case 'riven': return <Zap className="h-4 w-4 text-amber-400" />;
    case 'budget': return <Wallet className="h-4 w-4 text-cyan-400" />;
    default: return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

// ─── Data Fetcher ────────────────────────────────────────────────────

const sb = supabase as any;

async function safeQuery<T>(table: string, options?: {
  select?: string;
  order?: string;
  ascending?: boolean;
  limit?: number;
  eq?: [string, string];
}): Promise<T[]> {
  try {
    let q = sb.from(table).select(options?.select || '*');
    if (options?.eq) q = q.eq(options.eq[0], options.eq[1]);
    if (options?.order) q = q.order(options.order, { ascending: options.ascending ?? false });
    if (options?.limit) q = q.limit(options.limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as T[];
  } catch {
    return [];
  }
}

// ─── Main Component ──────────────────────────────────────────────────

export default function ClaraCommandCentre() {
  const [tab, setTab] = useState('feed');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // State for all tabs
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [rivenCommands, setRivenCommands] = useState<RivenCommand[]>([]);
  const [salesActions, setSalesActions] = useState<SalesAction[]>([]);
  const [proactiveInvites, setProactiveInvites] = useState<any[]>([]);
  const [plans, setPlans] = useState<PlanExecution[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [whatsappSignups, setWhatsappSignups] = useState<WhatsAppSignup[]>([]);
  const [whatsappMessages, setWhatsappMessages] = useState<any[]>([]);
  const [opsLog, setOpsLog] = useState<OpsLogEntry[]>([]);
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [rivenPerf, setRivenPerf] = useState<RivenPerf[]>([]);

  // ─── Fetch All Data ──────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const [
      campaignData,
      salesData,
      planData,
      pendingData,
      whatsappSData,
      whatsappMData,
      opsData,
      budgetData,
      rivenCmdData,
      rivenPerfData,
      proactiveData,
    ] = await Promise.all([
      safeQuery<CampaignRow>('clara_campaign_log', { order: 'created_at', limit: 50 }),
      safeQuery<SalesAction>('clara_sales_actions', { order: 'created_at', limit: 50 }),
      safeQuery<PlanExecution>('clara_plan_executions', { order: 'created_at', limit: 30 }),
      safeQuery<PendingAction>('clara_pending_actions', { order: 'created_at', limit: 30 }),
      safeQuery<WhatsAppSignup>('whatsapp_signups', { order: 'created_at', limit: 30 }),
      safeQuery<any>('whatsapp_messages', { order: 'created_at', limit: 30 }),
      safeQuery<OpsLogEntry>('clara_ops_log', { order: 'created_at', limit: 50 }),
      safeQuery<BudgetRow>('clara_budget', { limit: 20 }),
      safeQuery<RivenCommand>('clara_riven_commands', { order: 'created_at', limit: 50 }),
      safeQuery<RivenPerf>('riven_performance', { order: 'created_at', limit: 30 }),
      safeQuery<any>('proactive_invites', { order: 'created_at', limit: 30 }),
    ]);

    setCampaigns(campaignData);
    setSalesActions(salesData);
    setPlans(planData);
    setPendingActions(pendingData);
    setWhatsappSignups(whatsappSData);
    setWhatsappMessages(whatsappMData);
    setOpsLog(opsData);
    setBudgets(budgetData);
    setRivenCommands(rivenCmdData);
    setRivenPerf(rivenPerfData);
    setProactiveInvites(proactiveData);

    // Build unified feed from all sources
    const unified: FeedItem[] = [
      ...campaignData.map(c => ({
        id: `camp-${c.id}`, source: 'campaign', action: c.campaign_name,
        detail: `${c.channel} — ${c.sent_count} sent`, created_at: c.created_at, status: c.status
      })),
      ...salesData.map(s => ({
        id: `sale-${s.id}`, source: 'sales', action: s.action_type,
        detail: `${s.lead_name} via ${s.channel}`, created_at: s.created_at, status: s.status
      })),
      ...planData.map(p => ({
        id: `plan-${p.id}`, source: 'plan', action: p.plan_name,
        detail: `${p.steps_done}/${p.steps_total} steps`, created_at: p.created_at, status: p.status
      })),
      ...opsData.map(o => ({
        id: `ops-${o.id}`, source: 'ops', action: o.function_name,
        detail: o.message, created_at: o.created_at, status: o.status
      })),
      ...rivenCmdData.map(r => ({
        id: `riv-${r.id}`, source: 'riven', action: r.command_type,
        detail: r.payload?.substring(0, 80) || '', created_at: r.created_at, status: r.status
      })),
      ...whatsappSData.map(w => ({
        id: `wa-${w.id}`, source: 'whatsapp', action: `Signup: ${w.step}`,
        detail: w.name || w.phone, created_at: w.created_at, status: w.status
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(0, 100);

    setFeed(unified);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  // ─── Realtime + Polling ──────────────────────────────────────────

  useEffect(() => {
    fetchAll();

    // Realtime subscriptions
    const channel = supabase.channel('clara-command-centre')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clara_sales_actions' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clara_campaign_log' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clara_ops_log' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clara_pending_actions' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clara_plan_executions' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_signups' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clara_riven_commands' }, () => fetchAll())
      .subscribe();

    // 30-second polling fallback
    pollingRef.current = setInterval(fetchAll, 30000);

    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchAll]);

  // ─── Counts for badges ───────────────────────────────────────────

  const pendingApprovals = pendingActions.filter(a => a.status === 'pending').length;
  const criticalOps = opsLog.filter(o => o.status === 'error' || o.status === 'failed').length;
  const activePlans = plans.filter(p => p.status === 'running' || p.status === 'active').length;
  const queuedRiven = rivenCommands.filter(r => r.status === 'queued' || r.status === 'pending').length;

  // ─── Approve / Reject pending actions ────────────────────────────

  const updatePending = async (id: string, newStatus: string) => {
    try {
      await sb.from('clara_pending_actions').update({ status: newStatus }).eq('id', id);
      setPendingActions(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      console.error('Failed to update pending action:', err);
    }
  };

  // ─── Tab badge helper ────────────────────────────────────────────

  const tabBadge = (count: number, color: string = 'bg-red-500') =>
    count > 0 ? <span className={`ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full text-[10px] font-bold text-white ${color}`}>{count}</span> : null;

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-amber-500" />
            CLARA Command Centre
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time view of everything CLARA is doing across all channels
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <MiniStat icon={<Activity className="h-4 w-4" />} label="Feed items" value={feed.length} />
        <MiniStat icon={<Megaphone className="h-4 w-4" />} label="Campaigns" value={campaigns.length} />
        <MiniStat icon={<ShoppingCart className="h-4 w-4" />} label="Sales" value={salesActions.length} />
        <MiniStat icon={<ListChecks className="h-4 w-4" />} label="Plans" value={activePlans} color="text-blue-400" />
        <MiniStat icon={<MessageCircle className="h-4 w-4" />} label="WA Signups" value={whatsappSignups.length} />
        <MiniStat icon={<HeartPulse className="h-4 w-4" />} label="Ops Errors" value={criticalOps} color={criticalOps > 0 ? 'text-red-400' : undefined} />
        <MiniStat icon={<Clock className="h-4 w-4" />} label="Pending" value={pendingApprovals} color={pendingApprovals > 0 ? 'text-amber-400' : undefined} />
        <MiniStat icon={<Zap className="h-4 w-4" />} label="Riven Queue" value={queuedRiven} />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="feed" className="text-xs">Live Feed</TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs">Campaigns {tabBadge(campaigns.length, 'bg-purple-500')}</TabsTrigger>
          <TabsTrigger value="sales" className="text-xs">Sales {tabBadge(salesActions.length, 'bg-green-600')}</TabsTrigger>
          <TabsTrigger value="plans" className="text-xs">Plans {tabBadge(pendingApprovals, 'bg-amber-500')}</TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs">WhatsApp {tabBadge(whatsappSignups.length, 'bg-emerald-500')}</TabsTrigger>
          <TabsTrigger value="ops" className="text-xs">Ops {tabBadge(criticalOps, 'bg-red-500')}</TabsTrigger>
          <TabsTrigger value="budget" className="text-xs">Budget</TabsTrigger>
          <TabsTrigger value="riven" className="text-xs">Riven {tabBadge(queuedRiven, 'bg-amber-500')}</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Live Feed ─────────────────────────────────────── */}
        <TabsContent value="feed">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live Activity Feed</CardTitle>
              <CardDescription>Unified chronological feed from all CLARA systems</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <LoadingState /> : feed.length === 0 ? (
                <EmptyState message="No activity recorded yet" />
              ) : (
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  {feed.map(item => (
                    <div key={item.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 text-sm">
                      {sourceIcon(item.source)}
                      <Badge variant="outline" className="text-[10px] w-16 justify-center">{item.source}</Badge>
                      <span className="font-medium truncate max-w-[200px]">{item.action}</span>
                      <span className="text-muted-foreground truncate flex-1">{item.detail}</span>
                      {item.status && (
                        <Badge className={`${statusBadge(item.status)} text-[10px]`} variant="secondary">{item.status}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(item.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Campaigns ─────────────────────────────────────── */}
        <TabsContent value="campaigns">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Campaigns" value={campaigns.length} icon={<Megaphone className="h-5 w-5 text-purple-400" />} />
              <StatCard title="Active" value={campaigns.filter(c => c.status === 'active' || c.status === 'running').length} icon={<Play className="h-5 w-5 text-green-400" />} />
              <StatCard title="Avg Open Rate" value={`${campaigns.length > 0 ? Math.round(campaigns.reduce((s, c) => s + (c.open_rate || 0), 0) / campaigns.length) : 0}%`} icon={<Eye className="h-5 w-5 text-blue-400" />} />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Campaign Log</CardTitle></CardHeader>
              <CardContent>
                {campaigns.length === 0 ? <EmptyState message="No campaigns recorded" /> : (
                  <DataTable
                    headers={['Campaign', 'Channel', 'Status', 'Sent', 'Open Rate', 'Date']}
                    rows={campaigns.map(c => [
                      c.campaign_name,
                      c.channel,
                      <Badge key={c.id} className={`${statusBadge(c.status)} text-[10px]`} variant="secondary">{c.status}</Badge>,
                      String(c.sent_count || 0),
                      `${c.open_rate || 0}%`,
                      timeAgo(c.created_at),
                    ])}
                  />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Riven Command Queue</CardTitle></CardHeader>
              <CardContent>
                {rivenCommands.length === 0 ? <EmptyState message="No Riven commands" /> : (
                  <DataTable
                    headers={['Command', 'Status', 'Result', 'Date']}
                    rows={rivenCommands.slice(0, 20).map(r => [
                      r.command_type,
                      <Badge key={r.id} className={`${statusBadge(r.status)} text-[10px]`} variant="secondary">{r.status}</Badge>,
                      <span key={`r-${r.id}`} className="truncate max-w-[200px] inline-block">{r.result || '—'}</span>,
                      timeAgo(r.created_at),
                    ])}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 3: Sales Pipeline ────────────────────────────────── */}
        <TabsContent value="sales">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Sales Actions" value={salesActions.length} icon={<ShoppingCart className="h-5 w-5 text-green-400" />} />
              <StatCard title="Proactive Invites" value={proactiveInvites.length} icon={<Send className="h-5 w-5 text-blue-400" />} />
              <StatCard title="Converted" value={salesActions.filter(s => s.status === 'completed' || s.status === 'converted').length} icon={<CheckCircle className="h-5 w-5 text-emerald-400" />} />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Sales Actions</CardTitle></CardHeader>
              <CardContent>
                {salesActions.length === 0 ? <EmptyState message="No sales actions yet" /> : (
                  <DataTable
                    headers={['Action', 'Lead', 'Channel', 'Status', 'Result', 'Date']}
                    rows={salesActions.map(s => [
                      s.action_type,
                      s.lead_name,
                      s.channel,
                      <Badge key={s.id} className={`${statusBadge(s.status)} text-[10px]`} variant="secondary">{s.status}</Badge>,
                      s.result || '—',
                      timeAgo(s.created_at),
                    ])}
                  />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Proactive Invites</CardTitle></CardHeader>
              <CardContent>
                {proactiveInvites.length === 0 ? <EmptyState message="No proactive invites" /> : (
                  <DataTable
                    headers={['Name', 'Channel', 'Status', 'Date']}
                    rows={proactiveInvites.map((p: any) => [
                      p.name || p.phone || p.email || '—',
                      p.channel || '—',
                      <Badge key={p.id} className={`${statusBadge(p.status || 'pending')} text-[10px]`} variant="secondary">{p.status || 'pending'}</Badge>,
                      timeAgo(p.created_at),
                    ])}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 4: Plan Executions ───────────────────────────────── */}
        <TabsContent value="plans">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Active Plans" value={activePlans} icon={<Play className="h-5 w-5 text-blue-400" />} />
              <StatCard title="Pending Approvals" value={pendingApprovals} icon={<Clock className="h-5 w-5 text-amber-400" />} />
              <StatCard title="Completed" value={plans.filter(p => p.status === 'completed').length} icon={<CheckCircle className="h-5 w-5 text-green-400" />} />
            </div>

            {/* Active plans with progress */}
            {plans.filter(p => p.status === 'running' || p.status === 'active').length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Active Plans</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {plans.filter(p => p.status === 'running' || p.status === 'active').map(p => (
                    <div key={p.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{p.plan_name}</span>
                        <span className="text-xs text-muted-foreground">{p.steps_done}/{p.steps_total} steps</span>
                      </div>
                      <Progress value={p.steps_total > 0 ? (p.steps_done / p.steps_total) * 100 : 0} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Pending approvals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Pending Approvals {pendingApprovals > 0 && <Badge className="ml-2 bg-amber-500/10 text-amber-500">{pendingApprovals}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingActions.length === 0 ? <EmptyState message="No pending actions" /> : (
                  <div className="space-y-2">
                    {pendingActions.map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{a.action_type}</p>
                          <p className="text-xs text-muted-foreground">{a.description}</p>
                        </div>
                        <Badge className={`${statusBadge(a.priority)} text-[10px]`} variant="secondary">{a.priority}</Badge>
                        <Badge className={`${statusBadge(a.status)} text-[10px]`} variant="secondary">{a.status}</Badge>
                        {a.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs text-green-500" onClick={() => updatePending(a.id, 'approved')}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-500" onClick={() => updatePending(a.id, 'rejected')}>
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan history */}
            <Card>
              <CardHeader><CardTitle className="text-base">Plan History</CardTitle></CardHeader>
              <CardContent>
                {plans.length === 0 ? <EmptyState message="No plan executions" /> : (
                  <DataTable
                    headers={['Plan', 'Status', 'Progress', 'Started', 'Updated']}
                    rows={plans.map(p => [
                      p.plan_name,
                      <Badge key={p.id} className={`${statusBadge(p.status)} text-[10px]`} variant="secondary">{p.status}</Badge>,
                      `${p.steps_done}/${p.steps_total}`,
                      timeAgo(p.created_at),
                      timeAgo(p.updated_at || p.created_at),
                    ])}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 5: WhatsApp Activity ─────────────────────────────── */}
        <TabsContent value="whatsapp">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Signup Flows" value={whatsappSignups.length} icon={<MessageCircle className="h-5 w-5 text-emerald-400" />} />
              <StatCard title="Completed" value={whatsappSignups.filter(w => w.status === 'completed').length} icon={<CheckCircle className="h-5 w-5 text-green-400" />} />
              <StatCard title="Messages" value={whatsappMessages.length} icon={<Send className="h-5 w-5 text-blue-400" />} />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">WhatsApp Signups</CardTitle></CardHeader>
              <CardContent>
                {whatsappSignups.length === 0 ? <EmptyState message="No WhatsApp signups" /> : (
                  <DataTable
                    headers={['Name', 'Phone', 'Step', 'Status', 'Date']}
                    rows={whatsappSignups.map(w => [
                      w.name || '—',
                      w.phone,
                      w.step,
                      <Badge key={w.id} className={`${statusBadge(w.status)} text-[10px]`} variant="secondary">{w.status}</Badge>,
                      timeAgo(w.created_at),
                    ])}
                  />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Messages</CardTitle></CardHeader>
              <CardContent>
                {whatsappMessages.length === 0 ? <EmptyState message="No messages" /> : (
                  <DataTable
                    headers={['From', 'Direction', 'Message', 'Date']}
                    rows={whatsappMessages.slice(0, 30).map((m: any) => [
                      m.phone || m.from_number || '—',
                      m.direction || m.type || '—',
                      <span key={m.id} className="truncate max-w-[300px] inline-block">{m.body || m.message || '—'}</span>,
                      timeAgo(m.created_at),
                    ])}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 6: Ops & Health ──────────────────────────────────── */}
        <TabsContent value="ops">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Ops" value={opsLog.length} icon={<HeartPulse className="h-5 w-5 text-blue-400" />} />
              <StatCard title="Errors" value={criticalOps} icon={<AlertTriangle className="h-5 w-5 text-red-400" />} />
              <StatCard title="Avg Duration" value={`${opsLog.length > 0 ? Math.round(opsLog.reduce((s, o) => s + (o.duration_ms || 0), 0) / opsLog.length) : 0}ms`} icon={<Clock className="h-5 w-5 text-amber-400" />} />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Operations Log</CardTitle></CardHeader>
              <CardContent>
                {opsLog.length === 0 ? <EmptyState message="No ops log entries" /> : (
                  <DataTable
                    headers={['Function', 'Status', 'Message', 'Duration', 'Date']}
                    rows={opsLog.map(o => [
                      o.function_name,
                      <Badge key={o.id} className={`${statusBadge(o.status)} text-[10px]`} variant="secondary">{o.status}</Badge>,
                      <span key={`m-${o.id}`} className="truncate max-w-[250px] inline-block">{o.message || '—'}</span>,
                      o.duration_ms ? `${o.duration_ms}ms` : '—',
                      timeAgo(o.created_at),
                    ])}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 7: Budget ────────────────────────────────────────── */}
        <TabsContent value="budget">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Total Allocated"
                value={`€${budgets.reduce((s, b) => s + (b.allocated || 0), 0).toFixed(0)}`}
                icon={<Wallet className="h-5 w-5 text-cyan-400" />}
              />
              <StatCard
                title="Total Spent"
                value={`€${budgets.reduce((s, b) => s + (b.spent || 0), 0).toFixed(0)}`}
                icon={<DollarSign className="h-5 w-5 text-red-400" />}
              />
              <StatCard
                title="Remaining"
                value={`€${(budgets.reduce((s, b) => s + (b.allocated || 0), 0) - budgets.reduce((s, b) => s + (b.spent || 0), 0)).toFixed(0)}`}
                icon={<TrendingUp className="h-5 w-5 text-green-400" />}
              />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Budget Breakdown</CardTitle></CardHeader>
              <CardContent>
                {budgets.length === 0 ? <EmptyState message="No budget data" /> : (
                  <div className="space-y-4">
                    {budgets.map(b => {
                      const pct = b.allocated > 0 ? Math.min(100, (b.spent / b.allocated) * 100) : 0;
                      const isOver = pct > 90;
                      return (
                        <div key={b.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{b.category}</span>
                            <span className={`text-xs ${isOver ? 'text-red-400' : 'text-muted-foreground'}`}>
                              €{(b.spent || 0).toFixed(0)} / €{(b.allocated || 0).toFixed(0)} ({b.period || 'monthly'})
                            </span>
                          </div>
                          <Progress value={pct} className={`h-2 ${isOver ? '[&>div]:bg-red-500' : ''}`} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 8: Riven ─────────────────────────────────────────── */}
        <TabsContent value="riven">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Commands" value={rivenCommands.length} icon={<Zap className="h-5 w-5 text-amber-400" />} />
              <StatCard title="Queued" value={queuedRiven} icon={<Clock className="h-5 w-5 text-purple-400" />} />
              <StatCard title="Performance Metrics" value={rivenPerf.length} icon={<TrendingUp className="h-5 w-5 text-blue-400" />} />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Command Queue</CardTitle></CardHeader>
              <CardContent>
                {rivenCommands.length === 0 ? <EmptyState message="No Riven commands" /> : (
                  <DataTable
                    headers={['Command', 'Status', 'Result', 'Date']}
                    rows={rivenCommands.map(r => [
                      r.command_type,
                      <Badge key={r.id} className={`${statusBadge(r.status)} text-[10px]`} variant="secondary">{r.status}</Badge>,
                      <span key={`r-${r.id}`} className="truncate max-w-[200px] inline-block">{r.result || '—'}</span>,
                      timeAgo(r.created_at),
                    ])}
                  />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Performance Data</CardTitle></CardHeader>
              <CardContent>
                {rivenPerf.length === 0 ? <EmptyState message="No performance data" /> : (
                  <DataTable
                    headers={['Metric', 'Value', 'Period', 'Date']}
                    rows={rivenPerf.map(r => [
                      r.metric,
                      String(r.value),
                      r.period || '—',
                      timeAgo(r.created_at),
                    ])}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color?: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className={`text-lg font-bold leading-none ${color || ''}`}>{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Bot className="h-10 w-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm">{message}</p>
      <p className="text-xs mt-1">Data will appear here as CLARA starts operating</p>
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            {headers.map(h => <th key={h} className="pb-2 pr-3 font-medium text-xs text-muted-foreground">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
              {row.map((cell, j) => <td key={j} className="py-2 pr-3">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
