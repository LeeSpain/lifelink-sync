import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Bell, Send, X } from 'lucide-react';

interface SendReminderDialogProps {
  recipientUserId: string;
  recipientName: string;
  open: boolean;
  onClose: () => void;
}

export const SendReminderDialog = ({
  recipientUserId,
  recipientName,
  open,
  onClose,
}: SendReminderDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [sending, setSending] = useState(false);
  const [type, setType] = useState<'reminder' | 'message'>('reminder');

  if (!open) return null;

  const senderName =
    [user?.user_metadata?.first_name, user?.user_metadata?.last_name].filter(Boolean).join(' ') ||
    user?.email ||
    'Family';

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);

    try {
      const { error } = await supabase.from('family_alerts').insert({
        family_user_id: recipientUserId,
        alert_type: type === 'reminder' ? 'family_reminder' : 'family_message',
        alert_data: {
          message: message.trim(),
          from_name: senderName,
          scheduled_time: scheduledTime || undefined,
        },
        status: 'sent',
      });

      if (error) throw error;

      toast({
        title: type === 'reminder' ? 'Reminder sent' : 'Message sent',
        description: `Sent to ${recipientName}`,
      });
      setMessage('');
      setScheduledTime('');
      onClose();
    } catch (err: any) {
      console.error('Send reminder error:', err);
      toast({ title: 'Failed to send', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Send to {recipientName}</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Type toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={type === 'reminder' ? 'default' : 'outline'}
            onClick={() => setType('reminder')}
          >
            Reminder
          </Button>
          <Button
            size="sm"
            variant={type === 'message' ? 'default' : 'outline'}
            onClick={() => setType('message')}
          >
            Message
          </Button>
        </div>

        <div className="space-y-3">
          <Input
            placeholder={
              type === 'reminder'
                ? 'e.g. Remember to take your medication at 6pm'
                : 'e.g. Hi Mum, hope you\'re having a lovely day!'
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
          />

          {type === 'reminder' && (
            <Input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              disabled={sending}
            />
          )}

          <Button className="w-full" onClick={handleSend} disabled={sending || !message.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};
