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
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response('Invalid invitation link', { status: 400 });
    }

    const supabaseServiceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get connection by invite token
    const { data: connection, error: connectionError } = await supabaseServiceClient
      .from('connections')
      .select('*')
      .eq('invite_token', token)
      .eq('status', 'pending')
      .single();

    if (connectionError || !connection) {
      return new Response('Invalid or expired invitation', { status: 404 });
    }

    // Check if user is authenticated
    const authHeader = req.headers.get('Authorization');
    let user = null;

    if (authHeader) {
      const { data: { user: authUser } } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      user = authUser;
    }

    // If POST request, accept the invitation
    if (req.method === 'POST') {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Must be logged in to accept invitation' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update connection with user ID and set as active
      const { data: updatedConnection, error: updateError } = await supabaseServiceClient
        .from('connections')
        .update({
          contact_user_id: user.id,
          status: 'active',
          accepted_at: new Date().toISOString()
        })
        .eq('id', connection.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error accepting invitation:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to accept invitation' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create circle permissions if this is a family circle invitation
      if (connection.type === 'family_circle') {
        await supabaseServiceClient
          .from('circle_permissions')
          .insert({
            owner_id: connection.owner_id,
            family_user_id: user.id,
            can_view_history: true,
            can_view_devices: true,
            can_view_location: true
          });
      }

      // Send confirmation emails to both parties
      try {
        const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
        
        // Get both users' names
        const { data: profiles } = await supabaseServiceClient
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', [user.id, connection.owner_id]);

        const accepterProfile = profiles?.find(p => p.user_id === user.id);
        const inviterProfile = profiles?.find(p => p.user_id === connection.owner_id);
        
        const accepterName = accepterProfile ? 
          `${accepterProfile.first_name || ''} ${accepterProfile.last_name || ''}`.trim() || 'Someone' : 'Someone';
        
        const inviterName = inviterProfile ? 
          `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim() || 'Someone' : 'Someone';

        // Email to the person who accepted
        const welcomeEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Family Circle</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 600;">Welcome!</h1>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <p style="margin: 0 0 16px; font-size: 16px;">Hi ${accepterName}!</p>
                  <p style="margin: 0 0 16px; font-size: 16px;">
                    You've successfully joined <strong>${inviterName}'s</strong> ${connection.type === 'family_circle' ? 'Family Circle' : 'emergency contact network'}.
                  </p>
                  <p style="margin: 0 0 16px; font-size: 16px;">
                    You can now access your dashboard to manage settings and stay connected with your family.
                  </p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${Deno.env.get('APP_URL') || 'https://a856a70f-639b-4212-b411-d2cdb524d754.lovableproject.com'}/member-dashboard" 
                     style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                    Go to Dashboard
                  </a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        // Email to the person who sent the invitation
        const notificationEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation Accepted</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: #1e293b; margin: 0; font-size: 24px; font-weight: 600;">Invitation Accepted!</h1>
                </div>
                
                <div style="margin-bottom: 24px;">
                  <p style="margin: 0 0 16px; font-size: 16px;">Hi ${inviterName}!</p>
                  <p style="margin: 0 0 16px; font-size: 16px;">
                    Great news! <strong>${accepterName}</strong> has accepted your invitation to join your ${connection.type === 'family_circle' ? 'Family Circle' : 'emergency contact network'}.
                  </p>
                  <p style="margin: 0 0 16px; font-size: 16px;">
                    They're now connected and can receive emergency notifications.
                  </p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${Deno.env.get('APP_URL') || 'https://a856a70f-639b-4212-b411-d2cdb524d754.lovableproject.com'}/member-dashboard/connections" 
                     style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                    View Connections
                  </a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send welcome email to accepter
        await resend.emails.send({
          from: 'Emergency Contacts <onboarding@resend.dev>',
          to: [connection.invite_email],
          subject: `Welcome to ${inviterName}'s ${connection.type === 'family_circle' ? 'Family Circle' : 'Emergency Contacts'}`,
          html: welcomeEmailHtml,
        });

        // Send notification to inviter
        const { data: inviterUser } = await supabaseServiceClient.auth.admin.getUserById(connection.owner_id);
        if (inviterUser?.user?.email) {
          await resend.emails.send({
            from: 'Emergency Contacts <onboarding@resend.dev>',
            to: [inviterUser.user.email],
            subject: `${accepterName} accepted your invitation`,
            html: notificationEmailHtml,
          });
        }

        console.log('Confirmation emails sent successfully');
      } catch (emailError) {
        console.error('Error sending confirmation emails:', emailError);
        // Continue with success even if emails fail
      }

      return new Response(JSON.stringify({ 
        success: true,
        connection: updatedConnection,
        redirect_url: '/member-dashboard'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET request - return invitation details
    return new Response(JSON.stringify({
      valid: true,
      connection: {
        type: connection.type,
        relationship: connection.relationship,
        invite_email: connection.invite_email,
        invited_at: connection.invited_at
      },
      requires_auth: !user
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in connections-accept:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});