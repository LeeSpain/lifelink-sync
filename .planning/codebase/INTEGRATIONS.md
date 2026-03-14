# LifeLink Sync External Integrations

This document maps all third-party service integrations, their configuration, usage patterns, and environment variable requirements.

---

## 1. Supabase (Database + Auth + Edge Functions)

### Overview
Supabase is the primary backend service providing PostgreSQL database, JWT authentication, real-time subscriptions, and serverless functions.

### Configuration
- **Package**: `@supabase/supabase-js@2.57.4`
- **Client location**: `src/integrations/supabase/client.ts`
- **Types**: `src/integrations/supabase/types.ts` (auto-generated from schema)

### Client Initialization
```typescript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

### Environment Variables
```bash
VITE_SUPABASE_URL=https://cprbgquiqbyoyrffznny.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Features Used

#### Authentication
- JWT-based (email + password)
- Password reset flow: `supabase.auth.resetPasswordForEmail(email, { redirectTo: ... })`
- Session stored in localStorage with auto-refresh
- Magic links for passwordless auth

**Relevant files**:
- `src/contexts/AuthContext.tsx` — global auth state
- `src/pages/Auth.tsx` — login/reset page
- `src/pages/AIRegister.tsx` — registration page

#### Database (PostgreSQL)
**Key tables**:
- `profiles` — user profile data
- `subscription_plans` — available plans
- `user_subscriptions` — active subscriptions
- `emergency_contacts` — user's emergency contacts
- `medical_info` — emergency medical data
- `family_members` — family connections
- `sos_events` — emergency activations (7-year retention)
- `devices` — connected devices
- `live_presence` — real-time user status
- `live_locations` — GPS location pings
- `location_pings` — location history
- `place_events` — geofence events
- `places` — geofence locations
- `sos_incidents` — SOS incident tracking
- `sos_call_attempts` — Twilio call records

**Row Level Security (RLS)**: Enforced on all tables. Users can only read/write their own data.

**Usage patterns**:
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId);

// RLS automatically filters based on JWT
// Never pass user_id manually to filter
```

**Relevant files**:
- All pages/components use `supabase` from `@/integrations/supabase/client`
- Hooks like `useFamilyMembers.ts`, `useEmergencyContacts.ts` wrap database queries
- Admin pages: `src/components/admin/` for data management

#### Real-time Subscriptions
- WebSocket connections for live data updates
- Subscribed tables: live_presence, live_locations, sos_incidents, etc.

**Usage**:
```typescript
supabase
  .channel('live-locations')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'live_locations' },
    (payload) => { /* handle update */ }
  )
  .subscribe();
