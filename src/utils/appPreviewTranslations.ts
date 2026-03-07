import { AppPreviewConfig } from "@/types/appPreview";

export const getTranslatedAppPreview = (t: (key: string) => string): AppPreviewConfig => ({
  appName: t('appPreview.appName'),
  tagline: t('appPreview.tagline'),
  primaryColor: "#ef4444",
  sosColor: "#22c55e",
  voiceLabel: t('appPreview.voiceOff'),
  sosLabel: t('appPreview.emergencySOS'),
  sosSubLabel: t('appPreview.tapForHelp'),
  cards: [
    { 
      icon: "battery", 
      title: t('deviceStatus.deviceBattery'), 
      status: "88%", 
      description: t('deviceStatus.bluetoothStatus') 
    },
  ],
  showSettingsIcon: true,
  enableBatteryCard: true,
  enableHeartRateCard: false,
  enableAiCard: false,
  enableRemindersCard: false,
});