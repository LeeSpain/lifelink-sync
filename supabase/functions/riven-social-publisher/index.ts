import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PublishRequest {
  content_id: string;
  platform: string;
  title: string;
  body_text: string;
  hashtags?: string[];
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

    const body: PublishRequest = await req.json();
    const { content_id, platform, title, body_text, hashtags } = body;

    // Fetch the content row to get image_url (may have been generated after text)
    let imageUrl: string | null = null;
    if (content_id) {
      const { data: contentRow } = await supabase
        .from("marketing_content")
        .select("image_url")
        .eq("id", content_id)
        .single();
      imageUrl = contentRow?.image_url || null;
    }

    // If no image yet for a visual platform, generate one now
    const VISUAL_PLATFORMS = ["facebook", "instagram", "twitter", "linkedin"];
    if (!imageUrl && VISUAL_PLATFORMS.includes(platform) && content_id) {
      try {
        const { data: imgData } = await supabase.functions.invoke(
          "image-generator",
          {
            body: {
              contentId: content_id,
              prompt: (title || "") + " — " + (body_text || "").substring(0, 200),
              platform,
              style: "natural",
              size: "1024x1024",
            },
          }
        );
        imageUrl = imgData?.imageUrl || null;
      } catch (err) {
        console.warn("Image generation failed before publish, posting without image:", err);
      }
    }

    let postUrl = "";
    let platformPostId = "";
    let status = "published";

    // Route to the correct platform API
    switch (platform) {
      case "twitter": {
        const apiKey = Deno.env.get("TWITTER_BEARER_TOKEN");
        if (!apiKey) {
          status = "pending_manual";
          break;
        }
        const tweetText =
          body_text.length > 280
            ? body_text.substring(0, 277) + "..."
            : body_text;
        const res = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: tweetText }),
        });
        if (res.ok) {
          const data = await res.json();
          platformPostId = data.data?.id || "";
          postUrl = `https://twitter.com/i/status/${platformPostId}`;
        } else {
          status = "failed";
        }
        break;
      }

      case "linkedin": {
        const accessToken = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
        if (!accessToken) {
          status = "pending_manual";
          break;
        }
        // LinkedIn requires organization ID for company pages
        const orgId = Deno.env.get("LINKEDIN_ORG_ID");
        const author = orgId
          ? `urn:li:organization:${orgId}`
          : "urn:li:person:me";

        const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify({
            author,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: { text: body_text },
                shareMediaCategory: "NONE",
              },
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          platformPostId = data.id || "";
          postUrl = `https://www.linkedin.com/feed/update/${platformPostId}`;
        } else {
          status = "failed";
        }
        break;
      }

      case "facebook": {
        const pageToken = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN") || Deno.env.get("FACEBOOK_PAGE_TOKEN");
        const pageId = Deno.env.get("FACEBOOK_PAGE_ID");
        if (!pageToken || !pageId) {
          status = "pending_manual";
          break;
        }

        let res: Response;
        if (imageUrl) {
          // Post as photo with caption (gets much higher engagement)
          res = await fetch(
            `https://graph.facebook.com/v20.0/${pageId}/photos`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: imageUrl,
                caption: body_text,
                access_token: pageToken,
              }),
            }
          );
        } else {
          // Text-only post
          res = await fetch(
            `https://graph.facebook.com/v20.0/${pageId}/feed`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: body_text,
                access_token: pageToken,
              }),
            }
          );
        }

        if (res.ok) {
          const data = await res.json();
          platformPostId = data.id || data.post_id || "";
          postUrl = `https://www.facebook.com/${platformPostId}`;
        } else {
          const errText = await res.text();
          console.error("Facebook publish error:", errText);
          status = "failed";
        }
        break;
      }

      case "tiktok": {
        // TikTok Content Posting API requires video — text posts saved as manual
        status = "pending_manual";
        break;
      }

      case "blog": {
        // Blog posts are managed internally via the blog system
        // Invoke the existing blog-publisher function if available
        const { error } = await supabase.functions.invoke("blog-publisher", {
          body: { content_id, title, body_text, hashtags },
        });
        status = error ? "failed" : "published";
        break;
      }

      case "email": {
        // Use Resend via existing email infrastructure
        const { error } = await supabase.functions.invoke(
          "send-customer-communication",
          {
            body: {
              type: "marketing",
              subject: title,
              html_content: body_text,
            },
          }
        );
        status = error ? "failed" : "published";
        break;
      }

      default:
        status = "pending_manual";
    }

    // Update the content record
    const updateData: Record<string, unknown> = {
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      platform_post_id: platformPostId || null,
      post_url: postUrl || null,
    };

    await supabase
      .from("marketing_content")
      .update(updateData)
      .eq("id", content_id);

    return new Response(
      JSON.stringify({
        success: status === "published",
        status,
        post_url: postUrl,
        platform_post_id: platformPostId,
        content_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("riven-social-publisher error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
