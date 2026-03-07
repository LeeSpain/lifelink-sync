// supabase/functions/automation-runner/index.ts
// Cron-safe orchestrator: runs email + social queue processors + feedback metrics.
// Requires header: x-cron-secret matching env var CRON_SECRET.

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function unauthorized(message = "Unauthorized") {
  return json({ success: false, error: message }, 401);
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(
      { success: false, error: "Method not allowed. Use POST." },
      405
    );
  }

  // ---- CRON SECRET AUTH ----
  const provided = req.headers.get("x-cron-secret") ?? "";
  const expected = Deno.env.get("CRON_SECRET") ?? "";
  if (!expected) {
    // Safety: if secret not configured, do NOT allow runs.
    return unauthorized("CRON_SECRET is not set in environment variables.");
  }
  if (!provided || provided !== expected) {
    return unauthorized("Invalid or missing x-cron-secret header.");
  }

  // ---- SUPABASE CLIENT ----
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceKey) {
    return json(
      {
        success: false,
        error:
          "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.",
      },
      500
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const ranAt = new Date().toISOString();

  console.log(`[automation-runner] start: ${ranAt}`);

  // ---- INVOKE EXISTING PROCESSORS ----
  // NOTE: These functions already exist in your repo per audit.
  // - email-processor should process email_queue (Resend)
  // - posting-processor should process social_media_posting_queue
  // Keep bodies minimal; adjust only if your existing functions require different payloads.
  let emailResult: unknown = null;
  let postingResult: unknown = null;
  let followupResult: unknown = null;
  let feedbackResult: unknown = null;

  try {
    const { data, error } = await supabase.functions.invoke("email-processor", {
      body: { action: "process_queue", max_emails: 50 },
    });
    if (error) throw error;
    emailResult = data ?? { ok: true };
    console.log("[automation-runner] email-processor OK");
  } catch (e) {
    console.error("[automation-runner] email-processor ERROR:", e);
    emailResult = { ok: false, error: String(e) };
  }

  try {
    const { data, error } = await supabase.functions.invoke("posting-processor", {
      body: {}, // posting-processor usually reads queue internally
    });
    if (error) throw error;
    postingResult = data ?? { ok: true };
    console.log("[automation-runner] posting-processor OK");
  } catch (e) {
    console.error("[automation-runner] posting-processor ERROR:", e);
    postingResult = { ok: false, error: String(e) };
  }

  // ---- PROCESS FOLLOWUP SEQUENCES ----
  try {
    followupResult = await processFollowupEnrollments(supabase);
    console.log("[automation-runner] followup-processor OK");
  } catch (e) {
    console.error("[automation-runner] followup-processor ERROR:", e);
    followupResult = { ok: false, error: String(e) };
  }

  // ---- RIVEN FEEDBACK METRICS AGGREGATION ----
  try {
    feedbackResult = await aggregateFeedbackMetrics(supabase);
    console.log("[automation-runner] feedback-metrics OK");
  } catch (e) {
    console.error("[automation-runner] feedback-metrics ERROR:", e);
    feedbackResult = { ok: false, error: String(e) };
  }

  console.log(`[automation-runner] end: ${new Date().toISOString()}`);

  return json({
    success: true,
    ran_at: ranAt,
    email_processor: emailResult,
    posting_processor: postingResult,
    followups: followupResult,
    feedback: feedbackResult,
  });
});

