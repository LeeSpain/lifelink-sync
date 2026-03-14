# CLARA GOD MODE Phase 2 — Roadmap

## Milestone: v2.0 CLARA GOD MODE Phase 2

---

## Phase 1: WhatsApp Bridge (Build 4)
**Requirements:** REQ-001
**Estimated effort:** 2-3 hours
**Dependencies:** Twilio sandbox configured, ai-chat deployed, clara-memory deployed

### Tasks
1. Create `whatsapp-inbound` edge function
   - Parse Twilio `application/x-www-form-urlencoded` webhook payload
   - Extract `From`, `Body`, `MessageSid`, `ProfileName`
   - Look up/create contact in `clara_contact_memory` by phone
   - Call `ai-chat` with message, language detection, session from memory
   - Send CLARA response back via Twilio WhatsApp API
   - Log to `whatsapp_messages` table
   - Return TwiML `<Response/>` to Twilio

2. Deploy `whatsapp-inbound` function
   - `npx supabase functions deploy whatsapp-inbound --no-verify-jwt`

3. Configure Twilio sandbox webhook
   - Set webhook URL to `https://cprbgquiqbyoyrffznny.supabase.co/functions/v1/whatsapp-inbound`

4. Test end-to-end
   - Send WhatsApp to sandbox number
   - Verify CLARA response received
   - Verify `whatsapp_messages` logged
   - Verify `clara_contact_memory` updated
   - Test amber trigger word → Lee gets WhatsApp alert

### Deliverables
- `supabase/functions/whatsapp-inbound/index.ts`
- Twilio sandbox configured
- E2E test passed

---

## Phase 2: Cron Infrastructure + Morning Briefing (Build 6, Part 1)
**Requirements:** REQ-002.1, REQ-002.6
**Estimated effort:** 2 hours
**Dependencies:** Phase 1 complete (WhatsApp working), pg_cron enabled

### Tasks
1. Create `clara-morning-briefing` edge function
   - Query overnight stats: new leads, trials started, active conversations
   - Query revenue data from `subscribers`
   - Build formatted WhatsApp message
   - Send via `clara-escalation` with type `morning_briefing`

2. Create `clara-weekly-report` edge function
   - Query 7-day metrics: total leads, conversions, churn, revenue
   - Compare to previous week
   - Send via `clara-escalation` with type `morning_briefing`

3. Create migration for pg_cron jobs
   - Morning briefing: `0 7 * * *` (07:00 UTC = 08:00 CET)
   - Weekly report: `0 8 * * 1` (08:00 UTC Monday = 09:00 CET)
   - Both call edge functions via `pg_net.http_post()`

4. Deploy functions and push migration

### Deliverables
- `supabase/functions/clara-morning-briefing/index.ts`
- `supabase/functions/clara-weekly-report/index.ts`
- `supabase/migrations/YYYYMMDD_cron_briefing_report.sql`

---

## Phase 3: Trial Follow-up Crons (Build 6, Part 2)
**Requirements:** REQ-002.2, REQ-002.3, REQ-002.4
**Estimated effort:** 2-3 hours
**Dependencies:** Phase 2 complete, Resend API key set (or stub emails)

### Tasks
1. Create `clara-trial-followup` edge function
   - Accept `day` parameter (3, 6, or 7)
   - Query `subscribers` for trial users at exactly that day
   - Check `followup_enrollments` to avoid duplicate sends
   - Compose personalized email using CLARA voice
   - Send via Resend (or log if no API key)
   - Record in `followup_enrollments`

2. Create migration for 3 pg_cron jobs
   - Day 3: `0 9 * * *` (09:00 UTC = 10:00 CET)
   - Day 6: `0 9 * * *` (same schedule, different day filter)
   - Day 7: `0 8 * * *` (08:00 UTC = 09:00 CET)

3. Deploy and test with a mock trial user

### Deliverables
- `supabase/functions/clara-trial-followup/index.ts`
- `supabase/migrations/YYYYMMDD_cron_trial_followups.sql`

---

## Phase 4: Hot Lead Chase + Stale Cleanup (Build 6, Part 3)
**Requirements:** REQ-002.5, REQ-002.7
**Estimated effort:** 1-2 hours
**Dependencies:** Phase 2 complete

### Tasks
1. Create `clara-lead-chase` edge function
   - Query leads with `interest_level >= 5` and `last_contact_at < now() - 24h`
   - Cross-reference `clara_contact_memory` for context
   - Send WhatsApp alert to Lee via `clara-escalation`
   - Update `leads.updated_at`

2. Create `clara-stale-cleanup` edge function
   - Mark leads older than 30 days with no activity as `status = 'stale'`
   - Log count of stale leads

3. Create migration for 2 pg_cron jobs
   - Hot lead chase: `0 */6 * * *` (every 6 hours)
   - Stale cleanup: `0 1 * * *` (01:00 UTC = 02:00 CET)

### Deliverables
- `supabase/functions/clara-lead-chase/index.ts`
- `supabase/functions/clara-stale-cleanup/index.ts`
- `supabase/migrations/YYYYMMDD_cron_lead_chase_cleanup.sql`

---

## Phase 5: Heartbeat (Build 7)
**Requirements:** REQ-003
**Estimated effort:** 2-3 hours
**Dependencies:** Phase 3 complete (email sending works)

### Tasks
1. Create `clara-heartbeat` edge function
   - Query inactive trial users (no activity 48h+)
   - Query inactive subscribers (no login 14 days+)
   - Query quiet leads (score 5+, no contact 48h+)
   - For each, compose personalized outreach using `clara_contact_memory`
   - Send via email (Resend)
   - Update `clara_contact_memory.last_contact_at`
   - Enforce 48h dedup — never contact same person twice in 48h

2. Create migration for pg_cron job
   - Heartbeat: `0 */6 * * *` (every 6 hours)

3. Deploy and test

### Deliverables
- `supabase/functions/clara-heartbeat/index.ts`
- `supabase/migrations/YYYYMMDD_cron_heartbeat.sql`

---

## Phase 6: Geo-Lookup CORS Fix + Final Verification
**Requirements:** REQ-004
**Estimated effort:** 30 minutes

### Tasks
1. Find geo-lookup edge function or client-side call causing CORS error
2. Either fix CORS headers or remove unused call
3. Verify no CORS errors in browser console
4. Final smoke test of all systems:
   - WhatsApp inbound → CLARA responds
   - Morning briefing fires
   - Trial follow-ups queued
   - Heartbeat runs without error
   - No console errors on live site

### Deliverables
- CORS fix committed
- All systems verified

---

## Summary

| Phase | Build | What | Est. Time |
|-------|-------|------|-----------|
| 1 | Build 4 | WhatsApp Bridge | 2-3h |
| 2 | Build 6a | Morning Briefing + Weekly Report | 2h |
| 3 | Build 6b | Trial Follow-ups (day 3/6/7) | 2-3h |
| 4 | Build 6c | Hot Lead Chase + Stale Cleanup | 1-2h |
| 5 | Build 7 | Heartbeat (proactive outreach) | 2-3h |
| 6 | Cleanup | Geo-Lookup CORS + Final QA | 30m |

**Total estimated: 10-14 hours**
**Critical blocker: Supabase Pro plan needed to deploy additional edge functions**

---
*Last updated: 2026-03-14*
