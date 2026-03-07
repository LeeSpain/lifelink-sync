-- Create trigger to anonymize IP addresses on video analytics inserts
CREATE OR REPLACE FUNCTION public.anonymize_video_analytics_ip()
RETURNS TRIGGER AS $$
BEGIN
  -- Anonymize IP address for privacy protection
  NEW.ip_address = NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically anonymize IPs on insert
CREATE TRIGGER anonymize_video_analytics_ip_trigger
  BEFORE INSERT ON public.video_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.anonymize_video_analytics_ip();