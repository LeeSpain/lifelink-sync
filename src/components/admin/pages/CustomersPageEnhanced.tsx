import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, RefreshCw, Phone, Mail, MessageSquare, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Star, TrendingUp, Globe, Bot, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Customer {
  user_id: string; email: string; full_name: string; phone?: string;
  preferred_language: string; referral_code?: string; referred_by?: string;
  country_code?: string; created_at: string;
  subscribed: boolean; is_trialing: boolean; subscription_tier?: string;
  subscription_end?: string; stripe_customer_id?: string;
  subscription_status: 'paid' | 'trial' | 'expired' | 'none';
}

interface Note { id: string; note_text: string; is_important: boolean; created_at: string; }

const timeAgo = (d: string) => { if (!d) return '—'; const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; if (s < 604800) return `${Math.floor(s / 86400)}d ago`; return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
const FLAGS: Record<string, string> = { en: '🇬🇧', es: '🇪🇸', nl: '🇳🇱' };
const STATUS = {
  paid: { label: 'Paying', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  trial: { label: 'Trial', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-600', dot: 'bg-red-400' },
  none: { label: 'No plan', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' },
};

// Detail Panel
function CustomerPanel({ customer, onClose, onUpdate }: { customer: Customer; onClose: () => void; onUpdate: () => void }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [tab, setTab] = useState<'overview' | 'notes' | 'actions'>('overview');
  const cfg = STATUS[customer.subscription_status];

  useEffect(() => { loadNotes(); }, [customer.user_id]);
  const loadNotes = async () => { const { data } = await supabase.from('customer_notes').select('*').eq('customer_id', customer.user_id).order('created_at', { ascending: false }); setNotes(data || []); };
  const addNote = async () => { if (!newNote.trim()) return; await supabase.from('customer_notes').insert({ customer_id: customer.user_id, created_by: customer.user_id, note_text: newNote, is_important: false }); setNewNote(''); loadNotes(); toast.success('Note added'); };
  const deleteNote = async (id: string) => { await supabase.from('customer_notes').delete().eq('id', id); loadNotes(); };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-40 flex flex-col border-l border-gray-100">
      <div className="p-5 border-b border-gray-100 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center font-bold text-red-600">
            {(customer.full_name || customer.email || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-1.5">{customer.full_name || 'Unnamed'} <span className="text-sm">{FLAGS[customer.preferred_language] || '🇬🇧'}</span></h2>
            <p className="text-xs text-gray-400">{customer.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">✕</button>
        </div>
      </div>

      <div className="flex border-b border-gray-100">
        {(['overview', 'notes', 'actions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 text-xs font-medium py-3 border-b-2 capitalize ${tab === t ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}{t === 'notes' && notes.length > 0 ? ` (${notes.length})` : ''}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              {customer.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /><a href={`tel:${customer.phone}`} className="text-sm text-gray-700 hover:text-red-500">{customer.phone}</a></div>}
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /><a href={`mailto:${customer.email}`} className="text-sm text-gray-700 hover:text-red-500 truncate">{customer.email}</a></div>
              <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-gray-400" /><span className="text-sm text-gray-600">{FLAGS[customer.preferred_language]} {customer.preferred_language === 'en' ? 'English' : customer.preferred_language === 'es' ? 'Spanish' : 'Dutch'}</span></div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Subscription</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`${cfg.color} px-2 py-0.5 rounded-full text-xs font-medium`}>{cfg.label}</span></div>
                {customer.subscription_tier && <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="text-gray-800 font-medium">{customer.subscription_tier}</span></div>}
                {customer.subscription_end && <div className="flex justify-between"><span className="text-gray-500">{customer.subscription_status === 'expired' ? 'Expired' : 'Renews'}</span><span className="text-gray-700">{new Date(customer.subscription_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>}
                {customer.stripe_customer_id && <div className="flex justify-between"><span className="text-gray-500">Stripe</span><a href={`https://dashboard.stripe.com/customers/${customer.stripe_customer_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs flex items-center gap-1 hover:underline">View in Stripe <ExternalLink className="w-3 h-3" /></a></div>}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="text-gray-700">{timeAgo(customer.created_at)}</span></div>
                {customer.referral_code && <div className="flex justify-between"><span className="text-gray-500">Referral code</span><span className="font-mono text-xs font-bold text-gray-800 bg-gray-200 px-2 py-0.5 rounded">{customer.referral_code}</span></div>}
              </div>
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addNote(); }} placeholder="Add a note..." className="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
              <button onClick={addNote} disabled={!newNote.trim()} className="px-3 h-9 bg-red-500 text-white rounded-xl text-xs font-medium hover:bg-red-600 disabled:opacity-40">Add</button>
            </div>
            {notes.length === 0 ? <p className="text-xs text-gray-400 text-center py-6">No notes yet</p> : notes.map(n => (
              <div key={n.id} className={`rounded-xl p-3 border ${n.is_important ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-800 leading-relaxed flex-1">{n.is_important && <Star className="w-3 h-3 text-amber-500 inline mr-1" />}{n.note_text}</p>
                  <button onClick={() => deleteNote(n.id)} className="text-gray-300 hover:text-red-400 text-xs flex-shrink-0">✕</button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">{timeAgo(n.created_at)}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'actions' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact via CLARA</p>
            {[
              { label: 'Send WhatsApp', icon: MessageSquare, color: 'green', action: async () => { if (!customer.phone) { toast.error('No phone'); return; } await supabase.functions.invoke('clara-escalation', { body: { type: 'manual_invite', contact_name: customer.full_name, contact_phone: customer.phone, message: `Hi ${customer.full_name?.split(' ')[0]}, this is CLARA from LifeLink Sync! Hope all is well 🛡️` } }); toast.success('WhatsApp sent'); }, disabled: !customer.phone },
              { label: 'Call via CLARA', icon: Phone, color: 'blue', action: async () => { if (!customer.phone) { toast.error('No phone'); return; } await supabase.functions.invoke('clara-speak', { body: { to: customer.phone, message: `Hello ${customer.full_name?.split(' ')[0]}, this is CLARA from LifeLink Sync.` } }); toast.success('CLARA calling'); }, disabled: !customer.phone },
              { label: 'Send email', icon: Mail, color: 'purple', action: () => window.open(`mailto:${customer.email}`), disabled: !customer.email },
            ].map(a => (
              <button key={a.label} onClick={a.action} disabled={a.disabled} className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors text-left bg-${a.color}-50 border-${a.color}-200 hover:bg-${a.color}-100 disabled:opacity-40 disabled:cursor-not-allowed`}>
                <div className={`w-9 h-9 rounded-xl bg-${a.color}-100 flex items-center justify-center`}><a.icon className={`w-4 h-4 text-${a.color}-600`} /></div>
                <div><p className={`text-sm font-semibold text-${a.color}-800`}>{a.label}</p><p className={`text-xs text-${a.color}-600`}>{a.disabled ? 'No contact info' : 'Via CLARA'}</p></div>
              </button>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <button onClick={() => { navigator.clipboard.writeText(customer.user_id); toast.success('Copied'); }} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-left">
                <Copy className="w-4 h-4 text-gray-400" /><div><p className="text-xs font-medium text-gray-700">Copy user ID</p><p className="text-xs text-gray-400 font-mono">{customer.user_id.slice(0, 20)}...</p></div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Page
export function CustomersPageEnhanced() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [langFilter, setLangFilter] = useState('all');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [stats, setStats] = useState({ total: 0, paid: 0, trialing: 0, expired: 0, mrr: 0 });

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, phone, preferred_language, referral_code, referred_by, country_code, created_at').order('created_at', { ascending: false });
      const { data: subs } = await supabase.from('subscribers').select('user_id, email, subscribed, is_trialing, subscription_tier, subscription_end, stripe_customer_id');

      const subsMap: Record<string, any> = {};
      subs?.forEach(s => { subsMap[s.user_id] = s; });

      const all: Customer[] = (profiles || []).map(p => {
        const sub = subsMap[p.user_id];
        const status = !sub ? 'none' : sub.is_trialing ? 'trial' : sub.subscribed ? 'paid' : (sub.subscription_end && new Date(sub.subscription_end) < new Date()) ? 'expired' : 'none';
        return {
          user_id: p.user_id, email: sub?.email || '', full_name: p.full_name || '', phone: p.phone || undefined,
          preferred_language: p.preferred_language || 'en', referral_code: p.referral_code || undefined,
          referred_by: p.referred_by || undefined, country_code: p.country_code || undefined, created_at: p.created_at,
          subscribed: sub?.subscribed || false, is_trialing: sub?.is_trialing || false,
          subscription_tier: sub?.subscription_tier, subscription_end: sub?.subscription_end,
          stripe_customer_id: sub?.stripe_customer_id, subscription_status: status as any,
        };
      });

      setCustomers(all);
      const paid = all.filter(c => c.subscription_status === 'paid').length;
      setStats({ total: all.length, paid, trialing: all.filter(c => c.subscription_status === 'trial').length, expired: all.filter(c => c.subscription_status === 'expired').length, mrr: paid * 9.99 });
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, []);

  const filtered = customers.filter(c => {
    if (statusFilter !== 'all' && c.subscription_status !== statusFilter) return false;
    if (langFilter !== 'all' && c.preferred_language !== langFilter) return false;
    if (search) { const s = search.toLowerCase(); return (c.full_name?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || c.phone?.includes(s)); }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-start justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Customers</h1><p className="text-gray-400 text-sm mt-0.5">All users, subscribers and trial members</p></div>
        <Button onClick={loadCustomers} variant="outline" className="flex items-center gap-2 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'blue' },
          { label: 'Paying', value: stats.paid, icon: CheckCircle, color: 'green' },
          { label: 'Trialing', value: stats.trialing, icon: Clock, color: 'amber' },
          { label: 'Expired', value: stats.expired, icon: XCircle, color: 'red' },
          { label: 'MRR', value: `€${stats.mrr.toFixed(2)}`, icon: TrendingUp, color: 'purple' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{s.label}</span>
              <s.icon className={`w-4 h-4 text-${s.color}-500`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone..." className="w-full h-9 pl-9 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white">
          <option value="all">All status</option><option value="paid">Paying</option><option value="trial">Trial</option><option value="expired">Expired</option><option value="none">No plan</option>
        </select>
        <select value={langFilter} onChange={e => setLangFilter(e.target.value)} className="h-9 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white">
          <option value="all">🌐 All</option><option value="en">🇬🇧 English</option><option value="es">🇪🇸 Spanish</option><option value="nl">🇳🇱 Dutch</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} of {stats.total}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            {['Customer', 'Status', 'Phone', 'Lang', 'Joined', 'Renews', ''].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? [...Array(6)].map((_, i) => <tr key={i}><td colSpan={7} className="px-5 py-3"><div className="h-8 bg-gray-50 rounded-lg animate-pulse" /></td></tr>) :
              filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-16 text-gray-400"><Users className="w-10 h-10 text-gray-200 mx-auto mb-2" /><p className="text-sm">No customers found</p></td></tr> :
              filtered.map(c => {
                const cfg = STATUS[c.subscription_status];
                return (
                  <tr key={c.user_id} onClick={() => setSelected(c)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center font-bold text-red-600 text-xs flex-shrink-0">{(c.full_name || c.email || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                        <div className="min-w-0"><p className="font-semibold text-gray-900 text-sm truncate">{c.full_name || '—'}</p><p className="text-xs text-gray-400 truncate">{c.email}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /><span className="text-xs font-medium text-gray-700">{cfg.label}</span></div></td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{c.phone || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3.5"><span className="text-sm">{FLAGS[c.preferred_language] || '🇬🇧'}</span></td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{timeAgo(c.created_at)}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{c.subscription_end ? new Date(c.subscription_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
                    <td className="px-4 py-3.5"><ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" /></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {selected && (
        <><div className="fixed inset-0 bg-black/20 z-30" onClick={() => setSelected(null)} />
        <CustomerPanel customer={selected} onClose={() => setSelected(null)} onUpdate={loadCustomers} /></>
      )}
    </div>
  );
}

export default CustomersPageEnhanced;
