# LifeLink Sync Application Architecture

## Overview

LifeLink Sync is a React-based Single Page Application (SPA) with a sophisticated backend architecture built on Supabase PostgreSQL and Deno Edge Functions. The application delivers real-time emergency response capabilities, AI-powered assistance (CLARA), and family safety management across web and mobile platforms.

**Technology Stack:**
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Edge Computing:** Supabase Deno Functions (116 edge functions)
- **State Management:** React Context API + TanStack React Query
- **Mobile:** Capacitor (iOS/Android native bridge)
- **Deployment:** Vercel (frontend), Supabase Cloud (backend)
- **AI Integration:** Anthropic Claude API (CLARA assistant)

---

## System Architecture Pattern

### SPA with Serverless Backend

```
┌─────────────────────────────────────────────────┐
│         Browser / Mobile App (React SPA)        │
│  ┌─────────────────────────────────────────┐   │
│  │ Components → Contexts → Hooks → Utils   │   │
│  └─────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────┘
                     │ HTTPS REST/Realtime
                     ▼
        ┌─────────────────────────────┐
        │    Vercel CDN + Edge        │
        │    (Frontend + Static)      │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │    Supabase Cloud           │
        │  ┌─────────────────────┐   │
        │  │ PostgreSQL Database │   │
        │  │ Auth (JWT Sessions) │   │
        │  │ Realtime Subscriptions  │   │
        │  └─────────────────────┘   │
        │  ┌─────────────────────┐   │
        │  │ Deno Edge Functions │   │
        │  │ (116 serverless)    │   │
        │  │ - AI Chat           │   │
        │  │ - Payments          │   │
        │  │ - Webhooks          │   │
        │  └─────────────────────┘   │
        └─────────────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │  External APIs              │
        │  - Anthropic (Claude)       │
        │  - Stripe (Payments)        │
        │  - Vonage (Comms)           │
        │  - Twilio (Callbacks)       │
        └─────────────────────────────┘
```

---

## Data Flow Architecture

### Request → Response Flow

1. **Client Request (React Component)**
   - Component dispatches action via hook or context
   - TanStack Query manages caching and refetching
   - Supabase JS client handles RLS-aware requests

2. **Authentication Layer**
   - Supabase Auth provides JWT token in session
   - AuthContext wraps entire app with `useAuth()` hook
   - Dev bypass mode available (localStorage flag) for testing
   - Automatic token refresh on 401

3. **Supabase Client**
   - Singleton instance: `src/integrations/supabase/client.ts`
   - TypeScript-safe: auto-generated types from `types.ts`
   - Configured with localStorage persistence
   - Auto-refresh enabled

4. **RLS Policies**
   - All tables have Row Level Security enabled
   - Users can only read/write their own data
   - Emergency SOS events have special overrides
   - Service role key used server-side for admin operations

5. **Edge Function Processing**
   - Request routed to Deno function based on path
   - Function receives authenticated request context
   - Can access Supabase via service key
   - Returns JSON response to client

6. **External API Calls**
   - Edge functions call external APIs (Anthropic, Stripe, Vonage)
   - API keys stored in Supabase environment secrets
   - Responses formatted and returned to client
   - Error handling with proper HTTP status codes

7. **Response & State Update**
   - Client receives JSON response
   - TanStack Query updates cache
   - React context propagates state changes
   - Components re-render with new data

### Real-Time Data Flow (Supabase Realtime)

```
┌──────────────┐                              ┌──────────────┐
│  User A      │                              │  User B      │
│  Listening   │                              │  Listening   │
└──────┬───────┘                              └──────┬───────┘
       │                                             │
       └─────────────────┬──────────────────────────┘
                         ▼
                 ┌───────────────────┐
                 │  Supabase         │
                 │  Realtime Engine  │
                 └───────────────────┘
                         ▲
                         │
                 ┌───────┴────────┐
                 │ PostgreSQL     │
                 │ Triggers       │
                 │ (Database-side)│
                 └────────────────┘
```

Used for:
- Live presence updates (users online/offline)
- Real-time location pings (map updates)
- SOS event notifications
- Chat message delivery
- Live incident tracking

---

## Authentication Flow

### Email + Password Authentication

