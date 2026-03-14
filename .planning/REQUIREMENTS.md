# CLARA GOD MODE Phase 2 — Requirements

## REQ-001: WhatsApp Bridge (Build 4)
**Priority:** High
**Description:** Inbound WhatsApp messages to the Twilio sandbox number are received via webhook, routed through CLARA (ai-chat edge function), and the response is sent back as a WhatsApp reply automatically.

### Functional Requirements
- REQ-001.1: Create `whatsapp-inbound` edge function that receives Twilio webhook POST
- REQ-001.2: Extract sender phone, message body, and WhatsApp message SID from Twilio payload
- REQ-001.3: Look up or create a session in `clara_contact_memory` using the sender's phone number
- REQ-001.4: Forward the message to `ai-chat` edge function with language detection
- REQ-001.5: Send CLARA's response back to the sender via Twilio WhatsApp API
- REQ-001.6: Log the full conversation in `whatsapp_messages` table
- REQ-001.7: If CLARA triggers an amber escalation, the WhatsApp escalation to Lee also fires
- REQ-001.8: Return TwiML `<Response/>` to Twilio to acknowledge receipt

### Technical Details
- Twilio sandbox webhook URL: `https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/whatsapp-inbound`
- Existing tables: `whatsapp_accounts`, `whatsapp_conversations`, `whatsapp_messages`
- Twilio secrets already set: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
- Must handle Twilio's `application/x-www-form-urlencoded` content type
- Must return 200 with valid TwiML to prevent Twilio retries

---

## REQ-002: Cron Jobs (Build 6)
**Priority:** High
**Description:** 7 scheduled jobs running via pg_cron that trigger edge functions through pg_net HTTP calls.

### Scheduled Jobs
- REQ-002.1: **Morning Briefing** — Daily at 08:00 CET → WhatsApp to Lee with overnight stats (new leads, trials started, active conversations, revenue)
- REQ-002.2: **Trial Day 3 Follow-up** — Daily at 10:00 → CLARA emails trial users on day 3 asking how setup went
- REQ-002.3: **Trial Day 6 Follow-up** — Daily at 10:00 → CLARA emails trial users on day 6 with conversion nudge
- REQ-002.4: **Trial Day 7 Expiry Warning** — Daily at 09:00 → CLARA emails trial users on day 7 with "last day" urgency
- REQ-002.5: **Hot Lead Chase** — Every 6 hours → Re-check leads with score 5+ that haven't been contacted in 24h, trigger WhatsApp to Lee
- REQ-002.6: **Weekly Report** — Monday at 09:00 CET → WhatsApp to Lee with weekly metrics summary
- REQ-002.7: **Stale Lead Cleanup** — Daily at 02:00 → Mark leads older than 30 days with no activity as `stale`

### Technical Details
- pg_cron is enabled on the new Supabase project
- Each job calls an edge function via `pg_net.http_post()`
- Edge functions authenticate with anon key (already stored in `ai_model_settings`)
- `followup_enrollments` table tracks which follow-ups have been sent
- Morning briefing and weekly report use `clara-escalation` function with type `morning_briefing`

---

## REQ-003: Heartbeat (Build 7)
**Priority:** Medium
**Description:** CLARA proactively reaches out to users who haven't engaged, without being messaged first.

### Heartbeat Triggers
- REQ-003.1: **Inactive Trial User** — Trial user with no activity for 48h → CLARA sends email check-in
- REQ-003.2: **Inactive Subscriber** — Paid subscriber with no login for 14 days → CLARA sends "we miss you" email
- REQ-003.3: **Quiet Hot Lead** — Lead with interest_score 5+ and no contact for 48h → CLARA sends email with personalized follow-up based on `clara_contact_memory`

### Technical Details
- Create `clara-heartbeat` edge function
- Called by pg_cron job every 6 hours
- Queries `subscribers` for inactive trials/members
- Queries `leads` + `clara_contact_memory` for quiet leads
- Uses Resend for email delivery (when RESEND_API_KEY is set)
- Falls back to logging intent if email not configured
- Updates `clara_contact_memory.last_contact_at` after each outreach
- Never contacts the same person twice within 48h (dedup check)

---

## REQ-004: Geo-Lookup CORS Fix
**Priority:** Low
**Description:** Fix the CORS error appearing in browser console from the geo-lookup edge function.

### Requirements
- REQ-004.1: Find the geo-lookup function and add proper CORS headers
- REQ-004.2: Ensure OPTIONS preflight returns correct headers
- REQ-004.3: If function is not deployed, either deploy it or remove the client-side call

---

## Acceptance Criteria

### Build 4 (WhatsApp Bridge)
- [ ] Send "Hello" to the Twilio sandbox WhatsApp number
- [ ] Receive a CLARA response within 10 seconds
- [ ] Conversation appears in `whatsapp_messages` table
- [ ] Contact memory is created/updated in `clara_contact_memory`
- [ ] Amber trigger words cause WhatsApp escalation to Lee

### Build 6 (Cron Jobs)
- [ ] Morning briefing WhatsApp arrives at 08:00 CET
- [ ] Trial follow-up emails fire on days 3, 6, 7
- [ ] Hot lead chase re-alerts Lee on stale high-score leads
- [ ] Weekly report arrives Monday at 09:00
- [ ] All jobs visible in pg_cron schedule

### Build 7 (Heartbeat)
- [ ] Inactive 48h trial user receives email from CLARA
- [ ] 14-day inactive subscriber receives email
- [ ] Quiet lead with score 5+ receives follow-up
- [ ] No user contacted more than once per 48h

### Cleanup
- [ ] No CORS errors in browser console from geo-lookup

---
*Last updated: 2026-03-14*
