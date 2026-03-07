import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FAMILY-INVITES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    if (req.method === "POST") {
      // Send family invite
      const { email, name, relationship } = await req.json();
      
      if (!email || !name) {
        throw new Error("Email and name are required");
      }

      // Create family invite record
      const { data: invite, error: inviteError } = await supabaseClient
        .from('family_invites')
        .insert({
          inviter_user_id: user.id,
          inviter_email: user.email,
          invitee_email: email,
          invitee_name: name,
          relationship: relationship || 'Family Member',
          status: 'pending',
          invite_token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      logStep("Family invite created", { inviteId: invite.id, inviteeEmail: email });

      // TODO: Send email invitation using Resend
      // For now, we'll just return the invite details
      
      return new Response(JSON.stringify({ 
        success: true, 
        invite: invite,
        message: `Invitation sent to ${email}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Get family members and pending invites
      const { data: familyMembers, error: membersError } = await supabaseClient
        .from('family_invites')
        .select('*')
        .eq('inviter_user_id', user.id)
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;

      logStep("Retrieved family members", { count: familyMembers?.length || 0 });

      return new Response(JSON.stringify({ familyMembers: familyMembers || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in family-invites", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});