import { usePreferences } from '@/contexts/PreferencesContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';

export const LanguageCurrencySelector: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { language, setLanguage, currency, setCurrency } = usePreferences();
  
  console.log('LanguageCurrencySelector - Current values:', { language, currency });

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'ml-2'}`}>
      <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
        <SelectTrigger className="h-8 w-[120px]">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="nl">Nederlands</SelectItem>
          <SelectItem value="es">Español</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currency} onValueChange={(v) => {
        console.log('Currency changing from', currency, 'to', v);
        setCurrency(v as any);
      }}>
        <SelectTrigger className="h-8 w-[120px]">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EUR">EUR (€)</SelectItem>
          <SelectItem value="GBP">GBP (£)</SelectItem>
          <SelectItem value="USD">USD ($)</SelectItem>
          <SelectItem value="AUD">AUD (A$)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageCurrencySelector;
