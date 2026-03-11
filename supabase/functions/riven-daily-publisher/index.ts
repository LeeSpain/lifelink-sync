import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find all scheduled content that's due
    const now = new Date().toISOString();
    const { data: duePosts, error: fetchError } = await supabase
      .from("marketing_content")
      .select("id, campaign_id, platform, title, body_text, hashtags")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;
    if (!duePosts || duePosts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, published: 0, message: "No posts due" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{ id: string; platform: string; status: string }> = [];

    // Publish each post via riven-social-publisher
    for (const post of duePosts) {
      try {
        const { data, error } = await supabase.functions.invoke(
          "riven-social-publisher",
          {
            body: {
              content_id: post.id,
              platform: post.platform,
              title: post.title,
              body_text: post.body_text,
              hashtags: post.hashtags,
            },
          }
        );

        results.push({
          id: post.id,
          platform: post.platform,
          status: error ? "failed" : (data?.status || "published"),
        });
      } catch (e) {
        console.error(`Failed to publish post ${post.id}:`, e);
        results.push({ id: post.id, platform: post.platform, status: "failed" });

        // Mark as failed
        await supabase
          .from("marketing_content")
          .update({ status: "failed" })
          .eq("id", post.id);
      }
    }

    const published = results.filter((r) => r.status === "published").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const manual = results.filter((r) => r.status === "pending_manual").length;

    // Send daily summary email via Resend
    const summaryHtml = `
      <h2>Riven Daily Publishing Summary</h2>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Published:</strong> ${published}</p>
      <p><strong>Failed:</strong> ${failed}</p>
      <p><strong>Pending Manual:</strong> ${manual}</p>
      <h3>Details</h3>
      <table border="1" cellpadding="8" cellspacing="0">
        <tr><th>Platform</th><th>Status</th></tr>
        ${results.map((r) => `<tr><td>${r.platform}</td><td>${r.status}</td></tr>`).join("")}
      </table>
    `;

    // Only send summary if there were posts to process
    if (results.length > 0) {
      await supabase.functions.invoke("send-customer-communication", {
        body: {
          type: "admin_notification",
          subject: `Riven Summary: ${published} published, ${failed} failed`,
          html_content: summaryHtml,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: duePosts.length,
        published,
        failed,
        pending_manual: manual,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("riven-daily-publisher error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
