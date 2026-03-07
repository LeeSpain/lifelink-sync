import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Calendar, 
  Tag, 
  User, 
  Star,
  ExternalLink,
  Edit
} from 'lucide-react';
import ImageFallback from './ImageFallback';

interface BlogPreviewModalProps {
  content: {
    id: string;
    platform: string;
    content_type: string;
    title?: string;
    body_text?: string;
    status: string;
    created_at: string;
    seo_title?: string;
    meta_description?: string;
    keywords?: string[];
    reading_time?: number;
    seo_score?: number;
    slug?: string;
    image_url?: string;
    featured_image_alt?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (contentId: string) => void;
  onPublish?: (contentId: string) => void;
}

const BlogPreviewModal: React.FC<BlogPreviewModalProps> = ({
  content,
  isOpen,
  onClose,
  onEdit,
  onPublish
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const sanitizeHtmlContent = (html: string) => {
    // Remove code fences and extract clean HTML
    let cleanHtml = html
      .replace(/```html\s*\n?/gi, '') // Remove opening code fence
      .replace(/```\s*$/gi, '') // Remove closing code fence
      .replace(/^<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, '') // Remove DOCTYPE and head
      .replace(/<\/body>[\s\S]*?<\/html>\s*$/i, '') // Remove closing body and html
      .trim();
    
    return cleanHtml;
  };

  const handleViewLive = () => {
    if (content.slug && content.status === 'published') {
      window.open(`/blog/${content.slug}`, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Blog Post Preview
            <Badge variant="outline">{content.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata Section */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">SEO Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">SEO Title:</span>
                    <p className="text-muted-foreground">{content.seo_title || content.title || 'No title'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Meta Description:</span>
                    <p className="text-muted-foreground">{content.meta_description || 'No description'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Slug:</span>
                    <p className="text-muted-foreground">
                      {content.slug || (content.title ? content.title.toLowerCase().replace(/\s+/g, '-') : 'no-slug')}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Performance</h4>
                <div className="space-y-2 text-sm">
                  {content.seo_score && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>SEO Score: {content.seo_score}%</span>
                    </div>
                  )}
                  {content.reading_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Reading Time: {content.reading_time} min</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {formatDate(content.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Keywords */}
            {content.keywords && content.keywords.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {content.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Blog Preview */}
          <div className="border rounded-lg overflow-hidden">
            {/* Featured Image */}
            <div className="relative h-64 bg-muted">
              <ImageFallback
                src={content.image_url}
                alt={content.featured_image_alt}
                title={content.title}
                className="w-full h-full object-cover"
                fallbackType="gradient"
              />
            </div>
            
            {/* Blog Header */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-4 mb-4">
                <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white">
                  Blog Article
                </Badge>
                {content.seo_score && content.seo_score >= 80 && (
                  <Badge className="bg-green-500/10 text-green-700 border-green-200">
                    <Star className="h-3 w-3 mr-1" />
                    SEO Optimized
                  </Badge>
                )}
                {content.reading_time && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    <Clock className="h-4 w-4" />
                    {content.reading_time} min read
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-4 leading-tight">
                {content.seo_title || content.title || 'Untitled Post'}
              </h1>

              {content.meta_description && (
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {content.meta_description}
                </p>
              )}

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Riven AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(content.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Blog Content */}
            <div className="p-6">
              <div className="prose prose-lg max-w-none">
                {content.body_text ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(content.body_text) }}
                    className="text-foreground leading-relaxed"
                  />
                ) : (
                  <p className="text-muted-foreground italic">No content available for this post.</p>
                )}
              </div>
            </div>

            {/* AI Attribution */}
            <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-t">
              <div className="text-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-sm font-semibold mb-1">AI-Generated Content</h3>
                <p className="text-xs text-muted-foreground">
                  Created by Riven AI for emergency response and safety education
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" onClick={() => onEdit(content.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {content.status === 'published' && content.slug && (
                <Button variant="outline" onClick={handleViewLive}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Live
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {onPublish && (content.status === 'draft' || content.status === 'pending_review') && (
                <Button onClick={() => onPublish(content.id)} className="bg-green-600 hover:bg-green-700 text-white">
                  Publish Live
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogPreviewModal;