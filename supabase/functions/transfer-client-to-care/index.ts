import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      console.error('User is not admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting transfer for user: ${user_id}`);

    // Fetch full client profile with service role to get all data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: clientProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (profileError || !clientProfile) {
      console.error('Error fetching profile:', profileError);
      
      await supabaseAdmin
        .from('profiles')
        .update({
          care_transfer_status: 'failed',
          care_transfer_error: `Profile not found: ${profileError?.message || 'Unknown error'}`
        })
        .eq('user_id', user_id);

      return new Response(
        JSON.stringify({ error: 'Profile not found', details: profileError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already transferred
    if (clientProfile.transferred_to_care) {
      return new Response(
        JSON.stringify({ 
          error: 'Client already transferred',
          transfer_date: clientProfile.care_transfer_date
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize data - exclude payment/billing information
    const sanitizedData = {
      // Identity
      user_id: clientProfile.user_id,
      email: clientProfile.email,
      first_name: clientProfile.first_name,
      last_name: clientProfile.last_name,
      phone: clientProfile.phone,
      date_of_birth: clientProfile.date_of_birth,
      
      // Location
      address: clientProfile.address,
      city: clientProfile.city,
      state: clientProfile.state,
      postal_code: clientProfile.postal_code,
      country: clientProfile.country,
      country_code: clientProfile.country_code,
      region: clientProfile.region,
      latitude: clientProfile.latitude,
      longitude: clientProfile.longitude,
      
      // Medical
      medical_conditions: clientProfile.medical_conditions,
      allergies: clientProfile.allergies,
      medications: clientProfile.medications,
      blood_type: clientProfile.blood_type,
      height: clientProfile.height,
      weight: clientProfile.weight,
      
      // Emergency contacts (fetch separately)
      emergency_contacts: [],
      
      // Preferences
      language_preference: clientProfile.language_preference,
      notification_preferences: clientProfile.notification_preferences,
      
      // Metadata
      transferred_from: 'LifeLink Sync',
      transfer_date: new Date().toISOString(),
      original_signup_date: clientProfile.created_at
    };

    // Fetch emergency contacts
    const { data: emergencyContacts } = await supabaseAdmin
      .from('emergency_contacts')
      .select('name, phone, email, relationship, priority, type')
      .eq('user_id', user_id)
      .order('priority', { ascending: true });

    if (emergencyContacts) {
      sanitizedData.emergency_contacts = emergencyContacts;
    }

    console.log('Sanitized data prepared, sending to Care Conneqt...');

    // Send to Care Conneqt
    const careConneqtUrl = 'https://ehqhdmzzeduhisagfizu.supabase.co/functions/v1/receive-ice-client';
    const careApiKey = Deno.env.get('CARE_CONNEQT_API_KEY');

    if (!careApiKey) {
      console.error('CARE_CONNEQT_API_KEY not configured');
      
      await supabaseAdmin
        .from('profiles')
        .update({
          care_transfer_status: 'failed',
          care_transfer_error: 'API key not configured'
        })
        .eq('user_id', user_id);

      return new Response(
        JSON.stringify({ error: 'Care Conneqt API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transferResponse = await fetch(careConneqtUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ice-api-key': careApiKey
      },
      body: JSON.stringify(sanitizedData)
    });

    const transferResult = await transferResponse.json();

    if (!transferResponse.ok) {
      console.error('Transfer failed:', transferResult);
      
      await supabaseAdmin
        .from('profiles')
        .update({
          care_transfer_status: 'failed',
          care_transfer_error: transferResult.error || 'Unknown error from Care Conneqt'
        })
        .eq('user_id', user_id);

      return new Response(
        JSON.stringify({ 
          error: 'Transfer to Care Conneqt failed', 
          details: transferResult 
        }),
        { status: transferResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transfer successful, updating profile...');

    // Update profile with successful transfer
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        transferred_to_care: true,
        care_transfer_date: new Date().toISOString(),
        care_transfer_status: 'completed',
        care_transfer_error: null
      })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(
        JSON.stringify({ 
          warning: 'Transfer successful but failed to update local record',
          details: updateError,
          care_result: transferResult
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transfer completed successfully for user:', user_id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Client transferred successfully',
        care_client_id: transferResult.client_id,
        transfer_date: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transfer-client-to-care:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
