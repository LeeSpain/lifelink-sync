
-- 1) Add profile-based call routing fields
alter table public.profiles
  add column if not exists has_spain_call_center boolean not null default false,
  add column if not exists call_center_number text default '+34XXXXXXXXX',
  add column if not exists emergency_numbers text[] not null default '{}'::text[];

-- 2) Flic buttons (owned by user)
create table if not exists public.devices_flic_buttons (
  id uuid primary key default gen_random_uuid(),
  owner_user uuid not null,
  flic_uuid text not null,
  name text,
  last_voltage numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_flic_owner unique (owner_user, flic_uuid)
);

-- Optional FK: we avoid referencing auth.users directly in RLS logic, but enforce UUID field presence.
-- Indexes
create index if not exists idx_flic_buttons_owner on public.devices_flic_buttons(owner_user);
create index if not exists idx_flic_buttons_flic_uuid on public.devices_flic_buttons(flic_uuid);

-- Trigger to maintain updated_at
drop trigger if exists trg_flic_buttons_updated_at on public.devices_flic_buttons;
create trigger trg_flic_buttons_updated_at
before update on public.devices_flic_buttons
for each row execute procedure public.update_updated_at_column();

-- Enable RLS and policies
alter table public.devices_flic_buttons enable row level security;

-- Admin can manage all
drop policy if exists "Admin can manage flic buttons" on public.devices_flic_buttons;
create policy "Admin can manage flic buttons"
on public.devices_flic_buttons
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());

-- Owners can manage their own buttons
drop policy if exists "Owners can manage their flic buttons" on public.devices_flic_buttons;
create policy "Owners can manage their flic buttons"
on public.devices_flic_buttons
as permissive
for all
to authenticated
using (owner_user = auth.uid())
with check (owner_user = auth.uid());

-- 3) Flic events (per button)
create table if not exists public.devices_flic_events (
  id uuid primary key default gen_random_uuid(),
  button_id uuid not null references public.devices_flic_buttons(id) on delete cascade,
  event text not null check (event in ('single','double','hold','down','up')),
  ts timestamptz not null default now()
);

create index if not exists idx_flic_events_button on public.devices_flic_events(button_id);
create index if not exists idx_flic_events_ts on public.devices_flic_events(ts);

alter table public.devices_flic_events enable row level security;

-- Admin can manage all events
drop policy if exists "Admin can manage flic events" on public.devices_flic_events;
create policy "Admin can manage flic events"
on public.devices_flic_events
as permissive
for all
to authenticated
using (is_admin())
with check (is_admin());

-- Owners can view their events (via button ownership)
drop policy if exists "Owners can view their flic events" on public.devices_flic_events;
create policy "Owners can view their flic events"
on public.devices_flic_events
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.devices_flic_buttons b
    where b.id = devices_flic_events.button_id
      and b.owner_user = auth.uid()
  )
);

-- Owners can insert events for their own button
drop policy if exists "Owners can insert their flic events" on public.devices_flic_events;
create policy "Owners can insert their flic events"
on public.devices_flic_events
as permissive
for insert
to authenticated
with check (
  exists (
    select 1
    from public.devices_flic_buttons b
    where b.id = button_id
      and b.owner_user = auth.uid()
  )
);

-- Note: Service role (edge function) bypasses RLS; it can upsert buttons and insert events from webhooks safely.
