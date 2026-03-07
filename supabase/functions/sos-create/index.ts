import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id, lat, lng, emergency_type = 'general', source = 'app' } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check Spain rule first
    const { data: profile } = await supabaseServiceClient
      .from('profiles')
      .select('country_code, subscription_regional')
      .eq('user_id', user_id)
      .single();

    const { data: activeConnections } = await supabaseServiceClient
      .from('connections')
      .select('id')
      .eq('owner_id', user_id)
      .eq('status', 'active');

    const activeCount = activeConnections?.length || 0;
    const isSpain = profile?.country_code === 'ES';
    const hasRegional = profile?.subscription_regional;

    // Apply Spain rule
    if (isSpain && activeCount === 0 && !hasRegional) {
      return new Response(JSON.stringify({ 
        error: 'Spain rule violation: Must have at least 1 active connection OR regional subscription to trigger SOS',
        code: 'SPAIN_RULE_VIOLATION'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get family group
    const { data: familyGroup } = await supabaseServiceClient
      .from('family_groups')
      .select('id')
      .eq('owner_user_id', user_id)
      .single();

    // Create SOS event
    const { data: sosEvent, error: sosError } = await supabaseServiceClient
      .from('sos_events')
      .insert({
        user_id,
        group_id: familyGroup?.id,
        lat,
        lng,
        emergency_type,
        source,
        status: 'active'
      })
      .select()
      .single();

    if (sosError) {
      console.error('Error creating SOS event:', sosError);
      return new Response(JSON.stringify({ error: 'Failed to create SOS event' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create location record
    if (lat && lng) {
      await supabaseServiceClient
        .from('sos_locations')
        .insert({
          event_id: sosEvent.id,
          lat,
          lng
        });
    }

    // Get all connections for notifications
    const { data: connections } = await supabaseServiceClient
      .from('connections')
      .select('*')
      .eq('owner_id', user_id)
      .eq('status', 'active');

    // Grant temporary access to trusted contacts
    const trustedContacts = connections?.filter(c => c.type === 'trusted_contact' && c.contact_user_id) || [];
    
    for (const contact of trustedContacts) {
      await supabaseServiceClient
        .from('sos_event_access')
        .insert({
          event_id: sosEvent.id,
          user_id: contact.contact_user_id,
          access_scope: 'live_only',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        });
    }

    // Create regional SOS event if user has regional subscription
    if (hasRegional && profile?.organization_id) {
      await supabaseServiceClient
        .from('regional_sos_events')
        .insert({
          client_id: user_id,
          organization_id: profile.organization_id,
          source,
          emergency_type,
          status: 'open',
          priority: 'medium',
          lat,
          lng
        });
    }

    // TODO: Trigger notifications to family and emergency contacts
    // This would invoke other functions for:
    // - family-sos-alerts
    // - emergency-call-sequence  
    // - emergency-email-notifications

    return new Response(JSON.stringify({ 
      success: true,
      event: sosEvent,
      connections_notified: connections?.length || 0,
      regional_created: hasRegional
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sos-create:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});