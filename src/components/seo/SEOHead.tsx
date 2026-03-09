import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType?: string;
  keywords?: string;
  lang?: string;
  noIndex?: boolean;
  schema?: object | object[];
}

const DEFAULT_IMAGE = 'https://lifelink-sync.com/lovable-uploads/lifelink-sync-og.png';
const SITE_NAME = 'LifeLink Sync';
const BASE_URL = 'https://lifelink-sync.com';

export default function SEOHead({
  title,
  description,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  keywords,
  lang = 'en',
  noIndex = false,
  schema,
}: SEOHeadProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const fullCanonical = canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`;

  const schemaArray = schema ? (Array.isArray(schema) ? schema : [schema]) : [];

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullCanonical} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={lang === 'es' ? 'es_ES' : lang === 'nl' ? 'nl_NL' : 'en_GB'} />

      {/* Twitter/X Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@lifelinksync" />

      {/* Hreflang for multilingual */}
      <link rel="alternate" hrefLang="en" href={`${BASE_URL}${canonical}`} />
      <link rel="alternate" hrefLang="es" href={`${BASE_URL}${canonical}`} />
      <link rel="alternate" hrefLang="nl" href={`${BASE_URL}${canonical}`} />
      <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${canonical}`} />

      {/* JSON-LD Schema */}
      {schemaArray.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
