import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  TrendingUp, Megaphone, Settings, Zap, BookOpen, UserPlus,
  MessageSquare, Loader2, RefreshCw, CheckCircle, XCircle,
  Clock, AlertTriangle, Play, Pause, DollarSign, Users, Bot,
  Send, Eye, Lock, Unlock, RotateCcw, Monitor, ChevronDown,
  ChevronRight, Flame, Thermometer, Snowflake
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ─── Safe query helper ───────────────────────────────────────────────

const sb = supabase as any;

async function sq<T>(table: string, opts?: {
  select?: string; order?: string; ascending?: boolean;
  limit?: number; eq?: [string, string]; neq?: [string, string];
  gte?: [string, string]; in_?: [string, string[]];
  count?: boolean; head?: boolean;
}): Promise<{ data: T[]; count: number }> {
  try {
    let q = sb.from(table).select(opts?.select || '*', opts?.count ? { count: 'exact', head: opts?.head } : undefined);
    if (opts?.eq) q = q.eq(opts.eq[0], opts.eq[1]);
    if (opts?.neq) q = q.neq(opts.neq[0], opts.neq[1]);
    if (opts?.gte) q = q.gte(opts.gte[0], opts.gte[1]);
    if (opts?.in_) q = q.in(opts.in_[0], opts.in_[1]);
    if (opts?.order) q = q.order(opts.order, { ascending: opts.ascending ?? false });
    if (opts?.limit) q = q.limit(opts.limit);
    const res = await q;
    if (res.error) throw res.error;
    return { data: (res.data || []) as T[], count: res.count ?? (res.data || []).length };
  } catch {
    return { data: [], count: 0 };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

const timeAgo = (d: string) => {
  if (!d) return '—';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const statusClass = (s: string) => {
  const map: Record<string, string> = {
    active: 'bg-green-500/10 text-green-500', running: 'bg-green-500/10 text-green-500',
    complete: 'bg-teal-500/10 text-teal-500', completed: 'bg-teal-500/10 text-teal-500',
    converted: 'bg-teal-500/10 text-teal-500', success: 'bg-green-500/10 text-green-500',
    approved: 'bg-blue-500/10 text-blue-500', sent: 'bg-blue-500/10 text-blue-500',
    pending: 'bg-yellow-500/10 text-yellow-500', in_progress: 'bg-amber-500/10 text-amber-500',
    draft: 'bg-gray-500/10 text-gray-400', paused: 'bg-amber-500/10 text-amber-500',
    failed: 'bg-red-500/10 text-red-500', error: 'bg-red-500/10 text-red-500',
    rejected: 'bg-red-500/10 text-red-500', cancelled: 'bg-gray-500/10 text-gray-400',
    opted_out: 'bg-gray-500/10 text-gray-400', queued: 'bg-purple-500/10 text-purple-500',
    executing: 'bg-blue-500/10 text-blue-400',
    info: 'bg-blue-500/10 text-blue-400', warning: 'bg-amber-500/10 text-amber-400',
    critical: 'bg-red-500/10 text-red-500',
  };
  return map[s?.toLowerCase()] || 'bg-muted text-muted-foreground';
};

const pctColor = (pct: number) => pct > 80 ? 'text-red-400' : pct > 60 ? 'text-amber-400' : 'text-green-400';
const barColor = (pct: number) => pct > 80 ? '[&>div]:bg-red-500' : pct > 60 ? '[&>div]:bg-amber-500' : '';

// ─── Main Component ──────────────────────────────────────────────────

export default function ClaraCommandCentre() {
  const [tab, setTab] = useState('feed');
  const [loading, setLoading] = useState(true);
  const [claraActive, setClaraActive] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // All data state
  const [feed, setFeed] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [rivenCommands, setRivenCommands] = useState<any[]>([]);
  const [salesActions, setSalesActions] = useState<any[]>([]);
  const [proactiveInvites, setProactiveInvites] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [whatsappSignups, setWhatsappSignups] = useState<any[]>([]);
  const [pendingBizActions, setPendingBizActions] = useState<any[]>([]);
  const [opsLog, setOpsLog] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [rivenPerf, setRivenPerf] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [inviteFilter, setInviteFilter] = useState('all');
  const [opsFilter, setOpsFilter] = useState('all');
  const [rivenFilter, setRivenFilter] = useState('all');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');

  // ─── Fetch ─────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();

    const [
      campR, salesR, planR, approvR, waR, opsR, budgR, rivenR, rivenPR, invR, pendBizR, leadsR,
      recentSales, recentCamp, recentOps,
    ] = await Promise.all([
      sq('clara_campaign_log', { order: 'created_at', limit: 20 }),
      sq('clara_sales_actions', { order: 'created_at', limit: 25 }),
      sq('clara_plan_executions', { order: 'created_at', limit: 30 }),
      sq('clara_plan_approvals', { order: 'created_at', limit: 20 }),
      sq('whatsapp_signups', { order: 'created_at', limit: 30 }),
      sq('clara_ops_log', { order: 'created_at', limit: 50 }),
      sq('clara_budget', { limit: 20 }),
      sq('clara_riven_commands', { order: 'created_at', limit: 50 }),
      sq('riven_performance', { order: 'created_at', limit: 30 }),
      sq('proactive_invites', { order: 'created_at', limit: 30 }),
      sq('clara_pending_actions', { order: 'created_at', limit: 20 }),
      sq('leads', { order: 'created_at', limit: 200 }),
      // Check recent activity for Active/Idle
      sq('clara_sales_actions', { select: 'id', gte: ['created_at', fiveMinAgo], limit: 1, head: true, count: true }),
      sq('clara_campaign_log', { select: 'id', gte: ['created_at', fiveMinAgo], limit: 1, head: true, count: true }),
      sq('clara_ops_log', { select: 'id', gte: ['created_at', fiveMinAgo], limit: 1, head: true, count: true }),
    ]);

    setCampaigns(campR.data);
    setSalesActions(salesR.data);
    setPlans(planR.data);
    setPendingApprovals(approvR.data);
    setWhatsappSignups(waR.data);
    setOpsLog(opsR.data);
    setBudgets(budgR.data);
    setRivenCommands(rivenR.data);
    setRivenPerf(rivenPR.data);
    setProactiveInvites(invR.data);
    setPendingBizActions(pendBizR.data);
    setLeads(leadsR.data);

    // Active/idle
    const anyRecent = (recentSales.count || 0) + (recentCamp.count || 0) + (recentOps.count || 0) > 0;
    setClaraActive(anyRecent);

    // Build unified feed
    const unified = [
      ...salesR.data.map((r: any) => ({ id: `s-${r.id}`, src: 'sales', icon: 'sales', label: `Sales: ${r.action_type || 'action'}`, detail: r.notes || r.outcome || '', ts: r.created_at, status: r.status })),
      ...campR.data.map((r: any) => ({ id: `c-${r.id}`, src: 'campaign', icon: 'campaign', label: `Campaign: ${r.name || r.campaign_name || ''}`, detail: `${r.sent_count || 0} sent`, ts: r.created_at, status: r.status })),
      ...opsR.data.map((r: any) => ({ id: `o-${r.id}`, src: 'ops', icon: 'ops', label: `Ops: ${r.incident_type || r.function_name || ''}`, detail: r.description || r.message || '', ts: r.created_at, status: r.severity || r.status })),
      ...rivenR.data.map((r: any) => ({ id: `r-${r.id}`, src: 'riven', icon: 'riven', label: `Riven: ${r.command_type || ''}`, detail: r.status || '', ts: r.created_at, status: r.status })),
      ...planR.data.map((r: any) => ({ id: `p-${r.id}`, src: 'plan', icon: 'plan', label: `Plan: ${r.plan_name || ''}`, detail: `Step ${r.steps_done || 0}/${r.steps_total || 0}`, ts: r.created_at, status: r.status })),
      ...invR.data.map((r: any) => ({ id: `i-${r.id}`, src: 'invite', icon: 'invite', label: `Invite: ${r.contact_name || r.name || ''}`, detail: `Day ${r.sequence_day || 1}`, ts: r.created_at, status: r.status })),
      ...waR.data.map((r: any) => ({ id: `w-${r.id}`, src: 'whatsapp', icon: 'whatsapp', label: `Signup: ${r.full_name || r.name || r.phone || ''}`, detail: r.status || '', ts: r.created_at, status: r.status })),
    ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 50);

    setFeed(unified);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  // ─── Realtime + Polling ──────────────────────────────────────────

  useEffect(() => {
    fetchAll();

    const channel = supabase.channel('clara-cc')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clara_sales_actions' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clara_campaign_log' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clara_ops_log' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clara_plan_executions' }, () => fetchAll())
      .subscribe();

    pollingRef.current = setInterval(fetchAll, 30000);

    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchAll]);

  // ─── Action Handlers ─────────────────────────────────────────────

  const approveAction = async (table: string, id: string, field: string, val: string) => {
    try {
      await sb.from(table).update({ [field]: val }).eq('id', id);
      fetchAll();
    } catch (e) { console.error('Update failed:', e); }
  };

  const markResolved = async (id: string) => {
    try {
      await sb.from('clara_ops_log').update({ resolved: true }).eq('id', id);
      setOpsLog(prev => prev.map(o => o.id === id ? { ...o, resolved: true } : o));
    } catch (e) { console.error('Resolve failed:', e); }
  };

  const retryRiven = async (id: string) => {
    try {
      await sb.from('clara_riven_commands').update({ status: 'pending' }).eq('id', id);
      setRivenCommands(prev => prev.map(r => r.id === id ? { ...r, status: 'pending' } : r));
    } catch (e) { console.error('Retry failed:', e); }
  };

  const toggleBudgetLock = async (id: string, locked: boolean) => {
    try {
      await sb.from('clara_budget').update({ is_locked: locked }).eq('id', id);
      setBudgets(prev => prev.map(b => b.id === id ? { ...b, is_locked: locked } : b));
    } catch (e) { console.error('Lock toggle failed:', e); }
  };

  const lockAllBudgets = async () => {
    try {
      for (const b of budgets) {
        await sb.from('clara_budget').update({ is_locked: true }).eq('id', b.id);
      }
      setBudgets(prev => prev.map(b => ({ ...b, is_locked: true })));
    } catch (e) { console.error('Lock all failed:', e); }
  };

  const unlockAllBudgets = async () => {
    try {
      for (const b of budgets) {
        await sb.from('clara_budget').update({ is_locked: false }).eq('id', b.id);
      }
      setBudgets(prev => prev.map(b => ({ ...b, is_locked: false })));
    } catch (e) { console.error('Unlock all failed:', e); }
  };

  const saveBudgetLimit = async (id: string) => {
    const val = parseFloat(editLimit);
    if (isNaN(val)) return;
    try {
      await sb.from('clara_budget').update({ limit: val }).eq('id', id);
      setBudgets(prev => prev.map(b => b.id === id ? { ...b, limit: val } : b));
      setEditingBudget(null);
    } catch (e) { console.error('Save limit failed:', e); }
  };

  const pausePlan = async (id: string) => {
    await approveAction('clara_plan_executions', id, 'status', 'paused');
  };
  const cancelPlan = async (id: string) => {
    await approveAction('clara_plan_executions', id, 'status', 'cancelled');
  };

  // ─── Computed ────────────────────────────────────────────────────

  const pendingApprovalCount = pendingApprovals.filter(a => a.approval_status === 'pending').length;
  const criticalOpsCount = opsLog.filter(o => (o.severity === 'critical') && !o.resolved).length;
  const unresolvedOps = opsLog.filter(o => !o.resolved);

  const hotLeads = leads.filter(l => (l.score || 0) >= 7).length;
  const warmLeads = leads.filter(l => (l.score || 0) >= 4 && (l.score || 0) < 7).length;
  const coldLeads = leads.filter(l => (l.score || 0) >= 1 && (l.score || 0) < 4).length;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const convertedThisWeek = leads.filter(l => l.status === 'converted' && l.created_at >= weekAgo).length;
  const activeTrials = leads.filter(l => l.status === 'trial' || l.status === 'active_trial').length;

  const filteredInvites = inviteFilter === 'all' ? proactiveInvites : proactiveInvites.filter(i => i.status === inviteFilter);
  const filteredOps = opsFilter === 'all' ? opsLog : opsFilter === 'unresolved' ? unresolvedOps : opsLog.filter(o => o.severity === 'critical' && !o.resolved);
  const filteredRiven = rivenFilter === 'all' ? rivenCommands : rivenCommands.filter(r => r.status === rivenFilter);

  // Error summary for ops tab
  const errorSummary = opsLog.reduce((acc: Record<string, number>, o) => {
    const key = o.incident_type || o.function_name || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // ─── Feed icon helper ────────────────────────────────────────────

  const feedIcon = (src: string) => {
    switch (src) {
      case 'sales': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'campaign': return <Megaphone className="h-4 w-4 text-blue-400" />;
      case 'ops': return <Settings className="h-4 w-4 text-gray-400" />;
      case 'riven': return <Zap className="h-4 w-4 text-purple-400" />;
      case 'plan': return <BookOpen className="h-4 w-4 text-amber-400" />;
      case 'invite': return <UserPlus className="h-4 w-4 text-teal-400" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4 text-green-400" />;
      default: return <Monitor className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Step dots for WhatsApp signup progress
  const stepDots = (step: string) => {
    const steps = ['name', 'who_for', 'protected_name', 'email', 'complete'];
    const idx = steps.indexOf(step?.toLowerCase() || '');
    return (
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <span key={i} className={`w-2 h-2 rounded-full ${i <= idx ? 'bg-green-500' : 'bg-gray-600'}`} />
        ))}
      </div>
    );
  };

  // Health check for ops tab
  const healthCheck = (funcName: string) => {
    const entry = opsLog.find(o => (o.function_name || o.incident_type) === funcName);
    if (!entry) return { color: 'bg-gray-500', label: 'No data' };
    const hoursAgo = (Date.now() - new Date(entry.created_at).getTime()) / 3600000;
    if (hoursAgo <= 24) return { color: 'bg-green-500', label: 'Healthy' };
    if (hoursAgo <= 48) return { color: 'bg-amber-500', label: '24-48h ago' };
    return { color: 'bg-red-500', label: '48h+ ago' };
  };

  const keyFunctions = ['ai-chat', 'whatsapp-inbound', 'clara-escalation', 'clara-marketing', 'clara-riven'];

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Monitor className="h-6 w-6 text-amber-500" />
            CLARA Command Centre
          </h1>
          <p className="text-muted-foreground text-sm">
            Everything CLARA is doing across every channel in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live status pill */}
          <Badge className={claraActive ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'} variant="outline">
            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${claraActive ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
            {claraActive ? 'CLARA Active' : 'CLARA Idle'}
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {lastRefresh.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* ═══ Tabs ═══ */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="feed" className="text-xs">Live Feed</TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs">Campaigns</TabsTrigger>
          <TabsTrigger value="sales" className="text-xs">Sales</TabsTrigger>
          <TabsTrigger value="plans" className="text-xs">Plans {pendingApprovalCount > 0 && <Dot color="amber" />}</TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs">WhatsApp</TabsTrigger>
          <TabsTrigger value="ops" className="text-xs">Ops {criticalOpsCount > 0 && <Dot color="red" />}</TabsTrigger>
          <TabsTrigger value="budget" className="text-xs">Budget</TabsTrigger>
          <TabsTrigger value="riven" className="text-xs">Riven</TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1 — LIVE FEED ═══ */}
        <TabsContent value="feed">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live Activity Feed</CardTitle>
              <CardDescription>Last 50 events across all CLARA systems, sorted by time</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <Spinner /> : feed.length === 0 ? <Empty msg="No activity recorded yet" /> : (
                <div className="space-y-0.5 max-h-[650px] overflow-y-auto">
                  {feed.map(item => (
                    <div key={item.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 text-sm">
                      {feedIcon(item.src)}
                      <span className="font-medium truncate max-w-[250px]">{item.label}</span>
                      <span className="text-muted-foreground truncate flex-1 text-xs">{item.detail}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(item.ts)}</span>
                      {item.status && <Badge className={`${statusClass(item.status)} text-[10px]`} variant="secondary">{item.status}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TAB 2 — CAMPAIGNS ═══ */}
        <TabsContent value="campaigns">
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat label="Total Campaigns" value={campaigns.length} icon={<Megaphone className="h-5 w-5 text-purple-400" />} />
              <Stat label="Running Now" value={campaigns.filter(c => c.status === 'running').length} icon={<Play className="h-5 w-5 text-green-400" />} />
              <Stat label="Completed" value={campaigns.filter(c => c.status === 'complete' || c.status === 'completed').length} icon={<CheckCircle className="h-5 w-5 text-teal-400" />} />
              <Stat label="Messages Sent" value={campaigns.reduce((s: number, c: any) => s + (c.sent_count || 0), 0)} icon={<Send className="h-5 w-5 text-blue-400" />} />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Campaigns</CardTitle></CardHeader>
              <CardContent>
                {campaigns.length === 0 ? <Empty msg="No campaigns" /> : (
                  <Table headers={['Name', 'Type', 'Audience', 'Sent', 'Conversions', 'Status', 'Created']}>
                    {campaigns.map((c: any) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-3 font-medium">{c.name || c.campaign_name}</td>
                        <td className="py-2 pr-3">{c.type || c.channel || '—'}</td>
                        <td className="py-2 pr-3">{c.audience || c.audience_size || '—'}</td>
                        <td className="py-2 pr-3">{c.sent_count || 0}</td>
                        <td className="py-2 pr-3">{c.conversions || 0}</td>
                        <td className="py-2 pr-3"><Badge className={`${statusClass(c.status)} text-[10px]`} variant="secondary">{c.status}</Badge></td>
                        <td className="py-2 pr-3 text-muted-foreground text-xs">{timeAgo(c.created_at)}</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Riven Command Queue</CardTitle></CardHeader>
              <CardContent>
                {rivenCommands.filter(r => r.status === 'pending' || r.status === 'executing').length === 0 ? <Empty msg="No queued commands" /> : (
                  <Table headers={['Type', 'Status', 'Priority', 'Created', 'Picked Up']}>
                    {rivenCommands.filter(r => r.status === 'pending' || r.status === 'executing').map((r: any) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-3 font-medium">{r.command_type}</td>
                        <td className="py-2 pr-3"><Badge className={`${statusClass(r.status)} text-[10px]`} variant="secondary">{r.status}</Badge></td>
                        <td className="py-2 pr-3">{r.priority || '—'}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{timeAgo(r.created_at)}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{r.picked_up_at ? timeAgo(r.picked_up_at) : '—'}</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB 3 — SALES ═══ */}
        <TabsContent value="sales">
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <Stat label="Hot Leads (7+)" value={hotLeads} icon={<Flame className="h-5 w-5 text-red-400" />} />
              <Stat label="Warm (4-6)" value={warmLeads} icon={<Thermometer className="h-5 w-5 text-amber-400" />} />
              <Stat label="Cold (1-3)" value={coldLeads} icon={<Snowflake className="h-5 w-5 text-blue-400" />} />
              <Stat label="Converted (week)" value={convertedThisWeek} icon={<CheckCircle className="h-5 w-5 text-teal-400" />} />
              <Stat label="Active Trials" value={activeTrials} icon={<Play className="h-5 w-5 text-green-400" />} />
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">CLARA Sales Actions</CardTitle></CardHeader>
              <CardContent>
                {salesActions.length === 0 ? <Empty msg="No sales actions" /> : (
                  <Table headers={['Action', 'Lead', 'Outcome', 'Date']}>
                    {salesActions.map((s: any) => (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-3 font-medium">{s.action_type}</td>
                        <td className="py-2 pr-3">{s.lead_name || s.lead_id || '—'}</td>
                        <td className="py-2 pr-3">{s.outcome || s.result || s.notes || '—'}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{timeAgo(s.created_at)}</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Proactive Invites</CardTitle>
                  <div className="flex gap-1">
                    {['all', 'active', 'converted', 'opted_out'].map(f => (
                      <Button key={f} variant={inviteFilter === f ? 'default' : 'outline'} size="sm" className="text-xs h-7" onClick={() => setInviteFilter(f)}>
                        {f === 'all' ? 'All' : f === 'opted_out' ? 'Opted Out' : f.charAt(0).toUpperCase() + f.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredInvites.length === 0 ? <Empty msg="No invites" /> : (
                  <Table headers={['Contact', 'Who For', 'Channel', 'Day', 'Status', 'Last Contact', 'Next Contact']}>
                    {filteredInvites.map((p: any) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-3 font-medium">{p.contact_name || p.name || '—'}</td>
                        <td className="py-2 pr-3">{p.who_for || p.protected_name || '—'}</td>
                        <td className="py-2 pr-3">{p.channel || '—'}</td>
                        <td className="py-2 pr-3">{p.sequence_day || 1}</td>
                        <td className="py-2 pr-3"><Badge className={`${statusClass(p.status || 'active')} text-[10px]`} variant="secondary">{p.status || 'active'}</Badge></td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{p.last_contact ? timeAgo(p.last_contact) : '—'}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{p.next_contact ? new Date(p.next_contact).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB 4 — PLANS ═══ */}
        <TabsContent value="plans">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Stat label="Active Plans" value={plans.filter(p => p.status === 'running' || p.status === 'active').length} icon={<Play className="h-5 w-5 text-blue-400" />} />
              <Stat label="Pending Approvals" value={pendingApprovalCount} icon={<Clock className="h-5 w-5 text-amber-400" />} />
              <Stat label="Completed" value={plans.filter(p => p.status === 'completed' || p.status === 'complete').length} icon={<CheckCircle className="h-5 w-5 text-green-400" />} />
            </div>

            {/* Active executions with progress */}
            {plans.filter(p => p.status === 'running' || p.status === 'active').length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Active Executions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {plans.filter(p => p.status === 'running' || p.status === 'active').map(p => {
                    const pct = p.steps_total > 0 ? Math.round((p.steps_done / p.steps_total) * 100) : 0;
                    return (
                      <div key={p.id} className="space-y-2 p-3 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{p.plan_name}</span>
                            <Badge className={`ml-2 ${statusClass(p.status)} text-[10px]`} variant="secondary">{p.status}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{p.steps_done}/{p.steps_total} steps ({pct}%)</span>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => pausePlan(p.id)}>
                              <Pause className="h-3 w-3 mr-1" /> Pause
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-500" onClick={() => cancelPlan(p.id)}>
                              <XCircle className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                        {p.current_step && <p className="text-xs text-muted-foreground">Current: {p.current_step}</p>}
                        <Progress value={pct} className="h-2" />
                        <p className="text-xs text-muted-foreground">Started {timeAgo(p.created_at)}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Execution history (expandable) */}
            <Card>
              <CardHeader><CardTitle className="text-base">Execution History</CardTitle></CardHeader>
              <CardContent>
                {plans.length === 0 ? <Empty msg="No plan executions" /> : (
                  <div className="space-y-1">
                    {plans.map(p => {
                      const dur = p.completed_at && p.created_at
                        ? Math.round((new Date(p.completed_at).getTime() - new Date(p.created_at).getTime()) / 60000) + 'm'
                        : '—';
                      const isExpanded = expandedPlan === p.id;
                      const stepsLog = typeof p.steps_log === 'string' ? JSON.parse(p.steps_log || '[]') : (p.steps_log || []);
                      return (
                        <div key={p.id}>
                          <div
                            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 text-sm cursor-pointer"
                            onClick={() => setExpandedPlan(isExpanded ? null : p.id)}
                          >
                            {stepsLog.length > 0 ? (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <span className="w-4" />}
                            <span className="font-medium flex-1">{p.plan_name}</span>
                            <span className="text-xs">{p.steps_done}/{p.steps_total}</span>
                            <Badge className={`${statusClass(p.status)} text-[10px]`} variant="secondary">{p.status}</Badge>
                            <span className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</span>
                            <span className="text-xs text-muted-foreground">{dur}</span>
                          </div>
                          {isExpanded && stepsLog.length > 0 && (
                            <div className="ml-10 mb-2 space-y-1 border-l-2 border-muted pl-4">
                              {stepsLog.map((step: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <span>{step.status === 'completed' || step.done ? '✅' : step.status === 'running' ? '⏳' : '○'}</span>
                                  <span className="text-muted-foreground">{step.name || step.description || `Step ${i + 1}`}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending approvals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Pending Approvals {pendingApprovalCount > 0 && <Badge className="ml-2 bg-amber-500/10 text-amber-500">{pendingApprovalCount}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingApprovals.filter(a => a.approval_status === 'pending').length === 0 ? <Empty msg="No pending approvals" /> : (
                  <div className="space-y-2">
                    {pendingApprovals.filter(a => a.approval_status === 'pending').map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{a.plan_name || a.action_type || 'Approval Required'}</p>
                          <p className="text-xs text-muted-foreground">{a.description || a.notes || ''}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs text-green-500" onClick={() => approveAction('clara_plan_approvals', a.id, 'approval_status', 'approved')}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-500" onClick={() => approveAction('clara_plan_approvals', a.id, 'approval_status', 'rejected')}>
                            <XCircle className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB 5 — WHATSAPP ═══ */}
        <TabsContent value="whatsapp">
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat label="Signups Today" value={whatsappSignups.filter(w => w.created_at >= new Date().toISOString().split('T')[0]).length} icon={<MessageSquare className="h-5 w-5 text-emerald-400" />} />
              <Stat label="Active Flows" value={whatsappSignups.filter(w => w.status === 'in_progress').length} icon={<Play className="h-5 w-5 text-blue-400" />} />
              <Stat label="Completed" value={whatsappSignups.filter(w => w.status === 'completed' || w.status === 'complete').length} icon={<CheckCircle className="h-5 w-5 text-green-400" />} />
              <Stat label="Active Invites" value={proactiveInvites.filter(i => i.status === 'active').length} icon={<UserPlus className="h-5 w-5 text-teal-400" />} />
            </div>

            {/* Active signup flows */}
            <Card>
              <CardHeader><CardTitle className="text-base">Active Signup Flows</CardTitle></CardHeader>
              <CardContent>
                {whatsappSignups.filter(w => w.status === 'in_progress').length === 0 ? <Empty msg="No active flows" /> : (
                  <Table headers={['Phone', 'Who For', 'Step', 'Protected Name', 'Started', 'Last Activity']}>
                    {whatsappSignups.filter(w => w.status === 'in_progress').map((w: any) => (
                      <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-3 font-medium">{w.phone}</td>
                        <td className="py-2 pr-3">{w.who_for || '—'}</td>
                        <td className="py-2 pr-3">{stepDots(w.step || w.current_step)}</td>
                        <td className="py-2 pr-3">{w.protected_name || '—'}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{timeAgo(w.created_at)}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{timeAgo(w.updated_at || w.created_at)}</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Recent completed */}
            <Card>
              <CardHeader><CardTitle className="text-base">Recent Completed Signups</CardTitle></CardHeader>
              <CardContent>
                {whatsappSignups.filter(w => w.status === 'completed' || w.status === 'complete').length === 0 ? <Empty msg="No completed signups" /> : (
                  <Table headers={['Name', 'Protected Person', 'Who For', 'Email', 'Language', 'Signed Up']}>
                    {whatsappSignups.filter(w => w.status === 'completed' || w.status === 'complete').slice(0, 20).map((w: any) => (
                      <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-3 font-medium">{w.full_name || w.name || '—'}</td>
                        <td className="py-2 pr-3">{w.protected_name || '—'}</td>
                        <td className="py-2 pr-3">{w.who_for || '—'}</td>
                        <td className="py-2 pr-3">{w.email || '—'}</td>
                        <td className="py-2 pr-3">{w.language || '—'}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{timeAgo(w.created_at)}</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Pending business actions */}
            <Card>
              <CardHeader><CardTitle className="text-base">Pending Business Actions</CardTitle></CardHeader>
              <CardContent>
                {pendingBizActions.filter(a => a.status === 'pending').length === 0 ? <Empty msg="No pending actions" /> : (
                  <div className="space-y-2">
                    {pendingBizActions.filter(a => a.status === 'pending').map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{a.action_type}</p>
                          <p className="text-xs text-muted-foreground">{a.description || a.proposal || ''}</p>
                          {a.expires_at && <p className="text-xs text-amber-400">Expires: {new Date(a.expires_at).toLocaleDateString()}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs text-green-500" onClick={() => approveAction('clara_pending_actions', a.id, 'status', 'approved')}>Approve</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-red-500" onClick={() => approveAction('clara_pending_actions', a.id, 'status', 'rejected')}>Reject</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB 6 — OPS ═══ */}
        <TabsContent value="ops">
          <div className="space-y-4">
            {/* Platform health cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {keyFunctions.map(fn => {
                const h = healthCheck(fn);
                return (
                  <Card key={fn} className="p-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${h.color}`} />
                      <div>
                        <p className="text-xs font-medium">{fn}</p>
                        <p className="text-[10px] text-muted-foreground">{h.label}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Ops log with filters */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Operations Log</CardTitle>
                  <div className="flex gap-1">
                    {['all', 'unresolved', 'critical'].map(f => (
                      <Button key={f} variant={opsFilter === f ? 'default' : 'outline'} size="sm" className="text-xs h-7" onClick={() => setOpsFilter(f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredOps.length === 0 ? <Empty msg="No ops entries" /> : (
                  <Table headers={['Type', 'Severity', 'Description', 'Action Taken', 'Resolved', 'Date', '']}>
                    {filteredOps.map((o: any) => (
                      <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-3 font-medium">{o.incident_type || o.function_name}</td>
                        <td className="py-2 pr-3"><Badge className={`${statusClass(o.severity || 'info')} text-[10px]`} variant="secondary">{o.severity || 'info'}</Badge></td>
                        <td className="py-2 pr-3 text-xs max-w-[200px] truncate">{o.description || o.message || '—'}</td>
                        <td className="py-2 pr-3 text-xs max-w-[150px] truncate">{o.action_taken || '—'}</td>
                        <td className="py-2 pr-3">{o.resolved ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-400" />}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{timeAgo(o.created_at)}</td>
                        <td className="py-2">
                          {!o.resolved && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markResolved(o.id)}>
                              Mark Resolved
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Error summary */}
            <Card>
              <CardHeader><CardTitle className="text-base">Error Summary</CardTitle></CardHeader>
              <CardContent>
                {Object.keys(errorSummary).length === 0 ? <Empty msg="No errors to summarize" /> : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(errorSummary).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-2 p-2 rounded-lg border">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <div>
                          <p className="text-xs font-medium">{type}</p>
                          <p className="text-lg font-bold">{count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB 7 — BUDGET ═══ */}
        <TabsContent value="budget">
          <div className="space-y-4">
            {/* Lock/Unlock All */}
            <div className="flex gap-2 justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" /> Lock All Spending
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Lock All Budgets?</AlertDialogTitle>
                    <AlertDialogDescription>This will prevent CLARA from spending on any budget category. All automated spending will be paused.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={lockAllBudgets}>Lock All</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" size="sm" className="text-xs" onClick={unlockAllBudgets}>
                <Unlock className="h-3 w-3 mr-1" /> Unlock All
              </Button>
            </div>

            {/* Budget cards */}
            {budgets.length === 0 ? <Card><CardContent className="py-8"><Empty msg="No budget data" /></CardContent></Card> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {budgets.map((b: any) => {
                  const limit = b.limit || b.allocated || 0;
                  const spent = b.spent || 0;
                  const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
                  const isEditing = editingBudget === b.id;
                  return (
                    <Card key={b.id} className={b.is_locked ? 'opacity-60 border-red-500/30' : ''}>
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{(b.category || b.type || 'Budget').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                          <div className="flex items-center gap-2">
                            {b.is_locked && <Lock className="h-4 w-4 text-red-400" />}
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleBudgetLock(b.id, !b.is_locked)}>
                              {b.is_locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                        <Progress value={pct} className={`h-3 ${barColor(pct)}`} />
                        <div className="flex items-center justify-between text-sm">
                          <span className={pctColor(pct)}>
                            &euro;{spent.toFixed(0)} of &euro;{limit.toFixed(0)}
                          </span>
                          <span className={`font-bold ${pctColor(pct)}`}>{pct}%</span>
                        </div>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Input type="number" value={editLimit} onChange={e => setEditLimit(e.target.value)} className="h-8 text-sm" placeholder="New limit" />
                            <Button size="sm" className="h-8 text-xs" onClick={() => saveBudgetLimit(b.id)}>Save</Button>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditingBudget(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="text-xs h-7 w-full" onClick={() => { setEditingBudget(b.id); setEditLimit(String(limit)); }}>
                            Edit Limit
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══ TAB 8 — RIVEN ═══ */}
        <TabsContent value="riven">
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-1 flex-wrap">
              {['all', 'pending', 'executing', 'complete', 'failed'].map(f => (
                <Button key={f} variant={rivenFilter === f ? 'default' : 'outline'} size="sm" className="text-xs h-7" onClick={() => setRivenFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Riven Commands</CardTitle></CardHeader>
              <CardContent>
                {filteredRiven.length === 0 ? <Empty msg="No commands" /> : (
                  <Table headers={['Type', 'Status', 'Priority', 'Data Preview', 'Created', 'Completed', '']}>
                    {filteredRiven.map((r: any) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-3 font-medium">{r.command_type}</td>
                        <td className="py-2 pr-3"><Badge className={`${statusClass(r.status)} text-[10px]`} variant="secondary">{r.status}</Badge></td>
                        <td className="py-2 pr-3">{r.priority || '—'}</td>
                        <td className="py-2 pr-3 text-xs max-w-[200px] truncate">{typeof r.data === 'string' ? r.data?.substring(0, 60) : JSON.stringify(r.data || r.payload || '').substring(0, 60)}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{timeAgo(r.created_at)}</td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">{r.completed_at ? timeAgo(r.completed_at) : '—'}</td>
                        <td className="py-2">
                          {r.status === 'failed' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => retryRiven(r.id)}>
                              <RotateCcw className="h-3 w-3 mr-1" /> Retry
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Riven performance */}
            <Card>
              <CardHeader><CardTitle className="text-base">Performance Data</CardTitle></CardHeader>
              <CardContent>
                {rivenPerf.length === 0 ? <Empty msg="No performance data" /> : (
                  <Table headers={['Type', 'Audience', 'Sent', 'Opens', 'Replies', 'Conversions', 'Engagement %', 'Revenue']}>
                    {rivenPerf.map((r: any) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 pr-3 font-medium">{r.type || r.metric || '—'}</td>
                        <td className="py-2 pr-3">{r.audience || r.audience_size || '—'}</td>
                        <td className="py-2 pr-3">{r.sent || r.sent_count || 0}</td>
                        <td className="py-2 pr-3">{r.opens || r.open_count || 0}</td>
                        <td className="py-2 pr-3">{r.replies || r.reply_count || 0}</td>
                        <td className="py-2 pr-3">{r.conversions || 0}</td>
                        <td className="py-2 pr-3">{r.engagement_pct || r.engagement || r.value || 0}%</td>
                        <td className="py-2 pr-3">{r.revenue ? `€${r.revenue}` : '—'}</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Shared Subcomponents ────────────────────────────────────────────

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Spinner() {
  return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Bot className="h-10 w-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm">{msg}</p>
      <p className="text-xs mt-1">Data will appear here as CLARA starts operating</p>
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            {headers.map(h => <th key={h} className="pb-2 pr-3 font-medium text-xs text-muted-foreground">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Dot({ color }: { color: 'red' | 'amber' }) {
  return <span className={`ml-1 inline-block w-2 h-2 rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-amber-500'}`} />;
}
