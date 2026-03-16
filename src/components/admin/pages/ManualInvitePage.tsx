import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Send, Eye, Loader2, CheckCircle, Mail, Phone, Sparkles, RefreshCw } from 'lucide-react';
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
  const [form, setForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    protectionFor: '',
    personalMessage: '',
    sendVia: 'email' as 'email' | 'whatsapp' | 'both',
  });
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // CLARA enhancement state
  const [relationship, setRelationship] = useState('friendly');
  const [rawNote, setRawNote] = useState('');
  const [enhancedMessage, setEnhancedMessage] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [useEnhanced, setUseEnhanced] = useState(false);

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setShowPreview(false);
    setSent(false);
  };

  const finalMessage = useEnhanced && enhancedMessage
    ? enhancedMessage
    : form.personalMessage;

  const previewMessage = useEnhanced && enhancedMessage
    ? enhancedMessage
    : generateMessage(form.name || 'there', form.protectionFor, form.personalMessage);

  const canSend = form.name.trim() && form.protectionFor && (
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

      const enhanced = response.data?.reply || response.data?.message || '';
      if (enhanced) {
        setEnhancedMessage(enhanced);
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
      if (form.sendVia === 'whatsapp' || form.sendVia === 'both') {
        if (form.whatsapp.trim()) {
          await supabase.functions.invoke('clara-escalation', {
            body: {
              type: 'manual_invite',
              contact_name: form.name,
              contact_phone: form.whatsapp,
              message: previewMessage,
            },
          });
        }
      }

      await (supabase as any).from('manual_invites').insert({
        contact_name: form.name,
        contact_email: form.email || null,
        contact_whatsapp: form.whatsapp || null,
        protection_for: form.protectionFor,
        personal_message: finalMessage || null,
        send_via: form.sendVia,
        message_sent: previewMessage,
        relationship_tone: relationship,
        clara_enhanced: useEnhanced,
        status: 'sent',
      }).then(() => {});

      setSent(true);
      toast({
        title: 'Invite Sent',
        description: `Personalised invite sent to ${form.name}`,
      });
    } catch (err) {
      console.error('Failed to send invite:', err);
      toast({
        title: 'Send Failed',
        description: 'Could not send the invite. Check logs.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setForm({ name: '', email: '', whatsapp: '', protectionFor: '', personalMessage: '', sendVia: 'email' });
    setShowPreview(false);
    setSent(false);
    setRawNote('');
    setEnhancedMessage('');
    setUseEnhanced(false);
    setRelationship('friendly');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manual Invite</h1>
        <p className="text-muted-foreground">Send a personalised invite to a specific contact — let CLARA write the perfect message.</p>
      </div>

      {sent ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Invite Sent!</h2>
              <p className="text-muted-foreground mb-2">
                Personalised invite sent to {form.name} via {form.sendVia}
              </p>
              {useEnhanced && (
                <p className="text-xs text-red-500 mb-4 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" /> Enhanced by CLARA
                </p>
              )}
              <Button onClick={reset}>Send Another</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
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

                {/* Enhance Button */}
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
                </div>

                {/* Example (collapsed) */}
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-gray-600">
                    See an example →
                  </summary>
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

              {/* CLARA Enhanced Preview */}
              {enhancedMessage && (
                <div className="bg-white border border-red-200 rounded-xl p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-gray-700">CLARA's version</span>
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                        {relationships.find(r => r.value === relationship)?.label} tone
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleClaraEnhance}
                        disabled={isEnhancing}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 disabled:opacity-40"
                      >
                        <RefreshCw className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} />
                        Regenerate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseEnhanced(true);
                          toast({ title: "CLARA's message ready to send" });
                        }}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${
                          useEnhanced
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        {useEnhanced ? 'Using this ✓' : 'Use this ✓'}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {enhancedMessage}
                  </p>

                  <p className="text-xs text-muted-foreground mt-2 text-right">
                    {enhancedMessage.split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>
              )}

              {/* Fallback: manual personal message */}
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

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)} disabled={!form.name || !form.protectionFor}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Preview Message'}
            </Button>
            <Button onClick={handleSend} disabled={!canSend || sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Invite
            </Button>
          </div>

          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  Message Preview
                  {useEnhanced && (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-normal flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> CLARA enhanced
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap">
                  {previewMessage}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
