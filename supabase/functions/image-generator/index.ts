import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ImageGenerationRequest {
  contentId?: string;
  prompt: string;
  platform: string;
  style?: string;
  size?: string;
  model?: "gemini" | "dalle3" | "flux";
}

const BRAND_SUFFIX =
  "Professional, family safety theme, warm lighting, modern clean design, " +
  "LifeLink Sync brand colors (red accents on dark backgrounds). " +
  "No text, words, or numbers in the image. Positive, empowering mood.";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      contentId,
      prompt,
      platform,
      style = "natural",
      size = "1024x1024",
      model: requestedModel,
    }: ImageGenerationRequest = await req.json();

    // Determine which model to use
    let imageModel = requestedModel || "gemini";

    // If no model specified, check riven_settings for the user's preference
    if (!requestedModel) {
      const { data: settings } = await supabase
        .from("riven_settings")
        .select("image_model")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (settings?.image_model) {
        imageModel = settings.image_model;
      }
    }

    console.log(
      `🎨 Generating image with ${imageModel} for content ${contentId ?? "preview"}`,
      { platform, style, size }
    );

    // Build enhanced prompt
    const enhancedPrompt = buildPrompt(prompt, platform);

    // Generate image with selected model (with fallback chain)
    const imageUrl = await generateImage(enhancedPrompt, imageModel, supabase, style, size);

    if (!imageUrl) {
      throw new Error("All image generation models failed");
    }

    console.log(`✅ Image generated (${imageModel}) and stored:`, imageUrl);

    // Update the marketing_content row if contentId was provided
    if (contentId) {
      const { error: updateError } = await supabase
        .from("marketing_content")
        .update({
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contentId);

      if (updateError) {
        console.error("Failed to update content with image:", updateError);
      }

      // Log generation request
      await supabase.from("content_generation_requests").insert({
        campaign_id: null,
        content_type: "image",
        platform,
        prompt: enhancedPrompt,
        generated_image_url: imageUrl,
        status: "completed",
        completed_at: new Date().toISOString(),
        generation_metadata: { style, size, model: imageModel },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        image: imageUrl,
        contentId: contentId ?? null,
        model: imageModel,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Image generation error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// UNIFIED IMAGE GENERATION — routes to correct provider
// ═══════════════════════════════════════════════════════════════

async function generateImage(
  prompt: string,
  model: string,
  supabase: any,
  style: string,
  size: string
): Promise<string | null> {
  switch (model) {
    case "gemini":
      return await generateWithGemini(prompt, supabase);
    case "dalle3":
      return await generateWithDalle3(prompt, supabase, style, size);
    case "flux":
      return await generateWithFlux(prompt, supabase);
    default:
      return await generateWithGemini(prompt, supabase);
  }
}

// ── GEMINI IMAGEN 3 (FREE — default) ───────────────────────────

async function generateWithGemini(
  prompt: string,
  supabase: any
): Promise<string | null> {
  const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
  if (!apiKey) {
    console.warn("🔄 GOOGLE_AI_API_KEY not set, falling back to DALL-E 3");
    return await generateWithDalle3(prompt, supabase, "natural", "1024x1024");
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
            safetyFilterLevel: "BLOCK_SOME",
            personGeneration: "ALLOW_ADULT",
          },
        }),
      }
    );

    const data = await res.json();

    if (data.error) {
      console.error("Gemini error:", data.error.message);
      console.warn("🔄 Falling back to DALL-E 3");
      return await generateWithDalle3(prompt, supabase, "natural", "1024x1024");
    }

    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Image) {
      console.warn("🔄 Gemini returned no image, falling back to DALL-E 3");
      return await generateWithDalle3(prompt, supabase, "natural", "1024x1024");
    }

    // Upload base64 to Supabase storage
    return await uploadBase64ToStorage(base64Image, "image/png", supabase);
  } catch (e) {
    console.error("Gemini generation failed:", e);
    console.warn("🔄 Falling back to DALL-E 3");
    return await generateWithDalle3(prompt, supabase, "natural", "1024x1024");
  }
}

// ── DALL-E 3 (OpenAI — ~$0.04/image) ──────────────────────────

