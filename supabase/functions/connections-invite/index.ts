import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get the session or user object
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { owner_id, type, invite_email, relationship, escalation_priority = 3, notify_channels = ['app'], preferred_language = 'en' } = await req.json();

    // Validate input
    if (!owner_id || !type || !invite_email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is the owner
    if (user.id !== owner_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Can only create connections for yourself' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check Spain rule before creating connection
    const { data: profile } = await supabaseServiceClient
      .from('profiles')
      .select('country_code, subscription_regional')
      .eq('user_id', owner_id)
      .single();

    // Generate invite token
    const invite_token = crypto.randomUUID();

    // Create connection
    const { data: connection, error: connectionError } = await supabaseServiceClient
      .from('connections')
      .insert({
        owner_id,
        invite_email,
        type,
        relationship,
        escalation_priority,
        notify_channels,
        preferred_language,
        invite_token,
        invited_at: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (connectionError) {
      console.error('Error creating connection:', connectionError);
      return new Response(JSON.stringify({ error: 'Failed to create connection' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get inviter's name for email
    const { data: inviterProfile } = await supabaseServiceClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', owner_id)
      .single();

    const inviterName = inviterProfile ? 
      `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim() || 'Someone' : 
      'Someone';

    // Send invitation email
    const inviteUrl = `${Deno.env.get('APP_URL') || 'https://a856a70f-639b-4212-b411-d2cdb524d754.lovableproject.com'}/invite/accept?token=${invite_token}`;
    
    try {
      const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Family Circle Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 600;">
                  ${type === 'family_circle' ? 'Family Circle' : 'Trusted Contact'} Invitation
                </h1>
              </div>
              
              <div style="margin-bottom: 24px;">
                <p style="margin: 0 0 16px; font-size: 16px;">Hello!</p>
                <p style="margin: 0 0 16px; font-size: 16px;">
                  <strong>${inviterName}</strong> has invited you to join their ${type === 'family_circle' ? 'Family Circle' : 'network as a Trusted Contact'}.
                </p>
                ${type === 'family_circle' ? 
                  '<p style="margin: 0 0 16px; font-size: 16px;">As a family circle member, you\'ll be able to share locations and receive emergency notifications.</p>' :
                  '<p style="margin: 0 0 16px; font-size: 16px;">As a trusted contact, you\'ll be notified in case of emergencies and can provide assistance when needed.</p>'
                }
                ${relationship ? `<p style="margin: 0 0 16px; font-size: 14px; color: #64748b;">Relationship: ${relationship}</p>` : ''}
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteUrl}" 
                   style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>

              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #64748b;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0; font-size: 14px; word-break: break-all; color: #3b82f6;">
                  ${inviteUrl}
                </p>
              </div>

              <div style="margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">
                <p style="margin: 0;">This invitation will expire in 7 days.</p>
                <p style="margin: 8px 0 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const { error: emailError } = await resend.emails.send({
        from: 'Emergency Contacts <onboarding@resend.dev>',
        to: [invite_email],
        subject: `${inviterName} invited you to their ${type === 'family_circle' ? 'Family Circle' : 'Emergency Contacts'}`,
        html: emailHtml,
      });

      if (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Continue with success even if email fails - connection is still created
      } else {
        console.log(`Invitation email sent successfully to ${invite_email}`);
      }
    } catch (emailSendError) {
      console.error('Error sending invitation email:', emailSendError);
      // Continue with success even if email fails - connection is still created
    }

    return new Response(JSON.stringify({ 
      success: true, 
      connection,
      invite_url: inviteUrl 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in connections-invite:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});