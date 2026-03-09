import { Users, Pill } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FamilyMessagesCard, type FamilyMessage } from './FamilyMessagesCard';

interface QuickInfoCardsProps {
  familyOnline: number;
  messages: FamilyMessage[];
  onViewMessages: () => void;
}

export const QuickInfoCards = ({ familyOnline, messages, onViewMessages }: QuickInfoCardsProps) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-4">
      <FamilyMessagesCard messages={messages} onViewAll={onViewMessages} />

      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <Pill className="h-7 w-7 text-green-400 mb-3" />
        <p className="text-lg font-semibold text-white">{t('tablet.quickInfo.wellness', 'Wellness')}</p>
        <p className="text-sm text-slate-400 mt-1">{t('tablet.quickInfo.allGood', 'All good today')}</p>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <Users className="h-7 w-7 text-purple-400 mb-3" />
        <p className="text-lg font-semibold text-white">{t('tablet.quickInfo.family', 'Family')}</p>
        <p className="text-sm text-slate-400 mt-1">
          {familyOnline > 0 ? t('tablet.quickInfo.online', '{{count}} online', { count: familyOnline }) : t('tablet.quickInfo.checking', 'Checking...')}
        </p>
      </div>
    </div>
  );
};
