# Commercial Build 1 — Annual Pricing Roadmap

## Milestone: v3.0 Annual Pricing

---

## Phase 1: Stripe + Database Foundation
**Requirements:** REQ-001, REQ-007
**Estimated effort:** 1-2 hours
**Dependencies:** None

### Tasks
1. Create migration to add annual plan to `subscription_plans`
   - New row: name "Individual Annual", price 99.90, billing_interval "year", is_active true
   - Add `billing_interval` to `subscribers` table if not present
2. Update `setup-stripe-products` or create edge function to create annual Stripe price
3. Update `stripe-webhook` to handle annual subscription lifecycle
4. Update `subscribers` insert/update to record billing_interval
5. Add CLARA training data for annual pricing

### Deliverables
- Migration file with annual plan + training data
- Updated stripe-webhook
- Annual Stripe price created

---

## Phase 2: Pricing Page Toggle
**Requirements:** REQ-002
**Estimated effort:** 1-2 hours
**Dependencies:** Phase 1 (annual price must exist)

### Tasks
1. Add monthly/annual toggle to `src/components/Pricing.tsx`
2. When annual selected, show €99.90/year with savings badge
3. Pass billing cycle to CTA/checkout link
4. Add EN, ES, NL translations for toggle + savings text
5. Update `usePricing.ts` hook if needed

### Deliverables
- Updated Pricing.tsx with toggle
- Translation keys added

---

## Phase 3: Sign-Up Flow + Checkout
**Requirements:** REQ-003
**Estimated effort:** 1-2 hours
**Dependencies:** Phase 1 (Stripe price must exist)

### Tasks
1. Add billing cycle selector to PlanStep.tsx (only when paid plan selected)
2. Pass billing_interval through wizard state to PaymentStep.tsx
3. Update `create-checkout` or `process-mixed-payment` to accept billing_interval param
4. Use correct Stripe price ID based on monthly/annual
5. Add EN, ES, NL translations

### Deliverables
- Updated PlanStep.tsx, PaymentStep.tsx
- Updated checkout edge function

---

## Phase 4: Member Dashboard + Admin
**Requirements:** REQ-004, REQ-005
**Estimated effort:** 1-2 hours
**Dependencies:** Phase 1

### Tasks
1. Update `SubscriptionCard.tsx` to show billing cycle + renewal date
2. Add "Switch to Annual" upsell for monthly subscribers
3. Update `RevenueAnalyticsPage.tsx` with annual/monthly breakdown
4. Update `SubscriptionsPage.tsx` with billing interval column
5. Add EN, ES, NL translations

### Deliverables
- Updated member dashboard components
- Updated admin dashboard components

---

## Phase 5: CLARA + Final QA
**Requirements:** REQ-006
**Estimated effort:** 30 min
**Dependencies:** Phase 1

### Tasks
1. Update ai-chat system prompt to mention annual option
2. Update whatsapp-inbound system prompt
3. Smoke test: ask CLARA about annual pricing on web + WhatsApp
4. Full QA: pricing page, sign-up, dashboard, admin, webhook

### Deliverables
- Updated ai-chat and whatsapp-inbound
- QA passed

---

## Summary

| Phase | What | Est. Time |
|-------|------|-----------|
| 1 | Stripe + DB foundation + training data | 1-2h |
| 2 | Pricing page toggle | 1-2h |
| 3 | Sign-up flow + checkout | 1-2h |
| 4 | Member + Admin dashboards | 1-2h |
| 5 | CLARA prompts + QA | 30m |

**Total estimated: 5-8 hours**

---
*Last updated: 2026-03-14*
