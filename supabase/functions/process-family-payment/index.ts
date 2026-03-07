import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-FAMILY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Processing family payment");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const { session_id } = await req.json();

    logStep("Processing session", { session_id });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }

    const inviteToken = session.metadata?.invite_token;
    const billingType = session.metadata?.billing_type;
    const customerEmail = session.customer_details?.email;

    logStep("Session retrieved", { inviteToken, billingType, customerEmail });

    if (!inviteToken) {
      throw new Error('No invite token found in session metadata');
    }

    // Find the family invite
    const { data: invite, error: inviteError } = await supabaseClient
      .from('family_invites')
      .select(`
        *,
        family_groups (
          owner_user_id,
          profiles!family_groups_owner_user_id_fkey (
            first_name,
            last_name
          )
        )
      `)
      .eq('invite_token', inviteToken)
      .single();

    if (inviteError || !invite) {
      throw new Error('Family invite not found');
    }

    logStep("Found family invite", { inviteId: invite.id });

    // Find the invitee user by email
    const { data: userData, error: userError } = await supabaseClient.auth.admin.listUsers();
    
    if (userError) {
      throw new Error('Failed to retrieve users');
    }

    const inviteeUser = userData.users.find(user => user.email === customerEmail);
    
    if (!inviteeUser) {
      throw new Error('Invitee user not found');
    }

    logStep("Found invitee user", { userId: inviteeUser.id });

    // Create emergency contact
    const { data: emergencyContact, error: contactError } = await supabaseClient
      .from('emergency_contacts')
      .insert({
        user_id: invite.family_groups.owner_user_id,
        name: invite.invitee_name,
        phone: invite.phone,
        email: invite.invitee_email,
        type: 'family',
        relationship: invite.relationship,
        priority: 1
      })
      .select()
      .single();

    if (contactError) {
      throw new Error(`Failed to create emergency contact: ${contactError.message}`);
    }

    logStep("Created emergency contact", { contactId: emergencyContact.id });

    // Create family membership
    const { data: membership, error: membershipError } = await supabaseClient
      .from('family_memberships')
      .insert({
        group_id: invite.group_id,
        user_id: inviteeUser.id,
        contact_id: emergencyContact.id,
        role: 'member',
        status: 'active',
        billing_type: billingType,
        stripe_subscription_id: session.subscription
      })
      .select()
      .single();

    if (membershipError) {
      throw new Error(`Failed to create family membership: ${membershipError.message}`);
    }

    logStep("Created family membership", { membershipId: membership.id });

    // Update invite status
    const { error: updateError } = await supabaseClient
      .from('family_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invite.id);

    if (updateError) {
      logStep("Warning: Failed to update invite status", { error: updateError.message });
    }

    const ownerProfile = invite.family_groups.profiles;
    const familyMemberName = ownerProfile ? 
      `${ownerProfile.first_name || ''} ${ownerProfile.last_name || ''}`.trim() : 
      'the family owner';

    logStep("Family payment processed successfully");

    return new Response(JSON.stringify({
      success: true,
      family_member_name: familyMemberName,
      membership_id: membership.id,
      contact_id: emergencyContact.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR processing family payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});