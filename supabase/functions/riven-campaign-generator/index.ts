import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.30.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Content rotation pools ──

const CONTENT_ANGLES = [
  "story",
  "statistic",
  "question",
  "testimonial",
  "educational",
  "urgent",
  "behind_scenes",
  "myth_busting",
] as const;

const HOOK_STYLES = [
  "question_hook",
  "bold_statement",
  "story_hook",
  "statistic_hook",
  "challenge_hook",
] as const;

const CTA_TYPES = [
  "learn_more",
  "book_free_trial",
  "share_with_family",
  "comment_below",
  "save_for_later",
  "visit_link_in_bio",
  "tag_someone",
  "download_guide",
] as const;

interface PlatformSchedule {
  posts_per_day: number;
  times: string[];
  days: "all" | "weekdays" | "weekends" | string[];
}

interface CampaignRequest {
  goal: string;
  tone: string;
  audiences: string[];
  platforms: Record<string, PlatformSchedule>;
  duration_days: number;
  weekly_themes: Array<{ week: number; title: string; description: string; pillars: string[] }>;
  start_date: string; // ISO string
  title?: string;
}

interface GeneratedPost {
  platform: string;
  title: string;
  body_text: string;
  content_angle: string;
  hook_style: string;
  cta_type: string;
  week_number: number;
  day_number: number;
  scheduled_at: string;
  hashtags: string[];
  content_type: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: CampaignRequest = await req.json();
    const {
      goal,
      tone,
      audiences,
      platforms,
      duration_days,
      weekly_themes,
      start_date,
      title,
    } = body;

    // 1. Create the campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .insert({
        title: title || `${goal} Campaign`,
        command_input: JSON.stringify(body),
        status: "processing",
        goal,
        tone,
        target_audience: audiences,
        platforms: Object.keys(platforms),
        duration_days,
        weekly_themes,
        platform_schedules: platforms,
        start_date,
        created_by: null, // admin
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // 2. Build the full content schedule (day × platform × posts_per_day)
    const schedule = buildSchedule(platforms, duration_days, start_date, weekly_themes);

