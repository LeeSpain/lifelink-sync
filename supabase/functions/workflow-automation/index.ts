import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { Resend } from "npm:resend@4.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowExecution {
  trigger_type: string;
  user_id?: string;
  conversation_id?: string;
  event_data?: any;
}

// Template variable replacement function
function replaceTemplateVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value || ''));
  }
  
  return result;
}

// Get user variables for template replacement
async function getUserVariables(userId: string): Promise<Record<string, any>> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: user } = await supabase.auth.admin.getUserById(userId);

  return {
    first_name: profile?.first_name || user.user?.email?.split('@')[0] || 'User',
    last_name: profile?.last_name || '',
    email: user.user?.email || '',
    phone: profile?.phone || '',
    company_name: 'Emergency Protection Services',
    current_date: new Date().toLocaleDateString(),
    current_time: new Date().toLocaleTimeString()
  };
}

// Execute workflow trigger
async function executeWorkflow(execution: WorkflowExecution) {
  console.log('Executing workflow:', execution);

  // Get matching workflow triggers
  const { data: triggers, error: triggersError } = await supabase
    .from('workflow_triggers')
    .select(`
      *,
      email_templates!inner(*)
    `)
    .eq('trigger_type', execution.trigger_type)
    .eq('is_active', true)
    .order('priority');

  if (triggersError) {
    console.error('Error fetching triggers:', triggersError);
    return;
  }

  if (!triggers || triggers.length === 0) {
    console.log('No active triggers found for type:', execution.trigger_type);
    return;
  }

  for (const trigger of triggers) {
    try {
      // Check if conditions match
      const conditions = trigger.trigger_conditions || {};
      if (!matchesConditions(conditions, execution.event_data)) {
        continue;
      }

      // Schedule or execute immediately
      const executeAt = new Date(Date.now() + (trigger.delay_minutes * 60 * 1000));
      
      // Create workflow execution record
      const { data: workflowExecution, error: executionError } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_trigger_id: trigger.id,
          user_id: execution.user_id,
          conversation_id: execution.conversation_id,
          email_template_id: trigger.email_template_id,
          status: trigger.delay_minutes > 0 ? 'pending' : 'executing'
        })
        .select()
        .single();

      if (executionError) {
        console.error('Error creating workflow execution:', executionError);
        continue;
      }

      // Execute immediately or schedule
      if (trigger.delay_minutes === 0) {
        await executeEmail(workflowExecution, trigger.email_templates);
      } else {
        console.log(`Workflow scheduled for ${executeAt} (in ${trigger.delay_minutes} minutes)`);
        // In a real system, you'd use a job queue or cron job here
        // For now, we'll use a simple setTimeout for demonstration
        setTimeout(() => {
          executeEmail(workflowExecution, trigger.email_templates);
        }, trigger.delay_minutes * 60 * 1000);
      }

    } catch (error) {
      console.error('Error executing workflow trigger:', error);
    }
  }
}

// Check if event data matches trigger conditions
function matchesConditions(conditions: any, eventData: any): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true;
  }

  // Simple condition matching - can be extended
  if (conditions.event && eventData?.event !== conditions.event) {
    return false;
  }

  return true;
}

// Execute email sending
async function executeEmail(workflowExecution: any, template: any) {
  try {
    console.log('Executing email for workflow:', workflowExecution.id);

    // Get user variables if user_id is available
    let variables: Record<string, any> = {};
    if (workflowExecution.user_id) {
      variables = await getUserVariables(workflowExecution.user_id);
    }

    // Get recipient email
    let recipientEmail = variables.email;
    if (!recipientEmail && workflowExecution.conversation_id) {
      // Try to get email from conversation or other sources
      const { data: conversation } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', workflowExecution.conversation_id)
        .single();
      
      recipientEmail = conversation?.metadata?.email;
    }

    if (!recipientEmail) {
      throw new Error('No recipient email found');
    }

    // Replace template variables
    const subject = replaceTemplateVariables(template.subject_template, variables);
    const body = replaceTemplateVariables(template.body_template, variables);

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: 'Emergency Protection <noreply@emergency-protection.com>',
      to: [recipientEmail],
      subject: subject,
      html: body
    });

    console.log('Email sent successfully:', emailResponse);

    // Update workflow execution status
    await supabase
      .from('workflow_executions')
      .update({
        status: 'sent',
        executed_at: new Date().toISOString(),
        variables_used: variables
      })
      .eq('id', workflowExecution.id);

    // Log email sending
    await supabase
      .from('email_logs')
      .insert({
        email_type: 'workflow',
        recipient_email: recipientEmail,
        subject: subject,
        status: 'sent',
        provider_message_id: emailResponse.data?.id
      });

  } catch (error) {
    console.error('Error executing email:', error);

    // Update workflow execution with error
    await supabase
      .from('workflow_executions')
      .update({
        status: 'failed',
        error_message: error.message,
        executed_at: new Date().toISOString()
      })
      .eq('id', workflowExecution.id);

    // Log email failure
    if (workflowExecution.user_id) {
      const variables = await getUserVariables(workflowExecution.user_id);
      await supabase
        .from('email_logs')
        .insert({
          email_type: 'workflow',
          recipient_email: variables.email || 'unknown',
          subject: 'Failed to send',
          status: 'failed',
          error_message: error.message
        });
    }
  }
}

// Process pending workflow executions (for scheduled emails)
async function processPendingWorkflows() {
  const { data: pending, error } = await supabase
    .from('workflow_executions')
    .select(`
      *,
      workflow_triggers!inner(*),
      email_templates!inner(*)
    `)
    .eq('status', 'pending')
    .lte('created_at', new Date(Date.now() - 60000).toISOString()); // Process items older than 1 minute

  if (error) {
    console.error('Error fetching pending workflows:', error);
    return;
  }

  for (const execution of pending || []) {
    const delayExpired = Date.now() - new Date(execution.created_at).getTime() >= 
                        (execution.workflow_triggers.delay_minutes * 60 * 1000);
    
    if (delayExpired) {
      await executeEmail(execution, execution.email_templates);
    }
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();

    switch (action) {
      case 'trigger_workflow':
        await executeWorkflow(data as WorkflowExecution);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'process_pending':
        await processPendingWorkflows();
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('Error in workflow-automation function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);