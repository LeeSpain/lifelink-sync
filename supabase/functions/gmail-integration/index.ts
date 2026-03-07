import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const GMAIL_CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
const GMAIL_CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface GmailRequest {
  action: "send" | "reply" | "fetch";
  accessToken: string;
  to?: string;
  subject?: string;
  body?: string;
  threadId?: string;
  messageId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, to, subject, body, threadId, messageId }: GmailRequest = await req.json();

    console.log(`Gmail integration action: ${action}`);

    switch (action) {
      case "send":
        return await sendEmail(accessToken, to!, subject!, body!);
      
      case "reply":
        return await replyToEmail(accessToken, threadId!, body!);
      
      case "fetch":
        return await fetchEmails(accessToken);
      
      default:
        throw new Error("Invalid action");
    }

  } catch (error: any) {
    console.error("Error in gmail-integration function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function sendEmail(accessToken: string, to: string, subject: string, body: string) {
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    body
  ].join("\n");

  const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: encodedEmail
    }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Gmail API error: ${result.error?.message || 'Unknown error'}`);
  }

  // Log email to database
  await supabase.from('email_logs').insert({
    recipient_email: to,
    subject: subject,
    email_type: "outbound",
    status: "sent",
    provider_message_id: result.id
  });

  return new Response(JSON.stringify({ success: true, messageId: result.id }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function replyToEmail(accessToken: string, threadId: string, body: string) {
  // First fetch the original message to get proper reply headers
  const threadResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  const thread = await threadResponse.json();
  const originalMessage = thread.messages[0];
  
  // Extract original subject and add "Re: " if not already present
  const originalSubject = originalMessage.payload.headers.find((h: any) => h.name === "Subject")?.value || "";
  const replySubject = originalSubject.startsWith("Re: ") ? originalSubject : `Re: ${originalSubject}`;
  
  const originalFrom = originalMessage.payload.headers.find((h: any) => h.name === "From")?.value || "";
  const originalMessageId = originalMessage.payload.headers.find((h: any) => h.name === "Message-ID")?.value || "";

  const email = [
    `To: ${originalFrom}`,
    `Subject: ${replySubject}`,
    `In-Reply-To: ${originalMessageId}`,
    `References: ${originalMessageId}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    body
  ].join("\n");

  const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: encodedEmail,
      threadId: threadId
    }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Gmail API error: ${result.error?.message || 'Unknown error'}`);
  }

  return new Response(JSON.stringify({ success: true, messageId: result.id }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function fetchEmails(accessToken: string) {
  // Fetch recent unread emails
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=10", {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Gmail API error: ${result.error?.message || 'Unknown error'}`);
  }

  const emails = [];
  
  if (result.messages) {
    for (const message of result.messages.slice(0, 5)) {
      const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      
      const messageData = await messageResponse.json();
      
      const headers = messageData.payload.headers;
      const from = headers.find((h: any) => h.name === "From")?.value || "";
      const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
      const date = headers.find((h: any) => h.name === "Date")?.value || "";
      
      let body = "";
      if (messageData.payload.body?.data) {
        body = atob(messageData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } else if (messageData.payload.parts) {
        const textPart = messageData.payload.parts.find((part: any) => part.mimeType === "text/plain");
        if (textPart?.body?.data) {
          body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      }
      
      emails.push({
        id: message.id,
        threadId: messageData.threadId,
        from,
        subject,
        date,
        body: body.substring(0, 500), // Truncate for preview
        snippet: messageData.snippet
      });
    }
  }

  return new Response(JSON.stringify({ emails }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function generateAIReply(emailContent: string, senderEmail: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Clara, the AI assistant for LifeLink Sync, a personal safety and emergency response platform. 
          
          Respond professionally and helpfully to customer emails. Key points:
          - LifeLink Sync provides 24/7 emergency response, GPS tracking, and family safety networks
          - We offer basic and premium subscription plans
          - Our main features include SOS alerts, medical info storage, emergency contacts, and location sharing
          - Always be empathetic and prioritize safety concerns
          - Keep responses concise but helpful
          - Include relevant links to dashboard or support when appropriate
          - If it's an emergency, direct them to call emergency services immediately`
        },
        {
          role: 'user',
          content: `Email from ${senderEmail}: ${emailContent}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(handler);