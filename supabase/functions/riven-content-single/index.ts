import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.30.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    const body: SingleContentRequest = await req.json();
    const { goal, audience, tone, platforms, topic, word_count = 500, seo_optimize = false } = body;

    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
    });

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

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in Claude response");

    const results = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ success: true, content: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("riven-content-single error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
