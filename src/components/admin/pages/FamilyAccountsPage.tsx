import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Heart, RefreshCw, Search, CheckCircle, XCircle, Clock, Mail, Phone, MessageSquare, Trash2, CreditCard, Star, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const timeAgo = (d: string) => { if (!d) return '—'; const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; };

interface Invite { id: string; inviter_user_id: string; inviter_email: string; invitee_name: string; invitee_email: string; relationship: string; status: string; created_at: string; accepted_at?: string; expires_at: string; }
interface Group { inviter_email: string; invites: Invite[]; member_count: number; accepted: number; pending: number; }

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-600' },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-500' },
};

// Send Invite Modal
function InviteModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', relationship: 'Family Member', member_email: '', language: 'en' });
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    if (!form.email && !form.phone) { toast.error('Email or phone required'); return; }
    setSending(true);
    try {
      // Find inviter user_id
      let inviterUserId = null;
      if (form.member_email) {
        const { data: sub } = await supabase.from('subscribers').select('user_id').eq('email', form.member_email).maybeSingle();
        inviterUserId = sub?.user_id;
      }

      const expires = new Date(); expires.setDate(expires.getDate() + 7);
      await supabase.from('family_invites').insert({
        inviter_user_id: inviterUserId, inviter_email: form.member_email || 'admin@lifelink-sync.com',
        invitee_email: form.email || null, invitee_name: form.name, relationship: form.relationship, status: 'pending', expires_at: expires.toISOString(),
      });

      // Send WhatsApp if phone
      if (form.phone) {
        const langName = form.language === 'es' ? 'Spanish' : form.language === 'nl' ? 'Dutch' : 'English';
        let msg = `Hi ${form.name}! You've been invited to join a LifeLink Sync family circle. Sign up free at lifelink-sync.com 🛡️`;
        try {
          const resp = await supabase.functions.invoke('ai-chat', { body: { message: `Write a 2-sentence WhatsApp invite for ${form.name} (${form.relationship}) to join a LifeLink Sync family circle. Language: ${langName}. Include lifelink-sync.com. Sign as CLARA. Return only message.`, language: 'en', isOwnerPersonal: true } });
          if (resp.data?.response) msg = resp.data.response;
        } catch { /* use default */ }
        await supabase.functions.invoke('clara-escalation', { body: { type: 'manual_invite', contact_name: form.name, contact_phone: form.phone, message: msg } });
        toast.success(`WhatsApp sent to ${form.name}`);
      }

      // Send email if provided
      if (form.email) {
        await supabase.functions.invoke('family-invites', { body: { invitee_email: form.email, invitee_name: form.name, relationship: form.relationship } }).catch(() => {});
        toast.success(`Email sent to ${form.email}`);
      }

      onSent(); onClose();
    } catch (err: any) { toast.error(err.message || 'Failed'); } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div><h2 className="text-lg font-bold text-gray-900">Send Family Invite</h2><p className="text-xs text-gray-400">Invite someone to join a family circle</p></div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Member's email <span className="normal-case text-gray-400 font-normal">(whose circle?)</span></label><Input value={form.member_email} onChange={e => setForm(f => ({ ...f, member_email: e.target.value }))} placeholder="member@example.com" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Invitee name *</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Relationship</label>
              <select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white">
                {['Spouse/Partner', 'Parent', 'Child', 'Sibling', 'Grandparent', 'Friend', 'Carer', 'Family Member'].map(r => <option key={r} value={r}>{r}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">WhatsApp</label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+34 600 000 000" /></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Email</label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" /></div>
          </div>
          <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Language</label>
            <div className="flex gap-2">
              {[{ code: 'en', label: '🇬🇧 English' }, { code: 'es', label: '🇪🇸 Spanish' }, { code: 'nl', label: '🇳🇱 Dutch' }].map(l => (
                <button key={l.code} onClick={() => setForm(f => ({ ...f, language: l.code }))} className={`flex-1 py-2 rounded-xl text-xs font-medium border ${form.language === l.code ? 'bg-red-50 border-red-400 text-red-700' : 'bg-white border-gray-200 text-gray-600'}`}>{l.label}</button>
              ))}
            </div></div>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={send} disabled={sending || !form.name.trim() || (!form.email && !form.phone)} className="flex-1 bg-red-500 hover:bg-red-600 text-white">{sending ? 'Sending...' : '🛡️ Send invite'}</Button>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function FamilyAccountsPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'groups' | 'invites'>('groups');
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ groups: 0, members: 0, accepted: 0, pending: 0, revenue: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: inv } = await supabase.from('family_invites').select('*').order('created_at', { ascending: false }).limit(200);
      const allInvites = inv || [];
      setInvites(allInvites);

      // Group by inviter
      const groupMap: Record<string, Group> = {};
      allInvites.forEach(i => {
        const key = i.inviter_email;
        if (!groupMap[key]) groupMap[key] = { inviter_email: key, invites: [], member_count: 0, accepted: 0, pending: 0 };
        groupMap[key].invites.push(i);
        groupMap[key].member_count++;
        if (i.status === 'accepted') groupMap[key].accepted++;
        if (i.status === 'pending') groupMap[key].pending++;
      });
      const allGroups = Object.values(groupMap).sort((a, b) => b.member_count - a.member_count);
      setGroups(allGroups);

      const accepted = allInvites.filter(i => i.status === 'accepted').length;
      const pending = allInvites.filter(i => i.status === 'pending').length;
      const paidLinks = allGroups.reduce((s, g) => s + Math.max(0, g.accepted - 1), 0);
      setStats({ groups: allGroups.length, members: allInvites.length, accepted, pending, revenue: paidLinks * 2.99 });
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, []);

  const resendInvite = async (inv: Invite) => {
    if (inv.invitee_email) {
      await supabase.functions.invoke('family-invites', { body: { invitee_email: inv.invitee_email, invitee_name: inv.invitee_name, relationship: inv.relationship } }).catch(() => {});
      toast.success(`Resent to ${inv.invitee_email}`);
    }
  };

  const revokeInvite = async (id: string) => {
    if (!confirm('Revoke this invite?')) return;
    await supabase.from('family_invites').update({ status: 'expired' }).eq('id', id);
    toast.success('Revoked'); loadData();
  };

  const deleteInvite = async (id: string) => {
    if (!confirm('Delete this invite permanently?')) return;
    await supabase.from('family_invites').delete().eq('id', id);
    toast.success('Deleted'); loadData();
  };

  const filteredGroups = groups.filter(g => !search || g.inviter_email.toLowerCase().includes(search.toLowerCase()) || g.invites.some(i => i.invitee_name.toLowerCase().includes(search.toLowerCase())));
  const filteredInvites = invites.filter(i => !search || i.invitee_name.toLowerCase().includes(search.toLowerCase()) || i.invitee_email?.toLowerCase().includes(search.toLowerCase()) || i.inviter_email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-start justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Family Accounts</h1><p className="text-gray-400 text-sm mt-0.5">Manage family circles and invitations</p></div>
        <div className="flex gap-2">
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm"><UserPlus className="w-4 h-4" />Send invite</Button>
          <Button onClick={loadData} variant="outline" className="flex items-center gap-2 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Family circles', value: stats.groups, icon: Users, color: 'blue' },
          { label: 'Total invites', value: stats.members, icon: Heart, color: 'red' },
          { label: 'Accepted', value: stats.accepted, icon: CheckCircle, color: 'green' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'amber' },
          { label: 'Link revenue', value: `€${stats.revenue.toFixed(2)}/mo`, icon: CreditCard, color: 'purple' },
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

      <div className="flex items-center gap-4 mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[{ key: 'groups', label: `Circles (${groups.length})` }, { key: 'invites', label: `All invites (${invites.length})` }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{t.label}</button>
          ))}
        </div>
        <div className="relative flex-1 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full h-9 pl-8 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
        </div>
      </div>

      {tab === 'groups' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? [...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-50 rounded-2xl animate-pulse" />) :
            filteredGroups.length === 0 ? <div className="col-span-3 text-center py-20"><Users className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-gray-400 font-medium">No family circles yet</p></div> :
            filteredGroups.map(g => (
              <div key={g.inviter_email} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center font-bold text-red-600 text-sm">{g.inviter_email[0].toUpperCase()}</div>
                  <div className="min-w-0"><p className="font-bold text-gray-900 text-sm truncate">{g.inviter_email}</p><p className="text-xs text-gray-400">{g.member_count} member{g.member_count !== 1 ? 's' : ''} invited</p></div>
                </div>
                <div className="flex gap-2 mb-3">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{g.accepted} accepted</span>
                  {g.pending > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{g.pending} pending</span>}
                </div>
                <div className="space-y-1.5">
                  {g.invites.slice(0, 3).map(inv => {
                    const cfg = STATUS_CFG[inv.status] || STATUS_CFG.pending;
                    return (
                      <div key={inv.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2"><span className="text-gray-700 font-medium">{inv.invitee_name}</span><span className="text-gray-400">({inv.relationship})</span></div>
                        <span className={`px-1.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      </div>
                    );
                  })}
                  {g.invites.length > 3 && <p className="text-xs text-gray-400">+{g.invites.length - 3} more</p>}
                </div>
              </div>
            ))}
        </div>
      )}

      {tab === 'invites' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {loading ? <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />)}</div> :
            filteredInvites.length === 0 ? <div className="text-center py-16"><Mail className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">No invites</p></div> :
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 bg-gray-50">
                {['Invitee', 'Relationship', 'From', 'Status', 'Sent', 'Actions'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredInvites.map(inv => {
                  const cfg = STATUS_CFG[inv.status] || STATUS_CFG.pending;
                  const expired = inv.status === 'pending' && new Date(inv.expires_at) < new Date();
                  return (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3"><div><p className="text-sm font-medium text-gray-800">{inv.invitee_name}</p><p className="text-xs text-gray-400">{inv.invitee_email}</p></div></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{inv.relationship}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{inv.inviter_email}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${expired ? 'bg-red-100 text-red-600' : cfg.color}`}>{expired ? 'Expired' : cfg.label}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-400">{timeAgo(inv.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {(inv.status === 'pending' || expired) && <button onClick={() => resendInvite(inv)} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs border border-blue-200 hover:bg-blue-100">Resend</button>}
                          {inv.status === 'pending' && <button onClick={() => revokeInvite(inv.id)} className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs border border-amber-200 hover:bg-amber-100">Revoke</button>}
                          <button onClick={() => deleteInvite(inv.id)} className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs border border-red-200 hover:bg-red-100">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>}
        </div>
      )}

      {showModal && <InviteModal onClose={() => setShowModal(false)} onSent={loadData} />}
    </div>
  );
}
