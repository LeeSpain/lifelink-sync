import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PanelData {
  activeMembers: number; mrr: number; baseMrr: number; addonMrr: number; addonCount: number;
  activeTrials: number; expiringTrials: number; signupsToday: number; signupsYesterday: number;
  sosToday: number; sosActive: number; addonsActive: number;
  addonBreakdown: { wellbeing: number; medication: number; family: number };
  claraComplete: number; churnMonth: number; lastUpdated: string;
  ticker: Array<{ title: string; time: string }>;
}

const DEFAULT: PanelData = {
  activeMembers: 0, mrr: 0, baseMrr: 0, addonMrr: 0, addonCount: 0,
  activeTrials: 0, expiringTrials: 0, signupsToday: 0, signupsYesterday: 0,
  sosToday: 0, sosActive: 0, addonsActive: 0,
  addonBreakdown: { wellbeing: 0, medication: 0, family: 0 },
  claraComplete: 0, churnMonth: 0, lastUpdated: '', ticker: [],
};

const fmt = (n: number) => new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
const todayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };
const yesterdayStart = () => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(0, 0, 0, 0); return d.toISOString(); };
const monthStart = () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString(); };

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className="text-center">
      <div className="text-xl font-bold text-white tabular-nums tracking-wider">
        {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Madrid' })}
      </div>
      <div className="text-[10px] text-gray-400">{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' })} CET</div>
    </div>
  );
}

function Panel({ label, value, sub, color = '#00d4ff', flash, icon, children }: {
  label: string; value: string | number; sub?: string; color?: string; flash?: boolean; icon?: string; children?: React.ReactNode;
}) {
  return (
    <div className={`relative bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex flex-col justify-between overflow-hidden transition-all duration-300 ${flash ? 'ring-2 ring-[#00d4ff]/50' : ''}`}>
      {flash && <div className="absolute inset-0 bg-[#00d4ff]/5 animate-pulse pointer-events-none" />}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{label}</span>
          {icon && <span className="text-base">{icon}</span>}
        </div>
        <div className="text-2xl font-bold tracking-tight" style={{ color }}>{value}</div>
        {sub && <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>}
      </div>
      {children && <div className="mt-2 pt-2 border-t border-[#1f2937]">{children}</div>}
    </div>
  );
}

function Ticker({ items }: { items: Array<{ title: string; time: string }> }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || items.length === 0) return;
    let pos = el.scrollWidth;
    const frame = () => { pos -= 1; if (pos < -el.scrollWidth) pos = el.offsetWidth; el.style.transform = `translateX(${pos}px)`; requestAnimationFrame(frame); };
    const id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [items]);
  if (items.length === 0) return <span className="text-gray-600 text-xs">No recent events</span>;
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <div ref={ref} className="inline-block">
        {items.map((item, i) => <span key={i} className="text-[10px] text-gray-400 mx-6"><span className="text-gray-500">{item.time}</span> — {item.title}</span>)}
      </div>
    </div>
  );
}

export default function CommandCentrePage() {
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
    const twoDays = new Date(Date.now() + 2 * 86400000).toISOString();

    const q = async <T,>(name: string, fn: () => Promise<{ data: T | null; count?: number | null; error: any }>): Promise<{ data: T | null; count: number }> => {
      try { const r = await fn(); if (r.error) { errs.add(name); return { data: null, count: 0 }; } return { data: r.data, count: r.count ?? 0 }; }
      catch { errs.add(name); return { data: null, count: 0 }; }
    };

    const [members, trials, expTrials, sToday, sYesterday, sosT, sosA, addons, clara, churn, ticker] = await Promise.all([
      q('members', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('subscribed', true).eq('is_trialing', false)),
      q('trials', () => supabase.from('trial_tracking').select('*', { count: 'exact', head: true }).eq('status', 'active')),
      q('expTrials', () => supabase.from('trial_tracking').select('*', { count: 'exact', head: true }).eq('status', 'active').lte('trial_end', twoDays)),
      q('sToday', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).gte('created_at', today)),
      q('sYesterday', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).gte('created_at', yesterday).lt('created_at', today)),
      q('sosT', () => supabase.from('sos_incidents').select('*', { count: 'exact', head: true }).gte('created_at', today)),
      q('sosA', () => supabase.from('sos_incidents').select('*', { count: 'exact', head: true }).eq('status', 'in_progress')),
      q('addons', () => supabase.from('member_addons').select('addon_id, status, addon:addon_id(slug)').eq('status', 'active')),
      q('clara', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('clara_complete_unlocked', true)),
      q('churn', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('subscribed', false).gte('updated_at', month)),
      q('ticker', () => supabase.from('contact_timeline').select('event_title, occurred_at').order('occurred_at', { ascending: false }).limit(5)),
    ]);

    const rows = (addons.data as any[]) || [];
    const wb = rows.filter((a: any) => a.addon?.slug?.includes('wellbeing')).length;
    const med = rows.filter((a: any) => a.addon?.slug?.includes('medication')).length;
    const fam = rows.filter((a: any) => a.addon?.slug?.includes('family')).length;
    const ac = rows.length;
    const bm = members.count * 9.99;
    const am = ac * 2.99;

    setErrors(errs);
    setData({
      activeMembers: members.count, mrr: Math.round((bm + am) * 100) / 100, baseMrr: Math.round(bm * 100) / 100, addonMrr: Math.round(am * 100) / 100, addonCount: ac,
      activeTrials: trials.count, expiringTrials: expTrials.count, signupsToday: sToday.count, signupsYesterday: sYesterday.count,
      sosToday: sosT.count, sosActive: sosA.count, addonsActive: ac,
      addonBreakdown: { wellbeing: wb, medication: med, family: fam },
      claraComplete: clara.count, churnMonth: churn.count,
      lastUpdated: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Madrid' }),
      ticker: ((ticker.data as any[]) || []).map((t: any) => ({ title: t.event_title || 'Event', time: new Date(t.occurred_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }) })),
    });
  }, []);

  useEffect(() => { loadData(); const i = setInterval(loadData, 60000); return () => clearInterval(i); }, [loadData]);

  useEffect(() => {
    const chs = [
      supabase.channel('cc2-subs').on('postgres_changes', { event: '*', schema: 'public', table: 'subscribers' }, () => { flash('members'); loadData(); }).subscribe(),
      supabase.channel('cc2-sos').on('postgres_changes', { event: '*', schema: 'public', table: 'sos_incidents' }, () => { flash('sos'); loadData(); }).subscribe(),
      supabase.channel('cc2-addons').on('postgres_changes', { event: '*', schema: 'public', table: 'member_addons' }, () => { flash('addons'); loadData(); }).subscribe(),
    ];
    return () => { chs.forEach(c => supabase.removeChannel(c)); };
  }, [loadData]);

  const warn = (n: string) => errors.has(n) ? <span className="text-amber-500 text-[10px] ml-1">⚠</span> : null;
  const isF = (n: string) => flashPanels.has(n);

  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-[#0a0e1a] flex flex-col overflow-hidden rounded-xl">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#1f2937] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">LS</div>
          <span className="text-white font-bold tracking-tight">LifeLink Sync</span>
          <span className="text-gray-600 text-[10px] ml-1">Command Centre</span>
        </div>
        <LiveClock />
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span>
          <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-3 p-3 min-h-0">
        <Panel label="Active Members" value={data.activeMembers} color="#10b981" icon="👥" flash={isF('members')} sub={data.signupsToday > 0 ? `+${data.signupsToday} today` : undefined}>{warn('members')}</Panel>
        <Panel label="Est. MRR" value={fmt(data.mrr)} color="#00d4ff" icon="💰" flash={isF('members')}>
          <div className="flex justify-between text-[10px] text-gray-500"><span>Base: {fmt(data.baseMrr)}</span><span>Add-ons: {fmt(data.addonMrr)}</span></div>
        </Panel>
        <Panel label="Active Trials" value={data.activeTrials} color="#f59e0b" icon="⏱️" flash={isF('members')} sub={data.expiringTrials > 0 ? `${data.expiringTrials} expiring in 48h` : 'None expiring soon'}>{warn('trials')}</Panel>
        <Panel label="Today's Sign-ups" value={data.signupsToday} color="#00d4ff" icon="🆕" flash={isF('members')}>
          <div className="text-[10px] text-gray-500">Yesterday: {data.signupsYesterday}{data.signupsToday > data.signupsYesterday && <span className="text-green-400 ml-1">↑</span>}{data.signupsToday < data.signupsYesterday && <span className="text-red-400 ml-1">↓</span>}</div>
        </Panel>
        <Panel label="SOS Alerts Today" value={data.sosToday} color={data.sosActive > 0 ? '#ef4444' : '#10b981'} icon="🚨" flash={isF('sos')}>
          <div className={`text-[10px] font-semibold ${data.sosActive > 0 ? 'text-red-400 animate-pulse' : 'text-green-500'}`}>{data.sosActive > 0 ? `${data.sosActive} ACTIVE NOW` : 'All clear'}</div>
        </Panel>
        <Panel label="Add-ons Active" value={data.addonsActive} color="#00d4ff" icon="➕" flash={isF('addons')}>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            <div className="text-center"><div className="font-bold text-white">{data.addonBreakdown.wellbeing}</div><div className="text-gray-600">Wellbeing</div></div>
            <div className="text-center"><div className="font-bold text-white">{data.addonBreakdown.medication}</div><div className="text-gray-600">Meds</div></div>
            <div className="text-center"><div className="font-bold text-white">{data.addonBreakdown.family}</div><div className="text-gray-600">Family</div></div>
          </div>
        </Panel>
        <Panel label="CLARA Complete" value={data.claraComplete} color="#7c3aed" icon="🤖"><div className="text-[10px] text-gray-500">Full AI protection unlocked</div>{warn('clara')}</Panel>
        <Panel label="Cancellations This Month" value={data.churnMonth} color={data.churnMonth > 0 ? '#ef4444' : '#10b981'} icon="📉">
          <div className="text-[10px] text-gray-500">{data.churnMonth === 0 ? 'Zero churn — perfect month' : `${data.churnMonth} lost`}</div>
        </Panel>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-5 py-2 border-t border-[#1f2937] flex-shrink-0 bg-[#0d1117]">
        <div className="text-[10px] text-gray-600 flex-shrink-0 w-40">Updated: {data.lastUpdated || '—'}</div>
        <div className="flex-1 mx-6 overflow-hidden"><Ticker items={data.ticker} /></div>
        <div className="text-[10px] text-gray-600 flex-shrink-0 text-right">CLARA is watching 👁️</div>
      </div>
    </div>
  );
}
