import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Quick notification templates
const NOTIFICATIONS = {
  emergency_services_contacted: {
    en: 'Emergency services have been contacted for {client_first}. Location: {location}',
    es: 'Se ha contactado con los servicios de emergencia para {client_first}. Ubicación: {location}'
  },
  operator_responding: {
    en: 'Our emergency operator is responding to {client_first}\'s alert. We will keep you updated.',
    es: 'Nuestro operador de emergencias está respondiendo a la alerta de {client_first}. Te mantendremos informado.'
  },
  false_alarm_confirmed: {
    en: '{client_first} has confirmed this was a false alarm. No further action needed.',
    es: '{client_first} ha confirmado que fue una falsa alarma. No se necesita más acción.'
  },
  advice_given: {
    en: 'Emergency advice has been provided to {client_first}. Situation is being monitored.',
    es: 'Se ha proporcionado consejo de emergencia a {client_first}. La situación está siendo monitoreada.'
  }
};

function fillTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
  });
  return result;
}

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

    const { event_id, notification_key, variables = {} } = await req.json();

    if (!event_id || !notification_key) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the SOS event and verify operator access
    const { data: sosEvent, error: eventError } = await supabaseServiceClient
      .from('regional_sos_events')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', event_id)
      .single();

    if (eventError || !sosEvent) {
      return new Response(JSON.stringify({ error: 'SOS event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify operator has access to this event's organization
    const { data: operatorAccess } = await supabaseServiceClient
      .from('organization_users')
      .select('role')
      .eq('organization_id', sosEvent.organization_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!operatorAccess || !['regional_operator', 'regional_supervisor'].includes(operatorAccess.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized: No access to this event' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the notification template
    const template = NOTIFICATIONS[notification_key as keyof typeof NOTIFICATIONS];
    if (!template) {
      return new Response(JSON.stringify({ error: 'Invalid notification key' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get family connections for this client
    const { data: connections } = await supabaseServiceClient
      .from('connections')
      .select('*')
      .eq('owner_id', sosEvent.client_id)
      .eq('status', 'active');

    const notifications = [];

    // Send to each connection in their preferred language
    for (const connection of connections || []) {
      const language = connection.preferred_language === 'es' ? 'es' : 'en';
      const message = fillTemplate(template[language], variables);

      // Insert notification record
      const { data: notification, error: notifError } = await supabaseServiceClient
        .from('family_notifications')
        .insert({
          event_id,
          client_id: sosEvent.client_id,
          message,
          message_type: 'quick_action',
          language,
          sent_by: user.id,
          delivered: false
        })
        .select()
        .single();

      if (!notifError) {
        notifications.push(notification);
      }
    }

    // Log the action
    await supabaseServiceClient
      .from('sos_actions')
      .insert({
        event_id,
        actor_user_id: user.id,
        action_type: 'quick_notification_sent',
        payload: {
          notification_key,
          variables,
          recipients_count: notifications.length
        }
      });

    // TODO: Send actual push notifications, SMS, email based on notify_channels

    return new Response(JSON.stringify({ 
      success: true,
      notifications_sent: notifications.length,
      notifications
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in regional-quick-notification:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});