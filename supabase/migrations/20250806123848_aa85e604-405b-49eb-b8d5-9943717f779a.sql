-- Create regional_services table for storing regional coverage plans
CREATE TABLE public.regional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  region TEXT NOT NULL,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.regional_services ENABLE ROW LEVEL SECURITY;

-- Admin can manage regional services
CREATE POLICY "Admin can manage regional services" ON public.regional_services
  FOR ALL
  USING (true);

-- Public can view active regional services
CREATE POLICY "Public can view active regional services" ON public.regional_services
  FOR SELECT
  USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_regional_services_updated_at
  BEFORE UPDATE ON public.regional_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample regional service
INSERT INTO public.regional_services (name, description, price, currency, region, features, is_popular, is_active, sort_order)
VALUES (
  'Call Centre Spain',
  'Specialized emergency response for Spain with local language support and 24/7 availability',
  9.99,
  'EUR',
  'Spain',
  ARRAY['24/7 Spanish Call Center', 'Local Emergency Response', 'Spanish Language Support', 'Emergency Dispatch Coordination'],
  true,
  true,
  1
);