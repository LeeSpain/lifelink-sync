import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' }
  ];

  // Custom breadcrumb mappings for better SEO
  const pathMappings: Record<string, string> = {
    'emergency-response-services': 'Emergency Response Services',
    'ai-emergency-assistant': 'AI Emergency Assistant', 
    'family-safety-monitoring': 'Family Safety Monitoring',
    'senior-emergency-protection': 'Senior Emergency Protection',
    'ai-register': 'Registration',
    'payment-success': 'Payment Successful',
    'test-registration': 'Test Registration',
    'map-demo': 'Live Map Demo',
    'contact': 'Contact Us',
    'privacy': 'Privacy Policy',
    'terms': 'Terms of Service',
    'support': 'Support',
    'blog': 'Blog',
    'auth': 'Sign In',
    'dashboard': 'Dashboard',
    'member-dashboard': 'Dashboard',
    'family-dashboard': 'Family Dashboard',
    'admin-dashboard': 'Admin Dashboard'
  };

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = pathMappings[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    if (index === segments.length - 1) {
      // Last item is the current page
      breadcrumbs.push({ label });
    } else {
      breadcrumbs.push({ label, href: currentPath });
    }
  });

  return breadcrumbs;
};

interface SEOBreadcrumbsProps {
  className?: string;
  customBreadcrumbs?: BreadcrumbItem[];
}

const SEOBreadcrumbs: React.FC<SEOBreadcrumbsProps> = ({ 
  className = '', 
  customBreadcrumbs 
}) => {
  const location = useLocation();
  const breadcrumbs = customBreadcrumbs || getBreadcrumbs(location.pathname);

  // Don't show breadcrumbs on home page
  if (location.pathname === '/') {
    return null;
  }

  // Generate JSON-LD structured data for breadcrumbs
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': breadcrumb.label,
      ...(breadcrumb.href && {
        'item': `${window.location.origin}${breadcrumb.href}`
      })
    }))
  };

  return (
    <>
      {/* JSON-LD for Search Engines */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Visual Breadcrumbs */}
      <div className={`py-4 border-b border-border/50 ${className}`}>
        <div className="container mx-auto px-4">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {breadcrumb.href ? (
                      <BreadcrumbLink asChild>
                        <Link to={breadcrumb.href} className="flex items-center gap-1">
                          {index === 0 && <Home className="h-4 w-4" />}
                          {breadcrumb.label}
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </>
  );
};

export default SEOBreadcrumbs;