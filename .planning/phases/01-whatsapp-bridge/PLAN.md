# Phase 1: WhatsApp Bridge — Execution Plan

**Phase:** 1 of 6
**Requirements:** REQ-001
**Status:** Ready to execute

---

## Task 1: Create `whatsapp-inbound` edge function

**File:** `supabase/functions/whatsapp-inbound/index.ts`
**Type:** New file
**Depends on:** Nothing

### Implementation

Create a new edge function with this structure:

```
1. Imports: serve, createClient, corsHeaders
2. Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
3. Supabase client (service role)
4. Rate limit map: Map<string, { count: number, resetAt: number }>
5. Language detection function: detectLanguage(phone: string) → 'en' | 'es' | 'nl'
6. Send WhatsApp function: sendWhatsApp(to, body) → boolean
7. Main handler:
   a. OPTIONS → CORS response
   b. Parse x-www-form-urlencoded body
   c. Extract From, Body, MessageSid, ProfileName
   d. Strip "whatsapp:" prefix from From to get raw phone
   e. Rate limit check (10/hr per phone)
   f. Detect language from phone prefix
   g. Find or create whatsapp_conversation by phone
   h. Insert inbound message into whatsapp_messages
   i. Get CLARA memory by contact_phone
   j. Call ai-chat via supabase.functions.invoke
   k. Strip any markdown from response (plain text only)
   l. Send response via Twilio WhatsApp API
   m. Insert outbound message into whatsapp_messages
   n. Upsert clara_contact_memory with phone, name, language
   o. If ai-chat returned escalation, fire clara-escalation
   p. Return 200 with <Response/> TwiML
```

### Rate Limiting Detail
```typescript
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(phone);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(phone, { count: 1, resetAt: now + 3600000 });
    return true; // allowed
  }
  if (entry.count >= 10) return false; // blocked
  entry.count++;
  return true; // allowed
}
```

### Language Detection Detail
```typescript
function detectLanguage(phone: string): 'en' | 'es' | 'nl' {
  if (phone.startsWith('+34')) return 'es';
  if (phone.startsWith('+31')) return 'nl';
  return 'en';
}
```

### Plain Text Stripping
```typescript
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // **bold**
    .replace(/\*(.*?)\*/g, '$1')       // *italic*
    .replace(/_(.*?)_/g, '$1')         // _italic_
    .replace(/`(.*?)`/g, '$1')         // `code`
    .replace(/#{1,6}\s/g, '')          // ## headings
    .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // [links](url)
}
```

### Acceptance Criteria
- [ ] Receives Twilio POST with form-encoded body
- [ ] Extracts From, Body, MessageSid, ProfileName
- [ ] Detects language from phone country code
- [ ] Creates/finds whatsapp_conversation
- [ ] Logs inbound message to whatsapp_messages
- [ ] Gets CLARA response from ai-chat
- [ ] Sends plain text response via Twilio API
- [ ] Logs outbound message to whatsapp_messages
- [ ] Updates clara_contact_memory
- [ ] Fires escalation on amber triggers
- [ ] Returns TwiML <Response/>
- [ ] Rate limits to 10 msgs/hr per phone

---

## Task 2: Deploy the function

**Type:** CLI command
**Depends on:** Task 1

```bash
npx supabase functions deploy whatsapp-inbound --no-verify-jwt
```

Note: Requires Supabase Pro plan (user is upgrading now).

### Verification
```bash
npx supabase functions list
# Expected: whatsapp-inbound showing ACTIVE
```

---

## Task 3: Provide Twilio webhook URL

**Type:** Documentation / user action
**Depends on:** Task 2

Webhook URL to configure in Twilio sandbox:
```
https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/whatsapp-inbound
```

Instructions for user:
1. Go to https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Find "Sandbox Configuration"
3. Set "WHEN A MESSAGE COMES IN" to the URL above
4. Set HTTP method to POST
5. Save

---

## Task 4: End-to-end test

**Type:** Manual test
**Depends on:** Task 3

### Test Script
```bash
# Test 1: Simulate Twilio webhook locally
curl -X POST https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/whatsapp-inbound \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=test123&From=whatsapp%3A%2B34643706877&To=whatsapp%3A%2B14155238886&Body=Hello%20who%20are%20you&ProfileName=Lee"

# Expected: 200 with <Response/>
# Expected: CLARA response sent to Lee's WhatsApp
```

### Verification Queries
```sql
-- Check conversation was created
SELECT * FROM whatsapp_conversations WHERE phone_number = '+34643706877';

-- Check messages were logged
SELECT direction, content, is_ai_generated FROM whatsapp_messages
WHERE conversation_id = (SELECT id FROM whatsapp_conversations WHERE phone_number = '+34643706877')
ORDER BY timestamp;

-- Check memory was created
SELECT first_name, language, journey_stage FROM clara_contact_memory
WHERE contact_phone = '+34643706877';
```

### Test 2: Amber Trigger
```bash
curl -X POST https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/whatsapp-inbound \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=test456&From=whatsapp%3A%2B34643706877&To=whatsapp%3A%2B14155238886&Body=I%20want%20a%20refund&ProfileName=Lee"

# Expected: CLARA escalation response + WhatsApp alert to Lee
```

### Test 3: Rate Limit
Send 11 messages in quick succession. Message 11 should get the polite rate limit response.

---

## Task 5: Commit and push

**Type:** Git
**Depends on:** Task 4

```bash
git add supabase/functions/whatsapp-inbound/index.ts
git commit -m "feat: WhatsApp inbound bridge — CLARA auto-responds to WhatsApp messages"
git push origin main
```

---

## Summary

| Task | What | Est. Time |
|------|------|-----------|
| 1 | Create whatsapp-inbound function | 30 min |
| 2 | Deploy to Supabase | 2 min |
| 3 | Configure Twilio webhook | 5 min (user) |
| 4 | End-to-end test | 15 min |
| 5 | Commit and push | 2 min |

**Total: ~1 hour**

---
*Created: 2026-03-14*
