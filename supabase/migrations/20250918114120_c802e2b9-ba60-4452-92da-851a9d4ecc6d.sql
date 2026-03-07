-- Clear existing test blog content to start fresh
DELETE FROM marketing_content WHERE platform = 'blog';

-- Also clear related campaign data if any
DELETE FROM marketing_campaigns WHERE id IN (
  SELECT DISTINCT campaign_id 
  FROM workflow_stages 
  WHERE campaign_id NOT IN (SELECT campaign_id FROM marketing_content WHERE campaign_id IS NOT NULL)
);

-- Clean up orphaned workflow stages
DELETE FROM workflow_stages WHERE campaign_id NOT IN (
  SELECT id FROM marketing_campaigns
);