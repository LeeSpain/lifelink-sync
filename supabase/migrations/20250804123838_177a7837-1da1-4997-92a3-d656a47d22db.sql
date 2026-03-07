-- Create subscription_plans table to manage global protection plans
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_interval TEXT NOT NULL DEFAULT 'month', -- month, year
  stripe_price_id TEXT UNIQUE,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription plans management
CREATE POLICY "Admin can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (true);

CREATE POLICY "Public can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price, currency, billing_interval, features, is_active, is_popular, sort_order) VALUES
('Basic Protection', 'Essential emergency services for individuals', 9.99, 'USD', 'month', 
 '["24/7 Emergency Response", "GPS Location Tracking", "1 Emergency Contact", "Basic Mobile App"]'::jsonb, 
 true, false, 1),

('Family Protection', 'Comprehensive protection for families', 19.99, 'USD', 'month', 
 '["24/7 Emergency Response", "GPS Location Tracking", "Up to 5 Emergency Contacts", "Family Mobile App", "Family Dashboard", "Multiple Device Support"]'::jsonb, 
 true, true, 2),

('Premium Protection', 'Advanced protection with AI monitoring', 29.99, 'USD', 'month', 
 '["24/7 Emergency Response", "GPS Location Tracking", "Unlimited Emergency Contacts", "AI Health Monitoring", "Fall Detection", "Premium Mobile App", "Family Dashboard", "Priority Support", "Medical Alert Integration"]'::jsonb, 
 true, false, 3),

('Annual Basic', 'Essential protection - Annual billing', 99.99, 'USD', 'year', 
 '["24/7 Emergency Response", "GPS Location Tracking", "1 Emergency Contact", "Basic Mobile App", "2 Months Free"]'::jsonb, 
 true, false, 4),

('Annual Family', 'Family protection - Annual billing', 199.99, 'USD', 'year', 
 '["24/7 Emergency Response", "GPS Location Tracking", "Up to 5 Emergency Contacts", "Family Mobile App", "Family Dashboard", "Multiple Device Support", "2 Months Free"]'::jsonb, 
 true, false, 5),

('Annual Premium', 'Premium protection - Annual billing', 299.99, 'USD', 'year', 
 '["24/7 Emergency Response", "GPS Location Tracking", "Unlimited Emergency Contacts", "AI Health Monitoring", "Fall Detection", "Premium Mobile App", "Family Dashboard", "Priority Support", "Medical Alert Integration", "2 Months Free"]'::jsonb, 
 true, false, 6);