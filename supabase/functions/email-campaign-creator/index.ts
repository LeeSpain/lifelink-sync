import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface EmailCampaignRequest {
  action: 'create_campaign' | 'queue_emails' | 'get_recipients';
  content_id?: string;
  campaign_data?: any;
  target_criteria?: any;
}

interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, content_id, campaign_data, target_criteria }: EmailCampaignRequest = await req.json();

    console.log('Email campaign creator action:', action);

    switch (action) {
      case 'create_campaign':
        return await createEmailCampaign(content_id!, campaign_data);
      case 'queue_emails':
        return await queueEmailsForCampaign(content_id!, target_criteria);
      case 'get_recipients':
        return await getTargetRecipients(target_criteria);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in email-campaign-creator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

async function createEmailCampaign(contentId: string, campaignData: any) {
  console.log('Creating email campaign for content:', contentId);

  // Get the marketing content
  const { data: content, error: contentError } = await supabase
    .from('marketing_content')
    .select('*')
    .eq('id', contentId)
    .single();

  if (contentError) throw contentError;
  if (!content) throw new Error('Content not found');

  // Generate email template from content
  const emailTemplate = await generateEmailTemplate(content);

  // Create email campaign record
  const { data: campaign, error: campaignError } = await supabase
    .from('email_campaigns')
    .insert({
      content_id: contentId,
      name: campaignData?.name || content.title || 'Untitled Campaign',
      subject: emailTemplate.subject,
      content: emailTemplate.htmlBody,
      text_content: emailTemplate.textBody,
      status: 'draft',
      created_by: campaignData?.created_by,
      metadata: {
        original_content_type: content.content_type,
        platform: content.platform,
        auto_generated: true,
        generation_timestamp: new Date().toISOString()
      },
      sender_email: campaignData?.sender_email || 'noreply@lifelink-sync.com',
      sender_name: campaignData?.sender_name || 'LifeLink Sync Team',
      tracking_enabled: true
    })
    .select()
    .single();

  if (campaignError) throw campaignError;

  console.log('Email campaign created:', campaign.id);

  return new Response(
    JSON.stringify({ 
      success: true, 
      campaign_id: campaign.id,
      campaign: campaign
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function queueEmailsForCampaign(contentId: string, targetCriteria: any = {}) {
  console.log('Queueing emails for campaign, content:', contentId);

  // Get the email campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('content_id', contentId)
    .single();

  if (campaignError) throw campaignError;
  if (!campaign) throw new Error('Email campaign not found');

  // Get target recipients
  const recipients = await getTargetRecipients(targetCriteria);

  console.log(`Found ${recipients.length} target recipients`);

  // Create email queue entries
  const emailsToQueue = recipients.map(recipient => ({
    campaign_id: campaign.id,
    recipient_email: recipient.email,
    recipient_user_id: recipient.user_id,
    subject: personalizeSubject(campaign.subject, recipient),
    body: personalizeEmailBody(campaign.content, recipient),
    status: 'pending',
    priority: targetCriteria?.priority || 5,
    scheduled_at: targetCriteria?.scheduled_at || new Date().toISOString()
  }));

  // Insert emails in batches to avoid timeout
  const batchSize = 100;
  let totalQueued = 0;

  for (let i = 0; i < emailsToQueue.length; i += batchSize) {
    const batch = emailsToQueue.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('email_queue')
      .insert(batch)
      .select('id');

    if (error) {
      console.error('Error queueing batch:', error);
      continue;
    }

    totalQueued += data?.length || 0;
  }

  // Update campaign with recipient count
  await supabase
    .from('email_campaigns')
    .update({ 
      recipient_count: totalQueued,
      status: totalQueued > 0 ? 'queued' : 'failed'
    })
    .eq('id', campaign.id);

  console.log(`Queued ${totalQueued} emails for campaign`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      emails_queued: totalQueued,
      campaign_id: campaign.id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getTargetRecipients(criteria: any = {}): Promise<any[]> {
  console.log('Getting target recipients with criteria:', criteria);

  const recipients: any[] = [];

  // Get subscribers if targeting subscribers
  if (criteria.include_subscribers !== false) {
    const { data: subscribers, error: subError } = await supabase
      .from('subscribers')
      .select('email, user_id, subscription_tier')
      .eq('subscribed', true);

    if (!subError && subscribers) {
      recipients.push(...subscribers.map(sub => ({
        email: sub.email,
        user_id: sub.user_id,
        source: 'subscriber',
        tier: sub.subscription_tier
      })));
    }
  }

  // Get users from profiles if targeting users
  if (criteria.include_users !== false) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, role, country_code');

    if (!profileError && profiles) {
      // Get emails from auth.users via service role
      for (const profile of profiles) {
        try {
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id);
          
          if (!authError && authUser.user?.email) {
            recipients.push({
              email: authUser.user.email,
              user_id: profile.user_id,
              first_name: profile.first_name,
              last_name: profile.last_name,
              role: profile.role,
              country_code: profile.country_code,
              source: 'user'
            });
          }
        } catch (error) {
          console.error('Error getting user email:', error);
        }
      }
    }
  }

  // Apply filters
  let filteredRecipients = recipients;

  if (criteria.role_filter) {
    filteredRecipients = filteredRecipients.filter(r => r.role === criteria.role_filter);
  }

  if (criteria.country_filter) {
    filteredRecipients = filteredRecipients.filter(r => r.country_code === criteria.country_filter);
  }

  if (criteria.exclude_roles) {
    filteredRecipients = filteredRecipients.filter(r => !criteria.exclude_roles.includes(r.role));
  }

  // Remove duplicates by email
  const uniqueRecipients = filteredRecipients.filter((recipient, index, self) => 
    index === self.findIndex(r => r.email === recipient.email)
  );

  console.log(`Found ${uniqueRecipients.length} unique target recipients`);
  
  return uniqueRecipients;
}

async function generateEmailTemplate(content: any): Promise<EmailTemplate> {
  console.log('Generating email template for content type:', content.content_type);

  let subject = content.title || 'Newsletter Update';
  let htmlBody = '';
  let textBody = '';

  if (content.content_type === 'email_campaign') {
    // Already email content, use as-is
    subject = content.seo_title || content.title || subject;
    htmlBody = formatAsEmailHTML(content);
    textBody = formatAsEmailText(content);
  } else {
    // Convert blog/other content to email format
    subject = `New ${content.content_type.replace('_', ' ')}: ${content.title}`;
    htmlBody = convertContentToEmailHTML(content);
    textBody = convertContentToEmailText(content);
  }

  return { subject, htmlBody, textBody };
}

function formatAsEmailHTML(content: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title || 'Newsletter'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
        .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${content.title || 'Newsletter Update'}</h1>
        </div>
        <div class="content">
            ${content.image_url ? `<img src="${content.image_url}" alt="${content.featured_image_alt || 'Featured image'}" style="margin-bottom: 20px;">` : ''}
            ${content.body_text ? content.body_text.split('\n').map(p => `<p>${p}</p>`).join('') : '<p>Content coming soon...</p>'}
            ${content.hashtags && content.hashtags.length > 0 ? `<p><strong>Tags:</strong> ${content.hashtags.join(', ')}</p>` : ''}
        </div>
        <div class="footer">
            <p>Thank you for subscribing to our newsletter!</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{preferences_url}}">Update Preferences</a></p>
        </div>
    </div>
</body>
</html>`;
}

function formatAsEmailText(content: any): string {
  return `
${content.title || 'Newsletter Update'}

${content.body_text || 'Content coming soon...'}

${content.hashtags && content.hashtags.length > 0 ? `Tags: ${content.hashtags.join(', ')}` : ''}

---
Thank you for subscribing to our newsletter!
Unsubscribe: {{unsubscribe_url}}
Update Preferences: {{preferences_url}}
`;
}

function convertContentToEmailHTML(content: any): string {
  const excerpt = content.body_text ? content.body_text.substring(0, 200) + '...' : 'Check out our latest content!';
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title || 'New Content'}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; }
        .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Content Available!</h1>
        </div>
        <div class="content">
            <h2>${content.title}</h2>
            ${content.image_url ? `<img src="${content.image_url}" alt="${content.featured_image_alt || 'Featured image'}" style="margin-bottom: 20px;">` : ''}
            <p>${excerpt}</p>
            <p><a href="#" class="btn">Read Full Article</a></p>
            ${content.hashtags && content.hashtags.length > 0 ? `<p><strong>Tags:</strong> ${content.hashtags.join(', ')}</p>` : ''}
        </div>
        <div class="footer">
            <p>Thank you for subscribing to our newsletter!</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{preferences_url}}">Update Preferences</a></p>
        </div>
    </div>
</body>
</html>`;
}

function convertContentToEmailText(content: any): string {
  const excerpt = content.body_text ? content.body_text.substring(0, 200) + '...' : 'Check out our latest content!';
  
  return `
New Content Available!

${content.title}

${excerpt}

Read more at: [Link will be added]

${content.hashtags && content.hashtags.length > 0 ? `Tags: ${content.hashtags.join(', ')}` : ''}

---
Thank you for subscribing to our newsletter!
Unsubscribe: {{unsubscribe_url}}
Update Preferences: {{preferences_url}}
`;
}

function personalizeSubject(subject: string, recipient: any): string {
  let personalized = subject;
  
  if (recipient.first_name) {
    personalized = personalized.replace(/{{name}}/gi, recipient.first_name);
    personalized = personalized.replace(/{{first_name}}/gi, recipient.first_name);
  }
  
  if (recipient.last_name) {
    personalized = personalized.replace(/{{last_name}}/gi, recipient.last_name);
  }
  
  personalized = personalized.replace(/{{email}}/gi, recipient.email);
  
  return personalized;
}

function personalizeEmailBody(body: string, recipient: any): string {
  let personalized = body;
  
  if (recipient.first_name) {
    personalized = personalized.replace(/{{name}}/gi, recipient.first_name);
    personalized = personalized.replace(/{{first_name}}/gi, recipient.first_name);
  }
  
  if (recipient.last_name) {
    personalized = personalized.replace(/{{last_name}}/gi, recipient.last_name);
  }
  
  personalized = personalized.replace(/{{email}}/gi, recipient.email);
  
  // Add unsubscribe and preferences URLs
  const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || '';
  personalized = personalized.replace(/{{unsubscribe_url}}/gi, `${baseUrl}/unsubscribe?email=${encodeURIComponent(recipient.email)}`);
  personalized = personalized.replace(/{{preferences_url}}/gi, `${baseUrl}/preferences?email=${encodeURIComponent(recipient.email)}`);
  
  return personalized;
}

serve(handler);