import { Users, Pill, Clock, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FamilyMessagesCard, type FamilyMessage } from './FamilyMessagesCard';

export type ClaraStatus = 'listening' | 'speaking' | 'offline' | 'idle';

interface QuickInfoCardsProps {
  familyOnline: number;
  messages: FamilyMessage[];
  onViewMessages: () => void;
  nextMedication?: string;
  claraStatus?: ClaraStatus;
  onClaraClick?: () => void;
}

const claraColors: Record<ClaraStatus, { icon: string; dot: string }> = {
  listening: { icon: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse' },
  speaking: { icon: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' },
  offline: { icon: 'text-red-400', dot: 'bg-red-400' },
  idle: { icon: 'text-slate-400', dot: 'bg-slate-500' },
};

export const QuickInfoCards = ({
  familyOnline,
  messages,
  onViewMessages,
  nextMedication,
  claraStatus = 'idle',
  onClaraClick,
}: QuickInfoCardsProps) => {
  const { t } = useTranslation();
  const colors = claraColors[claraStatus];

  const claraLabel =
    claraStatus === 'listening'
      ? t('tablet.quickInfo.claraListening', 'Listening...')
      : claraStatus === 'speaking'
        ? t('tablet.quickInfo.claraSpeaking', 'Speaking...')
        : claraStatus === 'offline'
          ? t('tablet.quickInfo.claraOffline', 'Mic off')
          : t('tablet.quickInfo.claraReady', 'Ready');

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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

      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <Clock className="h-7 w-7 text-blue-400 mb-3" />
        <p className="text-lg font-semibold text-white">{t('tablet.quickInfo.medication', 'Medication')}</p>
        <p className="text-sm text-slate-400 mt-1">
          {nextMedication || t('tablet.quickInfo.noMedication', 'None scheduled')}
        </p>
      </div>

      {/* Clara card */}
      <button
        onClick={onClaraClick}
        className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 text-left hover:bg-slate-700/60 transition-colors"
      >
        <div className="relative inline-block mb-3">
          <Bot className={`h-7 w-7 ${colors.icon}`} />
          <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-800 ${colors.dot}`} />
        </div>
        <p className="text-lg font-semibold text-white">{t('tablet.quickInfo.clara', 'Clara')}</p>
        <p className="text-sm text-slate-400 mt-1">{claraLabel}</p>
      </button>
    </div>
  );
};
