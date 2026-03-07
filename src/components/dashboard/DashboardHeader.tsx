import React, { useState, useEffect } from "react";
import { Shield, Phone, LogOut, Clock, MapPin, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import LanguageCurrencySelector from '@/components/LanguageCurrencySelector';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/contexts/PreferencesContext';
import { languageToLocale } from '@/utils/currency';
interface DashboardHeaderProps {
  profile: any;
  subscription: any;
}

const DashboardHeader = ({ profile, subscription }: DashboardHeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = usePreferences();
  const locale = languageToLocale(language as any);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState({ temp: "22°C", condition: "Partly Cloudy", location: "Current Location" });

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Mock weather data - in production this would be from a weather API
    const loadWeather = () => {
      // Simulated weather data
      setWeather({
        temp: `${Math.floor(Math.random() * 10) + 18}°C`,
        condition: ["Sunny", "Partly Cloudy", "Cloudy", "Clear"][Math.floor(Math.random() * 4)],
        location: "Your Location"
      });
    };

    loadWeather();

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleEmergency = async () => {
    console.log("🚨 EMERGENCY SOS ACTIVATED! 🚨");
    
    try {
      // Get user's emergency contacts from profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found");
        return;
      }

      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('emergency_contacts, first_name, last_name')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (!userProfile?.emergency_contacts || !Array.isArray(userProfile.emergency_contacts) || userProfile.emergency_contacts.length === 0) {
        alert("⚠️ No emergency contacts found! Please add emergency contacts in your profile.");
        return;
      }

      // Show immediate confirmation
      alert("🚨 EMERGENCY SOS ACTIVATED!\n\nNotifying your emergency contacts now...");

      // Call emergency notification function
      const { data, error: functionError } = await supabase.functions.invoke('emergency-sos-enhanced', {
        body: {
          userProfile: {
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            emergency_contacts: userProfile.emergency_contacts
          },
          location: 'Dashboard Emergency Button',
          timestamp: new Date().toISOString()
        }
      });

      if (functionError) {
        console.error('Error calling emergency function:', functionError);
        alert("Emergency contacts could not be notified. Please call emergency services directly.");
      } else {
        console.log("Emergency notifications sent:", data);
        alert("✅ Emergency contacts have been notified!");
      }

    } catch (error) {
      console.error('Emergency SOS error:', error);
      alert("⚠️ Emergency system error. Please call emergency services directly.");
    }
  };

  const getProtectionStatus = () => {
    if (subscription?.subscribed) {
      return { status: "Active", color: "text-green-400", icon: "✓" };
    }
    return { status: "Inactive", color: "text-orange-400", icon: "!" };
  };

  const protectionStatus = getProtectionStatus();
  const userName = profile?.first_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Member';
  const fullName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}` 
    : userName;

  return (
    <div className="relative bg-gradient-hero shadow-2xl border-b border-white/10">
      {/* Professional Shadow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:20px_20px]" />
      </div>
      
      <div className="container mx-auto px-6 py-6 relative z-10">
        {/* Professional Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-white mb-1 drop-shadow-lg">
              {`${t('dashboard.greeting.' + (currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 18 ? 'afternoon' : 'evening'))}, ${userName}`}
            </h1>
            <p className="text-white/80 text-sm drop-shadow-sm">
              {currentTime.toLocaleDateString(locale, { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })} • {currentTime.toLocaleTimeString(locale, { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </p>
          </div>
          
<div className="flex items-center gap-3">
            <div className="text-right text-white/80">
              <p className="text-sm font-medium">{weather.temp}</p>
              <p className="text-xs">{weather.condition}</p>
            </div>
            <LanguageCurrencySelector compact />
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <LogOut className="h-4 w-4 mr-1" />
              {t('dashboard.signOut')}
            </Button>
          </div>
        </div>

        {/* Professional Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {/* Protection Status */}
          <div className="bg-emergency backdrop-blur-sm border border-emergency-glow/30 rounded-lg p-3 shadow-lg">
            <div className="text-center space-y-2">
              <div className={`w-3 h-3 rounded-full mx-auto ${protectionStatus.status === 'Active' ? 'bg-white shadow-sm' : 'bg-red-400'}`}></div>
              <div>
                <p className="text-sm font-bold text-black uppercase tracking-wide">Protection</p>
                <p className={`text-base font-bold ${protectionStatus.status === 'Active' ? 'text-black' : 'text-red-600'}`}>
                  {protectionStatus.status}
                </p>
              </div>
            </div>
          </div>

          {/* Location Services */}
          <div className="bg-emergency backdrop-blur-sm border border-emergency-glow/30 rounded-lg p-3 shadow-lg">
            <div className="text-center space-y-2">
              <MapPin className={`w-4 h-4 mx-auto ${profile?.location_sharing_enabled ? 'text-black' : 'text-red-600'}`} />
              <div>
                <p className="text-sm font-bold text-black uppercase tracking-wide">Location</p>
                <p className={`text-base font-bold ${profile?.location_sharing_enabled ? 'text-black' : 'text-red-600'}`}>
                  {profile?.location_sharing_enabled ? 'On' : 'Off'}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="bg-emergency backdrop-blur-sm border border-emergency-glow/30 rounded-lg p-3 shadow-lg">
            <div className="text-center space-y-2">
              <div className="w-10 h-2 bg-black/20 rounded-full mx-auto overflow-hidden">
                <div 
                  className="h-full bg-black rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${profile?.profile_completion_percentage || 0}%` }}
                ></div>
              </div>
              <div>
                <p className="text-sm font-bold text-black uppercase tracking-wide">Profile</p>
                <p className="text-base font-bold text-black">{profile?.profile_completion_percentage || 0}%</p>
              </div>
            </div>
          </div>

          {/* Emergency SOS - Enhanced */}
          <div className="bg-emergency border-2 border-red-400 rounded-lg p-3 shadow-2xl relative overflow-hidden">
            {/* Pulsing background effect */}
            <div className="absolute inset-0 bg-red-500/20 animate-pulse"></div>
            <div className="text-center space-y-2 relative z-10">
              <Button
                variant="emergency"
                size="lg"
                onClick={handleEmergency}
                className="w-10 h-10 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-2xl mx-auto border-2 border-white animate-bounce"
                style={{
                  animation: "bounce 1s infinite, pulse 2s infinite",
                  boxShadow: "0 0 20px rgba(239, 68, 68, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.2)"
                }}
                aria-label="EMERGENCY SOS - Press for immediate help"
              >
                <Phone className="h-4 w-4 animate-pulse" />
              </Button>
              <div>
                <p className="text-sm font-bold text-black uppercase tracking-wider animate-pulse">EMERGENCY</p>
                <p className="text-sm font-medium text-red-800">Press for Help</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional LifeLink Sync Branding */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/10 backdrop-blur-sm rounded-md flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">LifeLink Sync</h2>
              <p className="text-xs text-white/70">Emergency Protection</p>
            </div>
          </div>
          <div className="text-right text-white/60">
            <p className="text-xs">Professional Dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;