```
1. User submits email + password
   ↓
2. Supabase Auth validates credentials
   ↓
3. Session token (JWT) returned + stored in localStorage
   ↓
4. App stores session in AuthContext
   ↓
5. All subsequent requests include JWT token
   ↓
6. Token auto-refreshes on expiry (Supabase handles)
   ↓
7. On logout: token revoked, session cleared
```

### Protected Routes

```
<ProtectedRoute>
  ↓
useAuth() checks for active session
  ↓
✅ Session exists: render component
❌ No session: redirect to /auth
```

Variants:
- `<ProtectedRoute>` — authenticated users only
- `<AdminProtectedRoute>` — admin role required
- `<ProtectedSOSRoute>` — SOS features (unaffected by subscription)
- `<RegionalProtectedRoute>` — regional features (Spain-specific)

### Password Reset Flow

```
User clicks "Forgot Password"
  ↓
POST /auth/forgot-password
  ↓
Supabase.auth.resetPasswordForEmail(email, {
  redirectTo: /auth?tab=reset
})
  ↓
Email sent with reset link (valid 24 hrs)
  ↓
User clicks link → redirects to /auth?tab=reset
  ↓
User enters new password
  ↓
POST /auth/reset-password
  ↓
Password updated in auth.users
  ↓
Session cleared, redirected to login
```

---

## State Management Architecture

### React Context Providers

**1. AuthContext** (`src/contexts/AuthContext.tsx`)
```typescript
{
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}
```
- Root level provider
- Wraps entire app in App.tsx
- Used by: `useAuth()` hook

**2. PreferencesContext** (`src/contexts/PreferencesContext.tsx`)
```typescript
{
  theme: 'light' | 'dark'
  language: 'en' | 'es' | 'nl'
  // ... additional preferences
}
```
- User settings and preferences
- Persisted to localStorage

**3. ClaraChatContext** (`src/contexts/ClaraChatContext.tsx`)
```typescript
{
  messages: ChatMessage[]
  isOpen: boolean
  loading: boolean
  sendMessage: (msg: string) => Promise<void>
  setIsOpen: (open: boolean) => void
}
```
- CLARA AI assistant state
- Global chat instance accessible from anywhere
- Context wraps `<GlobalClaraChat>` component

**4. RivenWorkflowContext** (`src/contexts/RivenWorkflowContext.tsx`)
- Advanced workflow orchestration
- Used for complex multi-step flows

### TanStack React Query (Data Fetching)

```typescript
// Setup in src/lib/queryClient.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // 5 mins
      gcTime: 1000 * 60 * 10,       // 10 mins
      retry: 2,
    },
  },
});
```

Used for:
- Caching Supabase queries
- Automatic refetching
- Optimistic updates
- Background sync
- Request deduplication

Example hook pattern:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['emergencyContacts', userId],
  queryFn: () => supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId),
});
```

### Global State vs Local State

**Global (Context/Query):**
- Authentication state
- User profile data
- Emergency contacts list
- Real-time presence/locations
- CLARA chat messages
- Preferences/settings

**Local (Component State):**
- Form inputs (during editing)
- UI toggles (modal open/close)
- Animation states
- Temporary validation errors

---

## Routing Structure

### Route Categories

**Public Routes (No Auth Required)**
```
/                        → Homepage (landing page)
/auth                    → Login + password reset
/register                → Registration
/trial-signup            → Free trial signup
/blog                    → Blog listing
/blog/:slug              → Blog post
/contact                 → Contact form
/privacy                 → Privacy policy
/terms                   → Terms of service
/support                 → Support center
/videos                  → Demo videos
/devices/ice-sos-pendant → Pendant product page
/regional-center/spain   → Spain regional hub
/about                   → About page
/ai-collaboration        → AI collaboration page
```

**Authenticated Routes (Auth Required)**
```
/dashboard               → Main user dashboard
/dashboard/admin         → Admin dashboard
/family-dashboard        → Family member view
/sos-app                 → SOS interface
/map-screen              → Live map
/my-circles              → Family circles management
/places-manager          → Places/geofences
/location-history        → Location timeline
/tablet-dashboard        → Tablet-optimized interface
```

**Invitation Routes (Token-Based)**
```
/family-invite/:token    → Accept family invitation
/invite/connections/:token → Accept connection invitation
```

**Payment Routes**
```
/checkout                → Stripe checkout
/checkout/success        → Payment successful
/checkout/cancel         → Payment canceled
/payment-success         → Subscription activated
/family-checkout-success → Family member added
/family-checkout-canceled → Family member add failed
/onboarding              → Post-signup questionnaire
```

### Route Implementation

Routes defined in `src/App.tsx`:
```typescript
<BrowserRouter>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PreferencesProvider>
        <ClaraChatProvider>
          <Routes>
            {/* Routes here */}
          </Routes>
        </ClaraChatProvider>
      </PreferencesProvider>
    </AuthProvider>
  </QueryClientProvider>
