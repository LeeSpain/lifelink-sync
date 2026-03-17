import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Clock, Users, TrendingUp, Zap, RefreshCw, MessageSquare,
  AlertCircle, CheckCircle, XCircle, Search, Bell, Target, Star,
} from 'lucide-react';

interface TrialUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  trial_start: string;
  trial_end: string;
  status: 'active' | 'converted' | 'expired' | 'cancelled';
  converted_at: string | null;
  reminder_day3_sent: boolean;
  reminder_day6_sent: boolean;
  reminder_day7_sent: boolean;
  source: string;
  days_remaining: number;
  days_in_trial: number;
  is_urgent: boolean;
  phone?: string;
}

const timeAgo = (date: string | null) => {
  if (!date) return '—';
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const daysUntil = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
const daysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-blue-100 text-blue-700' },
  converted: { label: 'Converted', color: 'bg-green-100 text-green-700' },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600' },
};

function TrialProgress({ daysUsed, daysLeft }: { daysUsed: number; daysLeft: number }) {
  const total = 7;
  const pct = Math.min((Math.min(daysUsed, total) / total) * 100, 100);
  const color = daysLeft <= 1 ? 'bg-red-500' : daysLeft <= 2 ? 'bg-amber-500' : 'bg-blue-500';
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-400">Day {Math.min(daysUsed, total)} of {total}</span>
        <span className={`text-xs font-bold ${daysLeft <= 1 ? 'text-red-600' : daysLeft <= 2 ? 'text-amber-600' : 'text-blue-600'}`}>
          {daysLeft <= 0 ? 'Expires today!' : `${daysLeft}d left`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TrialCard({ trial, onChase, onConvert, onExtend }: {
  trial: TrialUser;
  onChase: (t: TrialUser) => void;
  onConvert: (t: TrialUser) => void;
  onExtend: (t: TrialUser) => void;
}) {
  const cfg = STATUS_CFG[trial.status] || STATUS_CFG.active;
  const initials = (trial.full_name || trial.email || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={`bg-white border rounded-2xl p-4 transition-all hover:shadow-md ${
      trial.is_urgent && trial.status === 'active' ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200'
    }`}>
      {trial.is_urgent && trial.status === 'active' && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5 mb-3 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5" />
          {trial.days_remaining <= 0 ? 'Expires today — act now!' : `${trial.days_remaining}d left — chase now!`}
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
            trial.status === 'converted' ? 'bg-green-100 text-green-600' : trial.is_urgent ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>{initials}</div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">{trial.full_name || trial.email}</p>
            <p className="text-xs text-gray-400 truncate">{trial.email}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
      </div>

      {trial.status === 'active' && (
        <div className="mb-3"><TrialProgress daysUsed={trial.days_in_trial} daysLeft={trial.days_remaining} /></div>
      )}

      {trial.status === 'converted' && trial.converted_at && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded-lg px-2.5 py-1.5 mb-3">
          <CheckCircle className="w-3.5 h-3.5" /> Converted {timeAgo(trial.converted_at)}
        </div>
      )}

      {trial.status === 'expired' && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5 mb-3">
          <XCircle className="w-3.5 h-3.5" /> Expired {timeAgo(trial.trial_end)}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-400">Reminders:</span>
        {[{ day: 3, sent: trial.reminder_day3_sent }, { day: 6, sent: trial.reminder_day6_sent }, { day: 7, sent: trial.reminder_day7_sent }].map(r => (
          <span key={r.day} className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.sent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>D{r.day}</span>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
        <span>Started {timeAgo(trial.trial_start)}</span>
        <span className="capitalize">via {trial.source || 'onboarding'}</span>
      </div>

      {trial.status === 'active' && (
        <div className="flex gap-1.5">
          <button onClick={() => onChase(trial)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> Chase
          </button>
          <button onClick={() => onConvert(trial)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">
            <Star className="w-3.5 h-3.5" /> Convert
          </button>
          <button onClick={() => onExtend(trial)} className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors flex-shrink-0" title="Extend +3 days">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </button>
        </div>
      )}

      {trial.status === 'expired' && (
        <button onClick={() => onChase(trial)} className="w-full py-2 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
          Send win-back message
        </button>
      )}

      {trial.status === 'converted' && (
        <div className="py-2 text-xs text-center text-green-600 font-medium">Paying subscriber</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Main Page
// ─────────────────────────────────────

export default function TrialManagementPage() {
  const { toast } = useToast();
  const [trials, setTrials] = useState<TrialUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'converted' | 'expired'>('all');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [stats, setStats] = useState({ active: 0, converted: 0, expired: 0, conversionRate: 0, expiringToday: 0, expiring48h: 0, avgDaysToConvert: 0 });

  const loadTrials = useCallback(async () => {
    setLoading(true);
    try {
      const [trackRes, subsRes] = await Promise.all([
        supabase.from('trial_tracking').select('*').order('created_at', { ascending: false }),
        supabase.from('subscribers').select('user_id, email, is_trialing, trial_end, created_at, subscribed').or('is_trialing.eq.true,subscribed.eq.true'),
      ]);

      const allUserIds = [...new Set([
        ...(trackRes.data || []).map((t: any) => t.user_id),
        ...(subsRes.data || []).map((s: any) => s.user_id),
      ].filter(Boolean))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, preferred_language')
        .in('user_id', allUserIds.slice(0, 200));

      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = p; });
      const subsMap: Record<string, any> = {};
      (subsRes.data || []).forEach((s: any) => { subsMap[s.user_id] = s; });

      const rows: TrialUser[] = [];
      const trackingUserIds = new Set<string>();

      // From trial_tracking
      (trackRes.data || []).forEach((t: any) => {
        trackingUserIds.add(t.user_id);
        const profile = profileMap[t.user_id] || {};
        const sub = subsMap[t.user_id] || {};
        const dl = daysUntil(t.trial_end);
        const du = daysSince(t.trial_start);
        rows.push({
          id: t.id, user_id: t.user_id,
          email: sub.email || '', full_name: profile.full_name || sub.email || '',
          trial_start: t.trial_start, trial_end: t.trial_end,
          status: t.status, converted_at: t.converted_at,
          reminder_day3_sent: t.reminder_day3_sent || false,
          reminder_day6_sent: t.reminder_day6_sent || false,
          reminder_day7_sent: t.reminder_day7_sent || false,
          source: t.source || 'onboarding',
          days_remaining: Math.max(0, dl), days_in_trial: Math.max(0, du),
          is_urgent: t.status === 'active' && dl <= 2,
          phone: profile.phone,
        });
      });

      // Trialing subscribers not in trial_tracking
      (subsRes.data || []).forEach((s: any) => {
        if (s.is_trialing && !trackingUserIds.has(s.user_id)) {
          const profile = profileMap[s.user_id] || {};
          const trialEnd = s.trial_end || new Date(new Date(s.created_at).getTime() + 7 * 86400000).toISOString();
          const dl = daysUntil(trialEnd);
          const du = daysSince(s.created_at);
          rows.push({
            id: s.user_id, user_id: s.user_id,
            email: s.email || '', full_name: profile.full_name || s.email || '',
            trial_start: s.created_at, trial_end: trialEnd,
            status: 'active', converted_at: null,
            reminder_day3_sent: false, reminder_day6_sent: false, reminder_day7_sent: false,
            source: 'signup', days_remaining: Math.max(0, dl), days_in_trial: Math.max(0, du),
            is_urgent: dl <= 2, phone: profile.phone,
          });
        }
      });

      rows.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (b.status === 'active' && a.status !== 'active') return 1;
        if (a.status === 'active' && b.status === 'active') return a.days_remaining - b.days_remaining;
        return new Date(b.trial_start).getTime() - new Date(a.trial_start).getTime();
      });

      setTrials(rows);

      const active = rows.filter(r => r.status === 'active').length;
      const converted = rows.filter(r => r.status === 'converted').length;
      const expired = rows.filter(r => r.status === 'expired').length;
      const total = active + converted + expired;
      const expiringToday = rows.filter(r => r.status === 'active' && r.days_remaining <= 0).length;
      const expiring48h = rows.filter(r => r.status === 'active' && r.days_remaining > 0 && r.days_remaining <= 2).length;
      const convertedRows = rows.filter(r => r.converted_at);
      const avgConvert = convertedRows.length > 0 ? Math.round(convertedRows.reduce((s, r) => s + daysSince(r.trial_start), 0) / convertedRows.length) : 0;

      setStats({
        active, converted, expired,
        conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
        expiringToday, expiring48h, avgDaysToConvert: avgConvert,
      });
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to load trials', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTrials(); }, [loadTrials]);

  const handleChase = async (trial: TrialUser) => {
    const name = (trial.full_name || '').split(' ')[0] || 'there';
    const dl = trial.days_remaining;
    const message = trial.status === 'expired'
      ? `Hi ${name}! Your LifeLink Sync trial has ended but it's not too late — subscribe today for just \u20AC9.99/month and CLARA keeps watching over you 24/7. lifelink-sync.com`
      : dl <= 1
        ? `Hi ${name}! Your LifeLink Sync trial expires today! Don't lose your protection — subscribe now at lifelink-sync.com for just \u20AC9.99/month`
        : `Hi ${name}! You have ${dl} days left on your LifeLink Sync trial. Upgrade to keep CLARA protecting you 24/7 — just \u20AC9.99/month. lifelink-sync.com`;

    if (trial.phone) {
      try {
        await supabase.functions.invoke('clara-escalation', { body: { type: 'manual_invite', contact_phone: trial.phone, contact_name: trial.full_name, message } });
        toast({ title: `WhatsApp sent to ${trial.full_name || trial.email}` });
      } catch { toast({ title: 'Send failed', variant: 'destructive' }); }
    } else {
      await navigator.clipboard.writeText(message);
      toast({ title: 'Message copied — no phone number, paste into email' });
    }
  };

  const handleConvert = async (trial: TrialUser) => {
    try {
      await (supabase as any).from('trial_tracking').upsert({ user_id: trial.user_id, status: 'converted', converted_at: new Date().toISOString(), plan_after_trial: 'individual' }, { onConflict: 'user_id' });
      await supabase.from('subscribers').update({ is_trialing: false, subscribed: true, subscription_tier: 'Individual' } as any).eq('user_id', trial.user_id);
      toast({ title: `${trial.full_name || trial.email} marked as converted!` });
      loadTrials();
    } catch (err: any) { toast({ title: 'Failed: ' + err.message, variant: 'destructive' }); }
  };

  const handleExtend = async (trial: TrialUser) => {
    const newEnd = new Date(trial.trial_end);
    newEnd.setDate(newEnd.getDate() + 3);
    try {
      await (supabase as any).from('trial_tracking').upsert({ user_id: trial.user_id, trial_end: newEnd.toISOString(), status: 'active' }, { onConflict: 'user_id' });
      await supabase.from('subscribers').update({ trial_end: newEnd.toISOString(), is_trialing: true } as any).eq('user_id', trial.user_id);
      toast({ title: `Trial extended +3 days for ${trial.full_name || trial.email}` });
      loadTrials();
    } catch (err: any) { toast({ title: 'Failed: ' + err.message, variant: 'destructive' }); }
  };

  const chaseAllExpiring = async () => {
    const expiring = trials.filter(t => t.status === 'active' && t.days_remaining <= 2);
    if (!expiring.length) { toast({ title: 'No urgent trials to chase' }); return; }
    let sent = 0;
    for (const t of expiring) { try { await handleChase(t); sent++; await new Promise(r => setTimeout(r, 500)); } catch {} }
    toast({ title: `Chased ${sent} expiring trials` });
  };

  const filtered = trials.filter(t => {
    if (urgentOnly && !t.is_urgent) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search) { const s = search.toLowerCase(); return t.full_name?.toLowerCase().includes(s) || t.email?.toLowerCase().includes(s); }
    return true;
  });

  const urgentCount = stats.expiringToday + stats.expiring48h;

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trial Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">7-day free trials · Monitor, chase and convert</p>
        </div>
        <div className="flex gap-2">
          {urgentCount > 0 && (
            <Button onClick={chaseAllExpiring} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm">
              <Zap className="w-4 h-4" /> Chase {urgentCount} expiring
            </Button>
          )}
          <Button onClick={loadTrials} variant="outline" className="flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Urgent alert */}
      {urgentCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-300 rounded-2xl px-5 py-4 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-bold text-red-800">
              {stats.expiringToday > 0 && `${stats.expiringToday} trial${stats.expiringToday !== 1 ? 's' : ''} expire TODAY`}
              {stats.expiringToday > 0 && stats.expiring48h > 0 && ' · '}
              {stats.expiring48h > 0 && `${stats.expiring48h} more within 48h`}
            </p>
            <p className="text-xs text-red-600 mt-0.5">Send a WhatsApp now — best conversion opportunities</p>
          </div>
          <button onClick={() => { setUrgentOnly(true); setStatusFilter('active'); }} className="ml-auto text-xs font-bold text-red-700 hover:text-red-900">View urgent &rarr;</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        {[
          { label: 'Active', value: stats.active, Icon: Clock, color: 'blue' },
          { label: 'Converted', value: stats.converted, Icon: CheckCircle, color: 'green' },
          { label: 'Expired', value: stats.expired, Icon: XCircle, color: 'gray' },
          { label: 'Conv. rate', value: `${stats.conversionRate}%`, Icon: TrendingUp, color: 'purple' },
          { label: 'Exp. today', value: stats.expiringToday, Icon: AlertCircle, color: stats.expiringToday > 0 ? 'red' : 'gray', highlight: stats.expiringToday > 0 },
          { label: 'Exp. 48h', value: stats.expiring48h, Icon: Bell, color: stats.expiring48h > 0 ? 'amber' : 'gray' },
          { label: 'Avg days', value: `${stats.avgDaysToConvert}d`, Icon: Target, color: 'indigo' },
        ].map(s => (
          <div key={s.label} className={`bg-white border rounded-2xl p-3 ${(s as any).highlight ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{s.label}</span>
              <s.Icon className={`w-3.5 h-3.5 text-${s.color}-500`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trials..."
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
        </div>
        {(['all', 'active', 'converted', 'expired'] as const).map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); if (s !== 'active') setUrgentOnly(false); }}
            className={`px-3 py-2 rounded-xl text-xs font-medium border capitalize transition-colors ${statusFilter === s ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {s}
          </button>
        ))}
        <button onClick={() => setUrgentOnly(!urgentOnly)}
          className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${urgentOnly ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
          Urgent only
        </button>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} trials</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-56 bg-gray-50 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">{search || statusFilter !== 'all' || urgentOnly ? 'No trials match your filters' : 'No trials yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(trial => (
            <TrialCard key={trial.id} trial={trial} onChase={handleChase} onConvert={handleConvert} onExtend={handleExtend} />
          ))}
        </div>
      )}
    </div>
  );
}
