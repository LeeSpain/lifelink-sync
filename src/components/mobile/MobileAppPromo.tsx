import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Download, Apple, Play, Zap } from "lucide-react";

export const MobileAppPromo = () => {
  const handleDownload = (platform: 'ios' | 'android') => {
    // In production, these would be actual app store links
    const links = {
      ios: 'https://apps.apple.com/app/lifelink-sync',
      android: 'https://play.google.com/store/apps/details?id=com.icecos.lite'
    };
    
    // For now, show coming soon message
    alert(`${platform === 'ios' ? 'iOS' : 'Android'} app coming soon! We'll notify you when it's available.`);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Get the Mobile App
          <Badge variant="secondary" className="ml-auto">
            Coming Soon
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Get the full LifeLink Sync experience with our native mobile apps. Background location tracking, 
          instant emergency triggers, and offline capabilities.
        </p>

        <div className="space-y-3">
          <h4 className="font-semibold">Mobile App Features:</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Instant SOS Trigger</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Background GPS</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Offline Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Widget Support</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleDownload('ios')}
          >
            <Apple className="h-4 w-4 mr-2" />
            iOS App
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleDownload('android')}
          >
            <Play className="h-4 w-4 mr-2" />
            Android App
          </Button>
        </div>

        <div className="text-center">
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Notify me when available
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};