import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Globe, 
  CheckCircle, 
  ExternalLink,
  Clock,
  Eye,
  Share2
} from 'lucide-react';

interface ContentItem {
  id: string;
  title?: string;
  body_text?: string;
  status: string;
  platform: string;
  slug?: string;
  created_at: string;
}

interface BlogPublisherProps {
  content: ContentItem;
  onSuccess?: () => void;
}

export const BlogPublisher: React.FC<BlogPublisherProps> = ({ content, onSuccess }) => {
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const handlePublishToBlog = async () => {
    if (content.status !== 'approved') {
      toast({
        title: "Cannot Publish",
        description: "Content must be approved before publishing to blog",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);
    try {
      const { data, error } = await supabase.functions.invoke('blog-publisher', {
        body: {
          action: 'publish_blog',
          contentId: content.id
        }
      });

      if (error) throw error;

      toast({
        title: "Blog Published",
        description: "Content has been published to the blog successfully",
      });

      if (data?.url) {
        setPublishedUrl(data.url);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error publishing to blog:', error);
      toast({
        title: "Publishing Failed",
        description: "Failed to publish content to blog",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const generateSlug = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('blog-publisher', {
        body: {
          action: 'generate_slug',
          title: content.title
        }
      });

      if (error) throw error;

      toast({
        title: "Slug Generated",
        description: `Generated slug: ${data.slug}`,
      });
    } catch (error) {
      console.error('Error generating slug:', error);
    }
  };

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-green-600" />
          Blog Publishing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">{content.title || 'Untitled'}</h4>
            <p className="text-sm text-muted-foreground">
              Ready for blog publication
            </p>
          </div>
          <Badge variant={content.status === 'approved' ? 'default' : 'secondary'}>
            {content.status}
          </Badge>
        </div>

        {content.slug && (
          <div className="p-3 bg-muted/50 rounded border">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-mono">/blog/{content.slug}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handlePublishToBlog}
            disabled={isPublishing || content.status !== 'approved'}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPublishing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Publish to Blog
              </>
            )}
          </Button>

          {!content.slug && (
            <Button variant="outline" onClick={generateSlug}>
              Generate Slug
            </Button>
          )}

          {publishedUrl && (
            <Button variant="outline" asChild>
              <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Post
              </a>
            </Button>
          )}
        </div>

        {publishedUrl && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Successfully published!</span>
            </div>
            <a 
              href={publishedUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:underline flex items-center gap-1 mt-1"
            >
              <ExternalLink className="h-3 w-3" />
              {publishedUrl}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};