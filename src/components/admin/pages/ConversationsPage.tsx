import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Search, RefreshCw, Bot, User, Send, Globe, Smartphone, Mail, Activity, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ConvItem {
  id: string;
  channel: 'web_chat' | 'whatsapp';
  contact_name?: string;
  contact_phone?: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
  is_ai: boolean;
  source_table: string;
}

interface Msg {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  created_at: string;
  is_ai: boolean;
}

const timeAgo = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

export default function ConversationsPage() {
  const [convs, setConvs] = useState<ConvItem[]>([]);
  const [selected, setSelected] = useState<ConvItem | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState({ total: 0, whatsapp: 0, web: 0, today: 0 });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const all: ConvItem[] = [];

      // WhatsApp conversations
      const { data: waConvs } = await supabase
        .from('whatsapp_conversations')
        .select('id, phone_number, contact_name, last_message_at, status')
        .order('last_message_at', { ascending: false })
        .limit(50);

      if (waConvs) {
        for (const wc of waConvs) {
          const { data: lastMsg } = await supabase.from('whatsapp_messages')
            .select('content, direction, is_ai_generated')
            .eq('conversation_id', wc.id)
            .order('timestamp', { ascending: false }).limit(1).maybeSingle();

          const { count } = await supabase.from('whatsapp_messages')
            .select('*', { count: 'exact', head: true }).eq('conversation_id', wc.id);

          if (lastMsg) {
            all.push({
              id: wc.id, channel: 'whatsapp',
              contact_name: wc.contact_name || undefined,
              contact_phone: wc.phone_number,
              last_message: lastMsg.content || '(media)',
              last_message_at: wc.last_message_at,
              message_count: count || 0,
              is_ai: lastMsg.is_ai_generated || false,
              source_table: 'whatsapp_conversations',
            });
          }
        }
      }

      // Web chat sessions (from conversations table)
      const { data: webMsgs } = await supabase.from('conversations')
        .select('session_id, content, message_type, created_at')
        .order('created_at', { ascending: false }).limit(200);

      if (webMsgs) {
        const sessions: Record<string, typeof webMsgs> = {};
        webMsgs.forEach(m => { if (!sessions[m.session_id]) sessions[m.session_id] = []; sessions[m.session_id].push(m); });

        Object.entries(sessions).slice(0, 30).forEach(([sid, msgs]) => {
          const sorted = msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const last = sorted[0];
          all.push({
            id: sid, channel: 'web_chat',
            contact_name: 'Web visitor',
            last_message: last.content?.slice(0, 80) || '',
            last_message_at: last.created_at,
            message_count: msgs.length,
            is_ai: last.message_type === 'ai',
            source_table: 'conversations',
          });
        });
      }

      all.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      setConvs(all);

      const today = new Date(); today.setHours(0, 0, 0, 0);
      setStats({
        total: all.length,
        whatsapp: all.filter(c => c.channel === 'whatsapp').length,
        web: all.filter(c => c.channel === 'web_chat').length,
        today: all.filter(c => new Date(c.last_message_at) >= today).length,
      });
    } catch (err) {
      console.error('Load error:', err);
    } finally { setLoading(false); }
  }, []);

  const loadMessages = async (conv: ConvItem) => {
    setMsgLoading(true); setMessages([]);
    try {
      let msgs: Msg[] = [];
      if (conv.source_table === 'whatsapp_conversations') {
        const { data } = await supabase.from('whatsapp_messages').select('id, content, direction, is_ai_generated, timestamp')
          .eq('conversation_id', conv.id).order('timestamp', { ascending: true });
        msgs = (data || []).map(m => ({ id: m.id, direction: m.direction as any, content: m.content || '(media)', created_at: m.timestamp, is_ai: m.is_ai_generated || false }));
      } else {
        const { data } = await supabase.from('conversations').select('id, content, message_type, created_at')
          .eq('session_id', conv.id).order('created_at', { ascending: true });
        msgs = (data || []).map(m => ({ id: m.id, direction: m.message_type === 'ai' ? 'outbound' as const : 'inbound' as const, content: m.content, created_at: m.created_at, is_ai: m.message_type === 'ai' }));
      }
      setMessages(msgs);
    } catch { /* */ } finally { setMsgLoading(false); }
  };

  const selectConv = (c: ConvItem) => { setSelected(c); loadMessages(c); };

  const sendReply = async () => {
    if (!replyText.trim() || !selected?.contact_phone) return;
    setSending(true);
    try {
      await supabase.functions.invoke('clara-escalation', {
        body: { type: 'manual_invite', contact_name: selected.contact_name || 'Contact', contact_phone: selected.contact_phone, message: replyText },
      });
      setMessages(prev => [...prev, { id: crypto.randomUUID(), direction: 'outbound', content: replyText, created_at: new Date().toISOString(), is_ai: false }]);
      setReplyText('');
      toast.success('Sent');
    } catch { toast.error('Failed'); } finally { setSending(false); }
  };

  const convertToLead = async () => {
    if (!selected) return;
    await supabase.from('leads').insert({
      full_name: selected.contact_name || 'Unknown', phone: selected.contact_phone || null,
      lead_source: selected.channel, status: 'new', interest_level: 5, lead_score: 30,
      notes: `From ${selected.channel} conversation`, session_id: selected.id,
    }).catch(() => {});
    toast.success('Added to leads');
  };

  const filtered = convs.filter(c => {
    if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
    if (search) { const s = search.toLowerCase(); return (c.contact_name?.toLowerCase().includes(s) || c.contact_phone?.includes(s) || c.last_message.toLowerCase().includes(s)); }
    return true;
  });

  return (
    <div className="px-8 py-6 w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
          <p className="text-gray-400 text-sm mt-0.5">All channels — WhatsApp, web chat</p>
        </div>
        <Button onClick={loadConversations} variant="outline" className="flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: MessageSquare, color: 'blue' },
          { label: 'WhatsApp', value: stats.whatsapp, icon: Smartphone, color: 'green' },
          { label: 'Web chat', value: stats.web, icon: Globe, color: 'purple' },
          { label: 'Today', value: stats.today, icon: Activity, color: 'amber' },
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

      {/* Two-panel layout */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex" style={{ height: 'calc(100vh - 320px)', minHeight: 500 }}>
        {/* Left — list */}
        <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col">
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full h-8 pl-8 pr-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30" />
            </div>
            <div className="flex gap-1">
              {['all', 'whatsapp', 'web_chat'].map(ch => (
                <button key={ch} onClick={() => setChannelFilter(ch)} className={`flex-1 text-xs py-1 rounded-lg font-medium ${channelFilter === ch ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {ch === 'all' ? 'All' : ch === 'whatsapp' ? '📱 WA' : '🌐 Web'}
                </button>
              ))}
            </div>
          </div>
          <p className="px-3 py-2 text-xs text-gray-400 border-b border-gray-50">{filtered.length} conversation{filtered.length !== 1 ? 's' : ''}</p>
          <div className="flex-1 overflow-y-auto">
            {loading ? [...Array(5)].map((_, i) => <div key={i} className="h-16 m-2 bg-gray-50 rounded-xl animate-pulse" />) :
              filtered.length === 0 ? <div className="text-center py-12"><MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">No conversations</p></div> :
              filtered.map(c => (
                <div key={c.id} onClick={() => selectConv(c)} className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-red-50 border-l-2 border-l-red-500' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${c.channel === 'whatsapp' ? 'bg-green-50' : 'bg-blue-50'}`}>
                      {c.channel === 'whatsapp' ? <Smartphone className="w-3.5 h-3.5 text-green-600" /> : <Globe className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold text-gray-700 truncate">{c.contact_name || c.contact_phone || 'Anonymous'}</p>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{timeAgo(c.last_message_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{c.is_ai ? <span className="text-red-500 font-medium">CLARA: </span> : null}{c.last_message}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.channel === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{c.channel === 'whatsapp' ? 'WhatsApp' : 'Web'}</span>
                        <span className="text-xs text-gray-400">{c.message_count} msgs</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right — thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center"><div className="text-center"><MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-400 text-sm font-medium">Select a conversation</p></div></div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selected.channel === 'whatsapp' ? 'bg-green-50' : 'bg-blue-50'}`}>
                    {selected.channel === 'whatsapp' ? <Smartphone className="w-4 h-4 text-green-600" /> : <Globe className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{selected.contact_name || selected.contact_phone || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400">{selected.contact_phone && `${selected.contact_phone} · `}{selected.channel === 'whatsapp' ? 'WhatsApp' : 'Web chat'} · {selected.message_count} messages</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={convertToLead} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-200 hover:bg-purple-100">+ Add to leads</button>
                  {selected.contact_phone && (
                    <button onClick={() => supabase.functions.invoke('clara-speak', { body: { to: selected.contact_phone, message: 'Hello, this is CLARA from LifeLink Sync.' } })} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200 hover:bg-blue-100">📞 Call</button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {msgLoading ? <div className="flex items-center justify-center h-32"><RefreshCw className="w-5 h-5 text-gray-300 animate-spin" /></div> :
                  messages.length === 0 ? <p className="text-center text-xs text-gray-400 py-8">No messages</p> :
                  messages.map(m => (
                    <div key={m.id} className={`flex mb-3 ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                      {m.direction === 'inbound' && <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5"><User className="w-3.5 h-3.5 text-gray-500" /></div>}
                      <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5 ${m.direction === 'outbound' ? m.is_ai ? 'bg-red-500 text-white rounded-br-sm' : 'bg-gray-800 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                        {m.direction === 'outbound' && m.is_ai && <p className="text-xs text-red-200 font-medium mb-0.5">CLARA</p>}
                        <p className="text-sm leading-relaxed">{m.content}</p>
                        <p className={`text-xs mt-1 ${m.direction === 'outbound' ? 'text-white/60' : 'text-gray-400'}`}>{new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {m.direction === 'outbound' && <div className={`w-7 h-7 rounded-full flex items-center justify-center ml-2 flex-shrink-0 mt-0.5 ${m.is_ai ? 'bg-red-100' : 'bg-gray-800'}`}>{m.is_ai ? <Bot className="w-3.5 h-3.5 text-red-600" /> : <User className="w-3.5 h-3.5 text-white" />}</div>}
                    </div>
                  ))}
                <div ref={endRef} />
              </div>

              {/* Reply bar */}
              {selected.channel === 'whatsapp' && selected.contact_phone && (
                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex gap-2">
                    <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }} placeholder={`Reply to ${selected.contact_name || 'contact'}...`} className="flex-1 h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                    <button onClick={sendReply} disabled={sending || !replyText.trim()} className="w-9 h-9 bg-red-500 hover:bg-red-600 rounded-xl flex items-center justify-center disabled:opacity-40"><Send className="w-4 h-4 text-white" /></button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Sends via WhatsApp · Press Enter</p>
                </div>
              )}
              {selected.channel === 'web_chat' && (
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-400 text-center">Web chat is read-only. Add as a lead and reply via WhatsApp.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
