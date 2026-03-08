import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Download,
  CheckCircle,
  Monitor,
  Share,
  PlusSquare,
  Wifi,
  Bell,
  Zap,
  QrCode,
} from "lucide-react";
import { useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";
import { usePWAFeatures } from "@/hooks/usePWAFeatures";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

const MobileAppCard = () => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isInstalled, isInstallable, installApp } = usePWAFeatures();
  const platform = useMemo(() => detectPlatform(), []);

  const WEB_APP_URL = window.location.origin;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, WEB_APP_URL, {
        width: 128,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      }).catch(console.error);
    }
  }, [WEB_APP_URL]);

  return (
    <Card className="bg-white/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-green-500" />
          {t("mobileApp.getTheApp", "Get the App")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Section A: Install Status & Button */}
          {isInstalled ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900">
                  {t("mobileApp.installedTitle", "LifeLink Sync is installed on this device")}
                </p>
                <p className="text-sm text-green-700">
                  {t("mobileApp.installedDesc", "You can launch it from your home screen or app dock.")}
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="text-center p-6 bg-primary/5 border border-primary/20 rounded-lg">
              <Download className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">
                {t("mobileApp.installReady", "Ready to install")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("mobileApp.installReadyDesc", "Install LifeLink Sync directly to your device. No app store needed.")}
              </p>
              <Button size="lg" className="min-h-[48px] px-8" onClick={installApp}>
                <Download className="h-4 w-4 mr-2" />
                {t("mobileApp.installButton", "Install LifeLink Sync")}
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-900 mb-1">
                {t("mobileApp.manualInstall", "Install as an app")}
              </p>
              <p className="text-sm text-blue-700">
                {t("mobileApp.manualInstallDesc", "Follow the instructions below for your device.")}
              </p>
            </div>
          )}

          {/* Section B: Platform-Specific Instructions */}
          {!isInstalled && (
            <div className="space-y-3">
              <h4 className="font-medium">
                {t("mobileApp.howToInstall", "How to install")}
              </h4>

              {platform === "ios" && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-700">1</span>
                    </div>
                    <div>
                      <p className="font-medium">{t("mobileApp.iosStep1Title", "Tap the Share button")}</p>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Share className="h-3.5 w-3.5" />
                        {t("mobileApp.iosStep1Desc", "Tap the share icon at the bottom of Safari")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-700">2</span>
                    </div>
                    <div>
                      <p className="font-medium">{t("mobileApp.iosStep2Title", "Add to Home Screen")}</p>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <PlusSquare className="h-3.5 w-3.5" />
                        {t("mobileApp.iosStep2Desc", "Scroll down and tap \"Add to Home Screen\"")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-700">3</span>
                    </div>
                    <div>
                      <p className="font-medium">{t("mobileApp.iosStep3Title", "Confirm")}</p>
                      <p className="text-muted-foreground">
                        {t("mobileApp.iosStep3Desc", "Tap \"Add\" in the top-right corner")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {platform === "android" && (
                <div className="space-y-2 text-sm">
                  {isInstallable ? (
                    <p className="text-muted-foreground p-3 border rounded-lg">
                      {t("mobileApp.androidAuto", "Tap the \"Install LifeLink Sync\" button above. Chrome will handle the rest.")}
                    </p>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-green-700">1</span>
                        </div>
                        <div>
                          <p className="font-medium">{t("mobileApp.androidStep1Title", "Open browser menu")}</p>
                          <p className="text-muted-foreground">
                            {t("mobileApp.androidStep1Desc", "Tap the three-dot menu in Chrome")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-green-700">2</span>
                        </div>
                        <div>
                          <p className="font-medium">{t("mobileApp.androidStep2Title", "Add to Home Screen")}</p>
                          <p className="text-muted-foreground">
                            {t("mobileApp.androidStep2Desc", "Tap \"Add to Home screen\" or \"Install app\"")}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {platform === "desktop" && (
                <div className="space-y-2 text-sm">
                  {isInstallable ? (
                    <p className="text-muted-foreground p-3 border rounded-lg">
                      <Monitor className="h-4 w-4 inline mr-1" />
                      {t("mobileApp.desktopAuto", "Click the \"Install LifeLink Sync\" button above, or look for the install icon in your browser's address bar.")}
                    </p>
                  ) : (
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <Monitor className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        {t("mobileApp.desktopManual", "Open this page in Chrome or Edge, then look for the install icon in the address bar, or use the browser menu to install.")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* QR Code — scan from another device */}
          <div className="text-center p-5 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">
                {t("mobileApp.scanFromDevice", "Install on another device")}
              </h4>
            </div>
            <div className="w-32 h-32 mx-auto mb-3 bg-white rounded-lg flex items-center justify-center border p-2">
              <canvas ref={canvasRef} className="max-w-full max-h-full" />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("mobileApp.scanQrDesc", "Scan this QR code on your phone or tablet to open LifeLink Sync")}
            </p>
          </div>

          {/* Section C: What You Get */}
          <div className="space-y-3">
            <h4 className="font-medium">
              {t("mobileApp.benefits", "What you get")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { icon: Zap, text: t("mobileApp.benefitFast", "Fast launch from home screen") },
                { icon: Wifi, text: t("mobileApp.benefitOffline", "Works offline for emergencies") },
                { icon: Bell, text: t("mobileApp.benefitNotifications", "Push notifications for alerts") },
                { icon: Download, text: t("mobileApp.benefitNoStore", "No app store required") },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 p-2.5 border rounded-lg text-sm">
                  <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Tablet Dashboard Section */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-1">
              {t("mobileApp.tabletTitle", "Tablet Home Dashboard")}
            </h4>
            <p className="text-sm text-purple-700 mb-3">
              {t("mobileApp.tabletDesc", "Set up a tablet as an always-on display — perfect for elderly care. Shows time, reminders from family, SOS button, and more.")}
            </p>
            <Button asChild variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-100">
              <a href="/tablet-dashboard">
                {t("mobileApp.tabletOpen", "Open Tablet Dashboard")}
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileAppCard;
