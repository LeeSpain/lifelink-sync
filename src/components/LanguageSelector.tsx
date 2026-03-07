import { usePreferences } from '@/contexts/PreferencesContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { language, setLanguage } = usePreferences();

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
    </div>
  );
};

export default LanguageSelector;