/**
 * clara-command-agent
 * CLARA's agentic WhatsApp handler for Lee (admin only).
 * Uses Anthropic tool_use for business commands.
 * Has conversation memory via unified_conversations/unified_messages.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;
const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const twilioFrom = Deno.env.get("TWILIO_WHATSAPP_FROM")!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// Track last error so CLARA can reference it
let lastToolError: string | null = null;

// ── Send WhatsApp reply ────────────────────────────────────────────────────

async function replyToLee(message: string, phone: string) {
  const to = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${twilioSid}:${twilioToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: twilioFrom, Body: message }),
    }
  );
  console.log("WhatsApp reply status:", res.status);
}

// ── Conversation memory ────────────────────────────────────────────────────

async function getOrCreateConversation(phone: string): Promise<string> {
  const { data: existing } = await supabase
    .from("unified_conversations")
    .select("id")
    .eq("channel", "whatsapp_admin")
    .eq("contact_phone", phone)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("unified_conversations")
    .insert({
      channel: "whatsapp_admin",
      contact_name: "Lee Wakeman",
      contact_phone: phone,
      status: "active",
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  return created?.id;
}

async function loadRecentMessages(
  conversationId: string
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const { data: msgs } = await supabase
    .from("unified_messages")
    .select("direction, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(10);

  if (!msgs?.length) return [];

  return msgs.map((m: any) => ({
    role: m.direction === "inbound" ? "user" as const : "assistant" as const,
    content: m.content || "",
  }));
}

async function saveMessage(
  conversationId: string,
  direction: "inbound" | "outbound",
  content: string,
  isAi = false
) {
  await supabase.from("unified_messages").insert({
    conversation_id: conversationId,
    direction,
    content: content.substring(0, 2000),
    sender_name: direction === "inbound" ? "Lee" : "CLARA",
    is_ai_generated: isAi,
    content_type: "text",
    status: direction === "inbound" ? "delivered" : "sent",
  });

  await supabase
    .from("unified_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are CLARA — Connected Lifeline And Response Assistant — the AI brain of LifeLink Sync, an emergency protection platform for families.

Lee Wakeman is your owner and the founder of LifeLink Sync. He is messaging you on WhatsApp. You are his personal AI business operator. When Lee messages you, you ACT — you do not just talk about what you could do.

YOUR PERSONALITY WITH LEE:
- Direct, efficient, no fluff
- Confirm actions with a brief summary
- Use emojis sparingly but effectively
- You have MEMORY of this conversation — reference previous messages naturally

WHAT YOU CAN DO — USE THESE TOOLS IMMEDIATELY:

SOCIAL MEDIA:
- post_to_facebook: Post content + AI image to Facebook page
- get_facebook_stats: Page followers, reach, engagement

LEADS & INVITES:
- send_lead_invite: Send invite (name + phone = SMS sent immediately)
- get_lead_pipeline: Lead funnel stats + today's activity

BUSINESS STATS:
- get_business_stats: Subscribers, MRR, trials, new signups, SOS events

MESSAGING:
- send_messenger_message: Send Facebook Messenger message
- generate_invite_link: Generate a trackable invite link

RULES:
1. ALWAYS use a tool when one applies — never just offer to help
2. "invite [name] on [number]" → send_lead_invite IMMEDIATELY
3. "post about [topic] on Facebook" → post_to_facebook IMMEDIATELY
4. "how many members" → get_business_stats IMMEDIATELY
5. NEVER ask "are you sure?" — Lee is always sure
6. If a tool fails, report the EXACT error message so Lee can debug
7. Keep replies under 200 words
8. NEVER say "I don't have access to" or "I can't" — you have all tools above
9. If Lee asks "what happened" or "why did that fail" — report the last error

KEY FACTS:
- Individual Plan: €9.99/month, 7-day free trial, no card needed
- Markets: Spain (112), UK (999), Netherlands (112)
- Website: lifelink-sync.com
- Facebook Page ID: 1022860360912464`;

// ═══════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const TOOLS = [
  {
    name: "post_to_facebook",
    description:
      "Creates and immediately publishes a post to the LifeLink Sync Facebook page. Generates content and AI image automatically unless custom_text is provided.",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: { type: "string", description: "Topic or theme for the post" },
        custom_text: { type: "string", description: "Exact text to post (optional)" },
        generate_image: { type: "boolean", description: "Generate AI image. Default true." },
        scheduled_time: { type: "string", description: "ISO datetime to schedule (optional)" },
      },
      required: ["topic"],
    },
  },
  {
    name: "get_facebook_stats",
    description: "Returns Facebook page info and insights: followers, fans, reach, engagement.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "send_lead_invite",
    description: "Sends CLARA invite via SMS/WhatsApp/email. Creates lead record automatically.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Contact name" },
        phone: { type: "string", description: "Phone with country code" },
        email: { type: "string", description: "Email (optional)" },
        notes: { type: "string", description: "Context (optional)" },
      },
      required: ["name"],
    },
  },
  {
    name: "get_lead_pipeline",
    description: "Returns lead pipeline stats per stage plus today's activity.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_business_stats",
    description: "Returns subscribers, MRR, trials, signups, SOS events.",
    input_schema: {
      type: "object" as const,
      properties: {
        period: { type: "string", description: "'today', 'week', or 'month'. Default 'today'." },
      },
    },
  },
  {
    name: "send_messenger_message",
    description: "Sends a Facebook Messenger message to a PSID.",
    input_schema: {
      type: "object" as const,
      properties: {
        recipient_psid: { type: "string" },
        message: { type: "string" },
      },
      required: ["recipient_psid", "message"],
    },
  },
  {
    name: "generate_invite_link",
    description: "Generates a personal trackable invite link.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        phone: { type: "string" },
        notes: { type: "string" },
      },
      required: ["phone"],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TOOL EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function executeTool(name: string, input: Record<string, any>): Promise<string> {
  try {
    lastToolError = null;
    const result = await executeToolInner(name, input);
    return result;
  } catch (e: any) {
    const errMsg = `Tool ${name} failed: ${e.message}`;
    console.error(errMsg);
    lastToolError = errMsg;
    return JSON.stringify({ error: errMsg });
  }
}

async function executeToolInner(name: string, input: Record<string, any>): Promise<string> {
  switch (name) {
    case "post_to_facebook": return await toolPostToFacebook(input);
    case "get_facebook_stats": return await toolGetFacebookStats();
    case "send_lead_invite": return await toolSendInvite(input);
    case "get_lead_pipeline": return await toolGetLeadPipeline();
    case "get_business_stats": return await toolGetBusinessStats(input);
    case "send_messenger_message": return await toolSendMessenger(input);
    case "generate_invite_link": return await toolGenerateInviteLink(input);
    default: return `Unknown tool: ${name}`;
  }
}

// ── post_to_facebook ───────────────────────────────────────────────────────

async function toolPostToFacebook(input: Record<string, any>): Promise<string> {
  // Generate post text
  const postText = input.custom_text || (await generateFacebookPost(input.topic));
  console.log("📝 Post text generated:", postText.substring(0, 100));

  // Generate image (default true)
  let imageUrl: string | null = null;
  if (input.generate_image !== false) {
    try {
      const imgRes = await fetch(`${supabaseUrl}/functions/v1/image-generator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          prompt: `${input.topic} family safety lifestyle`,
          platform: "facebook",
          style: "natural",
          size: "1024x1024",
        }),
      });
      const imgData = await imgRes.json();
      console.log("🎨 Image gen response:", JSON.stringify(imgData).substring(0, 200));
      imageUrl = imgData?.imageUrl || imgData?.image || null;
    } catch (e: any) {
      console.warn("Image generation failed:", e.message);
    }
  }

  // Post via facebook-manager
  const fbPayload: Record<string, any> = { action: "post", message: postText };
  if (imageUrl) fbPayload.link = imageUrl;
  if (input.scheduled_time) {
    fbPayload.scheduled_time = Math.floor(new Date(input.scheduled_time).getTime() / 1000);
  }

  console.log("📘 Calling facebook-manager with:", JSON.stringify(fbPayload).substring(0, 300));

  const fbRes = await fetch(`${supabaseUrl}/functions/v1/facebook-manager`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(fbPayload),
  });

  const fbStatus = fbRes.status;
  const fbData = await fbRes.json();
  console.log("📘 Facebook response status:", fbStatus, "body:", JSON.stringify(fbData).substring(0, 300));

  if (!fbRes.ok) {
    throw new Error(`Facebook API returned ${fbStatus}: ${JSON.stringify(fbData)}`);
  }
  if (fbData.error) {
    throw new Error(`Facebook error: ${fbData.error}`);
  }
  if (!fbData.success) {
    throw new Error(`Facebook post failed: ${JSON.stringify(fbData)}`);
  }

  const postId = fbData?.data?.id || "unknown";

  // Log to marketing_content
  try {
    await supabase.from("marketing_content").insert({
      platform: "facebook",
      title: input.topic,
      body_text: postText,
      image_url: imageUrl,
      status: input.scheduled_time ? "scheduled" : "published",
      posted_at: input.scheduled_time ? null : new Date().toISOString(),
      scheduled_at: input.scheduled_time || null,
      platform_post_id: postId,
      content_type: "social_post",
    });
  } catch (e: any) {
    console.warn("Marketing content log failed:", e.message);
  }

  return JSON.stringify({
    success: true,
    post_id: postId,
    content_preview: postText.substring(0, 150),
    has_image: !!imageUrl,
    scheduled: !!input.scheduled_time,
  });
}

async function generateFacebookPost(topic: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Write a Facebook post for LifeLink Sync about: ${topic}

Rules: Warm empowering tone, 100-200 words, include lifelink-sync.com CTA, include #LifeLinkSync hashtag, 1-2 emojis, no bullet points. Output ONLY the post text.`,
      }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || `LifeLink Sync — ${topic}. Start your free trial at lifelink-sync.com #LifeLinkSync`;
}

// ── get_facebook_stats ─────────────────────────────────────────────────────

async function toolGetFacebookStats(): Promise<string> {
  const pageRes = await fetch(`${supabaseUrl}/functions/v1/facebook-manager`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
    body: JSON.stringify({ action: "get_page_info" }),
  });
  const pageData = await pageRes.json();
  console.log("FB page info:", JSON.stringify(pageData).substring(0, 200));
  const info = pageData?.data || {};

  let impressions = 0, engaged = 0;
  try {
    const insRes = await fetch(`${supabaseUrl}/functions/v1/facebook-manager`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
      body: JSON.stringify({ action: "get_insights", period: "day" }),
    });
    const insData = await insRes.json();
    const metrics = insData?.data?.data || [];
    impressions = metrics.find((m: any) => m.name === "page_impressions")?.values?.slice(-1)[0]?.value || 0;
    engaged = metrics.find((m: any) => m.name === "page_engaged_users")?.values?.slice(-1)[0]?.value || 0;
  } catch { /* non-fatal */ }

  return JSON.stringify({
    page_name: info.name, followers: info.followers_count, fans: info.fan_count,
    category: info.category, daily_impressions: impressions, daily_engaged: engaged,
  });
}

