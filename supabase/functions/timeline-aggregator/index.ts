// Timeline Aggregator - Captures events from all sources and adds to unified timeline
// Provides perfect memory across all customer interactions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TimelineEvent {
  userId?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
  eventType:
    | 'chat_message'
    | 'email_sent'
    | 'email_opened'
    | 'email_clicked'
    | 'voice_call'
    | 'conference_join'
    | 'sos_incident'
    | 'lead_captured'
    | 'lead_score_change'
    | 'registration_completed'
    | 'subscription_change'
    | 'payment_event'
    | 'profile_update'
    | 'ai_interaction'
    | 'custom_event';
  eventCategory: 'communication' | 'emergency' | 'sales' | 'support' | 'system';
  eventTitle: string;
  eventDescription?: string;
  eventData?: Record<string, any>;
  sourceType: string;
  sourceId?: string;
  relatedIncidentId?: string;
  relatedConferenceId?: string;
  relatedConversationId?: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent';
  importanceScore?: number; // 1-5
  occurredAt?: string;
}

function getSupabaseClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function enrichContact(event: TimelineEvent, supabase: any) {
  // Try to enrich contact information from user profile
  if (event.userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone")
      .eq("user_id", event.userId)
      .single();

    if (profile) {
      event.contactName = event.contactName || `${profile.first_name} ${profile.last_name}`;
      event.contactEmail = event.contactEmail || profile.email;
      event.contactPhone = event.contactPhone || profile.phone;
    }
  }

  return event;
}

async function generateAISummary(event: TimelineEvent): Promise<string> {
  // Simple rule-based summary generation (can be enhanced with OpenAI later)
  const summaries: Record<string, string> = {
    chat_message: `Chat message: ${event.eventDescription?.substring(0, 100)}`,
    email_sent: `Email sent: ${event.eventTitle}`,
    email_opened: `Opened email: ${event.eventTitle}`,
    email_clicked: `Clicked link in: ${event.eventTitle}`,
    voice_call: `Voice call: ${event.eventDescription}`,
    conference_join: `Joined emergency conference`,
    sos_incident: `⚠️ EMERGENCY: ${event.eventDescription}`,
    lead_captured: `New lead from ${event.eventData?.source || 'website'}`,
    registration_completed: `Completed registration`,
    ai_interaction: `AI conversation: ${event.eventDescription}`,
  };

  return summaries[event.eventType] || event.eventTitle;
}

