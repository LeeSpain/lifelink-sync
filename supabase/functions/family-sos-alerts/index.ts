import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FAMILY-SOS-ALERTS] ${step}${detailsStr}`);
};

interface AlertRequest {
  event_id: string;
  family_members: any[];
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
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Sending family SOS alerts");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { event_id, family_members, location, user_profile }: AlertRequest = await req.json();

    logStep("Processing family alerts", { 
      eventId: event_id, 
      familyMemberCount: family_members.length,
      location: location.address 
    });

    let alertsSent = 0;
    const alertResults = [];

    // Send alerts to each family member
    for (const member of family_members) {
      try {
        logStep("Sending alert to family member", { 
          memberId: member.user_id,
          memberName: `${member.profiles?.first_name} ${member.profiles?.last_name}` 
        });

        // Create real-time notification payload
        const alertPayload = {
          type: 'sos_alert',
          event_id: event_id,
          location: location,
          user_profile: user_profile,
          timestamp: new Date().toISOString(),
          message: `🚨 EMERGENCY: ${user_profile.first_name} ${user_profile.last_name} needs help at ${location.address || 'their location'}`
        };

        // Send real-time alert via Supabase Realtime
        const channel = `family_member:${member.user_id}`;
        
        // Store alert for offline delivery
        const { error: alertError } = await supabaseService
          .from('family_alerts')
          .insert([{
            event_id: event_id,
            family_user_id: member.user_id,
            alert_type: 'sos_emergency',
            alert_data: alertPayload,
            sent_at: new Date().toISOString(),
            status: 'sent'
          }]);

        if (alertError) {
          logStep("Warning: Could not store alert", { error: alertError.message });
        }

        // Trigger real-time broadcast
        try {
          await supabaseService.functions.invoke('realtime-family-broadcast', {
            body: {
              channel: channel,
              event: 'sos_alert',
              payload: alertPayload
            }
          });
          logStep("Real-time alert sent", { channel });
        } catch (realtimeError) {
          logStep("Warning: Real-time alert failed", { error: realtimeError });
        }

        // Send push notification if available
        try {
          await supabaseService.functions.invoke('push-notification', {
            body: {
              user_id: member.user_id,
              title: "🚨 EMERGENCY ALERT",
              body: `${user_profile.first_name} needs help at ${location.address || 'their location'}`,
              data: {
                type: 'sos_alert',
                event_id: event_id,
                location: location
              }
            }
          });
          logStep("Push notification sent", { userId: member.user_id });
        } catch (pushError) {
          logStep("Warning: Push notification failed", { error: pushError });
        }

        alertsSent++;
        alertResults.push({
          user_id: member.user_id,
          status: 'sent',
          methods: ['realtime', 'push', 'stored']
        });

      } catch (error) {
        logStep("Error sending alert to family member", { 
          memberId: member.user_id, 
          error: error.message 
        });
        
        alertResults.push({
          user_id: member.user_id,
          status: 'failed',
          error: error.message
        });
      }
    }

    logStep("Family alerts completed", { 
      totalMembers: family_members.length,
      alertsSent: alertsSent,
      failures: family_members.length - alertsSent
    });

    return new Response(JSON.stringify({
      success: true,
      alerts_sent: alertsSent,
      total_family_members: family_members.length,
      alert_results: alertResults,
      event_id: event_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR sending family alerts", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});