# Unified Contact Timeline System - Complete Guide

## 🎯 What is the Unified Timeline?

The Unified Contact Timeline is ICE SOS's **single source of truth** for ALL customer interactions across EVERY channel. It gives your AI (Clara) and your team **perfect memory** of every conversation, email, emergency, and interaction a customer has ever had.

### The Problem It Solves

**Before Timeline:**
- Chat conversation happens → AI forgets it after
- Customer emails → no record linked to their account
- Emergency SOS triggered → no context from past interactions
- Lead calls in → you have no idea they chatted yesterday
- Clara coordinates emergency → doesn't know this is their 3rd emergency

**After Timeline:**
- ✅ Every interaction tracked in one place
- ✅ Clara knows your entire history during emergency calls
- ✅ Admins see complete customer journey (lead → customer → emergency user)
- ✅ AI references past conversations naturally
- ✅ Perfect lead scoring based on ALL touchpoints

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Event Sources                            │
├─────────────────────────────────────────────────────────────┤
│  📧 Email        💬 Chat        📞 Voice       🚨 SOS       │
│  Opens/Clicks    Messages       Calls          Incidents     │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────┐
│              timeline-aggregator Function                    │
│  (Captures events from all sources)                         │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────┐
│                contact_timeline Table                        │
│  - Complete chronological history                           │
│  - Links to source tables                                   │
│  - AI summaries & sentiment                                 │
│  - Importance scoring                                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──────────────┬──────────────┬───────────────┐
             ↓              ↓              ↓               ↓
┌──────────────────┐ ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
│  Engagement      │ │ AI Context  │ │   Clara AI   │ │ Admin UI     │
│  Summary         │ │ Cache       │ │  (Perfect    │ │ Timeline     │
│  (Metrics)       │ │ (Fast       │ │   Memory)    │ │ Viewer       │
│                  │ │  Lookup)    │ │              │ │              │
└──────────────────┘ └─────────────┘ └──────────────┘ └──────────────┘
```

---

## 📊 Database Schema

### contact_timeline (Main Timeline Table)

**Purpose:** Every single event in chronological order

```sql
CREATE TABLE contact_timeline (
  id UUID PRIMARY KEY,

  -- Contact identification
  user_id UUID,
  contact_email TEXT,
  contact_phone TEXT,
  contact_name TEXT,

  -- Event type & category
  event_type TEXT, -- 'chat_message', 'email_sent', 'sos_incident', etc.
  event_category TEXT, -- 'communication', 'emergency', 'sales', 'support', 'system'

  -- Event details
  event_title TEXT,
  event_description TEXT,
  event_data JSONB,

  -- Source tracking
  source_type TEXT, -- Which table this came from
  source_id UUID, -- ID in that table

  -- Related entities
  related_incident_id UUID,
  related_conference_id UUID,
  related_conversation_id UUID,

  -- AI analysis
  sentiment TEXT, -- 'positive', 'neutral', 'negative', 'urgent'
  ai_summary TEXT,
  ai_tags TEXT[],
  importance_score INTEGER, -- 1=Critical, 5=Low

  occurred_at TIMESTAMPTZ, -- When it happened
  created_at TIMESTAMPTZ
);
```

### contact_engagement_summary (Pre-computed Metrics)

**Purpose:** Fast access to aggregate statistics

```sql
CREATE TABLE contact_engagement_summary (
  user_id UUID,
  contact_email TEXT,
  contact_phone TEXT,

  -- Counts
  total_interactions INTEGER,
  email_count INTEGER,
  chat_count INTEGER,
  voice_count INTEGER,
  emergency_count INTEGER,

  -- Email metrics
  emails_sent INTEGER,
  emails_opened INTEGER,
  emails_clicked INTEGER,
  email_open_rate NUMERIC,

  -- Lead scoring
  lead_score INTEGER,
  lead_status TEXT, -- 'cold', 'warm', 'hot', 'customer'

  -- Sentiment
  positive_interactions INTEGER,
  negative_interactions INTEGER,
  sentiment_trend TEXT, -- 'improving', 'declining', 'stable'

  -- Risk
  risk_level TEXT, -- 'none', 'low', 'medium', 'high', 'critical'
  last_emergency_at TIMESTAMPTZ,

  -- Timestamps
  last_interaction_at TIMESTAMPTZ,
  first_interaction_at TIMESTAMPTZ
);
```

### ai_contact_context (AI Cache)

**Purpose:** Pre-generated context summaries for instant AI lookup

```sql
CREATE TABLE ai_contact_context (
  user_id UUID,
  contact_email TEXT,

  -- Pre-computed for AI
  full_context TEXT, -- Complete narrative
  key_facts JSONB, -- Array of important facts
  recent_events_summary TEXT,
  relationship_status TEXT,

  -- Patterns
  preferred_channel TEXT,
  typical_response_time_minutes INTEGER,

  context_generated_at TIMESTAMPTZ
);
```

---

## 🚀 Setup & Deployment

### Step 1: Deploy Database Migration

```bash
# Deploy the timeline schema
supabase db push

