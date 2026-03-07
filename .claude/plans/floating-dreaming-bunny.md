# Implementation Plan: Subscription/Pricing System with Add-Ons

## Executive Summary

Migrate from 3-tier flat pricing (Individual/Family/Professional) to a single base plan (Individual EUR 9.99/month) with modular add-ons (Family Link, Daily Wellbeing, Medication Reminder) and a derived CLARA Complete auto-unlock. Add 7-day no-card trial flow. Extend existing Stripe integration, database tables, and admin pages -- do NOT delete or overwrite anything.

---

## Phase 1: Database Migrations

### Migration 1: `addon_catalog` table (NEW)

New table for add-on products. Existing `subscription_plans` handles base plans; `products` handles physical goods. Add-ons are a new concept.

```sql
CREATE TABLE IF NOT EXISTS public.addon_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 2.99,
  currency TEXT NOT NULL DEFAULT 'EUR',
  interval_type TEXT NOT NULL DEFAULT 'month',
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  icon TEXT,
  category TEXT DEFAULT 'wellness',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: public read active, admin full access
-- Seed: family_link, daily_wellbeing, medication_reminder (all EUR 2.99)
```

### Migration 2: `member_addons` table (NEW)

Tracks which add-ons each subscriber has activated, with Stripe subscription item references.

```sql
CREATE TABLE IF NOT EXISTS public.member_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.addon_catalog(id) ON DELETE RESTRICT,
  stripe_subscription_item_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  quantity INTEGER NOT NULL DEFAULT 1,
  free_units INTEGER NOT NULL DEFAULT 0,  -- family_link: 1st free
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  canceled_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, addon_id)
);
-- RLS: users see own, admin full access
```

### Migration 3: `trial_tracking` table (NEW)

Proper trial tracking tied to `auth.users` with one-trial-per-user enforcement.

```sql
CREATE TABLE IF NOT EXISTS public.trial_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  status TEXT NOT NULL DEFAULT 'active',
  converted_at TIMESTAMPTZ,
  plan_after_trial TEXT,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: users see own, admin full access
-- Index on (status, trial_end) for expiry cron
```

### Migration 4: `clara_unlock_log` table (NEW)

Audit log for CLARA Complete auto-unlock/lock events. CLARA Complete is derived state, not a subscription.

```sql
CREATE TABLE IF NOT EXISTS public.clara_unlock_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('unlocked', 'locked')),
  reason TEXT,
  daily_wellbeing_active BOOLEAN NOT NULL DEFAULT false,
  medication_reminder_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: users see own, admin full access
```

### Migration 5: Extend `subscribers` table (ALTER)

```sql
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS is_trialing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS active_addons TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS clara_complete_unlocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
```

### Migration 6: Update `subscription_plans` seed data

```sql
-- Soft-deactivate old tiers (do NOT delete)
UPDATE public.subscription_plans SET is_active = false WHERE name IN ('Family', 'Professional');

-- Ensure Individual plan exists at EUR 9.99 with updated features
-- ON CONFLICT: update features/description if name='Individual' already exists
```

---

## Phase 2: Stripe Setup

### New Edge Function: `setup-addon-stripe-products/index.ts`

Admin-only function (pattern: existing `setup-stripe-products/index.ts`) that creates:

1. **Individual Plan** - Product + Price: EUR 9.99/month recurring
2. **Family Link** - Product + Price: EUR 2.99/month recurring (quantity-based)
3. **Daily Wellbeing** - Product + Price: EUR 2.99/month recurring
4. **Medication Reminder** - Product + Price: EUR 2.99/month recurring

Writes `stripe_price_id` / `stripe_product_id` back to `addon_catalog` and `subscription_plans`.

CLARA Complete is NOT a Stripe product (derived state).

No new environment variables needed -- uses existing `STRIPE_SECRET_KEY`.

---

## Phase 3: Edge Functions

### 3a. NEW: `activate-trial/index.ts`

