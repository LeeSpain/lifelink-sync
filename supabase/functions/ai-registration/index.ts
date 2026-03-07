import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RegistrationRequest {
  message: string;
  sessionId: string;
  currentStep: string;
  registrationData: any;
}

const CLARA_PERSONALITY = `You are Clara, a professional, warm, and empathetic safety advisor for LifeLink Sync. Your role is to guide users through registration with a conversational, consultative approach.

PERSONALITY TRAITS:
- Professional yet friendly and approachable
- Empathetic and understanding about safety concerns
- Knowledgeable about emergency services and safety
- Patient and encouraging
- Uses emojis sparingly but effectively
- Asks follow-up questions to understand needs better

REGISTRATION FLOW:
1. INTRODUCTION: Get first name and build rapport
2. BASIC_INFO: Collect last name, email, phone number naturally
3. NEEDS_ASSESSMENT: Understand their safety concerns and family situation
4. PLAN_RECOMMENDATION: Suggest appropriate plans based on their needs
5. PAYMENT_PROCESSING: Guide through payment (integrate with existing Stripe system)
6. EMERGENCY_PROFILE: Collect emergency contacts, medical info, location
7. COMPLETION: Celebrate and direct to success page

AVAILABLE PLANS:
- Family Connection (€2.99/month): Essential family safety with emergency SOS, family alerts, and location sharing
- Premium Protection (€9.99/month): Advanced protection with AI monitoring, 24/7 priority support, and multiple device support
- Regional Call Center Services: Available as add-ons for professional 24/7 emergency response in Spain and other regions

CONVERSATION GUIDELINES:
- ONE question/topic at a time to avoid overwhelming
- Validate responses and show understanding
- Explain the importance of information you're collecting
- Adapt questions based on their situation (elderly relatives, children, etc.)
- Use their name regularly to personalize the experience
- Show enthusiasm about protecting them and their family

RESPONSE FORMAT:
Always respond with natural conversation. Extract structured data when provided and move to the next logical step.

Current user data collected: {registrationData}
Current conversation step: {currentStep}

Respond naturally as Clara would, and guide the conversation forward based on what information is still needed.`;

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-REGISTRATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { message, sessionId, currentStep, registrationData }: RegistrationRequest = await req.json();

    logStep("Request received", { sessionId, currentStep, message: message.substring(0, 50) });

    // Store the user's message in conversation history
    await supabaseClient.from("conversations").insert({
      session_id: sessionId,
      message_type: "user",
      content: message,
      metadata: { step: currentStep, registration_data: registrationData }
    });

    // Get conversation history for context
    const { data: history } = await supabaseClient
      .from("conversations")
      .select("content, message_type")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Build conversation context
    const conversationHistory = history?.map(msg => 
      `${msg.message_type === 'user' ? 'User' : 'Clara'}: ${msg.content}`
    ).join('\n') || '';

    // Enhanced prompt with current context
    const enhancedPrompt = CLARA_PERSONALITY
      .replace('{registrationData}', JSON.stringify(registrationData || {}))
      .replace('{currentStep}', currentStep);

    const systemMessage = `${enhancedPrompt}

CONVERSATION HISTORY:
${conversationHistory}

CURRENT TASK: 
Based on the conversation history and current registration data, respond naturally as Clara. Extract any new information from the user's message and determine what to ask next.

IMPORTANT INSTRUCTIONS:
- If you have collected basic info (name, email, phone), move to needs assessment
- If you understand their needs, recommend specific plans
- If plans are selected, guide to payment
- If payment is complete, collect emergency profile information
- Keep responses conversational and under 150 words
- Extract structured data when possible
- Only ask for ONE piece of information at a time

STRUCTURED DATA EXTRACTION:
When you identify information, structure it properly:
- firstName, lastName, email, phoneNumber
- plans: array of plan IDs (personal, guardian, family, callcenter)
- emergencyContacts: array with name, phone, relationship
- medicalConditions, allergies, currentLocation, preferredLanguage

USER'S LATEST MESSAGE: "${message}"

Respond as Clara would, naturally and conversationally.`;

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const claraResponse = aiResponse.choices[0].message.content;

    logStep("Clara response generated", { length: claraResponse.length });

    // Store Clara's response
    await supabaseClient.from("conversations").insert({
      session_id: sessionId,
      message_type: "assistant",
      content: claraResponse,
      metadata: { step: currentStep }
    });

    // Analyze the conversation to extract/update registration data
    const dataExtractionPrompt = `Analyze this conversation and extract structured registration data.

Current data: ${JSON.stringify(registrationData || {})}
User's latest message: "${message}"
Clara's response: "${claraResponse}"

Extract and update any new information into this JSON structure:
{
  "firstName": string,
  "lastName": string,
  "email": string,
  "phoneNumber": string,
  "plans": array of strings (personal, guardian, family, callcenter),
  "emergencyContacts": array of {name, phone, relationship},
  "medicalConditions": string,
  "allergies": string,
  "currentLocation": string,
  "preferredLanguage": string,
  "complete": boolean (true if all required info collected)
}

Also determine the next conversation step:
- introduction, basic_info, needs_assessment, plan_recommendation, payment_processing, emergency_profile, completion

Return ONLY valid JSON with "registrationData" and "currentStep" fields.`;

    const extractionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a data extraction assistant. Respond ONLY with valid JSON." },
          { role: "user", content: dataExtractionPrompt }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    let updatedData = registrationData;
    let nextStep = currentStep;

    if (extractionResponse.ok) {
      try {
        const extractionResult = await extractionResponse.json();
        const extracted = JSON.parse(extractionResult.choices[0].message.content);
        updatedData = extracted.registrationData || registrationData;
        nextStep = extracted.currentStep || currentStep;
        logStep("Data extracted", { updatedData, nextStep });
      } catch (error) {
        logStep("Data extraction failed", error);
      }
    }

    // If registration is complete, create user account
    if (updatedData?.complete && updatedData.email) {
      try {
        logStep("Creating user account", { email: updatedData.email });
        
        const { error: signUpError } = await supabaseClient.auth.admin.createUser({
          email: updatedData.email,
          email_confirm: true,
          user_metadata: {
            first_name: updatedData.firstName,
            last_name: updatedData.lastName,
            phone: updatedData.phoneNumber,
            emergency_contacts: JSON.stringify(updatedData.emergencyContacts || []),
            medical_conditions: updatedData.medicalConditions || '',
            allergies: updatedData.allergies || '',
            current_location: updatedData.currentLocation || '',
            preferred_language: updatedData.preferredLanguage || 'English',
            registration_session: sessionId
          }
        });

        if (signUpError) {
          logStep("User creation error", signUpError);
        } else {
          logStep("User account created successfully");
        }
      } catch (error) {
        logStep("Account creation failed", error);
      }
    }

    return new Response(
      JSON.stringify({
        response: claraResponse,
        registrationData: updatedData,
        currentStep: nextStep,
        sessionId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    logStep("ERROR in ai-registration", error);
    return new Response(
      JSON.stringify({
        error: "I'm having a technical difficulty right now. Let me try to reconnect...",
        response: "I apologize, but I'm experiencing a brief technical issue. Please give me a moment and try sending your message again. I'm here to help you get registered safely! 🛡️"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});