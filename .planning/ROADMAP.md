# Commercial Build 4 — 5-Star Referral Programme Roadmap

## Milestone: v5.0

---

## Phase 1: Database + Referral Code Generation
**Requirements:** REQ-001, REQ-002 (partial)
**Estimated effort:** 1-2 hours

### Tasks
1. Migration: create `referrals` table, `referral_rewards` table
2. Migration: add `referral_code` to profiles, auto-generate for existing users
3. Add CLARA training data for referral programme
4. Deploy migration

---

## Phase 2: Registration + Stripe Integration
**Requirements:** REQ-002, REQ-003
**Estimated effort:** 2-3 hours

### Tasks
1. Frontend: capture `ref` param on registration page, store in localStorage
2. Registration flow: attach referral_code to subscriber on sign-up
3. Edge function `referral-convert`: called from stripe-webhook on first payment
4. Update stripe-webhook to detect referred users and call referral-convert
5. Deploy functions

---

## Phase 3: Reward + Lapse Logic
**Requirements:** REQ-004, REQ-005
**Estimated effort:** 2 hours

### Tasks
1. Edge function `apply-referral-reward`: Stripe credit + notifications
2. Edge function `referral-lapse`: revert star, pause credit
3. Update stripe-webhook to call referral-lapse on cancellation
4. Deploy functions

---

## Phase 4: Dashboard UI — 5 Stars
**Requirements:** REQ-006
**Estimated effort:** 2-3 hours

### Tasks
1. New component: `ReferralPanel.tsx` with 5-star tracker
2. Star animation: silver → gold flip
3. Share button with copy-to-clipboard referral link
4. Progress counter + nudge messages
5. Add to member dashboard
6. EN/ES/NL translations

---

## Phase 5: Admin View + Final QA
**Requirements:** REQ-007, REQ-008
**Estimated effort:** 1-2 hours

### Tasks
1. Admin page: champion leaderboard
2. Credits applied tracking
3. Conversion funnel metrics
4. CLARA prompt updates
5. Full QA

---

## Summary

| Phase | What | Est. Time |
|-------|------|-----------|
| 1 | Database + referral codes + training data | 1-2h |
| 2 | Registration capture + Stripe convert | 2-3h |
| 3 | Reward application + lapse handling | 2h |
| 4 | Dashboard 5-star UI | 2-3h |
| 5 | Admin view + QA | 1-2h |

**Total estimated: 8-12 hours**

---
*Last updated: 2026-03-15*
