import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Phone, Mic, MicOff } from 'lucide-react';
import { useEmergencySOS } from '@/hooks/useEmergencySOS';
import { useEmergencyDisclaimer } from '@/hooks/useEmergencyDisclaimer';
import { EmergencyDisclaimerModal } from '@/components/emergency/EmergencyDisclaimerModal';
import { useToast } from '@/hooks/use-toast';

const EmergencyButton = () => {
  const { triggerEmergencySOS, isTriggering } = useEmergencySOS();
  const { 
    showDisclaimer, 
    requestDisclaimerAcceptance, 
    acceptDisclaimer, 
    cancelDisclaimer 
  } = useEmergencyDisclaimer();
  const { toast } = useToast();
  const [isPressed, setIsPressed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [voiceActivated, setVoiceActivated] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  // Pulse effect counter
  useEffect(() => {
    if (isTriggering) {
      const interval = setInterval(() => {
        setPulseCount(count => count + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTriggering]);

  const handleSOSActivation = () => {
    // Start 3-second countdown to prevent accidental activation
    if (countdown === null && !isTriggering) {
      setCountdown(3);
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(countdownInterval);
            // Proceed with SOS activation
            const canProceed = requestDisclaimerAcceptance();
            if (canProceed) {
              triggerEmergencySOS();
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const cancelCountdown = () => {
    setCountdown(null);
    toast({
      title: "Emergency SOS Cancelled",
      description: "SOS activation has been cancelled",
    });
  };

  const handleDisclaimerAccept = () => {
    acceptDisclaimer();
    triggerEmergencySOS();
  };

  const toggleVoiceActivation = () => {
    setVoiceActivated(!voiceActivated);
    toast({
      title: voiceActivated ? "Voice Activation Disabled" : "Voice Activation Enabled",
      description: voiceActivated ? "Voice commands disabled" : "Say 'Emergency Help' to activate SOS",
    });
  };

  return (
    <>
      <div className="relative flex flex-col items-center">
        {/* Voice Activation Toggle */}
        <Button
          onClick={toggleVoiceActivation}
          variant="ghost"
          size="sm"
          className="mb-4 text-white/70 hover:text-white hover:bg-white/10"
        >
          {voiceActivated ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
          Voice {voiceActivated ? 'ON' : 'OFF'}
        </Button>

        {/* Multi-layer pulsing rings for emergency state */}
        {isTriggering && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" style={{ animationDelay: '0s' }}></div>
            <div className="absolute inset-0 rounded-full bg-red-500/15 animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" style={{ animationDelay: '1s' }}></div>
          </>
        )}

        {/* Countdown ring */}
        {countdown !== null && (
          <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-yellow-400 text-6xl font-black">{countdown}</span>
            </div>
          </div>
        )}
        
        {/* Main emergency button */}
        <Button
          onClick={countdown !== null ? cancelCountdown : handleSOSActivation}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          disabled={isTriggering}
          className={`
            relative w-56 h-56 rounded-full 
            ${countdown !== null 
              ? 'bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' 
              : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }
            text-white font-bold text-xl
            border-4 border-white
            shadow-2xl hover:shadow-red-500/50
            transition-all duration-200
            ${isPressed ? 'scale-95' : 'scale-100'}
            ${isTriggering ? 'animate-pulse' : ''}
          `}
        >
          <div className="flex flex-col items-center gap-3">
            {countdown !== null ? (
              <>
                <AlertTriangle className="h-14 w-14" />
                <div className="text-center">
                  <div className="text-xl font-black">TAP TO CANCEL</div>
                  <div className="text-lg">Activating in {countdown}s</div>
                </div>
              </>
            ) : isTriggering ? (
              <>
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold">{pulseCount}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black">SENDING SOS...</div>
                  <div className="text-sm">Notifying contacts</div>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-14 w-14" />
                <div className="text-center">
                  <div className="text-2xl font-black">EMERGENCY</div>
                  <div className="text-xl">SOS</div>
                </div>
              </>
            )}
          </div>
        </Button>

        {/* Enhanced instructions positioned below button with proper spacing */}
        <div className="mt-6 text-center text-white/80 max-w-xs">
          {countdown !== null ? (
            <div className="space-y-1">
              <p className="text-sm font-bold text-yellow-400">Activating Emergency SOS</p>
              <p className="text-xs">Tap button to cancel</p>
            </div>
          ) : isTriggering ? (
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-400">Emergency SOS Active</p>
              <p className="text-xs">Contacts are being notified</p>
            </div>
          ) : (
            <div className="space-y-1 bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/10">
              <p className="text-sm font-medium">Hold for 3 seconds to activate</p>
              <p className="text-xs text-white/60">Sends alerts to emergency contacts</p>
              {voiceActivated && (
                <p className="text-xs text-blue-400">Voice: Say "Emergency Help"</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Emergency Disclaimer Modal */}
      <EmergencyDisclaimerModal
        isOpen={showDisclaimer}
        onAccept={handleDisclaimerAccept}
        onCancel={cancelDisclaimer}
        subscriptionTier="basic"
      />
    </>
  );
};

export default EmergencyButton;