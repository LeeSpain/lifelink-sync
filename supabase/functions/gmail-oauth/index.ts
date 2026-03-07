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

const GMAIL_CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
const GMAIL_CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");

interface OAuthRequest {
  action: "authorize" | "callback" | "refresh" | "revoke";
  code?: string;
  userId?: string;
  refreshToken?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, userId, refreshToken }: OAuthRequest = await req.json();

    console.log(`Gmail OAuth action: ${action}`);

    switch (action) {
      case "authorize":
        return await generateAuthUrl();
      
      case "callback":
        if (!code || !userId) {
          throw new Error("Missing authorization code or user ID");
        }
        return await handleCallback(code, userId);
      
      case "refresh":
        if (!refreshToken || !userId) {
          throw new Error("Missing refresh token or user ID");
        }
        return await refreshAccessToken(refreshToken, userId);
      
      case "revoke":
        if (!userId) {
          throw new Error("Missing user ID");
        }
        return await revokeAccess(userId);
      
      default:
        throw new Error("Invalid action");
    }

  } catch (error: any) {
    console.error("Error in gmail-oauth function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function generateAuthUrl() {
  const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-oauth`;
  const scope = "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.email";
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GMAIL_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  return new Response(JSON.stringify({ authUrl }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function handleCallback(code: string, userId: string) {
  const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-oauth`;
  
  // Exchange code for tokens
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID!,
      client_secret: GMAIL_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const tokens = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    throw new Error(`Token exchange failed: ${tokens.error_description || tokens.error}`);
  }

  // Get user email from Google
  const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      "Authorization": `Bearer ${tokens.access_token}`,
    },
  });

  const userInfo = await userInfoResponse.json();
  
  if (!userInfoResponse.ok) {
    throw new Error("Failed to get user info from Google");
  }

  // Calculate expiry time
  const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

  // Store tokens securely in database
  const { error: upsertError } = await supabase
    .from('gmail_tokens')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt.toISOString(),
      email_address: userInfo.email,
      scope: tokens.scope || "https://www.googleapis.com/auth/gmail.modify",
    }, {
      onConflict: 'user_id'
    });

  if (upsertError) {
    throw new Error(`Failed to store tokens: ${upsertError.message}`);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    email: userInfo.email,
    expiresAt: expiresAt.toISOString()
  }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function refreshAccessToken(refreshToken: string, userId: string) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID!,
      client_secret: GMAIL_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const tokens = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    throw new Error(`Token refresh failed: ${tokens.error_description || tokens.error}`);
  }

  // Calculate new expiry time
  const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

  // Update tokens in database
  const { error: updateError } = await supabase
    .from('gmail_tokens')
    .update({
      access_token: tokens.access_token,
      expires_at: expiresAt.toISOString(),
      // Keep existing refresh token if new one not provided
      ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
    })
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Failed to update tokens: ${updateError.message}`);
  }

  return new Response(JSON.stringify({ 
    success: true,
    accessToken: tokens.access_token,
    expiresAt: expiresAt.toISOString()
  }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function revokeAccess(userId: string) {
  // Get tokens from database
  const { data: tokenData, error: fetchError } = await supabase
    .from('gmail_tokens')
    .select('access_token, refresh_token')
    .eq('user_id', userId)
    .single();

  if (fetchError || !tokenData) {
    throw new Error("No Gmail tokens found for user");
  }

  // Revoke tokens with Google
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${tokenData.refresh_token}`, {
      method: "POST",
    });
  } catch (error) {
    console.warn("Failed to revoke tokens with Google:", error);
  }

  // Remove tokens from database
  const { error: deleteError } = await supabase
    .from('gmail_tokens')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    throw new Error(`Failed to remove tokens: ${deleteError.message}`);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(handler);
