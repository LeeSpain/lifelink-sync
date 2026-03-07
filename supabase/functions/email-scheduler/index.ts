import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Email scheduler running...");
    
    // Process email queue
    const queueResponse = await supabase.functions.invoke('email-automation', {
      body: { action: 'process_queue' }
    });

    let processed = 0;
    if (queueResponse.data && !queueResponse.error) {
      processed = queueResponse.data.totalProcessed || 0;
    }

    // Check for scheduled automations (monthly, quarterly, etc.)
    await processScheduledAutomations();

    // Check for inactive users (daily check)
    await processInactiveUserCheck();

    return new Response(JSON.stringify({ 
      success: true,
      emailsProcessed: processed,
      timestamp: new Date().toISOString(),
      message: "Email scheduler completed successfully"
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in email-scheduler function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function processScheduledAutomations() {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1; // 0-indexed
  const currentHour = now.getHours();

  // Check for monthly automations (1st of each month at 9 AM)
  if (currentDay === 1 && currentHour === 9) {
    console.log("Processing monthly automations...");
    
    // Get all active users for monthly safety tips
    const { data: users, error } = await supabase
      .from('profiles')
      .select('user_id')
      .gt('updated_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()); // Active in last 60 days

    if (!error && users) {
      for (const user of users) {
        await supabase.functions.invoke('automation-triggers', {
          body: {
            event: 'monthly_automation',
            user_id: user.user_id,
            data: { automation_type: 'monthly_safety_tips' }
          }
        });
      }
    }
  }

  // Check for quarterly automations (15th of every 3 months at 10 AM)
  if (currentDay === 15 && currentHour === 10 && currentMonth % 3 === 1) {
    console.log("Processing quarterly automations...");
    
    const { data: users, error } = await supabase
      .from('profiles')
      .select('user_id');

    if (!error && users) {
      for (const user of users) {
        await supabase.functions.invoke('automation-triggers', {
          body: {
            event: 'quarterly_automation',
            user_id: user.user_id,
            data: { automation_type: 'contact_verification' }
          }
        });
      }
    }
  }

  // Check for bi-annual automations (March 1st and September 1st at 9 AM)
  if (currentDay === 1 && currentHour === 9 && (currentMonth === 3 || currentMonth === 9)) {
    console.log("Processing bi-annual automations...");
    
    // Get users who have purchased products
    const { data: productOwners, error } = await supabase
      .from('orders')
      .select('user_id')
      .eq('status', 'completed')
      .not('user_id', 'is', null);

    if (!error && productOwners) {
      const uniqueUsers = [...new Set(productOwners.map(order => order.user_id))];
      for (const userId of uniqueUsers) {
        await supabase.functions.invoke('automation-triggers', {
          body: {
            event: 'biannual_automation',
            user_id: userId,
            data: { automation_type: 'equipment_check' }
          }
        });
      }
    }
  }
}

async function processInactiveUserCheck() {
  // Run this check once per day at 2 AM
  const now = new Date();
  if (now.getHours() === 2) {
    console.log("Processing inactive user check...");
    
    await supabase.functions.invoke('automation-triggers', {
      body: {
        event: 'user_inactive_check',
        data: { check_date: now.toISOString() }
      }
    });
  }
}

serve(handler);