# Or apply specific migration
supabase migration up
```

This creates:
- `contact_timeline` table
- `contact_engagement_summary` table
- `ai_contact_context` table
- Auto-update triggers
- Performance indexes

### Step 2: Deploy Timeline Aggregator Function

```bash
# Deploy the event aggregator
supabase functions deploy timeline-aggregator
```

### Step 3: Update Clara AI Function

```bash
# Re-deploy Clara with timeline integration
supabase functions deploy clara-voice-agent
supabase functions deploy emergency-conference
```

### Step 4: Test Timeline System

```bash
# Add a test event
curl -X POST "$SUPABASE_URL/functions/v1/timeline-aggregator" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add_event",
    "event": {
      "userId": "user-uuid",
      "contactEmail": "test@example.com",
      "eventType": "chat_message",
      "eventCategory": "communication",
      "eventTitle": "Customer inquiry",
      "eventDescription": "Asked about emergency services pricing",
      "sentiment": "positive",
      "importanceScore": 3
    }
  }'
```

---

## 💻 How to Use

### 1. Adding Events to Timeline

#### From Edge Functions (Automatic)

The timeline-aggregator has helper functions for common events:

```typescript
// Automatically capture SOS incident
await fetch(`${SUPABASE_URL}/functions/v1/timeline-aggregator`, {
  method: 'POST',
  body: JSON.stringify({
    action: 'capture_sos',
    incident: sosIncidentObject
  })
});

// Automatically capture conference join
await fetch(`${SUPABASE_URL}/functions/v1/timeline-aggregator`, {
  method: 'POST',
  body: JSON.stringify({
    action: 'capture_conference_join',
    participant: participantObject,
    conference: conferenceObject
  })
});

// Automatically capture chat message
await fetch(`${SUPABASE_URL}/functions/v1/timeline-aggregator`, {
  method: 'POST',
  body: JSON.stringify({
    action: 'capture_chat',
    message: messageObject,
    conversation: conversationObject
  })
});
```

#### From React App

```typescript
import { useTimelineActions } from '@/hooks/useContactTimeline';

const { addSOSIncident, addConferenceJoin, addChatMessage } = useTimelineActions(
  userId,
  contactEmail,
  contactPhone
);

// Add SOS incident
await addSOSIncident(incidentId, location);

// Add chat message
await addChatMessage("Hello, I need help!", true);
```

### 2. Reading Timeline in React

```typescript
import { useContactTimeline } from '@/hooks/useContactTimeline';

function CustomerView({ userId }) {
  const {
    timeline,
    engagement,
    aiContext,
    isLoading,
    totalInteractions,
    leadScore,
    riskLevel,
    emergencyCount,
    getRecentEvents,
    getCriticalEvents
  } = useContactTimeline({ userId, realtime: true });

  // Get last 30 days
  const recentEvents = getRecentEvents(30);

  // Get critical events only
  const critical = getCriticalEvents();

  return (
    <div>
      <h2>Total Interactions: {totalInteractions}</h2>
      <p>Lead Score: {leadScore}</p>
      <p>Risk Level: {riskLevel}</p>
      <p>Emergencies: {emergencyCount}</p>

      {timeline.map(event => (
        <div key={event.id}>
          <h3>{event.eventTitle}</h3>
          <p>{event.eventDescription}</p>
          <span>{new Date(event.occurredAt).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
```

### 3. Admin Timeline Viewer

```typescript
import ContactTimelineViewer from '@/components/admin/ContactTimelineViewer';

function AdminCustomerPage({ userId, contactEmail }) {
  return (
    <ContactTimelineViewer
      userId={userId}
      contactEmail={contactEmail}
      contactName="John Smith"
    />
  );
}
```

Features:
- ✅ Beautiful visual timeline
- ✅ Filter by category (emergency, communication, sales, etc.)
- ✅ Click events for full details
- ✅ Export to CSV
- ✅ Real-time updates
- ✅ Engagement metrics dashboard
- ✅ AI context summary

### 4. Clara AI Using Timeline Context

**Automatic!** Clara now receives customer context automatically:

When emergency conference starts:
1. `emergency-conference` function calls `clara-voice-agent` with `userId`
2. Clara fetches timeline context via `get_contact_ai_context()` function
3. Context injected into Clara's system prompt
4. Clara references past interactions naturally during call

**Example Clara response with context:**

```
"Hello David, thank you for answering. This is Clara from ICE SOS.
Sarah has activated an emergency alert. I see you helped Sarah
during her last emergency 2 months ago - thank you for being
such a reliable responder. Can you reach Sarah today? How long
will it take you?"
```

---

## 🎯 Event Types Reference

### Communication Events
- `chat_message` - Web chat or WhatsApp message
- `email_sent` - Email sent to customer
- `email_opened` - Customer opened email
- `email_clicked` - Customer clicked link in email
- `voice_call` - Phone call (non-emergency)

### Emergency Events
- `sos_incident` - Emergency SOS activated
- `conference_join` - Participant joined emergency conference

### Sales/Lead Events
- `lead_captured` - New lead from landing page
- `lead_score_change` - Lead score updated
- `registration_completed` - User registered account
- `subscription_change` - Plan upgrade/downgrade
- `payment_event` - Payment successful/failed

### System Events
- `profile_update` - User updated their profile
- `ai_interaction` - AI conversation occurred

---

## 📈 Analytics & Queries

### Get Timeline for a User

```sql
SELECT *
FROM contact_timeline
WHERE user_id = 'user-uuid'
ORDER BY occurred_at DESC
LIMIT 50;
```

### Get All Emergency Events

```sql
SELECT *
FROM contact_timeline
WHERE event_category = 'emergency'
ORDER BY occurred_at DESC;
```

### Get High-Priority Events

```sql
SELECT *
FROM contact_timeline
WHERE importance_score <= 2
ORDER BY occurred_at DESC;
```

### Get Engagement Summary

```sql
SELECT *
FROM contact_engagement_summary
WHERE user_id = 'user-uuid';
```

### Get AI Context

```sql
SELECT *
FROM get_contact_ai_context(
  p_user_id := 'user-uuid',
  p_contact_email := NULL
);
```

### Lead Scoring Query

```sql
SELECT
  user_id,
  contact_email,
  lead_score,
  total_interactions,
  email_open_rate,
  sentiment_trend,
  lead_status
FROM contact_engagement_summary
WHERE lead_score > 50
ORDER BY lead_score DESC;
```

### Risk Assessment Query

```sql
SELECT
  user_id,
  contact_name,
  risk_level,
  emergency_count,
  last_emergency_at,
  emergency_response_avg_minutes
FROM contact_engagement_summary
WHERE risk_level IN ('high', 'critical')
ORDER BY last_emergency_at DESC;
```

---

## 🤖 Clara AI Integration Details

### How Clara Uses Timeline Context

**1. Context Retrieval (Automatic)**

When Clara joins conference:
```typescript
const { data: context } = await supabase
  .rpc("get_contact_ai_context", {
    p_user_id: userId,
    p_contact_email: null
  });
```

**2. Context Injection into System Prompt**

```typescript
const prompt = `
You are Clara, an AI emergency coordinator.

**CUSTOMER HISTORY & CONTEXT:**
${context.full_context}

Key Facts:
- Total interactions: 47
- Last emergency: 2 months ago
- Lead score: 85
- Sentiment: Positive

Recent Events: Registered 6 months ago, upgraded to premium 3 months ago...

Previous Emergencies: Last emergency on Jan 15, 2026. Response time: 12 minutes.

⚠️ USE THIS CONTEXT: Reference past interactions naturally during the call.
`;
```

**3. Clara's Contextual Responses**

Without context:
> "Hello, thank you for joining the emergency conference."

With context:
> "Hello David, thank you for joining. I see you helped Sarah during her last emergency in January - your response time was excellent. Can you assist again today?"

### What Clara Knows

✅ **Past Emergencies:** Number, dates, response times
✅ **Customer Status:** Lead, registered user, premium customer
✅ **Interaction History:** Chat conversations, emails, calls
✅ **Sentiment Trend:** Positive, improving, declining
✅ **Risk Level:** Emergency frequency and patterns
✅ **Lead Score:** Engagement level
✅ **Preferred Contact:** Email, phone, chat

---

## 🔍 Monitoring Timeline System

### Check Recent Events

```sql
-- See latest 20 timeline events
SELECT
  event_type,
  event_category,
  event_title,
  contact_name,
  occurred_at
FROM contact_timeline
ORDER BY occurred_at DESC
LIMIT 20;
```

### Monitor Engagement Updates

```sql
-- See users with highest engagement
SELECT
  contact_name,
  contact_email,
  total_interactions,
  lead_score,
  sentiment_trend,
  last_interaction_at
FROM contact_engagement_summary
ORDER BY total_interactions DESC
LIMIT 10;
```

### Check AI Context Cache

```sql
-- See AI context freshness
SELECT
  contact_email,
  relationship_status,
  context_generated_at,
  now() - context_generated_at as age
FROM ai_contact_context
ORDER BY context_generated_at DESC
LIMIT 10;
```

### Watch Logs

```bash
# Timeline aggregator logs
supabase functions logs timeline-aggregator --tail

# Look for:
# ✅ Timeline event added: chat_message for john@example.com
# ✅ AI context updated for sarah@example.com
```

---

## 🐛 Troubleshooting

### Events not appearing in timeline

**Check:**
1. Timeline aggregator function deployed?
2. Event sent to correct endpoint?
3. Contact identifiers provided (userId OR email OR phone)?

**Fix:**
```bash
# Re-deploy function
supabase functions deploy timeline-aggregator

# Test manually
curl -X POST "$SUPABASE_URL/functions/v1/timeline-aggregator" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "add_event", "event": {...}}'
```

### Clara not using context

**Check:**
1. userId passed to clara-voice-agent?
2. AI context exists for user?
3. Check logs for "Timeline context loaded"

**Fix:**
```sql
-- Check if context exists
SELECT * FROM ai_contact_context
WHERE user_id = 'user-uuid';

-- Manually trigger context generation
SELECT * FROM get_contact_ai_context(
  p_user_id := 'user-uuid',
  p_contact_email := NULL
);
```

### Engagement summary not updating

**Check:**
1. Trigger exists on contact_timeline?
2. Timeline events have valid contact identifiers?

**Fix:**
```sql
-- Manually refresh engagement
SELECT update_contact_engagement()
FROM contact_timeline
WHERE user_id = 'user-uuid'
LIMIT 1;
```

---

## 💰 Benefits Summary

### For Admins
✅ **Complete Customer View:** See entire journey from lead to emergency user
✅ **Lead Scoring:** Auto-calculated based on ALL interactions
✅ **Risk Assessment:** Identify high-risk customers automatically
✅ **Export Reports:** CSV export of any customer's full history

### For AI (Clara)
✅ **Perfect Memory:** Knows every past interaction
✅ **Personalized Response:** References past emergencies naturally
✅ **Context-Aware:** Understands customer relationship status
✅ **Better Outcomes:** Builds trust through personalization

### For Customers
✅ **No Repetition:** Never have to explain your history again
✅ **Faster Service:** AI already knows your situation
✅ **Trust Building:** AI remembers helping you before
✅ **Seamless Experience:** All channels connected

---

## 🎉 What Timeline Brings to ICE SOS

**Before Timeline:**
- Clara: Generic emergency coordinator
- Admin: Scattered data across tables
- Customer: Feels like talking to strangers every time

**After Timeline:**
- Clara: "I see you helped Sarah last time - thank you!"
- Admin: Complete customer journey in one beautiful view
- Customer: "Wow, they remember me!"

---

**Timeline is live. Your platform now has perfect memory. 🧠**

Next: Sprint 4 - Instant Voice Callback for instant human connection.