No-card trial activation for authenticated users.

- Authenticate user from Authorization header
- Check `trial_tracking` -- reject if user already has a record (one trial per user)
- Insert into `trial_tracking` (status='active', trial_end=now+7days)
- Upsert into `subscribers` (subscribed=true, is_trialing=true, trial_end, subscription_tier='Individual')
- Send welcome email via Resend
- Return `{ success: true, trial_end }`

### 3b. NEW: `manage-addons/index.ts`

Add, remove, or list add-ons for authenticated user.

**Request**: `{ action: 'add' | 'remove' | 'list', addon_slug: string, quantity?: number }`

**Add logic**:
- Verify active subscription exists
- For `family_link`: set `free_units=1`, only charge Stripe for `max(0, quantity - 1)`
- For wellness add-ons: add as Stripe subscription item via `stripe.subscriptionItems.create()`
- Insert/update `member_addons`
- Check CLARA Complete: if both `daily_wellbeing` AND `medication_reminder` active -> unlock, log to `clara_unlock_log`, set `subscribers.clara_complete_unlocked = true`
- Update `subscribers.active_addons` array

**Remove logic**:
- Cancel Stripe subscription item
- Update `member_addons` status to 'canceled'
- Re-check CLARA Complete (may lock)
- Update `subscribers` fields

**List logic**: Return `member_addons` joined with `addon_catalog` for user

### 3c. NEW: `addon-checkout/index.ts`

Checkout session for users without existing Stripe subscription (e.g., after trial).

- Accept `{ plan_id, addon_slugs: string[] }`
- Build line items: base plan + each add-on price (minus free units for family_link)
- Create Stripe Checkout Session with `mode: 'subscription'`
- Store `metadata.user_id`, `metadata.addon_slugs`
- Return checkout URL

### 3d. MODIFY: `stripe-webhook/index.ts` (extend only)

Add new event handling after existing blocks:

- `checkout.session.completed`: if metadata has `addon_slugs`, create `member_addons` records, check CLARA unlock
- `customer.subscription.updated`: sync subscription item changes to `member_addons`
- Trial conversion: when trialing user pays, update `trial_tracking.status='converted'`, `subscribers.is_trialing=false`

### 3e. MODIFY: `check-subscription/index.ts` (extend only)

Add to return payload:
- `is_trialing: boolean`
- `trial_end: string | null`
- `active_addons: string[]`
- `clara_complete_unlocked: boolean`

Query `member_addons` and `trial_tracking` after existing Stripe check.

### 3f. NEW: `expire-trials/index.ts` (cron)

Daily cron to expire trials past `trial_end`:
- Query `trial_tracking` where status='active' AND trial_end < now()
- Update to status='expired'
- Update `subscribers`: is_trialing=false, subscribed=false
- Send "trial expired" email via Resend

---

## Phase 4: Frontend Changes

### 4a. MODIFY: `src/components/Pricing.tsx`

Replace 3-tier card layout with:
- Single Individual plan card (EUR 9.99/month) listing base features
- Add-on marketplace section below: 3 add-on cards (Family Link, Daily Wellbeing, Medication Reminder) each EUR 2.99/month
- CLARA Complete banner: "FREE - auto-unlocked with both Daily Wellbeing + Medication Reminder"
- Update trial text: "7-day free trial, no card required"
- "Start Free Trial" CTA -> calls `activate-trial` or routes to trial signup

### 4b. NEW: `src/hooks/useAddons.ts`

React Query hook for add-on data:
```typescript
export function useAddons() {
  return useQuery({
    queryKey: ['user', 'addons'],
    queryFn: () => supabase.functions.invoke('manage-addons', { body: { action: 'list' } }),
    staleTime: 5 * 60 * 1000,
  });
}
```

### 4c. NEW: `src/components/dashboard/AddOnMarketplace.tsx`

Dashboard component for managing add-ons (pattern: `FamilyAccessPanel.tsx`):
- List available add-ons from `addon_catalog`
- "Active" badge on subscribed add-ons
- Add/Remove buttons calling `manage-addons`
- Family Link: show link count, "+Add Link", "1st link free" indicator
- CLARA Complete status banner (locked/unlocked)
- Monthly cost breakdown

### 4d. MODIFY: `src/components/dashboard/SubscriptionCard.tsx`

Extend Overview tab (do not replace):
- Trial status: "Trial: X days remaining" with progress bar + "Subscribe Now" CTA
- Active add-ons list
- CLARA Complete badge if unlocked
- Cost breakdown: "Base EUR 9.99 + 2 add-ons EUR 5.98 = EUR 15.97/month"

### 4e. MODIFY: `src/hooks/useOptimizedSubscription.ts`

Extend `SubscriptionData` interface:
```typescript
is_trialing: boolean;
trial_end: string | null;
active_addons: string[];
clara_complete_unlocked: boolean;
```

### 4f. NEW: `src/pages/TrialSignupPage.tsx`

Dedicated trial activation page for authenticated users:
- "Start Your 7-Day Free Trial" button
- Calls `activate-trial` edge function
- On success: redirect to dashboard with toast
- Add route in app router

### 4g. NEW Admin Pages

**`src/components/admin/pages/AddonManagementPage.tsx`**
- CRUD for `addon_catalog` (pattern: `SubscriptionPlansPage.tsx`)
- Table view, create/edit dialog, active toggle

**`src/components/admin/pages/TrialManagementPage.tsx`**
- View all trials from `trial_tracking`
- Status filters, conversion rate stats
- Pattern: `SubscriptionsPage.tsx`

**Routes** (add to `AdminDashboard.tsx`):
```tsx
<Route path="addon-management" element={<AddonManagementPage />} />
<Route path="trial-management" element={<TrialManagementPage />} />
```

Add sidebar nav items in AdminLayout.

---

## Phase 5: Implementation Order

Execute in this order due to dependencies:

1. **Database migrations** (1-6) - tables must exist first
2. **Stripe setup function** - creates products/prices, writes IDs to DB
3. **New edge functions** (activate-trial, manage-addons, addon-checkout, expire-trials)
4. **Extend existing edge functions** (check-subscription, stripe-webhook)
5. **Frontend hooks** (useAddons, extend useOptimizedSubscription)
6. **Frontend components** (Pricing.tsx, AddOnMarketplace, TrialSignupPage, SubscriptionCard)
7. **Admin pages** (AddonManagementPage, TrialManagementPage, routes)

---

## Key Design Decisions

1. **Add-ons as Stripe subscription items** (not separate subscriptions) - unified billing, single invoice
2. **CLARA Complete = derived state** - computed when add-ons change, stored as boolean flag, no Stripe product
3. **"1st Family Link free" via `free_units` column** - billable = max(0, quantity - free_units)
4. **No-card trial in `trial_tracking` + `subscribers`** - sets `subscribed=true, is_trialing=true` so existing feature gates work during trial
5. **Soft-deactivate old plans** (`is_active=false`) - never delete existing data
6. **Family Link coordinates with existing `family_groups`** - `member_addons.quantity` syncs to `family_groups.max_members`

## Critical Files

- `supabase/functions/stripe-webhook/index.ts` - extend with add-on sync + trial conversion
- `supabase/functions/check-subscription/index.ts` - extend return payload
- `src/components/Pricing.tsx` - redesign from 3-tier to base+addons
- `src/hooks/useOptimizedSubscription.ts` - extend interface
- `src/components/dashboard/SubscriptionCard.tsx` - add trial/addon display
- `src/components/dashboard/family/FamilyAccessPanel.tsx` - coordinate with Family Link addon
- `src/pages/AdminDashboard.tsx` - add new admin routes

## Environment Variables

No new variables needed. Existing `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_*`, and `RESEND_API_KEY` cover all requirements.
