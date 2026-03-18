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
}

const BRAND_SUFFIX =
  "Professional, family safety theme, warm lighting, modern clean design, LifeLink Sync brand colors (red accents on dark backgrounds). No text overlays.";

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
    }: ImageGenerationRequest = await req.json();

    console.log(
      `🎨 Generating image for content ${contentId ?? "preview"}`,
      { platform, style, size }
    );

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Build enhanced prompt with platform context and brand styling
    const enhancedPrompt = buildPrompt(prompt, platform);

    // Call DALL-E 3
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size,
          style,
          response_format: "url",
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("DALL-E 3 API error:", errBody);
      throw new Error(`DALL-E 3 error: ${response.status}`);
    }

    const data = await response.json();
    const tempUrl = data.data?.[0]?.url;
    if (!tempUrl) {
      throw new Error("DALL-E 3 returned no image URL");
    }

    // Download the image from the temporary OpenAI URL
    const imgResponse = await fetch(tempUrl);
    if (!imgResponse.ok) {
      throw new Error("Failed to download generated image");
    }
    const imgBlob = await imgResponse.blob();
    const imgBuffer = new Uint8Array(await imgBlob.arrayBuffer());

    // Upload to Supabase Storage (marketing-images bucket)
    const fileName = `${contentId || crypto.randomUUID()}-${Date.now()}.png`;
    const storagePath = `campaigns/${fileName}`;

    // Ensure bucket exists (idempotent — error ignored if exists)
    await supabase.storage.createBucket("marketing-images", {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
    });

    const { error: uploadError } = await supabase.storage
      .from("marketing-images")
      .upload(storagePath, imgBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error("Failed to upload image to storage");
    }

    // Build permanent public URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const imageUrl = `${supabaseUrl}/storage/v1/object/public/marketing-images/${storagePath}`;

    console.log("✅ Image generated and stored:", imageUrl);

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
        generation_metadata: { style, size, model: "dall-e-3" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        image: imageUrl,
        contentId: contentId ?? null,
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
