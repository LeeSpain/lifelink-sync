import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Clock,
  Search,
  Calendar,
  ArrowRight,
  BookOpen,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { PageSEO } from '@/components/PageSEO';
import SEOBreadcrumbs from '@/components/SEOBreadcrumbs';
import { useBlogPosts, type BlogPostRow } from '@/hooks/useBlogPosts';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { posts, totalCount, totalPages, allTags, isLoading } = useBlogPosts({
    searchTerm,
    tag: activeTag,
    page,
  });

  const featuredPost = page === 1 && !searchTerm && !activeTag ? posts[0] : null;
  const gridPosts = featuredPost ? posts.slice(1) : posts;

  const handleTagClick = (tag: string) => {
    setActiveTag(activeTag === tag ? '' : tag);
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getExcerpt = (post: BlogPostRow, maxLength = 150) => {
    if (post.excerpt) return post.excerpt;
    if (!post.content) return '';
    const plainText = post.content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + '...';
  };

  const handleReadMore = (post: BlogPostRow) => {
    navigate(`/blog/${post.slug}`);
  };

  if (isLoading && page === 1) {
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

  return (
    <div className="min-h-screen bg-background">
      <PageSEO pageType="blog" />
      <Navigation />
      <SEOBreadcrumbs />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-background pt-page-top pb-section">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-primary px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-lg">
              <BookOpen className="h-4 w-4" />
              {t('blog.heroBadge', 'Safety & Protection Blog')}
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              {t('blog.heroTitle1', 'Expert Safety')}<br />
              <span className="text-primary">{t('blog.heroTitle2', 'Insights & Updates')}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('blog.heroDescription', 'Stay informed with the latest emergency safety tips, family protection guides, and product updates from our AI-powered content team.')}
            </p>

            {/* Search Bar */}
            <div className="max-w-lg mx-auto relative">
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-xl -m-1"></div>
              <div className="relative bg-white rounded-lg shadow-xl">
                <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('blog.searchPlaceholder', 'Search articles...')}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg border-0 focus:ring-2 focus:ring-primary/20 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-section">
        {/* Tag Filter Bar */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <Button
              variant={activeTag === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTagClick('')}
              className="rounded-full"
            >
              {t('blog.allTopics', 'All Topics')}
            </Button>
            {allTags.slice(0, 12).map((tag) => (
              <Button
                key={tag}
                variant={activeTag === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTagClick(tag)}
                className="rounded-full"
              >
                {tag}
              </Button>
            ))}
          </div>
        )}

        {/* Featured Post */}
        {featuredPost && (
          <section className="mb-20">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">{t('blog.featuredArticle', 'Featured Article')}</h2>
            </div>
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-primary/5">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                  <div className="lg:col-span-2 p-10">
                    <div className="flex items-center gap-4 mb-6">
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2 text-sm">
                        {t('blog.featured', 'Featured')}
                      </Badge>
                      {featuredPost.reading_time && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          <Clock className="h-4 w-4" />
                          {t('blog.minRead', { count: featuredPost.reading_time, defaultValue: '{{count}} min read' })}
                        </div>
                      )}
                      {featuredPost.view_count != null && featuredPost.view_count > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          {featuredPost.view_count.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <h3 className="text-3xl font-bold mb-6 text-foreground leading-tight">
                      {featuredPost.seo_title || featuredPost.title}
                    </h3>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                      {featuredPost.meta_description || getExcerpt(featuredPost, 200)}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(featuredPost.published_at || featuredPost.created_at)}
                      </div>
                      <Button
                        size="lg"
                        className="group"
                        onClick={() => handleReadMore(featuredPost)}
                      >
                        {t('blog.readFullArticle', 'Read Full Article')}
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                  {featuredPost.featured_image ? (
                    <div className="hidden lg:block">
                      <img
                        src={featuredPost.featured_image}
                        alt={featuredPost.featured_image_alt || featuredPost.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-10 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg mx-auto">
                          <BookOpen className="h-12 w-12 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {t('blog.aiGeneratedContent', 'AI-Generated Content')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('blog.poweredByRiven', 'Powered by Riven AI')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Blog Posts Grid */}
        {gridPosts.length > 0 ? (
          <section className="space-y-10">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-3xl font-bold">
                {searchTerm
                  ? t('blog.searchResults', 'Search Results')
                  : activeTag
                    ? t('blog.tagResults', { tag: activeTag, defaultValue: 'Articles tagged "{{tag}}"' })
                    : t('blog.latestArticles', 'Latest Articles')}
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {t('blog.articleCount', { count: totalCount, defaultValue: '{{count}} articles' })}
                </div>
                {(searchTerm || activeTag) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setActiveTag('');
                      setPage(1);
                    }}
                  >
                    {t('blog.clearFilters', 'Clear Filters')}
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridPosts.map((post) => (
                <Card
                  key={post.id}
                  className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-white to-primary/[0.02] overflow-hidden cursor-pointer"
                  onClick={() => handleReadMore(post)}
                >
                  {/* Featured image or gradient accent */}
                  {post.featured_image ? (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={post.featured_image}
                        alt={post.featured_image_alt || post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
                  )}

                  <CardHeader className="pb-6 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {post.view_count != null && post.view_count > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {post.view_count.toLocaleString()}
                          </div>
                        )}
                      </div>
                      {post.reading_time && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="font-medium">{post.reading_time}m</span>
                        </div>
                      )}
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors duration-300 text-xl font-bold leading-tight line-clamp-2 mb-3 min-h-[3.5rem] flex items-start">
                      {post.seo_title || post.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-muted-foreground text-base leading-relaxed line-clamp-3 mb-6 min-h-[4.5rem]">
                      {post.meta_description || getExcerpt(post, 120)}
                    </p>

                    {post.keywords && post.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6 min-h-[2rem]">
                        {post.keywords.slice(0, 3).map((keyword, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs bg-secondary/30 hover:bg-secondary/50 transition-colors font-normal px-2.5 py-1"
                          >
                            {keyword}
                          </Badge>
                        ))}
                        {post.keywords.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground px-2.5 py-1"
                          >
                            +{post.keywords.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {formatDate(post.published_at || post.created_at)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="group/btn hover:bg-primary/10 hover:text-primary text-sm font-medium px-4 py-2 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReadMore(post);
                        }}
                      >
                        {t('blog.readArticle', 'Read')}
                        <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('blog.previous', 'Previous')}
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={item}
                          variant={page === item ? 'default' : 'outline'}
                          size="sm"
                          className="w-9 h-9 p-0"
                          onClick={() => setPage(item as number)}
                        >
                          {item}
                        </Button>
                      )
                    )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  {t('blog.next', 'Next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </section>
        ) : (
          /* Empty State */
          <section className="py-20">
            <Card className="text-center border-0 shadow-xl bg-gradient-to-br from-muted/50 to-background">
              <CardContent className="py-20">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  {searchTerm || activeTag
                    ? t('blog.noArticlesFound', 'No articles found')
                    : t('blog.noPublishedContent', 'No published content yet')}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                  {searchTerm
                    ? t('blog.noArticlesMatch', {
                        term: searchTerm,
                        defaultValue: 'No articles match "{{term}}". Try a different search.',
                      })
                    : t(
                        'blog.noPublishedContentDesc',
                        'Blog posts are automatically generated and published by our AI content engine. Check back soon!'
                      )}
                </p>
                {(searchTerm || activeTag) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setActiveTag('');
                      setPage(1);
                    }}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {t('blog.clearFilters', 'Clear Filters')}
                  </Button>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* AI Info Section */}
        <section className="mt-20">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <CardContent className="p-12 text-center">
              <div className="max-w-3xl mx-auto">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-6">
                  {t('blog.aiPoweredTitle', 'AI-Powered Safety Content')}
                </h3>
                <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
                  {t(
                    'blog.aiPoweredDesc',
                    'Our blog content is generated by Riven AI, trained on emergency safety best practices, and reviewed by our editorial team.'
                  )}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center gap-3 p-6 bg-white/60 rounded-xl">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="font-semibold">
                      {t('blog.expertContent', 'Expert Content')}
                    </span>
                    <span className="text-sm text-muted-foreground text-center">
                      {t('blog.expertContentDesc', 'Research-backed safety articles')}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-3 p-6 bg-white/60 rounded-xl">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                    <span className="font-semibold">
                      {t('blog.seoOptimized', 'SEO Optimized')}
                    </span>
                    <span className="text-sm text-muted-foreground text-center">
                      {t('blog.seoOptimizedDesc', 'Optimized for search engines')}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-3 p-6 bg-white/60 rounded-xl">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Eye className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="font-semibold">
                      {t('blog.liveUpdates', 'Live Updates')}
                    </span>
                    <span className="text-sm text-muted-foreground text-center">
                      {t('blog.liveUpdatesDesc', 'Fresh content published regularly')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
