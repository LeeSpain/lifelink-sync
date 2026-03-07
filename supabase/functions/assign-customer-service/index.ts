import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const body = await req.json();
    const { action, customerId, serviceId, startDate, endDate, priceOverride, autoRenew, notes, assignmentId, status } = body;

    console.log(`Service action: ${action}`, { customerId, serviceId, assignmentId });

    if (action === 'assign_service') {
      // Insert service assignment
      const { data: assignment, error: assignError } = await supabase
        .from('customer_regional_services')
        .insert({
          customer_id: customerId,
          service_id: serviceId,
          start_date: startDate || new Date().toISOString(),
          end_date: endDate,
          price_override: priceOverride,
          auto_renew: autoRenew !== undefined ? autoRenew : true,
          assigned_by: user.id,
          notes: notes,
          status: 'active',
        })
        .select()
        .single();

      if (assignError) throw assignError;

      // Log to security events
      await supabase.from('security_events').insert({
        user_id: customerId,
        event_type: 'service_assigned',
        severity: 'low',
        source_component: 'admin_service_management',
        metadata: {
          service_id: serviceId,
          assignment_id: assignment.id,
          assigned_by: user.id,
        },
      });

      return new Response(
        JSON.stringify({ success: true, assignment }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_service') {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (status) updateData.status = status;
      if (endDate !== undefined) updateData.end_date = endDate;
      if (priceOverride !== undefined) updateData.price_override = priceOverride;
      if (autoRenew !== undefined) updateData.auto_renew = autoRenew;
      if (notes !== undefined) updateData.notes = notes;
      if (status === 'inactive') updateData.deactivated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('customer_regional_services')
        .update(updateData)
        .eq('id', assignmentId);

      if (updateError) throw updateError;

      // Log to security events
      await supabase.from('security_events').insert({
        user_id: customerId,
        event_type: 'service_updated',
        severity: 'low',
        source_component: 'admin_service_management',
        metadata: {
          assignment_id: assignmentId,
          updates: updateData,
          updated_by: user.id,
        },
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
