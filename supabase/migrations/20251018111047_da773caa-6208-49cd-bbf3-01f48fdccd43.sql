-- Create customer notes table
CREATE TABLE public.customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  created_by UUID NOT NULL,
  note_text TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage customer notes"
ON public.customer_notes
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create customer tags table
CREATE TABLE public.customer_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage tags"
ON public.customer_tags
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create customer tag assignments table
CREATE TABLE public.customer_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES public.customer_tags(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id, tag_id)
);

ALTER TABLE public.customer_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage tag assignments"
ON public.customer_tag_assignments
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create indexes for performance
CREATE INDEX idx_customer_notes_customer ON public.customer_notes(customer_id);
CREATE INDEX idx_customer_tag_assignments_customer ON public.customer_tag_assignments(customer_id);
CREATE INDEX idx_customer_tag_assignments_tag ON public.customer_tag_assignments(tag_id);

-- Create trigger for updated_at
CREATE TRIGGER update_customer_notes_updated_at
BEFORE UPDATE ON public.customer_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();