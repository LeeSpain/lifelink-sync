# Phase 1: Database + Referral Code Generation — Context

**Gathered:** 2026-03-15
**Requirements:** REQ-001, REQ-008

## Research Findings

### D1: No referral tables exist (CONFIRMED)
No `referrals`, `referral_rewards`, or `referral_code` column anywhere in the schema.

### D2: profiles table has no referral columns (CONFIRMED)
Need to add: `referral_code` (unique, auto-generated), `referred_by` (UUID, nullable)

### D3: Stripe webhook already supports arbitrary metadata (GOOD)
Can easily add `referral_code` to checkout session metadata — webhook already parses `metadata.*`

### D4: No /join route exists (CONFIRMED)
Need to create — but that's Phase 2 (frontend). Phase 1 is DB only.

### D5: Auto-generate referral codes (LOCKED)
Format: 8-char alphanumeric, uppercase. Example: `CLARA7XK`
Generated via trigger on profile insert, or via migration for existing users.

### D6: Star positions (LOCKED)
Stars 1-5. Each referral gets the next available position.
Status: pending (signed up) → active (first payment) → cancelled (referred user cancels)

### D7: Reward rules (LOCKED)
- All 5 stars must be `active` simultaneously
- Reward = 12-month Stripe subscription credit
- If any star reverts to `cancelled`, reward is paused
- One programme per account — no stacking
