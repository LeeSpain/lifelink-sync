import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    // Initialize Supabase clients
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { connection_id } = await req.json()

    if (!connection_id) {
      return new Response(
        JSON.stringify({ error: 'Connection ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch the connection to verify ownership and type
    const { data: connection, error: fetchError } = await supabaseAdmin
      .from('connections')
      .select('*')
      .eq('id', connection_id)
      .eq('owner_id', user.id)
      .single()

    if (fetchError || !connection) {
      return new Response(
        JSON.stringify({ error: 'Connection not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (connection.type !== 'family_circle') {
      return new Response(
        JSON.stringify({ error: 'Only family circle connections can be demoted' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update the connection type to trusted_contact
    const { error: updateError } = await supabaseAdmin
      .from('connections')
      .update({ 
        type: 'trusted_contact',
        updated_at: new Date().toISOString()
      })
      .eq('id', connection_id)

    if (updateError) {
      throw updateError
    }

    // Remove associated permissions if connection is active
    if (connection.status === 'active' && connection.contact_user_id) {
      const { error: permissionsError } = await supabaseAdmin
        .from('circle_permissions')
        .delete()
        .eq('owner_id', user.id)
        .eq('family_user_id', connection.contact_user_id)

      if (permissionsError) {
        console.error('Error removing permissions:', permissionsError)
        // Don't fail the whole operation for this
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Connection demoted to trusted contact successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in connections-demote:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})