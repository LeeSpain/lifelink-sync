import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, AlertTriangle, Stethoscope } from "lucide-react";

const LegalComplianceModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const legalPages = [
    {
      id: "privacy",
      title: "Privacy Policy",
      icon: Shield,
      url: "/privacy-policy.html"
    },
    {
      id: "terms",
      title: "Terms of Service", 
      icon: FileText,
      url: "/terms-of-service.html"
    },
    {
      id: "emergency",
      title: "Emergency Liability",
      icon: AlertTriangle,
      url: "/emergency-liability.html"
    },
    {
      id: "medical",
      title: "Medical Compliance",
      icon: Stethoscope,
      url: "/medical-data-compliance.html"
    }
  ];

  const [selectedPage, setSelectedPage] = useState(legalPages[0].id);
  const [pageContent, setPageContent] = useState<{[key: string]: string}>({});

  const loadPageContent = async (url: string, pageId: string) => {
    if (pageContent[pageId]) return; // Already loaded

    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Extract content from HTML (remove head, scripts, etc.)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const body = doc.body;
      
      if (body) {
        // Remove any script tags and style tags
        const scripts = body.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        
        setPageContent(prev => ({
          ...prev,
          [pageId]: body.innerHTML
        }));
      }
    } catch (error) {
      console.error('Failed to load page content:', error);
      setPageContent(prev => ({
        ...prev,
        [pageId]: `<p>Sorry, we couldn't load this content. You can <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline">view it directly here</a>.</p>`
      }));
    }
  };

  const handleTabChange = (pageId: string) => {
    setSelectedPage(pageId);
    const page = legalPages.find(p => p.id === pageId);
    if (page && !pageContent[pageId]) {
      loadPageContent(page.url, pageId);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !pageContent[selectedPage]) {
      const page = legalPages.find(p => p.id === selectedPage);
      if (page) {
        loadPageContent(page.url, selectedPage);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="block text-sm text-muted-foreground hover:text-primary transition-colors text-left">
          Legal & Compliance
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-full h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-primary" />
            Legal & Compliance Documents
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={selectedPage} onValueChange={handleTabChange} className="flex-1 flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-4 h-12">
            {legalPages.map((page) => {
              const Icon = page.icon;
              return (
                <TabsTrigger 
                  key={page.id} 
                  value={page.id}
                  className="flex items-center gap-2 text-sm font-medium px-3 py-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline truncate">{page.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {legalPages.map((page) => (
            <TabsContent key={page.id} value={page.id} className="flex-1 mt-6">
              <div className="h-[calc(85vh-180px)] rounded-lg border border-border bg-card">
                <ScrollArea className="h-full w-full p-6">
                  <div className="max-w-none">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                      <page.icon className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-semibold text-foreground">{page.title}</h2>
                    </div>
                    
                    {pageContent[page.id] ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: pageContent[page.id] }}
                        className="prose prose-base max-w-none text-foreground [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:mb-2 [&>p]:mb-4 [&>p]:leading-relaxed [&>ul]:mb-4 [&>li]:mb-2 [&>.important]:bg-destructive/10 [&>.important]:border-l-4 [&>.important]:border-destructive [&>.important]:p-4 [&>.important]:rounded-r [&>.contact]:bg-muted [&>.contact]:p-4 [&>.contact]:rounded [&>.disclaimer]:text-muted-foreground [&>.disclaimer]:text-sm [&>.emergency]:bg-primary/10 [&>.emergency]:border-l-4 [&>.emergency]:border-primary [&>.emergency]:p-4 [&>.emergency]:rounded-r [&>a]:text-primary [&>a]:underline"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-48">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-base text-muted-foreground">Loading content...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="mt-4 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            These documents outline our commitment to your privacy, security, and compliance with applicable regulations.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalComplianceModal;