-- Create product categories table
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  description TEXT,
  features TEXT[],
  images JSONB DEFAULT '[]'::jsonb,
  category_id UUID REFERENCES public.product_categories(id),
  sku TEXT UNIQUE,
  inventory_count INTEGER DEFAULT 0,
  weight DECIMAL(8,2), -- in grams
  dimensions JSONB, -- {length, width, height}
  compatibility TEXT[], -- which service plans it works with
  status TEXT DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service product compatibility table
CREATE TABLE public.service_product_compatibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  compatibility_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_product_compatibility ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can manage product categories" ON public.product_categories FOR ALL USING (true);
CREATE POLICY "Admin can manage products" ON public.products FOR ALL USING (true);
CREATE POLICY "Admin can manage service compatibility" ON public.service_product_compatibility FOR ALL USING (true);

-- Public read access for active products
CREATE POLICY "Public can view active product categories" ON public.product_categories FOR SELECT USING (status = 'active');
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Public can view product compatibility" ON public.service_product_compatibility FOR SELECT USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial category
INSERT INTO public.product_categories (name, description, icon_name, sort_order) 
VALUES ('Wearable Safety Devices', 'Personal safety devices that can be worn daily', 'Watch', 1);

-- Insert the Bluetooth pendant product
INSERT INTO public.products (
  name, 
  price, 
  description, 
  features, 
  category_id, 
  sku, 
  inventory_count,
  weight,
  dimensions,
  compatibility,
  sort_order
) VALUES (
  'ICE SOS Emergency Pendant',
  49.99,
  'Waterproof Bluetooth emergency pendant with one-touch SOS activation. Connects to your phone and the ICE SOS Lite app for instant emergency alerts.',
  ARRAY[
    'Bluetooth Low Energy (BLE) connectivity',
    'One-button emergency activation', 
    'LED status indicators',
    'Vibration feedback for confirmation',
    '7-day battery life with charging dock',
    'IP67 waterproof rating',
    'Range up to 100 meters',
    'Works with all subscription plans',
    'Discreet wearable design',
    'Quick emergency activation without phone access'
  ],
  (SELECT id FROM public.product_categories WHERE name = 'Wearable Safety Devices'),
  'ICE-PENDANT-001',
  50,
  25.0,
  '{"length": 40, "width": 30, "height": 12}'::jsonb,
  ARRAY['Basic Plan', 'Premium Plan', 'Enterprise Plan'],
  1
);