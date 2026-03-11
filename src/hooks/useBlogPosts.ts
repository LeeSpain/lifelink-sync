import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  featured_image_alt: string | null;
  seo_title: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  reading_time: number | null;
  view_count: number | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  content_id: string | null;
}

const PAGE_SIZE = 9;

interface UseBlogPostsOptions {
  searchTerm?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
}

export function useBlogPosts(options: UseBlogPostsOptions = {}) {
  const { searchTerm = '', tag = '', page = 1, pageSize = PAGE_SIZE } = options;
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query
      let query = supabase
        .from('blog_posts')
        .select('*', { count: 'exact' })
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      // Tag filter
      if (tag) {
        query = query.contains('keywords', [tag]);
      }

      // Search filter
      if (searchTerm.trim()) {
        query = query.or(
          `title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`
        );
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setPosts((data as BlogPostRow[]) || []);
      setTotalCount(count ?? 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, tag, page, pageSize]);

  // Load all unique tags once
  useEffect(() => {
    const loadTags = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('keywords')
        .eq('status', 'published')
        .not('keywords', 'is', null);

      if (data) {
        const tagSet = new Set<string>();
        data.forEach((row: { keywords: string[] | null }) => {
          row.keywords?.forEach((k) => tagSet.add(k));
        });
        setAllTags(Array.from(tagSet).sort());
      }
    };
    loadTags();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return { posts, totalCount, totalPages, allTags, isLoading, error, refetch: loadPosts };
}

/** Fetch a single blog post by slug */
export function useBlogPost(slug: string | undefined) {
  const [post, setPost] = useState<BlogPostRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setNotFound(true);
          return;
        }

        setPost(data as BlogPostRow);
        setNotFound(false);

        // Increment view count (fire-and-forget)
        supabase.rpc('increment_blog_view_count', { post_slug: slug }).then();
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [slug]);

  return { post, isLoading, notFound };
}

/** Fetch related posts by shared keywords */
export function useRelatedPosts(currentId: string | undefined, keywords: string[] | null | undefined, limit = 3) {
  const [related, setRelated] = useState<BlogPostRow[]>([]);

  useEffect(() => {
    if (!currentId || !keywords?.length) return;

    const load = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .neq('id', currentId)
        .overlaps('keywords', keywords)
        .order('published_at', { ascending: false })
        .limit(limit);

      setRelated((data as BlogPostRow[]) || []);
    };

    load();
  }, [currentId, keywords, limit]);

  return related;
}
