-- Update RLS policy on products to allow viewing 'coming_soon' items publicly
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

CREATE POLICY "Public can view active and coming soon products"
ON public.products
FOR SELECT
USING (status IN ('active', 'coming_soon'));
