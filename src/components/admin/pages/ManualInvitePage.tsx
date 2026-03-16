import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Send, Eye, Loader2, CheckCircle, Mail, Phone, Sparkles, RefreshCw, Shield, Pencil } from 'lucide-react';
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

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSent(false);
  };

  const finalMessage = useEnhanced && enhancedMessage
    ? enhancedMessage
    : form.personalMessage;

  const previewMessage = useEnhanced && enhancedMessage
    ? enhancedMessage
    : generateMessage(form.name || 'there', form.protectionFor, form.personalMessage);

  const displayMessage = enhancedMessage || rawNote || '';
  const hasMessage = displayMessage.trim().length > 0;
  const hasContact = form.name.trim().length > 0;
  const hasChannel = !!(form.email.trim() || form.whatsapp.trim());

  const canSend = form.name.trim() && form.protectionFor && hasMessage && (
    (form.sendVia === 'email' && form.email.trim()) ||
    (form.sendVia === 'whatsapp' && form.whatsapp.trim()) ||
    (form.sendVia === 'both' && form.email.trim() && form.whatsapp.trim())
  );

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

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const sendPayload: Record<string, unknown> = {
        type: 'manual_invite',
        contact_name: form.name,
        message: previewMessage,
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
        personal_message: finalMessage || null,
        send_via: form.sendVia,
        message_sent: previewMessage,
        relationship_tone: relationship,
        clara_enhanced: useEnhanced,
        email_sent: sendResult?.email_sent || false,
        whatsapp_sent: sendResult?.whatsapp_sent || false,
        email_error: sendResult?.email_error || null,
        whatsapp_error: null,
        status: 'sent',
      });
      if (dbError) console.warn('Failed to log invite to DB:', dbError);

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

  // ─── Channel badge helper ───
  const channelBadge = () => {
    if (form.sendVia === 'both') return '📱 WhatsApp + 📧 Email';
    if (form.sendVia === 'whatsapp') return '📱 WhatsApp';
    return '📧 Email';
  };

  // ─── Preview Panel ───
  const renderPreviewPanel = () => {
    // Success state
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

    // Empty state
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

    // Partial or full preview
    return (
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
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

        {/* Body */}
        <div className="px-6 py-5">
          {/* Badges */}
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

          {/* Message area */}
          {!hasMessage ? (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 min-h-[120px] flex items-center justify-center">
              <p className="text-gray-400 text-sm text-center italic">
                Write a rough note and click "Let CLARA write this" to generate the message
              </p>
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
              {/* WhatsApp preview */}
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

              {/* Email preview */}
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

          {/* Word/char count */}
          {hasMessage && (
            <p className="text-xs text-gray-400 mb-3">
              {displayMessage.split(/\s+/).filter(Boolean).length} words · {displayMessage.length} characters
            </p>
          )}

          {/* Edit toggle */}
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

          {/* Protection info */}
          {form.protectionFor && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Shield className="w-3.5 h-3.5 text-red-400" />
              <span>Protection for: {protectionOptions.find(o => o.value === form.protectionFor)?.label}</span>
            </div>
          )}
        </div>

        {/* Footer — Accept & Send */}
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
        <p className="text-muted-foreground">Send a personalised invite to a specific contact — let CLARA write the perfect message.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ─── LEFT COLUMN — Form ─── */}
        <div className="space-y-6">
          {/* Contact Details Card */}
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
            </CardContent>
          </Card>

          {/* CLARA Message Enhancement Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-red-500" />
                CLARA Message Writer
              </CardTitle>
              <CardDescription>Write a rough note, pick a tone, and let CLARA craft the perfect invite.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Relationship/Tone Selector */}
              <div>
                <Label className="mb-2 block">Relationship & tone</Label>
                <div className="flex flex-wrap gap-2">
                  {relationships.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setRelationship(r.value);
                        setEnhancedMessage('');
                        setUseEnhanced(false);
                      }}
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

              {/* Raw Note Textarea */}
              <div>
                <Label className="mb-2 block">Your rough note about them</Label>
                <Textarea
                  value={rawNote}
                  onChange={e => {
                    setRawNote(e.target.value);
                    setEnhancedMessage('');
                    setUseEnhanced(false);
                  }}
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
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        CLARA is writing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Let CLARA write this
                      </>
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

                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-gray-600">See an example →</summary>
                  <div className="mt-2 bg-muted rounded-lg p-3 text-xs text-gray-600 space-y-2">
                    <div>
                      <p className="font-medium text-gray-700">Your note:</p>
                      <p className="italic">"He's a friend, his mum lives alone in Málaga, might be good for her. He has 2 daughters aged 17."</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">CLARA writes (Friendly tone):</p>
                      <p className="italic">"Hey! Hope you're well. I've been using something I think could be really useful for your mum in Málaga — especially since she's living on her own. It's called LifeLink Sync, basically gives her a one-tap emergency button that alerts the family instantly. Given you've got the girls too, might give everyone a bit more peace of mind. Worth a look? Happy to tell you more. — Lee"</p>
                    </div>
                  </div>
                </details>
              </div>

              {/* Fallback manual note */}
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

        {/* ─── RIGHT COLUMN — Live Preview ─── */}
        <div className="lg:sticky lg:top-6">
          {renderPreviewPanel()}
        </div>
      </div>
    </div>
  );
}
