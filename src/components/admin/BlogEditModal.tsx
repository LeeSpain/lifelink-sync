import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Save, 
  X, 
  Eye, 
  Star, 
  Clock, 
  Tag, 
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface BlogEditModalProps {
  content: {
    id: string;
    title?: string;
    body_text?: string;
    seo_title?: string;
    meta_description?: string;
    keywords?: string[];
    image_url?: string;
    featured_image_alt?: string;
    content_sections?: any;
    reading_time?: number;
    seo_score?: number;
    status: string;
    platform: string;
    content_type: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedContent: any) => void;
}

const BlogEditModal: React.FC<BlogEditModalProps> = ({
  content,
  isOpen,
  onClose,
  onSave
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editedContent, setEditedContent] = useState({
    title: '',
    seo_title: '',
    meta_description: '',
    body_text: '',
    keywords: [] as string[],
    image_url: '',
    featured_image_alt: ''
  });
  const [keywordInput, setKeywordInput] = useState('');

  // Initialize form when content changes
  useEffect(() => {
    if (content) {
      setEditedContent({
        title: content.title || '',
        seo_title: content.seo_title || content.title || '',
        meta_description: content.meta_description || '',
        body_text: content.body_text || '',
        keywords: content.keywords || [],
        image_url: content.image_url || '',
        featured_image_alt: content.featured_image_alt || ''
      });
      setKeywordInput(content.keywords?.join(', ') || '');
    }
  }, [content]);

  const handleSave = async () => {
    if (!content) return;

    setIsSaving(true);
    try {
      // Parse keywords from comma-separated string
      const keywords = keywordInput
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const updatedData = {
        ...editedContent,
        keywords,
        updated_at: new Date().toISOString()
      };

      // Update in Supabase
      const { error } = await supabase
        .from('marketing_content')
        .update(updatedData)
        .eq('id', content.id);

      if (error) throw error;

      // Call parent callback with updated content
      onSave({
        ...content,
        ...updatedData
      });

      toast({
        title: "Content Updated",
        description: "Your changes have been saved successfully.",
      });

      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateSEOScore = () => {
    let score = 0;
    const factors = [
      { check: editedContent.title.length >= 30 && editedContent.title.length <= 60, points: 20 },
      { check: editedContent.meta_description.length >= 120 && editedContent.meta_description.length <= 160, points: 20 },
      { check: editedContent.keywords.length >= 3, points: 15 },
      { check: editedContent.body_text.length >= 300, points: 15 },
      { check: editedContent.seo_title.length > 0, points: 10 },
      { check: editedContent.image_url.length > 0, points: 10 },
      { check: editedContent.featured_image_alt.length > 0, points: 10 }
    ];

    factors.forEach(factor => {
      if (factor.check) score += factor.points;
    });

    return score;
  };

  const seoScore = calculateSEOScore();

  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              Edit Content
              <Badge variant="outline">{content.status}</Badge>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">SEO: {seoScore}%</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className={`grid ${showPreview ? 'grid-cols-2' : 'grid-cols-1'} gap-6 h-full`}>
            {/* Edit Form */}
            <div className="space-y-6 overflow-y-auto pr-2">
              {/* Basic Information */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Blog Title</Label>
                    <Input
                      id="title"
                      value={editedContent.title}
                      onChange={(e) => setEditedContent(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter blog title..."
                      className="text-base"
                    />
                    <div className="text-xs text-muted-foreground">
                      {editedContent.title.length}/60 characters (recommended: 30-60)
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo-title">SEO Title</Label>
                    <Input
                      id="seo-title"
                      value={editedContent.seo_title}
                      onChange={(e) => setEditedContent(prev => ({ ...prev, seo_title: e.target.value }))}
                      placeholder="Enter SEO-optimized title..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta-description">Meta Description</Label>
                    <Textarea
                      id="meta-description"
                      value={editedContent.meta_description}
                      onChange={(e) => setEditedContent(prev => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="Enter meta description..."
                      className="min-h-[80px]"
                    />
                    <div className="text-xs text-muted-foreground">
                      {editedContent.meta_description.length}/160 characters (recommended: 120-160)
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Content</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="body-text">Blog Content</Label>
                    <Textarea
                      id="body-text"
                      value={editedContent.body_text}
                      onChange={(e) => setEditedContent(prev => ({ ...prev, body_text: e.target.value }))}
                      placeholder="Enter your blog content here..."
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <div className="text-xs text-muted-foreground">
                      {editedContent.body_text.length} characters • ~{Math.ceil(editedContent.body_text.length / 5)} words
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SEO & Media */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">SEO & Media</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                    <Input
                      id="keywords"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="emergency preparedness, family safety, LifeLink Sync..."
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {keywordInput.split(',').filter(k => k.trim()).map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {keyword.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image-url">Featured Image URL</Label>
                    <Input
                      id="image-url"
                      value={editedContent.image_url}
                      onChange={(e) => setEditedContent(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image-alt">Image Alt Text</Label>
                    <Input
                      id="image-alt"
                      value={editedContent.featured_image_alt}
                      onChange={(e) => setEditedContent(prev => ({ ...prev, featured_image_alt: e.target.value }))}
                      placeholder="Describe the image for accessibility..."
                    />
                  </div>

                  {editedContent.image_url && (
                    <div className="space-y-2">
                      <Label>Image Preview</Label>
                      <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
                        <img
                          src={editedContent.image_url}
                          alt={editedContent.featured_image_alt || 'Preview'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SEO Analysis */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">SEO Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall SEO Score</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${seoScore >= 80 ? 'bg-green-500' : seoScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        <span className="font-medium">{seoScore}%</span>
                      </div>
                    </div>
                    
                    {[
                      { label: 'Title Length', check: editedContent.title.length >= 30 && editedContent.title.length <= 60 },
                      { label: 'Meta Description', check: editedContent.meta_description.length >= 120 && editedContent.meta_description.length <= 160 },
                      { label: 'Keywords Count', check: keywordInput.split(',').filter(k => k.trim()).length >= 3 },
                      { label: 'Content Length', check: editedContent.body_text.length >= 300 },
                      { label: 'Featured Image', check: editedContent.image_url.length > 0 },
                      { label: 'Image Alt Text', check: editedContent.featured_image_alt.length > 0 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        {item.check ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className="border-l pl-6 overflow-y-auto">
                <div className="sticky top-0 bg-background pb-4 mb-4 border-b">
                  <h3 className="font-semibold">Live Preview</h3>
                  <p className="text-sm text-muted-foreground">See how your content will appear</p>
                </div>
                
                <article className="space-y-6">
                  {editedContent.image_url && (
                    <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={editedContent.image_url}
                        alt={editedContent.featured_image_alt || editedContent.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div>
                    <h1 className="text-2xl font-bold mb-2 leading-tight">
                      {editedContent.seo_title || editedContent.title || 'Untitled Post'}
                    </h1>
                    
                    {editedContent.meta_description && (
                      <p className="text-muted-foreground mb-4">
                        {editedContent.meta_description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{Math.ceil(editedContent.body_text.length / 250)} min read</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        <span>SEO {seoScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    {editedContent.body_text ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: editedContent.body_text }}
                        className="leading-relaxed"
                      />
                    ) : (
                      <p className="text-muted-foreground italic">Start typing to see preview...</p>
                    )}
                  </div>

                  {keywordInput && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Keywords</h4>
                      <div className="flex flex-wrap gap-1">
                        {keywordInput.split(',').filter(k => k.trim()).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <div className="text-sm text-muted-foreground">
            {seoScore >= 80 ? 'Excellent SEO optimization!' : seoScore >= 60 ? 'Good SEO, consider improvements' : 'SEO needs improvement'}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogEditModal;