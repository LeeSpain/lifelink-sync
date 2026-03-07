import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Mic, MicOff, MapPin, AlertTriangle } from "lucide-react";
import { useVoiceActivation } from "@/hooks/useVoiceActivation";
import { useEmergencySOS } from "@/hooks/useEmergencySOS";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionTier } from "@/hooks/useSubscriptionTier";
import { useEmergencyDisclaimer } from "@/hooks/useEmergencyDisclaimer";
import { EmergencyDisclaimerModal } from "@/components/emergency/EmergencyDisclaimerModal";
import { EmergencyStatusBanner } from "@/components/emergency/EmergencyStatusBanner";
import { EnhancedSOSButton } from "@/components/sos/EnhancedSOSButton";
import { useInteractionTracking } from "@/hooks/useInteractionTracking";


const SosButton = () => {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const { triggerEmergencySOS, isTriggering, locationPermissionGranted, locationPermissionDenied } = useEmergencySOS();
  const { toast } = useToast();
  const { trackSOSAction } = useInteractionTracking();
  
  // Subscription and disclaimer hooks
  const { tier: subscriptionTier, loading: subscriptionLoading } = useSubscriptionTier();
  const { 
    showDisclaimer, 
    hasAcceptedDisclaimer, 
    requestDisclaimerAcceptance, 
    acceptDisclaimer, 
    cancelDisclaimer 
  } = useEmergencyDisclaimer();

  const handleEmergencyTrigger = async () => {
    // Track SOS button attempt
    trackSOSAction('sos_button_pressed', {
      has_disclaimer_acceptance: hasAcceptedDisclaimer,
      subscription_tier: subscriptionTier,
      location_permission: locationPermissionGranted
    });

    // Check if disclaimer needs to be accepted first
    if (!requestDisclaimerAcceptance()) {
      trackSOSAction('sos_blocked_disclaimer');
      return; // Block SOS if disclaimer not accepted
    }

    try {
      trackSOSAction('sos_trigger_initiated');
      await triggerEmergencySOS();
      trackSOSAction('sos_trigger_success');
    } catch (error) {
      console.error('Emergency SOS failed:', error);
      trackSOSAction('sos_trigger_failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleDisclaimerAccept = () => {
    trackSOSAction('disclaimer_accepted');
    acceptDisclaimer();
    // Automatically trigger SOS after accepting disclaimer
    handleEmergencyTrigger();
  };

  const { isListening, hasPermission } = useVoiceActivation({
    triggerPhrase: "help help help",
    onActivation: handleEmergencyTrigger,
    isEnabled: voiceEnabled
  });

  const toggleVoiceActivation = () => {
    trackSOSAction('voice_activation_toggle', { enabled: !voiceEnabled });
    
    if (!hasPermission && !voiceEnabled) {
      trackSOSAction('voice_permission_denied');
      toast({
        title: "Microphone Permission Required",
        description: "Please allow microphone access to enable voice activation for emergency calls.",
        variant: "destructive"
      });
      return;
    }
    setVoiceEnabled(!voiceEnabled);
  };

  useEffect(() => {
    if (voiceEnabled && isListening) {
      toast({
        title: "🎤 Voice Activation Enabled",
        description: "Say 'Help Help Help' to trigger emergency SOS",
        duration: 3000
      });
    }
  }, [voiceEnabled, isListening, toast]);

  return (
    <>
      {/* Emergency Disclaimer Modal */}
      <EmergencyDisclaimerModal
        isOpen={showDisclaimer}
        onAccept={handleDisclaimerAccept}
        onCancel={cancelDisclaimer}
        subscriptionTier={subscriptionTier}
      />

      {/* Plan status + critical notice */}
      <EmergencyStatusBanner subscriptionTier={subscriptionTier} className="mb-4" />

      {/* Enhanced SOS Button */}
      <EnhancedSOSButton 
        onTrigger={handleEmergencyTrigger}
        isTriggering={isTriggering}
      />
    </>
  );
};

export default SosButton;