import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')!;
const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom = Deno.env.get('TWILIO_WHATSAPP_FROM')!;

const sendWhatsApp = async (to: string, body: string) => {
  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to, From: twilioFrom, Body: body
      }).toString(),
    }
  );
};

const sendEmail = async (
  to: string,
  subject: string,
  body: string,
  recipientName: string
) => {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) {
    console.log('[STUB] Would email', to, subject);
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CLARA — LifeLink Sync <clara@lifelink-sync.com>',
      to: [to],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0d1b35; padding: 24px; text-align: center;">
            <h2 style="color: white; margin: 0;">LifeLink Sync</h2>
          </div>
          <div style="padding: 32px; background: #f8fafc;">
            <p>Hi ${recipientName},</p>
            ${body.split('\n').map((line: string) => `<p>${line}</p>`).join('')}
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;"/>
            <p style="color: #64748b; font-size: 13px;">
              CLARA<br/>
              On behalf of Lee Wakeman<br/>
              LifeLink Sync | lifelink-sync.com
            </p>
          </div>
        </div>
      `,
    }),
  });
};

const interpretPACommand = async (message: string) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Today's date is ${new Date().toISOString().split('T')[0]}.
You are CLARA, Lee Wakeman's PA for LifeLink Sync.
Lee has sent you a PA instruction. Extract the action details.

Message: "${message}"

IMPORTANT:
- task_text must preserve ALL words Lee used — do not shorten or summarize
- When calculating dates: tomorrow = today + 1 day, next week = today + 7 days
- Always use YYYY-MM-DD format for due_date

Respond with JSON only:
{
  "action": "whatsapp|email|task|research|unclear",
  "recipient_name": "name or null",
  "recipient_contact": "phone/email or null",
  "subject": "email subject or null",
  "message_body": "the message to send on Lee's behalf",
  "task_text": "full task description preserving all words Lee used",
  "due_date": "YYYY-MM-DD or null",
  "confirmation": "short message to send Lee confirming what was done"
}`
      }],
    }),
  });
  const data = await response.json();
  const text = data.content[0].text;
  return JSON.parse(text.replace(/```json|```/g, '').trim());
};

serve(async (req) => {
  try {
    const { message, from } = await req.json();

    // Handle task list commands
    if ((message.toLowerCase().includes('show my') && message.toLowerCase().includes('list')) ||
        message.toLowerCase() === 'tasks' ||
        message.toLowerCase() === 'my tasks') {

      const { data: tasks } = await supabase
        .from('clara_tasks')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!tasks || tasks.length === 0) {
        await sendWhatsApp(from, '✅ Your to-do list is clear!');
      } else {
        const list = tasks.map((t: any, i: number) =>
          `${i+1}. ${t.task_text}${t.due_date ? ' (due ' + t.due_date + ')' : ''}`
        ).join('\n');
        await sendWhatsApp(from, `📋 Your to-do list:\n\n${list}`);
      }
      return new Response('', { status: 200 });
    }

    // Handle "done" commands
    if (message.toLowerCase().startsWith('done ') ||
        message.toLowerCase().startsWith('complete ')) {
      const taskText = message.replace(/^done |^complete /i, '');
      await supabase.from('clara_tasks')
        .update({
          status: 'done',
          completed_at: new Date().toISOString()
        })
        .ilike('task_text', `%${taskText}%`);

      await sendWhatsApp(from, `✅ Marked as done: ${taskText}`);
      return new Response('', { status: 200 });
    }

    // Interpret the PA command
    const intent = await interpretPACommand(message);

    if (intent.action === 'whatsapp' && intent.recipient_contact) {
      const paMessage = `${intent.message_body}\n\n— CLARA\n  On behalf of Lee Wakeman\n  LifeLink Sync`;
      const to = intent.recipient_contact.startsWith('whatsapp:')
        ? intent.recipient_contact
        : `whatsapp:${intent.recipient_contact}`;

      await sendWhatsApp(to, paMessage);

      await supabase.from('clara_pa_actions').insert({
        action_type: 'whatsapp',
        recipient_name: intent.recipient_name,
        recipient_contact: intent.recipient_contact,
        message_sent: paMessage,
      });

      await sendWhatsApp(from,
        `✅ WhatsApp sent to ${intent.recipient_name || intent.recipient_contact}\n\n"${intent.message_body.substring(0, 100)}..."`
      );
    }

    else if (intent.action === 'email' && intent.recipient_contact) {
      await sendEmail(
        intent.recipient_contact,
        intent.subject || 'Message from Lee Wakeman',
        intent.message_body,
        intent.recipient_name || 'there'
      );

      await supabase.from('clara_pa_actions').insert({
        action_type: 'email',
        recipient_name: intent.recipient_name,
        recipient_contact: intent.recipient_contact,
        subject: intent.subject,
        message_sent: intent.message_body,
      });

      await sendWhatsApp(from,
        `✅ Email sent to ${intent.recipient_name || intent.recipient_contact}\nSubject: ${intent.subject}`
      );
    }

    else if (intent.action === 'task') {
      await supabase.from('clara_tasks').insert({
        task_text: intent.task_text || message,
        due_date: intent.due_date || null,
      });

      await sendWhatsApp(from,
        `📝 Added to your list:\n"${intent.task_text || message}"${intent.due_date ? '\nDue: ' + intent.due_date : ''}`
      );
    }

    else if (intent.action === 'research') {
      const research = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Research this for Lee Wakeman, owner of LifeLink Sync (emergency protection platform in Spain/UK/Netherlands). Be concise — WhatsApp format, max 300 words:\n\n${message}`
          }],
        }),
      });
      const researchData = await research.json();
      const findings = researchData.content[0].text;

      await sendWhatsApp(from, `🔍 Research results:\n\n${findings}`);
    }

    else {
      await sendWhatsApp(from,
        `I need a bit more detail to help with that.\n\nI can:\n• Send a WhatsApp — tell me who and what to say\n• Send an email — tell me who, subject, message\n• Add a task — tell me what to remember\n• Research anything — just ask`
      );
    }

    return new Response('', { status: 200 });

  } catch (error) {
    console.error('clara-pa error:', error);
    return new Response('', { status: 200 });
  }
});