    // 3. Generate content for all posts in batches via Claude
    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
    });

    const allPosts: GeneratedPost[] = [];
    const usedAngles: Map<string, Set<string>> = new Map(); // platform -> set of recent angles

    // Process in batches of up to 10 posts per Claude call
    const BATCH_SIZE = 10;
    for (let i = 0; i < schedule.length; i += BATCH_SIZE) {
      const batch = schedule.slice(i, i + BATCH_SIZE);

      // Pick unique angles for each post in batch
      const batchWithAngles = batch.map((slot) => {
        const angle = pickNext(CONTENT_ANGLES, usedAngles.get(slot.platform));
        const hook = pickNext(HOOK_STYLES);
        const cta = pickNext(CTA_TYPES);

        // Track used angles per platform
        if (!usedAngles.has(slot.platform)) usedAngles.set(slot.platform, new Set());
        const platformAngles = usedAngles.get(slot.platform)!;
        platformAngles.add(angle);
        if (platformAngles.size >= CONTENT_ANGLES.length) platformAngles.clear();

        return { ...slot, content_angle: angle, hook_style: hook, cta_type: cta };
      });

      const prompt = buildPrompt(batchWithAngles, goal, tone, audiences, weekly_themes);

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const text =
        message.content[0].type === "text" ? message.content[0].text : "";

      // Parse JSON array from response
      const parsed = parseClaudeResponse(text, batchWithAngles);
      allPosts.push(...parsed);
    }

    // 4. Insert all generated content into marketing_content
    const contentRows = allPosts.map((post) => ({
      campaign_id: campaign.id,
      platform: post.platform,
      content_type: post.content_type,
      title: post.title,
      body_text: post.body_text,
      content_angle: post.content_angle,
      hook_style: post.hook_style,
      cta_type: post.cta_type,
      week_number: post.week_number,
      day_number: post.day_number,
      scheduled_at: post.scheduled_at,
      hashtags: post.hashtags,
      status: "scheduled",
    }));

    const { error: contentError } = await supabase
      .from("marketing_content")
      .insert(contentRows);

    if (contentError) throw contentError;

    // 5. Record angle usage for future uniqueness tracking
    const angleRows = allPosts.map((post) => ({
      campaign_id: campaign.id,
      platform: post.platform,
      content_angle: post.content_angle,
      hook_style: post.hook_style,
      cta_type: post.cta_type,
      day_number: post.day_number,
    }));

    // Insert in batches to avoid conflicts
    for (let i = 0; i < angleRows.length; i += 50) {
      await supabase
        .from("riven_content_angles")
        .upsert(angleRows.slice(i, i + 50), {
          onConflict: "campaign_id,platform,day_number",
        });
    }

    // 6. Mark campaign as ready
    await supabase
      .from("marketing_campaigns")
      .update({ status: "active" })
      .eq("id", campaign.id);

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id: campaign.id,
        total_posts: allPosts.length,
        platforms: Object.keys(platforms),
        duration_days,
        calendar: allPosts.map((p) => ({
          platform: p.platform,
          day: p.day_number,
          week: p.week_number,
          angle: p.content_angle,
          title: p.title,
          scheduled_at: p.scheduled_at,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("riven-campaign-generator error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ── Helpers ──

function buildSchedule(
  platforms: Record<string, PlatformSchedule>,
  durationDays: number,
  startDate: string,
  weeklyThemes: CampaignRequest["weekly_themes"]
): Array<{
  platform: string;
  day_number: number;
  week_number: number;
  scheduled_at: string;
  theme: string;
  content_type: string;
}> {
  const schedule: Array<{
    platform: string;
    day_number: number;
    week_number: number;
    scheduled_at: string;
    theme: string;
    content_type: string;
  }> = [];
  const start = new Date(startDate);

  const contentTypeMap: Record<string, string> = {
    twitter: "tweet",
    tiktok: "video_script",
    facebook: "social_post",
    linkedin: "article",
    instagram: "caption",
    blog: "blog_post",
    email: "email_newsletter",
  };

  for (let day = 0; day < durationDays; day++) {
    const date = new Date(start);
    date.setDate(date.getDate() + day);
    const dayOfWeek = date.getDay(); // 0=Sun
    const weekNum = Math.floor(day / 7) + 1;
    const theme =
      weeklyThemes[(weekNum - 1) % weeklyThemes.length]?.title || "General";

    for (const [platform, config] of Object.entries(platforms)) {
      // Check if this day is active
      if (config.days === "weekdays" && (dayOfWeek === 0 || dayOfWeek === 6))
        continue;
      if (config.days === "weekends" && dayOfWeek > 0 && dayOfWeek < 6)
        continue;

      const times = config.times.length > 0 ? config.times : ["12:00"];
      const postsToday = Math.min(config.posts_per_day, times.length);

      for (let p = 0; p < postsToday; p++) {
        const [hours, minutes] = (times[p] || times[0]).split(":").map(Number);
        const postDate = new Date(date);
        postDate.setHours(hours, minutes, 0, 0);

        schedule.push({
          platform,
          day_number: day + 1,
          week_number: weekNum,
          scheduled_at: postDate.toISOString(),
          theme,
          content_type: contentTypeMap[platform] || "social_post",
        });
      }
    }
  }

  return schedule;
}

function pickNext<T extends string>(
  pool: readonly T[],
  recentlyUsed?: Set<string>
): T {
  if (!recentlyUsed || recentlyUsed.size === 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const available = pool.filter((item) => !recentlyUsed.has(item));
  if (available.length === 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

function buildPrompt(
  batch: Array<{
    platform: string;
    day_number: number;
    week_number: number;
    scheduled_at: string;
    theme: string;
    content_type: string;
    content_angle: string;
    hook_style: string;
    cta_type: string;
  }>,
  goal: string,
  tone: string,
  audiences: string[],
  weeklyThemes: CampaignRequest["weekly_themes"]
): string {
  const postsSpec = batch
    .map(
      (slot, i) =>
        `Post ${i + 1}: platform="${slot.platform}", type="${slot.content_type}", ` +
        `day=${slot.day_number}, week=${slot.week_number}, theme="${slot.theme}", ` +
        `angle="${slot.content_angle}", hook="${slot.hook_style}", cta="${slot.cta_type}"`
    )
    .join("\n");

  return `You are Riven, the AI marketing engine for LifeLink Sync — an emergency protection platform for families.

Campaign goal: ${goal}
Tone: ${tone}
Target audiences: ${audiences.join(", ")}

Generate ${batch.length} unique social media / content posts. Each post MUST follow its specified angle, hook style, and CTA type. Never repeat the same opening pattern between consecutive posts.

For each post, output a JSON object with: "title", "body_text", "hashtags" (array of strings).

Platform guidelines:
- twitter: max 280 chars, punchy, 3-5 hashtags
- tiktok: video script format with [HOOK], [BODY], [CTA] sections, trending hashtags
- facebook: conversational, 100-300 words, 2-3 hashtags
- linkedin: professional, 150-400 words, thought leadership, 3-5 hashtags
- instagram: visual-first caption, emoji-rich, 5-10 hashtags
- blog: 500-1000 words, SEO-optimized, structured with headings
- email: subject line as title, compelling body with clear CTA

Posts to generate:
${postsSpec}

Respond with ONLY a JSON array of objects. No markdown, no explanation. Example:
[{"title":"...","body_text":"...","hashtags":["#tag1","#tag2"]}]`;
}

function parseClaudeResponse(
  text: string,
  batchMeta: Array<{
    platform: string;
    day_number: number;
    week_number: number;
    scheduled_at: string;
    content_type: string;
    content_angle: string;
    hook_style: string;
    cta_type: string;
  }>
): GeneratedPost[] {
  try {
    // Extract JSON array from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");

    const parsed: Array<{ title: string; body_text: string; hashtags: string[] }> =
      JSON.parse(jsonMatch[0]);

    return parsed.map((item, i) => {
      const meta = batchMeta[i] || batchMeta[batchMeta.length - 1];
      return {
        platform: meta.platform,
        title: item.title || `Post for ${meta.platform}`,
        body_text: item.body_text || "",
        content_angle: meta.content_angle,
        hook_style: meta.hook_style,
        cta_type: meta.cta_type,
        week_number: meta.week_number,
        day_number: meta.day_number,
        scheduled_at: meta.scheduled_at,
        hashtags: item.hashtags || [],
        content_type: meta.content_type,
      };
    });
  } catch (e) {
    console.error("Failed to parse Claude response:", e);
    // Fallback: create basic posts from metadata
    return batchMeta.map((meta) => ({
      platform: meta.platform,
      title: `${meta.content_angle} post for ${meta.platform}`,
      body_text: text.substring(0, 500),
      content_angle: meta.content_angle,
      hook_style: meta.hook_style,
      cta_type: meta.cta_type,
      week_number: meta.week_number,
      day_number: meta.day_number,
      scheduled_at: meta.scheduled_at,
      hashtags: [],
      content_type: meta.content_type,
    }));
  }
}
