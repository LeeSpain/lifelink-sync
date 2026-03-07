import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye,
  Edit,
  Share2,
  Calendar,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Globe,
  Mail
} from 'lucide-react';

interface ContentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: any;
  onEdit?: () => void;
  onPublish?: () => void;
  onSchedule?: () => void;
}

const getPlatformIcon = (platform: string) => {
  const p = platform?.toLowerCase();
  switch (p) {
    case 'facebook': return <Facebook className="w-4 h-4" />;
    case 'twitter': case 'x': return <Twitter className="w-4 h-4" />;
    case 'linkedin': return <Linkedin className="w-4 h-4" />;
    case 'instagram': return <Instagram className="w-4 h-4" />;
    case 'blog': return <Globe className="w-4 h-4" />;
    case 'email': return <Mail className="w-4 h-4" />;
    default: return <Share2 className="w-4 h-4" />;
  }
};

const ContentPreviewModal: React.FC<ContentPreviewModalProps> = ({
  isOpen,
  onClose,
  content,
  onEdit,
  onPublish,
  onSchedule
}) => {
  if (!content) return null;

  const renderSocialPreview = () => (
    <div className="border rounded-lg p-4 bg-muted/50">
      <div className="flex items-center space-x-2 mb-3">
        {getPlatformIcon(content.platform)}
        <span className="font-medium">Your Company</span>
        <Badge variant="outline" className="text-xs">{content.platform}</Badge>
      </div>
      
      <div className="space-y-3">
        <h3 className="font-medium">{content.title}</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {content.body_text}
        </p>
        
        {content.image_url && (
          <div className="rounded-lg overflow-hidden border">
            <img 
              src={content.image_url} 
              alt={content.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}
        
        {content.hashtags && content.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.hashtags.map((tag: string, index: number) => (
              <span key={index} className="text-xs text-blue-600">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBlogPreview = () => (
    <div className="border rounded-lg p-6 bg-muted/50">
      <article className="prose prose-sm max-w-none">
        <header className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{content.seo_title || content.title}</h1>
          <p className="text-muted-foreground">{content.meta_description}</p>
          
          {content.featured_image && (
            <div className="mt-4 rounded-lg overflow-hidden">
              <img 
                src={content.featured_image} 
                alt={content.featured_image_alt || content.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}
        </header>
        
        <div className="whitespace-pre-wrap">
          {content.body_text}
        </div>
        
        {content.keywords && content.keywords.length > 0 && (
          <footer className="mt-6 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium">Tags:</span>
              {content.keywords.map((keyword: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </footer>
        )}
      </article>
    </div>
  );

  const renderEmailPreview = () => (
    <div className="border rounded-lg bg-muted/50">
      <div className="bg-primary text-primary-foreground p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{content.title}</h3>
          <Badge variant="secondary">Email</Badge>
        </div>
      </div>
      
      <div className="p-6">
        <div className="whitespace-pre-wrap text-sm">
          {content.body_text}
        </div>
        
        {content.image_url && (
          <div className="mt-4 rounded-lg overflow-hidden">
            <img 
              src={content.image_url} 
              alt={content.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderPreview = () => {
    const platform = content.platform?.toLowerCase();
    
    if (platform === 'blog') {
      return renderBlogPreview();
    } else if (platform === 'email') {
      return renderEmailPreview();
    } else {
      return renderSocialPreview();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Content Preview</span>
            <Badge variant="outline">{content.platform}</Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* Content Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Status:</span>
                <Badge variant="outline" className="ml-2">{content.status}</Badge>
              </div>
              <div>
                <span className="font-medium">Created:</span>
                <span className="ml-2">{new Date(content.created_at).toLocaleDateString()}</span>
              </div>
              {content.scheduled_time && (
                <div>
                  <span className="font-medium">Scheduled:</span>
                  <span className="ml-2">{new Date(content.scheduled_time).toLocaleString()}</span>
                </div>
              )}
              {content.posted_at && (
                <div>
                  <span className="font-medium">Published:</span>
                  <span className="ml-2">{new Date(content.posted_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Platform-specific Preview */}
            <div>
              <h3 className="font-medium mb-3">Platform Preview</h3>
              {renderPreview()}
            </div>

            {/* SEO Information (for blog posts) */}
            {content.platform?.toLowerCase() === 'blog' && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-3">SEO Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">SEO Title:</span>
                      <span className="ml-2">{content.seo_title || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Meta Description:</span>
                      <span className="ml-2">{content.meta_description || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Reading Time:</span>
                      <span className="ml-2">{content.reading_time || 0} minutes</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Content Sections (if available) */}
            {content.content_sections && Object.keys(content.content_sections).length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-3">Content Structure</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(content.content_sections).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                        <span className="ml-2">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          <div className="flex space-x-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {onSchedule && (
              <Button variant="outline" onClick={onSchedule}>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            )}
            {onPublish && (
              <Button onClick={onPublish}>
                <Share2 className="w-4 h-4 mr-2" />
                Publish Now
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentPreviewModal;