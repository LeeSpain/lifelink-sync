import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, Download, Settings, Shield, MapPin, Bell } from "lucide-react";

export const MobileAppInstructions = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile App Development Status
          </CardTitle>
          <CardDescription>
            LifeLink Sync is now configured for native mobile app development using Capacitor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="w-fit">✅ Capacitor Configured</Badge>
              <p className="text-sm text-muted-foreground">
                Native iOS and Android support enabled
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="w-fit">✅ Emergency Permissions</Badge>
              <p className="text-sm text-muted-foreground">
                Location, calls, and background access configured
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Development Setup Instructions
          </CardTitle>
          <CardDescription>
            Follow these steps to run the mobile app on a physical device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">Step 1: Export to GitHub</h4>
              <p className="text-sm text-muted-foreground">
                Use the "Export to GitHub" button to transfer the project to your repository
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">Step 2: Local Setup</h4>
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
              <h4 className="font-semibold">Step 3: Build and Deploy</h4>
              <div className="bg-gray-100 p-3 rounded-md font-mono text-sm mt-2">
                <div>npm run build</div>
                <div>npx cap sync</div>
                <div>npx cap run ios  # for iOS device/simulator</div>
                <div>npx cap run android  # for Android device/emulator</div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold">🔥 Hot Reload Enabled</h4>
              <p className="text-sm text-muted-foreground">
                Your mobile app will automatically reload changes from the Lovable sandbox! 
                After initial setup, you only need to run <code className="bg-gray-200 px-1 rounded">npx cap sync</code> when pulling new code.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Emergency Features Configured
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <h4 className="font-semibold">Location Services</h4>
              <p className="text-sm text-muted-foreground">
                High-accuracy GPS with background access
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Bell className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <h4 className="font-semibold">Push Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Emergency alerts and family notifications
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Smartphone className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <h4 className="font-semibold">Emergency Calls</h4>
              <p className="text-sm text-muted-foreground">
                Direct calling integration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Settings className="h-5 w-5" />
            Development Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-800">
          <div className="space-y-2">
            <p><strong>For iOS Development:</strong> macOS with Xcode installed</p>
            <p><strong>For Android Development:</strong> Android Studio installed</p>
            <p><strong>Physical Device:</strong> Recommended for testing emergency features</p>
          </div>
          <Button 
            variant="outline" 
            className="mt-4 border-yellow-300 hover:bg-yellow-100"
            onClick={() => window.open('https://lovable.dev/blogs/TODO', '_blank')}
          >
            Read Mobile Development Guide
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};