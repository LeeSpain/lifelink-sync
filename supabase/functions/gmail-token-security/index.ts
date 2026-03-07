import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, tokenData } = await req.json()

    switch (action) {
      case 'encrypt_store': {
        // Simple encryption using built-in crypto for demo
        // In production, use proper encryption service
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()
        
        const key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        )
        
        const iv = crypto.getRandomValues(new Uint8Array(12))
        const encodedData = encoder.encode(JSON.stringify(tokenData))
        
        const encryptedData = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          encodedData
        )

        // Store the encrypted token (in production, store key securely)
        const { error: insertError } = await supabase
          .from('gmail_tokens')
          .upsert({
            user_id: user.id,
            access_token: 'ENCRYPTED',
            refresh_token: 'ENCRYPTED',
            encrypted_access_token: Array.from(new Uint8Array(encryptedData)).join(','),
            expires_at: tokenData.expires_at,
            email_address: tokenData.email_address
          })

        if (insertError) throw insertError

        // Log the security event
        await supabase
          .from('gmail_token_access_log')
          .insert({
            user_id: user.id,
            action: 'token_encrypted_stored',
            ip_address: req.headers.get('x-forwarded-for'),
            user_agent: req.headers.get('user-agent')
          })

        return new Response(
          JSON.stringify({ success: true, message: 'Token encrypted and stored securely' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'audit_access': {
        // Get recent token access logs for the user
        const { data: logs, error: logError } = await supabase
          .from('gmail_token_access_log')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (logError) throw logError

        return new Response(
          JSON.stringify({ logs }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'revoke_all': {
        // Revoke all Gmail tokens for the user
        const { error: deleteError } = await supabase
          .from('gmail_tokens')
          .delete()
          .eq('user_id', user.id)

        if (deleteError) throw deleteError

        // Log the revocation
        await supabase
          .from('gmail_token_access_log')
          .insert({
            user_id: user.id,
            action: 'all_tokens_revoked',
            ip_address: req.headers.get('x-forwarded-for'),
            user_agent: req.headers.get('user-agent')
          })

        return new Response(
          JSON.stringify({ success: true, message: 'All Gmail tokens revoked' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Gmail token security error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})