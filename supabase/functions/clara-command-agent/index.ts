/**
 * clara-command-agent
 * CLARA's agentic WhatsApp handler for Lee (admin only).
 * Uses Anthropic tool_use to execute business commands:
 * - Post to Facebook
 * - Send lead invites
 * - Get lead/member/Facebook stats
 * - Trigger Riven campaigns
 *
 * Receives forwarded Twilio webhook from whatsapp-inbound.
 * Replies to Lee via Twilio WhatsApp.
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

// ── Send WhatsApp reply to Lee ─────────────────────────────────────────────

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
      body: new URLSearchParams({
        To: to,
        From: twilioFrom,
        Body: message,
      }),
    }
  );
}

// ── Tool definitions for Anthropic ─────────────────────────────────────────

const TOOLS = [
  {
    name: "post_to_facebook",
    description:
      "Creates and posts content to the LifeLink Sync Facebook page. Can generate the post text from a topic, or post exact text Lee provides.",
    input_schema: {
      type: "object" as const,
      properties: {
        topic: {
          type: "string",
          description: "Topic or theme for the post (CLARA generates text)",
        },
        custom_text: {
          type: "string",
          description: "Exact text to post (if Lee provides specific wording)",
        },
        generate_image: {
          type: "boolean",
          description: "Whether to generate an AI image for the post",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "send_lead_invite",
    description:
      "Sends a CLARA invite to a new lead via SMS, WhatsApp and/or email",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Lead's name" },
        phone: { type: "string", description: "Phone number with country code" },
        email: { type: "string", description: "Email address" },
        notes: { type: "string", description: "Notes about the person" },
      },
      required: ["name"],
    },
  },
  {
    name: "get_lead_stats",
    description:
      "Returns the current lead pipeline statistics — invited, clicked, talking, trial, subscribed counts",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_member_stats",
    description:
      "Returns subscriber count, trial count, and MRR statistics",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_facebook_insights",
    description: "Returns Facebook page performance insights (followers, reach, engagement)",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_recent_signups",
    description: "Returns today's new signups and recent trial starts",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
];

// ── Tool execution handlers ────────────────────────────────────────────────

async function executeTool(
  name: string,
  input: Record<string, any>
): Promise<string> {
  switch (name) {
    case "post_to_facebook":
      return await toolPostToFacebook(input);
    case "send_lead_invite":
      return await toolSendInvite(input);
    case "get_lead_stats":
      return await toolGetLeadStats();
    case "get_member_stats":
      return await toolGetMemberStats();
    case "get_facebook_insights":
      return await toolGetFacebookInsights();
    case "get_recent_signups":
      return await toolGetRecentSignups();
    default:
      return `Unknown tool: ${name}`;
  }
}

async function toolPostToFacebook(
  input: Record<string, any>
): Promise<string> {
  try {
    const postText =
      input.custom_text ||
      (await generateFacebookPost(input.topic));

    // Generate image if requested
    let imageUrl: string | null = null;
    if (input.generate_image) {
      try {
        const { data: imgData } = await supabase.functions.invoke(
          "image-generator",
          {
            body: {
              prompt: input.topic,
              platform: "facebook",
              style: "natural",
              size: "1024x1024",
            },
          }
        );
        imageUrl = imgData?.imageUrl || null;
      } catch (e) {
        console.warn("Image generation failed:", e);
      }
    }

    // Post via facebook-manager
    const payload: Record<string, any> = {
      action: "post",
      message: postText,
    };
    if (imageUrl) payload.link = imageUrl;

    const { data, error } = await supabase.functions.invoke(
      "facebook-manager",
      { body: payload }
    );

    if (error) return `Facebook post failed: ${error.message}`;
    if (!data?.success) return `Facebook post failed: ${data?.error || "unknown error"}`;

    const postId = data?.data?.id || "unknown";

    // Log to marketing_content
    try {
      await supabase.from("marketing_content").insert({
        platform: "facebook",
        title: input.topic,
        body_text: postText,
        image_url: imageUrl,
        status: "published",
        posted_at: new Date().toISOString(),
        platform_post_id: postId,
        content_type: "social_post",
      });
    } catch (e) {
      console.warn("Marketing content log failed:", e);
    }

    return JSON.stringify({
      success: true,
      post_id: postId,
      text_preview: postText.substring(0, 150),
      has_image: !!imageUrl,
    });
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
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
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Write a Facebook post for LifeLink Sync about: ${topic}

Rules:
- Warm, empowering tone — never fear-based
- 100-200 words
- Include the 7-day free trial CTA: lifelink-sync.com
- Include 2-3 relevant hashtags (#LifeLinkSync always)
- Include 1-2 relevant emojis
- End with a clear CTA

Output ONLY the post text, nothing else.`,
        },
      ],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || `LifeLink Sync — ${topic}. Start your free trial at lifelink-sync.com`;
}

async function toolSendInvite(
  input: Record<string, any>
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("send-invite", {
      body: {
        name: input.name,
        phone: input.phone || undefined,
        email: input.email || undefined,
        notes: input.notes || undefined,
      },
    });

    if (error) return `Invite failed: ${error.message}`;
    if (!data?.success) return `Invite failed: ${data?.error || "unknown"}`;

    return JSON.stringify({
      success: true,
      invite_url: data.invite_url,
      channels: data.channels,
    });
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}

async function toolGetLeadStats(): Promise<string> {
  const { data } = await supabase.from("leads").select("invite_status");
  if (!data) return "No lead data available";

  const counts: Record<string, number> = {};
  data.forEach((l: any) => {
    const status = l.invite_status || "not_invited";
    counts[status] = (counts[status] || 0) + 1;
  });

  return JSON.stringify({
    total: data.length,
    ...counts,
  });
}

async function toolGetMemberStats(): Promise<string> {
  const { count: totalSubs } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("subscribed", true);

  const { count: trialing } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("is_trialing", true);

  const { count: paid } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("subscribed", true)
    .eq("is_trialing", false);

  return JSON.stringify({
    total_subscribers: totalSubs || 0,
    trialing: trialing || 0,
    paid: paid || 0,
    mrr: `€${((paid || 0) * 9.99).toFixed(2)}`,
  });
}

async function toolGetFacebookInsights(): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "facebook-manager",
      { body: { action: "get_page_info" } }
    );

    if (error || !data?.success) return "Could not fetch Facebook insights";

    const info = data.data;
    return JSON.stringify({
      page_name: info?.name,
      followers: info?.followers_count,
      fans: info?.fan_count,
      category: info?.category,
    });
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}

async function toolGetRecentSignups(): Promise<string> {
  const today = new Date().toISOString().split("T")[0];

  const { data: todayTrials, count: trialCount } = await supabase
    .from("trial_tracking")
    .select("id, created_at", { count: "exact" })
    .gte("created_at", today);

  const { data: todayLeads, count: leadCount } = await supabase
    .from("leads")
    .select("id, first_name, created_at", { count: "exact" })
    .gte("created_at", today);

  return JSON.stringify({
    today_trials: trialCount || 0,
    today_leads: leadCount || 0,
    lead_names: (todayLeads || []).slice(0, 5).map((l: any) => l.first_name),
  });
}

// ── CLARA system prompt for command agent ──────────────────────────────────

const SYSTEM_PROMPT = `You are CLARA, Lee Wakeman's AI business assistant for LifeLink Sync.

Lee is messaging you on WhatsApp. You have tools to execute business actions on his behalf.

CAPABILITIES — YOU CAN DO ALL OF THESE RIGHT NOW:
- Post content to the LifeLink Sync Facebook page using the post_to_facebook tool
- Send CLARA invites to new leads (SMS, WhatsApp, email) using the send_lead_invite tool
- Check lead pipeline stats using get_lead_stats
- Check subscriber/member stats using get_member_stats
- Check Facebook page insights using get_facebook_insights
- Check today's signups using get_recent_signups

CRITICAL RULES:
- You CAN post to Facebook. You have FULL access via the post_to_facebook tool. When Lee asks you to post anything on Facebook, USE THE TOOL IMMEDIATELY. Do NOT say you cannot do it. Do NOT just offer to draft it. CALL THE TOOL.
- When Lee says "post about [topic]" → call post_to_facebook with that topic. Do not ask for confirmation.
- When Lee says "post [exact text] on Facebook" → call post_to_facebook with custom_text. Do not ask for confirmation.
- For stats/insights: call the relevant tool and report the numbers.
- For invites: confirm name and contact details before sending.
- Be concise — WhatsApp messages should be short.
- Use emojis sparingly for readability.
- After a tool executes, summarize the result for Lee in plain WhatsApp language.
- NEVER say "I don't have access to" or "I can't post to" — you have all the tools listed above.`;

// ── Main handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse Twilio webhook payload (forwarded from whatsapp-inbound)
    const rawText = await req.text();
    const params = new URLSearchParams(rawText);
    const body = params.get("Body") ?? "";
    const fromRaw = params.get("From") ?? "";
    const phone = fromRaw.replace("whatsapp:", "");

    if (!body.trim()) {
      return new Response("", { status: 200 });
    }

    console.log(`🤖 CLARA command agent — Lee says: "${body.substring(0, 100)}"`);

    // Check if this is a dev command (forward to clara-dev-agent)
    const devKeywords = /\b(code|deploy|fix bug|update component|create file|edit file|git|branch|PR|pull request|merge)\b/i;
    if (devKeywords.test(body)) {
      // Forward to dev agent instead
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

    // Process response — may contain text and/or tool_use blocks
    const contentBlocks = aiResponse.content || [];
    let textReply = "";
    const toolResults: Array<{
      type: "tool_result";
      tool_use_id: string;
      content: string;
    }> = [];

    for (const block of contentBlocks) {
      if (block.type === "text") {
        textReply += block.text;
      }

      if (block.type === "tool_use") {
        console.log(`🔧 Executing tool: ${block.name}`, block.input);
        const result = await executeTool(block.name, block.input);
        console.log(`🔧 Tool result: ${result.substring(0, 200)}`);

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

    // Send reply to Lee via WhatsApp
    if (textReply.trim()) {
      // Strip markdown for clean WhatsApp
      const clean = textReply
        .replace(/\*\*(.*?)\*\*/g, "*$1*") // Bold → WhatsApp bold
        .replace(/#{1,6}\s/g, "")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1");

      await replyToLee(clean, phone);
    }

    // Log the interaction
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
    } catch (e) {
      console.warn("PA action log failed:", e);
    }

    return new Response("", { status: 200 });
  } catch (error: any) {
    console.error("clara-command-agent error:", error);

    // Try to notify Lee of the error
    try {
      const params = new URLSearchParams(await req.clone().text());
      const phone = (params.get("From") ?? "").replace("whatsapp:", "");
      if (phone) {
        await replyToLee(
          `Sorry, I hit an error: ${error.message?.substring(0, 100)}. Try again.`,
          phone
        );
      }
    } catch {
      /* non-fatal */
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
