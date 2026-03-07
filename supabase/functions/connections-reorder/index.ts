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
    const { updates } = await req.json()

    if (!updates || !Array.isArray(updates)) {
      return new Response(
        JSON.stringify({ error: 'Updates array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate updates format
    for (const update of updates) {
      if (!update.id || typeof update.priority !== 'number') {
        return new Response(
          JSON.stringify({ error: 'Each update must have id and priority' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Update priorities for each connection
    const updatePromises = updates.map(async (update) => {
      // Verify ownership before updating
      const { data: connection, error: checkError } = await supabaseAdmin
        .from('connections')
        .select('id')
        .eq('id', update.id)
        .eq('owner_id', user.id)
        .single()

      if (checkError || !connection) {
        throw new Error(`Connection ${update.id} not found or access denied`)
      }

      // Update the priority
      const { error: updateError } = await supabaseAdmin
        .from('connections')
        .update({ 
          escalation_priority: update.priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)

      if (updateError) {
        throw updateError
      }

      return { id: update.id, priority: update.priority }
    })

    const results = await Promise.all(updatePromises)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Connection priorities updated successfully',
        updated: results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in connections-reorder:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})