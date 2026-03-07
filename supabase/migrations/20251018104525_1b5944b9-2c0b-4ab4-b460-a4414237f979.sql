-- Create subscription_history table for tracking all subscription changes
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier text,
  action text NOT NULL CHECK (action IN ('created', 'upgraded', 'downgraded', 'extended', 'cancelled', 'refunded', 'activated')),
  previous_tier text,
  previous_end_date timestamp with time zone,
  new_end_date timestamp with time zone,
  changed_by uuid REFERENCES auth.users(id),
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Admin can view all subscription history
CREATE POLICY "admin_view_subscription_history" 
ON public.subscription_history 
FOR SELECT 
TO authenticated
USING (is_admin());

-- System can insert subscription history
CREATE POLICY "system_insert_subscription_history" 
ON public.subscription_history 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX idx_subscription_history_created_at ON public.subscription_history(created_at DESC);