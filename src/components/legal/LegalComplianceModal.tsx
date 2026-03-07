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

  const legalDocuments = [
    {
      id: "privacy",
      title: "Privacy Policy",
      icon: Shield,
      description: "GDPR-compliant privacy policy covering data collection, processing, and your rights",
      url: "/privacy-policy.html",
      required: true,
      category: "Privacy & Data Protection"
    },
    {
      id: "terms",
      title: "Terms of Service",
      icon: FileText,
      description: "Service terms, user responsibilities, and service limitations",
      url: "/terms-of-service.html",
      required: true,
      category: "Service Agreement"
    },
    {
      id: "emergency",
      title: "Emergency Service Liability",
      icon: AlertTriangle,
      description: "Critical disclaimers about emergency service limitations and user responsibilities",
      url: "/emergency-liability.html",
      required: true,
      category: "Emergency Services"
    },
    {
      id: "medical",
      title: "Medical Data Compliance",
      icon: Heart,
      description: "HIPAA and health data privacy compliance for medical information processing",
      url: "/medical-data-compliance.html",
      required: true,
      category: "Medical Compliance"
    },
    {
      id: "data-processing",
      title: "Data Processing Agreement",
      icon: Database,
      description: "Detailed GDPR Article 13/14 information about data processing activities",
      url: "/data-processing-agreement.html",
      required: true,
      category: "GDPR Compliance"
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
      title: "GDPR Compliance",
      description: "Full compliance with EU General Data Protection Regulation",
      icon: Globe,
      details: [
        "Article 13/14 information provided",
        "Data subject rights implementation",
        "Lawful basis for all processing",
        "Special category data protection",
        "International transfer safeguards"
      ]
    },
    {
      title: "Healthcare Privacy",
      description: "HIPAA and medical data privacy compliance",
      icon: Heart,
      details: [
        "Business Associate Agreement compliance",
        "Minimum necessary standard",
        "Medical data encryption",
        "Healthcare provider coordination",
        "Emergency medical data protocols"
      ]
    },
    {
      title: "Emergency Service Legal Framework",
      description: "Clear liability and responsibility framework for emergency services",
      icon: AlertTriangle,
      details: [
        "Service limitation disclosures",
        "User responsibility definitions",
        "Emergency service coordination",
        "International compliance",
        "Technology dependency disclaimers"
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Legal Compliance Framework
          </DialogTitle>
          <DialogDescription>
            Complete legal documentation ensuring privacy, security, and emergency service compliance
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex-shrink-0">
            <TabsTrigger value="overview">Compliance Overview</TabsTrigger>
            <TabsTrigger value="documents">Legal Documents</TabsTrigger>
            <TabsTrigger value="rights">Your Rights</TabsTrigger>
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
                    Critical Emergency Service Disclaimer
                  </h3>
                  <div className="bg-destructive/10 border border-destructive/20 rounded p-3 mb-3">
                    <p className="text-sm font-medium text-destructive">
                      LifeLink Sync is NOT a replacement for emergency services
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Always contact emergency services directly (911, 112, etc.) for immediate life-threatening emergencies. 
                    This application provides supplementary emergency assistance and cannot guarantee response times or availability.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Data Protection Standards</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• AES-256 encryption for all sensitive data</li>
                      <li>• Role-based access controls</li>
                      <li>• Regular security audits and penetration testing</li>
                      <li>• SOC 2 Type II certified infrastructure</li>
                      <li>• GDPR-compliant data processing</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Medical Data Compliance</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• HIPAA Business Associate compliance</li>
                      <li>• Medical data segregation and encryption</li>
                      <li>• Healthcare provider secure sharing</li>
                      <li>• Patient data accuracy requirements</li>
                      <li>• Emergency medical data protocols</li>
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
                                <Badge variant="destructive" className="text-xs">Required</Badge>
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
                            View
                          </Button>
                          {showActions && doc.required && !isAccepted && (
                            <Button
                              size="sm"
                              onClick={() => handleDocumentAccept(doc.id)}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Accept
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="bg-muted/30 border rounded-lg p-4 mt-6">
                  <h3 className="font-semibold mb-2">Document Downloads</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    All legal documents are available for download and can be accessed at any time.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      Download All (PDF)
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      Email Copy
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
                    Your Data Protection Rights
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">GDPR Rights (EU/EEA)</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Right to access your personal data</li>
                        <li>• Right to rectify inaccurate information</li>
                        <li>• Right to erase your data</li>
                        <li>• Right to restrict processing</li>
                        <li>• Right to data portability</li>
                        <li>• Right to object to processing</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Medical Data Rights</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Access to complete medical information</li>
                        <li>• Medical data accuracy control</li>
                        <li>• Healthcare provider sharing control</li>
                        <li>• Medical alert preferences</li>
                        <li>• Emergency data override understanding</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Contact Your Rights</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Data Protection Officer:</strong></p>
                      <p className="text-muted-foreground">dpo@lifelink-sync.com</p>
                      <p><strong>Privacy Rights:</strong></p>
                      <p className="text-muted-foreground">rights@lifelink-sync.com</p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Medical Data Rights</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Medical Privacy:</strong></p>
                      <p className="text-muted-foreground">medical-privacy@lifelink-sync.com</p>
                      <p><strong>HIPAA Compliance:</strong></p>
                      <p className="text-muted-foreground">hipaa@lifelink-sync.com</p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Supervisory Authorities</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>EU/EEA:</strong></p>
                      <p className="text-muted-foreground">Your local DPA</p>
                      <p><strong>Spain:</strong></p>
                      <p className="text-muted-foreground">AEPD</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-950 dark:border-amber-800">
                  <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">
                    Emergency Data Limitations
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    During active emergencies, some data protection rights may be limited to protect your vital interests. 
                    Emergency medical data may be shared with first responders even if you have restricted data processing, 
                    as this is necessary for life-saving care.
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
                    All required documents accepted
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Please accept all required documents to continue
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Review Later
                </Button>
                <Button 
                  onClick={handleAcceptAll}
                  disabled={!allRequiredAccepted}
                  className="min-w-32"
                >
                  Accept All & Continue
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};