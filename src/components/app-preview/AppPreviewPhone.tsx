
import React from "react";
import { useTranslation } from 'react-i18next';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppPreviewConfig } from "@/types/appPreview";

type Props = {
  config: AppPreviewConfig;
  className?: string;
  simulateRealtime?: boolean;
};

const AppPreviewPhone: React.FC<Props> = ({ config, className, simulateRealtime }) => {
  const { t } = useTranslation();
  const mainColor = config.sosColor ? config.sosColor : "hsl(var(--primary))";
  const brandColor = config.primaryColor ? config.primaryColor : "hsl(var(--primary))";

  // Realtime simulation state
  const [heart, setHeart] = React.useState(72);
  const [battery, setBattery] = React.useState(85);
  const [aiActive, setAiActive] = React.useState(true);
  const [reminders, setReminders] = React.useState(2);

  React.useEffect(() => {
    if (!simulateRealtime) return;
    const iv = setInterval(() => {
      setHeart((h) => Math.max(58, Math.min(110, h + (Math.random() * 8 - 4))));
      setBattery((b) => Math.max(1, b - (Math.random() < 0.1 ? 1 : 0)));
      setAiActive((a) => (Math.random() < 0.02 ? !a : a));
      setReminders((r) => (Math.random() < 0.05 ? Math.max(0, r - 1) : r));
    }, 1200);
    return () => clearInterval(iv);
  }, [simulateRealtime]);

  const cardsToShow = simulateRealtime
    ? (() => {
        const includeBattery = config.enableBatteryCard ?? true;
        const includeHR = config.enableHeartRateCard ?? false;
        const includeAI = config.enableAiCard ?? false;
        const includeRem = config.enableRemindersCard ?? false;
        const list: { icon: string; title: string; status: string; description: string }[] = [];
        if (includeBattery)
          list.push({ icon: "battery", title: t('deviceStatus.deviceBattery'), status: `${Math.round(battery)}%`, description: t('deviceStatus.bluetoothStatus') });
        if (includeHR)
          list.push({ icon: "heart", title: t('deviceStatus.healthStatus'), status: `${Math.round(heart)} bpm`, description: t('deviceStatus.liveHeartRate') });
        if (includeAI)
          list.push({ icon: "activity", title: t('deviceStatus.guardianAI'), status: aiActive ? t('deviceStatus.active') : t('deviceStatus.idle'), description: aiActive ? '"How are you feeling today?"' : t('deviceStatus.standingBy') });
        if (includeRem)
          list.push({ icon: "bell", title: t('deviceStatus.reminders'), status: `${reminders} Today`, description: reminders > 0 ? t('deviceStatus.nextIn') : t('deviceStatus.allDone') });
        return list;
      })()
    : (config.cards ?? []);

  return (
    <div className={className}>
      <div className="mx-auto w-full max-w-sm">
        <Card className="relative mx-auto w-full rounded-[2.25rem] border-8 border-black bg-card p-4 shadow-xl">
          {/* Notch */}
          <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-foreground/10" />

          {/* Screen */}
          <div className="relative rounded-[1.75rem] border border-border bg-background p-4">
            {/* Settings icon (top-right) */}
            {config.showSettingsIcon !== false && (
              <button
                className="absolute right-3 top-3 rounded-md p-2 hover:bg-muted/60"
                aria-label="Open settings"
                onClick={() => window.dispatchEvent(new Event("open-device-settings"))}
              >
                {/* Using three-line menu icon via css to avoid extra deps */}
                <span className="block h-0.5 w-4 bg-foreground mb-1" />
                <span className="block h-0.5 w-4 bg-foreground mb-1" />
                <span className="block h-0.5 w-4 bg-foreground" />
              </button>
            )}

            {/* Header */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Preview</div>
              <h3 className="mt-1 text-xl font-semibold" style={{ color: brandColor }}>{config.appName}</h3>
              <p className="text-xs text-muted-foreground">{config.tagline}</p>
            </div>

            <Separator className="my-4" />

            {/* SOS button */}
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full opacity-40 blur-md pulse"
                  style={{
                    background: `radial-gradient(circle, ${mainColor} 0%, transparent 60%)`,
                  }}
                />
                <Button
                  type="button"
                  disabled
                  className="relative h-24 w-24 rounded-full text-foreground shadow-xl hover-scale"
                  style={{ background: mainColor }}
                >
                  <span className="text-center text-sm font-bold leading-tight">
                    {config.sosLabel}
                  </span>
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">{config.sosSubLabel}</div>
              <div className="mt-1 rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">
                {config.voiceLabel}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Cards */}
            <div className="grid grid-cols-1 gap-3">
              {cardsToShow.map((c, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.status}</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{c.description}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AppPreviewPhone;
