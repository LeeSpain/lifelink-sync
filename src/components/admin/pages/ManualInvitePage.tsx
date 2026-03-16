import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Send, Eye, Loader2, CheckCircle, Mail, Phone } from 'lucide-react';
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

  const cta = `\n\nYou can try it free for 7 days — no card needed:\nhttps://lifelink-sync.vercel.app/ai-register`;

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

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setShowPreview(false);
    setSent(false);
  };

  const previewMessage = generateMessage(form.name || 'there', form.protectionFor, form.personalMessage);

  const canSend = form.name.trim() && form.protectionFor && (
    (form.sendVia === 'email' && form.email.trim()) ||
    (form.sendVia === 'whatsapp' && form.whatsapp.trim()) ||
    (form.sendVia === 'both' && form.email.trim() && form.whatsapp.trim())
  );

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);

    try {
      // Send via WhatsApp using clara-escalation as relay
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

      // Log the invite
      await (supabase as any).from('manual_invites').insert({
        contact_name: form.name,
        contact_email: form.email || null,
        contact_whatsapp: form.whatsapp || null,
        protection_for: form.protectionFor,
        personal_message: form.personalMessage || null,
        send_via: form.sendVia,
        message_sent: previewMessage,
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
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manual Invite</h1>
        <p className="text-muted-foreground">Send a personalised invite to a specific contact</p>
      </div>

      {sent ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Invite Sent!</h2>
              <p className="text-muted-foreground mb-6">
                Personalised invite sent to {form.name} via {form.sendVia}
              </p>
              <Button onClick={reset}>Send Another</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
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
                <Label>Personal Message (optional)</Label>
                <Textarea
                  value={form.personalMessage}
                  onChange={e => update('personalMessage', e.target.value)}
                  placeholder="Add a personal note..."
                  rows={3}
                />
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

          {/* Preview */}
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
                <CardTitle className="text-sm">Message Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap font-mono">
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
