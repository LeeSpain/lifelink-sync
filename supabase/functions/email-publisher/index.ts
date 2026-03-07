import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const serviceSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, { 
      auth: { persistSession: false } 
    });

    const { action, contentId, campaignData } = await req.json();

    switch (action) {
      case 'create_campaign':
        return await createEmailCampaign(contentId, campaignData, serviceSupabase);
      case 'send_campaign':
        return await sendEmailCampaign(contentId, serviceSupabase);
      case 'schedule_campaign':
        return await scheduleEmailCampaign(contentId, campaignData, serviceSupabase);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Email publisher error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createEmailCampaign(contentId: string, campaignData: any, supabase: any) {
  console.log('Creating email campaign for content:', contentId);

  // Get content details
  const { data: content, error: fetchError } = await supabase
    .from('marketing_content')
    .select('*')
    .eq('id', contentId)
    .single();

  if (fetchError) throw fetchError;

  // Create email campaign
  const campaign = {
    content_id: contentId,
    name: campaignData.name || `Campaign: ${content.title}`,
    subject: campaignData.subject || content.title,
    from_email: campaignData.from_email || 'noreply@example.com',
    from_name: campaignData.from_name || 'Marketing Team',
    html_content: generateEmailHTML(content),
    text_content: generateEmailText(content),
    target_segments: campaignData.target_segments || ['all'],
    status: 'draft',
    created_at: new Date().toISOString()
  };

  const { data: insertedCampaign, error: insertError } = await supabase
    .from('email_campaigns')
    .insert(campaign)
    .select()
    .single();

  if (insertError) throw insertError;

  return new Response(JSON.stringify({
    success: true,
    campaign: insertedCampaign
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function sendEmailCampaign(contentId: string, supabase: any) {
  console.log('Sending email campaign for content:', contentId);

  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('content_id', contentId)
    .single();

  if (campaignError) throw campaignError;

  // Get subscribers based on target segments
  let subscribersQuery = supabase
    .from('subscribers')
    .select('email, user_id')
    .eq('subscribed', true);

  // Apply segmentation if specified
  if (campaign.target_segments && !campaign.target_segments.includes('all')) {
    subscribersQuery = subscribersQuery.in('subscription_tier', campaign.target_segments);
  }

  const { data: subscribers, error: subscribersError } = await subscribersQuery;
  if (subscribersError) throw subscribersError;

  if (!subscribers || subscribers.length === 0) {
    throw new Error('No active subscribers found');
  }

  // Send emails in batches
  const batchSize = 50;
  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    
    for (const subscriber of batch) {
      try {
        // Personalize content if needed
        const personalizedContent = personalizeEmailContent(
          campaign.html_content,
          campaign.text_content,
          subscriber
        );

        const emailResponse = await resend.emails.send({
          from: `${campaign.from_name} <${campaign.from_email}>`,
          to: [subscriber.email],
          subject: campaign.subject,
          html: personalizedContent.html,
          text: personalizedContent.text,
        });

        // Add to email queue for tracking
        await supabase
          .from('email_queue')
          .insert({
            campaign_id: campaign.id,
            recipient_email: subscriber.email,
            recipient_user_id: subscriber.user_id,
            subject: campaign.subject,
            body: personalizedContent.html,
            status: 'sent',
            sent_at: new Date().toISOString()
          });

        sentCount++;
        console.log(`Email sent to ${subscriber.email}`);

      } catch (emailError) {
        console.error(`Failed to send email to ${subscriber.email}:`, emailError);
        
        // Log failed email
        await supabase
          .from('email_queue')
          .insert({
            campaign_id: campaign.id,
            recipient_email: subscriber.email,
            recipient_user_id: subscriber.user_id,
            subject: campaign.subject,
            body: personalizedContent?.html || campaign.html_content,
            status: 'failed',
            error_message: emailError.message
          });

        failedCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Update campaign status
  await supabase
    .from('email_campaigns')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      recipients_count: subscribers.length,
      sent_count: sentCount,
      failed_count: failedCount
    })
    .eq('id', campaign.id);

  // Update content status
  await supabase
    .from('marketing_content')
    .update({
      status: 'published',
      posted_at: new Date().toISOString()
    })
    .eq('id', contentId);

  return new Response(JSON.stringify({
    success: true,
    sent_count: sentCount,
    failed_count: failedCount,
    total_recipients: subscribers.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function scheduleEmailCampaign(contentId: string, campaignData: any, supabase: any) {
  const { scheduled_time } = campaignData;

  // Add to email queue for scheduled sending
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('content_id', contentId)
    .single();

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  await supabase
    .from('email_campaigns')
    .update({
      status: 'scheduled',
      scheduled_at: scheduled_time
    })
    .eq('id', campaign.id);

  return new Response(JSON.stringify({
    success: true,
    message: 'Campaign scheduled successfully',
    scheduled_time
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function generateEmailHTML(content: any): string {
  const sections = content.content_sections || {};
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .content { margin-bottom: 30px; }
    .cta { text-align: center; margin: 30px 0; }
    .cta-button { 
      background: #007bff; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 5px; 
      display: inline-block; 
    }
    .footer { text-align: center; font-size: 12px; color: #666; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${content.title}</h1>
      ${content.image_url ? `<img src="${content.image_url}" alt="${content.featured_image_alt || content.title}" style="max-width: 100%; height: auto;">` : ''}
    </div>
    
    <div class="content">
      ${sections.introduction ? `<p class="lead">${sections.introduction}</p>` : ''}
      
      ${content.body_text ? content.body_text.split('\n\n').map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('') : ''}
      
      ${sections.benefits ? `
        <h2>Key Benefits:</h2>
        <ul>
          ${sections.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
    
    ${sections.cta ? `
      <div class="cta">
        <h3>${sections.cta.title || 'Ready to Get Started?'}</h3>
        ${sections.cta.description ? `<p>${sections.cta.description}</p>` : ''}
        ${sections.cta.button_text ? `<a href="${sections.cta.url || '#'}" class="cta-button">${sections.cta.button_text}</a>` : ''}
      </div>
    ` : ''}
    
    <div class="footer">
      <p>Thank you for subscribing to our newsletter!</p>
      <p><a href="{unsubscribe_url}">Unsubscribe</a> | <a href="{preferences_url}">Update Preferences</a></p>
    </div>
  </div>
</body>
</html>`;
}

function generateEmailText(content: any): string {
  const sections = content.content_sections || {};
  let text = `${content.title}\n\n`;
  
  if (sections.introduction) {
    text += `${sections.introduction}\n\n`;
  }
  
  if (content.body_text) {
    text += `${content.body_text}\n\n`;
  }
  
  if (sections.benefits) {
    text += 'Key Benefits:\n';
    sections.benefits.forEach(benefit => {
      text += `• ${benefit}\n`;
    });
    text += '\n';
  }
  
  if (sections.cta) {
    text += `${sections.cta.title || 'Ready to Get Started?'}\n`;
    if (sections.cta.description) {
      text += `${sections.cta.description}\n`;
    }
    if (sections.cta.url) {
      text += `Visit: ${sections.cta.url}\n`;
    }
    text += '\n';
  }
  
  text += 'Thank you for subscribing!\n';
  text += 'Unsubscribe: {unsubscribe_url}';
  
  return text;
}

function personalizeEmailContent(htmlContent: string, textContent: string, subscriber: any) {
  // Replace placeholders with subscriber data
  const personalizedHtml = htmlContent
    .replace('{unsubscribe_url}', `https://example.com/unsubscribe/${subscriber.user_id}`)
    .replace('{preferences_url}', `https://example.com/preferences/${subscriber.user_id}`);
    
  const personalizedText = textContent
    .replace('{unsubscribe_url}', `https://example.com/unsubscribe/${subscriber.user_id}`)
    .replace('{preferences_url}', `https://example.com/preferences/${subscriber.user_id}`);
    
  return {
    html: personalizedHtml,
    text: personalizedText
  };
}