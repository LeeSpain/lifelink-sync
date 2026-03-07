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
    const { action, userId, productId, quantity, priceOverride, paymentMethod, status, notes, orderId } = body;

    console.log(`Product action: ${action}`, { userId, productId, orderId });

    if (action === 'create_order') {
      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw new Error('Product not found');

      const totalAmount = priceOverride || (product.price * quantity);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          product_id: productId,
          quantity: quantity,
          total_amount: totalAmount,
          status: status,
          stripe_payment_intent_id: paymentMethod === 'stripe' ? 'manual_' + Date.now() : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Add note if provided
      if (notes) {
        await supabase
          .from('order_notes')
          .insert({
            order_id: order.id,
            note_text: notes,
            created_by: user.id,
            is_internal: true,
          });
      }

      // Log to security events
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'product_assigned',
        severity: 'low',
        source_component: 'admin_product_management',
        metadata: {
          product_id: productId,
          order_id: order.id,
          quantity,
          total_amount: totalAmount,
          assigned_by: user.id,
        },
      });

      return new Response(
        JSON.stringify({ success: true, order }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_order_status') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Add note if provided
      if (notes) {
        await supabase
          .from('order_notes')
          .insert({
            order_id: orderId,
            note_text: `Status changed to ${status}. ${notes}`,
            created_by: user.id,
            is_internal: true,
          });
      }

      // Log to security events
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'order_status_updated',
        severity: 'low',
        source_component: 'admin_product_management',
        metadata: {
          order_id: orderId,
          new_status: status,
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
