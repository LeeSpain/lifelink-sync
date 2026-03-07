import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createHmac, randomBytes } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform-specific OAuth configurations
const OAUTH_CONFIGS = {
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,business_management'
  },
  instagram: {
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    scope: 'user_profile,user_media'
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scope: 'tweet.read tweet.write users.read'
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scope: 'w_member_social'
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly'
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    scope: 'user.info.basic,video.upload,video.list'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  try {
    const { platform, action, code, state } = await req.json();
    console.log(`OAuth Handler - Platform: ${platform}, Action: ${action}`);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Set auth for supabase client
    supabaseClient.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' });

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    if (action === 'initiate') {
      return await initiateOAuth(platform, user.id, supabaseClient);
    } else if (action === 'callback') {
      return await handleOAuthCallback(platform, code, state, supabaseClient);
    } else if (action === 'refresh') {
      return await refreshToken(platform, user.id, supabaseClient);
    } else {
      throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('OAuth Handler Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function initiateOAuth(platform: string, userId: string, supabase: any) {
  const config = OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS];
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  // Get platform configuration from database
  const { data: platformConfig } = await supabase
    .from('social_platform_configs')
    .select('*')
    .eq('platform', platform)
    .single();

  if (!platformConfig) {
    throw new Error(`Platform ${platform} not configured`);
  }

  // Generate state parameter for security
  const state = randomBytes(32).toString('hex');
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-oauth-handler`;

  // Store state in database for verification
  await supabase
    .from('social_media_accounts')
    .upsert({
      user_id: userId,
      platform,
      oauth_state: state,
      account_status: 'connecting'
    });

  // Build OAuth URL
  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set('client_id', platformConfig.client_id);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', config.scope);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  // Add platform-specific parameters
  if (platform === 'twitter') {
    authUrl.searchParams.set('code_challenge_method', 'S256');
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHmac('sha256', codeVerifier).digest('base64url');
    authUrl.searchParams.set('code_challenge', codeChallenge);
    
    // Store code verifier for later use
    await supabase
      .from('social_media_accounts')
      .update({ client_secret: codeVerifier })
      .eq('user_id', userId)
      .eq('platform', platform);
  }

  return new Response(
    JSON.stringify({ authUrl: authUrl.toString() }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleOAuthCallback(platform: string, code: string, state: string, supabase: any) {
  // Verify state parameter
  const { data: account } = await supabase
    .from('social_media_accounts')
    .select('*')
    .eq('oauth_state', state)
    .eq('platform', platform)
    .single();

  if (!account) {
    throw new Error('Invalid state parameter');
  }

  const config = OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS];
  const { data: platformConfig } = await supabase
    .from('social_platform_configs')
    .select('*')
    .eq('platform', platform)
    .single();

  // Exchange code for access token
  const tokenData = new FormData();
  tokenData.append('client_id', platformConfig.client_id);
  tokenData.append('client_secret', platformConfig.client_secret);
  tokenData.append('code', code);
  tokenData.append('grant_type', 'authorization_code');
  
  if (platform === 'twitter') {
    tokenData.append('code_verifier', account.client_secret);
  }

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    body: tokenData
  });

  if (!tokenResponse.ok) {
    throw new Error(`Token exchange failed: ${await tokenResponse.text()}`);
  }

  const tokens = await tokenResponse.json();
  
  // Get user info from platform
  const userInfo = await getPlatformUserInfo(platform, tokens.access_token);

  // Update account with tokens and user info
  await supabase
    .from('social_media_accounts')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
      platform_user_id: userInfo.id,
      account_name: userInfo.name || userInfo.username,
      follower_count: userInfo.follower_count || 0,
      account_status: 'connected',
      last_connected: new Date().toISOString(),
      oauth_state: null
    })
    .eq('id', account.id);

  return new Response(
    JSON.stringify({ success: true, account: userInfo }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function refreshToken(platform: string, userId: string, supabase: any) {
  const { data: account } = await supabase
    .from('social_media_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .single();

  if (!account || !account.refresh_token) {
    throw new Error('No refresh token available');
  }

  const config = OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS];
  const { data: platformConfig } = await supabase
    .from('social_platform_configs')
    .select('*')
    .eq('platform', platform)
    .single();

  const tokenData = new FormData();
  tokenData.append('client_id', platformConfig.client_id);
  tokenData.append('client_secret', platformConfig.client_secret);
  tokenData.append('refresh_token', account.refresh_token);
  tokenData.append('grant_type', 'refresh_token');

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    body: tokenData
  });

  if (!tokenResponse.ok) {
    throw new Error(`Token refresh failed: ${await tokenResponse.text()}`);
  }

  const tokens = await tokenResponse.json();

  // Update account with new tokens
  await supabase
    .from('social_media_accounts')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || account.refresh_token,
      token_expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
      last_sync_at: new Date().toISOString()
    })
    .eq('id', account.id);

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getPlatformUserInfo(platform: string, accessToken: string) {
  const endpoints = {
    facebook: 'https://graph.facebook.com/v18.0/me?fields=id,name',
    instagram: 'https://graph.instagram.com/me?fields=id,username',
    twitter: 'https://api.twitter.com/2/users/me?user.fields=public_metrics',
    linkedin: 'https://api.linkedin.com/v2/people/~?projection=(id,firstName,lastName)',
    youtube: 'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
    tiktok: 'https://open-api.tiktok.com/user/info/?fields=open_id,union_id,avatar_url,display_name,follower_count'
  };

  const endpoint = endpoints[platform as keyof typeof endpoints];
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${await response.text()}`);
  }

  const data = await response.json();
  
  // Normalize response format
  switch (platform) {
    case 'facebook':
    case 'instagram':
      return { id: data.id, name: data.name || data.username };
    case 'twitter':
      return { 
        id: data.data.id, 
        name: data.data.name,
        username: data.data.username,
        follower_count: data.data.public_metrics?.followers_count || 0
      };
    case 'linkedin':
      return { 
        id: data.id, 
        name: `${data.firstName.localized.en_US} ${data.lastName.localized.en_US}`
      };
    case 'youtube':
      return {
        id: data.items[0].id,
        name: data.items[0].snippet.title,
        follower_count: data.items[0].statistics.subscriberCount
      };
    case 'tiktok':
      return {
        id: data.data.user.open_id,
        name: data.data.user.display_name,
        follower_count: data.data.user.follower_count
      };
    default:
      return { id: data.id, name: data.name };
  }
}