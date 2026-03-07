-- Clean up stale draft content
DELETE FROM marketing_content 
WHERE status = 'draft' 
AND title IN ('Instagram blog_post', 'Facebook blog_post');