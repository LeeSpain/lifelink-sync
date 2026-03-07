import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { action, content_id, platform, user_id, immediate = false } = await req.json();

    switch (action) {
      case 'publish_now':
        return await publishContent(content_id, platform, user_id, supabaseClient);
      case 'schedule_content':
        return await scheduleContent(content_id, platform, user_id, supabaseClient);
      case 'process_queue':
        return await processPublishingQueue(supabaseClient);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Social media publisher error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function publishContent(contentId: string, platform: string, userId: string, supabase: any) {
  try {
    // Get content details
    const { data: content, error: contentError } = await supabase
      .from('marketing_content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      throw new Error('Content not found');
    }

    // Get OAuth credentials
    const { data: oauth, error: oauthError } = await supabase
      .from('social_media_oauth')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('connection_status', 'active')
      .single();

    if (oauthError || !oauth) {
      throw new Error(`No active ${platform} connection found`);
    }

    // Check if token needs refresh
    if (oauth.token_expires_at && new Date(oauth.token_expires_at) < new Date()) {
      // Token refresh logic would go here
      throw new Error('Access token expired, please reconnect your account');
    }

    // Publish to platform
    const publishResult = await publishToPlatform(platform, content, oauth);

    // Update content status
    await supabase
      .from('marketing_content')
      .update({ 
        status: 'published', 
        posted_at: new Date().toISOString() 
      })
      .eq('id', contentId);

    // Add to posting queue record
    await supabase
      .from('social_media_posting_queue')
      .insert({
        content_id: contentId,
        platform,
        oauth_account_id: oauth.id,
        scheduled_time: new Date().toISOString(),
        posted_at: new Date().toISOString(),
        platform_post_id: publishResult.post_id,
        status: 'completed'
      });

    return new Response(JSON.stringify({
      success: true,
      platform,
      post_id: publishResult.post_id,
      post_url: publishResult.post_url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Publish content error:', error);
    
    // Log failed attempt
    await supabase
      .from('social_media_posting_queue')
      .insert({
        content_id: contentId,
        platform,
        scheduled_time: new Date().toISOString(),
        status: 'failed',
        error_message: error.message
      });

    throw error;
  }
}

async function publishToPlatform(platform: string, content: any, oauth: any) {
  switch (platform) {
    case 'facebook':
      return await publishToFacebook(content, oauth);
    case 'instagram':
      return await publishToInstagram(content, oauth);
    case 'linkedin':
      return await publishToLinkedIn(content, oauth);
    case 'twitter':
      return await publishToTwitter(content, oauth);
    default:
      throw new Error(`Publishing to ${platform} not implemented`);
  }
}

async function publishToFacebook(content: any, oauth: any) {
  const postData = {
    message: content.body_text,
    access_token: oauth.access_token
  };

  // Add image if available
  if (content.image_url) {
    postData.picture = content.image_url;
  }

  const response = await fetch(`https://graph.facebook.com/v18.0/me/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || 'Facebook publish failed');
  }

  return {
    post_id: result.id,
    post_url: `https://facebook.com/${result.id}`
  };
}

async function publishToInstagram(content: any, oauth: any) {
  // Instagram Basic Display API doesn't allow posting
  // This would require Instagram Business API and additional setup
  throw new Error('Instagram publishing requires Instagram Business API setup');
}

async function publishToLinkedIn(content: any, oauth: any) {
  const postData = {
    author: `urn:li:person:${oauth.platform_user_id}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content.body_text
        },
        shareMediaCategory: 'NONE'
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${oauth.access_token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify(postData)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'LinkedIn publish failed');
  }

  return {
    post_id: result.id,
    post_url: `https://linkedin.com/feed/update/${result.id}`
  };
}

async function publishToTwitter(content: any, oauth: any) {
  const postData = {
    text: content.body_text.substring(0, 280) // Twitter character limit
  };

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${oauth.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail || 'Twitter publish failed');
  }

  return {
    post_id: result.data.id,
    post_url: `https://twitter.com/user/status/${result.data.id}`
  };
}

async function scheduleContent(contentId: string, platform: string, userId: string, supabase: any) {
  // Get content and scheduled time
  const { data: content } = await supabase
    .from('marketing_content')
    .select('*')
    .eq('id', contentId)
    .single();

  if (!content || !content.scheduled_time) {
    throw new Error('Content not found or no scheduled time set');
  }

  // Add to publishing queue
  const { error } = await supabase
    .from('social_media_posting_queue')
    .insert({
      content_id: contentId,
      platform,
      scheduled_time: content.scheduled_time,
      status: 'scheduled'
    });

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    message: 'Content scheduled for publishing'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function processPublishingQueue(supabase: any) {
  // Get due items from queue
  const { data: queueItems, error } = await supabase
    .from('social_media_posting_queue')
    .select(`
      *,
      marketing_content:content_id(*),
      oauth_account:oauth_account_id(*)
    `)
    .eq('status', 'scheduled')
    .lte('scheduled_time', new Date().toISOString())
    .limit(10);

  if (error) throw error;

  const results = [];

  for (const item of queueItems || []) {
    try {
      // Publish content
      const publishResult = await publishToPlatform(
        item.platform,
        item.marketing_content,
        item.oauth_account
      );

      // Update queue item
      await supabase
        .from('social_media_posting_queue')
        .update({
          status: 'completed',
          posted_at: new Date().toISOString(),
          platform_post_id: publishResult.post_id
        })
        .eq('id', item.id);

      // Update content
      await supabase
        .from('marketing_content')
        .update({
          status: 'published',
          posted_at: new Date().toISOString()
        })
        .eq('id', item.content_id);

      results.push({ id: item.id, status: 'success' });

    } catch (error) {
      console.error(`Failed to publish queue item ${item.id}:`, error);
      
      // Update queue item with error
      await supabase
        .from('social_media_posting_queue')
        .update({
          status: item.retry_count >= item.max_retries ? 'failed' : 'scheduled',
          retry_count: item.retry_count + 1,
          error_message: error.message,
          scheduled_time: new Date(Date.now() + 300000).toISOString() // Retry in 5 minutes
        })
        .eq('id', item.id);

      results.push({ id: item.id, status: 'failed', error: error.message });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    processed: results.length,
    results
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}