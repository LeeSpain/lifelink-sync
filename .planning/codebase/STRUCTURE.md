# LifeLink Sync Project Structure

## Directory Tree Overview

```
lifelink-sync/
├── src/                               # Main application source code
├── supabase/                          # Backend: migrations, edge functions
├── public/                            # Static assets (HTML, manifests, robots.txt)
├── docs/                              # Project documentation (markdown)
├── .planning/                         # Planning and architecture docs
├── .github/                           # GitHub workflows and config
├── .vercel/                           # Vercel deployment config
├── .env.example                       # Environment variables template
├── vite.config.ts                     # Vite build configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
├── tsconfig.json                      # TypeScript configuration
├── capacitor.config.ts                # Capacitor mobile config
├── package.json                       # Dependencies and scripts
└── [various .md files]                # Project documentation
```

---

## SRC/ Directory Structure

```
src/
├── pages/                             # Route-level page components (50 files)
├── components/                        # Reusable UI components (95 files, 28 subdirs)
├── contexts/                          # React context providers (4 files)
├── hooks/                             # Custom React hooks (93 files)
├── lib/                               # Utility functions (7 files)
├── integrations/
│   └── supabase/                      # Supabase client and types
├── utils/                             # Application utilities (16 files)
├── types/                             # TypeScript type definitions (5 files)
├── i18n/                              # Internationalization setup
├── locales/                           # Translation files (3 languages)
├── config/                            # Configuration files (3 files)
├── assets/                            # Images and static files
├── App.tsx                            # Main app router component
├── main.tsx                           # Vite entry point
├── App.css                            # Global styles
├── index.css                          # Base styles + design tokens
└── vite-env.d.ts                      # Vite environment types
```

---

## SRC/PAGES/ — Route Components (50 files)

**Landing & Marketing Pages:**
- `Index.tsx` — Homepage (public)
- `About.tsx` — About page
- `AICollaboration.tsx` — AI partnership page
- `Blog.tsx` — Blog listing
- `BlogPost.tsx` — Individual blog post
- `Contact.tsx` — Contact form
- `Support.tsx` — Support center
- `Videos.tsx` — Demo videos

**Authentication Pages:**
- `AuthPage.tsx` — Login and password reset combined
- `RegisterPage.tsx` — User registration
- `TrialSignupPage.tsx` — Free trial signup
- `FamilyInviteAccept.tsx` — Accept family invitation via token
- `ConnectionAcceptPage.tsx` — Accept connection invitation

**Dashboard & User Pages:**
- `Dashboard.tsx` — Main user dashboard
- `AdminDashboard.tsx` — Admin control panel
- `TabletDashboard.tsx` — Tablet-optimized interface
- `FamilyDashboard.tsx` — Family member view

**Emergency & Safety Pages:**
- `SOSAppPage.tsx` — SOS emergency interface
- `FamilyAppPage.tsx` — Family app view

**Location & Map Pages:**
- `MapScreen.tsx` — Live map with members
- `MyCirclesPage.tsx` — Family circle management
- `PlacesManager.tsx` — Geofences and locations
- `LocationHistoryPage.tsx` — Location timeline view
- `MapDemo.tsx` — Map demo and testing

**Onboarding & Setup Pages:**
- `OnboardingPage.tsx` — Post-registration questionnaire
- `FamilyAccessSetup.tsx` — Family member access setup
- `FamilyCarerAccess.tsx` — Carer access page

**Payment & Subscription Pages:**
- `CheckoutPage.tsx` — Stripe checkout
- `CheckoutSuccessPage.tsx` — Payment successful
- `CheckoutCancelPage.tsx` — Payment canceled
- `PaymentSuccess.tsx` — Subscription activated
- `FamilyCheckoutSuccess.tsx` — Family member added
- `FamilyCheckoutCanceled.tsx` — Family member add failed
- `RegistrationSuccess.tsx` — Registration success confirmation

**Device & Regional Pages:**
- `DeviceIceSosPendant.tsx` — Pendant product page
- `RegionalCenterSpain.tsx` — Spain regional hub

**Legal & Info Pages:**
- `Privacy.tsx` — Privacy policy (legacy dialog-based)
- `Terms.tsx` — Terms of service (legacy dialog-based)
- `PrivacyPolicy.tsx` — Privacy policy (production full-page)
- `TermsOfService.tsx` — Terms of service (production full-page)

