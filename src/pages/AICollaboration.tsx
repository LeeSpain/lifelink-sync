import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bot, Cpu, Shield, Zap, Globe, Code, ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { organizationSchema, breadcrumbSchema } from '@/lib/seoSchemas';

const AICollaboration: React.FC = () => {
  const { t } = useTranslation();

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'AI Collaboration', url: '/ai-collaboration' },
  ]);

  const capabilities = [
    { icon: Bot, title: 'CLARA AI Assistant', desc: 'Proprietary AI safety companion powered by large language models. Handles emergency triage, wellbeing check-ins, medication reminders, and platform guidance — 24/7 in three languages.' },
    { icon: Shield, title: 'Emergency Detection', desc: 'Real-time analysis of voice patterns, text inputs, and sensor data to detect emergency situations and trigger automated response coordination.' },
    { icon: Cpu, title: 'Wellbeing Analytics', desc: 'Daily collection and analysis of mood, sleep, pain, and general wellbeing data. AI-generated weekly reports with trend detection for members and their family circles.' },
    { icon: Zap, title: 'Response Coordination', desc: 'Automated multi-channel emergency response: family alerts, GPS sharing, medical profile distribution, conference bridge setup, and instant callback — all within seconds.' },
  ];

  const partnershipAreas = [
    { title: 'Emergency Detection AI', desc: 'Improve accuracy of emergency phrase detection, reduce false positives, and enhance voice-activated SOS triggers across multiple languages.' },
    { title: 'Health Monitoring AI', desc: 'Advance wellbeing trend analysis, early warning detection for health deterioration, and medication interaction awareness.' },
    { title: 'Natural Language Processing', desc: 'Enhance CLARA\'s multilingual capabilities, emergency context understanding, and culturally appropriate communication.' },
    { title: 'Location Intelligence', desc: 'Improve GPS accuracy in emergency situations, indoor positioning, and proximity-based safety features.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="AI Collaboration — Partner with LifeLink Sync"
        description="Explore AI partnership opportunities with LifeLink Sync. Emergency detection, health monitoring AI, NLP for emergency response, and more."
        structuredData={[organizationSchema, breadcrumbs]}
      />
      <Navigation />

      <main className="pt-20">
        {/* Hero */}
        <section className="bg-gradient-hero text-white py-20 md:py-28">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Cpu className="w-4 h-4" />
              <span className="text-sm font-medium">AI Partnership Programme</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-6">AI Collaboration</h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              LifeLink Sync is building the future of AI-powered emergency protection. We partner with AI companies, research institutions, and technology providers to advance safety technology.
            </p>
          </div>
        </section>

        {/* AI Capabilities */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">Our AI Capabilities</h2>
            <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
              LifeLink Sync uses AI across the entire emergency protection lifecycle.
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {capabilities.map((c) => (
                <div key={c.title} className="border border-border rounded-xl p-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <c.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partnership Areas */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">Partnership Opportunities</h2>
            <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
              We are actively seeking partnerships in the following areas.
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {partnershipAreas.map((p) => (
                <div key={p.title} className="bg-white border border-border rounded-xl p-6">
                  <h3 className="font-bold text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data & API */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Code className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Training Data & API Access</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  We offer structured data for AI training and integration endpoints for qualified partners. All data sharing complies with GDPR and our privacy commitments — no personal user data is shared.
                </p>
              </div>
            </div>
            <div className="border border-border rounded-xl p-6 bg-muted/20">
              <h3 className="font-bold text-foreground mb-3">Available for partners:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary flex-shrink-0" /> Anonymised emergency response pattern data</li>
                <li className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary flex-shrink-0" /> Emergency detection algorithm benchmarks</li>
                <li className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary flex-shrink-0" /> Multilingual emergency phrase datasets</li>
                <li className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary flex-shrink-0" /> Integration API documentation (on approval)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 md:py-20 bg-primary text-white">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <Mail className="w-10 h-10 mx-auto mb-4 text-white/80" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Get in Touch</h2>
            <p className="text-white/90 mb-6">
              Interested in partnering with LifeLink Sync? We would love to hear from AI companies, research institutions, and technology providers.
            </p>
            <a href="mailto:ai-partnerships@lifelink-sync.com">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                ai-partnerships@lifelink-sync.com
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <p className="text-sm text-white/70 mt-4">
              For general partnerships: <a href="mailto:partnerships@lifelink-sync.com" className="underline">partnerships@lifelink-sync.com</a>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AICollaboration;
