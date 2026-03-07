// Instant Voice Callback System
// Connects leads with sales reps within 60 seconds

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CallbackRequest {
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  callbackReason?: string;
  urgency?: 'low' | 'normal' | 'high' | 'urgent';
  sourcePage?: string;
  sourceCampaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  userId?: string;
}

function getSupabaseClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

function getTwilioClient() {
  const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");

  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    throw new Error("Twilio credentials not configured");
  }

  return {
    accountSid: ACCOUNT_SID,
    authToken: AUTH_TOKEN,
    auth: btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`)
  };
}

async function fetchCustomerContext(supabase: any, userId?: string, email?: string) {
  if (!userId && !email) return null;

  try {
    // Get timeline context
    const { data: context } = await supabase
      .rpc("get_contact_ai_context", {
        p_user_id: userId || null,
        p_contact_email: email || null,
      });

    if (context && context.length > 0) {
      return {
        fullContext: context[0].context_summary,
        leadScore: context[0].engagement_metrics?.lead_score || 0,
        totalInteractions: context[0].engagement_metrics?.total_interactions || 0,
        riskLevel: context[0].risk_indicators?.risk_level || 'none',
        recentEvents: context[0].recent_events || [],
      };
    }
  } catch (err) {
    console.error("Failed to fetch customer context:", err);
  }

  return null;
}

async function findAvailableRep(supabase: any) {
  // Find online sales rep with capacity
  const { data: availableReps } = await supabase
    .from("sales_rep_availability")
    .select("user_id, current_call_count, max_concurrent_calls")
    .eq("status", "online")
    .lt("current_call_count", "max_concurrent_calls")
    .order("current_call_count", { ascending: true })
    .limit(1);

  if (availableReps && availableReps.length > 0) {
    return availableReps[0].user_id;
  }

  return null;
}

function calculatePriority(urgency: string, leadScore: number): number {
  // Priority: 0-100 (higher = more urgent)
  const urgencyScores = {
    urgent: 90,
    high: 70,
    normal: 50,
    low: 30,
  };

  const baseScore = urgencyScores[urgency as keyof typeof urgencyScores] || 50;
  const leadBonus = Math.min(leadScore / 2, 20); // Max 20 points from lead score

  return Math.min(baseScore + leadBonus, 100);
}

async function initiateCallback(
  supabase: any,
  twilio: any,
  callbackId: string,
  customerPhone: string,
  repPhone: string,
  customerName: string,
  customerContext: any
) {
  const FROM_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!FROM_NUMBER) {
    throw new Error("Twilio phone number not configured");
  }

  // Create TwiML that calls the customer and the rep simultaneously (conference bridge)
  const conferenceName = `callback-${callbackId}`;

  // First, call the sales rep
  console.log("📞 Calling sales rep at:", repPhone);

  const repTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    You have a new callback request from ${customerName}.
    ${customerContext?.leadScore ? `Lead score: ${customerContext.leadScore}.` : ''}
    Connecting you now.
  </Say>
  <Dial>
    <Conference
      statusCallback="${Deno.env.get("SUPABASE_URL")}/functions/v1/callback-status"
      statusCallbackEvent="start,end,join,leave"
      beep="false"
      startConferenceOnEnter="true"
      endConferenceOnExit="true"
    >${conferenceName}</Conference>
  </Dial>
</Response>`;

  const repCall = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${twilio.auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: repPhone,
        From: FROM_NUMBER,
        Twiml: repTwiml,
        StatusCallback: `${Deno.env.get("SUPABASE_URL")}/functions/v1/callback-status`,
        StatusCallbackEvent: "initiated,ringing,answered,completed",
      }),
    }
  );

  if (!repCall.ok) {
    const error = await repCall.text();
    throw new Error(`Failed to call rep: ${error}`);
  }

  const repCallData = await repCall.json();

  // Small delay to let rep answer first
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Then call the customer
  console.log("📞 Calling customer at:", customerPhone);

  const customerTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hello, this is LifeLink Sync returning your callback request.
    Please hold while we connect you with a specialist.
  </Say>
  <Dial>
    <Conference
      statusCallback="${Deno.env.get("SUPABASE_URL")}/functions/v1/callback-status"
      statusCallbackEvent="start,end,join,leave"
      beep="false"
      startConferenceOnEnter="false"
    >${conferenceName}</Conference>
  </Dial>
