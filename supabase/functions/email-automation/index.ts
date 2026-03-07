import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Enhanced template handling - now uses database templates
async function getEmailTemplate(templateName: string) {
  const { data: template, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('name', templateName)
    .eq('is_active', true)
    .single();

  if (error || !template) {
    console.warn(`Template not found in database: ${templateName}`);
    return null;
  }

  return template;
}

interface AutomationRequest {
  action: "trigger" | "process_queue" | "check_automations";
  trigger_type?: string;
  user_id?: string;
  data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, trigger_type, user_id, data }: AutomationRequest = await req.json();

    console.log(`Email automation action: ${action}`);

    switch (action) {
      case "trigger":
        if (!trigger_type || !user_id) {
          throw new Error("Missing trigger_type or user_id");
        }
        return await triggerAutomation(trigger_type, user_id, data);
      
      case "process_queue":
        return await processEmailQueue();
      
      case "check_automations":
        return await checkScheduledAutomations();
      
      default:
        throw new Error("Invalid action");
    }

  } catch (error: any) {
    console.error("Error in email-automation function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function triggerAutomation(triggerType: string, userId: string, data: any = {}) {
  console.log(`Triggering automation: ${triggerType} for user: ${userId}`);

  // Get matching automation settings
  const { data: automations, error: automationError } = await supabase
    .from('email_automation_settings')
    .select('*')
    .eq('trigger_type', triggerType)
    .eq('is_enabled', true);

  if (automationError) {
    throw new Error(`Failed to fetch automations: ${automationError.message}`);
  }

  if (!automations || automations.length === 0) {
    return new Response(JSON.stringify({ 
      message: `No enabled automations found for trigger: ${triggerType}` 
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Get user profile for email and personalization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, user_id')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error("User profile not found");
  }

  // Get user email from auth
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
  
  if (authError || !authUser.user?.email) {
    throw new Error("User email not found");
  }

  const userEmail = authUser.user.email;
  let emailsQueued = 0;

  // Process each automation
  for (const automation of automations) {
    const template = await getEmailTemplate(automation.email_template);
    
    if (!template) {
      console.warn(`Template not found: ${automation.email_template}`);
      continue;
    }

    // Calculate delay based on trigger config
    const config = automation.trigger_config as any;
    let scheduledAt = new Date();
    
    if (config.delay_minutes) {
      scheduledAt = new Date(Date.now() + (config.delay_minutes * 60 * 1000));
    } else if (config.delay_hours) {
      scheduledAt = new Date(Date.now() + (config.delay_hours * 60 * 60 * 1000));
    }

    // Personalize content using database template
    let personalizedSubject = template.subject_template;
    let personalizedContent = template.body_template;
    
    // Replace variables with user data
    const dashboardUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}.vercel.app/dashboard`;
    const variables = {
      first_name: profile.first_name || 'there',
      last_name: profile.last_name || '',
      dashboard_url: dashboardUrl,
      user_email: userEmail,
      ...data // Include any additional data passed to the trigger
    };

    // Replace all template variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      personalizedSubject = personalizedSubject.replace(regex, String(value || ''));
      personalizedContent = personalizedContent.replace(regex, String(value || ''));
    }

    // Queue email for sending
    const { error: queueError } = await supabase
      .from('email_queue')
      .insert({
        automation_id: automation.id,
        recipient_email: userEmail,
        recipient_user_id: userId,
        subject: personalizedSubject,
        body: personalizedContent,
        priority: 3, // Medium priority for automation
        scheduled_at: scheduledAt.toISOString()
      });

    if (queueError) {
      console.error(`Failed to queue email for automation ${automation.id}:`, queueError);
    } else {
      emailsQueued++;
    }
  }

  return new Response(JSON.stringify({ 
    success: true, 
    emailsQueued,
    message: `Queued ${emailsQueued} emails for ${triggerType} trigger`
  }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function processEmailQueue() {
  console.log("Processing email queue...");

  // Get pending emails that are ready to be sent
  const { data: queuedEmails, error: queueError } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('priority', { ascending: true })
    .order('scheduled_at', { ascending: true })
    .limit(50); // Process 50 emails at a time

  if (queueError) {
    throw new Error(`Failed to fetch email queue: ${queueError.message}`);
  }

  if (!queuedEmails || queuedEmails.length === 0) {
    return new Response(JSON.stringify({ 
      message: "No emails in queue to process" 
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  let emailsSent = 0;
  let emailsFailed = 0;

  // Process each email
  for (const email of queuedEmails) {
    try {
      // Mark as processing
      await supabase
        .from('email_queue')
        .update({ status: 'processing' })
        .eq('id', email.id);

      // Send email via Resend
      const emailResponse = await resend.emails.send({
        from: "LifeLink Sync <notifications@your-domain.com>", // Update with your domain
        to: [email.recipient_email],
        subject: email.subject,
        html: email.body,
      });

      if (emailResponse.error) {
        throw new Error(emailResponse.error.message);
      }

      // Mark as sent and log
      await Promise.all([
        supabase
          .from('email_queue')
          .update({ 
            status: 'sent', 
            sent_at: new Date().toISOString() 
          })
          .eq('id', email.id),
        
        supabase
          .from('email_logs')
          .insert({
            recipient_email: email.recipient_email,
            subject: email.subject,
            email_type: email.campaign_id ? 'campaign' : 'automation',
            status: 'sent',
            provider_message_id: emailResponse.data?.id,
            campaign_id: email.campaign_id,
            user_id: email.recipient_user_id
          })
      ]);

      emailsSent++;

    } catch (error: any) {
      console.error(`Failed to send email ${email.id}:`, error);
      
      // Mark as failed
      await supabase
        .from('email_queue')
        .update({ 
          status: 'failed',
          error_message: error.message 
        })
        .eq('id', email.id);

      // Log failure
      await supabase
        .from('email_logs')
        .insert({
          recipient_email: email.recipient_email,
          subject: email.subject,
          email_type: email.campaign_id ? 'campaign' : 'automation',
          status: 'failed',
          error_message: error.message,
          campaign_id: email.campaign_id,
          user_id: email.recipient_user_id
        });

      emailsFailed++;
    }
  }

  return new Response(JSON.stringify({ 
    success: true,
    emailsSent,
    emailsFailed,
    totalProcessed: emailsSent + emailsFailed
  }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function checkScheduledAutomations() {
  console.log("Checking scheduled automations...");

  // This would check for interval-based automations
  // For now, just return success as most automations are trigger-based
  
  return new Response(JSON.stringify({ 
    message: "Scheduled automation check completed" 
  }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(handler);