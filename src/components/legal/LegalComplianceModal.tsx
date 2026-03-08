import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  FileText,
  AlertTriangle,
  Heart,
  Database,
  Globe,
  CheckCircle,
  ExternalLink,
  Download
} from "lucide-react";
import { useTranslation } from 'react-i18next';

interface LegalComplianceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showActions?: boolean;
  onAcceptAll?: () => void;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({
  open,
  onOpenChange,
  showActions = false,
  onAcceptAll
}) => {
  const [acceptedDocuments, setAcceptedDocuments] = useState<Record<string, boolean>>({});
  const { t } = useTranslation();

  const legalDocuments = [
    {
      id: "privacy",
      title: t('legal.compliance.docPrivacyTitle'),
      icon: Shield,
      description: t('legal.compliance.docPrivacyDesc'),
      url: "/privacy-policy.html",
      required: true,
      category: t('legal.compliance.catPrivacy')
    },
    {
      id: "terms",
      title: t('legal.compliance.docTermsTitle'),
      icon: FileText,
      description: t('legal.compliance.docTermsDesc'),
      url: "/terms-of-service.html",
      required: true,
      category: t('legal.compliance.catService')
    },
    {
      id: "emergency",
      title: t('legal.compliance.docEmergencyTitle'),
      icon: AlertTriangle,
      description: t('legal.compliance.docEmergencyDesc'),
      url: "/emergency-liability.html",
      required: true,
      category: t('legal.compliance.catEmergency')
    },
    {
      id: "medical",
      title: t('legal.compliance.docMedicalTitle'),
      icon: Heart,
      description: t('legal.compliance.docMedicalDesc'),
      url: "/medical-data-compliance.html",
      required: true,
      category: t('legal.compliance.catMedical')
    },
    {
      id: "data-processing",
      title: t('legal.compliance.docDataTitle'),
      icon: Database,
      description: t('legal.compliance.docDataDesc'),
      url: "/data-processing-agreement.html",
      required: true,
      category: t('legal.compliance.catGdpr')
    }
  ];

  const handleDocumentAccept = (documentId: string) => {
    setAcceptedDocuments(prev => ({
      ...prev,
      [documentId]: true
    }));
  };

  const allRequiredAccepted = legalDocuments
    .filter(doc => doc.required)
    .every(doc => acceptedDocuments[doc.id]);

  const handleAcceptAll = () => {
    if (allRequiredAccepted && onAcceptAll) {
      onAcceptAll();
    }
  };

  const openDocument = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const complianceFeatures = [
    {
      title: t('legal.compliance.gdprTitle'),
      description: t('legal.compliance.gdprDesc'),
      icon: Globe,
      details: [
        t('legal.compliance.gdprDetail1'),
        t('legal.compliance.gdprDetail2'),
        t('legal.compliance.gdprDetail3'),
        t('legal.compliance.gdprDetail4'),
        t('legal.compliance.gdprDetail5')
      ]
    },
    {
      title: t('legal.compliance.healthcareTitle'),
      description: t('legal.compliance.healthcareDesc'),
      icon: Heart,
      details: [
        t('legal.compliance.healthcareDetail1'),
        t('legal.compliance.healthcareDetail2'),
        t('legal.compliance.healthcareDetail3'),
        t('legal.compliance.healthcareDetail4'),
        t('legal.compliance.healthcareDetail5')
      ]
    },
    {
      title: t('legal.compliance.emergencyFrameworkTitle'),
      description: t('legal.compliance.emergencyFrameworkDesc'),
      icon: AlertTriangle,
      details: [
        t('legal.compliance.emergencyDetail1'),
        t('legal.compliance.emergencyDetail2'),
        t('legal.compliance.emergencyDetail3'),
        t('legal.compliance.emergencyDetail4'),
        t('legal.compliance.emergencyDetail5')
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {t('legal.compliance.title')}
          </DialogTitle>
          <DialogDescription>
            {t('legal.compliance.description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex-shrink-0">
            <TabsTrigger value="overview">{t('legal.compliance.tabOverview')}</TabsTrigger>
            <TabsTrigger value="documents">{t('legal.compliance.tabDocuments')}</TabsTrigger>
            <TabsTrigger value="rights">{t('legal.compliance.tabRights')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-6 p-1">
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                  {complianceFeatures.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div key={feature.title} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">{feature.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {feature.description}
                        </p>
                        <ul className="space-y-1">
                          {feature.details.map((detail, index) => (
                            <li key={index} className="flex items-center gap-2 text-xs">
                              <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-muted/30 border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    {t('legal.compliance.criticalDisclaimer')}
                  </h3>
                  <div className="bg-destructive/10 border border-destructive/20 rounded p-3 mb-3">
                    <p className="text-sm font-medium text-destructive">
                      {t('legal.compliance.notReplacement')}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('legal.compliance.contactEmergency')}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{t('legal.compliance.dataProtectionTitle')}</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {t('legal.compliance.dataProtection1')}</li>
                      <li>• {t('legal.compliance.dataProtection2')}</li>
                      <li>• {t('legal.compliance.dataProtection3')}</li>
                      <li>• {t('legal.compliance.dataProtection4')}</li>
                      <li>• {t('legal.compliance.dataProtection5')}</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{t('legal.compliance.medicalComplianceTitle')}</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• {t('legal.compliance.medicalCompliance1')}</li>
                      <li>• {t('legal.compliance.medicalCompliance2')}</li>
                      <li>• {t('legal.compliance.medicalCompliance3')}</li>
                      <li>• {t('legal.compliance.medicalCompliance4')}</li>
                      <li>• {t('legal.compliance.medicalCompliance5')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="documents" className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-1">
                {legalDocuments.map((doc) => {
                  const Icon = doc.icon;
                  const isAccepted = acceptedDocuments[doc.id];
                  
                  return (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{doc.title}</h3>
                              {doc.required && (
                                <Badge variant="destructive" className="text-xs">{t('legal.compliance.required')}</Badge>
                              )}
                              {isAccepted && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {doc.description}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {doc.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDocument(doc.url)}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {t('legal.compliance.view')}
                          </Button>
                          {showActions && doc.required && !isAccepted && (
                            <Button
                              size="sm"
                              onClick={() => handleDocumentAccept(doc.id)}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              {t('legal.compliance.accept')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="bg-muted/30 border rounded-lg p-4 mt-6">
                  <h3 className="font-semibold mb-2">{t('legal.compliance.documentDownloads')}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('legal.compliance.documentsAvailable')}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {t('legal.compliance.downloadAll')}
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {t('legal.compliance.emailCopy')}
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rights" className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-6 p-1">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {t('legal.compliance.yourDataRights')}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">{t('legal.compliance.gdprRightsTitle')}</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• {t('legal.compliance.gdprRight1')}</li>
                        <li>• {t('legal.compliance.gdprRight2')}</li>
                        <li>• {t('legal.compliance.gdprRight3')}</li>
                        <li>• {t('legal.compliance.gdprRight4')}</li>
                        <li>• {t('legal.compliance.gdprRight5')}</li>
                        <li>• {t('legal.compliance.gdprRight6')}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">{t('legal.compliance.medicalRightsTitle')}</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• {t('legal.compliance.medicalRight1')}</li>
                        <li>• {t('legal.compliance.medicalRight2')}</li>
                        <li>• {t('legal.compliance.medicalRight3')}</li>
                        <li>• {t('legal.compliance.medicalRight4')}</li>
                        <li>• {t('legal.compliance.medicalRight5')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{t('legal.compliance.contactRights')}</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>{t('legal.compliance.dpoLabel')}:</strong></p>
                      <p className="text-muted-foreground">dpo@lifelink-sync.com</p>
                      <p><strong>{t('legal.compliance.privacyRightsLabel')}:</strong></p>
                      <p className="text-muted-foreground">rights@lifelink-sync.com</p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{t('legal.compliance.medicalDataRightsTitle')}</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>{t('legal.compliance.medicalPrivacyLabel')}:</strong></p>
                      <p className="text-muted-foreground">medical-privacy@lifelink-sync.com</p>
                      <p><strong>{t('legal.compliance.hipaaLabel')}:</strong></p>
                      <p className="text-muted-foreground">hipaa@lifelink-sync.com</p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{t('legal.compliance.supervisoryTitle')}</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>EU/EEA:</strong></p>
                      <p className="text-muted-foreground">{t('legal.compliance.yourLocalDpa')}</p>
                      <p><strong>{t('legal.compliance.spain')}:</strong></p>
                      <p className="text-muted-foreground">AEPD</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-950 dark:border-amber-800">
                  <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">
                    {t('legal.compliance.emergencyDataLimitations')}
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t('legal.compliance.emergencyDataDescription')}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {showActions && (
          <div className="flex-shrink-0 border-t pt-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {allRequiredAccepted ? (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {t('legal.compliance.allAccepted')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    {t('legal.compliance.pleaseAcceptAll')}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {t('legal.compliance.reviewLater')}
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  disabled={!allRequiredAccepted}
                  className="min-w-32"
                >
                  {t('legal.compliance.acceptAllContinue')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};