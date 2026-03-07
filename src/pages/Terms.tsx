import React, { useState, useEffect } from "react";
import { TermsDialog } from "@/components/legal/TermsDialog";
import { useTranslation } from "react-i18next";
import { PageSEO } from "@/components/PageSEO";

const Terms: React.FC = () => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const title = `${t('terms.title')} | LifeLink Sync`;
  const description = t('terms.description');
  const canonical = "/terms";

  // Open dialog automatically when page loads
  useEffect(() => {
    setDialogOpen(true);
  }, []);

  const handleDialogClose = () => {
    setDialogOpen(false);
    // Navigate back to previous page or home
    window.history.back();
  };

  return (
    <>
      <PageSEO pageType="terms" />
      
      <TermsDialog 
        open={dialogOpen} 
        onOpenChange={handleDialogClose}
      />
      
      {/* Fallback content for SEO and accessibility */}
      <main className="container mx-auto px-4 py-section" style={{ display: dialogOpen ? 'none' : 'block' }}>
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t('terms.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('terms.description')}
          </p>
        </header>
        <section className="prose prose-invert max-w-none">
          <p>
            {t('terms.fallback')} {" "}
            <a href={`mailto:${t('terms.email')}`} className="text-primary hover:underline">
              {t('terms.email')}
            </a>
          </p>
        </section>
      </main>
    </>
  );
};

export default Terms;
