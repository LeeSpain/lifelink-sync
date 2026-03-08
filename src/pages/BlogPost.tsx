import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Calendar,
  ArrowLeft,
  Tag,
  User,
  Share2,
  BookOpen,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import ImageFallback from '@/components/admin/ImageFallback';
import { sanitizeHTML } from '@/utils/sanitize';

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
  status: string;
  image_url?: string | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();


  useEffect(() => {
    if (slug) {
      loadBlogPost();
    }
  }, [slug]);

  const loadBlogPost = async () => {
    try {
      // First attempt: direct match on slug or fuzzy match on title (hyphens -> spaces)
      const titlePattern = slug?.replace(/-/g, ' ');
      const { data: posts, error } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('platform', 'blog')
        .eq('status', 'published')
        .or(`slug.eq.${slug},title.ilike.%${titlePattern}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      let post = posts && posts.length > 0
        ? posts.find((p: any) => p.slug === slug) || posts[0]
        : null;

      // Fallback: no direct DB slug and the title match failed due to punctuation
      if (!post) {
        const { data: allPosts, error: allErr } = await supabase
          .from('marketing_content')
          .select('*')
          .eq('platform', 'blog')
          .eq('status', 'published');
        if (allErr) throw allErr;

        // Normalize titles the same way we build URLs in Blog.tsx
        post = (allPosts || []).find((p: any) => {
          const derived = (p.title || '')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          return derived === slug;
        }) || null;
      }

      if (!post) {
        setNotFound(true);
        return;
      }

      const mapped: BlogPost = {
        id: post.id,
        title: post.title,
        body_text: post.body_text,
        slug: post.slug || (post.title ? post.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : ''),
        seo_title: post.seo_title,
        meta_description: post.meta_description,
        keywords: post.keywords,
        featured_image_alt: post.featured_image_alt,
        reading_time: post.reading_time,
        seo_score: post.seo_score,
        created_at: post.created_at,
        updated_at: post.updated_at,
        status: post.status,
        image_url: post.image_url
      };

      setBlogPost(mapped);
      setNotFound(false);
    } catch (error) {
      console.error('Error loading blog post:', error);
      toast({
        title: t('blog.errorTitle'),
        description: t('blog.loadPostError'),
        variant: "destructive"
      });
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = blogPost?.seo_title || blogPost?.title || t('blog.blogPost');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL to clipboard
      await navigator.clipboard.writeText(url);
      toast({
        title: t('blog.successTitle'),
        description: t('blog.linkCopied'),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !blogPost) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title={t('blog.postNotFoundTitle')}
          description={t('blog.postNotFoundDesc')}
        />
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="py-20">
              <BookOpen className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
              <h1 className="text-2xl font-bold mb-4">{t('blog.postNotFoundTitle')}</h1>
              <p className="text-muted-foreground mb-8">
                {t('blog.postNotFoundMessage')}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/blog')} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('blog.backToBlog')}
                </Button>
                <Button onClick={() => navigate('/')}>
                  {t('blog.goHome')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={blogPost.seo_title || blogPost.title || t('blog.blogPost')}
        description={blogPost.meta_description || t('blog.defaultMetaDescription')}
        keywords={blogPost.keywords || ['blog', 'safety', 'emergency response']}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": blogPost.seo_title || blogPost.title,
          "description": blogPost.meta_description,
          "datePublished": blogPost.created_at,
          "dateModified": blogPost.updated_at,
          "author": {
            "@type": "Organization",
            "name": "Riven AI"
          },
          "publisher": {
            "@type": "Organization",
            "name": "LifeLink Sync"
          }
        }}
      />
      
      <Navigation />
      
      {/* Professional Article Layout */}
      <div className="bg-white dark:bg-background">
        {/* Article Header Section */}
        <header className="bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-900 dark:via-background dark:to-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-6 py-16">
            <div className="max-w-5xl mx-auto">
              {/* Navigation Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-10">
                <button 
                  onClick={() => navigate('/blog')}
                  className="hover:text-primary transition-colors flex items-center gap-2 font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('blog.backToArticles')}
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-foreground font-medium">{t('blog.emergencySafety')}</span>
              </nav>

              {/* Article Category & Metadata */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <Badge className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 text-sm tracking-wide shadow-lg">
                  🚨 EMERGENCY SAFETY
                </Badge>
                {blogPost.reading_time && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white dark:bg-slate-800 px-4 py-2 rounded-full border shadow-sm">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{t('blog.minRead', { count: blogPost.reading_time })}</span>
                  </div>
                )}
                {blogPost.seo_score && blogPost.seo_score >= 80 && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 px-4 py-2 shadow-sm">
                    <Star className="h-4 w-4 mr-2" />
                    {t('blog.seoOptimized')}
                  </Badge>
                )}
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8 text-slate-900 dark:text-slate-100 tracking-tight max-w-4xl">
                {blogPost.seo_title || blogPost.title || t('blog.untitledArticle')}
              </h1>

              {/* Subheadline */}
              {blogPost.meta_description && (
                <p className="text-xl md:text-2xl leading-relaxed text-slate-600 dark:text-slate-400 mb-10 font-light max-w-3xl">
                  {blogPost.meta_description}
                </p>
              )}

              {/* Byline & Publication Info */}
              <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-base">{t('blog.rivenAI')}</div>
                      <div className="text-sm text-muted-foreground">{t('blog.emergencySafetySpecialist')}</div>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{formatDate(blogPost.created_at)}</span>
                    </div>
                    <div className="text-xs opacity-75">LifeLink Sync</div>
                  </div>
                </div>
                <Button variant="outline" size="default" onClick={handleShare} className="bg-white dark:bg-background border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('blog.shareArticle')}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Image Section */}
        <section className="py-12 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-background">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <figure className="relative">
                <ImageFallback
                  src={blogPost.image_url}
                  alt={blogPost.featured_image_alt}
                  title={blogPost.title}
                  className="w-full h-auto rounded-2xl shadow-2xl"
                  fallbackType="placeholder"
                />
                {blogPost.featured_image_alt && (
                  <figcaption className="text-center text-sm text-muted-foreground mt-6 italic font-medium">
                    {blogPost.featured_image_alt}
                  </figcaption>
                )}
              </figure>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <article className="py-20 bg-white dark:bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              {/* Article Body */}
              <div className="prose prose-xl max-w-none prose-slate dark:prose-invert space-y-6
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-headings:mb-8 prose-headings:mt-12
                prose-h1:text-4xl prose-h1:mb-10 prose-h1:mt-16 prose-h1:leading-tight
                prose-h2:text-3xl prose-h2:mb-8 prose-h2:mt-14 prose-h2:leading-tight prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-slate-700 prose-h2:pb-4
                prose-h3:text-2xl prose-h3:mb-6 prose-h3:mt-10 prose-h3:leading-tight
                prose-h4:text-xl prose-h4:mb-5 prose-h4:mt-8 prose-h4:leading-tight
                prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:text-lg prose-p:mb-8 prose-p:mt-0
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-bold
                prose-blockquote:border-l-4 prose-blockquote:border-l-primary prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-900/50 prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:not-italic prose-blockquote:text-slate-700 dark:prose-blockquote:text-slate-300 prose-blockquote:my-10 prose-blockquote:rounded-r-lg prose-blockquote:shadow-sm
                prose-img:rounded-xl prose-img:shadow-xl prose-img:my-12 prose-img:w-full prose-img:h-auto
                prose-figure:my-12 prose-figcaption:text-center prose-figcaption:text-base prose-figcaption:text-muted-foreground prose-figcaption:mt-4 prose-figcaption:italic prose-figcaption:font-medium
                prose-li:text-lg prose-li:leading-relaxed prose-li:mb-3 prose-li:pl-2
                prose-ul:my-8 prose-ul:space-y-3 prose-ol:my-8 prose-ol:space-y-3
                prose-ul:list-disc prose-ol:list-decimal
                prose-code:text-sm prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-mono
                [&>*]:mb-8 [&>h1]:mb-10 [&>h2]:mb-8 [&>h3]:mb-6 [&>p]:mb-8 [&>ul]:mb-8 [&>ol]:mb-8">
                {blogPost.body_text ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(blogPost.body_text) }}
                  />
                ) : (
                  <div className="text-center py-20">
                    <BookOpen className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
                    <p className="text-muted-foreground italic text-xl">{t('blog.contentBeingPrepared')}</p>
                  </div>
                )}
              </div>

              {/* Article Tags */}
              {blogPost.keywords && blogPost.keywords.length > 0 && (
                <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-slate-100">{t('blog.relatedTopics')}</h3>
                  <div className="flex flex-wrap gap-3">
                    {blogPost.keywords.map((keyword, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer font-medium"
                      >
                        <Tag className="h-4 w-4 mr-2" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </footer>
              )}

              {/* AI Attribution */}
              <div className="mt-16">
                <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 border border-blue-200 dark:border-blue-800 shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-slate-100">{t('blog.aiGeneratedContentTitle')}</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                          {t('blog.aiGeneratedContentDesc')}
                        </p>
                        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            <strong>{t('blog.reviewedBy')}</strong> {t('blog.editorialTeam')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Article Navigation */}
              <nav className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/blog')}
                    size="lg"
                    className="w-full sm:w-auto bg-white dark:bg-background hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('blog.browseAllArticles')}
                  </Button>
                  <div className="flex gap-3">
                    <Button 
                      variant="default" 
                      onClick={handleShare}
                      size="lg"
                      className="bg-primary hover:bg-primary/90 shadow-lg"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {t('blog.shareArticle')}
                    </Button>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </article>
      </div>
      
      <Footer />
    </div>
  );
};

export default BlogPost;