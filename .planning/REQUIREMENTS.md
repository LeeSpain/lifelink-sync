# Commercial Build 1 — Annual Pricing Requirements

## REQ-001: Stripe Annual Price
**Priority:** Critical (must be first)
**Description:** Create an annual Stripe price for the Individual Plan at €99.90/year.

- REQ-001.1: Create `setup-annual-pricing` edge function or update `setup-stripe-products` to create annual price
- REQ-001.2: Store the annual `stripe_price_id` in `subscription_plans` table alongside the monthly one
- REQ-001.3: Add `billing_interval` column to `subscription_plans` if not present, or add a new row for annual
- REQ-001.4: Migration to seed the annual plan data: name "Individual Annual", price €99.90, interval "year"

## REQ-002: Pricing Page Toggle
**Priority:** High
**Description:** Add monthly/annual toggle to the pricing page. Show savings badge.

- REQ-002.1: Add toggle switch component (Monthly | Annual) above pricing cards
- REQ-002.2: When "Annual" selected, Individual Plan shows €99.90/year with "Save €19.98" or "2 months free" badge
- REQ-002.3: Add-on prices stay monthly-only (no annual add-ons)
- REQ-002.4: Toggle state passed to CTA button so checkout knows which price to use
- REQ-002.5: All text in EN, ES, NL translations

## REQ-003: Sign-Up Flow Billing Cycle
**Priority:** High
**Description:** At the payment step in registration, user can choose monthly or annual.

- REQ-003.1: In `PlanStep.tsx`, if user selects paid (not trial), show billing cycle choice
- REQ-003.2: Pass selected billing cycle through to `PaymentStep.tsx`
- REQ-003.3: `process-mixed-payment` or `create-checkout` must use the correct Stripe price ID based on cycle
- REQ-003.4: Trial flow unchanged — trial users choose billing cycle only when converting to paid

## REQ-004: Member Dashboard Billing Display
**Priority:** Medium
**Description:** Show current billing cycle and renewal date in member dashboard.

- REQ-004.1: `SubscriptionCard.tsx` shows "Monthly" or "Annual" label
- REQ-004.2: Shows next renewal date
- REQ-004.3: Shows savings info for annual ("You save €19.98/year")
- REQ-004.4: "Switch to Annual" upsell for monthly subscribers
- REQ-004.5: All text in EN, ES, NL

## REQ-005: Admin Dashboard Annual Metrics
**Priority:** Medium
**Description:** Admin sees annual vs monthly breakdown.

- REQ-005.1: `RevenueAnalyticsPage.tsx` shows monthly vs annual subscriber counts
- REQ-005.2: MRR calculation includes annualized monthly equivalent for annual subs
- REQ-005.3: `SubscriptionsPage.tsx` shows billing interval column

## REQ-006: CLARA Training Data
**Priority:** Medium
**Description:** CLARA knows about annual pricing and can sell it.

- REQ-006.1: Migration to add training_data rows for annual pricing Q&A
- REQ-006.2: Update ai-chat system prompt to mention annual option
- REQ-006.3: WhatsApp system prompt updated to mention annual option

## REQ-007: Stripe Webhook Update
**Priority:** Critical
**Description:** Webhook must handle annual subscription events correctly.

- REQ-007.1: `stripe-webhook` must recognize annual subscriptions
- REQ-007.2: Set correct `subscription_end` date (1 year from now, not 1 month)
- REQ-007.3: `subscribers` table records billing interval

---

## Acceptance Criteria

- [ ] Pricing page shows monthly/annual toggle with "2 months free" badge
- [ ] Sign-up flow allows annual selection at payment step
- [ ] Stripe checkout creates annual subscription at €99.90/year
- [ ] Member dashboard shows billing cycle and renewal date
- [ ] Admin dashboard shows annual vs monthly counts
- [ ] CLARA can explain annual pricing when asked
- [ ] Existing monthly subscribers are unaffected
- [ ] All new UI text available in EN, ES, NL
- [ ] Trial flow is completely unchanged

---
*Last updated: 2026-03-14*
