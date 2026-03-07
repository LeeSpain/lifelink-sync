import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Shield, 
  Phone, 
  Heart, 
  Settings,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PersonalInformationSection from "@/components/dashboard/profile/PersonalInformationSection";
import ProtectionServicesSection from "@/components/dashboard/profile/ProtectionServicesSection";
import EnhancedEmergencyContactsSection from "@/components/dashboard/profile/EnhancedEmergencyContactsSection";
import HealthProfileSection from "@/components/dashboard/profile/HealthProfileSection";

export default function EnhancedProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    loadProfile();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted/30 rounded animate-pulse" />
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile & Protection</h1>
          <p className="text-muted-foreground">
            Manage your personal information and emergency preparedness
          </p>
        </div>
      </div>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="protection" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Protection
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Emergency
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <PersonalInformationSection 
            profile={profile} 
            onProfileUpdate={handleProfileUpdate} 
          />
        </TabsContent>

        <TabsContent value="protection" className="space-y-6">
          <ProtectionServicesSection profile={profile} />
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
          <EnhancedEmergencyContactsSection 
            profile={profile} 
            onProfileUpdate={handleProfileUpdate} 
          />
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <HealthProfileSection 
            profile={profile} 
            onProfileUpdate={handleProfileUpdate} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}