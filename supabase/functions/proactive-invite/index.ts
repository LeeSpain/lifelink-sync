import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const twilioSid   = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFrom  = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
const leeNumber   = Deno.env.get('TWILIO_WHATSAPP_LEE')!;

const sendWhatsApp = async (to: string, body: string) => {
  const toAddr = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: toAddr, From: twilioFrom, Body: body }).toString(),
    }
  );
};

// ── i18n templates ─────────────────────────────────────────────
// Day 0-7 sequence templates keyed by language then who_for/day
// NOTE: proactive invites are currently initiated by Lee (admin),
// so language defaults to 'en'. When i18n is wired to the invite
// creation payload, pass { language } in invite_data.

// ── Day 0 templates by who_for ─────────────────────────────────
const DAY0: Record<string, string> = {
  self: `Hi NAME 👋\nLee Wakeman thought you might find this useful.\n\nLifeLink Sync gives you a personal emergency button that alerts your chosen contacts instantly if something happens — whether you're travelling solo, working late, or just want peace of mind.\n\n7-day free trial — no card needed.\nTakes 2 minutes to set up.\n\nInterested? Just reply YES and I'll get you started right now 🛡️\n\n— CLARA, LifeLink Sync`,
  mum: `Hi NAME 👋\nLee Wakeman asked me to reach out.\n\nIf your mum lives alone, you'll know that worry — wondering if she's okay, whether she's had a fall, whether anyone would know.\n\nLifeLink Sync gives her a pendant that alerts you instantly if she needs help. You get real-time peace of mind. She keeps her independence.\n\n7-day free trial — no card needed.\nTakes 2 minutes to set up for her.\n\nWould you like to know more? Just reply YES 🛡️\n\n— CLARA, LifeLink Sync`,
  dad: `Hi NAME 👋\nLee Wakeman asked me to reach out.\n\nIf your dad lives independently, you'll know the quiet worry — is he okay? Would anyone know if something happened?\n\nLifeLink Sync gives him a pendant that alerts you the moment he needs help. No fuss for him. Total peace of mind for you.\n\n7-day free trial — no card needed.\nTakes 2 minutes to set up.\n\nInterested? Reply YES and I'll get you started 🛡️\n\n— CLARA, LifeLink Sync`,
  parents: `Hi NAME 👋\nLee Wakeman thought this might help.\n\nKeeping two parents safe and connected while they live independently is a lot to coordinate. LifeLink Sync lets you protect both of them from one account — instant alerts, shared family circle, one monthly cost.\n\n7-day free trial — no card needed.\n\nWant to see how it works? Reply YES 🛡️\n\n— CLARA, LifeLink Sync`,
  business: `Hi NAME 👋\nLee Wakeman asked me to reach out.\n\nIf you have staff working alone — field workers, lone workers, remote teams — LifeLink Sync gives each person an emergency button and gives you instant oversight.\n\nDuty of care compliance built in.\nNo hardware required beyond a smartphone.\n\n7-day free trial. Reply YES to find out more 🛡️\n\n— CLARA, LifeLink Sync`,
  unsure: `Hi NAME 👋\nLee Wakeman thought you might find LifeLink Sync useful.\n\nIt's an emergency protection platform — a personal SOS button that alerts your chosen contacts instantly if you or someone you care about needs help.\n\nUsed by families, solo travellers, lone workers, and carers across Europe.\n\n7-day free trial — no card needed.\nTakes 2 minutes to set up.\n\nCurious? Reply YES 🛡️\n\n— CLARA, LifeLink Sync`,
};

const DAY2 = `Hi NAME 👋 Just checking you got my message about LifeLink Sync.\n\nLee wanted to make sure you had a chance to see it.\n\nStill happy to set up your free trial in 2 minutes — just reply YES 🛡️`;

const DAY4_BY_WHO: Record<string, string> = {
  self: `Hi NAME — one more nudge from CLARA at LifeLink Sync.\n\nHaving a personal emergency button you can press anytime, anywhere — that's real peace of mind.\n\nThe 7-day trial is completely free — no card, no commitment.\n\nJust reply YES to try it 🛡️`,
  mum: `Hi NAME — one more nudge from CLARA.\n\nYour mum's safety doesn't have to keep you up at night. LifeLink Sync alerts you the moment she needs help.\n\nFree trial — no card. Just reply YES 🛡️`,
  dad: `Hi NAME — one more nudge from CLARA.\n\nGiving your dad a safety net without taking his independence — that's what LifeLink Sync does.\n\nFree trial — reply YES 🛡️`,
  parents: `Hi NAME — quick nudge from CLARA.\n\nProtecting both parents from one account — alerts, GPS, family circle.\n\nFree trial — reply YES 🛡️`,
  business: `Hi NAME — quick nudge from CLARA.\n\nLone worker protection with zero hardware. Duty of care sorted.\n\nFree trial — reply YES 🛡️`,
  unsure: `Hi NAME — quick nudge from CLARA at LifeLink Sync.\n\nEmergency protection for you or anyone you care about. Free trial, no card.\n\nReply YES to try it 🛡️`,
};

