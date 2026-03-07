-- Clean up draft marketing content and campaigns
DELETE FROM marketing_content WHERE id IN ('344867f5-2e4a-4a79-af27-d4ab7c311125', '2f75512f-1878-4094-bc64-0c5a6a1ca44f');
DELETE FROM marketing_campaigns WHERE id = 'c7f772bb-6302-4253-89a6-5453a79f5ecc';