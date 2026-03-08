import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CONSENT_KEY = 'cookie_consent';

type ConsentState = 'pending' | 'accepted' | 'rejected';

function getConsent(): ConsentState {
  try {
    return (localStorage.getItem(CONSENT_KEY) as ConsentState) ?? 'pending';
  } catch {
    return 'pending';
  }
}

export default function CookieConsent() {
  const { t } = useTranslation();
  const [consent, setConsent] = useState<ConsentState>(() => getConsent());

  useEffect(() => {
    setConsent(getConsent());
  }, []);

  if (consent !== 'pending') return null;

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsent('accepted');
  };

  const reject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    setConsent('rejected');
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-border shadow-lg p-4 md:p-6"
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          {t('cookies.message')}{' '}
          <Link to="/privacy" className="text-primary underline">
            {t('cookies.privacyPolicy')}
          </Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={reject}>
            {t('cookies.decline')}
          </Button>
          <Button size="sm" onClick={accept}>
            {t('cookies.accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Check whether the user has accepted cookies (for gating analytics). */
export function hasAnalyticsConsent(): boolean {
  return getConsent() === 'accepted';
}
