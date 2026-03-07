import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { email, organization_id, role, language } = await req.json()

    console.log('Inviting regional user:', { email, organization_id, role, language })

    // Create the user invitation
    const { data: authData, error: authError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
      data: {
        organization_id,
        role,
        language,
        invited_as: 'regional_user'
      },
      redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'supabase.co')}/auth/v1/verify`
    })

    if (authError) {
      console.error('Auth invitation error:', authError)
      throw new Error(`Failed to send invitation: ${authError.message}`)
    }

    console.log('Auth invitation successful:', authData.user?.id)

    // Create organization_users record
    const { error: orgUserError } = await supabaseClient
      .from('organization_users')
      .insert([{
        user_id: authData.user.id,
        organization_id,
        role,
        language,
        is_active: true
      }])

    if (orgUserError) {
      console.error('Organization user creation error:', orgUserError)
      // Cleanup: delete the auth user if org user creation fails
      await supabaseClient.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Failed to create organization user: ${orgUserError.message}`)
    }

    console.log('Organization user created successfully')

    // Get organization details for email
    const { data: orgData } = await supabaseClient
      .from('organizations')
      .select('name, region')
      .eq('id', organization_id)
      .single()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User invited successfully',
        user_id: authData.user.id,
        organization: orgData?.name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Regional user invite error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to invite user',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})