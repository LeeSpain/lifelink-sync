# LifeLink Sync Tech Stack

## Overview
LifeLink Sync is a full-stack emergency protection platform with web, mobile (iOS/Android), and edge function components.

---

## Languages & Versions

| Language | Version | Purpose |
|----------|---------|---------|
| **TypeScript** | 5.5.3 | Core application language (strict mode) |
| **JavaScript** | ES2020+ | Runtime via Vite/Node |
| **SQL** | PostgreSQL | Database language (Supabase) |
| **Deno** | (runtime) | Edge functions environment (Supabase Functions) |
| **HTML/CSS** | Modern | Templates and styling |

---

## Frontend Framework & Bundler

| Component | Package | Version | Purpose |
|-----------|---------|---------|---------|
| **React** | react | 18.3.1 | UI framework (RSC disabled) |
| **React DOM** | react-dom | 18.3.1 | DOM rendering |
| **Vite** | vite | 5.4.1 | Build tool & dev server |
| **SWC** | @vitejs/plugin-react-swc | 3.5.0 | Fast JSX/TS transpiler |
| **Vite PWA** | vite-plugin-pwa | 0.20.5 | PWA support (auto-update, workbox caching) |

### Vite Config Details
- **Path alias**: `@/` → `./src/`
- **Build target**: esnext
- **Minifier**: esbuild
- **CSS code splitting**: enabled
- **Chunk size warning limit**: 1000 KB
- **Dev server**: `::` on port 8080 (IPv6 support)
- **Production optimizations**: console.log/debug/info/warn stripped in production

### Vite Output Chunks
- `vendor.js` → React + React DOM
- `ui.js` → Radix UI components
- `supabase.js` → Supabase JS client
- `tanstack.js` → React Query

---

## UI & Styling

| Component | Package | Version | Purpose |
|-----------|---------|---------|---------|
| **shadcn/ui** | N/A | latest | Headless UI components (built on Radix) |
| **Radix UI** | @radix-ui/react-* | 1.1-1.2 | Primitive accessible components (30+ packages) |
| **Tailwind CSS** | tailwindcss | 3.4.11 | Utility-first styling |
| **Lucide React** | lucide-react | 0.462.0 | Icon library |
| **Tailwind Merge** | tailwind-merge | 2.5.2 | Conditional class merging |
| **Tailwind Animate** | tailwindcss-animate | 1.0.7 | Animation utilities |
| **PostCSS** | postcss | 8.4.47 | CSS processing |
| **Autoprefixer** | autoprefixer | 10.4.20 | Vendor prefix support |

