-- Add useful columns to products if missing
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS units_sold INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update pendant with correct branding
UPDATE public.products
SET
  name = 'LifeLink Sync SOS Pendant',
  price = 49.99,
  currency = 'EUR',
  short_description = 'Waterproof Bluetooth pendant. 6-month battery. One-press SOS.',
  is_featured = true,
  warranty_months = 24,
  low_stock_threshold = 5
WHERE name ILIKE '%pendant%' OR sku ILIKE '%pendant%';
