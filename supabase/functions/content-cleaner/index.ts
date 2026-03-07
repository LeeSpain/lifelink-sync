import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action = 'dry_run', confirm = false } = body || {};

    // Require auth and admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false }, global: { headers: { Authorization: authHeader } } });
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: userData, error: userErr } = await userSupabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Authentication failed' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile, error: profileErr } = await serviceSupabase
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();

    if (profileErr || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ success: false, error: 'Admin privileges required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // AGGRESSIVE CLEANUP - Remove ALL Riven marketing content and campaigns
    const { count: allContentCount, error: countErr } = await serviceSupabase
      .from('marketing_content')
      .select('id', { count: 'exact', head: true });

    if (countErr) throw countErr;

    const { count: allCampaignCount, error: campCountErr } = await serviceSupabase
      .from('marketing_campaigns')
      .select('id', { count: 'exact', head: true });

    if (campCountErr) throw campCountErr;

    const result = {
      action,
      candidates: {
        allContent: allContentCount || 0,
        allCampaigns: allCampaignCount || 0,
      },
      deleted: { content: 0, campaigns: 0 },
      success: true,
    } as any;

    if (action === 'execute') {
      if (!confirm) {
        return new Response(JSON.stringify({ success: false, error: 'Confirmation required. Pass { confirm: true }.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Delete ALL marketing content
      if ((allContentCount || 0) > 0) {
        const { error: delContentErr } = await serviceSupabase
          .from('marketing_content')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        if (delContentErr) throw delContentErr;
        result.deleted.content = allContentCount || 0;
      }

      // Delete ALL marketing campaigns  
      if ((allCampaignCount || 0) > 0) {
        const { error: delCampErr } = await serviceSupabase
          .from('marketing_campaigns')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        if (delCampErr) throw delCampErr;
        result.deleted.campaigns = allCampaignCount || 0;
      }
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('content-cleaner error', e);
    return new Response(JSON.stringify({ success: false, error: e?.message || String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
