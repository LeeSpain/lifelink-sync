import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article' | 'product' | 'service';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  locale?: string;
  alternateLocales?: { hreflang: string; href: string }[];
  structuredData?: Record<string, any>;
  noIndex?: boolean;
  noFollow?: boolean;
  robotsDirectives?: string[];
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords = [],
  canonical, 
  image, 
  imageAlt,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  locale = 'en_US',
  alternateLocales = [],
  structuredData,
  noIndex = false,
  noFollow = false,
  robotsDirectives = []
}) => {
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : '/');
  const img = image || '/lovable-uploads/lifelink-sync-og.png';
  const imgAlt = imageAlt || `${title} - LifeLink Sync Emergency Protection`;

  // Enhanced title with proper length (50-60 chars optimal)
  const optimizedTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title;
  
  // Enhanced description with proper length (150-160 chars optimal)
  const optimizedDescription = description.length > 160 ? `${description.substring(0, 157)}...` : description;

  // Generate robots meta content
  const robotsContent = [
    ...(noIndex ? ['noindex'] : ['index']),
    ...(noFollow ? ['nofollow'] : ['follow']),
    ...robotsDirectives
  ].join(', ');

  // Enhanced keywords for AI discoverability
  const allKeywords = [
    ...keywords,
    'emergency protection',
    'AI assistant',
    'safety monitoring',
    'SOS service',
    'personal safety',
    'emergency response',
    '24/7 monitoring'
  ].filter((keyword, index, arr) => arr.indexOf(keyword) === index).join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{optimizedTitle}</title>
      <meta name="description" content={optimizedDescription} />
      {allKeywords && <meta name="keywords" content={allKeywords} />}
      <meta name="author" content={author || 'LifeLink Sync'} />
      <meta name="robots" content={robotsContent} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Alternate Language URLs */}
      {alternateLocales.map(({ hreflang, href }) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
      ))}

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={optimizedTitle} />
      <meta property="og:description" content={optimizedDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:image:alt" content={imgAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="LifeLink Sync" />
      <meta property="og:locale" content={locale} />
      
      {/* Article-specific Open Graph tags */}
      {type === 'article' && author && <meta property="article:author" content={author} />}
      {type === 'article' && publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {type === 'article' && modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {type === 'article' && section && <meta property="article:section" content={section} />}
      {type === 'article' && tags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={optimizedTitle} />
      <meta name="twitter:description" content={optimizedDescription} />
      <meta name="twitter:image" content={img} />
      <meta name="twitter:image:alt" content={imgAlt} />
      <meta name="twitter:site" content="@lifelinksync" />
      <meta name="twitter:creator" content="@lifelinksync" />

      {/* AI and Search Engine Optimization */}
      <meta name="theme-color" content="#FF0000" />
      <meta name="msapplication-TileColor" content="#FF0000" />
      <meta name="application-name" content="LifeLink Sync" />
      <meta name="apple-mobile-web-app-title" content="LifeLink Sync" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Enhanced Schema for AI Understanding */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": optimizedTitle,
          "description": optimizedDescription,
          "url": url,
          "image": img,
          "inLanguage": locale.replace('_', '-'),
          "keywords": allKeywords,
          "isPartOf": {
            "@type": "WebSite",
            "name": "LifeLink Sync",
            "url": typeof window !== 'undefined' ? window.location.origin : 'https://lifelink-sync.com'
          },
          "author": {
            "@type": "Organization",
            "name": author || "LifeLink Sync",
            "url": typeof window !== 'undefined' ? window.location.origin : 'https://lifelink-sync.com'
          },
          "publisher": {
            "@type": "Organization",
            "name": "LifeLink Sync",
            "logo": {
              "@type": "ImageObject",
              "url": img
            }
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