```

**Relevant files**:
- Map components: `src/components/maplibre/`
- Dashboard pages use real-time updates for live status

### Supabase Edge Functions

Edge functions run on Deno runtime in Supabase infrastructure. They provide serverless compute for:
- AI chat (Anthropic/OpenAI integration)
- Payment processing (Stripe webhooks)
- SMS/Twilio callbacks
- Email automation (Resend)
- Background jobs and cron tasks

**Function location**: `supabase/functions/*/index.ts`

**Deployment**: Committed to git, automatically deployed via Supabase CLI

**Environment variables in edge functions** (set in Supabase dashboard):
```bash
SUPABASE_URL               # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY  # Admin key (not exposed to client)
SUPABASE_ANON_KEY          # Public key
ANTHROPIC_API_KEY          # For AI chat
OPENAI_API_KEY            # Alternative AI provider
STRIPE_SECRET_KEY         # Stripe secret key
STRIPE_WEBHOOK_SECRET     # Webhook signature validation
TWILIO_ACCOUNT_SID        # Twilio account ID
TWILIO_AUTH_TOKEN         # Twilio auth token
TWILIO_FROM_NUMBER        # Caller ID number
RESEND_API_KEY            # Email service API key
```

---

## 2. Stripe (Payment Processing)

### Overview
Stripe handles subscription billing, one-time payments, and payment method storage.

### Configuration
- **Package**: `stripe@14.21.0` (npm, in edge functions)
- **React bindings**: `@stripe/react-stripe-js@3.8.1`
- **Client library**: `@stripe/stripe-js@7.7.0`
- **Client setup**: `src/lib/stripe.ts`

### Client-Side Integration
```typescript
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(VITE_STRIPE_PUBLISHABLE_KEY);
```

### Components Using Stripe
- `src/components/EmbeddedPayment.tsx` — embedded payment form
- `src/components/dashboard/SubscriptionCard.tsx` — subscription display
- `src/components/admin/StripeManagementControl.tsx` — admin panel
- `src/pages/CheckoutPage.tsx` — checkout flow

### Environment Variables
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Client-side public key
# Secret key in edge functions only:
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Edge Functions for Stripe

#### Payment Intent & Checkout Creation
- `supabase/functions/create-payment/index.ts` — create payment intent
- `supabase/functions/create-payment-intent/index.ts` — alternative payment flow
- `supabase/functions/create-checkout/index.ts` — create checkout session
- `supabase/functions/family-subscription-checkout/index.ts` — family plan checkout
- `supabase/functions/process-family-payment/index.ts` — process family subscription
- `supabase/functions/process-mixed-payment/index.ts` — combined plans

#### Subscription Management
- `supabase/functions/check-subscription/index.ts` — verify active subscription
- `supabase/functions/create-subscriptions/index.ts` — create recurring billing
- `supabase/functions/customer-portal/index.ts` — Stripe customer portal redirect
- `supabase/functions/manage-customer-subscription/index.ts` — update subscription
- `supabase/functions/manage-addons/index.ts` — add-on purchases
- `supabase/functions/addon-checkout/index.ts` — add-on checkout

#### Setup & Reconciliation
- `supabase/functions/setup-stripe-products/index.ts` — create product catalog
- `supabase/functions/setup-family-stripe-products/index.ts` — family product setup
- `supabase/functions/setup-addon-stripe-products/index.ts` — add-on product setup
- `supabase/functions/reconcile-stripe-data/index.ts` — sync Stripe and DB
- `supabase/functions/assign-customer-product/index.ts` — link customer to product

#### Webhook Processing
- `supabase/functions/stripe-webhook/index.ts` — main webhook handler
  - Validates HMAC SHA-256 signature
  - Processes events: `payment_intent.succeeded`, `invoice.paid`, etc.
  - Updates `user_subscriptions` table
  - Pauses location visibility if billing is past due

#### Admin & Reporting
- `supabase/functions/get-stripe-config/index.ts` — fetch Stripe configuration
- `supabase/functions/billing-invoices/index.ts` — retrieve invoice history
- `supabase/functions/get-admin-revenue/index.ts` — revenue analytics

### Webhook Signature Verification
```typescript
// In stripe-webhook/index.ts
const verified = await verifyStripeSignature(payload, sigHeader, STRIPE_WEBHOOK_SECRET);
// Uses HMAC-SHA256 with constant-time comparison
```

### Pricing
- Individual Plan: €9.99/month
- Family Add-on: €2.99/month per additional member
- Addon Plans: €2.99/month (wellbeing, medication reminders)

---

## 3. Anthropic (AI Chat via Claude)

### Overview
Anthropic's Claude API powers CLARA, the AI safety assistant.

### Configuration
- **Package**: HTTP calls from Deno edge functions (no npm package)
- **API**: REST endpoint `https://api.anthropic.com/v1/messages`
- **Model**: Various Claude models (3-5-sonnet, 3-haiku recommended)

### Integration Points
- `supabase/functions/ai-chat/index.ts` — main CLARA chat endpoint
  - Accepts user messages
  - Maintains conversation context
  - Implements safety guardrails
  - Escalates sensitive topics (refunds, legal, GDPR)
  - Currency/pricing conversion
  - Multi-language support (EN, ES, NL)

### Environment Variable
```bash
ANTHROPIC_API_KEY=sk-ant-...  # Set in Supabase dashboard
```

### Usage Pattern
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('ANTHROPIC_API_KEY')}`,
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: /* knowledge base */,
    messages: /* conversation history */
  })
});
```

### Safety Implementation
- **7 Unbreakable Laws**:
  1. No fabricated features/stats
  2. No promises outside documentation
  3. No medical/legal/financial advice
  4. No competitor comparisons
  5. No pricing exceptions
  6. Refunds/cancellations → escalate to Lee
  7. Always sound human, not robotic

- **Escalation triggers**: Refund, cancel, complaint, angry, legal, GDPR, data deletion, enterprise, partnership, press, journalist, sue, lawyer, fraud, charged twice

### Relevant Frontend Components
- `src/components/ai-chat/ChatWidget.tsx` — embedded chat UI
- `src/components/ai-chat/EnhancedChatWidget.tsx` — enhanced version
- `src/components/ContactChatWidget.tsx` — contact page chat

---

## 4. OpenAI (Alternative AI Provider)

### Overview
Optional alternative to Anthropic for AI features. Not always enabled.

### Configuration
- **Package**: HTTP calls from Deno (no npm package)
- **API**: `https://api.openai.com/v1/chat/completions`

