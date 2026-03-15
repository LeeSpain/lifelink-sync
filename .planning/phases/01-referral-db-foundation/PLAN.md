# Phase 1: Database + Referral Code Generation — Execution Plan

**Requirements:** REQ-001, REQ-008
**Status:** Ready to execute

---

## Task 1: Migration — referrals + referral_rewards tables

**File:** `supabase/migrations/20260315100000_referral_programme.sql`

### SQL:
```sql
-- ============================================================
-- Commercial Build 4: 5-Star Referral Programme
-- Core tables, referral code generation, CLARA training
-- ============================================================

-- 1. Add referral columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- 2. Create referrals table (the 5 stars)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_email TEXT,
  star_position INTEGER NOT NULL CHECK (star_position BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'cancelled')),
  converted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, star_position),
  UNIQUE (referred_user_id)
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_user_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
ON public.referrals FOR SELECT
USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Service role full access to referrals"
ON public.referrals FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 3. Create referral_rewards table
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL DEFAULT '12_months_free',
  stripe_credit_id TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'paused', 'expired', 'cancelled')),
  paused_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_rewards_user ON public.referral_rewards(user_id);
CREATE INDEX idx_referral_rewards_status ON public.referral_rewards(status);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
ON public.referral_rewards FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role full access to referral_rewards"
ON public.referral_rewards FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 4. Auto-generate referral codes for existing profiles
-- Format: CLARA + 4 random alphanumeric chars
UPDATE public.profiles
SET referral_code = 'CLARA' || UPPER(SUBSTRING(md5(random()::text || user_id::text) FROM 1 FOR 4))
WHERE referral_code IS NULL AND user_id IS NOT NULL;

-- 5. Trigger to auto-generate referral code on new profile
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'CLARA' || UPPER(SUBSTRING(md5(random()::text || NEW.user_id::text) FROM 1 FOR 4));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_referral_code ON public.profiles;
CREATE TRIGGER set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- 6. Function to get next available star position
CREATE OR REPLACE FUNCTION public.get_next_star_position(p_referrer_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  SELECT MIN(pos) INTO v_next
  FROM generate_series(1, 5) AS pos
  WHERE pos NOT IN (
    SELECT star_position FROM referrals
    WHERE referrer_id = p_referrer_id
    AND status != 'cancelled'
  );
  RETURN v_next; -- NULL if all 5 slots taken
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_star_position TO service_role;

-- 7. CLARA training data
INSERT INTO public.training_data (question, answer, category, status, audience, tags, confidence_score) VALUES
('Do you have a referral programme?',
 'Yes! Every LifeLink Sync subscriber gets a unique referral link. When 5 people you refer become paying members — all 5 active at the same time — you earn 12 months of CLARA completely free. You can track your progress with our 5-star tracker in your dashboard. Each star turns gold when a referral starts paying.',
 'referral', 'active', 'customer', '{"referral","programme","discount"}', 1.0),
('How do I refer someone to LifeLink Sync?',
 'Easy! Go to your dashboard and find your unique referral link in the Referral section. Share it with friends and family. When they sign up through your link and start paying, one of your 5 stars turns gold. Get all 5 gold and your next year is free.',
 'referral', 'active', 'customer', '{"referral","share","link"}', 1.0),
('What do I get for referring people?',
 'When 5 people you refer are all active paying members simultaneously, you get 12 months of CLARA free. Your dashboard shows 5 stars that turn from silver to gold as your referrals convert. If someone you referred cancels, their star goes back to silver — but they can always re-subscribe to light it up again.',
 'referral', 'active', 'customer', '{"referral","reward","free"}', 1.0),
('Is there a discount or coupon code?',
 'We do not offer coupon codes, but we have something better — our 5-Star Referral Programme. Share your unique link with 5 people. When all 5 are paying members, you get a full year of CLARA free. That is worth over 119 EUR. Check your dashboard for your personal referral link.',
 'referral', 'active', 'customer', '{"discount","coupon","referral"}', 1.0)
ON CONFLICT DO NOTHING;
```

### Acceptance Criteria
- [ ] `referrals` table exists with star_position 1-5, status enum
- [ ] `referral_rewards` table exists
- [ ] `profiles.referral_code` exists and auto-populated for existing users
- [ ] New profiles auto-generate referral code via trigger
- [ ] `get_next_star_position()` function works
- [ ] RLS: users see own referrals, service_role manages all
- [ ] 4 CLARA training rows for referral programme

---

## Task 2: Push migration

```bash
npx supabase db push --include-all
```

---

## Task 3: Verify

```sql
-- Check referral code was generated
SELECT referral_code FROM profiles LIMIT 5;

-- Check tables exist
SELECT COUNT(*) FROM referrals;
SELECT COUNT(*) FROM referral_rewards;

-- Check function
SELECT get_next_star_position('00000000-0000-0000-0000-000000000000');
-- Expected: 1 (first available position)

-- Check training data
SELECT question FROM training_data WHERE category = 'referral' AND status = 'active';
-- Expected: 4 rows
```

---

## Task 4: Commit

```bash
git add -A
git commit -m "feat: 5-star referral programme — DB schema, code generation, CLARA training"
git push origin main
```

---

## Summary

| Task | What | Est. Time |
|------|------|-----------|
| 1 | Migration: tables, columns, trigger, function, training data | 15 min |
| 2 | Push migration | 2 min |
| 3 | Verify | 5 min |
| 4 | Commit | 2 min |

**Total: ~25 minutes**

---
*Created: 2026-03-15*