**Utility Pages:**
- `DashboardRedirect.tsx` — Smart redirect to correct dashboard
- `TestPage.tsx` — Dev testing only
- `TestRegistration.tsx` — Dev testing only

---

## SRC/COMPONENTS/ — Reusable Components (95 files, 28 subdirectories)

### Component Subdirectories

**Top-level Components** (in components/ directly)
- `GlobalClaraChat.tsx` — Global CLARA chat widget overlay
- `ProtectedRoute.tsx` — Auth guard for protected routes
- `AdminProtectedRoute.tsx` — Admin-only route guard
- `RegionalProtectedRoute.tsx` — Regional feature guard
- `ProtectedSOSRoute.tsx` — SOS feature guard (bypass subscription)
- `SmartAppRedirect.tsx` — Intelligent route redirect logic
- `DashboardRedirect.tsx` — Redirect to correct dashboard
- `ScrollToTop.tsx` — Auto-scroll to top on route change
- `CookieConsent.tsx` — GDPR cookie banner
- `ErrorBoundary.tsx` — Error catch boundary
- `EnhancedErrorBoundary.tsx` — Enhanced version with recovery
- `AdminErrorBoundary.tsx` — Admin-specific error handling
- `DevModeBanner.tsx` — Development mode indicator
- `OptimizedSuspense.tsx` — Suspense with skeleton loaders
- `EmailVerificationBanner.tsx` — Email verification prompt
- `WelcomeQuestionnaire.tsx` — Onboarding form
- `[many other .tsx files]`

### UI Components (`src/components/ui/`)
Shadcn/ui components (pre-configured):
- `button.tsx`, `dialog.tsx`, `select.tsx`, `input.tsx`
- `dropdown-menu.tsx`, `tooltip.tsx`, `badge.tsx`
- `card.tsx`, `alert.tsx`, `accordion.tsx`
- `tabs.tsx`, `progress.tsx`, `slider.tsx`
- `toggle.tsx`, `popover.tsx`, `scroll-area.tsx`
- [~40 total UI primitives]

### Dashboard Components (`src/components/dashboard/`)
Dashboard-specific features:
- Family member cards and management
- Emergency contact widgets
- Subscription status display
- Activity feeds and notifications
- Settings panels

### Emergency/SOS Components (`src/components/emergency/`, `src/components/sos-app/`)
Emergency features:
- SOS activation button
- Emergency contact quick-call
- GPS location sharing
- Medical info summary
- Emergency status display

### Map Components (`src/components/maplibre/`, `src/components/map/`, `src/components/canvas-map/`)
**MapLibre (Current):** `src/components/maplibre/`
- `MapLibreMap.tsx` — Main map component
- `MapShell.tsx` — Map layout wrapper
- `MapMemberLayer.tsx` — Show family members on map
- `MapGeofenceLayer.tsx` — Display geofences
- `MapRouteLayer.tsx` — Show location trails
- `MapIncidentLayer.tsx` — Show emergency incidents
- Clustering, filters, mode management

**Legacy Canvas Map (Deprecated):** `src/components/canvas-map/`
- Old implementation, not used by current pages
- Kept for backward compatibility

**Map Utilities:** `src/components/map/`
- Helper components for map features

### Family Components (`src/components/family/`)
Family member features:
- Family circle management
- Member invite system
- Permission controls
- Family notifications

### Registration Components (`src/components/registration/`)
Sign-up flow:
- Email entry
- Password setup
- Profile completion
- Consent forms

### Onboarding Components (`src/components/onboarding/`)
Post-signup experience:
- Welcome sequence
- Feature introductions
- Profile setup
- Payment flow

### AI Chat Components (`src/components/ai-chat/`)
CLARA assistant:
- Chat input/output
- Message history
- Typing indicators
- Context awareness

### Analytics Components (`src/components/analytics/`)
- `AnalyticsProvider.tsx` — Google Analytics setup
- Event tracking helpers
- Conversion funnel tracking

### Admin Components (`src/components/admin/`)
Admin-only features:
- User management
- Subscription oversight
- Analytics dashboard
- System monitoring

