-- Add location sharing choice to connections table
-- Each party independently controls whether they share their own location
-- share_my_location: the inviter's choice (set at invite time)
-- contact_share_location: the invitee's choice (set at accept time)

ALTER TABLE connections
ADD COLUMN IF NOT EXISTS share_my_location BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS contact_share_location BOOLEAN DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN connections.share_my_location IS 'Whether the connection owner (inviter) consents to share their location with this contact';
COMMENT ON COLUMN connections.contact_share_location IS 'Whether the invited contact consents to share their location with the owner';
