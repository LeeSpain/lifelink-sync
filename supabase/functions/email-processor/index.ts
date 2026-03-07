import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize clients
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface EmailProcessorRequest {
  action: 'process_queue' | 'send_single' | 'retry_failed';
  email_id?: string;
  max_emails?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { action, email_id, max_emails = 10 }: EmailProcessorRequest = await req.json();

    console.log(`📧 Email processor action: ${action}`);

    let result;
    switch (action) {
      case 'process_queue':
        result = await processEmailQueue(max_emails);
        break;
      case 'send_single':
        if (!email_id) {
          throw new Error('email_id is required for send_single action');
        }
        result = await sendSingleEmail(email_id);
        break;
      case 'retry_failed':
        result = await retryFailedEmails(max_emails);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ Error in email processor:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

async function processEmailQueue(maxEmails: number) {
  console.log(`🔄 Processing email queue (max: ${maxEmails})`);

  // Get pending emails from queue
  const { data: pendingEmails, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('priority', { ascending: false })
    .order('scheduled_at', { ascending: true })
    .limit(maxEmails);

  if (error) {
    console.error("❌ Error fetching pending emails:", error);
    throw error;
  }

  if (!pendingEmails?.length) {
    console.log("✅ No pending emails to process");
    return { processed: 0, success: true };
  }

  console.log(`📨 Found ${pendingEmails.length} pending emails`);

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const email of pendingEmails) {
    try {
      await sendSingleEmail(email.id);
      sent++;
    } catch (error) {
      console.error(`❌ Failed to send email ${email.id}:`, error);
      failed++;
    }
    processed++;
  }

  console.log(`✅ Processed ${processed} emails (sent: ${sent}, failed: ${failed})`);

  return {
    processed,
    sent,
    failed,
    success: true
  };
}

async function sendSingleEmail(emailId: string) {
  console.log(`📤 Sending email: ${emailId}`);

  // Update status to processing
  await supabase
    .from('email_queue')
    .update({ status: 'processing' })
    .eq('id', emailId);

  // Get email details
  const { data: email, error: emailError } = await supabase
    .from('email_queue')
    .select('*')
    .eq('id', emailId)
    .single();

  if (emailError || !email) {
    throw new Error(`Email not found: ${emailId}`);
  }

  if (!resend) {
    throw new Error('Resend API key not configured');
  }

  try {
    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: email.sender_email || 'noreply@example.com',
      to: [email.recipient_email],
      subject: email.subject,
      html: email.body,
      text: email.text_content || stripHtml(email.body),
    });

    console.log(`✅ Email sent successfully:`, emailResult);

    // Update email queue status
    await supabase
      .from('email_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', emailId);

    // Log delivery
    await supabase
      .from('email_delivery_log')
      .insert({
        email_queue_id: emailId,
        campaign_id: email.campaign_id,
        recipient_email: email.recipient_email,
        delivery_status: 'sent',
        provider_message_id: emailResult.data?.id,
        provider_response: emailResult,
        delivered_at: new Date().toISOString()
      });

    return {
      success: true,
      message_id: emailResult.data?.id,
      email_id: emailId
    };

  } catch (error: any) {
    console.error(`❌ Failed to send email ${emailId}:`, error);

    // Update email queue with failure
    await supabase
      .from('email_queue')
      .update({
        status: 'failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', emailId);

    // Log failure
    await supabase
      .from('email_delivery_log')
      .insert({
        email_queue_id: emailId,
        campaign_id: email.campaign_id,
        recipient_email: email.recipient_email,
        delivery_status: 'failed',
        provider_response: { error: error.message },
        bounce_reason: error.message
      });

    throw error;
  }
}

async function retryFailedEmails(maxEmails: number) {
  console.log(`🔄 Retrying failed emails (max: ${maxEmails})`);

  // Get failed emails that haven't been retried too many times
  const { data: failedEmails, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'failed')
    .lt('retry_count', 3) // Max 3 retries
    .order('created_at', { ascending: true })
    .limit(maxEmails);

  if (error) {
    throw error;
  }

  if (!failedEmails?.length) {
    return { retried: 0, success: true };
  }

  let retried = 0;
  let succeeded = 0;

  for (const email of failedEmails) {
    try {
      // Reset status to pending and increment retry count
      await supabase
        .from('email_queue')
        .update({
          status: 'pending',
          retry_count: (email.retry_count || 0) + 1,
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', email.id);

      // Try to send again
      await sendSingleEmail(email.id);
      succeeded++;
    } catch (error) {
      console.error(`❌ Retry failed for email ${email.id}:`, error);
    }
    retried++;
  }

  return {
    retried,
    succeeded,
    success: true
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

serve(handler);