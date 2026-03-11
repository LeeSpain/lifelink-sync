import { Activity, Footprints, BatteryMedium } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VitalReading {
  heartRate?: number;
  steps?: number;
  batteryPercent?: number;
}

interface TabletVitalsStripProps {
  vitals?: VitalReading;
}

export function TabletVitalsStrip({ vitals }: TabletVitalsStripProps) {
  const { t } = useTranslation();

  // Don't render if no vitals data is available
  if (!vitals || (!vitals.heartRate && !vitals.steps && vitals.batteryPercent === undefined)) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-8 px-6 py-2 bg-slate-900/50 border-b border-slate-800">
      {vitals.heartRate != null && (
        <div className="flex items-center gap-2 text-rose-400">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-medium">{vitals.heartRate}</span>
          <span className="text-xs text-slate-500">
            {t('tablet.vitals.heartRate', { defaultValue: 'bpm' })}
          </span>
        </div>
      )}

      {vitals.steps != null && (
        <div className="flex items-center gap-2 text-emerald-400">
          <Footprints className="h-4 w-4" />
          <span className="text-sm font-medium">{vitals.steps.toLocaleString()}</span>
          <span className="text-xs text-slate-500">
            {t('tablet.vitals.steps', { defaultValue: 'steps' })}
          </span>
        </div>
      )}

      {vitals.batteryPercent != null && (
        <div className="flex items-center gap-2 text-amber-400">
          <BatteryMedium className="h-4 w-4" />
          <span className="text-sm font-medium">{vitals.batteryPercent}%</span>
          <span className="text-xs text-slate-500">
            {t('tablet.vitals.battery', { defaultValue: 'pendant' })}
          </span>
        </div>
      )}
    </div>
  );
}
