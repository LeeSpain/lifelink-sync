import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FB_API = "https://graph.facebook.com/v20.0";

const CLARA_MESSENGER_PROMPT = `You are CLARA (Connected Lifeline And Response Assistant), the AI assistant for LifeLink Sync — an emergency protection platform for individuals and families in Spain, UK and Netherlands. You respond warmly and helpfully to Facebook Messenger messages on behalf of LifeLink Sync.

Your goals:
- Answer questions about LifeLink Sync features and pricing
- Guide interested people toward the 7-day free trial at lifelink-sync.com
- Handle support queries with empathy
- Escalate genuine emergencies by saying "Please call 112 immediately"

Key facts:
- Individual Plan: €9.99/month, 7-day free trial, no credit card required
- Features: SOS button, CLARA AI, GPS tracking, Family Circle, SOS Pendant
- Markets: Spain, UK, Netherlands
- CLARA is an AI assistant, not a human — be transparent about this if asked
- Never provide medical advice
- Keep replies concise (under 200 words) and friendly

If someone is in immediate danger, always say: "Please call emergency services immediately — 112 (Spain/EU), 999 (UK). LifeLink Sync cannot replace emergency services."`;

// ─── Facebook Graph API helper ───────────────────────────────────────────────

async function fbApi(
  path: string,
  token: string,
  method = "GET",
  body?: Record<string, unknown>
): Promise<any> {
  const url = `${FB_API}${path}${path.includes("?") ? "&" : "?"}access_token=${token}`;
  const opts: RequestInit = { method };
  if (body && method !== "GET") {
    opts.headers = { "Content-Type": "application/json" };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const data = await res.json();
  if (data.error) {
    throw new Error(`FB API: ${data.error.message}`);
  }
  return data;
}

// ─── CLARA AI reply via Anthropic ────────────────────────────────────────────

async function claraReply(
  userMessage: string,
  anthropicKey: string,
  extraContext?: string
): Promise<string> {
  const systemPrompt = extraContext
    ? `${CLARA_MESSENGER_PROMPT}\n\nAdditional context: ${extraContext}`
    : CLARA_MESSENGER_PROMPT;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`Anthropic: ${data.error.message}`);
  }
  return data.content?.[0]?.text ?? "Thanks for reaching out! Visit lifelink-sync.com for more info.";
}

// ─── Action handlers ─────────────────────────────────────────────────────────