### Environment Variable
```bash
OPENAI_API_KEY=sk-...  # Set in Supabase dashboard (optional)
```

### Integration Points
- `supabase/functions/ai-chat/index.ts` — supports OpenAI fallback
- `supabase/functions/content-generator/index.ts` — text generation
- `supabase/functions/image-generator/index.ts` — DALL-E image generation
- `supabase/functions/lead-intelligence/index.ts` — lead analysis

### Usage Pattern
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4-turbo',
    messages: /* conversation */
  })
});
```

---

## 5. Twilio (SMS + Voice + WebRTC)

### Overview
Twilio handles emergency notifications via SMS, voice calls, and conference bridges.

### Configuration
- **Package**: HTTP REST API from Deno edge functions (no npm package)
- **Base URL**: `https://api.twilio.com`

### Environment Variables
```bash
TWILIO_ACCOUNT_SID=AC...         # Twilio account ID
TWILIO_AUTH_TOKEN=...            # API authentication token
TWILIO_FROM_NUMBER=+1234567890  # Caller ID for outbound calls
```

### Key Features

#### SMS Notifications
- `supabase/functions/emergency-sos/index.ts` — send emergency alerts to contacts
- `supabase/functions/bulk-messaging/index.ts` — batch SMS campaigns
- `supabase/functions/send-customer-communication/index.ts` — customer notifications

#### Voice Calls
- `supabase/functions/emergency-conference/index.ts` — set up multi-party calls
- `supabase/functions/emergency-sos-conference/index.ts` — enhanced SOS conference
- `supabase/functions/instant-callback/index.ts` — immediate callback to user
- `supabase/functions/clara-voice-agent/index.ts` — CLARA voice interface

#### WebRTC Media
- `supabase/functions/clara-media-stream/index.ts` — real-time media stream for CLARA voice
- `supabase/functions/twilio-status-webhook/index.ts` — status updates for calls
  - Receives call status: `queued`, `ringing`, `in-progress`, `completed`, `failed`, `busy`, `no-answer`
  - Updates `sos_call_attempts` table with duration and status
  - Validates incoming requests from Twilio IP whitelist

#### Conference Management
- `supabase/functions/conference-status/index.ts` — check participant status
- `supabase/functions/emergency-service-integration/index.ts` — integration with emergency services
- `supabase/functions/transfer-client-to-care/index.ts` — transfer to human agent

### Webhook Integration
- **Endpoint**: `{project_url}/functions/v1/twilio-status-webhook`
- **Authentication**: URL parameter validation (not JWT)
- **Payload format**: Form-encoded (application/x-www-form-urlencoded)
- **Data captured**:
  - `CallSid` — unique call identifier
  - `CallStatus` — current status
  - `CallDuration` — seconds elapsed
  - `From`, `To` — phone numbers
  - `RecordingUrl` — if recorded

### Example SOS Flow
1. User triggers SOS in app
2. `supabase/functions/emergency-sos-enhanced/index.ts` — assess situation
3. SMS sent to emergency contacts via Twilio
4. Optional voice call initiated
5. Conference bridge created if multiple participants
6. Twilio webhooks update call status in real-time
7. Location and medical info shared with responders

