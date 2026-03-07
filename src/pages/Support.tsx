import React from "react";
import { Mail, Phone, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageSEO } from "@/components/PageSEO";

const Support: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageSEO pageType="support" />
      <main className="container mx-auto px-4 py-section">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t('support.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('support.subtitle')}
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href={`mailto:${t('support.email.address')}`} className="p-6 rounded-lg border border-border hover:bg-muted/30 transition">
            <Mail className="h-5 w-5 mb-3" />
            <h2 className="font-semibold">{t('support.email.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('support.email.address')}</p>
          </a>
          <div className="p-6 rounded-lg border border-border">
            <Phone className="h-5 w-5 mb-3" />
            <h2 className="font-semibold">{t('support.emergency.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('support.emergency.description')}</p>
          </div>
          <div className="p-6 rounded-lg border border-border">
            <MessageSquare className="h-5 w-5 mb-3" />
            <h2 className="font-semibold">{t('support.faq.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('support.faq.description')}</p>
          </div>
        </section>
      </main>
    </>
  );
};

export default Support;
