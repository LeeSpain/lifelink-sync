-- Member add-ons: tracks which add-ons each subscriber has activated
CREATE TABLE IF NOT EXISTS public.member_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.addon_catalog(id) ON DELETE RESTRICT,
  stripe_subscription_item_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  quantity INTEGER NOT NULL DEFAULT 1,
  free_units INTEGER NOT NULL DEFAULT 0,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  canceled_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, addon_id)
);

ALTER TABLE public.member_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addons"
  ON public.member_addons FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own addons"
  ON public.member_addons FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage all addons"
  ON public.member_addons FOR ALL USING (is_admin());

CREATE INDEX idx_member_addons_user_id ON public.member_addons (user_id);
CREATE INDEX idx_member_addons_status ON public.member_addons (status);

CREATE TRIGGER update_member_addons_updated_at
  BEFORE UPDATE ON public.member_addons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
