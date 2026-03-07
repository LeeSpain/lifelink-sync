import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useFreeTrialPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only show on homepage
    if (location.pathname !== '/') {
      return;
    }

    // Check if user has already seen or completed trial signup
    const hasSeenPopup = localStorage.getItem('lifelinksync-trial-popup-seen');
    const hasSignedUp = localStorage.getItem('lifelinksync-trial-signup');
    
    if (hasSeenPopup || hasSignedUp) {
      return;
    }

    // Check if this is a first visit (preferences modal will show)
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    
    // If it's a first visit, wait longer to allow preferences modal to complete
    // If returning visit, show after shorter delay
    const delay = !hasVisitedBefore ? 15000 : 8000; // 15s for first visit, 8s for returning

    // Show popup after appropriate delay
    const timer = setTimeout(() => {
      // Double-check preferences modal isn't still showing
      const preferencesModalStillOpen = !localStorage.getItem('hasVisitedBefore');
      if (!preferencesModalStillOpen) {
        setShowPopup(true);
        localStorage.setItem('lifelinksync-trial-popup-seen', 'true');
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const closePopup = () => {
    setShowPopup(false);
  };

  return {
    showPopup,
    closePopup
  };
};