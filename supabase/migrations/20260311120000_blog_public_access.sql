-- Allow anonymous (public) read access to published blog posts
CREATE POLICY "Public can read published blog posts"
  ON blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Function to increment view count (callable without auth)
CREATE OR REPLACE FUNCTION increment_blog_view_count(post_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE slug = post_slug AND status = 'published';
END;
$$;
