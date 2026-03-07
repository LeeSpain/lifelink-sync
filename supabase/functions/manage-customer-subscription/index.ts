import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionActionRequest {
  userId: string;
  action: 'extend' | 'upgrade' | 'downgrade' | 'cancel' | 'activate';
  newTier?: string;
  extensionDays?: number;
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Only admins can manage subscriptions');
    }

    const { userId, action, newTier, extensionDays, reason }: SubscriptionActionRequest = await req.json();

    console.log(`📋 Subscription action requested:`, { userId, action, newTier, extensionDays, reason });

    // Get current subscription
    const { data: currentSub, error: subError } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (subError) {
      throw new Error(`Failed to fetch subscription: ${subError.message}`);
    }

    let updateData: any = {};
    let historyAction = action;
    let newEndDate = currentSub?.subscription_end;

    switch (action) {
      case 'extend':
        if (!extensionDays) {
          throw new Error('Extension days required');
        }
        const currentEnd = currentSub?.subscription_end ? new Date(currentSub.subscription_end) : new Date();
        newEndDate = new Date(currentEnd.getTime() + extensionDays * 24 * 60 * 60 * 1000).toISOString();
        updateData = {
          subscription_end: newEndDate,
          subscribed: true
        };
        break;

      case 'upgrade':
      case 'downgrade':
        if (!newTier) {
          throw new Error('New tier required');
        }
        updateData = {
          subscription_tier: newTier,
          subscribed: true
        };
        break;

      case 'cancel':
        updateData = {
          subscribed: false
        };
        break;

      case 'activate':
        updateData = {
          subscribed: true,
          subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };
        newEndDate = updateData.subscription_end;
        break;

      default:
        throw new Error('Invalid action');
    }

    // Update subscription
    const { data: updatedSub, error: updateError } = await supabaseClient
      .from('subscribers')
      .upsert({
        user_id: userId,
        ...updateData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    // Log to subscription history
    const { error: historyError } = await supabaseClient
      .from('subscription_history')
      .insert({
        user_id: userId,
        subscription_tier: newTier || currentSub?.subscription_tier,
        action: historyAction,
        previous_tier: currentSub?.subscription_tier,
        previous_end_date: currentSub?.subscription_end,
        new_end_date: newEndDate,
        changed_by: user.id,
        reason: reason || null,
        metadata: {
          action_details: { extensionDays, newTier }
        }
      });

    if (historyError) {
      console.error('⚠️ Failed to log subscription history:', historyError);
    }

    console.log(`✅ Subscription ${action} completed for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        subscription: updatedSub,
        message: `Subscription ${action} completed successfully`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error managing subscription:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
