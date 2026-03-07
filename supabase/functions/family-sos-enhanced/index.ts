import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ENHANCED-SOS] ${step}${detailsStr}`);
};

interface SOSRequest {
  location: {
    lat: number;
    lng: number;
    accuracy?: number;
    address?: string;
  };
  user_profile: {
    first_name: string;
    last_name: string;
    phone?: string;
    emergency_contacts?: any[];
  };
  metadata?: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Enhanced SOS triggered");

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

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { location, user_profile, metadata }: SOSRequest = await req.json();

    // 1. Create SOS event
    const { data: familyGroup } = await supabaseService
      .from('family_groups')
      .select('*')
      .eq('owner_user_id', user.id)
      .single();

    const { data: sosEvent, error: sosError } = await supabaseService
      .from('sos_events')
      .insert([{
        user_id: user.id,
        group_id: familyGroup?.id || null,
        status: 'active',
        trigger_location: location,
        address: location.address,
        metadata: metadata || {}
      }])
      .select()
      .single();

    if (sosError) throw new Error(`Failed to create SOS event: ${sosError.message}`);
    logStep("SOS event created", { eventId: sosEvent.id });

    // 2. Store initial location
    const { error: locationError } = await supabaseService
      .from('sos_locations')
      .insert([{
        event_id: sosEvent.id,
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        address: location.address
      }]);

    if (locationError) {
      logStep("Warning: Could not store initial location", { error: locationError.message });
    }

    // 3. Get emergency contacts and family members
    const { data: emergencyContacts } = await supabaseService
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true });

    logStep("Retrieved emergency contacts", { count: emergencyContacts?.length || 0 });

    // 4. Get active family members
    let familyMembers: any[] = [];
    if (familyGroup) {
      const { data: members } = await supabaseService
        .from('family_memberships')
        .select(`
          *,
          profiles!inner(first_name, last_name, user_id)
        `)
        .eq('group_id', familyGroup.id)
        .eq('status', 'active');

      familyMembers = members || [];
      logStep("Retrieved family members", { count: familyMembers.length });
    }

    // 5. Send family alerts first (real-time)
    if (familyMembers.length > 0) {
      try {
        const { data: alertData, error: alertError } = await supabaseService.functions.invoke('family-sos-alerts', {
          body: {
            event_id: sosEvent.id,
            family_members: familyMembers,
            location: location,
            user_profile: user_profile
          }
        });

        if (alertError) {
          logStep("Warning: Family alerts failed", { error: alertError.message });
        } else {
          logStep("Family alerts sent successfully", { alertsSent: alertData?.alerts_sent || 0 });
        }
      } catch (error) {
        logStep("Error sending family alerts", { error: error.message });
      }
    }

    // 6. Start call-only sequence for non-family contacts
    const callOnlyContacts = emergencyContacts?.filter(c => c.type === 'call_only') || [];
    
    if (callOnlyContacts.length > 0) {
      try {
        const { data: callData, error: callError } = await supabaseService.functions.invoke('emergency-call-sequence', {
          body: {
            event_id: sosEvent.id,
            contacts: callOnlyContacts,
            user_profile: user_profile,
            location: location
          }
        });

        if (callError) {
          logStep("Warning: Call sequence failed", { error: callError.message });
        } else {
          logStep("Call sequence initiated", { callsScheduled: callData?.calls_scheduled || 0 });
        }
      } catch (error) {
        logStep("Error starting call sequence", { error: error.message });
      }
    }

    // 7. Send email notifications to all contacts
    const allContacts = emergencyContacts || [];
    if (allContacts.length > 0) {
      try {
        const { data: emailData, error: emailError } = await supabaseService.functions.invoke('emergency-email-notifications', {
          body: {
            event_id: sosEvent.id,
            contacts: allContacts,
            user_profile: user_profile,
            location: location
          }
        });

        if (emailError) {
          logStep("Warning: Email notifications failed", { error: emailError.message });
        } else {
          logStep("Email notifications sent", { emailsSent: emailData?.emails_sent || 0 });
        }
      } catch (error) {
        logStep("Error sending email notifications", { error: error.message });
      }
    }

    // 8. Return response
    return new Response(JSON.stringify({
      success: true,
      event_id: sosEvent.id,
      family_alerts_sent: familyMembers.length,
      call_only_contacts: callOnlyContacts.length,
      email_notifications: allContacts.length,
      real_time_enabled: familyMembers.length > 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in enhanced SOS", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});