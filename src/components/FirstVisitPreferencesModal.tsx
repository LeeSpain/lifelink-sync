import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, DollarSign, CheckCircle } from 'lucide-react';
import type { SupportedLanguage, SupportedCurrency } from '@/contexts/PreferencesContext';
import { trackCustomEvent } from '@/hooks/usePageTracking';

const FIRST_VISIT_KEY = 'hasVisitedBefore';

export const FirstVisitPreferencesModal: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const { language, currency, setLanguage, setCurrency } = usePreferences();
  
  // Initialize with current preferences from context
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(language);
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(currency);

  useEffect(() => {
    // Check if this is the user's first visit
    const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
    if (!hasVisited) {
      setIsOpen(true);
      // Track modal open
      trackCustomEvent('preferences_modal_opened', {
        modal_type: 'first_visit_preferences',
        user_type: 'new_visitor'
      });
    }
  }, []);

  const handleClose = () => {
    // Mark as visited even if user closes without completing
    localStorage.setItem(FIRST_VISIT_KEY, 'true');
    
    // Track modal dismissal
    trackCustomEvent('preferences_modal_dismissed', {
      modal_type: 'first_visit_preferences',
      user_action: 'closed_without_completion'
    });
    
    setIsOpen(false);
  };

  const handleApplyPreferences = async () => {
    setIsApplying(true);
    
    try {
      console.log('Applying preferences:', { selectedLanguage, selectedCurrency });
      
      // Track preferences selection
      await trackCustomEvent('preferences_selected', {
        modal_type: 'first_visit_preferences',
        language: selectedLanguage,
        currency: selectedCurrency,
        completion_time: Date.now()
      });
      
      // Apply the selected preferences
      setLanguage(selectedLanguage);
      setCurrency(selectedCurrency);
      
      // Mark that the user has visited before
      localStorage.setItem(FIRST_VISIT_KEY, 'true');
      
      console.log('Preferences applied successfully');
      
      setIsApplying(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error applying preferences:', error);
      setIsApplying(false);
    }
  };

  const languageOptions = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  const currencyOptions = [
    { value: 'EUR', label: 'EUR (€)', region: t('preferences.europe') },
    { value: 'GBP', label: 'GBP (£)', region: t('preferences.unitedKingdom') },
    { value: 'USD', label: 'USD ($)', region: t('preferences.unitedStates') },
    { value: 'AUD', label: 'AUD (A$)', region: t('preferences.australia') },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4 bg-card border-border shadow-glow max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-3 sticky top-0 bg-card/95 backdrop-blur-sm pb-4 z-10">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-primary">
            <Globe className="w-8 h-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-poppins text-foreground">
            {t('preferences.welcomeTitle')}
          </DialogTitle>
          <p className="text-muted-foreground">
            {t('preferences.welcomeSubtitle')}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4 px-1 overflow-y-auto flex-1">
          {/* Language Selection */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Globe className="w-4 h-4" />
                {t('preferences.language')}
              </div>
              <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as SupportedLanguage)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('preferences.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.flag}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Currency Selection */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <DollarSign className="w-4 h-4" />
                {t('preferences.currency')}
              </div>
              <Select value={selectedCurrency} onValueChange={(value) => setSelectedCurrency(value as SupportedCurrency)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('preferences.selectCurrency')} />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.region}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <Button 
            onClick={handleApplyPreferences}
            disabled={isApplying}
            className="w-full h-12 bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium shadow-primary transition-smooth"
          >
            {isApplying ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {t('preferences.applyingPreferences')}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {t('preferences.continueToApp')}
              </div>
            )}
          </Button>
        </div>

        <div className="text-center pt-4 sticky bottom-0 bg-card/95 backdrop-blur-sm">
          <p className="text-xs text-muted-foreground">
            {t('preferences.changeAnytime')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};