// ============================================================================
// RIVEN FEEDBACK METRICS AGGREGATION
// ============================================================================
async function aggregateFeedbackMetrics(supabase: ReturnType<typeof createClient>) {
  const now = new Date();
  const metricDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const last14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last21d = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString();

  let campaignsUpdated = 0;
  let leadsUpdated = 0;

  // ---- 1. AGGREGATE EMAIL QUEUE (last 24h) ----
  const { data: emailData } = await supabase
    .from('email_queue')
    .select('id, campaign_id, status, sent_at, updated_at, recipient_email')
    .or(`sent_at.gte.${last24h},updated_at.gte.${last24h}`);

  // Group by campaign_id
  const emailByCampaign: Record<string, { sent: number; failed: number; emails: string[] }> = {};
  for (const email of emailData || []) {
    const campaignId = email.campaign_id || 'unknown';
    if (!emailByCampaign[campaignId]) {
      emailByCampaign[campaignId] = { sent: 0, failed: 0, emails: [] };
    }
    if (email.status === 'sent') {
      emailByCampaign[campaignId].sent++;
      if (email.recipient_email) {
        emailByCampaign[campaignId].emails.push(email.recipient_email.toLowerCase());
      }
    }
    if (email.status === 'failed') {
      emailByCampaign[campaignId].failed++;
    }
  }

  // ---- 2. AGGREGATE REPLIES FROM UNIFIED_MESSAGES (inbound, last 24h) ----
  // Get leads with their emails to match replies
  const { data: leadsData } = await supabase
    .from('leads')
    .select('id, email, metadata, user_id');

  const leadEmailMap = new Map<string, { id: string; metadata: any; user_id: string }>();
  for (const lead of leadsData || []) {
    if (lead.email) {
      leadEmailMap.set(lead.email.toLowerCase(), { 
        id: lead.id, 
        metadata: lead.metadata || {},
        user_id: lead.user_id
      });
    }
  }

  // Get inbound messages from unified_messages
  const { data: inboundMessages } = await supabase
    .from('unified_messages')
    .select('id, conversation_id, sender_email, created_at, direction')
    .eq('direction', 'inbound')
    .gte('created_at', last24h);

  // Match replies to leads and campaigns
  const repliesByCampaign: Record<string, number> = {};
  const repliedLeads = new Map<string, { replyAt: string }>();

  for (const msg of inboundMessages || []) {
    if (msg.sender_email) {
      const senderEmail = msg.sender_email.toLowerCase();
      const lead = leadEmailMap.get(senderEmail);
      if (lead) {
        // Determine campaign from lead metadata
        const metadata = lead.metadata || {};
        const campaignId = metadata.last_campaign_id || metadata.outreach_campaign || metadata.outreach_source || 'unknown';
        repliesByCampaign[campaignId] = (repliesByCampaign[campaignId] || 0) + 1;
        repliedLeads.set(lead.id, { replyAt: msg.created_at });
      }
    }
  }

  // ---- 3. AGGREGATE SOCIAL POSTS (last 24h) ----
  const { data: socialData } = await supabase
    .from('social_media_posting_queue')
    .select('id, campaign_id, status, posted_at, updated_at')
    .or(`posted_at.gte.${last24h},updated_at.gte.${last24h}`);

  const socialByCampaign: Record<string, { posted: number; failed: number }> = {};
  for (const post of socialData || []) {
    const campaignId = post.campaign_id || 'riven_social';
    if (!socialByCampaign[campaignId]) {
      socialByCampaign[campaignId] = { posted: 0, failed: 0 };
    }
    if (post.status === 'posted' || post.status === 'published') {
      socialByCampaign[campaignId].posted++;
    }
    if (post.status === 'failed') {
      socialByCampaign[campaignId].failed++;
    }
  }

  // ---- 4. UPSERT INTO riven_campaign_metrics_daily ----
  const allCampaignIds = new Set([
    ...Object.keys(emailByCampaign),
    ...Object.keys(repliesByCampaign),
    ...Object.keys(socialByCampaign)
  ]);

  for (const campaignId of allCampaignIds) {
    const emailsSent = emailByCampaign[campaignId]?.sent || 0;
    const emailsFailed = emailByCampaign[campaignId]?.failed || 0;
    const repliesReceived = repliesByCampaign[campaignId] || 0;
    const replyRate = emailsSent > 0 ? repliesReceived / emailsSent : 0;
    const socialPosted = socialByCampaign[campaignId]?.posted || 0;
    const socialFailed = socialByCampaign[campaignId]?.failed || 0;

    const { error: upsertError } = await supabase
      .from('riven_campaign_metrics_daily')
      .upsert({
        metric_date: metricDate,
        campaign_id: campaignId,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        replies_received: repliesReceived,
        reply_rate: replyRate,
        social_posts_posted: socialPosted,
        social_posts_failed: socialFailed
      }, { onConflict: 'metric_date,campaign_id' });

    if (!upsertError) {
      campaignsUpdated++;
    }
  }

  // ---- 5. UPDATE LEAD ENGAGEMENT ----
  // Get emails sent in last 30 days
  const { data: recentEmails } = await supabase
    .from('email_queue')
    .select('recipient_email, campaign_id, sent_at')
    .eq('status', 'sent')
    .gte('sent_at', last30d)
    .order('sent_at', { ascending: false });

  // Build map of lead email -> latest touch
  const leadTouchMap = new Map<string, { touchAt: string; campaignId: string }>();
  for (const email of recentEmails || []) {
    if (email.recipient_email) {
      const key = email.recipient_email.toLowerCase();
      if (!leadTouchMap.has(key) || email.sent_at > leadTouchMap.get(key)!.touchAt) {
        leadTouchMap.set(key, { 
          touchAt: email.sent_at, 
          campaignId: email.campaign_id || 'unknown'
        });
      }
    }
  }

  // Update riven_lead_engagement and lead intent
  for (const lead of leadsData || []) {
    if (!lead.email) continue;

    const emailLower = lead.email.toLowerCase();
    const touch = leadTouchMap.get(emailLower);
    const reply = repliedLeads.get(lead.id);
    const metadata = lead.metadata || {};

    // Skip if do_not_contact is set
    if (metadata.do_not_contact === true) continue;

    // Only adjust for leads from lead_intelligence or with outreach_source
    const canAdjust = metadata.created_via === 'lead_intelligence' || metadata.outreach_source;

    // Upsert engagement record
    if (touch || reply) {
      const { data: existingEngagement } = await supabase
        .from('riven_lead_engagement')
        .select('total_replies, last_touch_at, last_reply_at')
        .eq('lead_id', lead.id)
        .single();

      const currentReplies = existingEngagement?.total_replies || 0;
      const newTotalReplies = reply ? currentReplies + 1 : currentReplies;
      
      const engagementUpdate: any = {
        lead_id: lead.id,
        updated_at: now.toISOString()
      };

      if (touch) {
        const existingTouch = existingEngagement?.last_touch_at;
        if (!existingTouch || touch.touchAt > existingTouch) {
          engagementUpdate.last_touch_at = touch.touchAt;
          engagementUpdate.last_campaign_id = touch.campaignId;
        }
      }

      if (reply) {
        engagementUpdate.last_reply_at = reply.replyAt;
        engagementUpdate.total_replies = newTotalReplies;
      }

      await supabase
        .from('riven_lead_engagement')
        .upsert(engagementUpdate, { onConflict: 'lead_id' });

      // ---- 6. AUTO INTENT ADJUSTMENT ----
      if (canAdjust) {
        const newMetadata = { ...metadata };
        let shouldUpdate = false;

        // If lead has reply in last 14 days: hot + high priority
        if (reply || (existingEngagement?.last_reply_at && existingEngagement.last_reply_at >= last14d)) {
          if (newMetadata.intent !== 'hot') {
            newMetadata.intent = 'hot';
            newMetadata.priority = 'high';
            shouldUpdate = true;
          }
        } else if (touch) {
          const touchDate = new Date(touch.touchAt);
          const daysSinceTouch = (now.getTime() - touchDate.getTime()) / (1000 * 60 * 60 * 24);
          
          // No reply for 21+ days: cold + low priority
          if (daysSinceTouch >= 21) {
            if (newMetadata.intent !== 'cold') {
              newMetadata.intent = 'cold';
              newMetadata.priority = 'low';
              shouldUpdate = true;
            }
          }
          // No reply for 7+ days but less than 21: warm (unless already hot)
          else if (daysSinceTouch >= 7 && newMetadata.intent !== 'hot') {
            if (newMetadata.intent !== 'warm') {
              newMetadata.intent = 'warm';
              shouldUpdate = true;
            }
          }
        }

        // Update last_campaign_id in metadata
        if (touch && newMetadata.last_campaign_id !== touch.campaignId) {
          newMetadata.last_campaign_id = touch.campaignId;
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          await supabase
            .from('leads')
            .update({ metadata: newMetadata })
            .eq('id', lead.id);
          leadsUpdated++;
        }
      }
    }
  }

  console.log(`[feedback-metrics] Done: metric_date=${metricDate}, campaigns=${campaignsUpdated}, leads=${leadsUpdated}`);

  return {
    ok: true,
    metric_date: metricDate,
    campaigns_updated: campaignsUpdated,
    leads_updated: leadsUpdated
  };
}

