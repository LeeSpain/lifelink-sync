import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import i18n from '@/i18n';
import { supabase } from '@/integrations/supabase/client';

export type SupportedLanguage = 'en' | 'nl' | 'es';
export type SupportedCurrency = 'EUR' | 'GBP' | 'USD' | 'AUD';

interface PreferencesContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  currency: SupportedCurrency;
  setCurrency: (cur: SupportedCurrency) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => (localStorage.getItem('lang') as SupportedLanguage) || 'en');
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => (localStorage.getItem('currency') as SupportedCurrency) || 'EUR');
  const [userId, setUserId] = useState<string | null>(null);

  // Load user's language preference from profile on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);

          // Fetch user profile to get language preference
          const { data: profile } = await supabase
            .from('profiles')
            .select('preferred_language, language_preference')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            // Use preferred_language or language_preference from profile
            const savedLang = (profile.preferred_language || profile.language_preference) as SupportedLanguage;
            if (savedLang && ['en', 'nl', 'es'].includes(savedLang)) {
              setLanguageState(savedLang);
              localStorage.setItem('lang', savedLang);
              i18n.changeLanguage(savedLang).catch(() => {});
            }
          }
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };

    loadUserPreferences();
  }, []);

  const setLanguage = async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
    i18n.changeLanguage(lang).catch(() => {});

    // Save to user profile if logged in
    if (userId) {
      try {
        await supabase
          .from('profiles')
          .update({
            preferred_language: lang,
            language_preference: lang,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        console.log(`Language preference saved to profile: ${lang}`);
      } catch (error) {
        console.error('Error saving language preference to profile:', error);
      }
    }
  };

  const setCurrency = (cur: SupportedCurrency) => {
    setCurrencyState(cur);
    localStorage.setItem('currency', cur);
  };

  useEffect(() => {
    // Ensure i18n matches state on first render
    i18n.changeLanguage(language).catch(() => {});
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, currency, setCurrency }), [language, currency, userId]);

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
};
