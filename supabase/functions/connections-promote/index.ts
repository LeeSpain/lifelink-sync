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

    const { connection_id } = await req.json();

    if (!connection_id) {
      return new Response(JSON.stringify({ error: 'Missing connection_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get connection and verify ownership
    const { data: connection, error: fetchError } = await supabaseServiceClient
      .from('connections')
      .select('*')
      .eq('id', connection_id)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !connection) {
      return new Response(JSON.stringify({ error: 'Connection not found or unauthorized' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Can only promote trusted_contact to family_circle
    if (connection.type !== 'trusted_contact') {
      return new Response(JSON.stringify({ error: 'Can only promote trusted contacts' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update connection type
    const { data: updatedConnection, error: updateError } = await supabaseServiceClient
      .from('connections')
      .update({ type: 'family_circle' })
      .eq('id', connection_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error promoting connection:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to promote connection' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create default circle permissions if contact is active
    if (connection.status === 'active' && connection.contact_user_id) {
      await supabaseServiceClient
        .from('circle_permissions')
        .insert({
          owner_id: user.id,
          family_user_id: connection.contact_user_id,
          can_view_history: true,
          can_view_devices: true,
          can_view_location: true
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      connection: updatedConnection 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in connections-promote:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});