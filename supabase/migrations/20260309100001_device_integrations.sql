-- Device Integration Tables
-- Smart speaker account links, BLE pendant persistence, heart rate thresholds

-- Smart speaker account links (Alexa, Google Home)
CREATE TABLE IF NOT EXISTS device_smart_speaker_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('alexa', 'google_home')),
  external_user_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  linked_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'unlinked', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Persistent BLE pendant records
CREATE TABLE IF NOT EXISTS device_ble_pendants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_name text,
  device_id text,
  last_heart_rate int,
  last_battery_pct int,
  last_seen_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Heart rate alert thresholds
CREATE TABLE IF NOT EXISTS device_ble_alert_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  high_hr_threshold int DEFAULT 120,
  low_hr_threshold int DEFAULT 50,
  alert_enabled boolean DEFAULT true,
  last_alert_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE device_smart_speaker_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_ble_pendants ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_ble_alert_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own speaker links"
  ON device_smart_speaker_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own speaker links"
  ON device_smart_speaker_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own speaker links"
  ON device_smart_speaker_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own speaker links"
  ON device_smart_speaker_links FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own ble pendants"
  ON device_ble_pendants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ble pendants"
  ON device_ble_pendants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ble pendants"
  ON device_ble_pendants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ble pendants"
  ON device_ble_pendants FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own alert thresholds"
  ON device_ble_alert_thresholds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert thresholds"
  ON device_ble_alert_thresholds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert thresholds"
  ON device_ble_alert_thresholds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alert thresholds"
  ON device_ble_alert_thresholds FOR DELETE
  USING (auth.uid() = user_id);

-- Service role policies for server-to-server (Alexa/Google webhooks update links)
CREATE POLICY "Service role can manage speaker links"
  ON device_smart_speaker_links FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage ble pendants"
  ON device_ble_pendants FOR ALL
  USING (auth.role() = 'service_role');
