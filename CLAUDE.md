# CLAUDE.md — LifeLink Sync Project Intelligence File

> This file is read automatically by Claude Code at the start of every session.
> It contains all project context, architecture, rules, and task guidance.
> Keep this file updated as the project evolves.

---

## 🏢 PROJECT OVERVIEW

**Product**: LifeLink Sync — Emergency Protection Platform for Families
**Tagline**: "Always There. Always Ready."
**Live URL**: https://lifelink-sync.vercel.app
**GitHub**: https://github.com/LeeSpain/lifelink-sync
**Lovable Project**: https://lovable.dev/projects/a856a70f-639b-4212-b411-d2cdb524d754

**What it does**: AI-powered emergency protection app with 24/7 monitoring,
GPS tracking, instant SOS alerts, family safety management, and CLARA AI assistant.

**Markets**: Spain 🇪🇸 · United Kingdom 🇬🇧 · Netherlands 🇳🇱

---

## 🛠️ TECH STACK

| Layer | Technology |
|-------|-----------|
| Framework | React + TypeScript + Vite |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL + PLpgSQL) |
| Native App | Capacitor (iOS + Android) |
| Deployment | Vercel |
| Package Manager | npm (bun.lockb also present) |

**Key config files**:
- `vite.config.ts` — build config
- `tailwind.config.ts` — design tokens
- `capacitor.config.ts` — mobile app config
- `vercel.json` — deployment + env vars
- `components.json` — shadcn/ui config

---

## 📁 PROJECT STRUCTURE

```
src/
  components/          # Reusable UI components
  pages/               # Route-level page components
  contexts/            # React contexts (Language, Auth, etc.)
  hooks/               # Custom React hooks
  lib/                 # Utilities and helpers
  integrations/
    supabase/          # Supabase client + types
      client.ts        # Import supabase from HERE — always
      types.ts         # Auto-generated DB types

public/                # Static assets
  privacy-policy.html
  terms-of-service.html
  emergency-liability.html
  medical-data-compliance.html
  data-processing-agreement.html
  business-profile.json
  manifest.json

supabase/
  migrations/          # SQL migration files
  functions/           # Edge functions

docs/                  # Project documentation
```

---

## 🌍 LANGUAGES & TRANSLATION SYSTEM

**Supported Languages**: English (EN), Spanish (ES), Dutch (NL)

**How it works**:
- Language context is in `src/contexts/LanguageContext.tsx` (or similar)
- Use `const { t, language } = useLanguage()` in all components
- Translation keys are structured: `section.keyName`
  - e.g. `t('nav.home')`, `t('auth.login')`, `t('clara.greeting')`
- **RULE**: NEVER hardcode user-visible English strings in components
- **RULE**: ALL new strings must have EN + ES + NL translations
- **RULE**: When app language changes, ALL components must re-render in new language

**Known untranslated areas (needs fixing)**:
- CLARA AI chat widget
- "How It Works" modal/popup
- Hero section phone mockup overlay text
- Spain regional partner section

**Translation key naming convention**:
```
auth.login / auth.register / auth.forgotPassword
nav.home / nav.features / nav.pricing
clara.greeting / clara.placeholder / clara.send
hero.title / hero.subtitle / hero.cta
spain.title / spain.description
pendant.title / pendant.feature1
```

---

## 🤖 CLARA AI ASSISTANT

**What CLARA is**: The AI safety assistant — the core product differentiator.
CLARA provides emergency guidance, daily check-ins, medication reminders,
and coordinates between the user and their family/emergency contacts.

**CLARA rules**:
- Always responds in the user's current app language
- Emergency responses are always calm, clear, and actionable
- Must show "thinking" state while processing
- Chat history is preserved within session
- Greeting changes based on time of day

**CLARA component location**: `src/components/` — search for `CLARA`, `AIChat`, or `ChatWidget`

---

## 🔐 AUTHENTICATION

**Provider**: Supabase Auth

