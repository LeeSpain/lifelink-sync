import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Send, Eye, Loader2, CheckCircle, Mail, Phone, Sparkles, RefreshCw, Shield, Pencil, User, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    whatsapp: '',
    protectionFor: '',
    personalMessage: '',
    sendVia: 'email' as 'email' | 'whatsapp' | 'both',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
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

  const displayMessage = useEnhanced && enhancedMessage
    ? enhancedMessage
    : rawNote
      ? rawNote
      : '';

  const hasMessage = !!(enhancedMessage || rawNote.trim() || form.personalMessage.trim());
  const hasContact = form.name.trim().length > 0;

  const canSend = form.name.trim() && form.protectionFor && (
    (form.sendVia === 'email' && form.email.trim()) ||
    (form.sendVia === 'whatsapp' && form.whatsapp.trim()) ||
    (form.sendVia === 'both' && form.email.trim() && form.whatsapp.trim())
  );

  const canSendClara = claraForm.name.trim() && claraForm.whatsapp.trim() && claraForm.protectionFor;

  // ─── Auto-translate when language changes or enhanced message updates ───
  useEffect(() => {
    if (contactLanguage === 'en') {
      setTranslatedMessage('');
      return;
    }
    const msgToTranslate = enhancedMessage || rawNote || form.personalMessage;
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
          message: `You are CLARA, the AI assistant for LifeLink Sync — a personal emergency protection platform.

Lee Wakeman has written a rough note about someone he wants to invite to LifeLink Sync.

Rough note: "${noteText}"

Contact name: ${form.name || 'this person'}
Protection for: ${form.protectionFor || 'not specified'}
Relationship type: ${relationship}
Sign off name: ${getSignOff(relationship)}

Write a warm, personalised WhatsApp/email message inviting them to try LifeLink Sync.

Rules:
- Tone must match the relationship: ${getToneGuide(relationship)}
- Mention their specific situation from the note naturally
- Explain what LifeLink Sync is in ONE sentence max
- Focus on WHY it would help THEM specifically
- End with a soft call to action — no hard sell
- Include the trial link: https://lifelink-sync.com
- Sign off as: ${getSignOff(relationship)}
- Maximum 120 words
- No bullet points — flowing natural text
- Do NOT mention prices
- Do NOT say "I'm an AI" or mention CLARA

Return the message text only. No preamble.`,
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

  // ─── Send (Lee mode) ───
  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const messageToSend = contactLanguage !== 'en' && translatedMessage
        ? translatedMessage
        : previewMessage;
      const sendPayload: Record<string, unknown> = {
        type: 'manual_invite',
        contact_name: form.name,
        message: messageToSend,
      };
      if ((form.sendVia === 'whatsapp' || form.sendVia === 'both') && form.whatsapp.trim()) {
        sendPayload.contact_phone = form.whatsapp.trim();
      }
      if ((form.sendVia === 'email' || form.sendVia === 'both') && form.email.trim()) {
        sendPayload.contact_email = form.email.trim();
      }

      const { data: sendResult, error: sendError } = await supabase.functions.invoke('clara-escalation', {
        body: sendPayload,
      });
      if (sendError) throw new Error(sendError.message || 'Failed to send invite');
      if (!sendResult?.success) throw new Error('Invite delivery failed — check WhatsApp number or email address');

      const { error: dbError } = await (supabase as any).from('manual_invites').insert({
        contact_name: form.name,
        contact_email: form.email || null,
        contact_whatsapp: form.whatsapp || null,
        protection_for: form.protectionFor,
        personal_message: (useEnhanced ? enhancedMessage : rawNote || form.personalMessage) || null,
        send_via: form.sendVia,
        message_sent: previewMessage,
        relationship_tone: relationship,
        clara_enhanced: useEnhanced,
        preferred_language: contactLanguage,
        email_sent: sendResult?.email_sent || false,
        whatsapp_sent: sendResult?.whatsapp_sent || false,
        email_error: sendResult?.email_error || null,
        whatsapp_error: null,
        status: 'sent',
      });
      if (dbError) console.warn('Failed to log invite to DB:', dbError);

      // Also add to leads CRM
      const nameParts = form.name.trim().split(' ');
      await (supabase as any).from('leads').insert({
        first_name: nameParts[0] || form.name,
        last_name: nameParts.slice(1).join(' ') || null,
        email: form.email || `${form.whatsapp.replace(/[^0-9]/g, '')}@invite.lifelink-sync.com`,
        phone: form.whatsapp || null,
        lead_source: 'manual_invite',
        language: contactLanguage,
        status: 'new',
        interest_level: 5,
        notes: `Invited via ${form.sendVia}. Protection for: ${form.protectionFor}. ${rawNote || ''}`.trim(),
        tags: ['manual-invite', form.protectionFor].filter(Boolean),
      });
      // Lead insert is best-effort — don't block on errors

      setSentMessage(previewMessage);
      setSent(true);
      const channels = [
        sendResult?.whatsapp_sent && 'WhatsApp',
        sendResult?.email_sent && 'Email',
      ].filter(Boolean).join(' + ');
      toast({
        title: 'Invite Sent',
        description: `Personalised invite sent to ${form.name} via ${channels || form.sendVia}`,
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
          message: `You are CLARA — the AI safety assistant at LifeLink Sync, a personal emergency protection platform. You are reaching out on behalf of Lee Wakeman, who is the founder.

IMPORTANT: You MUST introduce yourself at the start of the message. The recipient has never heard of you. Begin with a greeting using their first name, then immediately explain who you are and why you're reaching out. Example opening: "Hey [Name], I'm CLARA — Lee Wakeman's AI assistant at LifeLink Sync. Lee asked me to reach out because..."

Contact name: ${claraForm.name}
Protection for: ${claraForm.protectionFor}
Relationship type: ${claraRelationship}
${claraForm.roughNote ? `Lee's note about them: "${claraForm.roughNote}"` : ''}

Write a warm, personalised WhatsApp message.

Rules:
- ALWAYS start with "Hey [first name]," then introduce yourself as CLARA
- Explain you're Lee's AI assistant at LifeLink Sync in the first sentence
- Say Lee asked you to reach out — mention WHY based on the note/situation
- Tone must match the relationship: ${getToneGuide(claraRelationship)}
- Mention their specific situation naturally if note provided
- Explain what LifeLink Sync does in ONE sentence max
- Focus on WHY it would help THEM specifically
- End with a soft call to action — no hard sell
- Include the trial link: https://lifelink-sync.com
- Sign off as:
  — CLARA
  On behalf of Lee Wakeman
  LifeLink Sync
- Maximum 150 words
- No bullet points — flowing natural text
- Do NOT mention prices

Return the message text only. No preamble.`,
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

      // Also add to leads CRM
      const nameParts = claraForm.name.trim().split(' ');
      await (supabase as any).from('leads').insert({
        first_name: nameParts[0] || claraForm.name,
        last_name: nameParts.slice(1).join(' ') || null,
        email: `${claraForm.whatsapp.replace(/[^0-9]/g, '')}@invite.lifelink-sync.com`,
        phone: claraForm.whatsapp || null,
        lead_source: 'clara_invite',
        status: 'new',
        interest_level: 5,
        notes: `CLARA invite via WhatsApp. Protection for: ${claraForm.protectionFor}. ${claraForm.roughNote || ''}`.trim(),
        tags: ['clara-invite', claraForm.protectionFor].filter(Boolean),
      });
      // Lead insert is best-effort — don't block on errors

      setClaraSentName(claraForm.name);
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
    setForm({ name: '', email: '', whatsapp: '', protectionFor: '', personalMessage: '', sendVia: 'email' });
    setSent(false);
    setSentMessage('');
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
    setClaraRelationship('friendly');
    setClaraGeneratedMessage('');
    setClaraEditingPreview(false);
  };

  const channelBadge = () => {
    if (form.sendVia === 'both') return '📱 WhatsApp + 📧 Email';
    if (form.sendVia === 'whatsapp') return '📱 WhatsApp';
    return '📧 Email';
  };

  // ─── Preview Panel (Lee mode) ───
  const renderPreviewPanel = () => {
    if (sent) {
      return (
        <div className="bg-white border border-green-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-gray-900 font-bold text-lg mb-2">Invite sent!</h3>
          <p className="text-gray-500 text-sm mb-1">{form.name} will receive your message shortly.</p>
          <p className="text-gray-400 text-xs mb-6">Sent via: {channelBadge()}</p>
          {useEnhanced && (
            <p className="text-xs text-red-500 mb-4 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" /> Enhanced by CLARA
            </p>
          )}
          <details className="text-left mb-6">
            <summary className="text-xs text-gray-400 cursor-pointer text-center">View sent message</summary>
            <div className="mt-3 bg-gray-50 rounded-xl p-3 text-xs text-gray-600 whitespace-pre-wrap">{sentMessage}</div>
          </details>
          <button onClick={reset} className="w-full bg-red-500 text-white py-3 rounded-xl text-sm font-medium mb-2 hover:bg-red-600">
            Send another invite
          </button>
          <button onClick={() => navigate('/admin-dashboard/leads')} className="w-full text-gray-400 text-sm py-2 hover:text-gray-600">
            View in leads →
          </button>
        </div>
      );
    }

    if (!hasContact && !hasMessage) {
      return (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-gray-400 font-medium mb-2">Preview will appear here</h3>
          <p className="text-gray-300 text-sm">Fill in the contact details and let CLARA write the message to see the full preview</p>
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
                {form.sendVia === 'whatsapp' || form.sendVia === 'both'
                  ? form.whatsapp || '+00 000 000 0000'
                  : form.email || 'email@example.com'}
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

          {!hasMessage ? (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 min-h-[120px] flex items-center justify-center">
              <p className="text-gray-400 text-sm text-center italic">
                Write a rough note and click "Let CLARA write this" to generate the message
              </p>
            </div>
          ) : !enhancedMessage && rawNote ? (
            <div className="mb-4">
              <p className="text-[10px] text-amber-500 font-medium mb-2 uppercase tracking-wider">Raw note (not yet enhanced by CLARA)</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{rawNote}</p>
              </div>
              <p className="text-xs text-amber-600 mt-2">Click "Let CLARA write this" to turn this into a polished invite, or send as-is using the template.</p>
            </div>
          ) : isEditingPreview ? (
            <Textarea
              value={enhancedMessage}
              onChange={e => setEnhancedMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-700 min-h-[120px] focus:border-red-500 mb-4"
              rows={6}
            />
          ) : (
            <>
              {(form.sendVia === 'whatsapp' || form.sendVia === 'both') && (
                <div className="mb-3">
                  {form.sendVia === 'both' && <p className="text-[10px] text-gray-400 font-medium mb-1 uppercase tracking-wider">WhatsApp</p>}
                  <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm p-4 relative">
                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{displayMessage}</p>
                    <p className="text-right text-[10px] text-gray-400 mt-2">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </p>
                  </div>
                </div>
              )}
              {(form.sendVia === 'email' || form.sendVia === 'both') && (
                <div className="mb-3">
                  {form.sendVia === 'both' && <p className="text-[10px] text-gray-400 font-medium mb-1 uppercase tracking-wider">Email</p>}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">To:</span> {form.name || 'Contact'} &lt;{form.email || 'email@example.com'}&gt;
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Subject:</span> {form.name?.split(' ')[0] || 'Hi'}, Lee thought you'd want to see this
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{displayMessage}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
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
    <div className="space-y-6">
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
                <CardDescription>Who are you inviting?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Contact Name *</Label>
                  <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="John Smith" />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" />
                </div>
                <div>
                  <Label>WhatsApp Number</Label>
                  <Input type="tel" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} placeholder="+44 7700 900000" />
                </div>
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
                  <Label>Send Via *</Label>
                  <RadioGroup value={form.sendVia} onValueChange={v => update('sendVia', v)} className="flex gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="email" id="via-email" />
                      <Label htmlFor="via-email" className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="whatsapp" id="via-whatsapp" />
                      <Label htmlFor="via-whatsapp" className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> WhatsApp</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="both" id="via-both" />
                      <Label htmlFor="via-both">Both</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    Their preferred language
                    <span className="text-xs font-normal text-gray-400">(used for translation)</span>
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
                  {contactLanguage !== 'en' && (
                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 mt-2">
                      <p>Write your message in English. CLARA will automatically translate it to {contactLanguage === 'es' ? 'Spanish' : 'Dutch'} before sending. You'll see the translation in the preview.</p>
                    </div>
                  )}
                  {form.whatsapp?.startsWith('+34') && contactLanguage === 'en' && (
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
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">CLARA sent it!</h3>
                <p className="text-gray-500 text-sm">Message sent to {claraSentName}</p>
                <p className="text-gray-400 text-xs mt-1">CLARA will follow up automatically if they don't respond</p>
                <button
                  onClick={resetClara}
                  className="mt-6 text-red-500 text-sm font-medium hover:text-red-600"
                >
                  Send another →
                </button>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-1">Just tell CLARA who they are</h3>
                <p className="text-gray-500 text-sm mb-6">She'll write the perfect message. You review it, then send.</p>

                <div className="space-y-4">
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
              <div className="bg-white border border-green-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-2">Delivered!</h3>
                <p className="text-gray-500 text-sm mb-4">{claraSentName} will receive the message shortly via WhatsApp.</p>
                <details className="text-left mb-4">
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
    </div>
  );
}
