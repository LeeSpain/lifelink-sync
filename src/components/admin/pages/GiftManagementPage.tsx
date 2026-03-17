import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Gift, RefreshCw, Search, Send, Copy, CheckCircle, XCircle, Clock, Mail, Plus, CreditCard, TrendingUp, Star, Trash2, MoreVertical, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface GiftSub {
  id: string; buyer_name: string; buyer_email: string; recipient_name: string; recipient_email?: string;
  recipient_phone?: string; persona: string; months: number; amount: number; personal_message?: string;
  delivery_method: string; preferred_language: string; redemption_code: string;
  status: string; payment_status: string; sent_at?: string; redeemed_at?: string; created_at: string;
}

const fmt = (n: number) => `€${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const timeAgo = (d: string) => { if (!d) return '—'; const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; };
const EMOJI: Record<string, string> = { mum: '👩', dad: '👨', partner: '❤️', grandparent: '👴', colleague: '💼', general: '🎁', anyone: '🎁' };
const FLAGS: Record<string, string> = { en: '🇬🇧', es: '🇪🇸', nl: '🇳🇱' };
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Delivered', color: 'bg-purple-100 text-purple-700' },
  redeemed: { label: 'Redeemed ✓', color: 'bg-green-100 text-green-700' },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-500' },
  refunded: { label: 'Refunded', color: 'bg-red-100 text-red-600' },
};

// Create Gift Modal
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ buyer_name: '', buyer_email: '', recipient_name: '', recipient_email: '', recipient_phone: '', persona: 'general', months: 1, amount: 9.99, personal_message: '', delivery_method: 'email', preferred_language: 'en', payment_status: 'paid' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.recipient_name.trim() || !form.buyer_name.trim()) { toast.error('Buyer and recipient names required'); return; }
    setSaving(true);
    try {
      const expires = new Date(); expires.setFullYear(expires.getFullYear() + 1);
      const { data, error } = await supabase.from('gift_subscriptions').insert({ ...form, status: 'pending', expires_at: expires.toISOString() }).select('id, redemption_code').single();
      if (error) throw error;
      toast.success(`Gift created! Code: ${data?.redemption_code}`);
      onCreated(); onClose();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div><h2 className="text-lg font-bold text-gray-900">Create Gift Subscription</h2><p className="text-xs text-gray-400">Manually create for any buyer</p></div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Who is this for?</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ k: 'mum', l: '👩 Mum' }, { k: 'dad', l: '👨 Dad' }, { k: 'partner', l: '❤️ Partner' }, { k: 'grandparent', l: '👴 Grandparent' }, { k: 'colleague', l: '💼 Colleague' }, { k: 'general', l: '🎁 General' }].map(p => (
                <button key={p.k} onClick={() => setForm(f => ({ ...f, persona: p.k }))} className={`py-2 rounded-xl text-xs font-medium border ${form.persona === p.k ? 'bg-red-50 border-red-400 text-red-700' : 'bg-white border-gray-200 text-gray-600'}`}>{p.l}</button>
              ))}
            </div></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {[{ m: 1, p: 9.99 }, { m: 3, p: 28.99 }, { m: 6, p: 54.99 }, { m: 12, p: 99.90 }].map(o => (
                <button key={o.m} onClick={() => setForm(f => ({ ...f, months: o.m, amount: o.p }))} className={`py-3 rounded-xl border ${form.months === o.m ? 'bg-red-50 border-red-400' : 'bg-white border-gray-200'}`}>
                  <p className={`text-sm font-bold ${form.months === o.m ? 'text-red-700' : 'text-gray-900'}`}>{o.m}mo</p><p className="text-xs text-gray-400">€{o.p}</p>
                </button>
              ))}
            </div></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Buyer</p>
            <div className="grid grid-cols-2 gap-3"><Input value={form.buyer_name} onChange={e => setForm(f => ({ ...f, buyer_name: e.target.value }))} placeholder="Buyer name *" /><Input type="email" value={form.buyer_email} onChange={e => setForm(f => ({ ...f, buyer_email: e.target.value }))} placeholder="buyer@email.com" /></div></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recipient</p>
            <div className="grid grid-cols-2 gap-3"><Input value={form.recipient_name} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} placeholder="Recipient name *" /><Input type="email" value={form.recipient_email} onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))} placeholder="Recipient email" /><Input value={form.recipient_phone} onChange={e => setForm(f => ({ ...f, recipient_phone: e.target.value }))} placeholder="WhatsApp (optional)" className="col-span-2" /></div></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Language</label><div className="flex gap-1.5">{[{ c: 'en', f: '🇬🇧' }, { c: 'es', f: '🇪🇸' }, { c: 'nl', f: '🇳🇱' }].map(l => (<button key={l.c} onClick={() => setForm(f => ({ ...f, preferred_language: l.c }))} className={`flex-1 py-2 rounded-xl text-sm border ${form.preferred_language === l.c ? 'bg-red-50 border-red-400' : 'bg-white border-gray-200'}`}>{l.f}</button>))}</div></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Delivery</label><select value={form.delivery_method} onChange={e => setForm(f => ({ ...f, delivery_method: e.target.value }))} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white"><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="both">Both</option></select></div>
          </div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Personal message</label><textarea value={form.personal_message} onChange={e => setForm(f => ({ ...f, personal_message: e.target.value }))} placeholder="Optional message from buyer..." rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20" /></div>
          <label className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 font-medium"><input type="checkbox" checked={form.payment_status === 'paid'} onChange={e => setForm(f => ({ ...f, payment_status: e.target.checked ? 'paid' : 'unpaid' }))} className="w-4 h-4 accent-red-500" />Payment received <span className="text-xs text-gray-400">(€{form.amount})</span></label>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={save} disabled={saving} className="flex-1 bg-red-500 hover:bg-red-600 text-white">{saving ? 'Creating...' : '🎁 Create gift'}</Button>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function GiftManagementPage() {
  const [gifts, setGifts] = useState<GiftSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, sent: 0, redeemed: 0, revenue: 0, redemptionRate: 0 });

  useEffect(() => { loadGifts(); }, []);

  const loadGifts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('gift_subscriptions').select('*').order('created_at', { ascending: false });
      const all = data || [];
      setGifts(all);
      const redeemable = all.filter(g => ['sent', 'redeemed', 'delivered'].includes(g.status)).length;
      const redeemed = all.filter(g => g.status === 'redeemed').length;
      setStats({
        total: all.length,
        pending: all.filter(g => g.status === 'pending').length,
        sent: all.filter(g => g.status === 'sent').length,
        redeemed,
        revenue: all.filter(g => g.payment_status === 'paid').reduce((s, g) => s + (g.amount || 0), 0),
        redemptionRate: redeemable > 0 ? Math.round((redeemed / redeemable) * 100) : 0,
      });
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, []);

  const sendGift = async (g: GiftSub) => {
    if (g.recipient_email) {
      await supabase.functions.invoke('gift-send-email', { body: { gift_id: g.id, recipient_email: g.recipient_email, recipient_name: g.recipient_name, buyer_name: g.buyer_name, redemption_code: g.redemption_code, months: g.months, personal_message: g.personal_message } }).catch(() => {});
    }
    if (g.recipient_phone) {
      await supabase.functions.invoke('clara-escalation', { body: { type: 'manual_invite', contact_name: g.recipient_name, contact_phone: g.recipient_phone, message: `🎁 ${g.recipient_name}, you've received a ${g.months}-month LifeLink Sync gift from ${g.buyer_name}! Redeem code: ${g.redemption_code} at lifelink-sync.com/gift/redeem` } }).catch(() => {});
    }
    await supabase.from('gift_subscriptions').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', g.id);
    toast.success(`Gift sent to ${g.recipient_name}`); loadGifts();
  };

  const markRedeemed = async (g: GiftSub) => {
    await supabase.from('gift_subscriptions').update({ status: 'redeemed', redeemed_at: new Date().toISOString() }).eq('id', g.id);
    toast.success('Marked redeemed'); loadGifts();
  };

  const markRefunded = async (g: GiftSub) => { if (!confirm('Refund?')) return; await supabase.from('gift_subscriptions').update({ status: 'refunded', payment_status: 'refunded' }).eq('id', g.id); toast.success('Refunded'); loadGifts(); };
  const deleteGift = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('gift_subscriptions').delete().eq('id', id); toast.success('Deleted'); loadGifts(); };
  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success('Code copied'); };

  const filtered = gifts.filter(g => {
    if (statusFilter !== 'all' && g.status !== statusFilter) return false;
    if (search) { const s = search.toLowerCase(); return g.buyer_name?.toLowerCase().includes(s) || g.recipient_name?.toLowerCase().includes(s) || g.redemption_code?.toLowerCase().includes(s) || g.recipient_email?.toLowerCase().includes(s); }
    return true;
  });

  return (
    <div className="px-8 py-6 w-full">
      <div className="flex items-start justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Gift Subscriptions</h1><p className="text-gray-400 text-sm mt-0.5">Manage gifts, track redemptions, send delivery messages</p></div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm"><Plus className="w-4 h-4" />Create gift</Button>
          <Button onClick={loadGifts} variant="outline" className="flex items-center gap-2 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
        </div>
      </div>

      {stats.pending > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-5 py-3.5 mb-6">
          <Clock className="w-5 h-5 text-amber-600" /><p className="text-sm text-amber-800"><strong>{stats.pending} gift{stats.pending !== 1 ? 's' : ''}</strong> waiting to be sent</p>
          <button onClick={() => setStatusFilter('pending')} className="ml-auto text-xs font-bold text-amber-700">View pending →</button>
        </div>
      )}

      <div className="grid grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: Gift, color: 'purple' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'amber' },
          { label: 'Sent', value: stats.sent, icon: Send, color: 'blue' },
          { label: 'Redeemed', value: stats.redeemed, icon: CheckCircle, color: 'green' },
          { label: 'Revenue', value: fmt(stats.revenue), icon: CreditCard, color: 'green' },
          { label: 'Redemption', value: `${stats.redemptionRate}%`, icon: TrendingUp, color: 'blue' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{s.label}</span><s.icon className={`w-4 h-4 text-${s.color}-500`} /></div>
            <p className="text-xl font-bold text-gray-900">{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or code..." className="w-full h-9 pl-8 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" /></div>
        {['all', 'pending', 'sent', 'redeemed', 'expired', 'refunded'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-xl text-xs font-medium border capitalize ${statusFilter === s ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200'}`}>{s}</button>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} gift{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="h-56 bg-gray-50 rounded-2xl animate-pulse" />)}</div> :
        filtered.length === 0 ? <div className="text-center py-20"><Gift className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-gray-400 font-medium">No gifts found</p><button onClick={() => setShowCreate(true)} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">Create first gift</button></div> :
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(g => {
            const cfg = STATUS_CFG[g.status] || STATUS_CFG.pending;
            return (
              <div key={g.id} className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all ${g.status === 'pending' ? 'border-amber-300' : g.status === 'redeemed' ? 'border-green-200' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-xl">{EMOJI[g.persona] || '🎁'}</div>
                    <div><p className="font-bold text-gray-900 text-sm">For {g.recipient_name}</p><p className="text-xs text-gray-400">from {g.buyer_name}</p></div>
                  </div>
                  <div className="flex gap-1">
                    {g.status !== 'redeemed' && <button onClick={() => markRedeemed(g)} className="w-6 h-6 rounded hover:bg-green-50 flex items-center justify-center" title="Mark redeemed"><Check className="w-3 h-3 text-green-500" /></button>}
                    <button onClick={() => deleteGift(g.id)} className="w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center" title="Delete"><Trash2 className="w-3 h-3 text-red-400" /></button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 mb-3">
                  <div><p className="text-xs text-gray-400 mb-0.5">Code</p><p className="font-mono font-bold text-gray-900 text-sm tracking-wider">{g.redemption_code || '—'}</p></div>
                  <button onClick={() => copyCode(g.redemption_code)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-gray-900">{fmt(g.amount)} · {g.months}mo</span>
                  <span className="text-sm">{FLAGS[g.preferred_language] || '🇬🇧'}</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                  {g.personal_message && <span className="text-xs text-gray-400 italic truncate">"{g.personal_message.slice(0, 25)}..."</span>}
                </div>

                {g.status === 'redeemed' && g.redeemed_at && <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded-lg px-2.5 py-1.5 mb-3"><CheckCircle className="w-3.5 h-3.5" />Redeemed {timeAgo(g.redeemed_at)}</div>}
                <p className="text-xs text-gray-400 mb-3">Created {timeAgo(g.created_at)}{g.sent_at ? ` · Sent ${timeAgo(g.sent_at)}` : ''}</p>

                {g.status === 'pending' && <button onClick={() => sendGift(g)} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-red-500 text-white rounded-xl hover:bg-red-600"><Send className="w-3.5 h-3.5" />Send gift now</button>}
                {g.status === 'sent' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => sendGift(g)} className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100"><Send className="w-3.5 h-3.5" />Resend</button>
                    <button onClick={() => markRedeemed(g)} className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100"><Check className="w-3.5 h-3.5" />Redeemed</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={loadGifts} />}
    </div>
  );
}