async function addTimelineEvent(event: TimelineEvent, supabase: any) {
  // Enrich contact information
  await enrichContact(event, supabase);

  // Generate AI summary
  const aiSummary = await generateAISummary(event);

  // Determine importance based on event type
  let importance = event.importanceScore;
  if (!importance) {
    const importanceMap: Record<string, number> = {
      sos_incident: 1, // Critical
      conference_join: 1,
      payment_event: 2, // High
      registration_completed: 2,
      lead_captured: 3, // Normal
      email_clicked: 3,
      email_opened: 4, // Low
      profile_update: 5, // Info
    };
    importance = importanceMap[event.eventType] || 3;
  }

  // Insert into timeline
  const { data, error } = await supabase
    .from("contact_timeline")
    .insert({
      user_id: event.userId,
      contact_email: event.contactEmail,
      contact_phone: event.contactPhone,
      contact_name: event.contactName,
      event_type: event.eventType,
      event_category: event.eventCategory,
      event_title: event.eventTitle,
      event_description: event.eventDescription,
      event_data: event.eventData || {},
      source_type: event.sourceType,
      source_id: event.sourceId,
      related_incident_id: event.relatedIncidentId,
      related_conference_id: event.relatedConferenceId,
      related_conversation_id: event.relatedConversationId,
      sentiment: event.sentiment,
      ai_summary: aiSummary,
      importance_score: importance,
      occurred_at: event.occurredAt || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to add timeline event:", error);
    throw error;
  }

  console.log(`✅ Timeline event added: ${event.eventType} for ${event.contactName || event.contactEmail}`);

  // Update AI context cache (async, don't wait)
  updateAIContext(event, supabase).catch(err =>
    console.error("Failed to update AI context:", err)
  );

  return data;
}

async function updateAIContext(event: TimelineEvent, supabase: any) {
  // Fetch recent timeline for this contact
  const { data: recentEvents } = await supabase
    .from("contact_timeline")
    .select("event_type, event_title, event_description, occurred_at, sentiment")
    .or(`user_id.eq.${event.userId},contact_email.eq.${event.contactEmail}`)
    .order("occurred_at", { ascending: false })
    .limit(50);

  if (!recentEvents || recentEvents.length === 0) return;

  // Generate context summary
  const totalEvents = recentEvents.length;
  const emergencies = recentEvents.filter(e => e.event_type === "sos_incident").length;
  const chats = recentEvents.filter(e => e.event_type === "chat_message").length;
  const emails = recentEvents.filter(e => e.event_type.startsWith("email_")).length;

  const fullContext = `
Contact has ${totalEvents} total interactions recorded.
${emergencies > 0 ? `⚠️ ${emergencies} emergency incidents` : "No emergency history"}
${chats} chat messages, ${emails} email interactions.
Most recent activity: ${recentEvents[0].event_title} on ${new Date(recentEvents[0].occurred_at).toLocaleDateString()}.
Sentiment trend: ${determineSentimentTrend(recentEvents)}.
  `.trim();

  const keyFacts = [
    `${totalEvents} total interactions`,
    emergencies > 0 ? `${emergencies} emergencies` : "No emergencies",
    `Last seen: ${new Date(recentEvents[0].occurred_at).toLocaleDateString()}`,
  ];

  // Upsert AI context
  await supabase
    .from("ai_contact_context")
    .upsert({
      user_id: event.userId,
      contact_email: event.contactEmail,
      contact_phone: event.contactPhone,
      full_context: fullContext,
      key_facts: keyFacts,
      recent_events_summary: recentEvents.slice(0, 10)
        .map(e => `${e.event_title} (${e.event_type})`)
        .join("; "),
      relationship_status: determineRelationshipStatus(recentEvents),
      context_generated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,contact_email",
    });

  console.log(`✅ AI context updated for ${event.contactName || event.contactEmail}`);
}

function determineSentimentTrend(events: any[]): string {
  const recentSentiments = events
    .slice(0, 10)
    .map(e => e.sentiment)
    .filter(s => s);

  const positiveCount = recentSentiments.filter(s => s === "positive").length;
  const negativeCount = recentSentiments.filter(s => s === "negative").length;

  if (positiveCount > negativeCount * 2) return "improving";
  if (negativeCount > positiveCount * 2) return "declining";
  return "stable";
}

function determineRelationshipStatus(events: any[]): string {
  const hasRegistration = events.some(e => e.event_type === "registration_completed");
  const hasPayment = events.some(e => e.event_type === "payment_event");
  const hasEmergency = events.some(e => e.event_type === "sos_incident");
  const recentActivity = events[0] &&
    new Date(events[0].occurred_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  if (hasPayment) return "Active customer";
  if (hasRegistration) return "Registered user";
  if (hasEmergency) return "Emergency user";
  if (recentActivity) return "Active lead";
  return "Inactive lead";
}

// Auto-capture helper functions for common events
async function captureSOSIncident(supabase: any, incident: any) {
  const event: TimelineEvent = {
    userId: incident.user_id,
    eventType: "sos_incident",
    eventCategory: "emergency",
    eventTitle: "Emergency SOS Activated",
    eventDescription: `Emergency at ${incident.location_data?.address || "unknown location"}`,
    eventData: {
      location: incident.location_data,
      contactsNotified: incident.emergency_contacts_notified,
      callsAnswered: incident.calls_answered,
    },
    sourceType: "sos_incidents",
    sourceId: incident.id,
    relatedIncidentId: incident.id,
    sentiment: "urgent",
    importanceScore: 1,
    occurredAt: incident.created_at,
  };

  return await addTimelineEvent(event, supabase);
}

async function captureConferenceJoin(supabase: any, participant: any, conference: any) {
  const event: TimelineEvent = {
    contactPhone: participant.phone_number,
    contactName: participant.participant_name,
    eventType: "conference_join",
    eventCategory: "emergency",
    eventTitle: `Joined emergency conference`,
    eventDescription: `${participant.participant_name} joined as ${participant.participant_type}`,
    eventData: {
      conferenceId: conference.id,
      participantType: participant.participant_type,
      eta: participant.eta_minutes,
      confirmation: participant.confirmation_message,
    },
    sourceType: "conference_participants",
    sourceId: participant.id,
    relatedConferenceId: conference.id,
    relatedIncidentId: conference.incident_id,
    sentiment: participant.confirmation_message ? "positive" : "neutral",
    importanceScore: 1,
    occurredAt: participant.joined_at || participant.created_at,
  };

  return await addTimelineEvent(event, supabase);
}

async function captureChatMessage(supabase: any, message: any, conversation: any) {
  const event: TimelineEvent = {
    userId: conversation.user_id,
    contactEmail: conversation.contact_email,
    contactName: conversation.contact_name,
    eventType: "chat_message",
    eventCategory: "communication",
    eventTitle: message.direction === "inbound" ? "Customer message" : "Our response",
    eventDescription: message.content.substring(0, 200),
    eventData: {
      messageId: message.id,
      conversationId: conversation.id,
      direction: message.direction,
      isAIGenerated: message.is_ai_generated,
    },
    sourceType: "unified_messages",
    sourceId: message.id,
    relatedConversationId: conversation.id,
    sentiment: message.sentiment || "neutral",
    importanceScore: 3,
    occurredAt: message.created_at,
  };

  return await addTimelineEvent(event, supabase);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = getSupabaseClient();
    const body = await req.json();

    console.log("📊 Timeline event received:", body.action);

    let result;

    switch (body.action) {
      case "add_event":
        // Direct event addition
        result = await addTimelineEvent(body.event as TimelineEvent, supabase);
        break;

      case "capture_sos":
        // Auto-capture SOS incident
        result = await captureSOSIncident(supabase, body.incident);
        break;

      case "capture_conference_join":
        // Auto-capture conference participant
        result = await captureConferenceJoin(supabase, body.participant, body.conference);
        break;

      case "capture_chat":
        // Auto-capture chat message
        result = await captureChatMessage(supabase, body.message, body.conversation);
        break;

      case "get_ai_context":
        // Retrieve AI context for a contact
        const { data: context } = await supabase
          .rpc("get_contact_ai_context", {
            p_user_id: body.userId,
            p_contact_email: body.contactEmail,
          });
        result = context;
        break;

      default:
        throw new Error(`Unknown action: ${body.action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Timeline aggregator error:", error);
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
