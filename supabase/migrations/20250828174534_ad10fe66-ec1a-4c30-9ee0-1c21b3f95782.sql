-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscribers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_memberships;

-- Set replica identity for real-time updates
ALTER TABLE public.subscribers REPLICA IDENTITY FULL;
ALTER TABLE public.family_invites REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.family_memberships REPLICA IDENTITY FULL;