import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Tag,
  User,
  Share2,
  BookOpen,
  Star,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import ImageFallback from '@/components/admin/ImageFallback';
import { sanitizeHTML } from '@/utils/sanitize';
import { useBlogPost, useRelatedPosts, type BlogPostRow } from '@/hooks/useBlogPosts';

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { post: blogPost, isLoading, notFound } = useBlogPost(slug);
  const relatedPosts = useRelatedPosts(blogPost?.id, blogPost?.keywords);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = blogPost?.seo_title || blogPost?.title || t('blog.blogPost', 'Blog Post');

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: t('blog.successTitle', 'Success'),
        description: t('blog.linkCopied', 'Link copied to clipboard'),
      });
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = blogPost?.seo_title || blogPost?.title || '';

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
          title={t('blog.postNotFoundTitle', 'Article Not Found')}
          description={t('blog.postNotFoundDesc', 'The article you are looking for could not be found.')}
        />
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="py-20">
              <BookOpen className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
              <h1 className="text-2xl font-bold mb-4">
                {t('blog.postNotFoundTitle', 'Article Not Found')}
              </h1>
              <p className="text-muted-foreground mb-8">
                {t('blog.postNotFoundMessage', 'This article may have been removed or the link may be incorrect.')}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/blog')} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('blog.backToBlog', 'Back to Blog')}
                </Button>
                <Button onClick={() => navigate('/')}>
                  {t('blog.goHome', 'Go Home')}
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
        title={blogPost.seo_title || blogPost.title}
        description={blogPost.meta_description || blogPost.excerpt || ''}
        keywords={blogPost.keywords || ['blog', 'safety', 'emergency response']}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: blogPost.seo_title || blogPost.title,
          description: blogPost.meta_description,
          datePublished: blogPost.published_at || blogPost.created_at,
          dateModified: blogPost.updated_at,
          author: { '@type': 'Organization', name: 'Riven AI' },
          publisher: { '@type': 'Organization', name: 'LifeLink Sync' },
        }}
      />

      <Navigation />

      <div className="bg-white dark:bg-background">
        {/* Article Header */}
        <header className="bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-900 dark:via-background dark:to-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-6 py-16">
            <div className="max-w-5xl mx-auto">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-10">
                <button
                  onClick={() => navigate('/blog')}
                  className="hover:text-primary transition-colors flex items-center gap-2 font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('blog.backToArticles', 'Back to Articles')}
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-foreground font-medium">
                  {t('blog.emergencySafety', 'Emergency Safety')}
                </span>
              </nav>

              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <Badge className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 text-sm tracking-wide shadow-lg">
                  EMERGENCY SAFETY
                </Badge>
                {blogPost.reading_time && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white dark:bg-slate-800 px-4 py-2 rounded-full border shadow-sm">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">
                      {t('blog.minRead', { count: blogPost.reading_time, defaultValue: '{{count}} min read' })}
                    </span>
                  </div>
                )}
                {blogPost.view_count != null && blogPost.view_count > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white dark:bg-slate-800 px-4 py-2 rounded-full border shadow-sm">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">
                      {t('blog.views', { count: blogPost.view_count, defaultValue: '{{count}} views' })}
                    </span>
                  </div>
                )}
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8 text-slate-900 dark:text-slate-100 tracking-tight max-w-4xl">
                {blogPost.seo_title || blogPost.title}
              </h1>

              {/* Subheadline */}
              {blogPost.meta_description && (
                <p className="text-xl md:text-2xl leading-relaxed text-slate-600 dark:text-slate-400 mb-10 font-light max-w-3xl">
                  {blogPost.meta_description}
                </p>
              )}

              {/* Byline */}
              <div className="flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-base">
                        {t('blog.rivenAI', 'Riven AI')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('blog.emergencySafetySpecialist', 'Emergency Safety Specialist')}
                      </div>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-300 dark:bg-slate-600"></div>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">
                        {formatDate(blogPost.published_at || blogPost.created_at)}
                      </span>
                    </div>
                    <div className="text-xs opacity-75">LifeLink Sync</div>
                  </div>
                </div>

                {/* Social Share Buttons */}
                <div className="flex items-center gap-2">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Share on X"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Share on LinkedIn"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Share on Facebook"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleShare}
                    className="ml-2 bg-white dark:bg-background border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('blog.shareArticle', 'Share')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {blogPost.featured_image && (
          <section className="py-12 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-background">
            <div className="container mx-auto px-6">
              <div className="max-w-5xl mx-auto">
                <figure className="relative">
                  <ImageFallback
                    src={blogPost.featured_image}
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
        )}

        {/* Article Content */}
        <article className="py-20 bg-white dark:bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div
                className="prose prose-xl max-w-none prose-slate dark:prose-invert space-y-6
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
                  [&>*]:mb-8 [&>h1]:mb-10 [&>h2]:mb-8 [&>h3]:mb-6 [&>p]:mb-8 [&>ul]:mb-8 [&>ol]:mb-8"
              >
                {blogPost.content ? (
                  <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(blogPost.content) }} />
                ) : (
                  <div className="text-center py-20">
                    <BookOpen className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
                    <p className="text-muted-foreground italic text-xl">
                      {t('blog.contentBeingPrepared', 'Content is being prepared...')}
                    </p>
                  </div>
                )}
              </div>

              {/* Article Tags */}
              {blogPost.keywords && blogPost.keywords.length > 0 && (
                <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-slate-100">
                    {t('blog.relatedTopics', 'Related Topics')}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {blogPost.keywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer font-medium"
                        onClick={() => navigate(`/blog?tag=${encodeURIComponent(keyword)}`)}
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
                        <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-slate-100">
                          {t('blog.aiGeneratedContentTitle', 'AI-Generated Content')}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                          {t(
                            'blog.aiGeneratedContentDesc',
                            'This article was generated by Riven AI, our intelligent content engine trained on emergency safety best practices. All content is reviewed for accuracy.'
                          )}
                        </p>
                        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            <strong>{t('blog.reviewedBy', 'Reviewed by:')}</strong>{' '}
                            {t('blog.editorialTeam', 'LifeLink Sync Editorial Team')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="mt-16">
                  <h3 className="text-2xl font-bold mb-8 text-slate-900 dark:text-slate-100">
                    {t('blog.relatedArticles', 'Related Articles')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {relatedPosts.map((rp) => (
                      <Card
                        key={rp.id}
                        className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md overflow-hidden"
                        onClick={() => navigate(`/blog/${rp.slug}`)}
                      >
                        {rp.featured_image ? (
                          <div className="h-36 overflow-hidden">
                            <img
                              src={rp.featured_image}
                              alt={rp.featured_image_alt || rp.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
                        )}
                        <CardContent className="p-5">
                          <h4 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors mb-2">
                            {rp.seo_title || rp.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {rp.excerpt || rp.meta_description || ''}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {rp.reading_time && (
                              <>
                                <Clock className="h-3 w-3" />
                                <span>{rp.reading_time}m</span>
                              </>
                            )}
                            {rp.view_count != null && rp.view_count > 0 && (
                              <>
                                <Eye className="h-3 w-3 ml-2" />
                                <span>{rp.view_count.toLocaleString()}</span>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

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
                    {t('blog.browseAllArticles', 'Browse All Articles')}
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleShare}
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('blog.shareArticle', 'Share')}
                  </Button>
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

export default BlogPostPage;
