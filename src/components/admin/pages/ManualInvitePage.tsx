import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Send, Eye, Loader2, CheckCircle, Mail, Phone, Sparkles, RefreshCw, Shield, Pencil, User, Check, Copy, ExternalLink, MessageSquare, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { toast as sonnerToast } from 'sonner';

// CLARA contact constants — used for deep links
const CLARA_WHATSAPP_NUMBER = import.meta.env.VITE_CLARA_WHATSAPP_NUMBER || '+17277615366';
const CLARA_MESSENGER_PAGE_ID = '1022860360912464';
const INVITE_BASE_URL = 'https://lifelink-sync.com/invite';

const protectionOptions = [
  { value: 'themselves', label: 'Themselves' },
  { value: 'elderly-mum', label: 'Elderly Mum' },
  { value: 'elderly-dad', label: 'Elderly Dad' },
  { value: 'both-parents', label: 'Both Parents' },
  { value: 'business', label: 'Business / Organisation' },
  { value: 'not-sure', label: 'Not Sure Yet' },
];

const relationships = [
  { value: 'friendly', emoji: '👋', label: 'Friend', hint: 'Warm, casual, first name' },
  { value: 'family', emoji: '❤️', label: 'Family', hint: 'Loving, caring, personal' },
  { value: 'professional', emoji: '💼', label: 'Professional', hint: 'Respectful, business-like' },
  { value: 'neighbour', emoji: '🏠', label: 'Neighbour', hint: 'Friendly, community feel' },
  { value: 'colleague', emoji: '🤝', label: 'Colleague', hint: 'Professional but warm' },
  { value: 'personal', emoji: '💛', label: 'Personal', hint: 'Heartfelt, genuine care' },
];

const getSignOff = (rel: string) =>
  ['professional', 'colleague'].includes(rel) ? 'Lee Wakeman' : 'Lee';

const getToneGuide = (rel: string) => {
  const guides: Record<string, string> = {
    friendly: 'casual, warm, first name basis, like texting a mate',
    family: 'loving, caring, mentions family connection naturally',
    professional: 'respectful, business appropriate, full name sign-off',
    neighbour: 'community feel, neighbourly warmth, familiar but not too casual',
    colleague: 'professional but collegial, work context natural',
    personal: 'heartfelt, genuine concern for their wellbeing',
  };
  return guides[rel] || guides.friendly;
};

function generateMessage(name: string, protectionFor: string, personalMessage?: string): string {
  const firstName = name.split(' ')[0] || name;
  let intro = '';
  switch (protectionFor) {
    case 'elderly-mum':
      intro = `Hi ${firstName}, Lee Wakeman asked me to reach out. He thought LifeLink Sync could give you peace of mind about your mum. It's a 24/7 emergency protection platform with one-touch SOS, GPS tracking, and an AI assistant called CLARA who's always there.`;
      break;
    case 'elderly-dad':
      intro = `Hi ${firstName}, Lee Wakeman asked me to reach out. He thought LifeLink Sync could help you keep your dad safe. It's a 24/7 emergency protection platform with one-touch SOS, GPS tracking, and an AI assistant called CLARA who's always there.`;
      break;
    case 'both-parents':
      intro = `Hi ${firstName}, Lee Wakeman asked me to reach out. He thought LifeLink Sync could help you look after both your parents. It's a 24/7 emergency protection platform with one-touch SOS, GPS tracking, and family linking so you can stay connected.`;
      break;
    case 'business':
      intro = `Hi ${firstName}, Lee Wakeman asked me to reach out. He thought LifeLink Sync could be a great fit for your organisation. It's a 24/7 emergency protection platform with enterprise family linking, GPS tracking, and an AI safety assistant.`;
      break;
    case 'not-sure':
      intro = `Hi ${firstName}, Lee Wakeman asked me to reach out about LifeLink Sync. It's a 24/7 emergency protection platform that helps keep you and your loved ones safe. I'd love to help you find the right setup.`;
      break;
    default:
      intro = `Hi ${firstName}, Lee Wakeman thought LifeLink Sync could be perfect for you. It's a 24/7 emergency protection platform with one-touch SOS, GPS tracking, and an AI assistant called CLARA who's always there when you need help.`;
  }
  const cta = `\n\nYou can try it free for 7 days — no card needed:\nhttps://lifelink-sync.com`;
  return intro + (personalMessage ? `\n\n${personalMessage}` : '') + cta;
}

