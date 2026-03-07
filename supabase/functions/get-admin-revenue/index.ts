/**
 * get-admin-revenue
 * Auth: Admin only
 * Returns revenue data for admin dashboard including orders and subscriptions
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // Verify user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'content-type': 'application/json' }
      });
    }

    // Fetch orders data
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    // Fetch subscribers data  
    const { data: subscribers, error: subsError } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (subsError) {
      console.error('Error fetching subscribers:', subsError);
    }

    // Calculate revenue metrics
    const completedOrders = (orders || []).filter(o => ['completed', 'paid'].includes(o.status));
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0);
    
    const activeSubscribers = (subscribers || []).filter(s => s.subscribed);
    const subscriptionRevenue = activeSubscribers.length * 0.99; // Assuming 0.99 EUR per subscription

    const totalCustomers = new Set([
      ...completedOrders.map(o => o.user_id).filter(Boolean),
      ...activeSubscribers.map(s => s.user_id).filter(Boolean)
    ]).size;

    return new Response(JSON.stringify({
      success: true,
      metrics: {
        totalRevenue: totalRevenue + subscriptionRevenue,
        totalOrders: completedOrders.length,
        totalCustomers,
        activeSubscriptions: activeSubscribers.length
      },
      orders: completedOrders,
      subscribers: activeSubscribers,
      rawData: {
        allOrders: orders || [],
        allSubscribers: subscribers || []
      }
    }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin revenue error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' }
    });
  }
});