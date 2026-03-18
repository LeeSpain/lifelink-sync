/**
 * clara-command-agent
 * CLARA's agentic WhatsApp handler for Lee (admin only).
 * Uses Anthropic tool_use for business commands.
 * Receives forwarded Twilio webhook from whatsapp-inbound.
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

// ── Send WhatsApp reply ────────────────────────────────────────────────────

async function replyToLee(message: string, phone: string) {
  const to = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
  await fetch(
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
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT — CLARA's permanent brain
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are CLARA — Connected Lifeline And Response Assistant — the AI brain of LifeLink Sync, an emergency protection platform for families.

Lee Wakeman is your owner and the founder of LifeLink Sync. He is messaging you on WhatsApp. You are his personal AI business operator. When Lee messages you, you ACT — you do not just talk about what you could do.

YOUR PERSONALITY WITH LEE:
- Direct, efficient, no fluff
- Confirm actions with a brief summary
- Use emojis sparingly but effectively
- Sign off actions with what happened + what's next if relevant

WHAT YOU CAN DO — USE THESE TOOLS IMMEDIATELY:

SOCIAL MEDIA:
- post_to_facebook: Post content + AI image to Facebook page (generates content from topic OR uses exact text Lee gives)
- get_facebook_stats: Page followers, reach, engagement insights

LEADS & INVITES:
- send_lead_invite: Send invite to anyone (name + phone = SMS sent immediately)
- get_lead_pipeline: Lead funnel stats (invited/clicked/talking/trial/subscribed) + today's activity

BUSINESS STATS:
- get_business_stats: Subscribers, MRR, trials, new signups, SOS events

MESSAGING:
- send_messenger_message: Send Facebook Messenger message to a specific person
- generate_invite_link: Generate a personal invite link for a customer in conversation

RULES:
1. ALWAYS use a tool when one applies — never just offer to help
2. If Lee says "invite [name] on [number]" → use send_lead_invite IMMEDIATELY, no confirmation needed
3. If Lee says "post about [topic] on Facebook" → use post_to_facebook IMMEDIATELY
4. If Lee says "how many members" → use get_business_stats IMMEDIATELY
5. NEVER ask "are you sure?" — Lee is always sure
6. If a tool fails, tell Lee what went wrong and suggest an alternative
7. Keep replies under 200 words unless Lee asks for a full report
8. NEVER say "I don't have access to" or "I can't" — you have all the tools above

KEY FACTS:
- Individual Plan: €9.99/month, 7-day free trial, no card needed
- Add-ons: Daily Wellbeing €2.99, Medication Reminder €2.99, Family Link €2.99
- CLARA Complete: FREE when both wellness add-ons active
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
      "Creates and immediately publishes a post to the LifeLink Sync Facebook page. Generates content and an AI image automatically unless custom_text is provided. Use whenever Lee asks to post anything on Facebook.",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: {
          type: "string",
          description: "Topic or theme for the post (e.g. 'family safety', 'medication reminders')",
        },
        custom_text: {
          type: "string",
          description: "Exact post text if Lee specified it. Use this instead of generating.",
        },
        generate_image: {
          type: "boolean",
          description: "Whether to generate an AI image. Default true.",
        },
        scheduled_time: {
          type: "string",
          description: "ISO datetime to schedule the post (optional). If omitted, posts immediately.",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "get_facebook_stats",
    description:
      "Returns LifeLink Sync Facebook page info and insights: followers, fans, reach, engagement.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "send_lead_invite",
    description:
      "Sends a personalised CLARA invite to a new lead via SMS and optionally WhatsApp/email. Creates the lead record automatically. Use immediately when Lee gives a name and phone number.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Contact name" },
        phone: { type: "string", description: "Phone with country code e.g. +34999999999" },
        email: { type: "string", description: "Email address (optional, enables email channel)" },
        notes: { type: "string", description: "Context about the person (optional)" },
      },
      required: ["name"],
    },
  },
  {
    name: "get_lead_pipeline",
    description:
      "Returns lead pipeline stats: counts per stage (not_invited, invited, clicked, talking, trial, subscribed) plus today's click and trial activity.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_business_stats",
    description:
      "Returns key LifeLink Sync business metrics: active subscribers, MRR, active trials, new signups, SOS events.",
    input_schema: {
      type: "object" as const,
      properties: {
        period: {
          type: "string",
          description: "'today', 'week', or 'month'. Default 'today'.",
        },
      },
    },
  },
  {
    name: "send_messenger_message",
    description:
      "Sends a Facebook Messenger message to a specific person using their PSID.",
    input_schema: {
      type: "object" as const,
      properties: {
        recipient_psid: { type: "string", description: "Facebook Page-Scoped ID" },
        message: { type: "string", description: "Message text" },
      },
      required: ["recipient_psid", "message"],
    },
  },
  {
    name: "generate_invite_link",
    description:
      "Generates a personal invite link for someone. Use when a customer is interested and you want to give them a trackable link.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Person's name" },
        phone: { type: "string", description: "Their phone number" },
        notes: { type: "string", description: "Conversation context" },
      },
      required: ["phone"],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TOOL EXECUTION HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

async function executeTool(
  name: string,
  input: Record<string, any>
): Promise<string> {
  try {
    switch (name) {
      case "post_to_facebook":
        return await toolPostToFacebook(input);
      case "get_facebook_stats":
        return await toolGetFacebookStats();
      case "send_lead_invite":
        return await toolSendInvite(input);
      case "get_lead_pipeline":
        return await toolGetLeadPipeline();
      case "get_business_stats":
        return await toolGetBusinessStats(input);
      case "send_messenger_message":
        return await toolSendMessenger(input);
      case "generate_invite_link":
        return await toolGenerateInviteLink(input);
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (e: any) {
    console.error(`Tool ${name} failed:`, e);
    return JSON.stringify({ error: e.message });
  }
}

// ── post_to_facebook ───────────────────────────────────────────────────────

async function toolPostToFacebook(input: Record<string, any>): Promise<string> {
  const postText = input.custom_text || (await generateFacebookPost(input.topic));

  // Generate image (default true)
  let imageUrl: string | null = null;
  if (input.generate_image !== false) {
    try {
      const { data: imgData } = await supabase.functions.invoke("image-generator", {
        body: {
          prompt: `${input.topic} family safety lifestyle`,
          platform: "facebook",
          style: "natural",
          size: "1024x1024",
        },
      });
      imageUrl = imgData?.imageUrl || imgData?.image || null;
    } catch (e) {
      console.warn("Image generation failed, posting without image:", e);
    }
  }

  // Post via facebook-manager
  const payload: Record<string, any> = { action: "post", message: postText };
  if (imageUrl) payload.link = imageUrl;
  if (input.scheduled_time) {
    payload.scheduled_time = Math.floor(new Date(input.scheduled_time).getTime() / 1000);
  }

  const { data, error } = await supabase.functions.invoke("facebook-manager", {
    body: payload,
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || "Facebook post failed");

  const postId = data?.data?.id || "unknown";

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
  } catch (e) {
    console.warn("Marketing content log failed:", e);
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
      messages: [
        {
          role: "user",
          content: `Write a Facebook post for LifeLink Sync about: ${topic}

Rules:
- Warm, empowering tone — never fear-based
- 100-200 words
- Include 7-day free trial CTA: lifelink-sync.com
- Include 2-3 relevant hashtags (#LifeLinkSync always)
- Include 1-2 relevant emojis
- End with a clear CTA
- No bullet points — flowing text

Output ONLY the post text, nothing else.`,
        },
      ],
    }),
  });
  const data = await res.json();
  return (
    data.content?.[0]?.text ||
    `LifeLink Sync — ${topic}. Start your free trial at lifelink-sync.com #LifeLinkSync`
  );
}

// ── get_facebook_stats ─────────────────────────────────────────────────────

async function toolGetFacebookStats(): Promise<string> {
  // Page info
  const { data: pageData } = await supabase.functions.invoke("facebook-manager", {
    body: { action: "get_page_info" },
  });
  const info = pageData?.data || {};

  // Page insights
  let insights: any[] = [];
  try {
    const { data: insightsData } = await supabase.functions.invoke("facebook-manager", {
      body: { action: "get_insights", period: "day" },
    });
    insights = insightsData?.data?.data || [];
  } catch {
    /* non-fatal */
  }

  const impressions = insights.find((m: any) => m.name === "page_impressions")?.values?.slice(-1)[0]?.value || 0;
  const engaged = insights.find((m: any) => m.name === "page_engaged_users")?.values?.slice(-1)[0]?.value || 0;

  return JSON.stringify({
    page_name: info.name,
    followers: info.followers_count,
    fans: info.fan_count,
    category: info.category,
    daily_impressions: impressions,
    daily_engaged: engaged,
  });
}

