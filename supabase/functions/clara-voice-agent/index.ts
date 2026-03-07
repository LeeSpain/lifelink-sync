// Clara AI Voice Agent - Emergency Conference Coordinator
// Integrates OpenAI Realtime API with Twilio Media Streams

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClaraAgentRequest {
  conferenceId: string;
  conferenceName: string;
  userName: string;
  location: string;
  emergencyType?: string;
  userId?: string; // For timeline context lookup
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

async function getClaraSystemPrompt(
  userName: string,
  location: string,
  emergencyType: string,
  contactContext?: any
) {
  // Build context-aware prompt with customer history
  let contextSection = "";

  if (contactContext) {
    contextSection = `\n**CUSTOMER HISTORY & CONTEXT:**
${contactContext.full_context || "No previous history"}

Key Facts:
${contactContext.key_facts?.map((fact: string) => `- ${fact}`).join("\n") || "- First-time emergency"}

Recent Events: ${contactContext.recent_events_summary || "None"}

Previous Emergencies: ${contactContext.risk_indicators?.last_emergency_at
  ? `Last emergency was on ${new Date(contactContext.risk_indicators.last_emergency_at).toLocaleDateString()}`
  : "No previous emergencies"
}

⚠️ USE THIS CONTEXT: Reference past interactions naturally during the call. If this is a repeat emergency, mention it. If they've had good experiences, build on that trust.
`;
  }

  return `You are Clara, an AI emergency coordinator for LifeLink Sync. You are joining an emergency conference call.

**SITUATION:**
- ${userName} has triggered an emergency SOS alert
- Location: ${location}
- Emergency type: ${emergencyType}
- You are coordinating response between ${userName} and their emergency contacts
${contextSection}
**YOUR ROLE:**
1. Greet responders professionally and calmly as they join
2. Provide critical information: who, where, what happened
3. Reference past interactions if available (e.g., "I see you've helped ${userName} before")
4. Ask each responder: "Can you reach ${userName}? How long will it take you?"
5. Capture their confirmation and ETA
6. Share updates with all participants: "David is 10 minutes away and confirmed"
7. Keep everyone informed and coordinated
8. Offer to connect to emergency services (911/112) if needed

**COMMUNICATION STYLE:**
- Calm, clear, and professional
- Concise and direct (emergency situation)
- Use responder's name when speaking to them
- Reference past interactions naturally to build trust
- Provide specific, actionable information
- Stay on the line until emergency is resolved

**KEY PHRASES:**
- Opening: "Hello, this is Clara, the LifeLink Sync AI coordinator. ${userName} has triggered an emergency alert at ${location}."
- With context: "I see this is ${userName}'s [first/second] emergency with us. [Additional context]"
- To each responder: "[Name], can you reach ${userName}? How long will it take you to get there?"
- Status update: "[Name] is [X] minutes away and has confirmed they can assist."
- Escalation: "Would anyone like me to connect you to emergency services?"

**CRITICAL RULES:**
- Never leave the call until the emergency is resolved
- Always confirm what you heard: "I understand you're 15 minutes away, is that correct?"
- If no one can reach the user, immediately offer to call emergency services
- Use customer history to personalize the experience and build trust
- Stay calm and reassuring throughout

Remember: This is a real emergency. Lives may depend on your coordination. Use the customer history to provide better, more personalized emergency coordination.`;
}

async function addClaraToConference(
  conferenceName: string,
  twilioFromNumber: string,
  twilio: any,
  claraPrompt: string
) {
  // Generate TwiML that connects to conference with Media Streams
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Clara AI coordinator joining emergency conference.</Say>
  <Connect>
    <Stream url="wss://${Deno.env.get("SUPABASE_URL")?.replace('https://', '')}/functions/v1/clara-media-stream">
      <Parameter name="conferenceName" value="${conferenceName}" />
      <Parameter name="systemPrompt" value="${encodeURIComponent(claraPrompt)}" />
    </Stream>
  </Connect>
  <Dial>
    <Conference
      statusCallback="${Deno.env.get("SUPABASE_URL")}/functions/v1/conference-status"
      statusCallbackEvent="start,end,join,leave"
      beep="false"
      startConferenceOnEnter="false"
    >${conferenceName}</Conference>
  </Dial>
</Response>`;

  // Make outbound call for Clara (to a dummy number that redirects to conference)
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${twilio.auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: twilioFromNumber, // Call ourselves
        From: twilioFromNumber,
        Twiml: twiml,
        StatusCallback: `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-status-webhook`,
        StatusCallbackEvent: "initiated,answered,completed",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add Clara to conference: ${error}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();
    const body = await req.json() as ClaraAgentRequest;

    console.log("🤖 Initializing Clara AI for conference:", body.conferenceName);

    // Get conference details
    const { data: conference, error: confError } = await supabase
      .from("emergency_conferences")
      .select("*")
      .eq("id", body.conferenceId)
      .single();

    if (confError || !conference) {
      throw new Error("Conference not found");
    }

    // Fetch customer context from timeline for personalized coordination
    let contactContext = null;
    if (body.userId) {
      console.log("📊 Fetching timeline context for user:", body.userId);
      try {
        const { data: context } = await supabase
          .rpc("get_contact_ai_context", {
            p_user_id: body.userId,
            p_contact_email: null,
          });

        if (context && context.length > 0) {
          contactContext = context[0];
          console.log("✅ Timeline context loaded:", {
            totalInteractions: contactContext.engagement_metrics?.total_interactions,
            leadScore: contactContext.engagement_metrics?.lead_score,
            riskLevel: contactContext.risk_indicators?.risk_level,
          });
        }
      } catch (err) {
        console.error("⚠️  Failed to fetch timeline context:", err);
        // Continue anyway - Clara can still work without context
      }
    }

    // Generate Clara's system prompt with customer context
    const claraPrompt = await getClaraSystemPrompt(
      body.userName,
      body.location,
      body.emergencyType || "unspecified emergency",
      contactContext
    );

    // Get Twilio credentials
    const twilio = getTwilioClient();
    const FROM_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!FROM_NUMBER) {
      throw new Error("Twilio phone number not configured");
    }

    // Add Clara to the conference
    console.log("📞 Adding Clara to conference...");

    const claraCall = await addClaraToConference(
      body.conferenceName,
      FROM_NUMBER,
      twilio,
      claraPrompt
    );

    console.log("✅ Clara call initiated:", claraCall.sid);

    // Record Clara as a participant
    const { data: participant, error: partError } = await supabase
      .from("conference_participants")
      .insert({
        conference_id: body.conferenceId,
        participant_type: "ai_agent",
        call_sid: claraCall.sid,
        participant_name: "Clara (AI Coordinator)",
        status: "calling",
        metadata: {
          ai_model: "openai-realtime",
          prompt_version: "1.0",
        },
      })
      .select()
      .single();

    if (partError) {
      console.error("Failed to record Clara participant:", partError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        clara: {
          callSid: claraCall.sid,
          participantId: participant?.id,
          status: "joining",
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Clara agent error:", error);
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