async function generateWithDalle3(
  prompt: string,
  supabase: any,
  style: string,
  size: string
): Promise<string | null> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.warn("🔄 OPENAI_API_KEY not set, falling back to Flux");
    return await generateWithFlux(prompt, supabase);
  }

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size,
        quality: "standard",
        style,
        response_format: "url",
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("DALL-E 3 API error:", errBody);
      return null;
    }

    const data = await res.json();
    const tempUrl = data.data?.[0]?.url;
    if (!tempUrl) return null;

    // Download and upload to Supabase storage for permanent URL
    return await downloadAndUpload(tempUrl, supabase);
  } catch (e) {
    console.error("DALL-E 3 generation failed:", e);
    return null;
  }
}

// ── FLUX 1.1 PRO (Replicate — ~$0.003/image) ──────────────────

async function generateWithFlux(
  prompt: string,
  supabase: any
): Promise<string | null> {
  const apiKey = Deno.env.get("REPLICATE_API_KEY");
  if (!apiKey) {
    console.warn("REPLICATE_API_KEY not set, no more fallbacks");
    return null;
  }

  try {
    const res = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          input: {
            prompt,
            aspect_ratio: "1:1",
            output_format: "webp",
            output_quality: 80,
            safety_tolerance: 2,
          },
        }),
      }
    );

    const data = await res.json();

    if (data.error) {
      console.error("Flux error:", data.error);
      return null;
    }

    const output = Array.isArray(data.output) ? data.output[0] : data.output;
    if (!output) return null;

    // Download and upload to Supabase storage for permanent URL
    return await downloadAndUpload(output, supabase);
  } catch (e) {
    console.error("Flux generation failed:", e);
    return null;
  }
}

// ── STORAGE HELPERS ────────────────────────────────────────────

async function uploadBase64ToStorage(
  base64Data: string,
  mimeType: string,
  supabase: any
): Promise<string | null> {
  try {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const ext = mimeType.includes("webp") ? "webp" : "png";
    const fileName = `riven-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `campaigns/${fileName}`;

    // Try marketing-images bucket first (existing), then marketing-assets
    for (const bucket of ["marketing-images", "marketing-assets"]) {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, bytes, { contentType: mimeType, upsert: true });

      if (!error) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
      }
    }

    // Create bucket and retry
    await supabase.storage.createBucket("marketing-images", {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    });

    const { error } = await supabase.storage
      .from("marketing-images")
      .upload(filePath, bytes, { contentType: mimeType, upsert: true });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    return `${supabaseUrl}/storage/v1/object/public/marketing-images/${filePath}`;
  } catch (e) {
    console.error("Upload failed:", e);
    return null;
  }
}

async function downloadAndUpload(
  url: string,
  supabase: any
): Promise<string | null> {
  try {
    const imgResponse = await fetch(url);
    if (!imgResponse.ok) return null;

    const imgBlob = await imgResponse.blob();
    const imgBuffer = new Uint8Array(await imgBlob.arrayBuffer());
    const mimeType = imgBlob.type || "image/png";

    const ext = mimeType.includes("webp") ? "webp" : "png";
    const fileName = `riven-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `campaigns/${fileName}`;

    // Try marketing-images bucket first
    await supabase.storage.createBucket("marketing-images", {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
    });

    const { error } = await supabase.storage
      .from("marketing-images")
      .upload(filePath, imgBuffer, { contentType: mimeType, upsert: true });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    return `${supabaseUrl}/storage/v1/object/public/marketing-images/${filePath}`;
  } catch (e) {
    console.error("Download and upload failed:", e);
    return null;
  }
}

// ── PROMPT BUILDER ─────────────────────────────────────────────

function buildPrompt(prompt: string, platform: string): string {
  const platformHints: Record<string, string> = {
    facebook:
      "Square format, engaging social media imagery, suitable for Facebook feed.",
    instagram:
      "Square 1:1 format, vibrant and aesthetic, Instagram-optimized.",
    twitter:
      "Landscape 16:9 feel but square crop safe, eye-catching for Twitter timeline.",
    linkedin:
      "Professional and business-appropriate, clean corporate style.",
  };

  const hint = platformHints[platform] || platformHints.facebook;
  return `${prompt}. ${hint} ${BRAND_SUFFIX}`;
}
