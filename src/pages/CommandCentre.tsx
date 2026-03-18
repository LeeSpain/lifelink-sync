import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ───
interface PanelData {
  activeMembers: number;
  mrr: number;
  baseMrr: number;
  addonMrr: number;
  addonCount: number;
  activeTrials: number;
  expiringTrials: number;
  signupsToday: number;
  signupsYesterday: number;
  sosToday: number;
  sosActive: number;
  addonsActive: number;
  addonBreakdown: { wellbeing: number; medication: number; family: number };
  claraComplete: number;
  churnMonth: number;
  lastUpdated: string;
  ticker: Array<{ title: string; time: string }>;
}

const DEFAULT: PanelData = {
  activeMembers: 0, mrr: 0, baseMrr: 0, addonMrr: 0, addonCount: 0,
  activeTrials: 0, expiringTrials: 0, signupsToday: 0, signupsYesterday: 0,
  sosToday: 0, sosActive: 0, addonsActive: 0,
  addonBreakdown: { wellbeing: 0, medication: 0, family: 0 },
  claraComplete: 0, churnMonth: 0, lastUpdated: '', ticker: [],
};

// ─── Helpers ───
const fmt = (n: number) => new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };
const yesterdayStart = () => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(0, 0, 0, 0); return d.toISOString(); };
const monthStart = () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString(); };

// ─── Live Clock ───
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white tabular-nums tracking-wider">
        {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Madrid' })}
      </div>
      <div className="text-xs text-gray-400 mt-0.5">
        {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' })} CET
      </div>
    </div>
  );
}