---

## 6. Resend (Email Service)

### Overview
Resend handles transactional email delivery (welcome, password reset, notifications).

### Configuration
- **Package**: `npm:resend@2.0.0` (npm package in Deno edge functions)
- **API**: REST HTTP endpoint

### Environment Variable
```bash
RESEND_API_KEY=re_...  # Set in Supabase dashboard
```

### Edge Functions Using Resend

#### Account Lifecycle
- `supabase/functions/send-welcome-email/index.ts` — welcome email on signup
  - Personalized greeting
  - Dashboard/support links
  - Subscription tier features (if applicable)
  - Branded HTML template

#### Password & Auth
- `supabase/functions/ai-registration/index.ts` — registration confirmation
- Password reset handled by Supabase Auth (uses Resend backend)

#### Notifications & Updates
- `supabase/functions/email-automation/index.ts` — automated email flows
- `supabase/functions/enhanced-email-automation/index.ts` — advanced workflows
- `supabase/functions/notify-user/index.ts` — general notifications
- `supabase/functions/family-invites/index.ts` — family invitation emails
- `supabase/functions/family-invite-management/index.ts` — invite management

#### Marketing & Campaigns
- `supabase/functions/email-campaign-creator/index.ts` — create campaigns
- `supabase/functions/email-campaigns/index.ts` — execute campaigns
- `supabase/functions/email-publisher/index.ts` — publish email content
- `supabase/functions/email-scheduler/index.ts` — schedule sends
- `supabase/functions/email-processor/index.ts` — process email events

#### System Emails
- `supabase/functions/contact-form/index.ts` — contact form submissions → email
- `supabase/functions/regional-send-note/index.ts` — regional team notifications

### Usage Pattern
```typescript
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const { data, error } = await resend.emails.send({
  from: "noreply@lifelink-sync.com",
  to: user.email,
  subject: "Welcome to LifeLink Sync",
  html: emailTemplate,
});
```

---

## 7. Google Analytics (GA4)

### Overview
GA4 tracks user behavior, conversions, and engagement metrics.

### Configuration
- **Script**: Injected via Google Tag Manager gtag script
- **Package**: Native browser API (no npm package)
- **Initialization**: `src/lib/analytics.ts`

### Environment Variable
```bash
VITE_GA_MEASUREMENT_ID=G-...  # GA4 property ID
```

### Features Tracked
- Page views (with path and title)
- Emergency SOS events
- Subscription purchases and changes
- User interactions (clicks, form submissions)
- E-commerce tracking (purchase, items, value)
- Custom user properties (role, plan, location)
- Core Web Vitals

### Implementation
```typescript
// Initialization
export function initAnalytics() {
  const gtagScript = document.createElement('script');
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(gtagScript);
  window.gtag('config', GA_MEASUREMENT_ID);
}

// Event tracking
export function trackEvent(eventName: string, parameters?: Record<string, any>) {
  window.gtag('event', eventName, parameters);
}

// E-commerce tracking
export function trackPurchase(transactionId: string, items: any[], value: number) {
  window.gtag('event', 'purchase', { transaction_id: transactionId, value, items });
}
```

### Relevant Files
- `src/config/analytics.ts` — configuration
- `src/lib/analytics.ts` — tracking functions
- `src/main.tsx` — initialization

---

## 8. Sentry (Error Tracking & Performance Monitoring)

### Overview
Sentry captures exceptions, performance metrics, and user sessions.

### Configuration
- **Package**: `@sentry/react@7.120.4`
- **Initialization**: `src/lib/analytics.ts`

### Environment Variable
```bash
VITE_SENTRY_DSN=https://...@sentry.io/...  # Error tracking endpoint
```

### Features
- Crash reporting
- Error context (breadcrumbs, user info, tags)
- Performance monitoring (browser tracing)
- Session replay (0% sampled, 10% on error)
- Source maps uploaded on deploy

