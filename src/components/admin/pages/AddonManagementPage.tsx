import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, RefreshCw, ToggleLeft, ToggleRight, AlertCircle, CheckCircle, DollarSign, Users, Heart, Clock, Star, Shield, Package, ExternalLink, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const fmt = (n: number) => `€${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ICONS: Record<string, any> = { Users, Heart, Clock, Star, Shield, Package, Plus, DollarSign };
const CAT_COLORS: Record<string, string> = { family: 'bg-blue-100 text-blue-700', wellness: 'bg-green-100 text-green-700', safety: 'bg-red-100 text-red-700' };
const parseFeatures = (f: any): string[] => { if (!f) return []; if (Array.isArray(f)) return f; try { const p = JSON.parse(f); return Array.isArray(p) ? p : []; } catch { return []; } };

function PriceEditor({ value, onSave }: { value: number; onSave: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toFixed(2));
  if (!editing) return <button onClick={() => { setDraft(value.toFixed(2)); setEditing(true); }} className="font-bold text-gray-900 hover:text-red-600 flex items-center gap-1 group">{fmt(value)}<Edit className="w-3 h-3 text-gray-300 group-hover:text-red-400" /></button>;
  const commit = () => { const n = parseFloat(draft); if (isNaN(n) || n < 0) { toast.error('Invalid'); setEditing(false); return; } onSave(n); setEditing(false); };
  return (<div className="flex items-center gap-1.5"><span className="text-gray-500 text-sm">€</span><input type="number" step="0.01" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }} autoFocus className="w-20 h-7 px-2 rounded-lg border border-red-400 text-sm font-bold focus:outline-none" /><button onClick={commit} className="w-6 h-6 rounded-md bg-green-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></button><button onClick={() => setEditing(false)} className="w-6 h-6 rounded-md bg-gray-200 flex items-center justify-center"><X className="w-3 h-3 text-gray-600" /></button></div>);
}

function AddonModal({ addon, onClose, onSaved }: { addon?: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ slug: addon?.slug || '', name: addon?.name || '', description: addon?.description || '', price: addon?.price || 2.99, icon: addon?.icon || 'Heart', category: addon?.category || 'wellness', is_active: addon?.is_active !== false, sort_order: addon?.sort_order || 0, features: parseFeatures(addon?.features), stripe_price_id: addon?.stripe_price_id || '' });
  const [newFeat, setNewFeat] = useState(''); const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) { toast.error('Name and slug required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), sort_order: Number(form.sort_order), features: JSON.stringify(form.features), updated_at: new Date().toISOString() };
      if (addon?.id) { const { error } = await supabase.from('addon_catalog').update(payload).eq('id', addon.id); if (error) throw error; }
      else { const { error } = await supabase.from('addon_catalog').insert({ ...payload, created_at: new Date().toISOString() }); if (error) throw error; }
      toast.success(addon ? 'Updated' : 'Created'); onSaved(); onClose();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">{addon ? 'Edit Add-on' : 'New Add-on'}</h2><button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">✕</button></div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Name *</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div><div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Slug *</label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') }))} className="font-mono" disabled={!!addon?.id} /></div></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20" /></div>
          <div className="grid grid-cols-3 gap-3"><div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Price (€)</label><Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) }))} /></div><div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Category</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white"><option value="wellness">Wellness</option><option value="family">Family</option><option value="safety">Safety</option></select></div><div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Sort</label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) }))} /></div></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Icon</label><div className="flex flex-wrap gap-2">{Object.keys(ICONS).map(ic => { const Ic = ICONS[ic]; return <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))} className={`w-9 h-9 rounded-xl border flex items-center justify-center ${form.icon === ic ? 'bg-red-50 border-red-400' : 'bg-white border-gray-200'}`}><Ic className="w-4 h-4 text-gray-600" /></button>; })}</div></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Stripe price ID</label><Input value={form.stripe_price_id} onChange={e => setForm(f => ({ ...f, stripe_price_id: e.target.value }))} placeholder="price_..." className="font-mono text-xs" /></div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Features</label><div className="space-y-1.5 mb-2">{form.features.map((feat: string, i: number) => (<div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5"><Check className="w-3.5 h-3.5 text-green-500" /><span className="text-sm text-gray-700 flex-1">{feat}</span><button onClick={() => setForm(ff => ({ ...ff, features: ff.features.filter((_: any, idx: number) => idx !== i) }))} className="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center"><X className="w-3 h-3 text-gray-400" /></button></div>))}</div><div className="flex gap-2"><Input value={newFeat} onChange={e => setNewFeat(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newFeat.trim()) { setForm(f => ({ ...f, features: [...f.features, newFeat.trim()] })); setNewFeat(''); } } }} placeholder="Add feature..." className="flex-1" /><Button variant="outline" onClick={() => { if (newFeat.trim()) { setForm(f => ({ ...f, features: [...f.features, newFeat.trim()] })); setNewFeat(''); } }} className="text-xs px-3">Add</Button></div></div>
          <label className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3"><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-red-500" /><span className="text-sm font-medium text-gray-700">Active</span></label>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3"><Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button><Button onClick={save} disabled={saving} className="flex-1 bg-red-500 hover:bg-red-600 text-white">{saving ? 'Saving...' : addon ? 'Save' : 'Create'}</Button></div>
      </div>
    </div>
  );
}

export default function AddonManagementPage() {
  const [addons, setAddons] = useState<any[]>([]); const [plans, setPlans] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'addons' | 'pricing'>('addons'); const [showModal, setShowModal] = useState(false); const [editAddon, setEditAddon] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, subs: 0, revenue: 0 });

  useEffect(() => { loadData(); }, []);
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ar, pr, mr] = await Promise.all([supabase.from('addon_catalog').select('*').order('sort_order'), supabase.from('subscription_plans').select('*').order('sort_order'), supabase.from('member_addons').select('addon_id, status').eq('status', 'active')]);
      const sm: Record<string, number> = {}; mr.data?.forEach((m: any) => { sm[m.addon_id] = (sm[m.addon_id] || 0) + 1; });
      const ad = (ar.data || []).map((a: any) => ({ ...a, features: parseFeatures(a.features), subs: sm[a.id] || 0 }));
      setAddons(ad); setPlans((pr.data || []).map((p: any) => ({ ...p, features: parseFeatures(p.features) })));
      const ts = Object.values(sm).reduce((s, c) => s + c, 0);
      setStats({ total: ad.length, active: ad.filter((a: any) => a.is_active).length, subs: ts, revenue: ad.reduce((s: number, a: any) => s + a.subs * a.price, 0) });
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  }, []);

  const toggleAddon = async (a: any) => { await supabase.from('addon_catalog').update({ is_active: !a.is_active }).eq('id', a.id); toast.success(`${a.name} ${!a.is_active ? 'on' : 'off'}`); loadData(); };
  const deleteAddon = async (a: any) => { if (!confirm(`Delete "${a.name}"?`)) return; await supabase.from('addon_catalog').delete().eq('id', a.id).then(({ error }) => error ? toast.error(error.message) : (toast.success('Deleted'), loadData())); };
  const updateAddonPrice = async (id: string, p: number) => { await supabase.from('addon_catalog').update({ price: p }).eq('id', id); toast.success('Updated'); loadData(); };
  const togglePlan = async (p: any) => { await supabase.from('subscription_plans').update({ is_active: !p.is_active }).eq('id', p.id); toast.success(`${p.name} ${!p.is_active ? 'on' : 'off'}`); loadData(); };
  const updatePlanPrice = async (id: string, p: number) => { await supabase.from('subscription_plans').update({ price: p }).eq('id', id); toast.success('Price live'); loadData(); };

  return (
    <div className="px-8 py-6 w-full">
      <div className="flex items-start justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">{tab === 'addons' ? 'Add-On Management' : 'Pricing Configuration'}</h1><p className="text-gray-400 text-sm mt-0.5">{tab === 'addons' ? 'Click price to edit inline' : 'Changes apply immediately'}</p></div>
        <div className="flex gap-2">{tab === 'addons' && <Button onClick={() => { setEditAddon(null); setShowModal(true); }} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm"><Plus className="w-4 h-4" />New</Button>}<Button onClick={loadData} variant="outline" className="text-sm"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></Button></div>
      </div>

      {tab === 'addons' && <div className="grid grid-cols-4 gap-4 mb-6">{[{ l: 'Add-ons', v: stats.total, i: Package, c: 'blue' }, { l: 'Active', v: stats.active, i: CheckCircle, c: 'green' }, { l: 'Subscribers', v: stats.subs, i: Users, c: 'purple' }, { l: 'MRR', v: fmt(stats.revenue), i: DollarSign, c: 'green' }].map(s => (<div key={s.l} className="bg-white border border-gray-200 rounded-2xl p-4"><div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{s.l}</span><s.i className={`w-4 h-4 text-${s.c}-500`} /></div><p className="text-xl font-bold text-gray-900">{loading ? '—' : s.v}</p></div>))}</div>}
      {tab === 'pricing' && <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-5 py-3.5 mb-6"><AlertCircle className="w-5 h-5 text-amber-600" /><p className="text-sm text-amber-800"><strong>Live prices.</strong> Stripe must be updated separately.</p></div>}

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">{[{ k: 'addons', l: '🧩 Add-Ons' }, { k: 'pricing', l: '💰 Pricing' }].map(t => (<button key={t.k} onClick={() => setTab(t.k as any)} className={`px-5 py-2 rounded-lg text-sm font-medium ${tab === t.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{t.l}</button>))}</div>

      {tab === 'addons' && (<>
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-6"><Star className="w-5 h-5 text-green-600 mt-0.5" /><div><p className="text-sm font-bold text-green-800">CLARA Complete — auto-unlock</p><p className="text-xs text-green-600">Free when both Wellbeing + Medication active</p></div></div>
        {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-56 bg-gray-50 rounded-2xl animate-pulse" />)}</div> :
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{addons.map((a: any) => { const Ic = ICONS[a.icon] || Package; const cc = CAT_COLORS[a.category] || 'bg-gray-100 text-gray-600'; return (
            <div key={a.id} className={`bg-white border rounded-2xl overflow-hidden hover:shadow-md ${a.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
              <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-400" /><div className="p-5">
                <div className="flex items-start justify-between mb-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><Ic className="w-5 h-5 text-red-600" /></div><div><p className="font-bold text-gray-900 text-sm">{a.name}</p><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cc}`}>{a.category}</span></div></div><button onClick={() => toggleAddon(a)}>{a.is_active ? <ToggleRight className="w-7 h-7 text-green-500" /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}</button></div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{a.description}</p>
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 mb-3"><span className="text-xs text-gray-500">Price/mo</span><PriceEditor value={a.price} onSave={p => updateAddonPrice(a.id, p)} /></div>
                <div className="grid grid-cols-2 gap-2 mb-3"><div className="text-center bg-gray-50 rounded-xl py-2"><p className="text-sm font-bold text-gray-900">{a.subs}</p><p className="text-xs text-gray-400">Users</p></div><div className="text-center bg-gray-50 rounded-xl py-2"><p className="text-sm font-bold text-green-600">{fmt(a.subs * a.price)}</p><p className="text-xs text-gray-400">/mo</p></div></div>
                {a.stripe_price_id ? <a href={`https://dashboard.stripe.com/prices/${a.stripe_price_id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 mb-3"><ExternalLink className="w-3 h-3" />Stripe</a> : <p className="text-xs text-amber-600 flex items-center gap-1 mb-3"><AlertCircle className="w-3 h-3" />No Stripe</p>}
                {a.features?.length > 0 && <div className="mb-3 space-y-1">{a.features.slice(0, 3).map((f: string, i: number) => <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600"><Check className="w-3 h-3 text-green-500 mt-0.5" />{f}</div>)}{a.features.length > 3 && <p className="text-xs text-gray-400">+{a.features.length - 3} more</p>}</div>}
                <div className="flex gap-2 border-t border-gray-100 pt-3"><button onClick={() => { setEditAddon(a); setShowModal(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100"><Edit className="w-3.5 h-3.5" />Edit</button><button onClick={() => deleteAddon(a)} className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center hover:bg-red-100"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button></div>
              </div>
            </div>); })}</div>}
      </>)}

      {tab === 'pricing' && (<div className="space-y-4">{loading ? [...Array(2)].map((_, i) => <div key={i} className="h-48 bg-gray-50 rounded-2xl animate-pulse" />) : plans.map((p: any) => (
        <div key={p.id} className={`bg-white border rounded-2xl p-6 ${p.is_popular ? 'border-red-300 ring-1 ring-red-100' : p.is_active ? 'border-gray-200' : 'border-gray-200 opacity-50'}`}>
          <div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><Shield className="w-5 h-5 text-gray-600" /></div><div><div className="flex items-center gap-2"><p className="font-bold text-gray-900">{p.name}</p>{p.is_popular && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Popular</span>}</div>{p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}</div></div><button onClick={() => togglePlan(p)}>{p.is_active ? <ToggleRight className="w-7 h-7 text-green-500" /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}</button></div>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-4"><div><p className="text-xs text-gray-500 mb-0.5">Monthly</p><PriceEditor value={p.price} onSave={pr => updatePlanPrice(p.id, pr)} /></div><div className="text-right"><p className="text-xs text-gray-500 mb-0.5">Annual</p><p className="text-sm font-bold text-gray-700">{fmt(p.price * 10)}/yr</p><p className="text-xs text-green-600">saves {fmt(p.price * 2)}</p></div></div>
          {p.stripe_price_id ? <a href={`https://dashboard.stripe.com/prices/${p.stripe_price_id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 mb-4"><ExternalLink className="w-3 h-3" />{p.stripe_price_id}</a> : <p className="text-xs text-amber-600 flex items-center gap-1 mb-4"><AlertCircle className="w-3 h-3" />No Stripe</p>}
          {p.features?.length > 0 && <div className="border-t border-gray-100 pt-4"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Features ({p.features.length})</p><div className="grid grid-cols-2 gap-1">{p.features.map((f: string, i: number) => <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600"><Check className="w-3 h-3 text-green-500 mt-0.5" />{f}</div>)}</div></div>}
        </div>))}</div>)}

      {showModal && <AddonModal addon={editAddon} onClose={() => setShowModal(false)} onSaved={loadData} />}
    </div>
  );
}
