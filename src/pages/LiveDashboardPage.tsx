import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── PIN Gate ───
const DASHBOARD_PIN = '241192';
const SESSION_KEY = 'cc_auth';

function PinGate({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 6) {
      if (next === DASHBOARD_PIN) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        onSuccess();
      } else {
        setShake(true);
        setError(true);
        setTimeout(() => { setPin(''); setShake(false); }, 600);
      }
    }
  };

  const handleBackspace = () => { setPin(p => p.slice(0, -1)); setError(false); };

  return (
    <div className="h-screen w-screen bg-[#0a0e1a] flex items-center justify-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="text-center w-72">
        <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">LS</div>
        <h1 className="text-white text-xl font-bold mb-1">LifeLink Sync</h1>
        <p className="text-gray-500 text-xs mb-8">Command Centre</p>

        {/* PIN dots */}
        <div className={`flex justify-center gap-3 mb-6 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
              i < pin.length ? (error ? 'bg-red-500 border-red-500' : 'bg-[#00d4ff] border-[#00d4ff]') : 'border-gray-600'
            }`} />
          ))}
        </div>

        {error && <p className="text-red-400 text-xs mb-4 font-medium">Incorrect PIN</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9','','0','←'].map(key => (
            <button key={key || 'empty'} disabled={!key}
              onClick={() => key === '←' ? handleBackspace() : key ? handleDigit(key) : null}
              className={`h-14 rounded-xl text-xl font-semibold transition-all ${
                !key ? 'invisible' : key === '←'
                  ? 'bg-[#1f2937] text-gray-400 hover:bg-[#374151] active:bg-[#4b5563]'
                  : 'bg-[#111827] text-white border border-[#1f2937] hover:bg-[#1f2937] active:bg-[#374151]'
              }`}>
              {key}
            </button>
          ))}
        </div>

        <p className="text-gray-700 text-[10px] mt-6">Enter 6-digit PIN to access</p>
      </div>

      <style>{`@keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-8px); } 40%,80% { transform: translateX(8px); } }`}</style>
    </div>
  );
}

// ─── Dashboard types + helpers ───
interface PanelData {
  activeMembers: number; mrr: number; baseMrr: number; addonMrr: number; addonCount: number;
  activeTrials: number; expiringTrials: number; signupsToday: number; signupsYesterday: number;
  sosToday: number; sosActive: number; addonsActive: number;
  addonBreakdown: { wellbeing: number; medication: number; family: number };
  claraComplete: number; churnMonth: number; lastUpdated: string;
  ticker: Array<{ title: string; time: string }>;
}

const EMPTY: PanelData = {
  activeMembers: 0, mrr: 0, baseMrr: 0, addonMrr: 0, addonCount: 0,
  activeTrials: 0, expiringTrials: 0, signupsToday: 0, signupsYesterday: 0,
  sosToday: 0, sosActive: 0, addonsActive: 0,
  addonBreakdown: { wellbeing: 0, medication: 0, family: 0 },
  claraComplete: 0, churnMonth: 0, lastUpdated: '', ticker: [],
};

const fmt = (n: number) => new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
const isoToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };
const isoYesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(0, 0, 0, 0); return d.toISOString(); };
const isoMonth = () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString(); };

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
        {items.map((item, i) => <span key={i} className="text-xs text-gray-400 mx-6"><span className="text-gray-500">{item.time}</span> — {item.title}</span>)}
      </div>
    </div>
  );
}

