// Google Home / Google Actions Fulfillment Webhook
//
// Handles intents from Google Assistant / Google Home devices:
//   emergency  → triggers SOS via sos-trigger
//   status     → returns user's protection status
//   test       → confirms connection is working
//
// Account linking: user's Supabase access token is passed via
// the Google Actions account linking flow (OAuth 2.0).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoogleActionsRequest {
  handler?: { name: string };
  intent?: { name: string; params?: Record<string, { resolved?: string }> };
  scene?: { name: string };
  session?: { id: string; params?: Record<string, unknown> };
  user?: {
    locale: string;
    params?: { tokenPayload?: Record<string, unknown> };
    accountLinkingStatus?: string;
    verificationStatus?: string;
  };
}

function googleResponse(speech: string, expectUserResponse = false) {
  return {
    prompt: {
      override: false,
      firstSimple: {
        speech,
        text: speech,
      },
    },
    scene: expectUserResponse
      ? { name: "actions.scene.END_CONVERSATION" }
      : undefined,
    session: {
      params: {},
    },
  };
}

function accountLinkingResponse() {
  return {
    prompt: {
      override: false,
      firstSimple: {
        speech: "Please link your LifeLink Sync account in the Google Home app to use this action.",
        text: "Please link your LifeLink Sync account to continue.",
      },
    },
    user: {
      params: {
        accountLinkingRequired: true,
      },
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as GoogleActionsRequest;
    const handlerName = body.handler?.name || body.intent?.name || "";

    console.log(`Google Home webhook: handler=${handlerName}`);

    // Extract access token from Authorization header (Google sends it as Bearer token)
    const authHeader = req.headers.get("authorization") || "";
    const accessToken = authHeader.replace("Bearer ", "").trim();

    // Handle main invocation (no specific intent)
    if (handlerName === "actions.handler.MAIN" || handlerName === "main") {
      return new Response(
        JSON.stringify(
          googleResponse(
            "Welcome to LifeLink Sync. You can say emergency to trigger an alert, check my status, or test my system.",
          ),
        ),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // For all other handlers, require account linking
    if (!accessToken) {
      return new Response(JSON.stringify(accountLinkingResponse()), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the access token
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const { data: userData, error: authErr } = await supabase.auth.getUser(accessToken);
    if (authErr || !userData?.user) {
      console.error("Invalid Google Home access token:", authErr);
      return new Response(JSON.stringify(accountLinkingResponse()), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Handle emergency intent
    if (handlerName === "emergency" || handlerName === "EmergencyIntent") {
      console.log(`Google Home emergency for user ${userId}`);

      const triggerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sos-trigger`;
      const integrationKey = Deno.env.get("INTEGRATION_API_KEY") || "";

      const sosResp = await fetch(triggerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-integration-key": integrationKey,
        },
        body: JSON.stringify({ user_id: userId, source: "google_home" }),
      });

      if (sosResp.ok) {
        return new Response(
          JSON.stringify(
            googleResponse(
              "Emergency alert activated! Your emergency contacts are being notified with your location. Stay safe, help is on the way.",
            ),
          ),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } else {
        const errData = await sosResp.json();
        console.error("SOS trigger failed from Google Home:", errData);
        return new Response(
          JSON.stringify(
            googleResponse(
              "I was unable to activate the emergency alert. Please try again or use your phone to trigger SOS directly.",
            ),
          ),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Handle status intent
    if (handlerName === "status" || handlerName === "StatusIntent") {
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("first_name, emergency_contacts")
        .eq("user_id", userId)
        .maybeSingle();

      const contactCount = Array.isArray(profile?.emergency_contacts)
        ? profile.emergency_contacts.length
        : 0;

      const name = profile?.first_name || "there";

      return new Response(
        JSON.stringify(
          googleResponse(
            `Hello ${name}. Your LifeLink Sync protection is active. You have ${contactCount} emergency contact${contactCount !== 1 ? "s" : ""} configured. Say emergency at any time to trigger an alert.`,
          ),
        ),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Handle test intent
    if (handlerName === "test" || handlerName === "TestIntent") {
      return new Response(
        JSON.stringify(
          googleResponse(
            "Test successful! Your LifeLink Sync connection is working. In a real emergency, say emergency and your contacts will be alerted immediately.",
          ),
        ),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Unknown handler
    return new Response(
      JSON.stringify(
        googleResponse(
          "I didn't understand that. You can say emergency for an alert, check my status, or test my system.",
        ),
      ),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Google Home webhook error:", error);
    return new Response(
      JSON.stringify(
        googleResponse("Sorry, there was an error. Please try again."),
      ),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