// ── send_lead_invite ───────────────────────────────────────────────────────

async function toolSendInvite(input: Record<string, any>): Promise<string> {
  const channels: string[] = [];
  if (input.phone) channels.push("sms", "whatsapp");
  if (input.email) channels.push("email");

  const invRes = await fetch(`${supabaseUrl}/functions/v1/send-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
    body: JSON.stringify({
      name: input.name, phone: input.phone || undefined,
      email: input.email || undefined, notes: input.notes || undefined,
      channels: channels.length > 0 ? channels : undefined,
    }),
  });
  const data = await invRes.json();
  console.log("Invite response:", JSON.stringify(data).substring(0, 300));

  if (!data.success) throw new Error(data.error || "Invite failed");

  const sentVia: string[] = [];
  if (data.channels?.sms?.sent) sentVia.push("SMS");
  if (data.channels?.whatsapp?.sent) sentVia.push("WhatsApp");
  if (data.channels?.email?.sent) sentVia.push("Email");

  return JSON.stringify({
    success: true, name: input.name, invite_url: data.invite_url,
    token: data.token, sent_via: sentVia.length > 0 ? sentVia : ["Link generated"],
    lead_id: data.lead_id,
  });
}

// ── get_lead_pipeline ──────────────────────────────────────────────────────

async function toolGetLeadPipeline(): Promise<string> {
  const { data } = await supabase.from("leads").select("invite_status");
  if (!data) return JSON.stringify({ total: 0 });

  const counts: Record<string, number> = {};
  data.forEach((l: any) => { counts[l.invite_status || "not_invited"] = (counts[l.invite_status || "not_invited"] || 0) + 1; });

  const today = new Date().toISOString().split("T")[0];
  const { count: clickedToday } = await supabase.from("lead_invites").select("id", { count: "exact", head: true }).gte("clicked_at", today);
  const { count: trialToday } = await supabase.from("lead_invites").select("id", { count: "exact", head: true }).gte("trial_started_at", today);

  return JSON.stringify({ total: data.length, pipeline: counts, today: { clicked: clickedToday || 0, trial_started: trialToday || 0 } });
}

// ── get_business_stats ─────────────────────────────────────────────────────

async function toolGetBusinessStats(input: Record<string, any>): Promise<string> {
  const period = input.period || "today";
  const since = period === "today" ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    : period === "week" ? new Date(Date.now() - 7 * 86400000).toISOString()
    : new Date(Date.now() - 30 * 86400000).toISOString();

  const [subs, newSignups, trials, sos] = await Promise.all([
    supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("subscribed", true),
    supabase.from("subscribers").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("is_trialing", true),
    supabase.from("sos_events").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);

  return JSON.stringify({
    active_subscribers: subs.count || 0, mrr: `€${((subs.count || 0) * 9.99).toFixed(2)}`,
    active_trials: trials.count || 0, new_signups: newSignups.count || 0,
    sos_events: sos.count || 0, period,
  });
}

// ── send_messenger_message ─────────────────────────────────────────────────

async function toolSendMessenger(input: Record<string, any>): Promise<string> {
  const res = await fetch(`${supabaseUrl}/functions/v1/facebook-manager`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
    body: JSON.stringify({ action: "send_message", recipient_id: input.recipient_psid, message: input.message }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Messenger send failed");
  return JSON.stringify({ success: true });
}

// ── generate_invite_link ───────────────────────────────────────────────────

async function toolGenerateInviteLink(input: Record<string, any>): Promise<string> {
  const res = await fetch(`${supabaseUrl}/functions/v1/send-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceRoleKey}` },
    body: JSON.stringify({ name: input.name || `User ${input.phone?.slice(-4)}`, phone: input.phone, notes: input.notes || "Generated from conversation" }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Link generation failed");
  return JSON.stringify({ success: true, invite_url: data.invite_url, token: data.token });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawText = await req.text();
    const params = new URLSearchParams(rawText);
    const body = params.get("Body") ?? "";
    const fromRaw = params.get("From") ?? "";
    const phone = fromRaw.replace("whatsapp:", "");

    if (!body.trim()) return new Response("", { status: 200 });

    console.log(`🤖 CLARA command agent — Lee says: "${body.substring(0, 100)}"`);

    // Dev commands → forward to clara-dev-agent
    if (/\b(code|deploy|fix bug|update component|create file|edit file|git|branch|PR|pull request|merge)\b/i.test(body)) {
      await fetch(`${supabaseUrl}/functions/v1/clara-dev-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Bearer ${serviceRoleKey}` },
        body: rawText,
      });
      return new Response("", { status: 200 });
    }

    // ── CONVERSATION MEMORY ─────────────────────────────────────────────────
    const conversationId = await getOrCreateConversation(phone);

    // Save inbound message
    if (conversationId) {
      await saveMessage(conversationId, "inbound", body);
    }

    // Load recent conversation history
    const history = conversationId ? await loadRecentMessages(conversationId) : [];

    // Build messages array with history + current message
    // History already includes the current message (just saved), so use it directly
    const messages = history.length > 0
      ? history
      : [{ role: "user" as const, content: body }];

    // Add error context if Lee is asking about a failure
    let systemWithContext = SYSTEM_PROMPT;
    if (lastToolError && /what happened|why.*fail|what.*error|what went wrong|report.*issue/i.test(body)) {
      systemWithContext += `\n\nLAST ERROR: ${lastToolError}`;
    }

    // Call Anthropic with tool_use + conversation history
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemWithContext,
        tools: TOOLS,
        messages,
      }),
    });

    const aiResponse = await response.json();

    if (aiResponse.error) {
      console.error("Anthropic error:", JSON.stringify(aiResponse.error));
      await replyToLee(`Anthropic API error: ${aiResponse.error?.message || JSON.stringify(aiResponse.error)}`, phone);
      return new Response("", { status: 200 });
    }

    // Process response
    const contentBlocks = aiResponse.content || [];
    let textReply = "";
    const toolResults: Array<{ type: "tool_result"; tool_use_id: string; content: string }> = [];

    // Check if any tools will be called — send instant ack before executing
    const hasToolUse = contentBlocks.some((b: any) => b.type === "tool_use");
    if (hasToolUse) {
      // Build a quick contextual ack based on which tool
      const firstTool = contentBlocks.find((b: any) => b.type === "tool_use");
      const ackMessages: Record<string, string> = {
        post_to_facebook: "⚡ On it — posting to Facebook now...",
        send_lead_invite: "⚡ On it — sending the invite now...",
        get_lead_pipeline: "🔄 Pulling lead stats...",
        get_business_stats: "🔄 Checking the numbers...",
        get_facebook_stats: "🔄 Checking Facebook stats...",
        send_messenger_message: "⚡ Sending message...",
        generate_invite_link: "🔄 Generating invite link...",
      };
      const ack = ackMessages[firstTool?.name] || "⚡ On it, Lee...";
      await replyToLee(ack, phone);
    }

    for (const block of contentBlocks) {
      if (block.type === "text") textReply += block.text;
      if (block.type === "tool_use") {
        console.log(`🔧 Executing: ${block.name}`, JSON.stringify(block.input).substring(0, 200));
        const result = await executeTool(block.name, block.input);
        console.log(`🔧 Result: ${result.substring(0, 300)}`);
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
      }
    }

    // If tools were used, get final summary
    if (toolResults.length > 0) {
      const followUp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          system: systemWithContext,
          tools: TOOLS,
          messages: [
            ...messages,
            { role: "assistant", content: contentBlocks },
            { role: "user", content: toolResults },
          ],
        }),
      });
      const followUpData = await followUp.json();
      textReply = "";
      for (const block of followUpData.content || []) {
        if (block.type === "text") textReply += block.text;
      }
    }

    // Send reply via WhatsApp
    if (textReply.trim()) {
      const clean = textReply
        .replace(/\*\*(.*?)\*\*/g, "*$1*")
        .replace(/#{1,6}\s/g, "")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1");

      await replyToLee(clean, phone);

      // Save outbound message
      if (conversationId) {
        await saveMessage(conversationId, "outbound", clean, true);
      }
    }

    // Log interaction
    try {
      await supabase.from("clara_pa_actions").insert({
        action_type: "whatsapp_command",
        recipient_name: "Lee",
        contact: phone,
        message_sent: textReply.substring(0, 500),
        metadata: {
          command: body.substring(0, 200),
          tools_used: toolResults.map((t) => t.tool_use_id),
          conversation_id: conversationId,
        },
      });
    } catch { /* non-fatal */ }

    return new Response("", { status: 200 });
  } catch (error: any) {
    console.error("clara-command-agent error:", error);
    lastToolError = `Agent crash: ${error.message}`;
    try {
      const params = new URLSearchParams(await req.clone().text());
      const phone = (params.get("From") ?? "").replace("whatsapp:", "");
      if (phone) await replyToLee(`Error: ${error.message?.substring(0, 100)}. Try again.`, phone);
    } catch { /* non-fatal */ }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