**Auth flows**:
1. Email + Password login
2. Email registration
3. **Forgot Password** → `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
4. Password reset (user lands on `/auth?tab=reset` after email link)
5. Family member invite flow

**Supabase client import** — ALWAYS use:
```typescript
import { supabase } from '@/integrations/supabase/client'
```

**Auth pages**: `src/pages/` — search for `auth`, `Auth`, `Login`, `Register`

**Password reset redirect URL**:
```typescript
redirectTo: `${window.location.origin}/auth?tab=reset`
```

---

## 💳 SUBSCRIPTION & PRICING

**Plans** (as of latest migration):
| Plan | Price | Notes |
|------|-------|-------|
| Individual Plan | €9.99/mo | Core product — CLARA AI + SOS |
| Daily Wellbeing Add-On | €2.99/mo | CLARA check-ins + family digest |
| Medication Reminder Add-On | €2.99/mo | AI medication tracking |
| Extra Family Link | €2.99/mo | Each additional family member |

**Free trial**: 7 days (no credit card required)
**One family link included** per Individual Plan subscription
**Renewals**: Auto-renew monthly, cancel anytime

**Database table**: `subscription_plans`

---

## 📱 KEY PAGES & ROUTES

| Route | Description |
|-------|-------------|
| `/` | Homepage — main marketing landing page |
| `/ai-register` | Registration page |
| `/auth` | Login + password reset |
| `/devices/ice-sos-pendant` | ICE SOS Pendant product page |
| `/regional-center/spain` | Spain regional hub |
| `/family-carer-access` | Family member access setup |
| `/videos` | Demo videos |
| `/blog` | Blog |
| `/support` | Support center |
| `/contact` | Contact page |
| `/dashboard` | Main user dashboard (protected) |
| `/family-dashboard` | Family view (protected) |
| `/sos-app` | SOS interface (protected) |

---

## 🎨 DESIGN SYSTEM

**Brand Colors**:
```css
--primary-red: #ef4444       /* Main CTA, logo, headings */
--primary-red-dark: #dc2626  /* Hover states */
--primary-red-darker: #991b1b /* Active states */
--bg-dark: #0b0b0f           /* Main background */
--bg-dark-secondary: #1a1a2e /* Card backgrounds */
--text-primary: #ffffff      /* Main text */
--text-muted: #94a3b8        /* Secondary text */
--text-subtle: #64748b       /* Tertiary text */
--border: rgba(255,255,255,0.1) /* Card borders */
```

**Typography**: Poppins (headings) + Inter (body) — loaded via Google Fonts

**Component patterns**:
- Cards: `bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl`
- CTAs: `bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg`
- Inputs: `bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500`
- Sections: Dark backgrounds with subtle gradients, generous padding

**Animations**: Tailwind animate classes + CSS transitions
**Icons**: Lucide React

---

## 🗄️ DATABASE SCHEMA (KEY TABLES)

```sql
-- Core tables (Supabase)
profiles              -- User profiles, extends auth.users
subscription_plans    -- Available subscription tiers
user_subscriptions    -- Active user subscriptions
emergency_contacts    -- User's emergency contacts
medical_info          -- Medical data for emergency responders
family_members        -- Family circle connections
sos_events            -- Emergency SOS activations (7yr retention)
devices               -- Connected devices (pendants, wearables)
```

**RLS (Row Level Security)**: Enabled on all tables.
Users can only read/write their own data. Emergency overrides exist for SOS events.

---

## 🚨 EMERGENCY FEATURES

**SOS Flow**:
1. User activates SOS (button press / pendant / app)
2. System logs `sos_events` record
3. CLARA AI assesses situation
4. Emergency contacts notified with GPS location
5. Medical info prepared for first responders
6. Conference bridge optionally activated

**Emergency data retention**: 7 years (legal requirement)

**CRITICAL RULE**: Emergency features must NEVER be blocked by:
- Subscription expiry
- Auth issues
- Translation failures
- Any non-emergency system failure

---

## 📍 SPAIN REGIONAL SECTION

**Location on homepage**: Below main features, above pricing
**Regional Partner section content**:
- Should emphasise CLARA AI, NOT call centres
- Correct text: "24/7 AI Emergency Response"
- Spain emergency number: 112
- Spain compliance: LOPD + GDPR
- Regional contact: spain@lifelink-sync.com

**DO NOT** mention "Professional Call Centre Support" — this was legacy copy.

---

## 📦 DEVICE — ICE SOS PENDANT

**Route**: `/devices/ice-sos-pendant`

**Features to highlight**:
- GPS tracking
- One-touch SOS
- Connects to smartphone + smartwatch + medical devices
- Waterproof
- 72hr battery

**DO NOT** use "Works With Your Smart Home" on this page.
**CORRECT copy**: "Connects To Your Devices" with subtitle:
"Pairs with your smartphone, smartwatch and medical devices for complete protection"

---

## ✅ CODING RULES & CONVENTIONS

### General
- TypeScript strict mode — no `any` types unless absolutely necessary
- Always use named exports for components
- Component files: PascalCase (`UserProfile.tsx`)
- Hook files: camelCase with `use` prefix (`useEmergencyAlert.ts`)
- Never use `console.log` in production code — use proper error handling

### Imports
```typescript
// Always use @ alias — never relative paths from src/
import { supabase } from '@/integrations/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
```

### Supabase queries
```typescript
// Always handle errors
const { data, error } = await supabase.from('table').select('*')
if (error) throw error

