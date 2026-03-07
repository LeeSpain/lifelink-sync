-- Create orders table to track product purchases
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create registration_selections table to track user choices during registration
CREATE TABLE public.registration_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  subscription_plans JSONB DEFAULT '[]'::jsonb,
  selected_products JSONB DEFAULT '[]'::jsonb,
  selected_regional_services JSONB DEFAULT '[]'::jsonb,
  total_subscription_amount NUMERIC DEFAULT 0,
  total_product_amount NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  registration_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_selections ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage orders" 
ON public.orders 
FOR ALL 
USING (true);

-- Create policies for registration_selections table
CREATE POLICY "Users can view their own registration selections" 
ON public.registration_selections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own registration selections" 
ON public.registration_selections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registration selections" 
ON public.registration_selections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage registration selections" 
ON public.registration_selections 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registration_selections_updated_at
BEFORE UPDATE ON public.registration_selections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();