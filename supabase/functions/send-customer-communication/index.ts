import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { customerIds, type, subject, message } = await req.json();

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Customer IDs required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch customer profiles
    const { data: customers } = await supabaseClient
      .from('profiles')
      .select('user_id, email, first_name, last_name, phone')
      .in('user_id', customerIds);

    if (!customers || customers.length === 0) {
      return new Response(JSON.stringify({ error: 'No customers found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const customer of customers) {
      if (type === 'email' && customer.email) {
        // Queue email
        const { error } = await supabaseClient
          .from('email_queue')
          .insert({
            recipient_email: customer.email,
            recipient_user_id: customer.user_id,
            subject: subject,
            body: message,
            priority: 5,
            scheduled_at: new Date().toISOString(),
          });

        results.push({
          customerId: customer.user_id,
          success: !error,
          error: error?.message,
        });
      } else if (type === 'sms' && customer.phone) {
        // For SMS, we would integrate with Twilio here
        // For now, just log it
        console.log(`Would send SMS to ${customer.phone}: ${message}`);
        results.push({
          customerId: customer.user_id,
          success: true,
          message: 'SMS functionality not yet implemented',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending communication:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});