// Always use RLS-safe queries (don't pass userId manually)
// Let RLS policies handle the filtering
```

### Translation
```typescript
// Always use translation hook
const { t, language } = useLanguage()

// Use descriptive keys — never generic ones
t('auth.forgotPassword')    // ✅ Good
t('button1')                // ❌ Bad
```

### Styling
```typescript
// Use Tailwind — no inline styles except for dynamic values
// Use cn() helper for conditional classes
import { cn } from '@/lib/utils'
className={cn('base-class', condition && 'conditional-class')}
```

---

## 🔧 COMMON TASKS — QUICK REFERENCE

### Add a new translation key
1. Find language file: `src/contexts/LanguageContext.tsx` or `src/lib/translations.ts`
2. Add key to EN object
3. Add same key to ES object
4. Add same key to NL object
5. Use `t('your.key')` in component

### Add a new page
1. Create `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Add to sitemap: `public/sitemap.xml`
4. Add translations for page content

### Add a new Supabase migration
1. Create file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Write SQL with proper RLS policies
3. Test locally: `supabase db reset`
4. Commit alongside the code changes that need it

### Password reset (Supabase)
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth?tab=reset`,
})
```

---

## 🐛 KNOWN ISSUES (TODO)

1. **Translation gaps**: CLARA chat, "How It Works" modal, hero mockup text not translating
2. **Homepage copy**: Spain section still shows old "Call Centre" text
3. **Pendant page**: "Works With Your Smart Home" needs replacing
4. **Login page**: Missing "Forgot Password" link + flow
5. **Language sync**: App language change doesn't trigger CLARA re-render

---

## 🔒 ENVIRONMENT VARIABLES

```bash
# Required in .env.local and Vercel dashboard
VITE_SUPABASE_URL=          # Supabase project URL
VITE_SUPABASE_ANON_KEY=     # Supabase anon/public key

# Optional (for edge functions)
VITE_ANTHROPIC_API_KEY=     # Claude AI API key (for CLARA)
```

See `.env.example` for full list. Never commit actual values.

---

## 📞 CONTACT & ACCOUNTS

| Service | URL |
|---------|-----|
| Supabase Dashboard | https://supabase.com/dashboard |
| Vercel Dashboard | https://vercel.com/dashboard |
| Lovable Editor | https://lovable.dev/projects/a856a70f-639b-4212-b411-d2cdb524d754 |
| Live Site | https://lifelink-sync.vercel.app |

**Business emails** (for reference):
- support@lifelink-sync.com
- partnerships@lifelink-sync.com
- privacy@lifelink-sync.com
- legal@lifelink-sync.com

---

## 🚀 DEPLOYMENT

```bash
# Local development
npm run dev

# Build check (run before every commit)
npm run build

# Deploy — push to main branch, Vercel auto-deploys
git push origin main
```

**Build must pass with zero errors and zero TypeScript errors before committing.**

---

## 📋 CURRENT SPRINT — ACTIVE TASKS

### Task 1: Homepage Copy Fix
- [ ] Replace "Professional Call Centre Support" in Spain section → "24/7 AI Emergency Response"
- [ ] Replace "Works With Your Smart Home" on pendant page → "Connects To Your Devices"

### Task 2: Full Translation Audit
- [ ] CLARA chat widget — wire to language context
- [ ] "How It Works" modal — all strings translatable
- [ ] Hero mockup overlay text — wrap with t()
- [ ] Full audit: find all hardcoded EN strings, replace with t()
- [ ] Verify: switching to ES/NL changes ALL visible text

### Task 3: Forgot Password
- [ ] Add "Forgot your password?" link below password input on login page
- [ ] Add reset email form with Supabase `resetPasswordForEmail`
- [ ] Add success screen showing email sent
- [ ] Handle reset redirect on `/auth?tab=reset`
- [ ] Add EN + ES + NL translations for all new strings

---

*Last updated: March 2026*
*Maintainer: LeeSpain*
