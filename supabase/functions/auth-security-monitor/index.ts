import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthFailureRequest {
  email: string;
  failure_reason: string;
  ip_address?: string;
  user_agent?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, failure_reason, ip_address, user_agent }: AuthFailureRequest = await req.json();

    if (!email || !failure_reason) {
      return new Response(
        JSON.stringify({ error: 'Email and failure_reason are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get real IP address from headers
    const clientIP = ip_address || 
      req.headers.get('x-forwarded-for')?.split(',')[0] || 
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const clientUserAgent = user_agent || req.headers.get('user-agent') || 'unknown';

    console.log('Processing auth failure:', { email, failure_reason, clientIP });

    // Call the database function to track failure and check if should block
    const { data: shouldBlock, error: trackError } = await supabaseClient
      .rpc('track_auth_failure', {
        p_email: email,
        p_ip_address: clientIP,
        p_failure_reason: failure_reason,
        p_user_agent: clientUserAgent
      });

    if (trackError) {
      console.error('Error tracking auth failure:', trackError);
      throw trackError;
    }

    // Get current failure count for this email/IP combo
    const { data: failureData, error: fetchError } = await supabaseClient
      .from('auth_failures')
      .select('attempt_count, blocked_until')
      .eq('email', email)
      .eq('ip_address', clientIP)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching failure data:', fetchError);
    }

    // Log the security event with enhanced metadata
    const { error: logError } = await supabaseClient
      .rpc('log_enhanced_security_event', {
        p_user_id: null,
        p_event_type: 'auth_failure_tracked',
        p_severity: failureData?.attempt_count >= 5 ? 'high' : 'medium',
        p_source_component: 'auth_security_monitor',
        p_metadata: {
          email,
          failure_reason,
          ip_address: clientIP,
          user_agent: clientUserAgent,
          attempt_count: failureData?.attempt_count || 1,
          will_block: shouldBlock,
          blocked_until: failureData?.blocked_until,
          timestamp: new Date().toISOString()
        },
        p_risk_score: (failureData?.attempt_count || 1) * 10
      });

    if (logError) {
      console.error('Error logging security event:', logError);
    }

    // Check if this is a high-risk pattern (multiple failures from same IP)
    const { data: ipFailures, error: ipError } = await supabaseClient
      .from('auth_failures')
      .select('email')
      .eq('ip_address', clientIP)
      .gte('last_attempt_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

    if (!ipError && ipFailures && ipFailures.length >= 3) {
      // Multiple different emails from same IP - potential attack
      await supabaseClient
        .rpc('log_enhanced_security_event', {
          p_user_id: null,
          p_event_type: 'potential_brute_force_attack',
          p_severity: 'high',
          p_source_component: 'auth_security_monitor',
          p_metadata: {
            ip_address: clientIP,
            unique_emails_attempted: ipFailures.length,
            current_email: email,
            attack_pattern: 'multiple_email_attempts',
            timestamp: new Date().toISOString()
          },
          p_risk_score: ipFailures.length * 20
        });
    }

    const response = {
      blocked: shouldBlock,
      attempt_count: failureData?.attempt_count || 1,
      blocked_until: failureData?.blocked_until,
      risk_assessment: {
        level: failureData?.attempt_count >= 5 ? 'high' : failureData?.attempt_count >= 3 ? 'medium' : 'low',
        ip_reputation: ipFailures?.length >= 3 ? 'suspicious' : 'normal'
      }
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Auth security monitor error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});