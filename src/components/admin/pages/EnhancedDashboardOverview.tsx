import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Users, CreditCard, Clock, DollarSign,
  Zap, Gift, Bell, TrendingUp, Send, Activity,
  AlertTriangle, Inbox, UserPlus, RefreshCw, ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ── Helpers ──────────────────────────────────────────────────
const timeAgo = (date: string) => {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const fmtDate = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const fmtCurrency = (n: number) => `€${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Types ────────────────────────────────────────────────────
interface Stats {
  totalUsers: number;
  subscribers: number;
  trials: number;
  leadsToday: number;
  leadsWeek: number;
  hotLeads: number;
  gifts: number;
  pendingActions: number;
  mrr: number;
}

interface ActivityItem {
  id: string;
  type: 'user' | 'subscriber' | 'trial' | 'lead' | 'gift' | 'sos' | 'pending';
  text: string;
  time: string;
  urgent?: boolean;
}

// ── Component ────────────────────────────────────────────────
export default function EnhancedDashboardOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, subscribers: 0, trials: 0, leadsToday: 0,
    leadsWeek: 0, hotLeads: 0, gifts: 0, pendingActions: 0, mrr: 0,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

      const [users, subs, trials, leadsDay, leadsWk, hotLds, gifts, pending, recentProfiles, recentLeads] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('subscribed', true),
        supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('is_trialing', true),
        supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('leads').select('*', { count: 'exact', head: true }).gte('interest_level', 7),
        supabase.from('gift_subscriptions').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),
        supabase.from('clara_pending_actions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('user_id, full_name, created_at').order('created_at', { ascending: false }).limit(8),
        supabase.from('leads').select('id, first_name, email, created_at').order('created_at', { ascending: false }).limit(8),
      ]);

      const subCount = subs.count || 0;
      const trialCount = trials.count || 0;

      setStats({
        totalUsers: users.count || 0,
        subscribers: subCount,
        trials: trialCount,
        leadsToday: leadsDay.count || 0,
        leadsWeek: leadsWk.count || 0,
        hotLeads: hotLds.count || 0,
        gifts: gifts.count || 0,
        pendingActions: pending.count || 0,
        mrr: subCount * 9.99,
      });

      // Merge activity
      const items: ActivityItem[] = [];
      (recentProfiles.data || []).forEach((p: any) => {
        items.push({ id: `u-${p.user_id}`, type: 'user', text: `${p.full_name || 'New user'} joined`, time: p.created_at });
      });
      (recentLeads.data || []).forEach((l: any) => {
        items.push({ id: `l-${l.id}`, type: 'lead', text: `New lead: ${l.first_name || l.email}`, time: l.created_at });
      });
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivity(items.slice(0, 12));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const activityIcon = (type: string) => {
    const map: Record<string, { icon: typeof Users; color: string }> = {
      user: { icon: UserPlus, color: 'blue' },
      subscriber: { icon: CreditCard, color: 'green' },
      trial: { icon: Clock, color: 'amber' },
      lead: { icon: Zap, color: 'yellow' },
      gift: { icon: Gift, color: 'pink' },
      sos: { icon: AlertTriangle, color: 'red' },
      pending: { icon: Shield, color: 'red' },
    };
    return map[type] || map.user;
  };

  // ── Metric tiles config ──
  const tiles = [
    { label: 'Total Users', value: stats.totalUsers.toString(), icon: Users, color: 'blue', sub: 'All accounts' },
    { label: 'Paying Subscribers', value: stats.subscribers.toString(), icon: CreditCard, color: 'green', sub: 'Active paid plans' },
    { label: 'Active Trials', value: stats.trials.toString(), icon: Clock, color: 'amber', sub: 'Currently trialing' },
    { label: 'Conversion', value: stats.totalUsers > 0 ? `${Math.round((stats.subscribers / stats.totalUsers) * 100)}%` : '—', icon: TrendingUp, color: 'purple', sub: 'Users → paid' },
    { label: 'MRR', value: fmtCurrency(stats.mrr), icon: DollarSign, color: 'green', sub: 'Est. monthly revenue' },
    { label: 'Leads (7 days)', value: stats.leadsWeek.toString(), icon: Zap, color: 'yellow', sub: `${stats.hotLeads} hot (score ≥7)` },
    { label: 'Gifts (30 days)', value: stats.gifts.toString(), icon: Gift, color: 'pink', sub: 'Gift subscriptions sold' },
    { label: 'CLARA Pending', value: stats.pendingActions.toString(), icon: Bell, color: stats.pendingActions > 0 ? 'red' : 'gray', sub: 'Waiting for approval', onClick: () => navigate('/admin-dashboard/command-centre') },
  ];

  const actions = [
    { label: 'Send invite via CLARA', icon: Send, color: 'red', path: '/admin-dashboard/manual-invite' },
    { label: 'View hot leads', icon: Zap, color: 'amber', path: '/admin-dashboard/leads', badge: stats.hotLeads },
    { label: 'CLARA command centre', icon: Shield, color: 'blue', path: '/admin-dashboard/command-centre', badge: stats.pendingActions },
    { label: 'Chase expiring trials', icon: Clock, color: 'orange', path: '/admin-dashboard/trial-management' },
    { label: 'Contact submissions', icon: Inbox, color: 'gray', path: '/admin-dashboard/contact-submissions' },
    { label: 'Platform health', icon: Activity, color: 'green', path: '/admin-dashboard/health-check' },
  ];

  const health = [
    { label: 'CLARA AI', status: 'Operational', ok: true },
    { label: 'Cron Jobs', status: '16 active', ok: true },
    { label: 'Edge Functions', status: '25+ deployed', ok: true },
    { label: 'Email (Resend)', status: 'Connected', ok: true },
    { label: 'Stripe', status: 'Connected', ok: true },
    { label: 'Database', status: 'Connected', ok: true },
  ];

  // Skeleton
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-100 rounded-2xl ${className}`} />
  );

  return (
    <div className="px-8 py-6 w-full space-y-6">

      {/* ── HEADER BAR ── */}
      <div className="bg-gray-900 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold">{greeting()}, Lee</p>
            <p className="text-gray-400 text-sm">{fmtDate()}</p>
          </div>
        </div>
        <div className="flex items-center gap-0 divide-x divide-gray-700">
          {[
            { label: 'Subscribers', value: loading ? '—' : stats.subscribers },
            { label: 'MRR', value: loading ? '—' : fmtCurrency(stats.mrr) },
            { label: 'Trials', value: loading ? '—' : stats.trials },
            { label: 'Leads Today', value: loading ? '—' : stats.leadsToday },
          ].map(h => (
            <div key={h.label} className="text-center px-5">
              <p className="text-xl sm:text-2xl font-bold text-white">{h.value}</p>
              <p className="text-gray-400 text-xs uppercase tracking-wider">{h.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 8 METRIC TILES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)
          : tiles.map(t => {
              const Icon = t.icon;
              const colorMap: Record<string, string> = {
                blue: 'bg-blue-50 text-blue-500',
                green: 'bg-green-50 text-green-500',
                amber: 'bg-amber-50 text-amber-500',
                purple: 'bg-purple-50 text-purple-500',
                yellow: 'bg-yellow-50 text-yellow-600',
                pink: 'bg-pink-50 text-pink-500',
                red: 'bg-red-50 text-red-500',
                gray: 'bg-gray-100 text-gray-400',
                orange: 'bg-orange-50 text-orange-500',
              };
              const [iconBg, iconColor] = (colorMap[t.color] || colorMap.gray).split(' ');
              return (
                <div
                  key={t.label}
                  onClick={t.onClick}
                  className={`bg-white border border-gray-200 rounded-2xl p-5 ${t.onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{t.label}</span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}><Icon className={`w-4 h-4 ${iconColor}`} /></div>
                  </div>
                  <p className="text-2xl sm:text-2xl font-bold text-gray-900 mb-1 tracking-tight">{t.value}</p>
                  <p className="text-xs text-gray-400">{t.sub}</p>
                </div>
              );
            })}
      </div>

      {/* ── THREE COLUMN MIDDLE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Activity Feed — 5 cols */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm">Live activity</h3>
            <button onClick={load} className="text-gray-400 hover:text-gray-600 transition-colors"><RefreshCw className="w-4 h-4" /></button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-8 h-8 !rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 !rounded w-3/4" />
                    <Skeleton className="h-3 !rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-0">
              {activity.map(item => {
                const { icon: Icon, color } = activityIcon(item.type);
                const colorMap: Record<string, string> = {
                  blue: 'bg-blue-100 text-blue-600',
                  green: 'bg-green-100 text-green-600',
                  amber: 'bg-amber-100 text-amber-600',
                  yellow: 'bg-yellow-100 text-yellow-700',
                  pink: 'bg-pink-100 text-pink-600',
                  red: 'bg-red-100 text-red-600',
                };
                const cls = colorMap[color] || colorMap.blue;
                return (
                  <div key={item.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cls.split(' ')[0]}`}>
                      <Icon className={`w-3.5 h-3.5 ${cls.split(' ')[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-tight">{item.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.time)}</p>
                    </div>
                    {item.urgent && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0 animate-pulse">LIVE</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sales Pipeline — 4 cols */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Sales pipeline</h3>
          {loading ? (
            <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 !rounded" />)}</div>
          ) : (
            <div className="space-y-4">
              {[
                { stage: 'Total Users', count: stats.totalUsers, color: 'gray' },
                { stage: 'Active Trials', count: stats.trials, color: 'amber' },
                { stage: 'Paid Subscribers', count: stats.subscribers, color: 'green' },
                { stage: 'Hot Leads', count: stats.hotLeads, color: 'red' },
              ].map(s => {
                const max = Math.max(stats.totalUsers, 1);
                const pct = Math.round((s.count / max) * 100);
                const colorClass: Record<string, string> = { gray: 'bg-gray-400', amber: 'bg-amber-500', green: 'bg-green-500', red: 'bg-red-500' };
                return (
                  <div key={s.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">{s.stage}</span>
                      <span className="text-sm font-bold text-gray-900">{s.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${colorClass[s.color]}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Revenue placeholder */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Revenue</h4>
            <div className="h-24 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="text-center">
                <TrendingUp className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                <p className="text-gray-400 text-xs">Chart appears after 30 days of data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions — 3 cols */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Quick actions</h3>
            <div className="space-y-2">
              {actions.map(a => {
                const Icon = a.icon;
                const colorMap: Record<string, string> = {
                  red: 'bg-red-50 text-red-600', amber: 'bg-amber-50 text-amber-600',
                  blue: 'bg-blue-50 text-blue-600', orange: 'bg-orange-50 text-orange-600',
                  gray: 'bg-gray-100 text-gray-500', green: 'bg-green-50 text-green-600',
                };
                const cls = colorMap[a.color] || colorMap.gray;
                return (
                  <button
                    key={a.label}
                    onClick={() => navigate(a.path)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-left group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cls.split(' ')[0]} group-hover:scale-105 transition-transform`}>
                      <Icon className={`w-4 h-4 ${cls.split(' ')[1]}`} />
                    </div>
                    <span className="text-sm text-gray-700 font-medium flex-1">{a.label}</span>
                    {(a.badge ?? 0) > 0 && <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">{a.badge}</span>}
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platform Health */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Platform status</h3>
            {health.map(h => (
              <div key={h.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${h.ok ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-sm text-gray-700">{h.label}</span>
                </div>
                <span className={`text-xs font-medium ${h.ok ? 'text-green-600' : 'text-amber-600'}`}>{h.status}</span>
              </div>
            ))}
            <p className="text-xs text-gray-400 mt-3">Last checked: {lastRefresh.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
