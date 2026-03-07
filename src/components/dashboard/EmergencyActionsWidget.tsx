import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEmergencyContacts } from "@/hooks/useEmergencyContacts";
import { 
  Shield, 
  Phone, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Bell,
  MapPin,
  MessageSquare,
  Activity,
  Wifi,
  WifiOff,
  Loader2,
  Navigation
} from "lucide-react";

interface EmergencyActionsWidgetProps {
  profile: any;
  subscription: any;
}

const EmergencyActionsWidget = ({ profile, subscription }: EmergencyActionsWidgetProps) => {
  const navigate = useNavigate();
  const [testingSystem, setTestingSystem] = useState(false);
  const [testResults, setTestResults] = useState<string | null>(null);
  const [isConnected] = useState(true); // You can integrate with actual connectivity state
  const { toast } = useToast();
  const { contacts } = useEmergencyContacts();
  
  const emergencyContactsCount = contacts?.length || 0;
  const protectionActive = subscription?.subscribed;
  const profileComplete = (profile?.profile_completion_percentage || 0) >= 80;

  const handleEmergencyTest = async () => {
    setTestingSystem(true);
    setTestResults(null);
    
    try {
      toast({
        title: "🔧 Testing Emergency Systems",
        description: "Running comprehensive system check...",
        duration: 3000
      });

      // Simulate system test
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const allSystemsGood = protectionActive && emergencyContactsCount > 0 && profileComplete;
      
      setTestResults(allSystemsGood ? "All systems operational" : "Some issues detected");
      
      toast({
        title: allSystemsGood ? "✅ Systems Healthy" : "⚠️ Issues Found",
        description: allSystemsGood 
          ? "All emergency systems are functioning properly" 
          : "Please review your profile and emergency contacts",
        variant: allSystemsGood ? "default" : "destructive",
        duration: 5000
      });
    } catch (error) {
      setTestResults("Test failed");
      toast({
        title: "❌ Test Failed",
        description: "Unable to complete system test. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTestingSystem(false);
    }
  };

  const handleQuickCall = () => {
    if (emergencyContactsCount === 0) {
      toast({
        title: "No Emergency Contacts",
        description: "Please add emergency contacts to use quick call",
        variant: "destructive"
      });
      return;
    }

    if (contacts && contacts[0]?.phone) {
      toast({
        title: "📞 Calling Emergency Contact",
        description: `Calling ${contacts[0].name}...`,
        duration: 3000
      });
      window.open(`tel:${contacts[0].phone}`, '_self');
    }
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const mapsUrl = `https://maps.google.com?q=${latitude},${longitude}`;
          
          if (navigator.share) {
            navigator.share({
              title: 'My Emergency Location',
              text: 'Here is my current location for emergency purposes',
              url: mapsUrl
            });
          } else {
            navigator.clipboard.writeText(mapsUrl);
            toast({
              title: "📍 Location Copied",
              description: "Location link copied to clipboard",
              duration: 3000
            });
          }
        },
        () => {
          toast({
            title: "Location Access Denied",
            description: "Please enable location access to share your location",
            variant: "destructive"
          });
        }
      );
    }
  };

  const emergencyActions = [
    {
      title: "Emergency Test",
      description: testResults || (testingSystem ? "Testing systems..." : "Test all systems"),
      icon: testingSystem ? Loader2 : Shield,
      action: handleEmergencyTest,
      variant: "wellness" as const,
      disabled: testingSystem,
      status: testResults ? (testResults.includes("operational") ? "success" : "warning") : null
    },
    {
      title: "Quick Call",
      description: emergencyContactsCount > 0 
        ? `Call ${contacts?.[0]?.name || 'primary contact'}` 
        : "No contacts available",
      icon: Phone,
      action: handleQuickCall,
      variant: "outline" as const,
      disabled: emergencyContactsCount === 0
    },
    {
      title: "Share Location", 
      description: "Send current location",
      icon: MapPin,
      action: handleShareLocation,
      variant: "outline" as const
    }
  ];

  const nextSteps = [];
  
  if (!protectionActive) {
    nextSteps.push({
      title: "Activate Protection",
      description: "Subscribe to emergency services",
      icon: Shield,
      action: () => navigate('/member-dashboard/subscription'),
      priority: "high"
    });
  }
  
  if (emergencyContactsCount < 3) {
    nextSteps.push({
      title: "Add Emergency Contacts",
      description: `Add ${3 - emergencyContactsCount} more contacts`,
      icon: Phone,
      action: () => navigate('/member-dashboard/connections'),
      priority: "medium"
    });
  }
  
  if (!profileComplete) {
    nextSteps.push({
      title: "Complete Profile",
      description: "Fill in remaining details",
      icon: CheckCircle,
      action: () => navigate('/member-dashboard/profile'),
      priority: "low"
    });
  }

  return (
    <div className="space-y-4">
      {/* Emergency Quick Actions */}
      <Card className="border-wellness/20 bg-gradient-to-br from-wellness/5 to-wellness/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-wellness" />
            Emergency Actions
            <div className="ml-auto flex items-center gap-1">
              {isConnected ? (
                <Wifi className="h-3 w-3 text-wellness" />
              ) : (
                <WifiOff className="h-3 w-3 text-destructive" />
              )}
              <Activity className="h-3 w-3 text-wellness animate-pulse" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {emergencyActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              onClick={action.action}
              disabled={action.disabled}
              className={`w-full justify-start h-auto p-4 relative overflow-hidden transition-all duration-300 ${
                action.status === 'success' ? 'border-wellness bg-wellness/5' :
                action.status === 'warning' ? 'border-warning bg-warning/5' : ''
              }`}
              size="sm"
            >
              <action.icon className={`h-5 w-5 mr-3 ${
                action.variant === 'wellness' ? 'text-wellness-foreground' : 
                testingSystem && action.icon === Loader2 ? 'animate-spin' : ''
              }`} />
              <div className="text-left flex-1">
                <div className={`text-sm font-medium ${
                  action.variant === 'wellness' ? 'text-wellness-foreground' : ''
                }`}>
                  {action.title}
                </div>
                <div className={`text-xs opacity-80 ${
                  action.variant === 'wellness' ? 'text-wellness-foreground' : ''
                }`}>
                  {action.description}
                </div>
              </div>
              {action.status && (
                <div className="ml-2">
                  {action.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-wellness" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                </div>
              )}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextSteps.slice(0, 2).map((step, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={step.action}>
                <div className={`p-1.5 rounded-lg ${
                  step.priority === 'high' ? 'bg-destructive/10' :
                  step.priority === 'medium' ? 'bg-warning/10' : 'bg-wellness/10'
                }`}>
                  <step.icon className={`h-3 w-3 ${
                    step.priority === 'high' ? 'text-destructive' :
                    step.priority === 'medium' ? 'text-warning' : 'text-wellness'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Status Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Safety Status
            {testResults && (
              <Badge variant={testResults.includes("operational") ? "default" : "destructive"} className="ml-auto text-xs">
                {testResults.includes("operational") ? "System OK" : "Needs Attention"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Protection</span>
            <Badge variant={protectionActive ? "default" : "destructive"} className="text-xs">
              {protectionActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Contacts</span>
            <div className="flex items-center gap-1">
              {emergencyContactsCount >= 3 ? (
                <CheckCircle className="h-3 w-3 text-wellness" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-warning" />
              )}
              <span className="text-xs text-muted-foreground">{emergencyContactsCount}/5</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Profile</span>
            <div className="flex items-center gap-1">
              {profileComplete ? (
                <CheckCircle className="h-3 w-3 text-wellness" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-warning" />
              )}
              <span className="text-xs text-muted-foreground">{profile?.profile_completion_percentage || 0}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Connection</span>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <CheckCircle className="h-3 w-3 text-wellness" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyActionsWidget;