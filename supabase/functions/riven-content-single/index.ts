import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface SingleContentRequest {
  goal: string;
  audience: string;
  tone: string;
  platforms: string[];
  topic: string;
  word_count?: number;
  seo_optimize?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not configured");
      return jsonResponse(
        {
          error: "AI content generation is not configured yet.",
          code: "NOT_CONFIGURED",
        },
        503
      );
    }

    const body: SingleContentRequest = await req.json();
    const {
      goal,
      audience,
      tone,
      platforms,
      topic,
      word_count = 500,
      seo_optimize = false,
    } = body;

    if (!platforms?.length || !topic) {
      return jsonResponse(
        { error: "Missing required fields: platforms and topic", code: "BAD_REQUEST" },
        400
      );
    }

    const contentTypeMap: Record<string, string> = {
      twitter: "tweet (max 280 chars, punchy, 3-5 hashtags)",
      tiktok: "TikTok video script with [HOOK], [BODY], [CTA] sections",
      facebook: "Facebook post (100-300 words, conversational)",
      linkedin: "LinkedIn post (150-400 words, professional thought leadership)",
      instagram: "Instagram caption (emoji-rich, 5-10 hashtags)",
      blog: `blog post (${word_count} words, SEO-optimized with headings)`,
      email: "email newsletter (subject line as title, compelling body)",
    };

    const platformSpecs = platforms
      .map((p) => `- ${p}: ${contentTypeMap[p] || "social post"}`)
      .join("\n");

    const seoNote = seo_optimize
      ? "\nFor blog content: include SEO title, meta description (max 160 chars), and 5-10 keywords."
      : "";

    const prompt = `You are Riven, the AI marketing engine for LifeLink Sync — an emergency protection platform for families.

Generate one piece of content per platform for the following topic.

Goal: ${goal}
Audience: ${audience}
Tone: ${tone}
Topic: ${topic}
${seoNote}

Platforms:
${platformSpecs}

Respond with ONLY a JSON array. Each object must have:
- "platform": the platform name
- "title": post title or subject line
- "body_text": the full content
- "hashtags": array of hashtag strings
${seo_optimize ? '- "seo_title": SEO-optimized title (blog only)\n- "meta_description": max 160 chars (blog only)\n- "keywords": array of keywords (blog only)' : ""}

No markdown wrapping, no explanation. Just the JSON array.`;

    // Direct fetch to Anthropic API (no SDK — matches all other working edge functions)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50_000);

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text();
      console.error("Claude API error:", claudeRes.status, errBody);

      if (claudeRes.status === 401) {
        return jsonResponse(
          { error: "AI API key is invalid. Contact admin.", code: "NOT_CONFIGURED" },
          503
        );
      }
      if (claudeRes.status === 429) {
        return jsonResponse(
          { error: "AI rate limit reached. Wait a moment and try again.", code: "RATE_LIMIT" },
          429
        );
      }
      return jsonResponse(
        { error: "Content generation failed. Please try again.", code: "API_ERROR" },
        500
      );
    }

    const claudeData = await claudeRes.json();
    const text = claudeData.content?.[0]?.type === "text"
      ? claudeData.content[0].text
      : "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array in Claude response:", text.substring(0, 200));
      return jsonResponse(
        { error: "AI returned an unexpected format. Please try again.", code: "PARSE_ERROR" },
        502
      );
    }

    const results = JSON.parse(jsonMatch[0]);

    return jsonResponse({ success: true, content: results });
  } catch (error) {
    const err = error as Error;
    console.error("riven-content-single error:", err.message);

    if (err.name === "AbortError" || err.message === "TIMEOUT") {
      return jsonResponse(
        { error: "Content generation timed out. Please try again.", code: "TIMEOUT" },
        504
      );
    }

    return jsonResponse(
      { error: "Content generation failed. Please try again.", code: "API_ERROR" },
      500
    );
  }
});