export default function ManualInvitePage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // ─── Sender Mode ───
  const [senderMode, setSenderMode] = useState<'lee' | 'clara' | null>(null);

  // ─── Lee Mode State ───
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    messengerPsid: '',
    protectionFor: '',
    personalMessage: '',
  });
  const [channels, setChannels] = useState({
    email: true,
    whatsapp: false,
    sms: false,
    messenger: false,
    link: false,
  });
  const toggleChannel = (ch: keyof typeof channels) => {
    setChannels(prev => ({ ...prev, [ch]: !prev[ch] }));
    setSent(false);
  };
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [sentToken, setSentToken] = useState('');
  const [sentName, setSentName] = useState('');
  const [sentPhone, setSentPhone] = useState('');
  const [relationship, setRelationship] = useState('friendly');
  const [rawNote, setRawNote] = useState('');
  const [enhancedMessage, setEnhancedMessage] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [useEnhanced, setUseEnhanced] = useState(false);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [contactLanguage, setContactLanguage] = useState<'en' | 'es' | 'nl'>('en');
  const [translatedMessage, setTranslatedMessage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // ─── CLARA Mode State ───
  const [claraForm, setClaraForm] = useState({
    name: '',
    whatsapp: '',
    protectionFor: '',
    roughNote: '',
  });
  const [claraRelationship, setClaraRelationship] = useState('friendly');
  const [claraGenerating, setClaraGenerating] = useState(false);
  const [claraGeneratedMessage, setClaraGeneratedMessage] = useState('');
  const [claraEditingPreview, setClaraEditingPreview] = useState(false);
  const [claraSending, setClaraSending] = useState(false);
  const [claraSent, setClaraSent] = useState(false);
  const [claraSentName, setClaraSentName] = useState('');
  const [claraSentToken, setClaraSentToken] = useState('');
  const [claraSentPhone, setClaraSentPhone] = useState('');

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSent(false);
  };

  const updateClara = (field: string, value: string) => {
    setClaraForm(prev => ({ ...prev, [field]: value }));
    setClaraSent(false);
  };

  // The message that will actually be sent (Lee mode)
  const previewMessage = useEnhanced && enhancedMessage
    ? enhancedMessage
    : generateMessage(form.name || 'there', form.protectionFor, form.personalMessage);

  const hasContact = form.name.trim().length > 0;
  const showPreview = hasContact;
  const anyChannelSelected = channels.email || channels.whatsapp || channels.sms || channels.messenger || channels.link;
  const needsEmail = channels.email && !form.email.trim();
  const needsPhone = (channels.whatsapp || channels.sms) && !form.phone.trim();

  const canSend = form.name.trim() && form.protectionFor && anyChannelSelected && !needsEmail && !needsPhone;

  const canSendClara = claraForm.name.trim() && claraForm.whatsapp.trim() && claraForm.protectionFor;

  // ─── Auto-translate when language changes or enhanced message updates ───
  useEffect(() => {
    if (contactLanguage === 'en') {
      setTranslatedMessage('');
      return;
    }
    const msgToTranslate = enhancedMessage || rawNote || previewMessage;
    if (!msgToTranslate) {
      setTranslatedMessage('');
      return;
    }
    const langName = contactLanguage === 'es' ? 'Spanish' : 'Dutch';
    setIsTranslating(true);
    supabase.functions.invoke('ai-chat', {
      body: {
        message: `Translate this WhatsApp invite message to ${langName}. Keep the warm personal tone. Return ONLY the translated text, nothing else.\n\n"${msgToTranslate}"`,
        language: 'en',
        isOwnerPersonal: true,
      },
    }).then(({ data }) => {
      setTranslatedMessage(data?.response || data?.reply || msgToTranslate);
    }).catch(() => {
      setTranslatedMessage(msgToTranslate);
    }).finally(() => {
      setIsTranslating(false);
    });
  }, [enhancedMessage, contactLanguage]);

  // ─── Mode Switch Handler ───
  const handleModeSwitch = (newMode: 'lee' | 'clara') => {
    if (senderMode === newMode) return;
    if (enhancedMessage && senderMode !== null) {
      if (!confirm('Switch mode? Your current message will be cleared.')) return;
    }
    setEnhancedMessage('');
    setUseEnhanced(false);
    setSent(false);
    setClaraSent(false);
    setSenderMode(newMode);
  };

  // ─── CLARA Enhance (Lee mode) ───
  const handleClaraEnhance = async () => {
    const noteText = rawNote || form.personalMessage;
    if (!noteText) return;
    setIsEnhancing(true);
    try {
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `You are CLARA, Lee Wakeman's AI assistant at LifeLink Sync.

Write a warm WhatsApp invite message to ${form.name || 'this person'} (${relationship} of Lee's).

About them: ${noteText}
Protection is for: ${form.protectionFor || 'not specified'}

RULES — these are NON-NEGOTIABLE:
1. Write in Lee's voice — warm, personal, genuine, never salesy
2. Tone must match the relationship: ${getToneGuide(relationship)}
3. Keep it under 180 words
4. MUST include this exact line (or natural variation): "If you have any questions at all, I'm here 24 hours a day, 7 days a week — just message me."
5. MUST include this link so they can sign up directly: https://lifelink-sync.com
6. Mention the 7-day free trial, no card needed
7. Sign off as: ${getSignOff(relationship)}
8. No bullet points — flowing natural text
9. Do NOT mention prices
10. Do NOT say "I'm an AI" or mention CLARA

STRUCTURE (follow this loosely):
- Open personally (mention their name)
- One line on what LifeLink Sync does and why Lee thought of them
- The free trial + website link
- The 24/7 availability line
- Sign off

FORMATTING — CRITICAL:
- Put a blank line between each paragraph
- Each section (greeting, body, trial link, availability, sign off) should be its own paragraph separated by a blank line
- Use real line breaks, NOT HTML tags
- The message must look clean and readable on a phone screen

Write the message now. Output ONLY the message itself, no explanation or preamble.`,
          language: 'en',
          isOwnerPersonal: true,
        },
      });
      const enhanced = response.data?.response || response.data?.reply || '';
      if (enhanced) {
        setEnhancedMessage(enhanced);
        setUseEnhanced(true);
      } else {
        toast({ title: 'No response from CLARA', variant: 'destructive' });
      }
    } catch (error) {
      console.error('CLARA enhance error:', error);
      toast({ title: 'Could not reach CLARA. Try again.', variant: 'destructive' });
    } finally {
      setIsEnhancing(false);
    }
  };

  // ─── Send (Lee mode) — calls send-invite edge function ───
  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const activeChannels = Object.entries(channels)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .filter(k => k !== 'link'); // link is always generated, not a send channel

      const cleanPhone = form.phone?.replace(/\s/g, '') || null;

      // Call send-invite — handles lead creation, token, and all channel sending
      const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-invite', {
        body: {
          name: form.name.trim(),
          phone: cleanPhone,
          email: form.email.trim() || null,
          facebook_psid: form.messengerPsid.trim() || null,
          channels: activeChannels,
          notes: `Protection for: ${form.protectionFor}. ${rawNote || ''}`.trim(),
        },
      });

      if (sendError) throw new Error(sendError.message || 'Failed to send invite');
      if (!sendResult?.success) throw new Error(sendResult?.error || 'Invite delivery failed');

      // Log to manual_invites for the admin history view
      await (supabase as any).from('manual_invites').insert({
        contact_name: form.name,
        contact_email: form.email || null,
        contact_whatsapp: cleanPhone,
        protection_for: form.protectionFor,
        personal_message: (useEnhanced ? enhancedMessage : rawNote || form.personalMessage) || null,
        send_via: activeChannels.join(','),
        message_sent: previewMessage,
        relationship_tone: relationship,
        clara_enhanced: useEnhanced,
        preferred_language: contactLanguage,
        email_sent: !!sendResult?.channels?.email?.sent,
        whatsapp_sent: !!sendResult?.channels?.whatsapp?.sent,
        status: 'sent',
      }).then(({ error: dbErr }: { error: unknown }) => {
        if (dbErr) console.warn('Failed to log invite to DB:', dbErr);
      });

      const inviteToken = sendResult?.token || '';
      const channelResults = sendResult?.channels || {};

      // Build summary
      const sentChannels: string[] = [];
      if (channelResults.email?.sent) sentChannels.push('Email');
      if (channelResults.whatsapp?.sent) sentChannels.push('WhatsApp');
      if (channelResults.sms?.sent) sentChannels.push('SMS');
      if (channelResults.messenger?.sent) sentChannels.push('Messenger');
      if (channels.link) sentChannels.push('Link');
      setSentMessage(previewMessage);
      setSentToken(inviteToken);
      setSentName(form.name);
      setSentPhone(cleanPhone || '');
      setSent(true);
      toast({
        title: 'Invite Sent',
        description: `Personalised invite sent to ${form.name} via ${sentChannels.join(' + ') || 'Link'}`,
      });
    } catch (err) {
      console.error('Failed to send invite:', err);
      toast({
        title: 'Send Failed',
        description: (err as Error).message || 'Could not send the invite.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // ─── Generate CLARA message (step 1) ───
  const handleClaraGenerate = async () => {
    if (!canSendClara) return;
    setClaraGenerating(true);
    try {
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `You are CLARA, Lee Wakeman's AI assistant at LifeLink Sync.

Write a warm WhatsApp invite message to ${claraForm.name} (${claraRelationship} of Lee's).

About them: ${claraForm.roughNote || 'No additional context provided'}
Protection is for: ${claraForm.protectionFor}

RULES — these are NON-NEGOTIABLE:
1. ALWAYS start with "Hey [first name]," then introduce yourself as CLARA
2. Explain you're Lee's AI assistant at LifeLink Sync in the first sentence
3. Say Lee asked you to reach out — mention WHY based on the note/situation
4. Keep it under 180 words
5. MUST include this exact line (or natural variation): "If you have any questions at all, I'm here 24 hours a day, 7 days a week — just message me."
6. MUST include this link so they can sign up directly: https://lifelink-sync.com
7. Mention the 7-day free trial, no card needed
8. Tone must match the relationship: ${getToneGuide(claraRelationship)}
9. Sign off as:
  — CLARA
  On behalf of Lee Wakeman
  LifeLink Sync
10. No bullet points — flowing natural text
11. Do NOT mention prices

STRUCTURE (follow this loosely):
- Open personally with their name + introduce yourself as CLARA
- Why Lee asked you to reach out (based on their situation)
- One line on what LifeLink Sync does
- The free trial + website link
- The 24/7 availability line
- Sign off

FORMATTING — CRITICAL:
- Put a blank line between each paragraph
- Each section (greeting, body, trial link, availability, sign off) should be its own paragraph separated by a blank line
- Use real line breaks, NOT HTML tags
- The message must look clean and readable on a phone screen

Write the message now. Output ONLY the message itself, no explanation or preamble.`,
          language: 'en',
          isOwnerPersonal: true,
        },
      });

      const claraMessage = response.data?.response || response.data?.reply || '';
      if (!claraMessage) throw new Error('CLARA could not generate a message');
      setClaraGeneratedMessage(claraMessage);
    } catch (err) {
      console.error('CLARA generate error:', err);
      toast({ title: 'Could not reach CLARA. Try again.', variant: 'destructive' });
    } finally {
      setClaraGenerating(false);
    }
  };

  // ─── Send CLARA message (step 2 — after review) ───
  const handleClaraSend = async () => {
    if (!claraGeneratedMessage || !canSendClara) return;
    setClaraSending(true);
    try {
      const { data: sendResult, error: sendError } = await supabase.functions.invoke('clara-escalation', {
        body: {
          type: 'manual_invite',
          contact_name: claraForm.name,
          contact_phone: claraForm.whatsapp.trim(),
          message: claraGeneratedMessage,
        },
      });
      if (sendError) throw new Error(sendError.message || 'Failed to send');
      if (!sendResult?.success) throw new Error('Delivery failed — check WhatsApp number');

      const { error: dbError } = await (supabase as any).from('manual_invites').insert({
        contact_name: claraForm.name,
        contact_whatsapp: claraForm.whatsapp || null,
        protection_for: claraForm.protectionFor,
        personal_message: claraForm.roughNote || null,
        send_via: 'whatsapp',
        message_sent: claraGeneratedMessage,
        relationship_tone: claraRelationship,
        clara_enhanced: true,
        whatsapp_sent: true,
        status: 'sent',
      });
      if (dbError) console.warn('Failed to log invite to DB:', dbError);

      // ── Full CRM tracking (CLARA mode) ──
      const nameParts = claraForm.name.trim().split(' ');
      const cleanPhone = claraForm.whatsapp?.replace(/\s/g, '') || null;

      // 1. Create or update lead
      const { data: existingLead2 } = await (supabase as any).from('leads').select('id').eq('phone', cleanPhone).maybeSingle();
      let leadId2 = existingLead2?.id;

      if (!leadId2) {
        const { data: newLead2 } = await (supabase as any).from('leads').insert({
          first_name: nameParts[0] || claraForm.name,
          last_name: nameParts.slice(1).join(' ') || null,
          full_name: claraForm.name,
          email: `${(cleanPhone || '').replace(/[^0-9]/g, '')}@invite.lifelink-sync.com`,
          phone: cleanPhone,
          lead_source: 'clara_invite',
          status: 'contacted',
          interest_level: 5,
          lead_score: 30,
          last_contacted_at: new Date().toISOString(),
          notes: `CLARA invite via WhatsApp. Protection for: ${claraForm.protectionFor}. ${claraForm.roughNote || ''}`.trim(),
          tags: ['clara-invite', claraForm.protectionFor].filter(Boolean),
        }).select('id').single();
        leadId2 = newLead2?.id;
      } else {
        await (supabase as any).from('leads').update({ status: 'contacted', last_contacted_at: new Date().toISOString(), lead_score: 30 }).eq('id', leadId2);
      }

      // 2. Log lead activity
      if (leadId2) {
        const { error: actErr2 } = await (supabase as any).from('lead_activities').insert({
          lead_id: leadId2,
          activity_type: 'whatsapp_sent',
          subject: 'CLARA invite sent via WhatsApp',
          content: claraGeneratedMessage,
          metadata: { channel: 'whatsapp', phone: cleanPhone, ai_generated: true, relationship: claraRelationship },
        });
        if (actErr2) console.warn('Activity log error:', actErr2);
      }

      // 3. Create WhatsApp conversation + message
      if (cleanPhone && sendResult?.whatsapp_sent) {
        const { data: existingConv2 } = await (supabase as any).from('whatsapp_conversations').select('id').eq('phone_number', cleanPhone).maybeSingle();
        let convId2 = existingConv2?.id;
        if (!convId2) {
          const { data: newConv2 } = await (supabase as any).from('whatsapp_conversations').insert({
            phone_number: cleanPhone, contact_name: claraForm.name, status: 'active',
            metadata: { lead_id: leadId2, source: 'clara_invite' },
          }).select('id').single();
          convId2 = newConv2?.id;
        } else {
          await (supabase as any).from('whatsapp_conversations').update({ contact_name: claraForm.name, metadata: { lead_id: leadId2, source: 'clara_invite' } }).eq('id', convId2);
        }
        if (convId2) {
          const { error: msgErr2 } = await (supabase as any).from('whatsapp_messages').insert({
            conversation_id: convId2, direction: 'outbound', message_type: 'text',
            content: claraGeneratedMessage, is_ai_generated: true, status: 'sent',
          });
          if (msgErr2) console.warn('Message log error:', msgErr2);
        }
      }

      // Create invite token for share links
      let claraInviteToken = '';
      try {
        if (leadId2) {
          const { data: invite } = await (supabase as any)
            .from('lead_invites')
            .insert({ lead_id: leadId2 })
            .select('token')
            .single();
          claraInviteToken = invite?.token || '';
        }
      } catch (e) {
        console.warn('Token generation failed:', e);
      }

      setClaraSentName(claraForm.name);
      setClaraSentToken(claraInviteToken);
      setClaraSentPhone(claraForm.whatsapp?.replace(/\s/g, '') || '');
      setClaraSent(true);
      toast({ title: 'CLARA sent it!', description: `Message sent to ${claraForm.name} via WhatsApp` });
    } catch (err) {
      console.error('CLARA send error:', err);
      toast({
        title: 'Send Failed',
        description: (err as Error).message || 'Could not send via CLARA.',
        variant: 'destructive',
      });
    } finally {
      setClaraSending(false);
    }
  };

  const reset = () => {
    setForm({ name: '', email: '', phone: '', messengerPsid: '', protectionFor: '', personalMessage: '' });
    setChannels({ email: true, whatsapp: false, sms: false, messenger: false, link: false });
    setSent(false);
    setSentMessage('');
    setSentToken('');
    setSentName('');
    setSentPhone('');
    setRawNote('');
    setEnhancedMessage('');
    setUseEnhanced(false);
    setRelationship('friendly');
    setIsEditingPreview(false);
  };

  const resetClara = () => {
    setClaraForm({ name: '', whatsapp: '', protectionFor: '', roughNote: '' });
    setClaraSent(false);
    setClaraSentName('');
    setClaraSentToken('');
    setClaraSentPhone('');
    setClaraRelationship('friendly');
    setClaraGeneratedMessage('');
    setClaraEditingPreview(false);
  };

  const channelBadge = () => {
    const parts: string[] = [];
    if (channels.email) parts.push('Email');
    if (channels.whatsapp) parts.push('WhatsApp');
    if (channels.sms) parts.push('SMS');
    if (channels.messenger) parts.push('Messenger');
    if (channels.link) parts.push('Link');
    return parts.join(' + ') || 'Link only';
  };

  // ─── Preview Panel (Lee mode) ───
  const renderPreviewPanel = () => {
    if (sent) {
      return (
        <InviteSentPanel
          name={sentName || form.name}
          phone={sentPhone || form.phone?.replace(/\s/g, '')}
          token={sentToken}
          sentMessage={sentMessage}
          claraEnhanced={useEnhanced}
          channelLabel={channelBadge()}
          onReset={reset}
          onViewLeads={() => navigate('/admin-dashboard/leads')}
        />
      );
    }

    if (!showPreview) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-gray-400 font-medium mb-2">Preview will appear here</h3>
          <p className="text-gray-300 text-sm">Enter a contact name to see the live message preview</p>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
              {form.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{form.name || 'Contact name'}</p>
              <p className="text-xs text-gray-400">
                {form.phone || form.email || 'contact info'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full font-medium">
              {channelBadge()}
            </span>
            <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full font-medium">
              {relationships.find(r => r.value === relationship)?.label} tone
            </span>
            {useEnhanced && (
              <span className="text-xs bg-purple-50 text-purple-600 border border-purple-200 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> CLARA
              </span>
            )}
          </div>

          {isEditingPreview ? (
            <Textarea
              value={enhancedMessage}
              onChange={e => setEnhancedMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-700 min-h-[120px] focus:border-red-500 mb-4"
              rows={6}
            />
          ) : (
            <div className="mb-3">
              {(channels.whatsapp || channels.sms) && (
                <div className="mb-3">
                  <p className="text-[10px] text-gray-400 font-medium mb-1 uppercase tracking-wider">
                    {channels.whatsapp && channels.sms ? 'WhatsApp / SMS' : channels.whatsapp ? 'WhatsApp' : 'SMS'}
                  </p>
                  <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm p-4 relative">
                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{previewMessage}</p>
                    <p className="text-right text-[10px] text-gray-400 mt-2">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </p>
                  </div>
                </div>
              )}
              {channels.email && (
                <div className="mb-3">
                  <p className="text-[10px] text-gray-400 font-medium mb-1 uppercase tracking-wider">Email</p>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">To:</span> {form.name || 'Contact'} &lt;{form.email || 'email@example.com'}&gt;
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Subject:</span> Lee Wakeman asked CLARA to reach out to you
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{previewMessage}</p>
                    </div>
                  </div>
                </div>
              )}
              {channels.messenger && (
                <div className="mb-3">
                  <p className="text-[10px] text-gray-400 font-medium mb-1 uppercase tracking-wider">Messenger</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{previewMessage}</p>
                  </div>
                </div>
              )}
              {!channels.email && !channels.whatsapp && !channels.sms && !channels.messenger && (
                <div className="mb-3">
                  <p className="text-[10px] text-gray-400 font-medium mb-1 uppercase tracking-wider">Invite message</p>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{previewMessage}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {contactLanguage !== 'en' && (enhancedMessage || rawNote) && (
            <div className="mb-4">
              <div className="bg-white border border-blue-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-600 mb-1">
                  {contactLanguage === 'es' ? '\u{1F1EA}\u{1F1F8} Will send in Spanish' : '\u{1F1F3}\u{1F1F1} Will send in Dutch'}
                </p>
                {isTranslating ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Translating...
                  </div>
                ) : (
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{translatedMessage}</p>
                )}
              </div>
            </div>
          )}

          {hasMessage && (
            <p className="text-xs text-gray-400 mb-3">
              {displayMessage.split(/\s+/).filter(Boolean).length} words · {displayMessage.length} characters
            </p>
          )}

          {hasMessage && enhancedMessage && (
            <button
              type="button"
              onClick={() => setIsEditingPreview(!isEditingPreview)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4"
            >
              <Pencil className="w-3 h-3" />
              {isEditingPreview ? 'Done editing' : 'Edit message'}
            </button>
          )}

          {form.protectionFor && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Shield className="w-3.5 h-3.5 text-red-400" />
              <span>Protection for: {protectionOptions.find(o => o.value === form.protectionFor)?.label}</span>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <Button
            onClick={handleSend}
            disabled={!canSend || sending}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-base font-semibold mb-3 h-auto"
          >
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                Accept & Send Invite
              </span>
            )}
          </Button>
          <p className="text-xs text-gray-300 text-center mt-2">
            This invite will be sent from LifeLink Sync on Lee's behalf
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="px-8 py-6 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manual Invite</h1>
        <p className="text-muted-foreground">Send a personalised invite — write it yourself or let CLARA handle it completely.</p>
      </div>

      {/* ─── MODE SELECTOR CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Send as Lee */}
        <button
          onClick={() => handleModeSwitch('lee')}
          className={`relative bg-white border-2 rounded-2xl p-6 text-left transition-all ${
            senderMode === 'lee'
              ? 'border-red-500 bg-red-50/30 ring-2 ring-red-500 ring-offset-2'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer'
          }`}
        >
          {senderMode === 'lee' && (
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center absolute top-4 right-4">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 pr-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Send as Lee</h3>
              <p className="text-gray-500 text-sm mb-3">
                CLARA writes the perfect message in your voice. You review it, then send it personally.
              </p>
              <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                You're in control
              </span>
            </div>
          </div>
        </button>

        {/* Send via CLARA */}
        <button
          onClick={() => handleModeSwitch('clara')}
          className={`relative bg-white border-2 rounded-2xl p-6 text-left transition-all ${
            senderMode === 'clara'
              ? 'border-red-500 bg-red-50/30 ring-2 ring-red-500 ring-offset-2'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer'
          }`}
        >
          {senderMode === 'clara' && (
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center absolute top-4 right-4">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1 pr-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Send via CLARA</h3>
              <p className="text-gray-500 text-sm mb-3">
                Just tell CLARA who they are. She'll write and send the perfect message automatically — no review needed.
              </p>
              <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                Fully automated
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* ─── LEE MODE: Full form + preview ─── */}
      {senderMode === 'lee' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="px-8 py-6 w-full space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
                <CardDescription>Who are you inviting?</CardDescription>
              </CardHeader>
              <CardContent className="px-8 py-6 w-full space-y-4">
                <div>
                  <Label>Contact Name *</Label>
                  <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="John Smith" />
                </div>

                {/* ─── Send Via — channel checkboxes ─── */}
                <div>
                  <Label className="mb-2 block">Send Via (select all that apply)</Label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { key: 'email' as const, icon: <Mail className="h-3.5 w-3.5" />, label: 'Email' },
                      { key: 'whatsapp' as const, icon: <MessageSquare className="h-3.5 w-3.5" />, label: 'WhatsApp' },
                      { key: 'sms' as const, icon: <Phone className="h-3.5 w-3.5" />, label: 'SMS' },
                      { key: 'messenger' as const, icon: <MessageCircle className="h-3.5 w-3.5" />, label: 'Messenger' },
                      { key: 'link' as const, icon: <ExternalLink className="h-3.5 w-3.5" />, label: 'Link only' },
                    ] as const).map(ch => (
                      <button
                        key={ch.key}
                        type="button"
                        onClick={() => toggleChannel(ch.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all ${
                          channels[ch.key]
                            ? 'bg-red-50 border-red-400 text-red-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {ch.icon}
                        <span>{ch.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional fields based on selected channels */}
                {channels.email && (
                  <div>
                    <Label>Email Address {channels.email && '*'}</Label>
                    <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" />
                  </div>
                )}
                {(channels.whatsapp || channels.sms) && (
                  <div>
                    <Label>Phone Number {(channels.whatsapp || channels.sms) && '*'}</Label>
                    <Input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+44 7700 900000" />
                    <p className="text-xs text-muted-foreground mt-1">International format with country code</p>
                  </div>
                )}
                {channels.messenger && (
                  <div>
                    <Label>Messenger ID (PSID)</Label>
                    <Input value={form.messengerPsid} onChange={e => update('messengerPsid', e.target.value)} placeholder="Optional — leave blank for shareable link" />
                    <p className="text-xs text-muted-foreground mt-1">Leave blank to generate a shareable Messenger link instead</p>
                  </div>
                )}

                <div>
                  <Label>Who is protection for? *</Label>
                  <Select value={form.protectionFor} onValueChange={v => update('protectionFor', v)}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {protectionOptions.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    Their preferred language
                  </Label>
                  <div className="flex gap-2">
                    {([
                      { code: 'en' as const, label: 'English', flag: '\u{1F1EC}\u{1F1E7}' },
                      { code: 'es' as const, label: 'Español', flag: '\u{1F1EA}\u{1F1F8}' },
                      { code: 'nl' as const, label: 'Nederlands', flag: '\u{1F1F3}\u{1F1F1}' },
                    ]).map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setContactLanguage(lang.code)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all ${
                          contactLanguage === lang.code
                            ? 'bg-red-50 border-red-400 text-red-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                  {form.phone?.startsWith('+34') && contactLanguage === 'en' && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 mt-2">
                      <p>This is a Spanish number but the message will send in English. If they speak Spanish, switch to Español above.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-red-500" />
                  CLARA Message Writer
                </CardTitle>
                <CardDescription>Write a rough note, pick a tone, and let CLARA craft the perfect invite.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="mb-2 block">Relationship & tone</Label>
                  <div className="flex flex-wrap gap-2">
                    {relationships.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => { setRelationship(r.value); setEnhancedMessage(''); setUseEnhanced(false); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all border ${
                          relationship === r.value
                            ? 'bg-red-50 border-red-500 text-red-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span>{r.emoji}</span>
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {relationships.find(r => r.value === relationship)?.hint} — signs off as {getSignOff(relationship)}
                  </p>
                </div>

                <div>
                  <Label className="mb-2 block">Your rough note about them</Label>
                  <Textarea
                    value={rawNote}
                    onChange={e => { setRawNote(e.target.value); setEnhancedMessage(''); setUseEnhanced(false); }}
                    placeholder="e.g. He's a friend, his mum lives alone in Málaga, might be good for her. He has 2 daughters aged 17..."
                    rows={3}
                  />
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      type="button"
                      onClick={handleClaraEnhance}
                      disabled={!rawNote.trim() || isEnhancing}
                      className="flex items-center gap-2 text-sm text-red-600 font-medium hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {isEnhancing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />CLARA is writing...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" />Let CLARA write this</>
                      )}
                    </button>
                    {enhancedMessage && (
                      <button
                        type="button"
                        onClick={handleClaraEnhance}
                        disabled={isEnhancing}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 disabled:opacity-40"
                      >
                        <RefreshCw className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} />
                        Regenerate
                      </button>
                    )}
                  </div>
                </div>

                {!useEnhanced && (
                  <div>
                    <Label className="mb-2 block text-muted-foreground text-xs">
                      Or add a personal note manually (appended to the template)
                    </Label>
                    <Textarea
                      value={form.personalMessage}
                      onChange={e => update('personalMessage', e.target.value)}
                      placeholder="Add a personal note..."
                      rows={2}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ─── SEND BUTTON (visible on left form panel) ─── */}
            <Button
              onClick={handleSend}
              disabled={!canSend || sending}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-5 rounded-xl text-base font-semibold h-auto shadow-lg"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending invite...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  Send Invite
                </span>
              )}
            </Button>
            {!canSend && hasContact && (
              <p className="text-xs text-amber-500 text-center">
                {!form.protectionFor ? 'Select who protection is for' :
                 !anyChannelSelected ? 'Select at least one channel' :
                 needsEmail ? 'Enter an email address' :
                 needsPhone ? 'Enter a phone number' :
                 'Fill in required fields'}
              </p>
            )}
          </div>

          <div className="lg:sticky lg:top-6">
            {renderPreviewPanel()}
          </div>
        </div>
      )}

      {/* ─── CLARA MODE: Form + Preview ─── */}
      {senderMode === 'clara' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT — Form */}
          <div>
            {claraSent ? (
              <InviteSentPanel
                name={claraSentName}
                phone={claraSentPhone}
                token={claraSentToken}
                sentMessage={claraGeneratedMessage}
                claraEnhanced={true}
                channelLabel="WhatsApp"
                onReset={resetClara}
                onViewLeads={() => navigate('/admin-dashboard/leads')}
              />
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-1">Just tell CLARA who they are</h3>
                <p className="text-gray-500 text-sm mb-6">She'll write the perfect message. You review it, then send.</p>

                <div className="px-8 py-6 w-full space-y-4">
                  <div>
                    <Label>Contact name *</Label>
                    <Input
                      value={claraForm.name}
                      onChange={e => { updateClara('name', e.target.value); setClaraGeneratedMessage(''); }}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label>WhatsApp number *</Label>
                    <Input
                      type="tel"
                      value={claraForm.whatsapp}
                      onChange={e => updateClara('whatsapp', e.target.value)}
                      placeholder="+44 7700 900000"
                    />
                  </div>
                  <div>
                    <Label>Who is protection for? *</Label>
                    <Select value={claraForm.protectionFor} onValueChange={v => { updateClara('protectionFor', v); setClaraGeneratedMessage(''); }}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {protectionOptions.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block">Relationship</Label>
                    <div className="flex flex-wrap gap-2">
                      {relationships.map(r => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => { setClaraRelationship(r.value); setClaraGeneratedMessage(''); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all border ${
                            claraRelationship === r.value
                              ? 'bg-red-50 border-red-500 text-red-700 font-medium'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span>{r.emoji}</span>
                          <span>{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Rough note about them <span className="text-gray-400 font-normal">(optional)</span></Label>
                    <Textarea
                      value={claraForm.roughNote}
                      onChange={e => { updateClara('roughNote', e.target.value); setClaraGeneratedMessage(''); }}
                      placeholder="e.g. He's a mate, his mum lives alone in Málaga. Has 3 kids."
                      rows={3}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleClaraGenerate}
                  disabled={!canSendClara || claraGenerating}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-base font-semibold mt-6 h-auto"
                >
                  {claraGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      CLARA is writing...
                    </span>
                  ) : claraGeneratedMessage ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5" />
                      Regenerate Message
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Let CLARA Write It →
                    </span>
                  )}
                </Button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  CLARA writes, you review, then send. Signed as: CLARA, LifeLink Sync
                </p>
              </div>
            )}
          </div>

          {/* RIGHT — Preview */}
          <div className="lg:sticky lg:top-6">
            {claraSent ? (
              <div className="bg-white border border-green-200 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-gray-900 font-bold text-base mb-1">Delivered!</h3>
                <p className="text-gray-500 text-sm mb-3">{claraSentName} will receive the message via WhatsApp.</p>
                <p className="text-gray-400 text-xs">Share links are on the left panel if you want to send via other channels too.</p>
                <details className="text-left mt-4">
                  <summary className="text-xs text-gray-400 cursor-pointer text-center">View sent message</summary>
                  <div className="mt-3 bg-gray-50 rounded-xl p-3 text-xs text-gray-600 whitespace-pre-wrap">{claraGeneratedMessage}</div>
                </details>
              </div>
            ) : !claraGeneratedMessage ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-gray-400 font-medium mb-2">Preview will appear here</h3>
                <p className="text-gray-300 text-sm">Fill in the details and click "Let CLARA Write It" to see the message before sending</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                      {claraForm.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{claraForm.name}</p>
                      <p className="text-xs text-gray-400">{claraForm.whatsapp}</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full font-medium">
                      📱 WhatsApp
                    </span>
                    <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full font-medium">
                      {relationships.find(r => r.value === claraRelationship)?.label} tone
                    </span>
                    <span className="text-xs bg-purple-50 text-purple-600 border border-purple-200 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> CLARA
                    </span>
                  </div>

                  {/* WhatsApp bubble */}
                  {claraEditingPreview ? (
                    <Textarea
                      value={claraGeneratedMessage}
                      onChange={e => setClaraGeneratedMessage(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-700 min-h-[120px] focus:border-red-500 mb-4"
                      rows={6}
                    />
                  ) : (
                    <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm p-4 relative mb-4">
                      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{claraGeneratedMessage}</p>
                      <p className="text-right text-[10px] text-gray-400 mt-2">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setClaraEditingPreview(!claraEditingPreview)}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      {claraEditingPreview ? 'Done editing' : 'Edit message'}
                    </button>
                    <button
                      type="button"
                      onClick={handleClaraGenerate}
                      disabled={claraGenerating}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3 h-3 ${claraGenerating ? 'animate-spin' : ''}`} />
                      Regenerate
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mb-2">
                    {claraGeneratedMessage.split(/\s+/).filter(Boolean).length} words · {claraGeneratedMessage.length} characters
                  </p>

                  {claraForm.protectionFor && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Shield className="w-3.5 h-3.5 text-red-400" />
                      <span>Protection for: {protectionOptions.find(o => o.value === claraForm.protectionFor)?.label}</span>
                    </div>
                  )}
                </div>

                {/* Footer — Accept & Send */}
                <div className="px-6 pb-6">
                  <Button
                    onClick={handleClaraSend}
                    disabled={claraSending}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl text-base font-semibold mb-3 h-auto"
                  >
                    {claraSending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Send className="w-5 h-5" />
                        Accept & Send via CLARA
                      </span>
                    )}
                  </Button>
                  <p className="text-xs text-gray-300 text-center mt-2">
                    Signed as: CLARA, on behalf of Lee Wakeman
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Section 2: All Sent Invites ──────────────────────────────────────── */}
      <SentInvitesList refreshKey={sent || claraSent} />
    </div>
  );
}

// ─── Invite Sent Panel — 4-channel share links ─────────────────────────────

interface InviteSentPanelProps {
  name: string;
  phone?: string;
  token: string;
  sentMessage: string;
  claraEnhanced: boolean;
  channelLabel: string;
  onReset: () => void;
  onViewLeads: () => void;
}

function InviteSentPanel({
  name,
  phone,
  token,
  sentMessage,
  claraEnhanced,
  channelLabel,
  onReset,
  onViewLeads,
}: InviteSentPanelProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const firstName = name?.split(' ')[0] || name;
  const cleanNumber = CLARA_WHATSAPP_NUMBER.replace('+', '');

  // WhatsApp — opens chat directly with CLARA
  const waMessage = encodeURIComponent(
    `Hi CLARA! I got an invite from Lee Wakeman. I'm ${firstName}. I'd love to find out more about LifeLink Sync!`
  );
  const waLink = `https://wa.me/${cleanNumber}?text=${waMessage}`;

  // Messenger — opens CLARA on the LifeLink Sync page
  const messengerLink = `https://m.me/${CLARA_MESSENGER_PAGE_ID}${token ? `?ref=invite_${token}` : ''}`;

  // SMS — opens SMS with pre-filled message to CLARA
  const smsMessage = encodeURIComponent(
    `Hi CLARA! I got an invite from Lee Wakeman. I'm ${firstName}. I'd like to find out more about LifeLink Sync.`
  );
  const smsLink = `sms:${CLARA_WHATSAPP_NUMBER}?body=${smsMessage}`;

  // Direct invite link (for email/iMessage)
  const directLink = token
    ? `${INVITE_BASE_URL}?ref=${token}&from=Lee+Wakeman&name=${encodeURIComponent(name)}`
    : `${INVITE_BASE_URL}?from=Lee+Wakeman&name=${encodeURIComponent(name)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    sonnerToast.success('Link copied!');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const channels = [
    {
      id: 'whatsapp',
      icon: <MessageSquare className="w-4 h-4" />,
      label: 'WhatsApp',
      description: `Opens chat with CLARA on WhatsApp`,
      link: waLink,
      copyValue: waLink,
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
      bgColor: 'bg-green-50',
    },
    {
      id: 'messenger',
      icon: <MessageCircle className="w-4 h-4" />,
      label: 'Facebook Messenger',
      description: `Opens CLARA on LifeLink Sync Messenger`,
      link: messengerLink,
      copyValue: messengerLink,
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'sms',
      icon: <Phone className="w-4 h-4" />,
      label: 'SMS',
      description: `Opens SMS to CLARA's number`,
      link: smsLink,
      copyValue: smsLink,
      color: 'bg-gray-500 hover:bg-gray-600',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-200',
      bgColor: 'bg-gray-50',
    },
    {
      id: 'direct',
      icon: <ExternalLink className="w-4 h-4" />,
      label: 'Direct link (email / iMessage)',
      description: directLink.replace('https://', ''),
      link: directLink,
      copyValue: directLink,
      color: 'bg-red-500 hover:bg-red-600',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="bg-white border border-green-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-green-50 border-b border-green-200 px-6 py-5 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-7 h-7 text-green-500" />
        </div>
        <h3 className="text-gray-900 font-bold text-lg mb-1">Invite sent!</h3>
        <p className="text-gray-500 text-sm">{name} will receive your message via {channelLabel}.</p>
        {claraEnhanced && (
          <p className="text-xs text-purple-500 mt-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> Enhanced by CLARA
          </p>
        )}
      </div>

      {/* Share links */}
      <div className="px-6 py-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">Also share via:</p>
        <div className="space-y-3">
          {channels.map((ch) => (
            <div key={ch.id} className={`border ${ch.borderColor} rounded-xl p-3 ${ch.bgColor}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={ch.textColor}>{ch.icon}</span>
                <span className="text-sm font-semibold text-gray-800">{ch.label}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2 truncate">{ch.description}</p>
              <div className="flex gap-2">
                <a
                  href={ch.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 text-center text-xs font-medium text-white py-2 rounded-lg ${ch.color} transition-colors`}
                >
                  {ch.id === 'direct' ? 'Open Link' : `Open ${ch.label.split(' ')[0]}`}
                </a>
                <button
                  onClick={() => copyToClipboard(ch.copyValue, ch.id)}
                  className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {copiedLink === ch.id ? (
                    <><Check className="w-3 h-3 text-green-500" /> Copied</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sent message detail */}
      <div className="px-6 pb-4">
        <details className="text-left">
          <summary className="text-xs text-gray-400 cursor-pointer text-center">View sent message</summary>
          <div className="mt-3 bg-gray-50 rounded-xl p-3 text-xs text-gray-600 whitespace-pre-wrap">{sentMessage}</div>
        </details>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 space-y-2">
        <button onClick={onReset} className="w-full bg-red-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors">
          Send another invite
        </button>
        <button onClick={onViewLeads} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors">
          View in leads
        </button>
      </div>
    </div>
  );
}

// ─── Sent Invites List ───────────────────────────────────────────────────────

function SentInvitesList({ refreshKey }: { refreshKey: boolean }) {
  const navigate = useNavigate();

  const { data: invites, isLoading, refetch } = useQuery({
    queryKey: ['sent-invites', refreshKey],
    queryFn: async () => {
      // Query manual_invites (the existing table used by this page)
      const { data: manual, error: manualErr } = await (supabase as any)
        .from('manual_invites')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (manualErr) {
        console.warn('Failed to load manual_invites:', manualErr);
        return [];
      }
      return manual || [];
    },
    staleTime: 30_000,
  });

  const getStatusBadge = (invite: any) => {
    if (invite.status === 'sent') {
      return { label: 'Sent', color: 'bg-blue-100 text-blue-700' };
    }
    return { label: invite.status || 'Unknown', color: 'bg-gray-100 text-gray-600' };
  };

  const copyInviteLink = (name: string) => {
    const url = `https://lifelink-sync.com/invite?from=Lee+Wakeman&name=${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(url);
    sonnerToast.success('Link copied');
  };

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader><CardTitle>Sent Invites</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Loading...</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" /> All Sent Invites
          </CardTitle>
          <CardDescription>{invites?.length || 0} invites sent</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {!invites?.length ? (
          <p className="text-sm text-muted-foreground py-4">No invites sent yet. Use the form above to send your first one!</p>
        ) : (
          <div className="space-y-3">
            {invites.map((invite: any) => {
              const badge = getStatusBadge(invite);
              return (
                <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{invite.contact_name}</p>
                      <Badge className={`text-xs ${badge.color}`}>{badge.label}</Badge>
                      {invite.clara_enhanced && (
                        <Badge className="text-xs bg-purple-100 text-purple-700">
                          <Sparkles className="h-3 w-3 mr-0.5" /> CLARA
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {/* Channel icons */}
                      {invite.whatsapp_sent && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Phone className="h-3 w-3" /> WhatsApp
                        </span>
                      )}
                      {invite.email_sent && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Mail className="h-3 w-3" /> Email
                        </span>
                      )}
                      {!invite.whatsapp_sent && invite.contact_whatsapp && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Phone className="h-3 w-3" /> WA failed
                        </span>
                      )}
                      {!invite.email_sent && invite.contact_email && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Mail className="h-3 w-3" /> Email failed
                        </span>
                      )}
                      <span>{new Date(invite.created_at).toLocaleDateString()}</span>
                      {invite.protection_for && (
                        <span>For: {invite.protection_for}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1"
                      onClick={() => copyInviteLink(invite.contact_name)}
                      title="Copy invite link"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1"
                      onClick={async () => {
                        try {
                          await supabase.functions.invoke('send-invite', {
                            body: {
                              name: invite.contact_name,
                              phone: invite.contact_whatsapp || null,
                              email: invite.contact_email || null,
                            },
                          });
                          sonnerToast.success(`Invite resent to ${invite.contact_name}`);
                          refetch();
                        } catch {
                          sonnerToast.error('Resend failed');
                        }
                      }}
                      title="Resend invite"
                    >
                      <RefreshCw className="h-3 w-3" /> Resend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs gap-1"
                      onClick={() => navigate('/admin-dashboard/leads')}
                      title="View in leads"
                    >
                      <ExternalLink className="h-3 w-3" /> Lead
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
