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

  console.log('clara-lead-chase invoked');

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Find leads with score 5+ not contacted in last 24h
    const { data: staleLeads } = await supabase
      .from('leads')
      .select('id, session_id, email, phone, interest_level, status, metadata, updated_at')
      .gte('interest_level', 5)
      .not('status', 'in', '("converted","lost","stale")')
      .lt('updated_at', twentyFourHoursAgo)
      .order('interest_level', { ascending: false })
      .limit(20);

    if (!staleLeads?.length) {
      console.log('No stale hot leads found');
      return new Response(
        JSON.stringify({ success: true, chased: 0, leads: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${staleLeads.length} stale hot leads to chase`);

    const chased: string[] = [];

    for (const lead of staleLeads) {
      // Get memory context for richer alert
      let contactName = 'Unknown';
      let protecting = 'not stated';
      let lastOutcome = '';

      try {
        const { data: memData } = await supabase.functions.invoke('clara-memory', {
          body: {
            action: 'get',
            ...(lead.session_id ? { session_id: lead.session_id } : {}),
            ...(lead.email ? { contact_email: lead.email } : {}),
            ...(lead.phone ? { contact_phone: lead.phone } : {}),
          },
        });
        if (memData?.has_memory && memData?.memory_summary) {
          // Parse name from summary if available
          const nameMatch = memData.memory_summary.match(/Name:\s*(.+)/);
          if (nameMatch) contactName = nameMatch[1].trim();
          const protMatch = memData.memory_summary.match(/Protecting:\s*(.+)/);
          if (protMatch) protecting = protMatch[1].trim();
          const outcomeMatch = memData.memory_summary.match(/Last time:\s*(.+)/);
          if (outcomeMatch) lastOutcome = outcomeMatch[1].trim();
        }
      } catch {
        // non-fatal
      }

      // Send WhatsApp chase alert to Lee
      try {
        const hoursStale = Math.round((Date.now() - new Date(lead.updated_at).getTime()) / 3600000);

        await supabase.functions.invoke('clara-escalation', {
          body: {
            type: 'hot_lead',
            lead_id: lead.id,
            session_id: lead.session_id,
            contact_name: contactName,
            contact_email: lead.email ?? 'not provided',
            contact_phone: lead.phone ?? 'not provided',
            interest_score: lead.interest_level,
            protecting,
            clara_recommendation: `Score ${lead.interest_level}/10 — no contact for ${hoursStale}h. ${lastOutcome ? 'Last: ' + lastOutcome : 'Follow up now.'}`,
          },
        });
        chased.push(lead.id);
      } catch (escErr) {
        console.warn(`Escalation failed for lead ${lead.id}:`, escErr);
      }

      // Update lead timestamp so we don't chase again for 24h
      await supabase
        .from('leads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', lead.id);
    }

    console.log(`Chased ${chased.length} leads`);

    return new Response(
      JSON.stringify({ success: true, chased: chased.length, leads: chased }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('clara-lead-chase error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