</BrowserRouter>
```

Nested route structure (lazy-loaded pages):
```typescript
<Route path="/dashboard" element={
  <OptimizedSuspense skeletonType="card">
    <Dashboard />
  </OptimizedSuspense>
} />
```

---

## Component Architecture

### Component Organization

```
src/components/
├── ui/                    # Shadcn UI components (buttons, dialogs, etc.)
├── admin/                 # Admin-only features
├── dashboard/             # Dashboard widgets and layouts
├── emergency/             # SOS and emergency features
├── family/                # Family member management
├── sos-app/               # SOS app interface
├── maplibre/              # MapLibre map components
├── map/                   # Legacy canvas map (deprecated)
├── onboarding/            # Registration and onboarding flows
├── registration/          # Sign-up components
├── ai-chat/               # CLARA AI chat interface
├── analytics/             # Analytics provider and tracking
├── landing/               # Landing page sections
├── marketing/             # Marketing and promotional content
├── blog/                  # Blog components
├── devices/               # Device management (pendants, etc.)
├── regional/              # Regional-specific features (Spain)
├── mobile/                # Mobile-specific layouts
├── tablet/                # Tablet-optimized layouts
├── seo/                   # SEO meta tags and schemas
├── legal/                 # Privacy, terms dialogs
├── app-preview/           # App mockup previews
└── [Top-level .tsx]       # Page wrappers, layout components
    └─ GlobalClaraChat.tsx
    └─ ProtectedRoute.tsx
    └─ AdminProtectedRoute.tsx
    └─ CookieConsent.tsx
    └─ ScrollToTop.tsx
```

### Component Patterns

**Page Components** (`src/pages/`)
```typescript
// Large route-level components
export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div>
      {/* Page content */}
    </div>
  );
}
```

**Feature Components** (`src/components/dashboard/`)
```typescript
// Reusable feature blocks
export function FamilyMemberCard({ member }) {
  return (
    <div className="bg-card rounded-lg p-4">
      {/* Component content */}
    </div>
  );
}
```

**UI Components** (`src/components/ui/`)
```typescript
// Shadcn UI primitives (Button, Dialog, Select, etc.)
// Already configured and ready to use
// Follow component library patterns
```

### Component Composition Example

```
Dashboard (page)
  └── DashboardLayout (layout wrapper)
      ├── Sidebar (navigation)
      ├── MainContent
      │   ├── FamilyMemberCard (feature)
      │   │   └── Button (ui)
      │   │   └── Avatar (ui)
      │   └── EmergencyContactCard (feature)
      │       └── Badge (ui)
      │       └── IconButton (ui)
      └── Footer
