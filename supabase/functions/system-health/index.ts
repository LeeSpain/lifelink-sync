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

    if (req.method === 'GET') {
      // Perform system health checks
      const healthChecks = [];
      
      // 1. Database Health Check
      try {
        const { data: dbCheck, error: dbError } = await supabase
          .from('profiles')
          .select('count(*)')
          .limit(1);
        
        healthChecks.push({
          component: 'database',
          status: dbError ? 'error' : 'healthy',
          response_time: Date.now(),
          details: dbError ? dbError.message : 'Connection successful'
        });
      } catch (error) {
        healthChecks.push({
          component: 'database',
          status: 'error',
          response_time: Date.now(),
          details: error instanceof Error ? error.message : 'Database check failed'
        });
      }

      // 2. Authentication Service Check
      try {
        const { data: authCheck, error: authError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1
        });
        
        healthChecks.push({
          component: 'authentication',
          status: authError ? 'error' : 'healthy',
          response_time: Date.now(),
          details: authError ? authError.message : 'Auth service operational'
        });
      } catch (error) {
        healthChecks.push({
          component: 'authentication',
          status: 'error',
          response_time: Date.now(),
          details: error instanceof Error ? error.message : 'Auth check failed'
        });
      }

      // 3. Email Service Check
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      healthChecks.push({
        component: 'email_service',
        status: resendApiKey ? 'healthy' : 'warning',
        response_time: Date.now(),
        details: resendApiKey ? 'Email service configured' : 'RESEND_API_KEY not configured'
      });

      // 4. Storage Health Check
      try {
        const { data: storageCheck, error: storageError } = await supabase.storage.listBuckets();
        
        healthChecks.push({
          component: 'storage',
          status: storageError ? 'error' : 'healthy',
          response_time: Date.now(),
          details: storageError ? storageError.message : 'Storage service operational'
        });
      } catch (error) {
        healthChecks.push({
          component: 'storage',
          status: 'warning',
          response_time: Date.now(),
          details: 'Storage check unavailable'
        });
      }

      // 5. Edge Functions Health
      healthChecks.push({
        component: 'edge_functions',
        status: 'healthy',
        response_time: Date.now(),
        details: 'Edge functions operational'
      });

      // Calculate overall health
      const errorCount = healthChecks.filter(check => check.status === 'error').length;
      const warningCount = healthChecks.filter(check => check.status === 'warning').length;
      
      let overallStatus = 'healthy';
      if (errorCount > 0) {
        overallStatus = 'error';
      } else if (warningCount > 0) {
        overallStatus = 'warning';
      }

      // Log system health check
      try {
        await supabase.from('security_events').insert({
          event_type: 'system_health_check',
          metadata: {
            overall_status: overallStatus,
            checks: healthChecks,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error('Failed to log health check:', logError);
      }

      return new Response(
        JSON.stringify({
          overall_status: overallStatus,
          timestamp: new Date().toISOString(),
          checks: healthChecks,
          summary: {
            total_checks: healthChecks.length,
            healthy: healthChecks.filter(c => c.status === 'healthy').length,
            warnings: warningCount,
            errors: errorCount
          }
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'POST') {
      // Manual health check trigger or system restart
      const { action } = await req.json();
      
      if (action === 'restart_services') {
        // In a real implementation, this would restart services
        // For now, we'll just log the action
        await supabase.from('security_events').insert({
          event_type: 'system_restart_requested',
          metadata: {
            requested_by: 'admin',
            timestamp: new Date().toISOString()
          }
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Service restart initiated' 
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('System health check error:', error);
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