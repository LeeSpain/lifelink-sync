-- Create customer_regional_services table for service assignments
CREATE TABLE IF NOT EXISTS public.customer_regional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.regional_services(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  price_override NUMERIC(10,2),
  auto_renew BOOLEAN DEFAULT true,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deactivated_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, service_id)
);

-- Create order_notes table for internal order notes
CREATE TABLE IF NOT EXISTS public.order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_internal BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_regional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_regional_services
CREATE POLICY "Admins can manage all customer services"
  ON public.customer_regional_services
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Customers can view their own services"
  ON public.customer_regional_services
  FOR SELECT
  USING (auth.uid() = customer_id);

-- RLS Policies for order_notes
CREATE POLICY "Admins can manage all order notes"
  ON public.order_notes
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create indexes for performance
CREATE INDEX idx_customer_regional_services_customer_id ON public.customer_regional_services(customer_id);
CREATE INDEX idx_customer_regional_services_service_id ON public.customer_regional_services(service_id);
CREATE INDEX idx_customer_regional_services_status ON public.customer_regional_services(status);
CREATE INDEX idx_order_notes_order_id ON public.order_notes(order_id);

-- Add updated_at trigger for customer_regional_services
CREATE TRIGGER update_customer_regional_services_updated_at
  BEFORE UPDATE ON public.customer_regional_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();