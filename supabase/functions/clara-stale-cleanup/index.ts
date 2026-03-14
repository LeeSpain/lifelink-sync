import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl      = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('clara-stale-cleanup invoked');

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Mark leads older than 30 days with no conversion as stale
    const { data: staleLeads, count } = await supabase
      .from('leads')
      .update({
        status: 'stale',
        updated_at: new Date().toISOString(),
      })
      .not('status', 'in', '("converted","stale")')
      .lt('updated_at', thirtyDaysAgo)
      .select('id', { count: 'exact' });

    const staleCount = count ?? staleLeads?.length ?? 0;
    console.log(`Marked ${staleCount} leads as stale`);

    return new Response(
      JSON.stringify({ success: true, stale_count: staleCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('clara-stale-cleanup error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
