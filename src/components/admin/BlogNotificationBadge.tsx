import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const BlogNotificationBadge = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadPendingCount();
    
    // Set up real-time subscription for new blog posts
    const subscription = supabase
      .channel('blog_notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketing_content',
        filter: 'platform=eq.Blog'
      }, () => {
        loadPendingCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadPendingCount = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_content')
        .select('id')
        .eq('platform', 'Blog')
        .in('status', ['pending_review', 'draft']);

      if (error) throw error;
      setPendingCount(data?.length || 0);
    } catch (error) {
      console.error('Error loading pending blog count:', error);
    }
  };

  if (pendingCount === 0) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 gap-2"
      onClick={() => navigate('/admin-dashboard/blog-management')}
    >
      <BookOpen className="h-4 w-4" />
      <span className="font-medium">{pendingCount} Blog{pendingCount !== 1 ? 's' : ''} Pending</span>
      <Badge className="bg-orange-500 text-white text-xs px-1.5 py-0.5">
        {pendingCount}
      </Badge>
      <ArrowRight className="h-3 w-3" />
    </Button>
  );
};