```

---

## Hooks Architecture

### Custom Hooks (93 total)

**Data Fetching Hooks** (`src/hooks/use*Query.ts`)
```typescript
useEmergencyContacts()    // Fetch emergency contacts
useFamilyMembers()        // Fetch family circle
useLiveLocation()         // Subscribe to location updates
useSOSHistory()           // Fetch SOS events
useUserProfile()          // Fetch user data
```

**Utility Hooks**
```typescript
usePageTracking()         // Analytics page tracking
useMapLibre()             // MapLibre configuration
useEmergencyAlert()       // Emergency alert logic
useMobileDetection()      // Mobile/tablet detection
useLanguage()             // i18n translations
useAuth()                 // Authentication context
```

**Specialized Hooks**
```typescript
useTabletSounds()         // Tablet sound effects
useNetworkErrorHandler()  // Network error handling
useAnalytics()            // Analytics tracking
useCallbackQueue()        // Callback orchestration
useLocationTracking()     // GPS and location background service
```

---

## Data Layer Architecture

### Supabase Tables (268 migrations)

**Core Tables:**
- `auth.users` — Authentication users (managed by Supabase)
- `profiles` — User profiles (extends auth.users)
- `emergency_contacts` — User's emergency contacts
- `family_members` — Family circle connections
- `medical_info` — Medical data for responders
- `devices` — Connected wearables and pendants

**Subscription Tables:**
- `subscription_plans` — Available tiers
- `user_subscriptions` — Active subscriptions
- `subscription_history` — Subscription change log

**Location & Safety:**
- `live_presence` — User online/offline status
- `live_locations` — Current GPS coordinates
- `location_pings` — Historical location trail
- `places` — Geofence definitions
- `place_events` — Geofence boundary crossings
- `sos_incidents` — Emergency activations (7yr retention)

**Communication:**
- `contact_notes` — Notes on emergency contacts
- `conference_bridges` — Multi-party call sessions
- `message_queue` — Queued SMS/emails

**Real-time Subscriptions:**
```typescript
// Subscribe to user's location updates
supabase
  .channel(`locations:${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'live_locations',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      // Handle new location
    }
  )
  .subscribe();
```

---

## Edge Functions Architecture

### Function Categories (116 total)

**AI & Chat** (1 function)
```
ai-chat                   → CLARA assistant responses
```

**Authentication & Webhooks** (10+ functions)
```
auth-security-monitor     → Track auth events
slack-auth-events         → Notify Slack of auth
```

**Payments & Billing** (15+ functions)
```
stripe-webhook            → Handle payment events
addon-checkout            → Add subscription add-on
billing-invoices          → Generate invoices
```

**Automation** (20+ functions)
```
automation-runner         → Execute scheduled tasks
automation-triggers       → Trigger workflow automations
analytics-aggregator      → Aggregate analytics
```

**Emergency & Safety** (10+ functions)
```
emergency-alert           → Send emergency notifications
sos-responder-alert       → Alert responders
location-sharing          → Share location with contacts
```

**Integrations** (20+ functions)
```
vonage-callback           → Handle voice calls
twilio-webhook            → SMS integration
alexa-webhook             → Alexa smart home
geolocation-tracker       → Track GPS locations
```

**Admin & Ops** (10+ functions)
```
admin-reports             → Generate reports
data-export               → Export user data
analytics-dashboard       → Admin dashboard data
```

**Regional** (10+ functions)
```
check-spain-rule          → Spain compliance checks
regional-compliance       → Regional rules enforcement
```

### Edge Function Pattern

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth from header
    const authHeader = req.headers.get('Authorization');

    // Create Supabase client with service key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Process request
    const result = await processRequest(req, supabase);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

---

## Internationalization (i18n)

### Three Supported Languages
- **EN** — English (default, fallback)
- **ES** — Spanish (Spain, Latin America)
- **NL** — Dutch (Netherlands)

### Translation System

**Key Storage:** `src/locales/[language]/`
```
src/locales/
├── en/
│   └── translations.json
├── es/
│   └── translations.json
└── nl/
    └── translations.json
```

**Translation Keys (Nested)**
```json
{
  "auth": {
    "login": "Log in",
    "register": "Sign up",
    "forgotPassword": "Forgot password?"
  },
  "nav": {
    "home": "Home",
    "features": "Features"
  },
  "clara": {
    "greeting": "Hi, I'm CLARA!",
    "placeholder": "Ask me anything..."
  }
}
```

**Usage in Components**
```typescript
const { t, language } = useLanguage();

return (
  <button>{t('auth.login')}</button>
);
```

**Language Context** (`src/contexts/PreferencesContext.tsx`)
```typescript
interface PreferencesContextType {
  language: 'en' | 'es' | 'nl'
  setLanguage: (lang: 'en' | 'es' | 'nl') => void
  t: (key: string, defaults?: object) => string
}
```

Language stored in `localStorage['language']` and persisted across sessions.

---

## Error Handling Strategy

### Client-Side Error Boundaries

```typescript
<EnhancedErrorBoundary>
  <Dashboard />
</EnhancedErrorBoundary>
```

Catches:
- React render errors
- Component lifecycle errors
- Unhandled promise rejections

Displays:
- User-friendly error message
- Error details (dev only)
- Recovery action (retry, go home)

### API Error Handling

```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select();

  if (error) {
    logError(error); // Sentry
    throw error;
  }

  return data;
} catch (err) {
  showNotification(
    t('errors.fetchFailed'),
    'error'
  );
  return null;
}
```

### Network Error Resilience

- Automatic retry with exponential backoff
- Offline detection via NetworkInformation API
- Optimistic updates with rollback on failure
- Error logging to Sentry (production)

---

## Performance Optimization

### Code Splitting & Lazy Loading

```typescript
// Pages lazy-loaded on demand
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Wrapped in Suspense with skeleton
<Suspense fallback={<DashboardSkeleton />}>
  <Dashboard />
</Suspense>
```

### Caching Strategy

```
Cache Layer 1: Browser (localStorage for auth tokens)
       ↓
Cache Layer 2: TanStack Query (in-memory, with staleTime)
       ↓
Cache Layer 3: Supabase Realtime (live updates)
       ↓
Cache Layer 4: CDN (static assets via Vercel)
       ↓
Cache Layer 5: Database (source of truth)
```

### Bundle Analysis

Vite config optimizes chunks:
```typescript
manualChunks: {
  vendor: ['react', 'react-dom'],
  ui: ['@radix-ui/react-dialog', ...],
  supabase: ['@supabase/supabase-js'],
  tanstack: ['@tanstack/react-query'],
}
```

### Image Optimization

```typescript
// Lazy load images
<img
  src={image}
  loading="lazy"
  alt="description"
/>
```

---

## Security Architecture

### Authentication Security

- JWT tokens stored in secure localStorage
- Tokens refreshed automatically before expiry
- HTTPS enforced (production)
- CSRF protection via origin header validation

### Row Level Security (RLS)

All tables protected by RLS policies:
```sql
CREATE POLICY "Users can view own data"
ON profiles FOR SELECT
USING (auth.uid() = user_id);
```

### Data Validation

- Client-side: React Hook Form + Zod validation
- Server-side: Supabase RLS policies
- Edge functions: Input sanitization

### Secrets Management

- API keys stored in Supabase environment variables
- Never committed to git
- Rotated regularly
- Service role key never exposed to client

### Sensitive Data Handling

- Medical info encrypted at rest (Supabase)
- Location data purged after 90 days (configurable)
- SOS events retained 7 years (legal requirement)
- PII passed through edge functions only (never to client)

---

## Monitoring & Observability

### Analytics

- Google Analytics via `@google-analytics/react`
- Custom event tracking: page views, feature usage, errors
- Conversion tracking: signup, payment, subscription

### Error Tracking

- Sentry integration: `@sentry/react`
- Automatic error capture and reporting
- Source map upload for production debugging
- Custom error context (user, session, device)

### Logging

```typescript
// Utility: src/utils/logger.ts
logInfo('User signed in', { userId })
logWarning('Rate limit approaching', { remaining })
logError('Payment failed', { paymentId, reason })
```

### Real-time Monitoring

- Supabase dashboard: DB queries, API usage
- Vercel dashboard: deployment logs, function metrics
- Custom admin dashboard: user activity, SOS events

---

## Deployment Architecture

### Frontend (Vercel)

- Auto-deployed on push to `main` branch
- Edge functions available in Edge Network
- Preview deployments on pull requests
- Environment variables managed in Vercel dashboard

### Backend (Supabase Cloud)

- PostgreSQL managed database
- Auto-scaling compute
- Realtime features enabled
- Backups every 24 hours
- Point-in-time recovery available

### Database Migrations

```bash
# Create new migration
supabase migration new add_new_table

# Apply locally
supabase db reset

# Deploy to production (automatic on push)
```

---

## Summary

LifeLink Sync uses a **modern SPA architecture** with clear separation of concerns:

1. **Presentation Layer:** React components with Tailwind styling
2. **State Management:** Context API + React Query for efficient caching
3. **API Layer:** Supabase JS client with TypeScript safety
4. **Business Logic:** Edge functions (Deno) for complex operations
5. **Data Storage:** PostgreSQL with RLS security
6. **External Integrations:** AI (Anthropic), Payments (Stripe), Communications (Vonage/Twilio)

The architecture prioritizes **security**, **scalability**, **real-time responsiveness**, and **multi-language support** to deliver a robust emergency response platform.
