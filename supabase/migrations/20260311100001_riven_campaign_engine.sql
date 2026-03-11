-- Riven Campaign Engine: extend tables for wizard-based campaign system

-- Extend marketing_campaigns with campaign scheduling fields
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 30;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS weekly_themes jsonb DEFAULT '[]'::jsonb;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS platform_schedules jsonb DEFAULT '{}'::jsonb;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS goal text;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS tone text;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS start_date timestamptz;

-- Extend marketing_content with scheduling and tracking fields
ALTER TABLE marketing_content ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE marketing_content ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE marketing_content ADD COLUMN IF NOT EXISTS platform_post_id varchar(255);
ALTER TABLE marketing_content ADD COLUMN IF NOT EXISTS post_url varchar(500);
ALTER TABLE marketing_content ADD COLUMN IF NOT EXISTS content_angle varchar(100);
ALTER TABLE marketing_content ADD COLUMN IF NOT EXISTS hook_style varchar(100);
ALTER TABLE marketing_content ADD COLUMN IF NOT EXISTS cta_type varchar(100);
ALTER TABLE marketing_content ADD COLUMN IF NOT EXISTS week_number integer;
ALTER TABLE marketing_content ADD COLUMN IF NOT EXISTS day_number integer;

-- Track used content angle combinations per campaign for uniqueness
CREATE TABLE IF NOT EXISTS riven_content_angles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  platform text NOT NULL,
  content_angle text NOT NULL,
  hook_style text NOT NULL,
  cta_type text NOT NULL,
  day_number integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, platform, day_number)
);

ALTER TABLE riven_content_angles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to riven_content_angles"
  ON riven_content_angles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Campaign calendar view
CREATE OR REPLACE VIEW campaign_calendar AS
SELECT
  mc.id,
  mc.campaign_id,
  mc.platform,
  mc.title,
  mc.body_text,
  mc.scheduled_at,
  mc.published_at,
  mc.status,
  mc.content_angle,
  mc.hook_style,
  mc.cta_type,
  mc.week_number,
  mc.day_number,
  mc.post_url,
  mc.platform_post_id,
  mkc.title AS campaign_title,
  mkc.platform_schedules,
  mkc.weekly_themes,
  mkc.goal,
  mkc.tone,
  mkc.duration_days,
  mkc.start_date
FROM marketing_content mc
JOIN marketing_campaigns mkc ON mc.campaign_id = mkc.id
ORDER BY mc.scheduled_at ASC;

-- Index for fast scheduled content lookup
CREATE INDEX IF NOT EXISTS idx_marketing_content_scheduled
  ON marketing_content (scheduled_at, status)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_marketing_content_campaign_platform
  ON marketing_content (campaign_id, platform);
