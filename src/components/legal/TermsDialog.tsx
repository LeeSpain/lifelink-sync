import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, FileText, Scale, Shield, CreditCard, Users, AlertTriangle } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
  onDecline?: () => void;
  showActions?: boolean;
}

export const TermsDialog: React.FC<TermsDialogProps> = ({ 
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
    { id: "acceptance", title: t('legal.terms.navAcceptance'), icon: CheckCircle },
    { id: "services", title: t('legal.terms.navServices'), icon: Shield },
    { id: "emergency", title: t('legal.terms.navEmergency'), icon: AlertTriangle },
    { id: "user-responsibilities", title: t('legal.terms.navResponsibilities'), icon: Users },
    { id: "payments", title: t('legal.terms.navPayments'), icon: CreditCard },
    { id: "liability", title: t('legal.terms.navLiability'), icon: Scale },
    { id: "termination", title: t('legal.terms.navTermination'), icon: FileText },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            {t('legal.terms.title')}
          </DialogTitle>
          <DialogDescription>
            {t('legal.terms.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-6 min-h-0">
          {/* Table of Contents */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-0">
              <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">{t('legal.terms.contents')}</h4>
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
                  <strong>{t('legal.terms.lastUpdated')}:</strong> {currentYear} | <strong>{t('legal.terms.effectiveDate')}:</strong> {t('legal.terms.january1')} {currentYear}
                </div>

                <section id="acceptance" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    1. Acceptance of Terms
                  </h3>
                  <p className="mb-4">
                    By accessing, downloading, installing, or using LifeLink Sync ("the Service"), you ("User," "you," or "your") 
                    agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
                  </p>
                  <p className="mb-4">
                    These Terms constitute a legally binding agreement between you and LifeLink Sync ("Company," "we," "us," or "our"). 
                    We reserve the right to modify these Terms at any time, with changes becoming effective immediately upon posting.
                  </p>
                </section>

                <Separator className="my-6" />

                <section id="services" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    2. Service Description
                  </h3>
                  <p className="mb-4">
                    LifeLink Sync provides emergency response coordination services, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Emergency contact notification systems</li>
                    <li>Location tracking during active emergencies</li>
                    <li>Medical information access for first responders</li>
                    <li>Integration with emergency services where available</li>
                    <li>Family and carer notification services</li>
                  </ul>
                  <p className="mb-4">
                    The Service is designed to assist in emergency situations but does not replace traditional emergency services. 
                    Always contact local emergency services (911, 112, etc.) directly for immediate life-threatening emergencies.
                  </p>
                </section>

                <Separator className="my-6" />

                <section id="emergency" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    3. Emergency Services Disclaimer
                  </h3>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                    <p className="font-semibold text-destructive mb-2">CRITICAL DISCLAIMER:</p>
                    <p className="text-sm">
                      LifeLink Sync is NOT a replacement for emergency services. In life-threatening situations, 
                      contact emergency services directly (911, 112, etc.) before using our service.
                    </p>
                  </div>
                  <p className="mb-4">
                    <strong>Service Limitations:</strong>
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Service availability depends on internet connectivity and device functionality</li>
                    <li>Response times are not guaranteed and may vary based on circumstances</li>
                    <li>Location accuracy depends on device GPS and network conditions</li>
                    <li>Service may be unavailable during maintenance, technical issues, or force majeure events</li>
                    <li>International coverage may be limited</li>
                  </ul>
                  <p className="mb-4">
                    You acknowledge that technology failures, network outages, or service interruptions may occur, 
                    and the Company shall not be liable for any consequences resulting from such events.
                  </p>
                </section>

                <Separator className="my-6" />

                <section id="user-responsibilities" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    4. User Responsibilities
                  </h3>
                  <p className="mb-4">
                    <strong>You agree to:</strong>
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Provide accurate and up-to-date personal and medical information</li>
                    <li>Maintain current emergency contact information</li>
                    <li>Use the Service only for legitimate emergency situations</li>
                    <li>Comply with all applicable laws and regulations</li>
                    <li>Keep your account credentials secure</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                    <li>Maintain device compatibility and software updates</li>
                  </ul>
                  <p className="mb-4">
                    <strong>Prohibited Uses:</strong>
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>False emergency reports or misuse of emergency services</li>
                    <li>Sharing account access with unauthorized individuals</li>
                    <li>Attempting to circumvent security measures</li>
                    <li>Using the Service for illegal activities</li>
                    <li>Interfering with the Service's operation or other users' access</li>
                  </ul>
                </section>

                <Separator className="my-6" />

                <section id="payments" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    5. Payment Terms
                  </h3>
                  <p className="mb-4">
                    <strong>Subscription Services:</strong>
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Subscription fees are billed in advance on a recurring basis</li>
                    <li>Prices are subject to change with 30 days' notice</li>
                    <li>All fees are non-refundable except as required by law</li>
                    <li>Failure to pay may result in service suspension or termination</li>
                    <li>Taxes and additional charges may apply based on location</li>
                  </ul>
                  <p className="mb-4">
                    <strong>Cancellation:</strong> You may cancel your subscription at any time. 
                    Cancellation takes effect at the end of your current billing period. 
                    No refunds will be provided for partial billing periods.
                  </p>
                  <p className="mb-4">
                    <strong>Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled. 
                    You are responsible for cancelling before the next billing cycle.
                  </p>
                </section>

                <Separator className="my-6" />

                <section id="liability" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Scale className="h-5 w-5 text-primary" />
                    6. Limitation of Liability
                  </h3>
                  <div className="bg-muted/50 border rounded-lg p-4 mb-4">
                    <p className="font-semibold mb-2">LIMITATION OF LIABILITY:</p>
                    <p className="text-sm">
                      TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE COMPANY SHALL NOT BE LIABLE FOR ANY 
                      INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT 
                      NOT LIMITED TO LOSS OF LIFE, INJURY, PROPERTY DAMAGE, OR LOSS OF DATA.
                    </p>
                  </div>
                  <p className="mb-4">
                    <strong>Company Liability Limitations:</strong>
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Maximum liability limited to the amount paid for the Service in the preceding 12 months</li>
                    <li>No liability for emergency service response times or outcomes</li>
                    <li>No liability for third-party emergency service provider actions</li>
                    <li>No liability for technology failures, network outages, or device malfunctions</li>
                    <li>No liability for user-provided information accuracy or completeness</li>
                  </ul>
                  <p className="mb-4">
                    Some jurisdictions do not allow limitation of liability for personal injury or death. 
                    In such jurisdictions, our liability is limited to the maximum extent permitted by law.
                  </p>
                </section>

                <Separator className="my-6" />

                <section id="termination" className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    7. Termination
                  </h3>
                  <p className="mb-4">
                    <strong>User Termination:</strong> You may terminate your account at any time by contacting customer support 
                    or using account deletion features in the application.
                  </p>
                  <p className="mb-4">
                    <strong>Company Termination:</strong> We may suspend or terminate your access immediately for:
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Violation of these Terms</li>
                    <li>Non-payment of fees</li>
                    <li>Fraudulent or illegal activity</li>
                    <li>Misuse of emergency services</li>
                    <li>Threat to service security or integrity</li>
                  </ul>
                  <p className="mb-4">
                    Upon termination, your access to the Service will cease, and we may delete your data 
                    in accordance with our Privacy Policy and data retention requirements.
                  </p>
                </section>

                <Separator className="my-6" />

                <section className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">8. Additional Terms</h3>
                  <p className="mb-4">
                    <strong>Governing Law:</strong> These Terms are governed by the laws of [Jurisdiction], 
                    without regard to conflict of law principles.
                  </p>
                  <p className="mb-4">
                    <strong>Dispute Resolution:</strong> Any disputes shall be resolved through binding arbitration 
                    in accordance with the rules of [Arbitration Body].
                  </p>
                  <p className="mb-4">
                    <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, 
                    constitute the entire agreement between you and the Company.
                  </p>
                  <p className="mb-4">
                    <strong>Contact Information:</strong> For questions about these Terms, contact us at 
                    <a href="mailto:lifelinksync@gmail.com" className="text-primary hover:underline ml-1">
                      lifelinksync@gmail.com
                    </a>
                  </p>
                </section>

                {showActions && (
                  <div className="bg-muted/30 border rounded-lg p-4 mt-8">
                    <p className="text-sm text-muted-foreground">
                      {t('legal.terms.consentText')}
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
                {hasScrolledToBottom ? t('legal.terms.documentReviewed') : t('legal.terms.pleaseScroll')}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onDecline}>
                  {t('legal.terms.decline')}
                </Button>
                <Button
                  onClick={onAccept}
                  disabled={!hasScrolledToBottom}
                  className="min-w-24"
                >
                  {t('legal.terms.acceptTerms')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};