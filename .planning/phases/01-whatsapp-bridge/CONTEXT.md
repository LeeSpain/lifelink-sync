# Phase 1: WhatsApp Bridge — Context

**Gathered:** 2026-03-14
**Status:** Ready for planning
**Requirements:** REQ-001

## Phase Boundary

Build an inbound WhatsApp webhook that receives messages from Twilio, routes them through CLARA (ai-chat), and sends the response back as a WhatsApp reply. Log everything to existing tables.

## Implementation Decisions

### D1: Webhook URL (LOCKED)
`https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/whatsapp-inbound`
User configures this in Twilio sandbox console manually.

### D2: Language Detection (LOCKED)
Detect from phone country code prefix:
- `+34` → Spanish (`es`)
- `+31` → Dutch (`nl`)
- All others (including `+44`) → English (`en`)
- Unrecognised → English

### D3: Response Format (LOCKED)
Plain text only. No WhatsApp markdown (*bold*, _italic_). Clean text responses.

### D4: Rate Limiting (LOCKED)
10 messages per phone number per hour.
If exceeded, send one message: "I want to help — please give me a moment and try again shortly."
Then silence until the hour resets.
Implementation: use a simple in-memory Map or query `whatsapp_messages` count for last hour.

### D5: Twilio Payload Format (LOCKED)
Twilio sends `application/x-www-form-urlencoded` POST with fields:
- `MessageSid` — unique message ID
- `From` — format `whatsapp:+34643706877`
- `To` — format `whatsapp:+14155238886`
- `Body` — message text
- `ProfileName` — sender's WhatsApp display name
- `NumMedia` — number of media attachments (ignore for now)

### D6: Response to Twilio (LOCKED)
Return HTTP 200 with empty TwiML: `<Response/>`
This prevents Twilio from retrying.

### D7: Existing Tables to Use (LOCKED)
- `whatsapp_conversations` — find/create by `phone_number`
- `whatsapp_messages` — log inbound (direction='inbound') and outbound (direction='outbound', is_ai_generated=true)
- `clara_contact_memory` — lookup/upsert by `contact_phone`

### D8: AI Call Pattern (LOCKED)
Call `ai-chat` edge function via `supabase.functions.invoke('ai-chat', ...)` — same pattern as `clara-escalation`.
Pass: message, sessionId (from memory or new UUID), language (from D2), currency (EUR).

### D9: Escalation (LOCKED)
If ai-chat returns `escalation: true`, fire `clara-escalation` with type `amber` — same as existing chat widget flow. CLARA handles this automatically.

### D10: Env Vars Needed (LOCKED)
Already set: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
No new secrets needed.

## Existing Infrastructure

### Tables (already migrated)
- `whatsapp_conversations` — id, phone_number, contact_name, user_id, status, metadata
- `whatsapp_messages` — id, conversation_id, whatsapp_message_id, direction, message_type, content, is_ai_generated, ai_session_id
- `clara_contact_memory` — id, contact_phone, session_id, first_name, language, journey_stage, etc.

### Functions (already deployed)
- `ai-chat` — CLARA's brain, accepts message/sessionId/language/currency
- `clara-memory` — get/upsert contact memory by phone/session/email
- `clara-escalation` — sends WhatsApp to Lee for hot_lead/amber/morning_briefing

### Twilio Outbound Pattern (from clara-escalation)
```typescript
const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
const encoded = new URLSearchParams({ To, From, Body });
fetch(url, { method: 'POST', headers: { Authorization: 'Basic ' + btoa(...) } });
```
