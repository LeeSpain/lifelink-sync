import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Shield, Database, MapPin, Users, Cookie, Mail, Trash2, Lock } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface PrivacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
  onDecline?: () => void;
  showActions?: boolean;
}

export const PrivacyDialog: React.FC<PrivacyDialogProps> = ({ 
  open, 
  onOpenChange, 
  onAccept, 
  onDecline, 
  showActions = false 
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const sections = [
    { id: "overview", title: t('legal.privacy.navOverview'), icon: Shield },
    { id: "data-collection", title: t('legal.privacy.navDataCollection'), icon: Database },
    { id: "location-data", title: t('legal.privacy.navLocation'), icon: MapPin },
    { id: "medical-data", title: t('legal.privacy.navMedical'), icon: Lock },
    { id: "data-usage", title: t('legal.privacy.navUsage'), icon: Users },
    { id: "data-sharing", title: t('legal.privacy.navSharing'), icon: Mail },
    { id: "cookies", title: t('legal.privacy.navCookies'), icon: Cookie },
    { id: "user-rights", title: t('legal.privacy.navRights'), icon: CheckCircle },
    { id: "data-retention", title: t('legal.privacy.navRetention'), icon: Trash2 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {t('legal.privacy.title')}
          </DialogTitle>
          <DialogDescription>
            {t('legal.privacy.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-6 min-h-0">
          {/* Table of Contents */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-0">
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">{t('legal.privacy.contents')}</h4>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors p-2 rounded-md hover:bg-muted"
                    >
                      <Icon className="h-4 w-4" />
                      {section.title}
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <ScrollArea className="h-full pr-4" onScrollCapture={handleScroll}>
              <div className="prose prose-sm max-w-none">
                <div className="text-sm text-muted-foreground mb-6">
                  <strong>{t('legal.privacy.lastUpdated')}:</strong> {currentYear} | <strong>{t('legal.privacy.effectiveDate')}:</strong> {t('legal.privacy.january1')} {currentYear}
                </div>

                <section id="overview" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    1. Privacy Overview
                  </h3>
                  <p className="mb-4">
                    LifeLink Sync ("we," "us," or "our") is committed to protecting your privacy and personal data. 
                    This Privacy Policy explains how we collect, use, share, and protect your information when you use 
                    our emergency response services ("Service").
                  </p>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                    <p className="font-semibold text-primary mb-2">Emergency Data Processing:</p>
                    <p className="text-sm">
                      During active emergencies, we may process and share your data with emergency services, 
                      medical responders, and emergency contacts to protect your life and safety. This processing 
                      is based on vital interests and emergency response requirements.
                    </p>
                  </div>
                  <p className="mb-4">
                    We comply with applicable data protection laws, including GDPR, CCPA, and other regional privacy regulations. 
                    Your data is processed lawfully, fairly, and transparently.
                  </p>
                </section>

                <Separator className="my-6" />

                <section id="data-collection" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    2. Data We Collect
                  </h3>
                  
                  <h4 className="font-semibold mb-3">Account Information:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Name, email address, phone number</li>
                    <li>Account credentials and authentication data</li>
                    <li>Profile photo and user preferences</li>
                    <li>Subscription and billing information</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Emergency Contact Data:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Emergency contact names, relationships, and phone numbers</li>
                    <li>Family and carer contact information</li>
                    <li>Healthcare provider details</li>
                    <li>Preferred emergency services contacts</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Device and Technical Data:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Device identifiers, model, and operating system</li>
                    <li>App version and usage analytics</li>
                    <li>IP address and network information</li>
                    <li>Push notification tokens</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Communication Data:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Messages sent through our platform</li>
                    <li>Call logs and emergency incident reports</li>
                    <li>Customer support communications</li>
                    <li>Chat history with AI assistants</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section id="location-data" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    3. Location Information
                  </h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 dark:bg-orange-950 dark:border-orange-800">
                    <p className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Location Data Processing:</p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Location data is critical for emergency response. We collect location information only when 
                      necessary for emergency services and with your explicit consent.
                    </p>
                  </div>

                  <h4 className="font-semibold mb-3">When We Collect Location Data:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Continuously for family safety monitoring and live tracking</li>
                    <li>During active SOS emergency requests for emergency contacts</li>
                    <li>When you manually share location for safety</li>
                    <li>For location-based emergency service routing</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Location Data Types:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>GPS coordinates and accuracy radius</li>
                    <li>Address and geocoded location data</li>
                    <li>Movement patterns during emergencies</li>
                    <li>Historical location for incident investigation</li>
                  </ul>

                  <p className="mb-4">
                    <strong>Your Control:</strong> You can disable location sharing at any time, but this may limit 
                    our ability to provide emergency assistance. Emergency location sharing cannot be disabled during 
                    active SOS situations for your safety.
                  </p>
                </section>

                <Separator className="my-6" />

                <section id="medical-data" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    4. Medical Information
                  </h3>
                  <p className="mb-4">
                    Medical information is collected to assist emergency responders and healthcare providers 
                    in delivering appropriate care during emergencies.
                  </p>

                  <h4 className="font-semibold mb-3">Medical Data Collected:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Blood type, allergies, and medical conditions</li>
                    <li>Current medications and dosages</li>
                    <li>Healthcare provider contact information</li>
                    <li>Emergency medical preferences</li>
                    <li>Medical device information (implants, etc.)</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Medical Data Protection:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Encrypted storage and transmission</li>
                    <li>Access limited to authorized personnel</li>
                    <li>Shared only during active emergencies</li>
                    <li>Compliance with healthcare privacy laws (HIPAA, etc.)</li>
                  </ul>

                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                    <p className="font-semibold text-destructive mb-2">Medical Data Accuracy:</p>
                    <p className="text-sm">
                      You are responsible for keeping medical information current and accurate. 
                      Outdated or incorrect medical data could impact emergency care quality.
                    </p>
                  </div>
                </section>

                <Separator className="my-6" />

                <section id="data-usage" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    5. How We Use Your Data
                  </h3>

                  <h4 className="font-semibold mb-3">Emergency Response:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Coordinate emergency assistance and first responder dispatch</li>
                    <li>Provide location and medical information to emergency services</li>
                    <li>Notify emergency contacts and family members</li>
                    <li>Facilitate communication with healthcare providers</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Service Delivery:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Maintain and improve service functionality</li>
                    <li>Process subscription payments and billing</li>
                    <li>Provide customer support and technical assistance</li>
                    <li>Send service updates and emergency notifications</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Legal and Safety:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Comply with legal obligations and law enforcement requests</li>
                    <li>Investigate and prevent fraud or misuse</li>
                    <li>Maintain service security and prevent abuse</li>
                    <li>Document incidents for regulatory compliance</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Analytics and Improvement:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Analyze service usage and performance metrics</li>
                    <li>Improve emergency response times and effectiveness</li>
                    <li>Develop new features and enhance user experience</li>
                    <li>Conduct research for emergency service improvements</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section id="data-sharing" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    6. Data Sharing and Disclosure
                  </h3>

                  <h4 className="font-semibold mb-3">Emergency Services:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Emergency medical services and first responders</li>
                    <li>Police, fire departments, and emergency dispatchers</li>
                    <li>Hospital emergency departments and healthcare providers</li>
                    <li>Search and rescue organizations</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Authorized Recipients:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Emergency contacts designated in your profile</li>
                    <li>Family members and carers with authorized access</li>
                    <li>Healthcare providers for continuity of care</li>
                    <li>Legal guardians or authorized representatives</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Service Providers:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Cloud storage and hosting providers (with encryption)</li>
                    <li>Payment processors for subscription billing</li>
                    <li>Communication services for emergency notifications</li>
                    <li>Analytics providers (with anonymized data only)</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Legal Requirements:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Court orders, subpoenas, or legal proceedings</li>
                    <li>Law enforcement investigations</li>
                    <li>Regulatory compliance and audits</li>
                    <li>Protection of rights, property, or safety</li>
                  </ul>

                  <p className="mb-4">
                    <strong>No Sale of Data:</strong> We do not sell your personal data to third parties for marketing 
                    or commercial purposes. Data sharing is limited to emergency response, service delivery, and legal requirements.
                  </p>
                </section>

                <Separator className="my-6" />

                <section id="cookies" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Cookie className="h-5 w-5 text-primary" />
                    7. Cookies and Analytics
                  </h3>

                  <h4 className="font-semibold mb-3">Essential Cookies:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Authentication and session management</li>
                    <li>Security and fraud prevention</li>
                    <li>Service functionality and preferences</li>
                    <li>Emergency response coordination</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Analytics Cookies:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Service usage patterns and performance metrics</li>
                    <li>Error tracking and debugging information</li>
                    <li>Feature usage and user engagement</li>
                    <li>Service improvement analytics</li>
                  </ul>

                  <p className="mb-4">
                    You can control cookie preferences through your browser settings. However, disabling essential 
                    cookies may impact service functionality and emergency response capabilities.
                  </p>
                </section>

                <Separator className="my-6" />

                <section id="user-rights" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    8. Your Privacy Rights
                  </h3>

                  <h4 className="font-semibold mb-3">Access and Portability:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Request a copy of your personal data</li>
                    <li>Export data in machine-readable format</li>
                    <li>Review data processing activities</li>
                    <li>Obtain information about data sharing</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Correction and Updates:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Update personal and emergency contact information</li>
                    <li>Correct inaccurate medical data</li>
                    <li>Modify privacy preferences and settings</li>
                    <li>Update consent and authorization settings</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Deletion and Restriction:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Request deletion of personal data (right to be forgotten)</li>
                    <li>Restrict processing for specific purposes</li>
                    <li>Object to automated decision-making</li>
                    <li>Withdraw consent where applicable</li>
                  </ul>

                  <div className="bg-muted/50 border rounded-lg p-4 mb-4">
                    <p className="font-semibold mb-2">Emergency Data Limitations:</p>
                    <p className="text-sm">
                      Some rights may be limited for emergency response data required for legal compliance, 
                      incident investigation, or ongoing emergency situations. We will explain any limitations 
                      when responding to your requests.
                    </p>
                  </div>

                  <p className="mb-4">
                    To exercise your rights, contact us at 
                    <a href="mailto:lifelinksync@gmail.com" className="text-primary hover:underline ml-1">
                      lifelinksync@gmail.com
                    </a>. 
                    We will respond to requests within 30 days.
                  </p>
                </section>

                <Separator className="my-6" />

                <section id="data-retention" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-primary" />
                    9. Data Retention
                  </h3>

                  <h4 className="font-semibold mb-3">Retention Periods:</h4>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li><strong>Account Data:</strong> Retained while account is active plus 2 years</li>
                    <li><strong>Emergency Incident Data:</strong> 7 years for legal and medical requirements</li>
                    <li><strong>Medical Information:</strong> 10 years or as required by healthcare regulations</li>
                    <li><strong>Communication Records:</strong> 3 years for quality assurance</li>
                    <li><strong>Analytics Data:</strong> Anonymized and retained for service improvement</li>
                  </ul>

                  <h4 className="font-semibold mb-3">Secure Deletion:</h4>
                  <p className="mb-4">
                    When data is no longer required, we securely delete it using industry-standard methods. 
                    Some anonymized data may be retained for statistical analysis and service improvement.
                  </p>

                  <h4 className="font-semibold mb-3">Legal Holds:</h4>
                  <p className="mb-4">
                    Data may be retained longer when required for legal proceedings, regulatory investigations, 
                    or ongoing emergency incident resolution.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">10. Contact and Complaints</h3>
                  <p className="mb-4">
                    <strong>Data Protection Officer:</strong> For privacy questions and concerns, contact our 
                    Data Protection Officer at 
                    <a href="mailto:lifelinksync@gmail.com" className="text-primary hover:underline ml-1">
                      lifelinksync@gmail.com
                    </a>
                  </p>
                  <p className="mb-4">
                    <strong>Regulatory Complaints:</strong> You have the right to file complaints with your 
                    local data protection authority if you believe we have violated privacy laws.
                  </p>
                  <p className="mb-4">
                    <strong>Emergency Privacy Concerns:</strong> For urgent privacy matters during emergencies, 
                    contact our 24/7 support line through the emergency assistance features in the app.
                  </p>
                </section>

                {showActions && (
                  <div className="bg-muted/30 border rounded-lg p-4 mt-8">
                    <p className="text-sm text-muted-foreground">
                      {t('legal.privacy.consentText')}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {showActions && (
          <div className="flex-shrink-0 border-t pt-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {hasScrolledToBottom ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 border-2 border-muted-foreground rounded-full" />
                )}
                {hasScrolledToBottom ? t('legal.privacy.policyReviewed') : t('legal.privacy.pleaseScroll')}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onDecline}>
                  {t('legal.privacy.decline')}
                </Button>
                <Button
                  onClick={onAccept}
                  disabled={!hasScrolledToBottom}
                  className="min-w-24"
                >
                  {t('legal.privacy.acceptPolicy')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};