### Landing/Marketing Components (`src/components/landing/`)
Homepage sections:
- Hero section
- Features showcase
- Pricing cards
- Call-to-action blocks
- Testimonials

### Blog Components (`src/components/blog/`)
Blog page features:
- Article list
- Article detail view
- Author info
- Related articles

### Device Components (`src/components/devices/`)
Hardware integrations:
- Pendant product cards
- Device pairing flow
- Battery status
- Device settings

### Regional Components (`src/components/regional/`)
Region-specific features:
- Spain-specific UI
- Regional compliance text
- Regional contact info

### Mobile Components (`src/components/mobile/`)
Mobile-specific layouts:
- Touch-optimized controls
- Mobile navigation
- Responsive designs

### Tablet Components (`src/components/tablet/`)
Tablet-optimized layouts:
- Landscape mode
- Split-pane views
- Touch gestures

### SEO Components (`src/components/seo/`)
Search engine optimization:
- `EnhancedSitemapGenerator.tsx` — Dynamic sitemap
- `EnhancedRobotsTxt.tsx` — Robots.txt handler
- Meta tag helpers
- JSON-LD schemas

### Legal Components (`src/components/legal/`)
Legal pages:
- Privacy policy dialog
- Terms dialog
- Consent forms

### Other Subdirectories
- `call-centre/` — Call center features (legacy)
- `app-preview/` — App mockup previews
- `beta/` — Beta feature flags
- `family-carer/` — Carer access features

---

## SRC/CONTEXTS/ — State Management (4 files)

### AuthContext.tsx
```typescript
interface AuthContextType {
  user: User | null              // Supabase auth.users
  session: Session | null        // JWT session
  loading: boolean               // Auth state loading
  signOut: () => Promise<void>   // Logout function
}
```
- Root provider for authentication
- Wraps entire app
- Dev bypass mode for testing

### PreferencesContext.tsx
```typescript
interface PreferencesContextType {
  theme: 'light' | 'dark'
  language: 'en' | 'es' | 'nl'
  setLanguage: (lang: string) => void
  t: (key: string, defaults?: object) => string
}
```
- User preferences
- Language/i18n
- Theme settings
- Persisted to localStorage

### ClaraChatContext.tsx
```typescript
interface ClaraChatContextType {
  messages: ChatMessage[]
  isOpen: boolean
  loading: boolean
  sendMessage: (msg: string) => Promise<void>
  setIsOpen: (open: boolean) => void
}
```
- CLARA AI assistant global state
- Accessible from anywhere
- Chat history management

### RivenWorkflowContext.tsx
- Advanced workflow orchestration
- Complex multi-step flows

---

## SRC/HOOKS/ — Custom Hooks (93 files)

### Data Fetching Hooks
- `useEmergencyContacts()` — Fetch emergency contacts
- `useFamilyMembers()` — Fetch family circle
- `useLiveLocation()` — Subscribe to location updates
- `useSOSHistory()` — Fetch SOS events
- `useUserProfile()` — Fetch user data
- `usePlaces()` — Fetch geofences/places
- `useSubscriptionStatus()` — Fetch subscription

### UI State Hooks
- `useLanguage()` — Translation hook
- `useAuth()` — Authentication context
- `useMobileDetection()` — Detect mobile device
- `useTabletDetection()` — Detect tablet device
- `useOnline()` — Detect internet connection

### Map & Location Hooks
- `useMapLibre()` — MapLibre configuration
- `useGeoLocation()` — Get user's GPS
- `useLocationTracking()` — Background location service
- `useMapFilters()` — Map filtering state

### Feature Hooks
- `useEmergencyAlert()` — Emergency alert logic
- `usePageTracking()` — Analytics tracking
- `useAnalytics()` — Event tracking
- `useCallbackQueue()` — Callback orchestration
- `useTabletSounds()` — Tablet sound effects

### Utility Hooks
- `useNetworkErrorHandler()` — Handle network errors
- `useQueryClient()` — TanStack Query client access
- [60+ additional specialized hooks]

---

## SRC/LIB/ — Utility Functions (7 files)

