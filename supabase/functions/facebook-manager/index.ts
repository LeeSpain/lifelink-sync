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
  anthropicKey: string
): Promise<string> {
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
      system: CLARA_MESSENGER_PROMPT,
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

// ─── Webhook handler (inbound from Meta) ─────────────────────────────────────

async function handleWebhook(
  body: any,
  token: string,
  pageId: string,
  supabase: any,
  anthropicKey: string
) {
  const results: string[] = [];

  if (!body.entry) return { processed: 0 };

  for (const entry of body.entry) {
    // Messenger messages
    if (entry.messaging) {
      for (const event of entry.messaging) {
        if (!event.message?.text) continue;
        const senderId = event.sender?.id;
        // Skip messages from the page itself
        if (senderId === pageId) continue;

        const userText = event.message.text;
        console.log(`📩 Messenger from ${senderId}: ${userText}`);

        // Generate CLARA reply
        const reply = await claraReply(userText, anthropicKey);

        // Send reply via Messenger
        await fbApi(`/me/messages`, token, "POST", {
          recipient: { id: senderId },
          message: { text: reply },
          messaging_type: "RESPONSE",
        });

        // Log conversation
        try {
          // Find or create conversation
          const { data: existing } = await supabase
            .from("unified_conversations")
            .select("id")
            .eq("channel", "facebook_messenger")
            .eq("contact_name", senderId)
            .limit(1)
            .maybeSingle();

          let conversationId = existing?.id;

          if (!conversationId) {
            const { data: created } = await supabase
              .from("unified_conversations")
              .insert({
                channel: "facebook_messenger",
                contact_name: senderId,
                status: "active",
                last_message_at: new Date().toISOString(),
              })
              .select("id")
              .single();
            conversationId = created?.id;
          } else {
            await supabase
              .from("unified_conversations")
              .update({ last_message_at: new Date().toISOString() })
              .eq("id", conversationId);
          }

          if (conversationId) {
            // Log inbound message
            await supabase.from("unified_messages").insert({
              conversation_id: conversationId,
              direction: "inbound",
              content: userText,
              sender_name: senderId,
              content_type: "text",
              status: "delivered",
            });
            // Log outbound CLARA reply
            await supabase.from("unified_messages").insert({
              conversation_id: conversationId,
              direction: "outbound",
              content: reply,
              sender_name: "CLARA",
              is_ai_generated: true,
              content_type: "text",
              status: "sent",
            });
          }
        } catch (e) {
          console.warn("Conversation log failed:", e);
        }

        results.push(`Replied to ${senderId}`);
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

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
        anthropicKey
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
