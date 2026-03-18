import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const INVITE_BASE_URL = "https://lifelink-sync.com/invite";

// ─── Branded invite email ────────────────────────────────────────────────────

function buildInviteEmailHTML(name: string, inviteUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <tr><td style="background:#ef4444;padding:32px 24px;text-align:center">
      <div style="font-size:32px;margin-bottom:8px">&#x1F6E1;&#xFE0F;</div>
      <h1 style="color:#fff;font-size:20px;margin:0">LifeLink Sync</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:4px 0 0">Emergency Protection Platform</p>
    </td></tr>
    <tr><td style="padding:32px 24px">
      <h2 style="color:#111;font-size:22px;margin:0 0 8px">Hi ${name || "there"}!</h2>
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px">
        Lee Wakeman asked CLARA to reach out to you. He thought LifeLink Sync might be perfect for you and your family.
      </p>
      <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px">
        LifeLink Sync provides 24/7 emergency protection — one-tap SOS alerts, live GPS tracking,
        family circle notifications, and CLARA AI available around the clock. All starting with a
        <strong>free 7-day trial</strong>, no credit card needed.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center">
          <a href="${inviteUrl}" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:700">
            See What Lee Wanted You to See &rarr;
          </a>
        </td></tr>
      </table>
      <p style="color:#999;font-size:12px;text-align:center;margin:24px 0 0;line-height:1.5">
        You received this because Lee Wakeman asked CLARA to send you an invitation.
        <br>If you don't want further messages, simply ignore this email.
      </p>
    </td></tr>
    <tr><td style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="color:#9ca3af;font-size:11px;margin:0">LifeLink Sync &middot; lifelink-sync.com &middot; Madrid, Spain</p>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Main serve ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const { name, phone, email, facebook_psid, notes } = await req.json();

    if (!name?.trim()) {
      throw new Error("Name is required");
    }

    // ── 1. Upsert lead ────────────────────────────────────────────────────────
    let leadId: string | null = null;

    // Try to find existing lead by phone or email
    if (phone) {
      const { data: byPhone } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", phone)
        .limit(1)
        .maybeSingle();
      if (byPhone) leadId = byPhone.id;
    }
    if (!leadId && email) {
      const { data: byEmail } = await supabase
        .from("leads")
        .select("id")
        .eq("email", email)
        .limit(1)
        .maybeSingle();
      if (byEmail) leadId = byEmail.id;
    }

    if (!leadId) {
      const nameParts = name.trim().split(" ");
      const { data: created, error: createErr } = await supabase
        .from("leads")
        .insert({
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(" ") || null,
          full_name: name.trim(),
          email: email || `${Date.now()}@lead.lifelink-sync.com`,
          phone: phone || null,
          lead_source: "clara_invite",
          status: "new",
          interest_level: 5,
          lead_score: 20,
          notes: notes || null,
          tags: ["clara_invite"],
          session_id: crypto.randomUUID(),
          facebook_psid: facebook_psid || null,
        })
        .select("id")
        .single();

      if (createErr) throw new Error(`Lead create failed: ${createErr.message}`);
      leadId = created.id;
    } else {
      // Update existing lead with any new info
      const updates: Record<string, any> = {};
      if (facebook_psid) updates.facebook_psid = facebook_psid;
      if (notes) updates.notes = notes;
      if (Object.keys(updates).length > 0) {
        await supabase.from("leads").update(updates).eq("id", leadId);
      }
    }

    // ── 2. Create invite token ────────────────────────────────────────────────
    const { data: invite, error: invErr } = await supabase
      .from("lead_invites")
      .insert({ lead_id: leadId })
      .select("id, token")
      .single();

    if (invErr) throw new Error(`Invite create failed: ${invErr.message}`);
    const token = invite.token;
    const inviteId = invite.id;

    // ── 3. Build invite URLs per channel ──────────────────────────────────────
    const smsUrl = `${INVITE_BASE_URL}?ref=${token}&ch=sms`;
    const emailUrl = `${INVITE_BASE_URL}?ref=${token}&ch=email`;
    const messengerUrl = `${INVITE_BASE_URL}?ref=${token}&ch=messenger`;

    const smsMessage = `Hi ${name}! Lee Wakeman asked me to reach out. I'm CLARA, the AI assistant for LifeLink Sync. Lee thought this might be perfect for you — your personal link: ${smsUrl} Reply STOP to opt out.`;
    const messengerMessage = `Hi ${name}! Lee Wakeman asked me to reach out. I'm CLARA, LifeLink Sync's AI assistant. Lee thought LifeLink Sync could be perfect for you — click your personal link to find out more: ${messengerUrl}`;

    // ── 4. Fire channels in parallel ──────────────────────────────────────────
    const results: Record<string, any> = {};

    const promises: Promise<void>[] = [];

    // SMS via Twilio
    if (phone) {
      promises.push(
        (async () => {
          try {
            const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
            const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN")!;
            const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER")!;

            const smsRes = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
              {
                method: "POST",
                headers: {
                  Authorization: "Basic " + btoa(`${twilioSid}:${twilioAuth}`),
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  To: phone,
                  From: twilioFrom,
                  Body: smsMessage,
                }),
              }
            );
            const smsData = await smsRes.json();
            results.sms = { success: true, sid: smsData.sid };

            await supabase
              .from("lead_invites")
              .update({
                sms_sent: true,
                sms_sent_at: new Date().toISOString(),
                sms_sid: smsData.sid || null,
              })
              .eq("id", inviteId);
          } catch (e: any) {
            console.warn("SMS send failed:", e.message);
            results.sms = { success: false, error: e.message };
          }
        })()
      );
    }

    // Email via Resend
    if (email) {
      promises.push(
        (async () => {
          try {
            const emailRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "CLARA <clara@lifelink-sync.com>",
                to: email,
                subject: "Lee Wakeman asked CLARA to reach out to you",
                html: buildInviteEmailHTML(name, emailUrl),
              }),
            });
            const emailData = await emailRes.json();
            results.email = { success: true, id: emailData.id };

            await supabase
              .from("lead_invites")
              .update({
                email_sent: true,
                email_sent_at: new Date().toISOString(),
                email_message_id: emailData.id || null,
              })
              .eq("id", inviteId);
          } catch (e: any) {
            console.warn("Email send failed:", e.message);
            results.email = { success: false, error: e.message };
          }
        })()
      );
    }

    // Messenger via facebook-manager
    if (facebook_psid) {
      promises.push(
        (async () => {
          try {
            const messengerRes = await fetch(
              `${supabaseUrl}/functions/v1/facebook-manager`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${serviceRoleKey}`,
                },
                body: JSON.stringify({
                  action: "send_message",
                  recipient_id: facebook_psid,
                  message: messengerMessage,
                }),
              }
            );
            const messengerData = await messengerRes.json();
            results.messenger = { success: true, data: messengerData };

            await supabase
              .from("lead_invites")
              .update({
                messenger_sent: true,
                messenger_sent_at: new Date().toISOString(),
                messenger_recipient_id: facebook_psid,
              })
              .eq("id", inviteId);
          } catch (e: any) {
            console.warn("Messenger send failed:", e.message);
            results.messenger = { success: false, error: e.message };
          }
        })()
      );
    }

    await Promise.all(promises);

    // ── 5. Update lead status ─────────────────────────────────────────────────
    await supabase
      .from("leads")
      .update({
        invite_status: "invited",
        invited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    // ── 6. Log to contact_timeline ──────────────────────────────────────────
    try {
      await supabase.from("contact_timeline").insert({
        contact_email: email || null,
        contact_phone: phone || null,
        contact_name: name,
        event_type: "lead_captured",
        event_category: "sales",
        event_title: `CLARA invite sent to ${name}`,
        event_data: {
          lead_id: leadId,
          token,
          channels: {
            sms: !!phone,
            email: !!email,
            messenger: !!facebook_psid,
          },
        },
        channel: phone ? "sms" : email ? "email" : "messenger",
      });
    } catch (e) {
      console.warn("Timeline log failed:", e);
    }

    console.log(
      `📤 Invite sent for ${name} (${token}) — SMS:${!!phone} Email:${!!email} Messenger:${!!facebook_psid}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        invite_url: `${INVITE_BASE_URL}?ref=${token}`,
        lead_id: leadId,
        token,
        channels: results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("❌ send-invite error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