### Implementation
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.1,
});
```

### Relevant Files
- `src/config/analytics.ts` — configuration
- `src/lib/analytics.ts` — initialization
- `src/utils/errorReporting.ts` — error handling
- `src/components/EnhancedErrorBoundary.tsx` — error boundary with Sentry

---

## 9. Vercel (Hosting & Deployment)

### Overview
Vercel hosts the web application, handles deployment, environment variables, and edge middleware.

### Configuration
- **Config file**: `vercel.json`
- **Framework**: Vite
- **Build command**: `npm run build`
- **Output directory**: `dist/`

### Environment Variables (Vercel Dashboard)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_GA_MEASUREMENT_ID`
- `VITE_SENTRY_DSN`

### Headers & Security
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; ... connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com" }
      ]
    }
  ]
}
```

### Rewrites & Routing
- `/tablet-dashboard` → `/tablet.html` (tablet-specific UI)
- `/(.*)`  → `/index.html` (SPA fallback for React Router)

### Service Worker Caching
- SW scripts: no-cache
- Manifest: 7-day cache
- Static: immutable
- Supabase: 1-hour cache
- Images: 90-day cache

---

## 10. OpenStreetMap Tiles (Mapping)

### Overview
OSM provides free raster tiles for the MapLibre GL map component. No API key required.

### Configuration
- **Package**: `maplibre-gl@5.19.0`
- **Tile source**: `https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Attribution**: OpenStreetMap contributors

### Usage
- `src/components/maplibre/MapLibreMap.tsx` — main map component
- `src/components/maplibre/layers/` — layer components
- Geofences, live locations, routes, incidents rendered as GeoJSON layers

### Features
- Vector map rendering (OpenStreetMap data)
- Clustering for markers
- Geofence visualization (circles, polygons)
- Real-time location updates via Supabase
- No authentication required

---

## 11. Lovable (Development & Design)

### Overview
Lovable is the AI-assisted design and development platform used for this project.

### Configuration
- **Project URL**: `https://lovable.dev/projects/a856a70f-639b-4212-b411-d2cdb524d754`
- **Development server** (Capacitor): Points to Lovable project URL
- **Package**: `lovable-tagger@1.1.7` (dev-only)

### Purpose
- AI-powered component generation
- Design-to-code workflow
- Component tagging for organization

---

## 12. Various Third-Party APIs (Edge Functions)

### Gmail Integration
- `supabase/functions/gmail-oauth/index.ts` — OAuth setup
- `supabase/functions/gmail-oauth-callback/index.ts` — OAuth callback
- `supabase/functions/gmail-integration/index.ts` — read/send emails
- `supabase/functions/gmail-token-security/index.ts` — token management

### Social Media Integrations
- `supabase/functions/social-media-oauth/index.ts` — OAuth flows
- `supabase/functions/social-oauth-handler/index.ts` — OAuth handling
- `supabase/functions/social-media-publisher/index.ts` — post to social
- `supabase/functions/riven-social-publisher/index.ts` — Riven integration

### Content & Marketing
- `supabase/functions/content-generator/index.ts` — AI-generated content
- `supabase/functions/content-cleaner/index.ts` — content sanitization
- `supabase/functions/content-publisher/index.ts` — publish content
- `supabase/functions/content-scheduler/index.ts` — schedule posts
- `supabase/functions/riven-content-single/index.ts` — Riven content
- `supabase/functions/riven-campaign-generator/index.ts` — campaign creation
- `supabase/functions/riven-marketing-enhanced/index.ts` — marketing automation

### Analytics & Intelligence
- `supabase/functions/lead-intelligence/index.ts` — lead scoring/analysis
- `supabase/functions/analytics-aggregator/index.ts` — data aggregation
- `supabase/functions/timeline-aggregator/index.ts` — user activity timeline
- `supabase/functions/get-customer-activity/index.ts` — customer analytics
- `supabase/functions/video-analytics-ingest/index.ts` — video tracking

### Monitoring & Health
- `supabase/functions/system-health/index.ts` — system status checks
- `supabase/functions/health-check/index.ts` — comprehensive health endpoint
- `supabase/functions/sla-monitor/index.ts` — SLA tracking
- `supabase/functions/auth-security-monitor/index.ts` — security monitoring

