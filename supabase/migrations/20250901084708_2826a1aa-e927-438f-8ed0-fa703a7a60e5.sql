-- Migration: Live Map, Circles, Places, and 30-day retention
-- Date: 2025-09-01

-- Enable required extensions (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- 1) Raw location pings (retained 30 days by cron)
CREATE TABLE IF NOT EXISTS public.location_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy double precision,
  speed double precision,
  battery smallint,
  captured_at timestamptz NOT NULL DEFAULT now(),
  source text DEFAULT 'mobile'
);

ALTER TABLE public.location_pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pings_owner" ON public.location_pings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_location_pings_user_time ON public.location_pings(user_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_pings_geo ON public.location_pings USING gist (ll_to_earth(lat, lng));

-- 2) Live presence (last known point per user) for fast map queries
CREATE TABLE IF NOT EXISTS public.live_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lat double precision,
  lng double precision,
  last_seen timestamptz,
  battery smallint,
  is_paused boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.live_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presence_visible_in_circle" ON public.live_presence
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.family_memberships fm1
      JOIN public.family_memberships fm2
        ON fm1.group_id = fm2.group_id
      WHERE fm1.user_id = auth.uid()
        AND fm2.user_id = live_presence.user_id
        AND fm1.status = 'active'
        AND fm2.status = 'active'
    )
  );

CREATE POLICY "users_can_update_own_presence" ON public.live_presence
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3) Places (geofences) owned by a family group
CREATE TABLE IF NOT EXISTS public.places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id uuid NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  radius_m integer NOT NULL DEFAULT 150,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "places_visible_to_group" ON public.places
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_memberships fm
      WHERE fm.user_id = auth.uid()
      AND fm.group_id = places.family_group_id
      AND fm.status = 'active'
    )
  );

CREATE POLICY "places_edit_by_group" ON public.places
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.family_memberships fm
      WHERE fm.user_id = auth.uid()
      AND fm.group_id = places.family_group_id
      AND fm.status = 'active'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_memberships fm
      WHERE fm.user_id = auth.uid()
      AND fm.group_id = places.family_group_id
      AND fm.status = 'active'
    )
  );

-- 4) Place events (enter/exit)
CREATE TABLE IF NOT EXISTS public.place_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  event text NOT NULL CHECK (event IN ('enter','exit')),
  occurred_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.place_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "place_events_view_in_circle" ON public.place_events
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.family_memberships fm1
    JOIN public.family_memberships fm2
      ON fm1.group_id = fm2.group_id
    JOIN public.places p ON p.id = place_events.place_id
    WHERE fm1.user_id = auth.uid()
      AND fm2.user_id = place_events.user_id
      AND fm1.group_id = p.family_group_id
      AND fm1.status = 'active'
      AND fm2.status = 'active'
  )
);

CREATE INDEX IF NOT EXISTS idx_place_events_user_time ON public.place_events(user_id, occurred_at DESC);

-- 5) Billing status per membership (connection state)
ALTER TABLE public.family_memberships
  ADD COLUMN IF NOT EXISTS billing_status text DEFAULT 'active'; -- 'active' | 'grace' | 'past_due' | 'paused'

-- Enable Realtime
ALTER publication supabase_realtime ADD TABLE public.live_presence;
ALTER publication supabase_realtime ADD TABLE public.place_events;
ALTER publication supabase_realtime ADD TABLE public.location_pings;