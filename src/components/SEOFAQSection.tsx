import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  id?: string;
}

interface SEOFAQSectionProps {
  title?: string;
  faqs: FAQItem[];
  className?: string;
}

const SEOFAQSection: React.FC<SEOFAQSectionProps> = ({
  title = "Frequently Asked Questions",
  faqs,
  className = ""
}) => {
  const [openItems, setOpenItems] = React.useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  // Generate FAQ structured data for search engines
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  };

  return (
    <>
      {/* JSON-LD for Search Engines */}
      <script type="application/ld+json">
        {JSON.stringify(faqStructuredData)}
      </script>

      <section className={`py-16 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
              <p className="text-xl text-muted-foreground">
                Get answers to the most common questions about our emergency protection services
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={faq.id || index} className="border border-border/50 hover:border-primary/30 transition-colors">
                  <CardHeader 
                    className="cursor-pointer"
                    onClick={() => toggleItem(index)}
                  >
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{faq.question}</span>
                      {openItems.has(index) ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  {openItems.has(index) && (
                    <CardContent className="pt-0">
                      <div className="text-muted-foreground prose prose-sm max-w-none">
                        <p>{faq.answer}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-muted-foreground">
                Still have questions? {' '}
                <Link to="/contact" className="text-primary hover:underline font-medium">
                  Contact our support team
                </Link>
                {' '} for personalized assistance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default SEOFAQSection;