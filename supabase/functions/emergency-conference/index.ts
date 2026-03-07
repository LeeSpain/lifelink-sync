// LifeLink Sync Emergency Conference Bridge System
// Creates and manages live conference calls with simultaneous participant dialing

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
}

interface ConferenceRequest {
  incidentId: string;
  userId: string;
  userPhone: string;
  userName: string;
  location: string;
  locationData?: {
    latitude: number;
    longitude: number;
    address?: string;
    googleMapsLink: string;
  };
  emergencyContacts: EmergencyContact[];
  enableClara?: boolean; // Add Clara AI coordinator
}

function getSupabaseClient(req: Request) {
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

async function createConferenceRoom(conferenceName: string, twilio: any) {
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Conferences.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${twilio.auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        FriendlyName: conferenceName,
        StatusCallback: `${Deno.env.get("SUPABASE_URL")}/functions/v1/conference-status`,
        StatusCallbackMethod: "POST",
        StatusCallbackEvent: "start,end,join,leave",
        Record: "record-from-start",
        RecordingStatusCallback: `${Deno.env.get("SUPABASE_URL")}/functions/v1/conference-recording`,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create conference: ${error}`);
  }

  return await response.json();
}

async function dialParticipant(
  phone: string,
  conferenceName: string,
  participantName: string,
  participantType: string,
  twilio: any,
  fromNumber: string
) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hello ${participantName}. This is an emergency alert.
    You are being connected to an emergency conference call now.
    Please stay on the line.
  </Say>
  <Dial>
    <Conference
      statusCallback="${Deno.env.get("SUPABASE_URL")}/functions/v1/conference-status"
      statusCallbackEvent="start,end,join,leave,mute,hold"
      statusCallbackMethod="POST"
      beep="true"
      startConferenceOnEnter="${participantType === 'user' ? 'true' : 'false'}"
      endConferenceOnExit="${participantType === 'user' ? 'true' : 'false'}"
    >${conferenceName}</Conference>
  </Dial>
</Response>`;

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${twilio.auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        From: fromNumber,
        Twiml: twiml,
        StatusCallback: `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-status-webhook`,
        StatusCallbackEvent: "initiated,ringing,answered,completed",
        StatusCallbackMethod: "POST",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to dial ${phone}: ${error}`);
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

    const supabase = getSupabaseClient(req);
    const body = await req.json() as ConferenceRequest;

    console.log("🚨 Starting emergency conference for incident:", body.incidentId);

    // Get Twilio credentials
    const twilio = getTwilioClient();
    const FROM_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!FROM_NUMBER) {
      throw new Error("Twilio phone number not configured");
    }

    // Create unique conference name
    const conferenceName = `emergency-${body.incidentId}-${Date.now()}`;

    console.log("📞 Creating conference room:", conferenceName);

    // Create conference record in database
    const { data: conference, error: conferenceError } = await supabase
      .from("emergency_conferences")
      .insert({
        incident_id: body.incidentId,
        conference_name: conferenceName,
        status: "active",
        metadata: {
          location: body.location,
          location_data: body.locationData,
        },
      })
      .select()
      .single();

    if (conferenceError || !conference) {
      throw new Error(`Failed to create conference record: ${conferenceError?.message}`);
    }

    console.log("✅ Conference record created:", conference.id);

    // Dial the user FIRST (they start the conference)
    console.log("📞 Dialing user:", body.userName);

    try {
      const userCall = await dialParticipant(
        body.userPhone,
        conferenceName,
        body.userName,
        "user",
        twilio,
        FROM_NUMBER
      );

      await supabase.from("conference_participants").insert({
        conference_id: conference.id,
        participant_type: "user",
        call_sid: userCall.sid,
        phone_number: body.userPhone,
        participant_name: body.userName,
        status: "calling",
      });

      console.log("✅ User dialed:", userCall.sid);
    } catch (error) {
      console.error("❌ Failed to dial user:", error);
      // Continue anyway - try to dial contacts
    }

    // Small delay to ensure user joins first
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Dial ALL emergency contacts SIMULTANEOUSLY
    const dialPromises = body.emergencyContacts.map(async (contact) => {
      if (!contact.phone) return null;

      console.log("📞 Dialing contact:", contact.name);

      try {
        const call = await dialParticipant(
          contact.phone,
          conferenceName,
          contact.name,
          "contact",
          twilio,
          FROM_NUMBER
        );

        await supabase.from("conference_participants").insert({
          conference_id: conference.id,
          participant_type: "contact",
          call_sid: call.sid,
          phone_number: contact.phone,
          participant_name: contact.name,
          status: "calling",
        });

        console.log("✅ Contact dialed:", contact.name, call.sid);
        return { success: true, contact: contact.name, callSid: call.sid };
      } catch (error) {
        console.error("❌ Failed to dial contact:", contact.name, error);

        await supabase.from("conference_participants").insert({
          conference_id: conference.id,
          participant_type: "contact",
          phone_number: contact.phone,
          participant_name: contact.name,
          status: "failed",
          metadata: { error: String(error) },
        });

        return { success: false, contact: contact.name, error: String(error) };
      }
    });

    // Wait for all dials to complete
    const dialResults = await Promise.all(dialPromises);
    const successfulDials = dialResults.filter(r => r?.success).length;

    console.log(`✅ Conference started: ${successfulDials}/${body.emergencyContacts.length} contacts dialed`);

    // Update conference with participant count
    await supabase
      .from("emergency_conferences")
      .update({ total_participants: successfulDials + 1 }) // +1 for user
      .eq("id", conference.id);

    // Add Clara AI coordinator if enabled
    let claraStatus = null;
    if (body.enableClara !== false) { // Default to true
      console.log("🤖 Adding Clara AI coordinator...");

      try {
        const claraResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/clara-voice-agent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              conferenceId: conference.id,
              conferenceName,
              userName: body.userName,
              location: body.location,
              emergencyType: "emergency alert",
              userId: body.userId, // Pass userId for timeline context
            }),
          }
        );

        if (claraResponse.ok) {
          claraStatus = await claraResponse.json();
          console.log("✅ Clara added to conference");
        } else {
          const error = await claraResponse.text();
          console.error("❌ Failed to add Clara:", error);
        }
      } catch (error) {
        console.error("❌ Clara integration error:", error);
        // Continue anyway - core conference still works
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        conference: {
          id: conference.id,
          name: conferenceName,
          totalParticipants: successfulDials + 1,
          claraEnabled: !!claraStatus,
        },
        dialResults,
        clara: claraStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Emergency conference error:", error);
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
