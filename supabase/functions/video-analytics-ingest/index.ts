import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type VideoEventPayload = {
  video_id: string;
  video_title: string;
  youtube_id?: string | null;
  user_id?: string | null;
  session_id?: string | null;
  event_type: "play" | "pause" | "ended" | "seek" | "click";
  watch_duration_seconds?: number | null;
  video_position_seconds?: number | null;
  total_video_duration_seconds?: number | null;
  user_location?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  referrer?: string | null;
  device_type?: string | null;
  browser?: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const payload = (await req.json()) as VideoEventPayload;

    // Basic validation and sanitization
    const allowedEvents = new Set(["play", "pause", "ended", "seek", "click"]);
    if (!payload || !payload.video_id || !payload.video_title || !payload.event_type) {
      return json({ success: false, error: "Missing required fields" }, 400);
    }
    if (!allowedEvents.has(payload.event_type)) {
      return json({ success: false, error: "Invalid event_type" }, 400);
    }

    const clean = {
      video_id: String(payload.video_id).slice(0, 200),
      video_title: String(payload.video_title).slice(0, 300),
      youtube_id: payload.youtube_id ? String(payload.youtube_id).slice(0, 50) : null,
      user_id: payload.user_id ?? null,
      session_id: payload.session_id ? String(payload.session_id).slice(0, 100) : crypto.randomUUID(),
      event_type: payload.event_type,
      watch_duration_seconds: Number(payload.watch_duration_seconds ?? 0),
      video_position_seconds: Number(payload.video_position_seconds ?? 0),
      total_video_duration_seconds: payload.total_video_duration_seconds ?? null,
      user_location: payload.user_location ?? null,
      // IP will be anonymized by DB trigger; do not trust client value
      ip_address: null,
      user_agent: (req.headers.get("user-agent") ?? payload.user_agent ?? "").slice(0, 300),
      referrer: (req.headers.get("referer") ?? payload.referrer ?? "").slice(0, 500),
      device_type: payload.device_type ? String(payload.device_type).slice(0, 50) : null,
      browser: payload.browser ? String(payload.browser).slice(0, 50) : null,
    };

    const { error } = await supabase
      .from("video_analytics")
      .insert(clean);

    if (error) {
      console.error("video-analytics-ingest insert error", error);
      return json({ success: false, error: error.message }, 500);
    }

    return json({ success: true });
  } catch (err) {
    console.error("video-analytics-ingest error", err);
    return json({ success: false, error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