</Response>`;

  const customerCall = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${twilio.auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: customerPhone,
        From: FROM_NUMBER,
        Twiml: customerTwiml,
        StatusCallback: `${Deno.env.get("SUPABASE_URL")}/functions/v1/callback-status`,
        StatusCallbackEvent: "initiated,ringing,answered,completed",
      }),
    }
  );

  if (!customerCall.ok) {
    const error = await customerCall.text();
    throw new Error(`Failed to call customer: ${error}`);
  }

  const customerCallData = await customerCall.json();

  // Update callback request with call SIDs
  await supabase
    .from("callback_requests")
    .update({
      status: "calling",
      call_sid: customerCallData.sid,
      call_initiated_at: new Date().toISOString(),
      metadata: {
        rep_call_sid: repCallData.sid,
        customer_call_sid: customerCallData.sid,
        conference_name: conferenceName,
      },
    })
    .eq("id", callbackId);

  return {
    repCallSid: repCallData.sid,
    customerCallSid: customerCallData.sid,
    conferenceName,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    // Handle different actions
    switch (action) {
      case "request": {
        // New callback request
        if (req.method !== "POST") {
          throw new Error("Method not allowed");
        }

        const body = await req.json() as CallbackRequest;

        console.log("📞 New callback request from:", body.contactName);

        // Fetch customer context
        const customerContext = await fetchCustomerContext(
          supabase,
          body.userId,
          body.contactEmail
        );

        // Calculate priority
        const priority = calculatePriority(
          body.urgency || 'normal',
          customerContext?.leadScore || 0
        );

        // Create callback request
        const { data: request, error: requestError } = await supabase
          .from("callback_requests")
          .insert({
            contact_name: body.contactName,
            contact_phone: body.contactPhone,
            contact_email: body.contactEmail,
            callback_reason: body.callbackReason || 'sales_inquiry',
            urgency: body.urgency || 'normal',
            source_page: body.sourcePage,
            source_campaign: body.sourceCampaign,
            utm_source: body.utmSource,
            utm_medium: body.utmMedium,
            utm_campaign: body.utmCampaign,
            user_id: body.userId,
            customer_context: customerContext || {},
            status: 'pending',
          })
          .select()
          .single();

        if (requestError || !request) {
          throw new Error(`Failed to create callback request: ${requestError?.message}`);
        }

        console.log("✅ Callback request created:", request.id);

        // Find available rep
        const availableRep = await findAvailableRep(supabase);

        // Add to queue
        const targetCallTime = new Date();
        targetCallTime.setSeconds(targetCallTime.getSeconds() + 60); // 60 second SLA

        const { data: queueEntry } = await supabase
          .from("callback_queue")
          .insert({
            callback_request_id: request.id,
            priority,
            assigned_to: availableRep,
            target_call_time: targetCallTime.toISOString(),
            status: availableRep ? 'assigned' : 'queued',
          })
          .select()
          .single();

        console.log("✅ Added to callback queue with priority:", priority);

        // If rep available, initiate call immediately
        if (availableRep) {
          console.log("✅ Rep available, initiating immediate callback");

          // Get rep's phone number
          const { data: repProfile } = await supabase
            .from("profiles")
            .select("phone")
            .eq("user_id", availableRep)
            .single();

          if (repProfile?.phone) {
            const twilio = getTwilioClient();

            try {
              const callDetails = await initiateCallback(
                supabase,
                twilio,
                request.id,
                body.contactPhone,
                repProfile.phone,
                body.contactName,
                customerContext
              );

              // Update queue status
              await supabase
                .from("callback_queue")
                .update({ status: 'completed' })
                .eq("id", queueEntry.id);

              // Add to timeline
              await fetch(
                `${Deno.env.get("SUPABASE_URL")}/functions/v1/timeline-aggregator`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  },
                  body: JSON.stringify({
                    action: "add_event",
                    event: {
                      userId: body.userId,
                      contactEmail: body.contactEmail,
                      contactPhone: body.contactPhone,
                      contactName: body.contactName,
                      eventType: "voice_call",
                      eventCategory: "sales",
                      eventTitle: "Instant callback initiated",
                      eventDescription: `Callback for ${body.callbackReason || 'sales inquiry'}`,
                      sentiment: "positive",
                      importanceScore: 2,
                    },
                  }),
                }
              );

              return new Response(
                JSON.stringify({
                  success: true,
                  request: {
                    id: request.id,
                    status: 'calling',
                    estimatedCallTime: 'within 60 seconds',
                    callInitiated: true,
                  },
                  callDetails,
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            } catch (callError) {
              console.error("❌ Failed to initiate immediate callback:", callError);
              // Fall through to queued response
            }
          }
        }

        // Return queued response
        return new Response(
          JSON.stringify({
            success: true,
            request: {
              id: request.id,
              status: 'queued',
              estimatedCallTime: 'within 5 minutes',
              priority,
              queuePosition: 1, // Simplified - could calculate actual position
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "process-queue": {
        // Process queued callbacks (called by cron or manually)
        const { data: queuedCallbacks } = await supabase
          .from("callback_queue")
          .select(`
            *,
            callback_request:callback_requests(*)
          `)
          .eq("status", "queued")
          .order("priority", { ascending: false })
          .limit(10);

        if (!queuedCallbacks || queuedCallbacks.length === 0) {
          return new Response(
            JSON.stringify({ success: true, message: "No callbacks in queue" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const processedCount = 0;
        // Process queue...

        return new Response(
          JSON.stringify({
            success: true,
            processed: processedCount,
            remaining: queuedCallbacks.length - processedCount,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("❌ Instant callback error:", error);
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
