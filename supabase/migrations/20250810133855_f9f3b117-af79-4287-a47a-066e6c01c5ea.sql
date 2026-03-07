
-- Add optional link for coming soon products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS coming_soon_url text;
