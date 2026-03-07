import React, { useState, useEffect } from 'react';
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
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { PageSEO } from '@/components/PageSEO';
import SEOBreadcrumbs from '@/components/SEOBreadcrumbs';
import SEO from '@/components/SEO';

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

const Blog = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadBlogPosts();
  }, []);

  useEffect(() => {
    // Filter posts based on search term
    if (searchTerm.trim()) {
      const filtered = blogPosts.filter(post =>
        post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.body_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.keywords?.some(keyword => 
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(blogPosts);
    }
  }, [searchTerm, blogPosts]);

  const loadBlogPosts = async () => {
    try {
      console.log('Loading published blog posts from marketing_content...');
      
      const { data: posts, error } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('platform', 'blog')
        .eq('status', 'published')
        .order('posted_at', { ascending: false });

      if (error) {
        console.error('Error loading blog posts:', error);
        throw error;
      }

      console.log('Loaded blog posts:', posts);

      const blogPosts = (posts || []).map(post => ({
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
        posted_at: post.posted_at,
        status: post.status,
        image_url: post.image_url,
        content_type: post.content_type,
        platform: post.platform
      }));

      setBlogPosts(blogPosts);
      setFilteredPosts(blogPosts);
      
      // Set the most recent post as featured
      if (blogPosts.length > 0) {
        setFeaturedPost(blogPosts[0]);
      }

    } catch (error) {
      console.error('Error loading blog posts:', error);
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive"
      });
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

  const getExcerpt = (content: string, maxLength: number = 150) => {
    if (!content) return '';
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + '...';
  };

  const handleReadMore = (post: BlogPost) => {
    const slug = post.slug || (post.title ? post.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : post.id);
    navigate(`/blog/${slug}`);
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

  return (
    <div className="min-h-screen bg-background">
      <PageSEO pageType="videos" />
      <Navigation />
      <SEOBreadcrumbs />
      
      {/* Hero Section with Background */}
      <section className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-background pt-page-top pb-section">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-primary px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-lg">
              <BookOpen className="h-4 w-4" />
              Safety & Emergency Response Blog
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Safety Insights &<br />
              <span className="text-primary">Expert Guidance</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Stay informed with the latest safety tips, emergency response guidance, and family protection insights from our AI-powered content creation system.
            </p>
            
            {/* Enhanced Search Bar */}
            <div className="max-w-lg mx-auto relative">
              <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-xl -m-1"></div>
              <div className="relative bg-white rounded-lg shadow-xl">
                <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search articles, tips, and guides..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg border-0 focus:ring-2 focus:ring-primary/20 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-section">
        {/* Featured Post */}
        {featuredPost && (
          <section className="mb-20">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Featured Article</h2>
            </div>
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-primary/5">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                  <div className="lg:col-span-2 p-10">
                    <div className="flex items-center gap-4 mb-6">
                      <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2 text-sm">
                        Featured
                      </Badge>
                      {featuredPost.reading_time && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          <Clock className="h-4 w-4" />
                          {featuredPost.reading_time} min read
                        </div>
                      )}
                      {featuredPost.seo_score && featuredPost.seo_score >= 80 && (
                        <Badge className="bg-green-500/10 text-green-700 border-green-200">
                          SEO Optimized
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-3xl font-bold mb-6 text-foreground leading-tight">
                      {featuredPost.seo_title || featuredPost.title || 'Untitled Post'}
                    </h3>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                      {featuredPost.meta_description || getExcerpt(featuredPost.body_text || '', 200)}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(featuredPost.posted_at || featuredPost.created_at)}
                      </div>
                      <Button 
                        size="lg" 
                        className="group"
                        onClick={() => handleReadMore(featuredPost)}
                      >
                        Read Full Article
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-10 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg mx-auto">
                        <BookOpen className="h-12 w-12 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        AI-Generated Safety Content
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Powered by Riven AI Marketing System
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Blog Posts Grid */}
        {filteredPosts.length > 0 ? (
          <section className="space-y-10">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-3xl font-bold">
                {searchTerm ? `Search Results` : 'Latest Articles'}
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
                </div>
                {searchTerm && (
                  <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.slice(featuredPost ? 1 : 0).map((post) => (
                <Card key={post.id} className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg hover:-translate-y-2 bg-gradient-to-br from-white to-primary/[0.02] overflow-hidden">
                  {/* Top gradient accent */}
                  <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
                  
                  <CardHeader className="pb-6 pt-6">
                    {/* Meta badges */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20 font-medium text-xs px-3 py-1">
                          {post.platform}
                        </Badge>
                        {post.seo_score && post.seo_score >= 80 && (
                          <Badge className="bg-green-50 text-green-700 border-green-200 font-medium text-xs px-3 py-1">
                            <Star className="h-3 w-3 mr-1" />
                            SEO Optimized
                          </Badge>
                        )}
                      </div>
                      {post.reading_time && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="font-medium">{post.reading_time}m</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Title */}
                    <CardTitle className="group-hover:text-primary transition-colors duration-300 text-xl font-bold leading-tight line-clamp-2 mb-3 min-h-[3.5rem] flex items-start">
                      {post.seo_title || post.title || 'Untitled Post'}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Description */}
                    <p className="text-muted-foreground text-base leading-relaxed line-clamp-3 mb-6 min-h-[4.5rem]">
                      {post.meta_description || getExcerpt(post.body_text || '', 120)}
                    </p>
                    
                    {/* Keywords */}
                    {post.keywords && post.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6 min-h-[2rem]">
                        {post.keywords.slice(0, 3).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-secondary/30 hover:bg-secondary/50 transition-colors font-normal px-2.5 py-1">
                            {keyword}
                          </Badge>
                        ))}
                        {post.keywords.length > 3 && (
                          <Badge variant="outline" className="text-xs text-muted-foreground px-2.5 py-1">
                            +{post.keywords.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">{formatDate(post.posted_at || post.created_at)}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="group/btn hover:bg-primary/10 hover:text-primary text-sm font-medium px-4 py-2 h-auto"
                        onClick={() => handleReadMore(post)}
                      >
                        Read Article
                        <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : (
          /* Enhanced Empty State */
          <section className="py-20">
            <Card className="text-center border-0 shadow-xl bg-gradient-to-br from-muted/50 to-background">
              <CardContent className="py-20">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  {searchTerm ? 'No articles found' : 'No Published Content Yet'}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                  {searchTerm 
                    ? `No articles match "${searchTerm}". Try adjusting your search terms.`
                    : 'Published content from your Riven AI Marketing System will appear here automatically.'
                  }
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    <Search className="h-4 w-4 mr-2" />
                    Clear Search
                  </Button>
                )}
                {!searchTerm && (
                  <div className="text-sm text-muted-foreground mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
                    <p className="font-semibold text-blue-800 mb-1">💡 How to publish content:</p>
                    <p className="text-blue-700">Go to Admin Dashboard → Riven Marketing → Create & publish content</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Enhanced AI Info Section */}
        <section className="mt-20">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <CardContent className="p-12 text-center">
              <div className="max-w-3xl mx-auto">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-6">AI-Powered Safety Content</h3>
                <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
                  Our blog articles are created by Riven, our advanced AI marketing assistant, to provide you with 
                  the latest insights on emergency response, family safety, and protection technology. All content 
                  is automatically optimized for SEO and readability.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center gap-3 p-6 bg-white/60 rounded-xl">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="font-semibold">Expert Content</span>
                    <span className="text-sm text-muted-foreground text-center">Researched and verified safety information</span>
                  </div>
                  <div className="flex flex-col items-center gap-3 p-6 bg-white/60 rounded-xl">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                    <span className="font-semibold">SEO Optimized</span>
                    <span className="text-sm text-muted-foreground text-center">Maximum visibility and reach</span>
                  </div>
                  <div className="flex flex-col items-center gap-3 p-6 bg-white/60 rounded-xl">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Eye className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="font-semibold">Live Updates</span>
                    <span className="text-sm text-muted-foreground text-center">Fresh content published regularly</span>
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