- `queryClient.ts` — TanStack React Query configuration
- `notifications.ts` — Toast/notification system
- `stripe.ts` — Stripe payment integration
- `analytics.ts` — Analytics event tracking
- `conversionTracking.ts` — Conversion funnel tracking
- `seoSchemas.ts` — JSON-LD schema generators
- `utils.ts` — General utilities

---

## SRC/INTEGRATIONS/SUPABASE/ — Backend Client (2 files)

### client.ts
```typescript
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```
- Singleton Supabase client
- Used throughout app
- Import path: `@/integrations/supabase/client`
- Configured with localStorage persistence

### types.ts
- Auto-generated TypeScript types from Supabase
- Represents database schema
- Updated via `supabase gen types`
- Complete type safety for queries

---

## SRC/UTILS/ — Application Utilities (16 files)

- `security.ts` — Security utilities (sanitization, logging)
- `logger.ts` — Logging wrapper
- `errorReporting.ts` — Error tracking setup
- `currency.ts` — Currency conversion
- `imageOptimization.ts` — Image loading strategies
- `contentSanitizer.ts` — HTML/text sanitization
- `sanitize.ts` — XSS prevention
- `familyGroupUtils.ts` — Family circle helpers
- `appPreviewTranslations.ts` — App mockup text
- `contentQuality.ts` — Content quality checks
- `performance.ts` — Performance monitoring
- `productionReadiness.ts` — Production checks
- `regionalIntegration.ts` — Regional features
- `networkErrorHandler.ts` — Network error handling
- `paymentSuccess.ts` — Payment success logic
- `tabletSounds.ts` — Tablet audio playback

---

## SRC/TYPES/ — TypeScript Definitions (5 files)

- `appPreview.ts` — App mockup types
- `conference.ts` — Conference call types
- `map.ts` — Map entity types (MapEntity, GeofenceEntity, RoutePoint)
- `speech.d.ts` — Speech synthesis types
- `timeline.ts` — Timeline/history types

---

## SRC/I18N/ — Internationalization Setup (1 file)

- `index.ts` — i18n configuration and helpers

---

## SRC/LOCALES/ — Translation Files (3 languages)

```
locales/
├── en/
│   └── translations.json      # ~1000+ keys (English)
├── es/
│   └── translations.json      # ~1000+ keys (Spanish)
└── nl/
    └── translations.json      # ~1000+ keys (Dutch)
```

Translation keys organized by feature:
```json
{
  "auth": { "login", "register", "forgotPassword", ... },
  "nav": { "home", "features", "pricing", ... },
  "dashboard": { "welcome", "settings", ... },
  "clara": { "greeting", "placeholder", ... },
  "errors": { "fetchFailed", "networkError", ... },
  "sos": { "activate", "confirm", "emergency", ... },
  [and many more sections]
}
```

---

## SRC/CONFIG/ — Configuration Files (3 files)

- `analytics.ts` — Google Analytics setup
- `mapConfig.ts` — MapLibre and map settings
- `videos.ts` — Demo video data (URLs, titles)

---

## SRC/ASSETS/ — Static Media

Images, icons, and static files organized by type

---

## SUPABASE/ — Backend Infrastructure

```
supabase/
├── migrations/                        # SQL migration files (268 total)
│   ├── 20260101000001_init.sql       # Initial schema
│   ├── 20260102000001_add_*.sql      # Feature additions
│   ├── 20260103000001_fix_*.sql      # Fixes
│   └── [268 total migrations]
│
├── functions/                         # Deno edge functions (116 total)
│   ├── ai-chat/                      # CLARA AI responses
│   ├── stripe-webhook/               # Payment webhooks
│   ├── automation-runner/            # Scheduled tasks
│   ├── emergency-alert/              # Emergency notifications
│   ├── vonage-callback/              # Phone call handling
│   ├── analytics-aggregator/         # Analytics processing
│   ├── admin-reports/                # Admin dashboard data
│   ├── auth-security-monitor/        # Auth event tracking
│   ├── addon-checkout/               # Add-on purchases
│   ├── [100+ more functions]
│   └── [each function has: index.ts, deno.json, deno.lock]
│
├── config.toml                        # Supabase project config
└── .temp/                             # Temporary build files
```

### Migration Pattern
```
20260314000001_clara_godmode_identity.sql
│                 │
│                 └─ Descriptive name
└─ Timestamp: YYYYMMDDHHMMSS
```