// ─── Dashboard ───
function Dashboard() {
  const [data, setData] = useState<PanelData>(EMPTY);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [flashing, setFlashing] = useState<Set<string>>(new Set());

  const flash = (p: string) => { setFlashing(s => new Set(s).add(p)); setTimeout(() => setFlashing(s => { const n = new Set(s); n.delete(p); return n; }), 2000); };

  const load = useCallback(async () => {
    const errs = new Set<string>();
    const today = isoToday(), yesterday = isoYesterday(), month = isoMonth();
    const twoDays = new Date(Date.now() + 2 * 86400000).toISOString();

    const q = async <T,>(name: string, fn: () => Promise<{ data: T | null; count?: number | null; error: any }>): Promise<{ data: T | null; count: number }> => {
      try { const r = await fn(); if (r.error) { errs.add(name); return { data: null, count: 0 }; } return { data: r.data, count: r.count ?? 0 }; }
      catch { errs.add(name); return { data: null, count: 0 }; }
    };

    const [mem, tri, expTri, sT, sY, sosT, sosA, add, cla, chu, tick] = await Promise.all([
      q('mem', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('subscribed', true).eq('is_trialing', false)),
      q('tri', () => supabase.from('trial_tracking').select('*', { count: 'exact', head: true }).eq('status', 'active')),
      q('expTri', () => supabase.from('trial_tracking').select('*', { count: 'exact', head: true }).eq('status', 'active').lte('trial_end', twoDays)),
      q('sT', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).gte('created_at', today)),
      q('sY', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).gte('created_at', yesterday).lt('created_at', today)),
      q('sosT', () => supabase.from('sos_incidents').select('*', { count: 'exact', head: true }).gte('created_at', today)),
      q('sosA', () => supabase.from('sos_incidents').select('*', { count: 'exact', head: true }).eq('status', 'in_progress')),
      q('add', () => supabase.from('member_addons').select('addon_id, status, addon:addon_id(slug)').eq('status', 'active')),
      q('cla', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('clara_complete_unlocked', true)),
      q('chu', () => supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('subscribed', false).gte('updated_at', month)),
      q('tick', () => supabase.from('contact_timeline').select('event_title, occurred_at').order('occurred_at', { ascending: false }).limit(5)),
    ]);

    const rows = (add.data as any[]) || [];
    const wb = rows.filter((a: any) => a.addon?.slug?.includes('wellbeing')).length;
    const md = rows.filter((a: any) => a.addon?.slug?.includes('medication')).length;
    const fm = rows.filter((a: any) => a.addon?.slug?.includes('family')).length;
    const ac = rows.length, bm = mem.count * 9.99, am = ac * 2.99;

    setErrors(errs);
    setData({
      activeMembers: mem.count, mrr: Math.round((bm + am) * 100) / 100, baseMrr: Math.round(bm * 100) / 100, addonMrr: Math.round(am * 100) / 100, addonCount: ac,
      activeTrials: tri.count, expiringTrials: expTri.count, signupsToday: sT.count, signupsYesterday: sY.count,
      sosToday: sosT.count, sosActive: sosA.count, addonsActive: ac,
      addonBreakdown: { wellbeing: wb, medication: md, family: fm },
      claraComplete: cla.count, churnMonth: chu.count,
      lastUpdated: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Madrid' }),
      ticker: ((tick.data as any[]) || []).map((t: any) => ({ title: t.event_title || 'Event', time: new Date(t.occurred_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }) })),
    });
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 60000); return () => clearInterval(i); }, [load]);
  useEffect(() => {
    const chs = [
      supabase.channel('live-subs').on('postgres_changes', { event: '*', schema: 'public', table: 'subscribers' }, () => { flash('mem'); load(); }).subscribe(),
      supabase.channel('live-sos').on('postgres_changes', { event: '*', schema: 'public', table: 'sos_incidents' }, () => { flash('sos'); load(); }).subscribe(),
      supabase.channel('live-add').on('postgres_changes', { event: '*', schema: 'public', table: 'member_addons' }, () => { flash('add'); load(); }).subscribe(),
    ];
    return () => { chs.forEach(c => supabase.removeChannel(c)); };
  }, [load]);

  const w = (n: string) => errors.has(n) ? <span className="text-amber-500 text-xs ml-1" title="Query failed">⚠</span> : null;
  const f = (n: string) => flashing.has(n);

  return (
    <div className="h-screen w-screen bg-[#0a0e1a] flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1f2937] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">LS</div>
          <span className="text-white font-bold text-lg tracking-tight">LifeLink Sync</span>
          <span className="text-gray-600 text-xs ml-2">Command Centre</span>
        </div>
        <LiveClock />
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
          <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-4 p-4 min-h-0">
        <Panel label="Active Members" value={data.activeMembers} color="#10b981" icon="👥" flash={f('mem')} sub={data.signupsToday > 0 ? `+${data.signupsToday} today` : undefined}>{w('mem')}</Panel>
        <Panel label="Est. MRR" value={fmt(data.mrr)} color="#00d4ff" icon="💰" flash={f('mem')}>
          <div className="flex justify-between text-xs text-gray-500"><span>Base: {fmt(data.baseMrr)}</span><span>Add-ons: {fmt(data.addonMrr)}</span></div>
        </Panel>
        <Panel label="Active Trials" value={data.activeTrials} color="#f59e0b" icon="⏱️" flash={f('mem')} sub={data.expiringTrials > 0 ? `${data.expiringTrials} expiring in 48h` : 'None expiring soon'}>{w('tri')}</Panel>
        <Panel label="Today's Sign-ups" value={data.signupsToday} color="#00d4ff" icon="🆕" flash={f('mem')}>
          <div className="text-xs text-gray-500">Yesterday: {data.signupsYesterday}{data.signupsToday > data.signupsYesterday && <span className="text-green-400 ml-2">↑</span>}{data.signupsToday < data.signupsYesterday && <span className="text-red-400 ml-2">↓</span>}</div>
        </Panel>
        <Panel label="SOS Alerts Today" value={data.sosToday} color={data.sosActive > 0 ? '#ef4444' : '#10b981'} icon="🚨" flash={f('sos')}>
          <div className={`text-xs font-semibold ${data.sosActive > 0 ? 'text-red-400 animate-pulse' : 'text-green-500'}`}>{data.sosActive > 0 ? `${data.sosActive} ACTIVE NOW` : 'All clear'}</div>{w('sosT')}
        </Panel>
        <Panel label="Add-ons Active" value={data.addonsActive} color="#00d4ff" icon="➕" flash={f('add')}>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center"><div className="font-bold text-white">{data.addonBreakdown.wellbeing}</div><div className="text-gray-600 text-[10px]">Wellbeing</div></div>
            <div className="text-center"><div className="font-bold text-white">{data.addonBreakdown.medication}</div><div className="text-gray-600 text-[10px]">Meds</div></div>
            <div className="text-center"><div className="font-bold text-white">{data.addonBreakdown.family}</div><div className="text-gray-600 text-[10px]">Family</div></div>
          </div>{w('add')}
        </Panel>
        <Panel label="CLARA Complete" value={data.claraComplete} color="#7c3aed" icon="🤖"><div className="text-xs text-gray-500">Full AI protection unlocked</div>{w('cla')}</Panel>
        <Panel label="Cancellations This Month" value={data.churnMonth} color={data.churnMonth > 0 ? '#ef4444' : '#10b981'} icon="📉">
          <div className="text-xs text-gray-500">{data.churnMonth === 0 ? 'Zero churn — perfect month' : `${data.churnMonth} lost this month`}</div>{w('chu')}
        </Panel>
      </div>

      {/* Bottom */}
      <div className="flex items-center justify-between px-6 py-2.5 border-t border-[#1f2937] flex-shrink-0 bg-[#0d1117]">
        <div className="text-xs text-gray-600 flex-shrink-0 w-48">Last updated: {data.lastUpdated || '—'}</div>
        <div className="flex-1 mx-8 overflow-hidden"><Ticker items={data.ticker} /></div>
        <div className="text-xs text-gray-600 flex-shrink-0 text-right w-72">LifeLink Sync Command Centre — CLARA is watching 👁️</div>
      </div>
    </div>
  );
}