const DAY7 = `Hi NAME 👋\nLast message from me — I promise!\n\nA lot of families only think about emergency protection after something happens. Lee wanted to make sure you had the chance before then.\n\nFree trial link if you'd prefer to browse first:\nhttps://lifelink-sync.com\n\n— CLARA 🛡️`;

serve(async (req) => {
  try {
    const { action, invite_data } = await req.json();

    // ── Process daily sequence ──────────────────────────────────
    if (action === 'process_sequence') {
      const now = new Date();
      const { data: due } = await supabase
        .from('proactive_invites')
        .select('*')
        .eq('status', 'active')
        .lte('next_contact_at', now.toISOString());

      if (!due?.length) {
        console.log('No invites due for follow-up');
        return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
      }

      let processed = 0;
      for (const invite of due) {
        const name = invite.contact_name?.split(' ')[0] || invite.contact_name;
        const who = invite.who_for || 'unsure';
        let msg = '';
        let nextDay: number | null = null;

        if (invite.sequence_day === 0 || invite.sequence_day === 1) {
          msg = DAY2.replace(/NAME/g, name);
          nextDay = 4;
        } else if (invite.sequence_day === 2 || invite.sequence_day === 3) {
          msg = (DAY4_BY_WHO[who] || DAY4_BY_WHO.unsure).replace(/NAME/g, name);
          nextDay = 7;
        } else if (invite.sequence_day >= 4 && invite.sequence_day < 7) {
          msg = DAY7.replace(/NAME/g, name);
          nextDay = 10;
        } else if (invite.sequence_day >= 7) {
          // Day 10+ — close out
          await supabase.from('proactive_invites')
            .update({ status: 'completed', updated_at: now.toISOString() })
            .eq('id', invite.id);

          await sendWhatsApp(leeNumber,
            `📋 Invite to ${invite.contact_name} completed.\nNo response after 10 days.\nStatus: closed.`
          );
          processed++;
          continue;
        }

        if (msg && invite.contact_phone) {
          await sendWhatsApp(invite.contact_phone, msg);

          const nextDate = new Date(now.getTime() + (nextDay ? (nextDay - invite.sequence_day) : 2) * 86400000);
          await supabase.from('proactive_invites')
            .update({
              sequence_day: invite.sequence_day + 2,
              last_contact_at: now.toISOString(),
              next_contact_at: nextDate.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', invite.id);
          processed++;
        }
      }

      return new Response(JSON.stringify({ processed }), { status: 200 });
    }

    // ── Create new invite ──────────────────────────────────────
    if (action === 'create_invite' && invite_data) {
      const { contact_name, contact_phone, contact_email, who_for, channel, language } = invite_data;

      const template = DAY0[who_for || 'unsure'] || DAY0.unsure;
      const firstName = contact_name?.split(' ')[0] || contact_name;
      const personalised = template.replace(/NAME/g, firstName);

      // Send day 0 message
      if (contact_phone && (channel === 'whatsapp' || channel === 'both')) {
        await sendWhatsApp(contact_phone, personalised);
      }

      // Create invite record
      const nextContact = new Date(Date.now() + 2 * 86400000); // Day 2
      await supabase.from('proactive_invites').insert({
        contact_name,
        contact_phone: contact_phone?.replace('whatsapp:', '') || null,
        contact_email,
        who_for: who_for || 'unsure',
        personalisation_context: `Invited by Lee for ${who_for}${language ? `, lang: ${language}` : ''}`,
        channel: channel || 'whatsapp',
        sequence_day: 0,
        status: 'active',
        next_contact_at: nextContact.toISOString(),
      });

      // Create lead
      await supabase.from('leads').insert({
        session_id: crypto.randomUUID(),
        email: contact_email || null,
        phone: contact_phone?.replace('whatsapp:', '') || null,
        interest_level: 5,
        status: 'new',
        metadata: {
          source: 'proactive_invite',
          who_for,
          contact_name,
          invited_by: 'lee',
        },
      }).catch(() => {});

      // Confirm to Lee
      await sendWhatsApp(leeNumber,
        `✅ Invite sent to ${contact_name}!\nChannel: ${channel || 'whatsapp'}\nFor: ${who_for}\nNext follow-up: Day 2\n\nI'll chase automatically on days 2, 4, 7.`
      );

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });

  } catch (error) {
    console.error('proactive-invite error:', error);
    return new Response('', { status: 200 });
  }
});
