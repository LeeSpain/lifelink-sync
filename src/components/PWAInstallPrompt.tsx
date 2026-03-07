import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { usePWAFeatures } from '@/hooks/usePWAFeatures';

export const PWAInstallPrompt = () => {
  const { isInstallable, installApp, isInstalled } = usePWAFeatures();
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setHasBeenDismissed(true);
      return;
    }

    // Show prompt after a delay if installable and not already installed
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    await installApp();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setHasBeenDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed, not installable, dismissed, or not showing
  if (isInstalled || !isInstallable || hasBeenDismissed || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:max-w-sm">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Install LifeLink Sync</h3>
            <p className="text-muted-foreground text-xs mb-3">
              Install our app for faster access and offline emergency features.
            </p>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleInstall}
                className="flex-1 h-8 text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Install
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDismiss}
                className="h-8 w-8 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};