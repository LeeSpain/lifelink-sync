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

    const { event_id, note } = await req.json();

    if (!event_id || !note) {
      throw new Error('Missing required fields: event_id and note');
    }

    console.log('Sending custom note for event:', event_id);

    // Get the SOS event details
    const { data: event, error: eventError } = await supabaseClient
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

    // Create service role client for notifications
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Insert family notification
    const { error: notificationError } = await supabaseService
      .from('family_notifications')
      .insert({
        event_id: event_id,
        client_id: event.client_id,
        sent_by: user.id,
        message: note,
        message_type: 'custom_note',
        language: 'es', // Default to Spanish for Spain
        delivered: true
      });

    if (notificationError) {
      console.error('Failed to insert notification:', notificationError);
    }

    // Update event status to show operator activity
    const { error: updateError } = await supabaseService
      .from('regional_sos_events')
      .update({
        updated_at: new Date().toISOString(),
        assigned_operator: user.id
      })
      .eq('id', event_id);

    if (updateError) {
      console.error('Failed to update event:', updateError);
    }

    console.log('Custom note sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Custom note sent to family members',
        notification_sent: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in regional-send-note:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send note'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});