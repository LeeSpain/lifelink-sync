import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const BlogNotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t('blog.postNotFoundTitle', 'Article Not Found')}
        description={t('blog.postNotFoundDesc', 'The article you are looking for could not be found.')}
      />
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto text-center border-0 shadow-xl">
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
};

export default BlogNotFound;
