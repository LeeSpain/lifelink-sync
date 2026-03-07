// Clara Media Stream Handler - WebSocket connection to OpenAI Realtime API
// Bridges Twilio Media Streams with OpenAI for real-time voice AI

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface TwilioMediaMessage {
  event: string;
  streamSid?: string;
  media?: {
    payload: string;
    timestamp: string;
  };
  start?: {
    streamSid: string;
    customParameters: Record<string, string>;
  };
}

function getSupabaseClient() {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

Deno.serve(async (req: Request) => {
  // WebSocket upgrade
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected WebSocket", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  let openaiWs: WebSocket | null = null;
  let streamSid: string | null = null;
  let conferenceName: string | null = null;
  let systemPrompt: string | null = null;
  const supabase = getSupabaseClient();

  // Connect to OpenAI Realtime API
  const connectToOpenAI = () => {
    if (!OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return;
    }

    openaiWs = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "realtime=v1",
        },
      }
    );

    openaiWs.onopen = () => {
      console.log("🤖 Connected to OpenAI Realtime API");

      // Configure session
      openaiWs!.send(JSON.stringify({
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          instructions: systemPrompt || "You are Clara, an AI emergency coordinator.",
          voice: "alloy",
          input_audio_format: "g711_ulaw",
          output_audio_format: "g711_ulaw",
          input_audio_transcription: {
            model: "whisper-1",
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        },
      }));

      // Send initial greeting
      openaiWs!.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Greet the first responder joining the emergency conference."
            }
          ]
        }
      }));

      openaiWs!.send(JSON.stringify({ type: "response.create" }));
    };

    openaiWs.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      // Handle different OpenAI event types
      switch (data.type) {
        case "response.audio.delta":
          // Forward audio to Twilio
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              event: "media",
              streamSid,
              media: {
                payload: data.delta,
              },
            }));
          }
          break;

        case "response.audio_transcript.done":
          console.log("🤖 Clara said:", data.transcript);
          break;

        case "conversation.item.input_audio_transcription.completed":
          const transcript = data.transcript;
          console.log("👤 User said:", transcript);

          // Analyze for confirmation and ETA
          await analyzeSponseAndUpdate(transcript, conferenceName, supabase);
          break;

        case "error":
          console.error("OpenAI error:", data.error);
          break;
      }
    };

    openaiWs.onerror = (error) => {
      console.error("OpenAI WebSocket error:", error);
    };

    openaiWs.onclose = () => {
      console.log("OpenAI connection closed");
    };
  };

  // Analyze responder's speech for confirmation and ETA
  async function analyzeResponseAndUpdate(
    transcript: string,
    confName: string | null,
    supabase: any
  ) {
    // Simple pattern matching (can be enhanced with NLP)
    const confirmationPatterns = /\b(yes|sure|i can|i'll be there|on my way|coming)\b/i;
    const etaPatterns = /(\d+)\s*(minute|min|hour|hr)/i;

    if (confirmationPatterns.test(transcript)) {
      console.log("✅ Responder confirmed");

      // Extract ETA
      const etaMatch = transcript.match(etaPatterns);
      const etaMinutes = etaMatch ? parseInt(etaMatch[1]) * (etaMatch[2].startsWith('hour') ? 60 : 1) : null;

      // Update in database
      if (confName && streamSid) {
        try {
          const { data: conference } = await supabase
            .from("emergency_conferences")
            .select("id")
            .eq("conference_name", confName)
            .single();

          if (conference) {
            // Find the most recent contact participant
            const { data: participants } = await supabase
              .from("conference_participants")
              .select("*")
              .eq("conference_id", conference.id)
              .eq("participant_type", "contact")
              .eq("status", "in_conference")
              .order("joined_at", { ascending: false })
              .limit(1);

            if (participants && participants.length > 0) {
              await supabase
                .from("conference_participants")
                .update({
                  confirmation_message: transcript,
                  eta_minutes: etaMinutes,
                })
                .eq("id", participants[0].id);

              console.log(`✅ Updated ETA: ${etaMinutes} minutes`);
            }
          }
        } catch (error) {
          console.error("Failed to update confirmation:", error);
        }
      }
    }
  }

  // Handle Twilio WebSocket messages
  socket.onmessage = (event) => {
    const message: TwilioMediaMessage = JSON.parse(event.data);

    switch (message.event) {
      case "start":
        streamSid = message.start?.streamSid || null;
        conferenceName = message.start?.customParameters?.conferenceName || null;
        systemPrompt = decodeURIComponent(message.start?.customParameters?.systemPrompt || "");

        console.log("📞 Twilio stream started:", streamSid);
        console.log("🎙️  Conference:", conferenceName);

        // Connect to OpenAI
        connectToOpenAI();
        break;

      case "media":
        // Forward audio to OpenAI
        if (openaiWs && openaiWs.readyState === WebSocket.OPEN && message.media) {
          openaiWs.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: message.media.payload,
          }));
        }
        break;

      case "stop":
        console.log("📞 Twilio stream stopped");
        if (openaiWs) {
          openaiWs.close();
        }
        break;
    }
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
    if (openaiWs) {
      openaiWs.close();
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return response;
});