async function handleAction(
  action: string,
  params: Record<string, any>,
  token: string,
  pageId: string,
  supabase: any,
  anthropicKey: string
) {
  switch (action) {
    // ── Page Management ──────────────────────────────────────────────────────
    case "get_page_info":
      return fbApi(
        `/${pageId}?fields=id,name,fan_count,followers_count,about,category,picture`,
        token
      );

    case "get_posts": {
      const limit = params.limit ?? 25;
      return fbApi(
        `/${pageId}/feed?fields=id,message,created_time,full_picture,shares,likes.summary(true),comments.summary(true)&limit=${limit}`,
        token
      );
    }

    case "post": {
      const body: Record<string, unknown> = { message: params.message };
      if (params.link) body.link = params.link;
      if (params.scheduled_time) {
        body.scheduled_publish_time = params.scheduled_time;
        body.published = false;
      }
      const result = await fbApi(`/${pageId}/feed`, token, "POST", body);

      // Log to social_media_analytics
      try {
        await supabase.from("social_media_analytics").insert({
          platform: "facebook",
          platform_post_id: result.id,
          data_date: new Date().toISOString().split("T")[0],
        });
      } catch (e) {
        console.warn("Analytics log failed:", e);
      }
      return result;
    }

    case "delete_post":
      return fbApi(`/${params.post_id}`, token, "DELETE");

    // ── Comments ─────────────────────────────────────────────────────────────
    case "get_comments":
      return fbApi(
        `/${params.post_id}/comments?fields=id,message,from,created_time,like_count`,
        token
      );

    case "reply_comment":
      return fbApi(`/${params.comment_id}/comments`, token, "POST", {
        message: params.message,
      });

    case "delete_comment":
      return fbApi(`/${params.comment_id}`, token, "DELETE");

    case "like_comment":
      return fbApi(`/${params.comment_id}/likes`, token, "POST");

    // ── Messenger ────────────────────────────────────────────────────────────
    case "get_inbox":
      return fbApi(
        `/${pageId}/conversations?fields=id,participants,updated_time,messages.limit(3){message,from,created_time}`,
        token
      );

    case "send_message": {
      const result = await fbApi(`/me/messages`, token, "POST", {
        recipient: { id: params.recipient_id },
        message: { text: params.message },
        messaging_type: "RESPONSE",
      });
      return result;
    }

    case "get_thread":
      return fbApi(
        `/${params.conversation_id}/messages?fields=id,message,from,created_time`,
        token
      );

    // ── Insights ─────────────────────────────────────────────────────────────
    case "get_insights": {
      const metrics =
        params.metrics ??
        "page_impressions,page_engaged_users,page_fans,page_views_total";
      const period = params.period ?? "day";
      return fbApi(
        `/${pageId}/insights?metric=${metrics}&period=${period}`,
        token
      );
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// ─── Handle invite ref from Messenger postback/referral ──────────────────────

async function handleInviteRef(
  refParam: string,
  senderId: string,
  supabase: any,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<{ leadName: string | null; leadId: string | null }> {
  // ref format: "invite_TOKEN"
  if (!refParam?.startsWith("invite_")) return { leadName: null, leadId: null };

  const token = refParam.replace("invite_", "");
  try {
    const { data: invite } = await supabase
      .from("lead_invites")
      .select("id, lead_id")
      .eq("token", token)
      .maybeSingle();

    if (!invite) return { leadName: null, leadId: null };

    // Mark messenger started
    await supabase
      .from("lead_invites")
      .update({
        messenger_started: true,
        messenger_started_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    // Get lead name
    const { data: lead } = await supabase
      .from("leads")
      .select("first_name, full_name")
      .eq("id", invite.lead_id)
      .maybeSingle();

    // Update lead status
    await supabase
      .from("leads")
      .update({
        invite_status: "talking",
        preferred_channel: "messenger",
        facebook_psid: senderId,
        first_reply_at: new Date().toISOString(),
      })
      .eq("id", invite.lead_id);

    return {
      leadName: lead?.full_name || lead?.first_name || null,
      leadId: invite.lead_id,
    };
  } catch (e) {
    console.warn("Invite ref processing failed:", e);
    return { leadName: null, leadId: null };
  }
}

// ─── Proactive invite generation ─────────────────────────────────────────────

async function maybeGenerateProactiveInvite(
  senderId: string,
  conversationId: string,
  supabase: any,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<string | null> {
  try {
    // Count messages in this conversation
    const { count } = await supabase
      .from("unified_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId);

    // Only trigger after 3+ exchanges (6+ messages = 3 inbound + 3 outbound)
    if (!count || count < 6) return null;

    // Check if we already sent an invite to this PSID
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("facebook_psid", senderId)
      .maybeSingle();

    if (existingLead) {
      const { data: existingInvite } = await supabase
        .from("lead_invites")
        .select("id")
        .eq("lead_id", existingLead.id)
        .maybeSingle();

      if (existingInvite) return null; // Already invited
    }

    // Generate invite
    const inviteRes = await fetch(
      `${supabaseUrl}/functions/v1/send-invite`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          name: `Messenger User ${senderId.slice(-4)}`,
          facebook_psid: senderId,
          notes: "Organic Facebook Messenger conversation — auto-generated invite",
        }),
      }
    );
    const inviteData = await inviteRes.json();

    if (inviteData.success && inviteData.invite_url) {
      console.log(`🔗 Proactive invite generated for ${senderId}: ${inviteData.invite_url}`);
      return inviteData.invite_url;
    }
  } catch (e) {
    console.warn("Proactive invite generation failed:", e);
  }
  return null;
}

// ─── Webhook handler (inbound from Meta) ─────────────────────────────────────

async function handleWebhook(
  body: any,
  token: string,
  pageId: string,
  supabase: any,
  anthropicKey: string,
  supabaseUrl: string,
  serviceRoleKey: string
) {
  const results: string[] = [];

  if (!body.entry) return { processed: 0 };

  for (const entry of body.entry) {
    // Messenger referral postbacks (when someone clicks m.me link with ref)
    if (entry.messaging) {
      for (const event of entry.messaging) {
        const senderId = event.sender?.id;
        if (senderId === pageId) continue;

        // Handle referral (from m.me?ref=invite_TOKEN)
        const refParam =
          event.referral?.ref ||
          event.postback?.referral?.ref ||
          null;

        let inviteContext: { leadName: string | null; leadId: string | null } = {
          leadName: null,
          leadId: null,
        };

        if (refParam) {
          inviteContext = await handleInviteRef(
            refParam,
            senderId,
            supabase,
            supabaseUrl,
            serviceRoleKey
          );
        }

        // Handle text messages
        if (event.message?.text) {
          const userText = event.message.text;
          console.log(`📩 Messenger from ${senderId}: ${userText}`);

          // Build extra context if this is an invited lead
          let extraContext: string | undefined;
          if (inviteContext.leadName) {
            extraContext = `This person (${inviteContext.leadName}) was personally invited by Lee Wakeman. Give them a warm, personalised welcome. Mention that Lee thought LifeLink Sync would be perfect for them. Offer the 7-day free trial.`;
          }

          // Generate CLARA reply
          let reply = inviteContext.leadName
            ? `Hi ${inviteContext.leadName}! 👋 I'm CLARA, Lee Wakeman's AI assistant for LifeLink Sync. Lee thought our emergency protection platform might be perfect for you and your family. Can I tell you a bit about what we do? It only takes 2 minutes and there's a free 7-day trial — no card needed 😊`
            : await claraReply(userText, anthropicKey, extraContext);

          // Check if we should include a proactive invite link
          // Find or create conversation first
          let conversationId: string | null = null;
          try {
            const { data: existing } = await supabase
              .from("unified_conversations")
              .select("id")
              .eq("channel", "facebook_messenger")
              .eq("contact_name", senderId)
              .limit(1)
              .maybeSingle();

            conversationId = existing?.id;

            if (!conversationId) {
              const { data: created } = await supabase
                .from("unified_conversations")
                .insert({
                  channel: "facebook_messenger",
                  contact_name: senderId,
                  status: "active",
                  lead_id: inviteContext.leadId,
                  last_message_at: new Date().toISOString(),
                })
                .select("id")
                .single();
              conversationId = created?.id;
            } else {
              const updates: Record<string, any> = {
                last_message_at: new Date().toISOString(),
              };
              if (inviteContext.leadId) updates.lead_id = inviteContext.leadId;
              await supabase
                .from("unified_conversations")
                .update(updates)
                .eq("id", conversationId);
            }
          } catch (e) {
            console.warn("Conversation log failed:", e);
          }

          // For non-invited users, check if we should proactively invite
          if (!inviteContext.leadName && conversationId) {
            const inviteUrl = await maybeGenerateProactiveInvite(
              senderId,
              conversationId,
              supabase,
              supabaseUrl,
              serviceRoleKey
            );
            if (inviteUrl) {
              // Re-generate reply with invite context
              reply = await claraReply(
                userText,
                anthropicKey,
                `You've been having a great conversation with this person. Include this personal link naturally in your response: ${inviteUrl} — mention it's their personal link to start a free 7-day trial.`
              );
            }
          }

          // Send reply via Messenger
          await fbApi(`/me/messages`, token, "POST", {
            recipient: { id: senderId },
            message: { text: reply },
            messaging_type: "RESPONSE",
          });

          // Log messages
          if (conversationId) {
            try {
              await supabase.from("unified_messages").insert({
                conversation_id: conversationId,
                direction: "inbound",
                content: userText,
                sender_name: senderId,
                content_type: "text",
                status: "delivered",
              });
              await supabase.from("unified_messages").insert({
                conversation_id: conversationId,
                direction: "outbound",
                content: reply,
                sender_name: "CLARA",
                is_ai_generated: true,
                content_type: "text",
                status: "sent",
              });
            } catch (e) {
              console.warn("Message log failed:", e);
            }
          }

          results.push(`Replied to ${senderId}`);
        }

        // Handle postback without text (e.g. Get Started button)
        if (event.postback && !event.message?.text) {
          const sendName = inviteContext.leadName || "there";
          const welcomeMsg = `Hi ${sendName}! 👋 I'm CLARA, the AI assistant for LifeLink Sync — a 24/7 emergency protection platform for individuals and families. How can I help you today?`;

          await fbApi(`/me/messages`, token, "POST", {
            recipient: { id: senderId },
            message: { text: welcomeMsg },
            messaging_type: "RESPONSE",
          });
          results.push(`Welcome message to ${senderId}`);
        }
      }
    }

    // Feed changes (comments, reactions)
    if (entry.changes) {
      for (const change of entry.changes) {
        if (change.field === "feed" && change.value) {
          const val = change.value;

          if (val.item === "comment") {
            try {
              await supabase.from("social_media_engagement").insert({
                platform: "facebook",
                platform_post_id: val.post_id,
                metric_type: "comment",
                metric_value: 1,
                metadata: {
                  comment_id: val.comment_id,
                  from: val.from,
                  message: val.message,
                },
              });
            } catch (e) {
              console.warn("Comment log failed:", e);
            }
            results.push(`Logged comment on ${val.post_id}`);
          }

          if (val.item === "reaction" || val.item === "like") {
            try {
              await supabase.from("social_media_engagement").insert({
                platform: "facebook",
                platform_post_id: val.post_id,
                metric_type: val.item,
                metric_value: 1,
                metadata: { from: val.from, reaction_type: val.reaction_type },
              });
            } catch (e) {
              console.warn("Reaction log failed:", e);
            }
            results.push(`Logged ${val.item} on ${val.post_id}`);
          }
        }

        // Page mentions
        if (change.field === "mention") {
          console.log("📌 Page mention:", JSON.stringify(change.value));
          results.push("Logged page mention");
        }
      }
    }
  }

  return { processed: results.length, details: results };
}

// ─── Main serve ──────────────────────────────────────────────────────────────

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const token = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN")!;
  const pageId = Deno.env.get("FACEBOOK_PAGE_ID")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;
  const verifyToken =
    Deno.env.get("FACEBOOK_WEBHOOK_VERIFY_TOKEN") ?? "lifelink_clara_2026";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // ── Webhook verification (GET from Meta) ─────────────────────────────────
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const challenge = url.searchParams.get("hub.challenge");
      const tokenParam = url.searchParams.get("hub.verify_token");

      if (mode === "subscribe" && tokenParam === verifyToken) {
        console.log("✅ Meta webhook verified");
        return new Response(challenge, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      }
      return new Response("Forbidden", { status: 403 });
    }

    // ── POST: action dispatch or webhook ─────────────────────────────────────
    const body = await req.json();

    // Meta webhook delivery (has "object" and "entry" fields)
    if (body.object === "page" && body.entry) {
      const result = await handleWebhook(
        body,
        token,
        pageId,
        supabase,
        anthropicKey,
        supabaseUrl,
        serviceRoleKey
      );
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin action dispatch
    const { action, ...params } = body;
    if (!action) {
      throw new Error("Missing 'action' in request body");
    }

    const result = await handleAction(
      action,
      params,
      token,
      pageId,
      supabase,
      anthropicKey
    );

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ facebook-manager error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
