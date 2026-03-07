import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, campaign_id } = await req.json();
    
    // Create service client for database operations
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    console.log(`🎯 Campaign Manager Action: ${action} for campaign: ${campaign_id}`);

    switch (action) {
      case 'force_complete': {
        // Mark campaign as completed
        const { error } = await serviceSupabase
          .from('marketing_campaigns')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString(),
            error_message: null
          })
          .eq('id', campaign_id);

        if (error) throw error;

        console.log(`✅ Campaign ${campaign_id} force completed`);
        return new Response(JSON.stringify({
          success: true,
          message: 'Campaign marked as completed'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'cancel': {
        // Mark campaign as failed/cancelled
        const { error } = await serviceSupabase
          .from('marketing_campaigns')
          .update({ 
            status: 'failed', 
            completed_at: new Date().toISOString(),
            error_message: 'Campaign cancelled by user'
          })
          .eq('id', campaign_id);

        if (error) throw error;

        console.log(`❌ Campaign ${campaign_id} cancelled`);
        return new Response(JSON.stringify({
          success: true,
          message: 'Campaign cancelled'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'cleanup_stale': {
        // Clean up campaigns stuck in running state for more than 10 minutes
        const { data: stuckCampaigns, error: selectError } = await serviceSupabase
          .from('marketing_campaigns')
          .select('id, title, created_at')
          .eq('status', 'running')
          .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

        if (selectError) throw selectError;

        if (stuckCampaigns && stuckCampaigns.length > 0) {
          const { error: updateError } = await serviceSupabase
            .from('marketing_campaigns')
            .update({ 
              status: 'failed', 
              completed_at: new Date().toISOString(),
              error_message: 'Campaign timed out - stuck in running state for over 10 minutes'
            })
            .in('id', stuckCampaigns.map(c => c.id));

          if (updateError) throw updateError;

          console.log(`🧹 Cleaned up ${stuckCampaigns.length} stale campaigns`);
          return new Response(JSON.stringify({
            success: true,
            cleaned_count: stuckCampaigns.length,
            campaigns: stuckCampaigns
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({
          success: true,
          cleaned_count: 0,
          message: 'No stale campaigns found'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        throw new Error('Invalid action specified');
    }

  } catch (error) {
    console.error('Error in campaign-manager function:', error);
    
    return new Response(JSON.stringify({ 
      error: error?.message || String(error),
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});