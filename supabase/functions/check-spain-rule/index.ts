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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile to check Spain rule
    const { data: profile, error: profileError } = await supabaseServiceClient
      .from('profiles')
      .select('country_code, subscription_regional')
      .eq('user_id', user_id)
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check active connections count
    const { data: activeConnections, error: connectionsError } = await supabaseServiceClient
      .from('connections')
      .select('id')
      .eq('owner_id', user_id)
      .eq('status', 'active');

    if (connectionsError) {
      console.error('Error checking connections:', connectionsError);
      return new Response(JSON.stringify({ error: 'Failed to check connections' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const activeCount = activeConnections?.length || 0;
    const isSpain = profile.country_code === 'ES';
    const hasRegional = profile.subscription_regional;

    let canProceed = true;
    let reason = '';

    // Apply Spain rule
    if (isSpain && activeCount === 0 && !hasRegional) {
      canProceed = false;
      reason = 'Spain rule: Must have at least 1 active connection OR regional subscription';
    }

    return new Response(JSON.stringify({ 
      canProceed,
      activeConnections: activeCount,
      hasRegional,
      isSpain,
      reason
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-spain-rule:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});