### Design Tokens
- **Colors**: Primary red (#ef4444), dark backgrounds, semantic colors (emergency, guardian, wellness)
- **Typography**: Poppins (headings), Inter (body) — via Google Fonts
- **Spacing**: 7rem sections, custom utilities
- **Animations**: Accordion, slide-testimonials, custom keyframes
- **Dark mode**: Class-based (`darkMode: ["class"]`)
- **Radii**: Customizable (var(--radius))

### shadcn/ui Config
- **Location**: `src/components/ui/`
- **Config file**: `components.json`
- **Aliases**: `@/components`, `@/utils`, `@/ui`, `@/lib`, `@/hooks`
- **CSS**: `src/index.css` with CSS variables
- **Base color**: Slate

---

## Routing & Navigation

| Package | Version | Purpose |
|---------|---------|---------|
| **React Router** | react-router-dom | 6.26.2 | Client-side routing (no Next.js) |
| **React Helmet Async** | react-helmet-async | 2.0.5 | SEO meta tags management |

---

## State Management & Data Fetching

| Package | Version | Purpose |
|---------|---------|---------|
| **TanStack React Query** | @tanstack/react-query | 5.85.5 | Server state management, caching, sync |
| **React Query DevTools** | @tanstack/react-query-devtools | 5.85.5 | Development debugging UI |
| **React Hook Form** | react-hook-form | 7.53.0 | Form state & validation |
| **Zod** | zod | 3.23.8 | TypeScript schema validation |
| **@hookform/resolvers** | @hookform/resolvers | 3.9.0 | Form resolver integration |

---

## Database & Backend

| Component | Service/Package | Version | Purpose |
|-----------|-----------------|---------|---------|
| **Supabase** | @supabase/supabase-js | 2.57.4 | PostgreSQL + Auth + Realtime |
| **PostgreSQL** | (Supabase hosted) | 15.x | Database engine |
| **Supabase Auth** | (built-in) | - | JWT-based authentication |
| **Supabase Realtime** | (built-in) | - | WebSocket subscriptions |
| **Supabase Edge Functions** | Deno runtime | - | Serverless functions |

### Supabase Integration
- **Import**: Always use `import { supabase } from '@/integrations/supabase/client'`
- **Client location**: `/src/integrations/supabase/client.ts`
- **Database types**: `/src/integrations/supabase/types.ts` (auto-generated from Supabase schema)
- **Auth flow**: Email + password, JWT in localStorage
- **Session persistence**: Auto-refresh enabled
- **RLS (Row Level Security)**: Enforced on all tables

---

## Payments & Billing

| Package | Version | Purpose |
|---------|---------|---------|
| **Stripe** | stripe@14.21.0 | Payment processing (npm package in edge functions) |
| **@stripe/react-stripe-js** | 3.8.1 | React Stripe elements |
| **@stripe/stripe-js** | 7.7.0 | Stripe client library |

### Stripe Integration
- **Client key**: `VITE_STRIPE_PUBLISHABLE_KEY`
- **Edge functions**: Multiple functions handle payment flows (see INTEGRATIONS.md)
- **Webhook endpoint**: `supabase/functions/stripe-webhook/index.ts`
- **Verification**: HMAC SHA-256 signature validation

---

## Mobile & Native

| Package | Version | Purpose |
|---------|---------|---------|
| **Capacitor Core** | @capacitor/core | 7.4.3 | Bridge between web and native |
| **Capacitor iOS** | @capacitor/ios | 7.4.3 | iOS app wrapper |
| **Capacitor Android** | @capacitor/android | 7.4.3 | Android app wrapper |
| **Capacitor CLI** | @capacitor/cli | 7.4.3 | Build and sync tool |

### Capacitor Plugins Used
- **Geolocation**: `@capacitor/geolocation` (7.0.2) — GPS location tracking
- **Camera**: `@capacitor/camera` (7.0.2) — Photo capture
- **Clipboard**: `@capacitor/clipboard` (7.0.2) — Copy/paste
- **Share**: `@capacitor/share` (7.0.2) — Native share dialog
- **Splash Screen**: `@capacitor/splash-screen` (7.0.2) — Launch screen
- **Status Bar**: `@capacitor/status-bar` (7.0.2) — Status bar styling
- **Preferences**: `@capacitor/preferences` (7.0.2) — Local storage
- **App**: `@capacitor/app` (7.0.2) — App lifecycle
- **Filesystem**: `@capacitor/filesystem` (7.1.4) — File I/O
- **Device**: `@capacitor/device` (7.0.2) — Device info
- **Haptics**: `@capacitor/haptics` (7.0.2) — Vibration feedback
- **Push Notifications**: `@capacitor/push-notifications` (7.0.2) — Remote notifications
- **Keep Awake**: @capacitor-community/keep-awake (7.1.0) — Prevent sleep
- **Bluetooth LE**: @capacitor-community/bluetooth-le (7.1.1) — Bluetooth Low Energy

### Capacitor Config
- **File**: `capacitor.config.ts`
- **App ID**: `com.lifelinksync.app`
- **Web dir**: `dist` (built output)
- **Bundled runtime**: false
- **Development server**: Points to Lovable project URL for testing

---

## Mapping & Geolocation

| Package | Version | Purpose |
|---------|---------|---------|
| **MapLibre GL** | maplibre-gl | 5.19.0 | Vector maps (replaces Google Maps) |
| **React Virtual** | @tanstack/react-virtual | 3.13.12 | Virtualization for large lists |

### Map Architecture
- **Tile source**: OSM raster tiles (free, no API key)
- **Components**: React-based (MapLibreMap, MapShell, layer components)
- **Context**: MapContext for sharing map instance
- **Types**: `src/types/map.ts`
- **Legacy**: Canvas-based system deprecated but files remain

---

## Calendar & Time

| Package | Version | Purpose |
|---------|---------|---------|
| **date-fns** | 3.6.0 | Date utilities (parsing, formatting, manipulation) |
| **React Big Calendar** | react-big-calendar | 1.19.4 | Calendar component |
| **React Day Picker** | react-day-picker | 8.10.1 | Date picker |

---

## Forms & Input

| Package | Version | Purpose |
|---------|---------|---------|
| **React OTP Input** | input-otp | 1.2.4 | OTP/verification code input |
| **CMDk** | cmdk | 1.0.0 | Command menu/search |

---

## Drag & Drop

| Package | Version | Purpose |
|---------|---------|---------|
| **@hello-pangea/dnd** | 18.0.1 | Drag-and-drop lists (maintained fork of react-beautiful-dnd) |
| **React Resizable Panels** | react-resizable-panels | 2.1.3 | Resizable layout panels |

---

## Carousel

| Package | Version | Purpose |
|---------|---------|---------|
| **Embla Carousel React** | embla-carousel-react | 8.3.0 | Lightweight carousel/slider |

---

## Charts & Visualization

| Package | Version | Purpose |
|---------|---------|---------|
| **Recharts** | recharts | 2.15.4 | React-based charts (line, bar, pie) |

---

## Internationalization (i18n)

| Package | Version | Purpose |
|---------|---------|---------|
| **i18next** | i18next | 23.16.8 | Translation framework |
| **react-i18next** | react-i18next | 14.1.3 | React bindings for i18next |
| **i18next Browser Language Detector** | i18next-browser-languagedetector | 7.2.2 | Auto-detect browser language |

### Supported Languages
- English (EN)
- Spanish (ES)
- Dutch (NL)

---

## Notifications & Toasts

| Package | Version | Purpose |
|---------|---------|---------|
| **Sonner** | sonner | 1.5.0 | Toast notifications |
| **Vaul** | vaul | 0.9.3 | Drawer component |

---

## QR Codes

| Package | Version | Purpose |
|---------|---------|---------|
| **qrcode** | 1.5.4 | QR code generation |
| **@types/qrcode** | 1.5.5 | TypeScript definitions |

---

## Security & Data

| Package | Version | Purpose |
|---------|---------|---------|
| **DOMPurify** | dompurify | 3.3.2 | XSS prevention (HTML sanitization) |
| **@types/dompurify** | 3.0.5 | TypeScript definitions |

---

## Monitoring & Analytics

| Package | Version | Purpose |
|---------|---------|---------|
| **@sentry/react** | 7.120.4 | Error tracking & performance monitoring |
| **Lovable Tagger** | lovable-tagger | 1.1.7 | Component tagging (dev-only) |

### Analytics Integration
- **Google Analytics 4**: Via gtag script (VITE_GA_MEASUREMENT_ID)
- **Sentry**: Error tracking and crash reporting (VITE_SENTRY_DSN)

---

## Theme Management

| Package | Version | Purpose |
|---------|---------|---------|
| **next-themes** | 0.3.0 | Dark mode and theme management |

---

## Build & Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **ESLint** | 9.9.0 | Code linting |
| **@eslint/js** | 9.9.0 | ESLint config |
| **typescript-eslint** | 8.0.1 | TypeScript ESLint support |
| **eslint-plugin-react-hooks** | 5.1.0-rc.0 | React hooks linting |
| **eslint-plugin-react-refresh** | 0.4.9 | Fast refresh linting |
| **@types/node** | 22.5.5 | Node.js types |
| **@types/react** | 18.3.3 | React types |
| **@types/react-dom** | 18.3.0 | React DOM types |
| **globals** | 15.9.0 | Global TypeScript definitions |
| **class-variance-authority** | 0.7.1 | Component variant management |
| **clsx** | 2.1.1 | Conditional classname utility |

---

## Deployment & Hosting

| Platform | Purpose | Config |
|----------|---------|--------|
| **Vercel** | Web hosting & CDN | `vercel.json` (rewrites, headers, CSP) |
| **Supabase** | Database & auth | Edge functions, webhooks |

### Vercel Config Details
- **Framework**: Vite
- **Build command**: `npm run build` (includes tablet.html generation)
- **Output directory**: `dist/`
- **Install command**: `npm install`
- **Dev command**: `npm run dev`
- **Rewrites**: `/tablet-dashboard` → `/tablet.html`
- **Headers**: Service worker cache control, security headers (CSP, HSTS, X-Frame-Options)
- **CSP**: Allows Stripe, Google Fonts, OSM tiles, Supabase

---

## Key Config Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `tsconfig.json` | TypeScript configuration (loose checking) |
| `vite.config.ts` | Vite build and dev config |
| `tailwind.config.ts` | Tailwind CSS theme and utilities |
| `capacitor.config.ts` | Mobile app configuration |
| `vercel.json` | Deployment configuration |
| `components.json` | shadcn/ui component config |
| `eslintrc.config.js` | Linting rules |
| `src/index.css` | Global styles and CSS variables |
| `src/i18n/` | Translation files (EN, ES, NL) |

---

## TypeScript Configuration

| Option | Value | Purpose |
|--------|-------|---------|
| `baseUrl` | `.` | Base directory for paths |
| `paths["@/*"]` | `./src/*` | Path alias for imports |
| `noImplicitAny` | `false` | Allow implicit any (loose) |
| `noUnusedParameters` | `false` | Allow unused params |
| `skipLibCheck` | `true` | Skip type checking of libs |
| `allowJs` | `true` | Allow .js files |
| `noUnusedLocals` | `false` | Allow unused locals |
| `strictNullChecks` | `false` | Allow implicit null/undefined |

**Note**: TypeScript is configured with loose checking. Prefer using Zod for runtime validation.

---

## Package Manager

- **Primary**: npm (modern, integrated with Node)
- **Secondary**: bun (lockb file present, optional alternative)
- **Lock file**: package-lock.json + bun.lockb

---

## Performance Features

### PWA (Progressive Web App)
- Service worker with Workbox caching
- Auto-update strategy
- Offline support
- App shortcuts (SOS, Register)
- Installable as standalone app

### Build Optimizations
- Manual chunk splitting for vendor, UI, Supabase, TanStack
- CSS code splitting
- Console.log stripping in production
- Image preloading for critical assets
- Compression via esbuild minifier

### Runtime Caching (Workbox)
- **Supabase**: NetworkFirst (1 hour, 50 entries)
- **Images**: CacheFirst (90 days, 200 entries)
- Static assets: long-lived cache
- Fallback: `/index.html` for navigation

---

## Environment Variables (Frontend)

```bash
VITE_SUPABASE_URL          # Supabase project URL
VITE_SUPABASE_ANON_KEY     # Supabase anon/public key
VITE_STRIPE_PUBLISHABLE_KEY # Stripe public key
VITE_GA_MEASUREMENT_ID     # Google Analytics measurement ID (GA4)
VITE_SENTRY_DSN            # Sentry error tracking DSN
VITE_SUPABASE_PROJECT_ID   # Supabase project ID (for cron endpoints)
```

**Set in**: `.env.local` (dev) or Vercel environment variables (production)

---

## Summary

LifeLink Sync is a modern, full-stack TypeScript application with:
- **Frontend**: React + Vite + Tailwind + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Mobile**: Capacitor (iOS + Android)
- **Payments**: Stripe
- **Mapping**: MapLibre GL (open-source alternative to Google Maps)
- **Monitoring**: Sentry + Google Analytics
- **Hosting**: Vercel + Supabase
- **i18n**: i18next (EN, ES, NL)

All production code uses TypeScript with path aliases, and components are co-located in `src/` with clear separation of concerns (components, pages, hooks, contexts, lib).
