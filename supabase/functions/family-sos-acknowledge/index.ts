import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SOS-ACKNOWLEDGE] ${step}${detailsStr}`);
};

interface AcknowledgeRequest {
  event_id: string;
  message?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Processing SOS acknowledgement");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { event_id, message }: AcknowledgeRequest = await req.json();

    logStep("User acknowledging SOS", { userId: user.id, eventId: event_id, message });

    // 1. Verify the user is a family member for this event
    const { data: sosEvent, error: eventError } = await supabaseService
      .from('sos_events')
      .select(`
        *,
        family_groups!inner(
          family_memberships!inner(user_id, status)
        )
      `)
      .eq('id', event_id)
      .eq('family_groups.family_memberships.user_id', user.id)
      .eq('family_groups.family_memberships.status', 'active')
      .single();

    if (eventError || !sosEvent) {
      throw new Error('SOS event not found or user not authorized');
    }

    if (sosEvent.status !== 'active') {
      throw new Error('SOS event is no longer active');
    }

    logStep("User verified as family member", { eventId: event_id });

    // 2. Check if user has already acknowledged
    const { data: existingAck } = await supabaseService
      .from('sos_acknowledgements')
      .select('*')
      .eq('event_id', event_id)
      .eq('family_user_id', user.id)
      .single();

    if (existingAck) {
      return new Response(JSON.stringify({
        success: true,
        message: "Already acknowledged",
        acknowledgement: existingAck
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3. Create acknowledgement
    const { data: acknowledgement, error: ackError } = await supabaseService
      .from('sos_acknowledgements')
      .insert([{
        event_id: event_id,
        family_user_id: user.id,
        message: message || "Received & On It"
      }])
      .select()
      .single();

    if (ackError) throw new Error(`Failed to create acknowledgement: ${ackError.message}`);

    logStep("Acknowledgement created", { ackId: acknowledgement.id });

    // 4. Broadcast acknowledgement to all family members
    try {
      await supabaseService.functions.invoke('realtime-family-broadcast', {
        body: {
          channel: `sos_event:${event_id}`,
          event: 'acknowledgement_received',
          payload: {
            acknowledgement_id: acknowledgement.id,
            family_user_id: user.id,
            message: acknowledgement.message,
            acknowledged_at: acknowledgement.acknowledged_at
          }
        }
      });
      logStep("Acknowledgement broadcasted to family");
    } catch (broadcastError) {
      logStep("Warning: Could not broadcast acknowledgement", { error: broadcastError });
    }

    // 5. Notify the SOS originator
    try {
      await supabaseService.functions.invoke('family-sos-alerts', {
        body: {
          event_id: event_id,
          family_members: [{ user_id: sosEvent.user_id }],
          location: sosEvent.trigger_location,
          user_profile: { first_name: "Family", last_name: "Member" },
          alert_type: 'acknowledgement',
          message: `Family member responded: ${acknowledgement.message}`
        }
      });
      logStep("Acknowledgement notification sent to SOS originator");
    } catch (notifyError) {
      logStep("Warning: Could not notify SOS originator", { error: notifyError });
    }

    // 6. Check if this acknowledgement should pause call sequence
    try {
      await supabaseService.functions.invoke('emergency-call-control', {
        body: {
          action: 'pause',
          event_id: event_id,
          reason: 'family_acknowledged'
        }
      });
      logStep("Call sequence paused due to family acknowledgement");
    } catch (pauseError) {
      logStep("Warning: Could not pause call sequence", { error: pauseError });
    }

    return new Response(JSON.stringify({
      success: true,
      acknowledgement: {
        id: acknowledgement.id,
        event_id: acknowledgement.event_id,
        message: acknowledgement.message,
        acknowledged_at: acknowledgement.acknowledged_at
      },
      call_sequence_paused: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR processing acknowledgement", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});