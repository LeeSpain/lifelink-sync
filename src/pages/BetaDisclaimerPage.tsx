import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Phone, Globe, Shield, Users } from "lucide-react";

export default function BetaDisclaimerPage() {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAccept = () => {
    if (!agreed) {
      toast({
        title: "Agreement Required",
        description: "Please read and accept the beta terms to continue.",
        variant: "destructive"
      });
      return;
    }
    
    localStorage.setItem('beta_disclaimer_accepted', 'true');
    toast({
      title: "Welcome to LifeLink Sync Beta!",
      description: "Thank you for joining our beta program. Your feedback is valuable to us.",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-lg px-4 py-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            LIFELINK SYNC - BETA VERSION
          </Badge>
          <h1 className="text-4xl font-bold">Welcome to Our Beta Program</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You're about to join the exclusive beta launch of LifeLink Sync. Please read the following important information.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                What's Working (100% Ready)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Security & Privacy</h4>
                  <p className="text-sm text-muted-foreground">Bank-level security, encrypted data, GDPR compliant</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">User Management</h4>
                  <p className="text-sm text-muted-foreground">Profiles, emergency contacts, family groups</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Location Services</h4>
                  <p className="text-sm text-muted-foreground">Precise GPS tracking, address resolution</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                Beta Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Emergency Services</h4>
                  <p className="text-sm text-muted-foreground">Currently in testing phase with partner dispatch centers</p>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  ⚠️ In a real emergency, always call 112 directly
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Beta Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🎯 Your Beta Benefits</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• 50% discount on all subscription plans during beta</li>
                <li>• Direct access to our development team for feedback</li>
                <li>• Priority access to new features as they launch</li>
                <li>• Lifetime early adopter recognition</li>
              </ul>
            </div>

            <div className="space-y-3 text-sm">
              <p><strong>Emergency Service Integration:</strong> We are actively working with Spanish emergency dispatch centers to provide direct emergency service integration. Currently, the system will notify your emergency contacts and provide location data, but emergency services must be contacted separately.</p>
              
              <p><strong>Data Collection:</strong> As a beta user, we collect anonymized usage data to improve the platform. All personal emergency data remains private and encrypted.</p>
              
              <p><strong>Service Availability:</strong> Beta service availability is 99.9% target with planned maintenance windows communicated in advance.</p>
              
              <p><strong>Feedback:</strong> Your feedback is crucial. We'll regularly reach out for your input on features, usability, and performance.</p>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Checkbox 
                id="beta-agreement" 
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
              />
              <label htmlFor="beta-agreement" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I understand this is a beta version and agree to the terms above. I will call 112 directly in real emergencies.
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button 
                onClick={handleAccept}
                disabled={!agreed}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Join Beta Program
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}