import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DISCLAIMER_ACCEPTED_KEY = 'sos_disclaimer_accepted';

export const useEmergencyDisclaimer = () => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Check if disclaimer has been accepted for this user
    const acceptedKey = `${DISCLAIMER_ACCEPTED_KEY}_${user.id}`;
    const hasAccepted = localStorage.getItem(acceptedKey) === 'true';
    setHasAcceptedDisclaimer(hasAccepted);

    // Show disclaimer on first SOS attempt if not accepted
    if (!hasAccepted) {
      // Don't show automatically - will be triggered by SOS button
      setShowDisclaimer(false);
    }
  }, [user]);

  const requestDisclaimerAcceptance = () => {
    if (!hasAcceptedDisclaimer) {
      setShowDisclaimer(true);
      return false; // Block SOS action
    }
    return true; // Allow SOS action
  };

  const acceptDisclaimer = () => {
    if (!user) return;
    
    const acceptedKey = `${DISCLAIMER_ACCEPTED_KEY}_${user.id}`;
    localStorage.setItem(acceptedKey, 'true');
    setHasAcceptedDisclaimer(true);
    setShowDisclaimer(false);
  };

  const cancelDisclaimer = () => {
    setShowDisclaimer(false);
  };

  const resetDisclaimer = () => {
    if (!user) return;
    
    const acceptedKey = `${DISCLAIMER_ACCEPTED_KEY}_${user.id}`;
    localStorage.removeItem(acceptedKey);
    setHasAcceptedDisclaimer(false);
  };

  return {
    showDisclaimer,
    hasAcceptedDisclaimer,
    requestDisclaimerAcceptance,
    acceptDisclaimer,
    cancelDisclaimer,
    resetDisclaimer
  };
};