### Edge Function Pattern
```
functions/ai-chat/
├── index.ts                          # Function handler
├── deno.json                         # Dependencies
└── deno.lock                         # Locked versions
```

---

## PUBLIC/ — Static Assets & Manifest Files

```
public/
├── manifest.webmanifest              # PWA manifest for web
├── tablet-manifest.json              # PWA manifest for tablet
├── manifest.json                     # Alternate manifest format
│
├── favicon.svg                       # SVG favicon
├── favicon.ico                       # ICO favicon
├── og-image.svg                      # Open Graph image
├── placeholder.svg                   # Placeholder graphics
│
├── privacy-policy.html               # Privacy page (standalone HTML)
├── terms-of-service.html             # Terms page (standalone HTML)
├── cookie-policy.html                # Cookie policy (standalone HTML)
├── emergency-liability.html          # Liability notice
├── medical-data-compliance.html      # Medical data compliance
├── data-processing-agreement.html    # GDPR DPA
├── ai-data-policy.html               # AI data policy
│
├── robots.txt                        # Search engine directives
├── sitemap.xml                       # Site structure for SEO
│
├── business-profile.json             # Business info for schema
├── company-info.json                 # Company information
├── llms.txt                          # LLM access file
│
├── lovable-uploads/                  # Lovable editor assets
│
├── [avatar images]
│   ├── clara-avatar.png             # CLARA AI avatar
│   ├── mom-avatar.png
│   ├── dad-avatar.png
│   └── grandma-avatar.png
│
└── install-instructions.html         # PWA installation guide
```

---

## Configuration Files (Root Level)

### vite.config.ts
- Vite build configuration
- PWA plugin setup
- Code splitting rules
- Dev server settings
- Build optimization

### tailwind.config.ts
- Tailwind CSS configuration
- Design tokens (colors, spacing, typography)
- Custom theme extension

### tsconfig.json
- TypeScript compiler options
- Path aliases (@ = src/)
- Strict mode enabled
- Module resolution

### capacitor.config.ts
- Mobile app configuration
- iOS and Android settings
- App name, package ID
- Permissions

### package.json
- Dependencies (React, Supabase, Tailwind, etc.)
- Dev dependencies (Vite, TypeScript, ESLint)
- Scripts (dev, build, preview, lint)
- Package version

### .env.example
Template for environment variables:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ANTHROPIC_API_KEY=
```

### vercel.json
- Vercel deployment configuration
- Environment variables
- Build settings
- Redirect rules

---

## Documentation Files (Root Level)

**Project Guides:**
- `CLAUDE.md` — Project intelligence file (instructions for Claude Code)
- `README.md` — Project overview

**Status & Planning:**
- `PRODUCTION_DEPLOYMENT_GUIDE.md` — Deployment instructions
- `PRODUCTION_DEPLOYMENT_CHECKLIST.md` — Pre-launch checklist
- `LAUNCH_READINESS_ASSESSMENT.md` — Launch readiness
- `CORE_DEVELOPMENT_COMPLETE.md` — Feature completion status

**Feature Documentation:**
- `CLARA_AI_AGENT_GUIDE.md` — CLARA AI system design
- `CONFERENCE_BRIDGE_IMPLEMENTATION.md` — Call handling
- `INSTANT_CALLBACK_GUIDE.md` — Callback system
- `CALLBACK_TESTING_GUIDE.md` — Testing callbacks

**Analysis & Audits:**
- `APP_STORE_READINESS_AUDIT.md` — App store requirements
- `FRONTEND_INTEGRATION_GAP_ANALYSIS.md` — Missing integrations
- `CUSTOMER_READY_STATUS.md` — Customer-facing features
- `IMPLEMENTATION_COMPLETE_100_PERCENT.md` — Feature checklist

**Legal & Compliance:**
- `PRIVACY_POLICY.md` — Privacy policy document
- `MISSING_FEATURES.md` — Known gaps

---

## .PLANNING/ — Planning & Architecture Docs

```
.planning/
└── codebase/
    ├── ARCHITECTURE.md               # System architecture (this file)
    ├── STRUCTURE.md                  # Project structure (this file)
    └── [other planning docs]
```

---

## Key File Locations Summary

| Purpose | Location |
|---------|----------|
| **App Router** | `src/App.tsx` |
| **Auth Context** | `src/contexts/AuthContext.tsx` |
| **Supabase Client** | `src/integrations/supabase/client.ts` |
| **Supabase Types** | `src/integrations/supabase/types.ts` |
| **Translation Keys** | `src/locales/[language]/translations.json` |
| **Dashboard Page** | `src/pages/Dashboard.tsx` |
| **SOS Page** | `src/pages/SOSAppPage.tsx` |
| **CLARA Chat** | `src/components/GlobalClaraChat.tsx` |
| **MapLibre Map** | `src/components/maplibre/MapLibreMap.tsx` |
| **Hooks** | `src/hooks/` (93 files) |
| **UI Components** | `src/components/ui/` (40 shadcn components) |
| **Migrations** | `supabase/migrations/` (268 SQL files) |
| **Edge Functions** | `supabase/functions/` (116 Deno functions) |
| **Static Assets** | `public/` |
| **Styles** | `src/index.css` + `tailwind.config.ts` |

---

## Statistics Summary

| Category | Count |
|----------|-------|
| **Pages** | 50 |
| **Components** | 95 |
| **Component Subdirectories** | 28 |
| **Custom Hooks** | 93 |
| **Utility Files** | 16 |
| **Context Providers** | 4 |
| **Configuration Files** | 3 |
| **UI Components** | ~40 (shadcn/ui) |
| **Supported Languages** | 3 (EN, ES, NL) |
| **Edge Functions** | 116 |
| **SQL Migrations** | 268 |
| **Translation Keys** | ~1000+ per language |

---

## Development Workflow

### Adding a New Page
1. Create `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Add translations to `src/locales/[language]/translations.json`
4. Update sitemap: `public/sitemap.xml`

### Adding a New Component
1. Create `src/components/feature/NewComponent.tsx`
2. Export as named export
3. Import and use in page or parent component
4. Add translations if user-visible strings

### Adding a New Hook
1. Create `src/hooks/useNewFeature.ts`
2. Export as default export
3. Use in components via `const result = useNewFeature()`

### Adding a New Translation
1. Add key to `src/locales/en/translations.json`
2. Add same key to `src/locales/es/translations.json`
3. Add same key to `src/locales/nl/translations.json`
4. Use in component: `const { t } = useLanguage(); t('your.key')`

### Adding a New Edge Function
1. Create `supabase/functions/function-name/index.ts`
2. Create `supabase/functions/function-name/deno.json`
3. Implement handler with CORS headers
4. Deploy: `supabase functions deploy function-name`

### Adding a Database Migration
1. Create `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Write SQL with RLS policies
3. Test locally: `supabase db reset`
4. Deploy automatically when pushed to main

---

## Important Notes

1. **Import Paths:** Always use `@/` alias, never relative paths
2. **Supabase Import:** Always from `@/integrations/supabase/client`
3. **Translations:** Use `const { t } = useLanguage()`, never hardcoded strings
4. **Auth:** Use `const { user } = useAuth()` for current user
5. **TypeScript:** Strict mode enabled, avoid `any` types
6. **Components:** Use named exports, PascalCase for files
7. **Hooks:** Use `use` prefix, camelCase for files
8. **Styling:** Use Tailwind, avoid inline styles

---

## Architecture Decisions

- **Why MapLibre?** OSM tiles (free, no API key), native clustering, React-friendly
- **Why Edge Functions?** Deno for AI integration, payment webhooks, automation
- **Why Contexts?** Global state for auth, preferences, CLARA chat
- **Why TanStack Query?** Robust caching, automatic refetch, offline support
- **Why Capacitor?** Single codebase for iOS/Android with native bridge
- **Why PWA?** Fast offline experience, installable, web-first delivery

---

## File Organization Philosophy

1. **Colocation:** Keep related components together in subdirectories
2. **Page-centric:** Each route has its own page file
3. **Component reusability:** Extract common UI into components/
4. **Hook isolation:** Logic in hooks, components for presentation
5. **Type safety:** Auto-generated types for database schema
6. **Configuration:** Environment-specific config at top level
7. **Documentation:** Large features get their own .md files