// Process due followup enrollments
async function processFollowupEnrollments(supabase: ReturnType<typeof createClient>) {
  const now = new Date().toISOString();
  let processed = 0;
  let queued = 0;
  let failed = 0;
  let completed = 0;
  let skipped = 0;

  // Fetch due enrollments (active, next_send_at <= now, limit 50)
  const { data: enrollments, error: fetchError } = await supabase
    .from('followup_enrollments')
    .select(`
      id,
      sequence_id,
      lead_id,
      current_step,
      leads!inner (
        id,
        email,
        status,
        metadata
      )
    `)
    .eq('status', 'active')
    .lte('next_send_at', now)
    .limit(50);

  if (fetchError) {
    console.error('[followup] Fetch error:', fetchError);
    return { ok: false, error: fetchError.message };
  }

  if (!enrollments || enrollments.length === 0) {
    console.log('[followup] No due enrollments');
    return { ok: true, processed: 0, queued: 0, failed: 0, completed: 0, skipped: 0 };
  }

  console.log(`[followup] Processing ${enrollments.length} due enrollments`);

  for (const enrollment of enrollments) {
    processed++;
    
    try {
      const lead = enrollment.leads as any;
      
      // Skip if no email
      if (!lead?.email) {
        console.log(`[followup] Skipping enrollment ${enrollment.id}: no email`);
        skipped++;
        continue;
      }

      // Skip if lead status is contacted or has outreach_source (manual contact)
      const metadata = lead.metadata || {};
      if (lead.status === 'contacted' || metadata.outreach_source || metadata.do_not_contact) {
        console.log(`[followup] Skipping enrollment ${enrollment.id}: already contacted or do_not_contact`);
        
        // Mark as completed to stop sequence
        await supabase
          .from('followup_enrollments')
          .update({ status: 'completed' })
          .eq('id', enrollment.id);
        
        skipped++;
        completed++;
        continue;
      }

      // Get current step template
      const { data: step, error: stepError } = await supabase
        .from('followup_steps')
        .select('*')
        .eq('sequence_id', enrollment.sequence_id)
        .eq('step_order', enrollment.current_step)
        .single();

      if (stepError || !step) {
        // No more steps - mark as completed
        console.log(`[followup] No step ${enrollment.current_step} for sequence, marking completed`);
        await supabase
          .from('followup_enrollments')
          .update({ status: 'completed' })
          .eq('id', enrollment.id);
        completed++;
        continue;
      }

      // Render templates with lead data
      const name = metadata.name || 'there';
      const company = metadata.company || 'your organisation';
      const role = metadata.role || '';
      const email = lead.email;

      const subject = step.subject_template
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{company\}\}/g, company)
        .replace(/\{\{role\}\}/g, role)
        .replace(/\{\{email\}\}/g, email);

      const body = step.body_template
        .replace(/\{\{name\}\}/g, name)
        .replace(/\{\{company\}\}/g, company)
        .replace(/\{\{role\}\}/g, role)
        .replace(/\{\{email\}\}/g, email);

      // Queue email
      const { data: queuedEmail, error: queueError } = await supabase
        .from('email_queue')
        .insert({
          recipient_email: email,
          subject: subject,
          body: body,
          campaign_id: null,
          status: 'pending',
          priority: 5,
          scheduled_at: now
        })
        .select('id')
        .single();

      if (queueError) {
        console.error(`[followup] Queue error for enrollment ${enrollment.id}:`, queueError);
        
        // Log failure
        await supabase
          .from('followup_send_log')
          .insert({
            enrollment_id: enrollment.id,
            step_order: enrollment.current_step,
            status: 'failed',
            error_message: queueError.message
          });
        
        failed++;
        continue;
      }

      // Log success
      await supabase
        .from('followup_send_log')
        .insert({
          enrollment_id: enrollment.id,
          step_order: enrollment.current_step,
          queued_email_id: queuedEmail?.id || null,
          status: 'queued'
        });

      queued++;

      // Get next step to determine delay
      const { data: nextStep } = await supabase
        .from('followup_steps')
        .select('delay_minutes')
        .eq('sequence_id', enrollment.sequence_id)
        .eq('step_order', enrollment.current_step + 1)
        .single();

      if (nextStep) {
        // Calculate next send time
        const nextSendAt = new Date();
        nextSendAt.setMinutes(nextSendAt.getMinutes() + nextStep.delay_minutes);

        await supabase
          .from('followup_enrollments')
          .update({
            current_step: enrollment.current_step + 1,
            last_sent_at: now,
            next_send_at: nextSendAt.toISOString()
          })
          .eq('id', enrollment.id);
      } else {
        // No more steps - mark as completed
        await supabase
          .from('followup_enrollments')
          .update({
            status: 'completed',
            last_sent_at: now
          })
          .eq('id', enrollment.id);
        completed++;
      }

    } catch (err) {
      console.error(`[followup] Error processing enrollment ${enrollment.id}:`, err);
      failed++;
    }
  }

  console.log(`[followup] Done: processed=${processed}, queued=${queued}, failed=${failed}, completed=${completed}, skipped=${skipped}`);

  return { ok: true, processed, queued, failed, completed, skipped };
}
