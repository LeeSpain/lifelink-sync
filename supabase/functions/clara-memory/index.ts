import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl      = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MemoryRequest {
  action: 'get' | 'upsert';
  session_id?: string;
  user_id?: string;
  contact_email?: string;
  contact_phone?: string;
  first_name?: string;
  language?: string;
  currency?: string;
  protecting?: string;
  protecting_detail?: string;
  pain_point?: string;
  journey_stage?: string;
  plan_interest?: string;
  objection?: string;
  last_outcome?: string;
  interest_score?: number;
  amber_triggered?: boolean;
  amber_trigger_word?: string;
  clara_notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: MemoryRequest = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'action is required: get or upsert' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── GET: retrieve memory summary for CLARA context ──────
    if (action === 'get') {
      const { data, error } = await supabase.rpc('get_clara_memory', {
        p_session_id: body.session_id ?? null,
        p_user_id:    body.user_id    ?? null,
        p_email:      body.contact_email ?? null,
        p_phone:      body.contact_phone ?? null,
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({
          memory_summary: data ?? null,
          has_memory: !!data,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── UPSERT: save/update memory after conversation ───────
    if (action === 'upsert') {
      if (!body.session_id) {
        return new Response(
          JSON.stringify({ error: 'session_id is required for upsert' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase.rpc('upsert_clara_memory', {
        p_session_id:       body.session_id,
        p_user_id:          body.user_id          ?? null,
        p_email:            body.contact_email    ?? null,
        p_phone:            body.contact_phone    ?? null,
        p_first_name:       body.first_name       ?? null,
        p_language:         body.language         ?? 'en',
        p_currency:         body.currency         ?? 'EUR',
        p_protecting:       body.protecting       ?? null,
        p_protecting_detail: body.protecting_detail ?? null,
        p_pain_point:       body.pain_point       ?? null,
        p_journey_stage:    body.journey_stage    ?? null,
        p_plan_interest:    body.plan_interest    ?? null,
        p_objection:        body.objection        ?? null,
        p_last_outcome:     body.last_outcome     ?? null,
        p_interest_score:   body.interest_score   ?? 0,
        p_amber_triggered:  body.amber_triggered  ?? false,
        p_amber_word:       body.amber_trigger_word ?? null,
        p_clara_notes:      body.clara_notes      ?? null,
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, memory_id: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use get or upsert.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('clara-memory error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
