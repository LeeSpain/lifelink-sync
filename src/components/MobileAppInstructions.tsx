import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, Download, Settings, Shield, MapPin, Bell } from "lucide-react";

export const MobileAppInstructions = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {t('mobileInstructions.devStatus')}
          </CardTitle>
          <CardDescription>
            {t('mobileInstructions.devStatusDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="w-fit">{t('mobileInstructions.capacitorConfigured')}</Badge>
              <p className="text-sm text-muted-foreground">
                {t('mobileInstructions.nativeSupport')}
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="w-fit">{t('mobileInstructions.emergencyPermissions')}</Badge>
              <p className="text-sm text-muted-foreground">
                {t('mobileInstructions.permissionsDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('mobileInstructions.setupTitle')}
          </CardTitle>
          <CardDescription>
            {t('mobileInstructions.setupDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">{t('mobileInstructions.step1Title')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('mobileInstructions.step1Desc')}
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">{t('mobileInstructions.step2Title')}</h4>
              <div className="bg-gray-100 p-3 rounded-md font-mono text-sm mt-2">
                <div>git pull origin main</div>
                <div>npm install</div>
                <div>npx cap add ios  # for iOS</div>
                <div>npx cap add android  # for Android</div>
                <div>npx cap update ios  # update iOS dependencies</div>
                <div>npx cap update android  # update Android dependencies</div>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">{t('mobileInstructions.step3Title')}</h4>
              <div className="bg-gray-100 p-3 rounded-md font-mono text-sm mt-2">
                <div>npm run build</div>
                <div>npx cap sync</div>
                <div>npx cap run ios  # for iOS device/simulator</div>
                <div>npx cap run android  # for Android device/emulator</div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold">{t('mobileInstructions.hotReloadTitle')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('mobileInstructions.hotReloadDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('mobileInstructions.emergencyFeaturesTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <h4 className="font-semibold">{t('mobileInstructions.locationServices')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('mobileInstructions.locationServicesDesc')}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Bell className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <h4 className="font-semibold">{t('mobileInstructions.pushNotifications')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('mobileInstructions.pushNotificationsDesc')}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Smartphone className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <h4 className="font-semibold">{t('mobileInstructions.emergencyCalls')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('mobileInstructions.emergencyCallsDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Settings className="h-5 w-5" />
            {t('mobileInstructions.devRequirements')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-800">
          <div className="space-y-2">
            <p><strong>{t('mobileInstructions.iosReq')}:</strong> {t('mobileInstructions.iosReqDesc')}</p>
            <p><strong>{t('mobileInstructions.androidReq')}:</strong> {t('mobileInstructions.androidReqDesc')}</p>
            <p><strong>{t('mobileInstructions.physicalDevice')}:</strong> {t('mobileInstructions.physicalDeviceDesc')}</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4 border-yellow-300 hover:bg-yellow-100"
            onClick={() => window.open('https://lovable.dev/blogs/TODO', '_blank')}
          >
            {t('mobileInstructions.readGuide')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};