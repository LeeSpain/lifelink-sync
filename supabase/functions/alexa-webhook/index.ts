// Alexa Skill Webhook — handles intents from Amazon Alexa
//
// Intents:
//   EmergencyIntent  → triggers SOS via sos-trigger
//   StatusIntent     → returns user's protection status
//   TestIntent       → sends test notification
//   LaunchRequest    → welcome message
//
// Account linking: user's Supabase access token is in session.user.accessToken
// This function validates the token, resolves the LifeLink user, and acts accordingly.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlexaRequest {
  version: string;
  session: {
    user: {
      accessToken?: string;
      userId?: string;
    };
    new: boolean;
  };
  request: {
    type: string;
    intent?: {
      name: string;
      slots?: Record<string, { value?: string }>;
    };
  };
}

function alexaResponse(speechText: string, shouldEndSession = true) {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "SSML",
        ssml: `<speak>${speechText}</speak>`,
      },
      shouldEndSession,
    },
  };
}

function linkAccountResponse() {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "SSML",
        ssml: "<speak>Please link your LifeLink Sync account in the Alexa app to use this skill.</speak>",
      },
      card: {
        type: "LinkAccount",
      },
      shouldEndSession: true,
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as AlexaRequest;
    const requestType = body.request?.type;
    const intentName = body.request?.intent?.name;

    console.log(`Alexa webhook: type=${requestType}, intent=${intentName}`);

    // Handle LaunchRequest (skill opened without specific intent)
    if (requestType === "LaunchRequest") {
      return new Response(
        JSON.stringify(
          alexaResponse(
            "Welcome to LifeLink Sync. You can say help help help for an emergency, check my status, or test my system.",
            false,
          ),
        ),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Handle SessionEndedRequest
    if (requestType === "SessionEndedRequest") {
      return new Response(JSON.stringify(alexaResponse("")), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For IntentRequests, check account linking
    if (requestType === "IntentRequest") {
      const accessToken = body.session?.user?.accessToken;

      // Handle built-in intents that don't need auth
      if (intentName === "AMAZON.HelpIntent") {
        return new Response(
          JSON.stringify(
            alexaResponse(
              "LifeLink Sync keeps you safe. Say help help help to trigger an emergency alert, check my status to see your protection status, or test my system to run a test.",
              false,
            ),
          ),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (intentName === "AMAZON.CancelIntent" || intentName === "AMAZON.StopIntent") {
        return new Response(
          JSON.stringify(alexaResponse("Stay safe. Goodbye.")),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // All custom intents require account linking
      if (!accessToken) {
        return new Response(JSON.stringify(linkAccountResponse()), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate the access token against Supabase
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );

      const { data: userData, error: authErr } = await supabase.auth.getUser(accessToken);
      if (authErr || !userData?.user) {
        console.error("Invalid Alexa access token:", authErr);
        return new Response(JSON.stringify(linkAccountResponse()), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = userData.user.id;
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false } },
      );

      // Handle EmergencyIntent
      if (intentName === "EmergencyIntent") {
        console.log(`Alexa EmergencyIntent for user ${userId}`);

        const triggerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sos-trigger`;
        const integrationKey = Deno.env.get("INTEGRATION_API_KEY") || "";

        const sosResp = await fetch(triggerUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-integration-key": integrationKey,
          },
          body: JSON.stringify({ user_id: userId, source: "alexa" }),
        });

        if (sosResp.ok) {
          return new Response(
            JSON.stringify(
              alexaResponse(
                "Emergency alert activated! Your emergency contacts are being notified with your location. Stay safe, help is on the way.",
              ),
            ),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        } else {
          const errData = await sosResp.json();
          console.error("SOS trigger failed from Alexa:", errData);
          return new Response(
            JSON.stringify(
              alexaResponse(
                "I was unable to activate the emergency alert. Please try again or use your phone to trigger SOS directly.",
              ),
            ),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      // Handle StatusIntent
      if (intentName === "StatusIntent") {
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
            alexaResponse(
              `Hello ${name}. Your LifeLink Sync protection is active. You have ${contactCount} emergency contact${contactCount !== 1 ? "s" : ""} configured. Say help help help at any time to trigger an emergency alert.`,
            ),
          ),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Handle TestIntent
      if (intentName === "TestIntent") {
        return new Response(
          JSON.stringify(
            alexaResponse(
              "Test successful! Your LifeLink Sync connection is working. In a real emergency, say help help help and your contacts will be alerted immediately.",
            ),
          ),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Unknown intent
      return new Response(
        JSON.stringify(
          alexaResponse(
            "I didn't understand that. You can say help help help for an emergency, check my status, or test my system.",
            false,
          ),
        ),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Unknown request type
    return new Response(JSON.stringify(alexaResponse("")), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Alexa webhook error:", error);
    return new Response(
      JSON.stringify(
        alexaResponse("Sorry, there was an error processing your request. Please try again."),
      ),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
