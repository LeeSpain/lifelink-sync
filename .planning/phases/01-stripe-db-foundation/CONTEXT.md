# Phase 1: Stripe + DB Foundation — Context

**Gathered:** 2026-03-14
**Requirements:** REQ-001, REQ-006, REQ-007

## Key Research Findings

### D1: billing_interval column already exists (LOCKED)
`subscription_plans.billing_interval` exists (TEXT, default 'month'). Just need to insert a new row with 'year'.

### D2: subscribers table has no billing_interval (LOCKED)
No need to add one — Stripe manages the subscription lifecycle. `subscription_end` comes from Stripe's `period.end` in the webhook. Webhook already handles this correctly.

### D3: pricing_config table drives UI prices (LOCKED)
`usePricing()` hook reads from `pricing_config`. Need to add `individual_annual` key = 99.90.

### D4: create-checkout already reads billing_interval from DB (LOCKED)
If `stripe_price_id` exists, uses it directly. Otherwise creates dynamic price with `plan.billing_interval`. This means: if we create an annual plan row with billing_interval='year', checkout will work automatically.

### D5: process-mixed-payment hardcodes 'month' (BUG)
Line creates subscription with `recurring: { interval: "month" }` hardcoded. Must be fixed to read from plan data.

### D6: stripe-webhook gets subscription_end from Stripe (GOOD)
No change needed — webhook reads `period.end` from Stripe invoice, which Stripe calculates based on billing cycle.

### D7: Annual price = €99.90/year (LOCKED)
€9.99 × 12 = €119.88. Annual = €99.90. Savings = €19.98 (2 months free).

### D8: Training data additions (LOCKED)
Add Q&A rows: "Is there an annual plan?", "How much is the annual plan?", "Do I save money with annual?"
