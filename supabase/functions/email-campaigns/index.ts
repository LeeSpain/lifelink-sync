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

interface CampaignRequest {
  action: "send" | "queue" | "preview" | "test";
  campaignId: string;
  testEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
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

    const { action, campaignId, testEmail }: CampaignRequest = await req.json();

    console.log(`Email campaign action: ${action} for campaign: ${campaignId}`);

    switch (action) {
      case "send":
        return await sendCampaign(campaignId);
      
      case "queue":
        return await queueCampaign(campaignId);
      
      case "preview":
        return await previewCampaign(campaignId);
      
      case "test":
        if (!testEmail) {
          throw new Error("Test email address required");
        }
        return await sendTestCampaign(campaignId, testEmail);
      
      default:
        throw new Error("Invalid action");
    }

  } catch (error: any) {
    console.error("Error in email-campaigns function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function sendCampaign(campaignId: string) {
  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.status !== 'draft') {
    throw new Error("Campaign is not in draft status");
  }

  // Update campaign status to sending
  const { error: updateError } = await supabase
    .from('email_campaigns')
    .update({ 
      status: 'sending',
      sent_at: new Date().toISOString()
    })
    .eq('id', campaignId);

  if (updateError) {
    throw new Error(`Failed to update campaign status: ${updateError.message}`);
  }

  // Queue campaign for processing
  await queueCampaign(campaignId);

  return new Response(JSON.stringify({ 
    success: true,
    message: "Campaign queued for sending"
  }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function queueCampaign(campaignId: string) {
  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new Error("Campaign not found");
  }

  // Get recipients based on campaign criteria
  let recipients: any[] = [];
  
  // For now, get all users with profiles (this would be filtered based on campaign settings)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name');

  if (profilesError) {
    throw new Error(`Failed to get recipients: ${profilesError.message}`);
  }

  // Get email addresses from auth users
  const userIds = profiles?.map(p => p.user_id) || [];
  
  if (userIds.length === 0) {
    return new Response(JSON.stringify({ 
      message: "No recipients found for campaign" 
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // Get user emails (in batches to avoid hitting limits)
  for (let i = 0; i < userIds.length; i += 50) {
    const batch = userIds.slice(i, i + 50);
    
    for (const userId of batch) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        
        if (authUser.user?.email) {
          const profile = profiles?.find(p => p.user_id === userId);
          recipients.push({
            email: authUser.user.email,
            userId: userId,
            firstName: profile?.first_name || '',
            lastName: profile?.last_name || ''
          });
        }
      } catch (error) {
        console.warn(`Failed to get user ${userId}:`, error);
      }
    }
  }

  // Personalize and queue emails
  const emailsToQueue = [];
  
  for (const recipient of recipients) {
    // Get template content (this would be expanded to handle different templates)
    let personalizedSubject = campaign.subject;
    let personalizedContent = `
      <h1>Hello ${recipient.firstName}!</h1>
      <p>This is a campaign email from LifeLink Sync.</p>
      <p>Campaign: ${campaign.name}</p>
      <br>
      <p>Best regards,<br>The LifeLink Sync Team</p>
    `;

    // Replace variables
    personalizedSubject = personalizedSubject.replace(/\{\{first_name\}\}/g, recipient.firstName);
    personalizedContent = personalizedContent.replace(/\{\{first_name\}\}/g, recipient.firstName);

    emailsToQueue.push({
      campaign_id: campaignId,
      recipient_email: recipient.email,
      recipient_user_id: recipient.userId,
      subject: personalizedSubject,
      body: personalizedContent,
      priority: 5, // Normal priority for campaigns
      scheduled_at: new Date().toISOString()
    });
  }

  // Insert emails into queue in batches
  const batchSize = 100;
  let totalQueued = 0;

  for (let i = 0; i < emailsToQueue.length; i += batchSize) {
    const batch = emailsToQueue.slice(i, i + batchSize);
    
    const { error: queueError } = await supabase
      .from('email_queue')
      .insert(batch);

    if (queueError) {
      console.error(`Failed to queue batch:`, queueError);
    } else {
      totalQueued += batch.length;
    }
  }

  // Update campaign with actual recipient count
  await supabase
    .from('email_campaigns')
    .update({ recipient_count: totalQueued })
    .eq('id', campaignId);

  return new Response(JSON.stringify({ 
    success: true,
    emailsQueued: totalQueued,
    totalRecipients: recipients.length
  }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function previewCampaign(campaignId: string) {
  const { data: campaign, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (error || !campaign) {
    throw new Error("Campaign not found");
  }

  // Return preview data
  return new Response(JSON.stringify({ 
    campaign,
    previewSubject: campaign.subject,
    previewContent: `
      <h1>Hello [First Name]!</h1>
      <p>This is a preview of your campaign: ${campaign.name}</p>
      <p>Subject: ${campaign.subject}</p>
    `
  }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function sendTestCampaign(campaignId: string, testEmail: string) {
  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new Error("Campaign not found");
  }

  // Queue test email
  const { error: queueError } = await supabase
    .from('email_queue')
    .insert({
      campaign_id: campaignId,
      recipient_email: testEmail,
      subject: `[TEST] ${campaign.subject}`,
      body: `
        <div style="background: #f0f0f0; padding: 20px; margin-bottom: 20px;">
          <strong>This is a test email for campaign: ${campaign.name}</strong>
        </div>
        <h1>Hello [Test User]!</h1>
        <p>This is a test of your campaign content.</p>
        <p>Campaign: ${campaign.name}</p>
      `,
      priority: 1, // High priority for test emails
      scheduled_at: new Date().toISOString()
    });

  if (queueError) {
    throw new Error(`Failed to queue test email: ${queueError.message}`);
  }

  return new Response(JSON.stringify({ 
    success: true,
    message: `Test email queued for ${testEmail}`
  }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(handler);