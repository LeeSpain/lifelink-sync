import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface TriggerRequest {
  event: string;
  user_id?: string;
  data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event, user_id, data }: TriggerRequest = await req.json();
    console.log(`Processing automation trigger: ${event} for user: ${user_id}`);

    // Map events to automation triggers
    const triggers = await getTriggersForEvent(event, user_id, data);
    
    let totalTriggered = 0;
    
    for (const trigger of triggers) {
      const response = await supabase.functions.invoke('email-automation', {
        body: {
          action: 'trigger',
          trigger_type: trigger.type,
          user_id: trigger.user_id,
          data: trigger.data
        }
      });

      if (!response.error) {
        totalTriggered++;
        console.log(`Successfully triggered: ${trigger.type}`);
      } else {
        console.error(`Failed to trigger ${trigger.type}:`, response.error);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      event,
      triggersActivated: totalTriggered,
      message: `Processed ${triggers.length} potential triggers, activated ${totalTriggered}`
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in automation-triggers function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function getTriggersForEvent(event: string, userId?: string, data: any = {}) {
  const triggers = [];

  switch (event) {
    case 'user_signup':
      if (userId) {
        triggers.push({
          type: 'user_signup',
          user_id: userId,
          data: { signup_source: data.source || 'web' }
        });
      }
      break;

    case 'profile_updated':
      if (userId) {
        // Check if profile is now complete
        const isComplete = await checkProfileCompletion(userId);
        if (isComplete) {
          triggers.push({
            type: 'profile_completed',
            user_id: userId,
            data: { completion_date: new Date().toISOString() }
          });
        } else {
          triggers.push({
            type: 'profile_incomplete',
            user_id: userId,
            data: { missing_fields: data.missing_fields || [] }
          });
        }
      }
      break;

    case 'sos_activated':
      if (userId) {
        triggers.push({
          type: 'sos_activated',
          user_id: userId,
          data: { 
            incident_id: data.incident_id,
            activation_time: new Date().toISOString(),
            location: data.location
          }
        });
      }
      break;

    case 'emergency_contact_added':
      if (userId) {
        triggers.push({
          type: 'emergency_contact_added',
          user_id: userId,
          data: { 
            contact_name: data.contact_name,
            added_at: new Date().toISOString()
          }
        });
      }
      break;

    case 'family_invite_sent':
      if (userId) {
        triggers.push({
          type: 'family_invite_sent',
          user_id: userId,
          data: { 
            invitee_email: data.invitee_email,
            invitee_name: data.invitee_name,
            sent_at: new Date().toISOString()
          }
        });
      }
      break;

    case 'family_member_joined':
      if (userId) {
        triggers.push({
          type: 'family_member_joined',
          user_id: userId,
          data: { 
            member_email: data.member_email,
            member_name: data.member_name,
            joined_at: new Date().toISOString()
          }
        });
      }
      break;

    case 'subscription_expiring':
      if (userId) {
        triggers.push({
          type: 'subscription_expiring',
          user_id: userId,
          data: { 
            expires_at: data.expires_at,
            days_remaining: data.days_remaining,
            plan_name: data.plan_name
          }
        });
      }
      break;

    case 'subscription_expired':
      if (userId) {
        triggers.push({
          type: 'subscription_expired',
          user_id: userId,
          data: { 
            expired_at: data.expired_at,
            plan_name: data.plan_name
          }
        });
      }
      break;

    case 'payment_failed':
      if (userId) {
        triggers.push({
          type: 'payment_failed',
          user_id: userId,
          data: { 
            failed_at: new Date().toISOString(),
            amount: data.amount,
            reason: data.reason
          }
        });
      }
      break;

    case 'user_inactive_check':
      // This would be called by a cron job to check for inactive users
      const inactiveUsers = await getInactiveUsers();
      for (const inactiveUser of inactiveUsers) {
        triggers.push({
          type: 'user_inactive',
          user_id: inactiveUser.user_id,
          data: { 
            inactive_days: inactiveUser.inactive_days,
            last_active: inactiveUser.last_active
          }
        });
      }
      break;

    default:
      console.log(`No automation triggers configured for event: ${event}`);
      break;
  }

  return triggers;
}

async function checkProfileCompletion(userId: string): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('emergency_contacts, medical_conditions, first_name, last_name, phone')
    .eq('user_id', userId)
    .single();

  if (error || !profile) {
    return false;
  }

  // Consider profile complete if basic info + emergency contacts exist
  const hasBasicInfo = profile.first_name && profile.last_name && profile.phone;
  const hasEmergencyContacts = profile.emergency_contacts && 
    Array.isArray(profile.emergency_contacts) && 
    profile.emergency_contacts.length > 0;

  return hasBasicInfo && hasEmergencyContacts;
}

async function getInactiveUsers() {
  // Get users who haven't logged in for different periods
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('user_id, updated_at')
    .lt('updated_at', thirtyDaysAgo.toISOString());

  if (error || !profiles) {
    return [];
  }

  return profiles.map(profile => ({
    user_id: profile.user_id,
    last_active: profile.updated_at,
    inactive_days: Math.floor((Date.now() - new Date(profile.updated_at).getTime()) / (24 * 60 * 60 * 1000))
  }));
}

serve(handler);