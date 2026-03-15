# Commercial Build 4 — 5-Star Referral Programme Requirements

## REQ-001: Database Schema
**Priority:** Critical
- REQ-001.1: Create `referrals` table: referrer_id, referred_user_id, star_position (1-5), status (pending/active/cancelled), converted_at, stripe_subscription_item_id
- REQ-001.2: Create `referral_rewards` table: user_id, reward_type, stripe_credit_id, starts_at, ends_at, status (active/paused/expired)
- REQ-001.3: Add `referral_code` column to `profiles` (unique per user, auto-generated)
- REQ-001.4: RLS: users can read own referrals, service_role can manage all
- REQ-001.5: Indexes on referrer_id, referred_user_id, status

## REQ-002: Referral Link + Registration
**Priority:** High
- REQ-002.1: Referral URL format: `lifelink-sync.com/join?ref=[referral_code]`
- REQ-002.2: When visitor arrives via referral link, store `ref` in localStorage
- REQ-002.3: On registration, attach referral_code to subscriber record
- REQ-002.4: Create pending referral row (star_position = next available 1-5)

## REQ-003: Star Conversion (referral-convert)
**Priority:** Critical
- REQ-003.1: Edge function `referral-convert` called from stripe-webhook when referred user's first payment succeeds
- REQ-003.2: Update referral status pending → active, set converted_at
- REQ-003.3: Check if all 5 stars are now active
- REQ-003.4: If all 5 gold → call apply-referral-reward

## REQ-004: Reward Application (apply-referral-reward)
**Priority:** Critical
- REQ-004.1: Create 12-month Stripe subscription credit via Stripe API
- REQ-004.2: Record in referral_rewards table
- REQ-004.3: Send WhatsApp to Lee + email to referrer
- REQ-004.4: CLARA congratulates referrer in next conversation

## REQ-005: Star Lapse (referral-lapse)
**Priority:** High
- REQ-005.1: When referred user cancels, revert their star to cancelled
- REQ-005.2: If free year was active and now < 5 gold stars, pause the credit
- REQ-005.3: Notify referrer: "One of your referrals cancelled — you need X more to maintain your free year"

## REQ-006: Dashboard UI
**Priority:** High
- REQ-006.1: Referral panel in member dashboard with 5-star visual tracker
- REQ-006.2: Stars: silver (empty) → gold (converted) with animation
- REQ-006.3: Share button with referral link (copy to clipboard)
- REQ-006.4: Progress counter: "3 of 5 stars — 2 more for your free year!"
- REQ-006.5: At 4 stars: nudge "One more and your year is free!"
- REQ-006.6: All text in EN/ES/NL

## REQ-007: Admin View
**Priority:** Medium
- REQ-007.1: Champion leaderboard (top referrers by active star count)
- REQ-007.2: Credits applied tracking
- REQ-007.3: Referral conversion funnel (link clicks → trials → paid → all 5)

## REQ-008: CLARA Training Data
**Priority:** Medium
- REQ-008.1: Q&A rows for referral programme
- REQ-008.2: CLARA mentions referral programme when subscriber asks about discounts
- REQ-008.3: CLARA congratulates on gold star events

---

## Acceptance Criteria
- [ ] Subscriber has unique referral link in dashboard
- [ ] 5-star tracker shows silver/gold state correctly
- [ ] Referred user's first payment turns star gold
- [ ] All 5 gold simultaneously → 12-month Stripe credit applied
- [ ] Referred user cancels → star reverts to silver, credit paused
- [ ] No stacking — one programme per account
- [ ] Admin sees leaderboard + conversion funnel
- [ ] CLARA knows about referral programme
- [ ] Existing subscribers/family/gifts unaffected

---
*Last updated: 2026-03-15*
