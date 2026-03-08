import React from 'react';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
] as const;

const CURRENCIES = [
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'Pound', symbol: '£' },
  { value: 'USD', label: 'Dollar', symbol: '$' },
  { value: 'AUD', label: 'AUD', symbol: 'A$' },
] as const;

export const LanguageCurrencySelector: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { language, setLanguage, currency, setCurrency } = usePreferences();

  const currentLang = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];
  const currentCurrency = CURRENCIES.find(c => c.value === currency) || CURRENCIES[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1.5 rounded-full border border-border/60 bg-white/80 hover:bg-white hover:border-primary/30 transition-all duration-200 ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
          }`}
        >
          <Globe className={compact ? 'h-3.5 w-3.5 text-muted-foreground' : 'h-4 w-4 text-muted-foreground'} />
          <span className="font-medium text-foreground">{currentLang.flag}</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">{currentCurrency.symbol}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-56 p-0">
        {/* Language Section */}
        <div className="p-3 border-b border-border/50">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Language
          </p>
          <div className="space-y-0.5">
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => setLanguage(lang.value as any)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                  language === lang.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Currency Section */}
        <div className="p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Currency
          </p>
          <div className="space-y-0.5">
            {CURRENCIES.map(curr => (
              <button
                key={curr.value}
                onClick={() => setCurrency(curr.value as any)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                  currency === curr.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className="w-5 text-center font-medium">{curr.symbol}</span>
                <span>{curr.label}</span>
                <span className="text-muted-foreground ml-auto text-xs">{curr.value}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LanguageCurrencySelector;
