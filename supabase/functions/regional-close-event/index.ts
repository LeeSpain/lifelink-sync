import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    const { event_id, outcome, summary } = await req.json();

    if (!event_id) {
      throw new Error('Missing required field: event_id');
    }

    console.log('Closing regional SOS event:', event_id);

    // Create service role client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get the event details before closing
    const { data: event, error: eventError } = await supabaseService
      .from('regional_sos_events')
      .select(`
        *,
        profiles:client_id (
          first_name,
          last_name,
          phone
        )
      `)
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    // Update the event status to closed
    const { error: updateError } = await supabaseService
      .from('regional_sos_events')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString(),
        assigned_operator: user.id
      })
      .eq('id', event_id);

    if (updateError) {
      throw new Error('Failed to close event: ' + updateError.message);
    }

    // Send final notification to family
    const closureMessage = summary || 'Emergency event has been resolved and closed by our regional operators. Thank you for your patience.';
    
    const { error: notificationError } = await supabaseService
      .from('family_notifications')
      .insert({
        event_id: event_id,
        client_id: event.client_id,
        sent_by: user.id,
        message: closureMessage,
        message_type: 'event_closure',
        language: 'es', // Default to Spanish for Spain
        delivered: true
      });

    if (notificationError) {
      console.error('Failed to send closure notification:', notificationError);
    }

    console.log('Regional SOS event closed successfully:', event_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Emergency event closed successfully',
        event_status: 'closed',
        closure_notification_sent: !notificationError
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in regional-close-event:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to close event'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});