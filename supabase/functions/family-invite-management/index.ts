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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, invite_id, user_id } = await req.json()

    if (action === 'accept') {
      // Get the invite details
      const { data: invite, error: inviteError } = await supabaseClient
        .from('family_invites')
        .select('*')
        .eq('id', invite_id)
        .single()

      if (inviteError || !invite) {
        throw new Error('Invite not found')
      }

      if (invite.status !== 'pending') {
        throw new Error('Invite has already been processed')
      }

      if (new Date(invite.expires_at) < new Date()) {
        throw new Error('Invite has expired')
      }

      // Create family membership
      const { error: membershipError } = await supabaseClient
        .from('family_memberships')
        .insert({
          group_id: invite.group_id,
          user_id: user_id,
          role: 'member',
          status: 'active',
          invited_by: invite.inviter_user_id
        })

      if (membershipError) throw membershipError

      // Update invite status
      const { error: updateError } = await supabaseClient
        .from('family_invites')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invite_id)

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({ success: true, message: 'Invite accepted successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )

    } else if (action === 'decline') {
      // Update invite status to declined
      const { error: updateError } = await supabaseClient
        .from('family_invites')
        .update({
          status: 'declined'
        })
        .eq('id', invite_id)

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({ success: true, message: 'Invite declined' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})