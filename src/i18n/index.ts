import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '@/locales/en/common.json';
import nl from '@/locales/nl/common.json';
import es from '@/locales/es/common.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      nl: { translation: nl },
      es: { translation: es },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      // We also persist manually via localStorage in PreferencesContext
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