// ─── Main Export ───
export default function LiveDashboardPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');

  // Swap PWA manifest to fullscreen Command Centre version while on /live
  useEffect(() => {
    // Save and remove the default manifest
    const defaultManifest = document.querySelector('link[rel="manifest"]');
    const defaultHref = defaultManifest?.getAttribute('href') || null;
    if (defaultManifest) defaultManifest.remove();

    // Inject the live-specific fullscreen manifest
    const liveManifest = document.createElement('link');
    liveManifest.rel = 'manifest';
    liveManifest.href = '/live-manifest.json';
    document.head.appendChild(liveManifest);

    // Set theme color to match the dark dashboard
    const themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    themeColor.content = '#0a0e1a';
    document.head.appendChild(themeColor);

    // Apple PWA meta tags for fullscreen on iOS
    const appleMobile = document.createElement('meta');
    appleMobile.name = 'apple-mobile-web-app-capable';
    appleMobile.content = 'yes';
    document.head.appendChild(appleMobile);

    const appleStatusBar = document.createElement('meta');
    appleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
    appleStatusBar.content = 'black';
    document.head.appendChild(appleStatusBar);

    return () => {
      // Clean up — remove injected tags
      liveManifest.remove();
      themeColor.remove();
      appleMobile.remove();
      appleStatusBar.remove();

      // Restore default manifest
      if (defaultHref) {
        const restored = document.createElement('link');
        restored.rel = 'manifest';
        restored.href = defaultHref;
        document.head.appendChild(restored);
      }
    };
  }, []);

  if (!authed) return <PinGate onSuccess={() => setAuthed(true)} />;
  return <Dashboard />;
}