// ── send_lead_invite ───────────────────────────────────────────────────────

async function toolSendInvite(input: Record<string, any>): Promise<string> {
  const channels: string[] = [];
  if (input.phone) channels.push("sms", "whatsapp");
  if (input.email) channels.push("email");

  const { data, error } = await supabase.functions.invoke("send-invite", {
    body: {
      name: input.name,
      phone: input.phone || undefined,
      email: input.email || undefined,
      notes: input.notes || undefined,
      channels: channels.length > 0 ? channels : undefined,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || "Invite failed");

  const sentVia: string[] = [];
  if (data.channels?.sms?.sent) sentVia.push("SMS");
  if (data.channels?.whatsapp?.sent) sentVia.push("WhatsApp");
  if (data.channels?.email?.sent) sentVia.push("Email");

  return JSON.stringify({
    success: true,
    name: input.name,
    invite_url: data.invite_url,
    token: data.token,
    sent_via: sentVia.length > 0 ? sentVia : ["Link generated"],
    lead_id: data.lead_id,
  });
}

// ── get_lead_pipeline ──────────────────────────────────────────────────────

async function toolGetLeadPipeline(): Promise<string> {
  const { data } = await supabase.from("leads").select("invite_status");
  if (!data) return JSON.stringify({ total: 0 });

  const counts: Record<string, number> = {};
  data.forEach((l: any) => {
    const s = l.invite_status || "not_invited";
    counts[s] = (counts[s] || 0) + 1;
  });

  // Today's activity
  const today = new Date().toISOString().split("T")[0];
  const { count: clickedToday } = await supabase
    .from("lead_invites")
    .select("id", { count: "exact", head: true })
    .gte("clicked_at", today);

  const { count: trialToday } = await supabase
    .from("lead_invites")
    .select("id", { count: "exact", head: true })
    .gte("trial_started_at", today);

  return JSON.stringify({
    total: data.length,
    pipeline: counts,
    today: { clicked: clickedToday || 0, trial_started: trialToday || 0 },
  });
}

// ── get_business_stats ─────────────────────────────────────────────────────

async function toolGetBusinessStats(input: Record<string, any>): Promise<string> {
  const period = input.period || "today";
  const since =
    period === "today"
      ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
      : period === "week"
      ? new Date(Date.now() - 7 * 86400000).toISOString()
      : new Date(Date.now() - 30 * 86400000).toISOString();

  const [subs, newSignups, trials, sos] = await Promise.all([
    supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("subscribed", true),
    supabase.from("subscribers").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("subscribers").select("id", { count: "exact", head: true }).eq("is_trialing", true),
    supabase.from("sos_events").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);

  const paid = (subs.count || 0);
  return JSON.stringify({
    active_subscribers: paid,
    mrr: `€${(paid * 9.99).toFixed(2)}`,
    active_trials: trials.count || 0,
    new_signups: newSignups.count || 0,
    sos_events: sos.count || 0,
    period,
  });
}

// ── send_messenger_message ─────────────────────────────────────────────────

async function toolSendMessenger(input: Record<string, any>): Promise<string> {
  const { data, error } = await supabase.functions.invoke("facebook-manager", {
    body: {
      action: "send_message",
      recipient_id: input.recipient_psid,
      message: input.message,
    },
  });

  if (error) throw new Error(error.message);
  return JSON.stringify({ success: true, data });
}

// ── generate_invite_link ───────────────────────────────────────────────────

async function toolGenerateInviteLink(input: Record<string, any>): Promise<string> {
  const { data, error } = await supabase.functions.invoke("send-invite", {
    body: {
      name: input.name || `User ${input.phone?.slice(-4)}`,
      phone: input.phone,
      notes: input.notes || "Generated from WhatsApp conversation",
    },
  });

  if (error) throw new Error(error.message);
  return JSON.stringify({
    success: true,
    invite_url: data?.invite_url,
    token: data?.token,
  });
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

    if (!body.trim()) {
      return new Response("", { status: 200 });
    }

    console.log(`🤖 CLARA command agent — Lee says: "${body.substring(0, 100)}"`);

    // Dev commands → forward to clara-dev-agent
    const devKeywords =
      /\b(code|deploy|fix bug|update component|create file|edit file|git|branch|PR|pull request|merge)\b/i;
    if (devKeywords.test(body)) {
      await fetch(`${supabaseUrl}/functions/v1/clara-dev-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: rawText,
      });
      return new Response("", { status: 200 });
    }

    // Call Anthropic with tool_use
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
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: [{ role: "user", content: body }],
      }),
    });

    const aiResponse = await response.json();

    if (aiResponse.error) {
      console.error("Anthropic error:", aiResponse.error);
      await replyToLee("Sorry, I hit an error. Try again in a moment.", phone);
      return new Response("", { status: 200 });
    }

    // Process response — text and/or tool_use blocks
    const contentBlocks = aiResponse.content || [];
    let textReply = "";
    const toolResults: Array<{
      type: "tool_result";
      tool_use_id: string;
      content: string;
    }> = [];

    for (const block of contentBlocks) {
      if (block.type === "text") textReply += block.text;

      if (block.type === "tool_use") {
        console.log(`🔧 Executing tool: ${block.name}`, JSON.stringify(block.input).substring(0, 200));
        const result = await executeTool(block.name, block.input);
        console.log(`🔧 Tool result: ${result.substring(0, 300)}`);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }
    }

    // If tools were used, send results back to Claude for final summary
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
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages: [
            { role: "user", content: body },
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
        },
      });
    } catch {
      /* non-fatal */
    }

    return new Response("", { status: 200 });
  } catch (error: any) {
    console.error("clara-command-agent error:", error);
    try {
      const params = new URLSearchParams(await req.clone().text());
      const phone = (params.get("From") ?? "").replace("whatsapp:", "");
      if (phone) {
        await replyToLee(`Sorry, error: ${error.message?.substring(0, 80)}. Try again.`, phone);
      }
    } catch {
      /* non-fatal */
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
