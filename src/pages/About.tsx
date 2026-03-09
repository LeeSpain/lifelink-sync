import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Bot, Users, MapPin, Heart, Pill, Phone, Bluetooth, Globe, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { organizationSchema, breadcrumbSchema } from '@/lib/seoSchemas';

const About: React.FC = () => {
  const { t } = useTranslation();

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' },
  ]);

  const features = [
    { icon: Bot, title: 'CLARA AI', desc: '24/7 AI safety assistant that coordinates every emergency response, conducts wellbeing check-ins, and sends medication reminders.' },
    { icon: Phone, title: 'One-Touch SOS', desc: 'Trigger a full emergency response instantly from the app, a Bluetooth pendant, or voice activation.' },
    { icon: Users, title: 'Family Circle', desc: 'Up to 10 emergency contacts receive instant alerts, live GPS, medical profile data, and join a conference bridge call.' },
    { icon: MapPin, title: 'Live GPS Tracking', desc: 'Real-time location sharing during emergencies so family can see your position and coordinate response.' },
    { icon: Heart, title: 'Daily Wellbeing', desc: 'Optional daily check-ins tracking mood, sleep, pain, and general wellbeing — with digests sent to your family circle.' },
    { icon: Pill, title: 'Medication Reminders', desc: 'AI-driven medication schedules with adherence tracking and family notifications when doses are missed.' },
  ];

  const stats = [
    { value: '10,000+', label: 'Members protected' },
    { value: '3', label: 'Countries served' },
    { value: '<30s', label: 'Average response time' },
    { value: '99.9%', label: 'Platform uptime' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="About LifeLink Sync — AI-Powered Emergency Protection"
        description="Founded in 2024 in Madrid, LifeLink Sync provides AI-powered emergency protection for individuals and families across Spain, the UK and the Netherlands."
        structuredData={[organizationSchema, breadcrumbs]}
      />
      <Navigation />

      <main className="pt-20">
        {/* Hero */}
        <section className="bg-gradient-hero text-white py-20 md:py-28">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-6">About LifeLink Sync</h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              AI-powered emergency protection for individuals and families. Founded in 2024, headquartered in Madrid, serving Spain, the UK and the Netherlands.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Our Mission</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Everyone deserves to feel safe — whether you live alone, care for an elderly parent, or simply want peace of mind for your family. LifeLink Sync was built to make emergency protection accessible, intelligent, and always available.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We combine AI technology with human-centred design to create a platform where one tap, one press of a pendant, or one voice command activates a complete emergency response — alerting your family, sharing your location, sending your medical profile, and connecting everyone on a live call within seconds.
            </p>
          </div>
        </section>

        {/* What We Do */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-10 text-center">What We Do</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((f) => (
                <div key={f.title} className="bg-white rounded-xl border border-border p-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOS Pendant */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bluetooth className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">SOS Pendant</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  A wearable Bluetooth button that pairs with your smartphone. Press it to trigger the full platform response — no need to open the app. Ideal for elderly users or anyone who wants instant, hands-free emergency activation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 md:py-20 bg-primary text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl md:text-4xl font-bold mb-1">{s.value}</div>
                  <div className="text-sm text-white/80">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Coverage */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Where We Operate</h2>
                <p className="text-muted-foreground text-lg">Currently available in three European markets with full localisation.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { country: 'Spain', lang: 'Spanish', emergency: '112' },
                { country: 'United Kingdom', lang: 'English', emergency: '999' },
                { country: 'Netherlands', lang: 'Dutch', emergency: '112' },
              ].map((m) => (
                <div key={m.country} className="border border-border rounded-xl p-5">
                  <h3 className="font-bold text-foreground mb-2">{m.country}</h3>
                  <p className="text-sm text-muted-foreground">Language: {m.lang}</p>
                  <p className="text-sm text-muted-foreground">Emergency: {m.emergency}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">Security & Compliance</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'GDPR Compliant — full data protection',
                'ISO 27001 Security Management',
                'AES-256 encryption at rest',
                'TLS 1.3 encryption in transit',
                'EU-hosted infrastructure (Frankfurt)',
                'Healthcare-grade data handling',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 p-3">
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Ready to get protected?</h2>
            <p className="text-muted-foreground mb-8">Start your free 7-day trial — no credit card required.</p>
            <Link to="/register?trial=true">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
