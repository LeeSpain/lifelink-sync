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

interface BulkCampaignRequest {
  action: 'create' | 'send' | 'get_recipients' | 'get_campaigns' | 'cancel';
  campaignData?: {
    name: string;
    description?: string;
    channel: 'email' | 'whatsapp' | 'both';
    template_id?: string;
    target_criteria: any;
    content_template: string;
    subject_template?: string;
    variables?: any;
    scheduled_at?: string;
  };
  campaign_id?: string;
}

// Get recipients based on criteria
async function getRecipients(criteria: any): Promise<any[]> {
  console.log('Getting recipients with criteria:', criteria);
  
  let query = supabase.from('profiles').select('user_id, first_name, last_name, phone');
  
  // Apply filters based on criteria
  if (criteria.subscription_status) {
    // Join with subscribers table if needed
    query = supabase
      .from('profiles')
      .select(`
        user_id, first_name, last_name, phone,
        subscribers!inner(subscribed, subscription_tier)
      `)
      .eq('subscribers.subscribed', criteria.subscription_status === 'active');
  }
  
  if (criteria.country) {
    query = query.eq('country', criteria.country);
  }
  
  if (criteria.created_after) {
    query = query.gte('created_at', criteria.created_after);
  }
  
  if (criteria.has_phone && criteria.channel === 'whatsapp') {
    query = query.not('phone', 'is', null);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching recipients:', error);
    return [];
  }
  
  // Get email addresses from auth.users
  const recipients = [];
  for (const profile of data || []) {
    const { data: user } = await supabase.auth.admin.getUserById(profile.user_id);
    
    if (user?.user?.email) {
      recipients.push({
        user_id: profile.user_id,
        email: user.user.email,
        phone: profile.phone,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
        variables: {
          first_name: profile.first_name || 'User',
          last_name: profile.last_name || '',
          email: user.user.email,
          phone: profile.phone || ''
        }
      });
    }
  }
  
  return recipients;
}

// Replace template variables
function replaceVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value || ''));
  }
  
  return result;
}

// Create bulk campaign
async function createBulkCampaign(campaignData: any, userId: string) {
  console.log('Creating bulk campaign:', campaignData);
  
  // Get recipients
  const recipients = await getRecipients(campaignData.target_criteria);
  
  if (recipients.length === 0) {
    throw new Error('No recipients found matching the criteria');
  }
  
  // Create campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('bulk_campaigns')
    .insert({
      ...campaignData,
      total_recipients: recipients.length,
      created_by: userId
    })
    .select()
    .single();
    
  if (campaignError) {
    throw new Error(`Failed to create campaign: ${campaignError.message}`);
  }
  
  // Create recipient records
  const recipientRecords = recipients.map(recipient => ({
    campaign_id: campaign.id,
    user_id: recipient.user_id,
    email: recipient.email,
    phone: recipient.phone,
    name: recipient.name,
    variables_used: recipient.variables
  }));
  
  const { error: recipientError } = await supabase
    .from('campaign_recipients')
    .insert(recipientRecords);
    
  if (recipientError) {
    console.error('Error creating recipients:', recipientError);
    // Don't throw error, campaign was created successfully
  }
  
  return { campaign, recipients: recipients.length };
}

// Send campaign messages
async function sendCampaign(campaignId: string) {
  console.log('Sending campaign:', campaignId);
  
  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('bulk_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
    
  if (campaignError || !campaign) {
    throw new Error('Campaign not found');
  }
  
  if (campaign.status === 'sending' || campaign.status === 'completed') {
    throw new Error('Campaign is already being sent or completed');
  }
  
  // Update campaign status
  await supabase
    .from('bulk_campaigns')
    .update({ 
      status: 'sending',
      started_at: new Date().toISOString()
    })
    .eq('id', campaignId);
  
  // Get pending recipients
  const { data: recipients, error: recipientError } = await supabase
    .from('campaign_recipients')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .limit(100); // Process in batches
    
  if (recipientError) {
    throw new Error(`Failed to get recipients: ${recipientError.message}`);
  }
  
  let sentCount = 0;
  let failedCount = 0;
  
  // Send messages
  for (const recipient of recipients || []) {
    try {
      const variables = recipient.variables_used || {};
      
      if (campaign.channel === 'email' || campaign.channel === 'both') {
        const subject = replaceVariables(campaign.subject_template || 'Message from Emergency Protection', variables);
        const content = replaceVariables(campaign.content_template, variables);
        
        const emailResponse = await resend.emails.send({
          from: 'Emergency Protection <noreply@emergency-protection.com>',
          to: [recipient.email],
          subject: subject,
          html: content
        });
        
        if (emailResponse.error) {
          throw emailResponse.error;
        }
      }
      
      if (campaign.channel === 'whatsapp' || campaign.channel === 'both') {
        // WhatsApp sending would go here when implemented
        console.log('WhatsApp sending not yet implemented');
      }
      
      // Update recipient status
      await supabase
        .from('campaign_recipients')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', recipient.id);
        
      sentCount++;
      
    } catch (error) {
      console.error(`Failed to send to ${recipient.email}:`, error);
      
      await supabase
        .from('campaign_recipients')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', recipient.id);
        
      failedCount++;
    }
  }
  
  // Update campaign stats
  await supabase
    .from('bulk_campaigns')
    .update({
      sent_count: campaign.sent_count + sentCount,
      failed_count: campaign.failed_count + failedCount,
      status: sentCount + failedCount >= campaign.total_recipients ? 'completed' : 'sending',
      completed_at: sentCount + failedCount >= campaign.total_recipients ? new Date().toISOString() : null
    })
    .eq('id', campaignId);
  
  return { sent: sentCount, failed: failedCount };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated admin
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    if ((profile?.role || 'user') !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, campaignData, campaign_id }: BulkCampaignRequest = await req.json();

    switch (action) {
      case 'create': {
        if (!campaignData) {
          throw new Error('Campaign data is required');
        }
        
        const result = await createBulkCampaign(campaignData, user.id);
        
        return new Response(JSON.stringify({ 
          success: true, 
          campaign: result.campaign,
          recipients: result.recipients
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'send': {
        if (!campaign_id) {
          throw new Error('Campaign ID is required');
        }
        
        const result = await sendCampaign(campaign_id);
        
        return new Response(JSON.stringify({ 
          success: true,
          sent: result.sent,
          failed: result.failed
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_recipients': {
        if (!campaignData?.target_criteria) {
          throw new Error('Target criteria is required');
        }
        
        const recipients = await getRecipients(campaignData.target_criteria);
        
        return new Response(JSON.stringify({ 
          success: true,
          recipients: recipients.length,
          preview: recipients.slice(0, 5)
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_campaigns': {
        const { data: campaigns, error } = await supabase
          .from('bulk_campaigns')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        return new Response(JSON.stringify({ 
          success: true,
          campaigns
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'cancel': {
        if (!campaign_id) {
          throw new Error('Campaign ID is required');
        }
        
        await supabase
          .from('bulk_campaigns')
          .update({ status: 'cancelled' })
          .eq('id', campaign_id);
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('Error in bulk-messaging function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);