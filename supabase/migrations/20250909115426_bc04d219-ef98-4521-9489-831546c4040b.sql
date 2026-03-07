-- Create live location tracking tables for family members
CREATE TABLE public.live_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_group_id UUID,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  battery_level INTEGER,
  status TEXT NOT NULL DEFAULT 'online',
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for live locations
CREATE POLICY "Users can manage their own location" 
ON public.live_locations 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family members can view each others locations" 
ON public.live_locations 
FOR SELECT 
USING (
  family_group_id IN (
    SELECT fm.group_id 
    FROM family_memberships fm 
    WHERE fm.user_id = auth.uid() 
    AND fm.status = 'active'
  )
  OR 
  family_group_id IN (
    SELECT fg.id 
    FROM family_groups fg 
    WHERE fg.owner_user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_live_locations_user_id ON public.live_locations(user_id);
CREATE INDEX idx_live_locations_family_group_id ON public.live_locations(family_group_id);
CREATE INDEX idx_live_locations_last_seen ON public.live_locations(last_seen);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_live_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_seen = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_live_locations_timestamp
BEFORE UPDATE ON public.live_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_live_location_timestamp();

-- Enable realtime for live location updates
ALTER TABLE public.live_locations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_locations;