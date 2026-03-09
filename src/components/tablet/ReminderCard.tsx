import { Button } from '@/components/ui/button';
import { CheckCircle, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface Reminder {
  id: string;
  message: string;
  from_name: string;
  scheduled_time?: string;
  created_at: string;
}

interface ReminderCardProps {
  reminder: Reminder | null;
  onDismiss: (id: string) => void;
}

export const ReminderCard = ({ reminder, onDismiss }: ReminderCardProps) => {
  const { t } = useTranslation();

  if (!reminder) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 text-center">
        <Bell className="h-10 w-10 text-slate-500 mx-auto mb-3" />
        <p className="text-xl text-slate-400">{t('tablet.reminder.empty', 'No reminders right now')}</p>
        <p className="text-sm text-slate-500 mt-1">{t('tablet.reminder.emptyDesc', 'Your family can send you reminders anytime')}</p>
      </div>
    );
  }

  const timeStr = reminder.scheduled_time
    ? new Date(reminder.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-amber-500/15 border-2 border-amber-400/40 rounded-2xl p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-2">
            {t('tablet.reminder.title', 'Next Reminder')}
          </p>
          <p className="text-2xl md:text-3xl font-semibold text-white leading-snug">
            {reminder.message}
          </p>
          <div className="flex items-center gap-3 mt-3 text-sm text-slate-300">
            {timeStr && <span className="font-medium text-amber-300">{timeStr}</span>}
            <span>{reminder.from_name}</span>
          </div>
        </div>
        <Button
          size="lg"
          variant="outline"
          className="min-h-[56px] px-6 text-base border-amber-400/40 text-amber-200 hover:bg-amber-500/20"
          onClick={() => onDismiss(reminder.id)}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          {t('tablet.reminder.dismiss', 'Got it')}
        </Button>
      </div>
    </div>
  );
};
