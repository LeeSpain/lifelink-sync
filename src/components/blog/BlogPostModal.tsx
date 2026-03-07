import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Calendar, 
  X, 
  BookOpen,
  Eye,
  Star,
  Share2,
  Download
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string | null;
  body_text: string | null;
  slug: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  keywords?: string[] | null;
  featured_image_alt?: string | null;
  reading_time?: number | null;
  seo_score?: number | null;
  created_at: string;
  updated_at: string;
  posted_at: string | null;
  status: string;
  image_url?: string | null;
  content_type: string;
  platform: string;
}

interface BlogPostModalProps {
  post: BlogPost;
  isOpen: boolean;
  onClose: () => void;
}

export const BlogPostModal: React.FC<BlogPostModalProps> = ({ post, isOpen, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatContent = (htmlContent: string | null) => {
    if (!htmlContent) return '';
    
    // If content contains HTML, render it properly
    if (htmlContent.includes('<html>') || htmlContent.includes('<!DOCTYPE')) {
      // Extract body content from full HTML
      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        return bodyMatch[1];
      }
    }
    
    return htmlContent;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.seo_title || post.title || 'Blog Post',
          text: post.meta_description || 'Check out this article',
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-8 py-6 border-b bg-gradient-to-r from-background to-secondary/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white">
                  {post.platform}
                </Badge>
                {post.reading_time && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    <Clock className="h-4 w-4" />
                    {post.reading_time} min read
                  </div>
                )}
                {post.seo_score && post.seo_score >= 80 && (
                  <Badge className="bg-green-500/10 text-green-700 border-green-200">
                    <Star className="h-3 w-3 mr-1" />
                    SEO Optimized
                  </Badge>
                )}
              </div>
              
              <DialogTitle className="text-2xl md:text-3xl font-bold leading-tight text-foreground mb-3">
                {post.seo_title || post.title || 'Untitled Post'}
              </DialogTitle>
              
              {post.meta_description && (
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  {post.meta_description}
                </p>
              )}
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.posted_at || post.created_at)}
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Article
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="hover:bg-secondary/20"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:bg-secondary/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Keywords */}
        {post.keywords && post.keywords.length > 0 && (
          <div className="px-8 py-4 border-b bg-muted/30">
            <div className="flex flex-wrap gap-2">
              {post.keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-background/80">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <ScrollArea className="flex-1 px-8">
          <div className="py-8">
            <div 
              className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-a:text-primary hover:prose-a:text-primary/80"
              dangerouslySetInnerHTML={{ 
                __html: formatContent(post.body_text) 
              }}
            />
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-8 py-6 border-t bg-gradient-to-r from-background to-secondary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">AI-Generated Content</p>
                <p className="text-xs text-muted-foreground">
                  Powered by Riven Marketing System
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Article
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};