### Automation & Workflows
- `supabase/functions/automation-runner/index.ts` — execute automated tasks
- `supabase/functions/automation-triggers/index.ts` — trigger management
- `supabase/functions/workflow-automation/index.ts` — workflow execution
- `supabase/functions/campaign-manager/index.ts` — campaign orchestration

### Geolocation & Places
- `supabase/functions/geo-lookup/index.ts` — reverse geocoding
- `supabase/functions/detect-place-events/index.ts` — geofence trigger detection
- `supabase/functions/regional-user-invite/index.ts` — regional onboarding
- `supabase/functions/record-location-ping/index.ts` — store location history

### Trial & Subscription Management
- `supabase/functions/activate-trial/index.ts` — start free trial
- `supabase/functions/expire-trials/index.ts` — end trial period
- `supabase/functions/free-trial-signup/index.ts` — trial signup flow

### Other
- `supabase/functions/business-info/index.ts` — company metadata
- `supabase/functions/generate-embeddings/index.ts` — vector embeddings for search
- `supabase/functions/image-generator/index.ts` — AI image generation (DALL-E)
- `supabase/functions/posting-processor/index.ts` — process social posts
- `supabase/functions/smart-routing/index.ts` — intelligent routing
- `supabase/functions/unified-inbox/index.ts` — centralized messaging
- `supabase/functions/enforce-location-retention/index.ts` — data retention policy

---

## 13. Blog & CMS

- `supabase/functions/blog-publisher/index.ts` — publish blog posts
- `supabase/functions/riven-daily-publisher/index.ts` — daily content publishing
- `supabase/functions/posting-processor/index.ts` — process blog submissions

---

## Summary of Integration Patterns

### Frontend Integration
- **Browser APIs**: localStorage, sessionStorage, fetch, WebSocket (for Supabase Realtime)
- **External libraries**: Stripe.js, Sentry SDK, GA4 gtag script
- **Environment variables**: Loaded via `import.meta.env.VITE_*`

### Edge Function Integration
- **Deno runtime**: No npm, use ES modules from esm.sh
- **HTTP requests**: Native `fetch()` API
- **Authentication**: Bearer tokens in Authorization header
- **Error handling**: Async/await with try/catch

### Webhook Endpoints
- Stripe: HMAC-SHA256 signature validation
- Twilio: Form-encoded payload, no signature (IP whitelist)
- Supabase: JWT validation in headers (optional)

### Secret Management
- **Frontend**: Only public keys (VITE_ prefix, safe to expose)
- **Backend (edge functions)**: Secret keys via Supabase dashboard environment variables
- **Never commit**: API keys, secret tokens, webhook secrets

---

## Environment Variables Checklist

### Required for Production
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` (Vercel)
- [ ] `STRIPE_SECRET_KEY` (Supabase edge functions)
- [ ] `STRIPE_WEBHOOK_SECRET` (Supabase edge functions)

### Optional but Recommended
- [ ] `VITE_GA_MEASUREMENT_ID` (Vercel)
- [ ] `VITE_SENTRY_DSN` (Vercel)
- [ ] `ANTHROPIC_API_KEY` (Supabase edge functions) — for CLARA AI
- [ ] `OPENAI_API_KEY` (Supabase edge functions) — alternative AI
- [ ] `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (Supabase)
- [ ] `RESEND_API_KEY` (Supabase edge functions) — for email

### Development-Only
- [ ] `VITE_APP_ENV=development`

---

## Testing Integrations

### Local Development
- Use `.env.local` for Supabase credentials
- Edge functions: Deploy to Supabase with `supabase deploy --function-name function_name`
- Test webhooks: Use Stripe test mode + Twilio sandbox

### Staging
- Deploy to Vercel preview branch
- Connect to Supabase staging project
- Use Stripe test API keys

### Production
- Vercel production environment
- Supabase production project
- Live Stripe keys
- All secrets in Supabase and Vercel dashboards