// ─── Metric Panel ───
function Panel({ label, value, sub, color = '#00d4ff', flash, icon, children }: {
  label: string; value: string | number; sub?: string; color?: string; flash?: boolean; icon?: string; children?: React.ReactNode;
}) {
  return (
    <div className={`relative bg-[#111827] border border-[#1f2937] rounded-xl p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 ${flash ? 'ring-2 ring-[#00d4ff]/50' : ''}`}>
      {flash && <div className="absolute inset-0 bg-[#00d4ff]/5 animate-pulse pointer-events-none" />}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{label}</span>
          {icon && <span className="text-lg">{icon}</span>}
        </div>
        <div className="text-3xl font-bold tracking-tight" style={{ color }}>{value}</div>
        {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
      </div>
      {children && <div className="mt-3 pt-3 border-t border-[#1f2937]">{children}</div>}
    </div>
  );
}

// ─── Ticker ───
function Ticker({ items }: { items: Array<{ title: string; time: string }> }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || items.length === 0) return;
    let pos = el.scrollWidth;
    const speed = 1;
    const frame = () => { pos -= speed; if (pos < -el.scrollWidth) pos = el.offsetWidth; el.style.transform = `translateX(${pos}px)`; requestAnimationFrame(frame); };
    const id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [items]);

  if (items.length === 0) return <span className="text-gray-600 text-xs">No recent events</span>;
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <div ref={ref} className="inline-block">
        {items.map((item, i) => (
          <span key={i} className="text-xs text-gray-400 mx-6">
            <span className="text-gray-500">{item.time}</span> — {item.title}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main ───
export default function CommandCentre() {
  const [data, setData] = useState<PanelData>(DEFAULT);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [flashPanels, setFlashPanels] = useState<Set<string>>(new Set());

  const flash = (panel: string) => {
    setFlashPanels(prev => new Set(prev).add(panel));
    setTimeout(() => setFlashPanels(prev => { const n = new Set(prev); n.delete(panel); return n; }), 2000);
  };

  const loadData = useCallback(async () => {
    const errs = new Set<string>();
    const today = todayStart();
    const yesterday = yesterdayStart();
    const month = monthStart();
    const twoDaysFromNow = new Date(Date.now() + 2 * 86400000).toISOString();

    const q = async <T,>(name: string, fn: () => Promise<{ data: T | null; count?: number | null; error: any }>): Promise<{ data: T | null; count: number }> => {
      try {
        const res = await fn();
        if (res.error) { errs.add(name); return { data: null, count: 0 }; }
        return { data: res.data, count: res.count ?? 0 };
      } catch { errs.add(name); return { data: null, count: 0 }; }
    };

    const [members, trials, expiringTrials, signupsToday, signupsYesterday, sosToday, sosActive, addons, claraComplete, churn, tickerRes] = await Promise.all([
      q('members', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('subscribed', true).eq('is_trialing', false)),
      q('trials', () => supabase.from('trial_tracking').select('*', { count: 'exact', head: true }).eq('status', 'active')),
      q('expiringTrials', () => supabase.from('trial_tracking').select('*', { count: 'exact', head: true }).eq('status', 'active').lte('trial_end', twoDaysFromNow)),
      q('signupsToday', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).gte('created_at', today)),
      q('signupsYesterday', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).gte('created_at', yesterday).lt('created_at', today)),
      q('sosToday', () => supabase.from('sos_incidents').select('*', { count: 'exact', head: true }).gte('created_at', today)),
      q('sosActive', () => supabase.from('sos_incidents').select('*', { count: 'exact', head: true }).eq('status', 'in_progress')),
      q('addons', () => supabase.from('member_addons').select('addon_id, status, addon:addon_id(slug)').eq('status', 'active')),
      q('claraComplete', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('clara_complete_unlocked', true)),
      q('churn', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('subscribed', false).gte('updated_at', month)),
      q('ticker', () => supabase.from('contact_timeline').select('event_title, occurred_at').order('occurred_at', { ascending: false }).limit(5)),
    ]);

    const addonRows = (addons.data as any[]) || [];
    const wellbeing = addonRows.filter((a: any) => a.addon?.slug === 'daily-wellbeing' || a.addon?.slug === 'daily_wellbeing').length;
    const medication = addonRows.filter((a: any) => a.addon?.slug === 'medication-reminder' || a.addon?.slug === 'medication_reminder').length;
    const family = addonRows.filter((a: any) => a.addon?.slug === 'family-link' || a.addon?.slug === 'family_link' || a.addon?.slug === 'extra-family-link').length;
    const addonCount = addonRows.length;
    const baseMrr = members.count * 9.99;
    const addonMrr = addonCount * 2.99;

    const tickerItems = ((tickerRes.data as any[]) || []).map((t: any) => ({
      title: t.event_title || 'Event',
      time: new Date(t.occurred_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }),
    }));

    setErrors(errs);
    setData({
      activeMembers: members.count,
      mrr: Math.round((baseMrr + addonMrr) * 100) / 100,
      baseMrr: Math.round(baseMrr * 100) / 100,
      addonMrr: Math.round(addonMrr * 100) / 100,
      addonCount,
      activeTrials: trials.count,
      expiringTrials: expiringTrials.count,
      signupsToday: signupsToday.count,
      signupsYesterday: signupsYesterday.count,
      sosToday: sosToday.count,
      sosActive: sosActive.count,
      addonsActive: addonCount,
      addonBreakdown: { wellbeing, medication, family },
      claraComplete: claraComplete.count,
      churnMonth: churn.count,
      lastUpdated: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Madrid' }),
      ticker: tickerItems,
    });
  }, []);

  // Initial load + 60s poll
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Real-time subscriptions
  useEffect(() => {
    const channels = [
      supabase.channel('cc-subscribers').on('postgres_changes', { event: '*', schema: 'public', table: 'subscribers' }, () => { flash('members'); loadData(); }).subscribe(),
      supabase.channel('cc-sos').on('postgres_changes', { event: '*', schema: 'public', table: 'sos_incidents' }, () => { flash('sos'); loadData(); }).subscribe(),
      supabase.channel('cc-addons').on('postgres_changes', { event: '*', schema: 'public', table: 'member_addons' }, () => { flash('addons'); loadData(); }).subscribe(),
    ];
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [loadData]);

  const warn = (name: string) => errors.has(name) ? <span className="text-amber-500 text-xs ml-1" title="Query failed">⚠</span> : null;
  const isFlash = (name: string) => flashPanels.has(name);

  return (
    <div className="h-screen w-screen bg-[#0a0e1a] flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1f2937] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">LS</div>
          <span className="text-white font-bold text-lg tracking-tight">LifeLink Sync</span>
          <span className="text-gray-600 text-xs ml-2">Command Centre</span>
        </div>
        <LiveClock />
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-4 p-4 min-h-0">

        {/* P1: Active Members */}
        <Panel label="Active Members" value={data.activeMembers} color="#10b981" icon="👥" flash={isFlash('members')}
          sub={data.signupsToday > 0 ? `+${data.signupsToday} today` : undefined}>
          {warn('members')}
        </Panel>

        {/* P2: MRR */}
        <Panel label="Est. MRR" value={fmt(data.mrr)} color="#00d4ff" icon="💰" flash={isFlash('members')}>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Base: {fmt(data.baseMrr)}</span>
            <span>Add-ons: {fmt(data.addonMrr)}</span>
          </div>
          {warn('members')}
        </Panel>

        {/* P3: Active Trials */}
        <Panel label="Active Trials" value={data.activeTrials} color="#f59e0b" icon="⏱️" flash={isFlash('members')}
          sub={data.expiringTrials > 0 ? `${data.expiringTrials} expiring in 48h` : 'None expiring soon'}>
          {warn('trials')}
        </Panel>

        {/* P4: Sign-ups Today */}
        <Panel label="Today's Sign-ups" value={data.signupsToday} color="#00d4ff" icon="🆕" flash={isFlash('members')}>
          <div className="text-xs text-gray-500">
            Yesterday: {data.signupsYesterday}
            {data.signupsToday > data.signupsYesterday && <span className="text-green-400 ml-2">↑</span>}
            {data.signupsToday < data.signupsYesterday && <span className="text-red-400 ml-2">↓</span>}
          </div>
          {warn('signupsToday')}
        </Panel>

        {/* P5: SOS Alerts */}
        <Panel label="SOS Alerts Today" value={data.sosToday} color={data.sosActive > 0 ? '#ef4444' : '#10b981'} icon="🚨" flash={isFlash('sos')}>
          <div className={`text-xs font-semibold ${data.sosActive > 0 ? 'text-red-400 animate-pulse' : 'text-green-500'}`}>
            {data.sosActive > 0 ? `${data.sosActive} ACTIVE NOW` : 'All clear'}
          </div>
          {warn('sosToday')}
        </Panel>

        {/* P6: Add-ons Active */}
        <Panel label="Add-ons Active" value={data.addonsActive} color="#00d4ff" icon="➕" flash={isFlash('addons')}>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center"><div className="font-bold text-white">{data.addonBreakdown.wellbeing}</div><div className="text-gray-600 text-[10px]">Wellbeing</div></div>
            <div className="text-center"><div className="font-bold text-white">{data.addonBreakdown.medication}</div><div className="text-gray-600 text-[10px]">Meds</div></div>
            <div className="text-center"><div className="font-bold text-white">{data.addonBreakdown.family}</div><div className="text-gray-600 text-[10px]">Family</div></div>
          </div>
          {warn('addons')}
        </Panel>

        {/* P7: CLARA Complete */}
        <Panel label="CLARA Complete" value={data.claraComplete} color="#7c3aed" icon="🤖">
          <div className="text-xs text-gray-500">Full AI protection unlocked</div>
          {warn('claraComplete')}
        </Panel>

        {/* P8: Churn This Month */}
        <Panel label="Cancellations This Month" value={data.churnMonth} color={data.churnMonth > 0 ? '#ef4444' : '#10b981'} icon="📉">
          <div className="text-xs text-gray-500">
            {data.churnMonth === 0 ? 'Zero churn — perfect month' : `${data.churnMonth} lost this month`}
          </div>
          {warn('churn')}
        </Panel>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-t border-[#1f2937] flex-shrink-0 bg-[#0d1117]">
        <div className="text-xs text-gray-600 flex-shrink-0 w-48">
          Last updated: {data.lastUpdated || '—'}
        </div>
        <div className="flex-1 mx-8 overflow-hidden">
          <Ticker items={data.ticker} />
        </div>
        <div className="text-xs text-gray-600 flex-shrink-0 text-right w-72">
          LifeLink Sync Command Centre — CLARA is watching 👁️
        </div>
      </div>
    </div>
  );
}
