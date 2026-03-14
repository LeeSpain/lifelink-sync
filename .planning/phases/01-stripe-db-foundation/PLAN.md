# Phase 1: Stripe + DB Foundation — Execution Plan

**Requirements:** REQ-001, REQ-006, REQ-007
**Status:** Ready to execute

---

## Task 1: Migration — Annual plan + pricing config + training data

**File:** `supabase/migrations/20260314400000_annual_pricing.sql`

### SQL:
```sql
-- 1. Insert annual Individual Plan
INSERT INTO public.subscription_plans (name, description, price, currency, billing_interval, features, is_active, is_popular, sort_order)
VALUES (
  'Individual Annual',
  'Essential protection — billed annually. Save €19.98 (2 months free).',
  99.90,
  'EUR',
  'year',
  '["SOS activation (app)", "Clara AI 24/7", "Live location sharing", "1 emergency contact", "Incident log", "1 free Family Link", "Save 2 months free"]'::jsonb,
  true,
  false,
  1
);

-- 2. Add annual price to pricing_config
INSERT INTO public.pricing_config (key, value) VALUES ('individual_annual', '99.90')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Add CLARA training data for annual pricing
INSERT INTO public.training_data (question, answer, category, status, audience, tags, confidence_score) VALUES
('Is there an annual plan?',
 'Yes! Our Individual Plan is available annually for just 99.90 EUR per year — that saves you 19.98 EUR compared to paying monthly. It is like getting 2 months completely free. Same full protection, same features, just better value.',
 'pricing', 'active', 'customer', '{"annual","pricing","savings"}', 1.0),
('How much is the annual plan?',
 'The annual Individual Plan is 99.90 EUR per year. That works out to about 8.33 EUR per month — compared to 9.99 EUR per month on the monthly plan. You save 19.98 EUR, which is 2 full months free.',
 'pricing', 'active', 'customer', '{"annual","pricing","cost"}', 1.0),
('Do I save money with annual billing?',
 'Absolutely. The annual plan saves you 19.98 EUR per year — that is 2 months completely free. You pay 99.90 EUR once per year instead of 9.99 EUR every month. Same features, same protection, just better value for committing to a year.',
 'pricing', 'active', 'customer', '{"annual","savings","billing"}', 1.0),
('Can I switch from monthly to annual?',
 'Yes, you can switch to annual billing anytime from your dashboard. When you switch, your current monthly subscription ends at the next billing date and your annual plan starts from there. You will immediately start saving.',
 'pricing', 'active', 'customer', '{"annual","switch","billing"}', 1.0)
ON CONFLICT DO NOTHING;
```

### Acceptance Criteria
- [ ] Annual plan row exists in subscription_plans with price=99.90, billing_interval='year'
- [ ] pricing_config has individual_annual=99.90
- [ ] 4 new training_data rows about annual pricing

---

## Task 2: Fix process-mixed-payment hardcoded interval

**File:** `supabase/functions/process-mixed-payment/index.ts`
**Change:** Replace hardcoded `interval: "month"` with the plan's billing_interval

Find the line that creates a Stripe subscription with hardcoded monthly:
```typescript
recurring: { interval: "month" }
```
Replace with:
```typescript
recurring: { interval: plan.billing_interval || "month" }
```

Also fix the hardcoded 30-day subscription_end:
```typescript
subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
```
Replace with:
```typescript
subscription_end: new Date(Date.now() + (plan.billing_interval === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
```

### Acceptance Criteria
- [ ] Annual plans create yearly Stripe subscriptions
- [ ] subscription_end is 365 days for annual, 30 for monthly

---

## Task 3: Update ai-chat and whatsapp-inbound system prompts

**Files:**
- `supabase/functions/ai-chat/index.ts` — add annual pricing line to knowledge base
- `supabase/functions/whatsapp-inbound/index.ts` — add annual mention to system prompt

### Changes:
In ai-chat `buildKnowledgeBase()` English section, after the Individual Plan pricing block, add:
```
Annual billing available: €99.90/year (2 months free vs monthly)
```
Same for ES and NL sections.

In whatsapp-inbound SYSTEM_PROMPT, add to PRODUCT KNOWLEDGE:
```
- Annual billing: 99.90 EUR/year (saves 19.98 EUR — 2 months free)
```

### Acceptance Criteria
- [ ] ai-chat mentions annual option in knowledge base
- [ ] whatsapp-inbound mentions annual option

---

## Task 4: Deploy + Push + Test

1. Push migration: `npx supabase db push --include-all`
2. Deploy process-mixed-payment: `npx supabase functions deploy process-mixed-payment --no-verify-jwt`
3. Deploy ai-chat: `npx supabase functions deploy ai-chat --no-verify-jwt`
4. Deploy whatsapp-inbound: `npx supabase functions deploy whatsapp-inbound --no-verify-jwt`
5. Test CLARA: ask "Is there an annual plan?" on web chat
6. Test CLARA: ask same on WhatsApp

### Acceptance Criteria
- [ ] Migration applied
- [ ] All functions deployed
- [ ] CLARA correctly explains annual pricing

---

## Task 5: Commit

```bash
git add -A
git commit -m "feat: annual pricing foundation — DB, Stripe, CLARA training data"
git push origin main
```

---

## Summary

| Task | What | Est. Time |
|------|------|-----------|
| 1 | Migration: annual plan + pricing_config + training data | 10 min |
| 2 | Fix process-mixed-payment hardcoded interval | 15 min |
| 3 | Update ai-chat + whatsapp prompts | 10 min |
| 4 | Deploy + test | 10 min |
| 5 | Commit | 2 min |

**Total: ~45 minutes**

---
*Created: 2026-03-14*
