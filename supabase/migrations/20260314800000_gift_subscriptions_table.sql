-- Gift Subscriptions Table
-- Stores all gift purchases, redemptions, and delivery tracking

CREATE TABLE IF NOT EXISTS public.gift_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchaser_user_id UUID REFERENCES auth.users(id),
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_user_id UUID REFERENCES auth.users(id),
  gift_type TEXT NOT NULL CHECK (
    gift_type IN ('monthly','annual','bundle','voucher')
  ),
  amount_paid NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  personal_message TEXT,
  delivery_date DATE,
  delivered_at TIMESTAMPTZ,
  redeem_code TEXT UNIQUE NOT NULL,
  redeemed_at TIMESTAMPTZ,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
    status IN (
      'pending_payment','paid','delivered',
      'redeemed','expired','refunded'
    )
  ),
  expires_at TIMESTAMPTZ NOT NULL,
  pendant_shipped BOOLEAN DEFAULT false,
  delivery_address JSONB,
  selected_addons JSONB,
  gdpr_consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gift_redeem_code
  ON public.gift_subscriptions(redeem_code);
CREATE INDEX idx_gift_recipient_email
  ON public.gift_subscriptions(recipient_email);
CREATE INDEX idx_gift_purchaser
  ON public.gift_subscriptions(purchaser_user_id);
CREATE INDEX idx_gift_status
  ON public.gift_subscriptions(status);

ALTER TABLE public.gift_subscriptions
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchaser_read"
  ON public.gift_subscriptions FOR SELECT
  USING (purchaser_user_id = auth.uid());

CREATE POLICY "recipient_read"
  ON public.gift_subscriptions FOR SELECT
  USING (recipient_user_id = auth.uid());

CREATE POLICY "service_role_all"
  ON public.gift_subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_read"
  ON public.gift_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER set_gift_updated_at
  BEFORE UPDATE ON public.gift_subscriptions
  FOR EACH ROW EXECUTE FUNCTION
  public.update_updated_at_column();

-- Add gift prices to pricing_config
INSERT INTO public.pricing_config
  (key, value, currency, label, description)
VALUES
  ('gift_monthly', '9.99', 'EUR',
   'Monthly Gift', '1 month gift subscription'),
  ('gift_annual', '99.90', 'EUR',
   'Annual Gift', '12 months gift subscription'),
  ('gift_bundle', '149.00', 'EUR',
   'Gift Bundle', '12 months + SOS Pendant'),
  ('gift_voucher', '99.90', 'EUR',
   'Gift Voucher', 'Redeemable gift voucher')
ON CONFLICT (key) DO NOTHING;
