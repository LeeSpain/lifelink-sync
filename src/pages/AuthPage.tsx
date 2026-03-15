import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings } from 'lucide-react';

import useRateLimit from '@/hooks/useRateLimit';
import { PageSEO } from '@/components/PageSEO';
import { logSecurityEvent } from '@/utils/security';

type AuthView = 'signin' | 'forgot' | 'reset';

const AuthPage = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devBypassEnabled, setDevBypassEnabled] = useState(() => localStorage.getItem('dev_bypass') === '1');
  const [showDevPopup, setShowDevPopup] = useState(false);

  // Determine initial view from URL params
  const [view, setView] = useState<AuthView>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'reset') return 'reset';
    return 'signin';
  });

  // Listen for password recovery event from Supabase (email link click)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('reset');
        setError('');
        setSuccess('');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Rate limiting for auth attempts
  const {
    isRateLimited,
    recordAttempt,
    getRemainingTime,
    reset: resetRateLimit
  } = useRateLimit('auth-attempts', { maxAttempts: 5, windowMs: 15 * 60 * 1000 });

  const switchView = useCallback((newView: AuthView) => {
    setView(newView);
    setError('');
    setSuccess('');
  }, []);

  // Sign in handler
  const handleSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRateLimited()) {
      setError(t('auth.tooManyAttempts', { seconds: getRemainingTime() }));
      return;
    }

    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError(t('auth.invalidEmail'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });

      if (error) {
        recordAttempt();
        setTimeout(() => {
          logSecurityEvent('signin_failure', {
            email: emailTrimmed,
            error: error.message,
            timestamp: new Date().toISOString(),
            ip_address: 'client_side',
            source: 'auth_page'
          });
        }, 0);
        throw error;
      }

      if (data.user) {
        resetRateLimit();
        setTimeout(() => {
          logSecurityEvent('signin_success', {
            user_id: data.user.id,
            email: data.user.email,
            timestamp: new Date().toISOString(),
            ip_address: 'client_side',
            source: 'auth_page'
          });
        }, 0);

        const nextUrl = searchParams.get('next') || (location as any).state?.from;
        const planParam = searchParams.get('plan');

        const isTabletPWA = localStorage.getItem('pwa_intent') === 'tablet';
        let redirectTo = isTabletPWA ? '/tablet-dashboard' : '/dashboard';
        if (nextUrl) {
          redirectTo = nextUrl;
          if (planParam) {
            redirectTo += `${nextUrl.includes('?') ? '&' : '?'}plan=${planParam}`;
          }
        }
        setSuccess(t('auth.signInSuccess'));
        setTimeout(() => {
          navigate(redirectTo);
        }, 500);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || t('auth.signInFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, isRateLimited, getRemainingTime, recordAttempt, resetRateLimit, searchParams, navigate, t]);

  // Forgot password handler
  const handleForgotPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError(t('auth.invalidEmail'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Use canonical URL — must be in Supabase Auth redirect allowlist
      const siteUrl = window.location.hostname === 'localhost'
        ? window.location.origin
        : 'https://lifelink-sync.vercel.app';

      const { error } = await supabase.auth.resetPasswordForEmail(emailTrimmed, {
        redirectTo: `${siteUrl}/auth?tab=reset`,
      });
      if (error) throw error;
      setSuccess(t('auth.resetLinkSent'));
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || t('auth.signInFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [email, t]);

  // Reset password handler (new password)
  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(t('auth.passwordUpdated'));
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Password update error:', error);
      setError(error.message || t('auth.signInFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [password, confirmPassword, navigate, t]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-gradient-hero flex items-center justify-center" style={{ minHeight: '100dvh' }}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>{t('auth.loading')}</p>
        </div>
      </div>
    );
  }

  // Redirect logged-in users — respect ?next= param for CLARA Personal PWA
  if (user && user.id !== 'dev-test-user-00000000' && view !== 'reset') {
    const nextParam = searchParams.get('next');
    const stateFrom = (location as any).state?.from;
    const redirectTo = nextParam || stateFrom || '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  // Render the card header based on view
  const renderHeader = () => {
    switch (view) {
      case 'forgot':
        return (
          <>
            <CardTitle className="text-xl sm:text-2xl font-bold">{t('auth.resetPassword')}</CardTitle>
            <CardDescription>{t('auth.resetPasswordDescription')}</CardDescription>
          </>
        );
      case 'reset':
        return (
          <>
            <CardTitle className="text-xl sm:text-2xl font-bold">{t('auth.resetPassword')}</CardTitle>
            <CardDescription>{t('auth.resetPasswordDescription')}</CardDescription>
          </>
        );
      default:
        return (
          <>
            <CardTitle className="text-xl sm:text-2xl font-bold">{t('auth.welcome')}</CardTitle>
            <CardDescription>{t('auth.signInToAccount')}</CardDescription>
          </>
        );
    }
  };

  // Render the form based on view
  const renderForm = () => {
    switch (view) {
      case 'forgot':
        return (
          <>
            <form onSubmit={handleForgotPassword} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full min-h-[44px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                className="p-0 h-auto font-medium"
                onClick={() => switchView('signin')}
              >
                {t('auth.backToSignIn')}
              </Button>
            </div>
          </>
        );

      case 'reset':
        return (
          <>
            <form onSubmit={handleResetPassword} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder={t('auth.newPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder={t('auth.confirmPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full min-h-[44px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('auth.updatingPassword') : t('auth.updatePassword')}
              </Button>
            </form>
          </>
        );

      default:
        return (
          <>
            <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="min-h-[44px] text-base"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="min-h-[44px] text-base"
                />
              </div>

              <div className="text-right">
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-sm font-medium"
                  onClick={() => switchView('forgot')}
                >
                  {t('auth.forgotPassword')}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full min-h-[44px]"
                disabled={isSubmitting || isRateLimited()}
              >
                {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
              </Button>

              {isRateLimited() && (
                <p className="text-sm text-muted-foreground text-center">
                  {t('auth.tooManyAttemptsShort', { seconds: getRemainingTime() })}
                </p>
              )}
            </form>

            {/* Link to registration */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.noAccount')}{" "}
                <Button asChild variant="link" className="p-0 h-auto font-medium">
                  <Link to="/register">{t('auth.registerHere')}</Link>
                </Button>
              </p>
            </div>
          </>
        );
    }
  };

  return (
    <>
      <PageSEO pageType="auth" />
      <div className="bg-gradient-hero flex items-center justify-center p-3 sm:p-4" style={{ minHeight: '100dvh' }}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center px-4 sm:px-6 relative">
            {import.meta.env.DEV && (
              <div className="absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!devBypassEnabled) {
                      localStorage.setItem('dev_bypass', '1');
                      setDevBypassEnabled(true);
                    }
                    setShowDevPopup(true);
                  }}
                  className={`h-8 w-8 p-0 ${devBypassEnabled ? 'text-primary' : 'text-muted-foreground'} hover:text-foreground`}
                  title="Open Dev Quick Links"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="mb-2">
              <Button asChild variant="ghost" size="sm" className="min-h-[44px] text-muted-foreground hover:text-foreground">
                <Link to="/">&larr; {t('auth.backToHomepage')}</Link>
              </Button>
            </div>
            {renderHeader()}
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {renderForm()}
          </CardContent>
        </Card>
      </div>

      {/* Dev Quick Links Popup - Development only */}
      {import.meta.env.DEV && showDevPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDevPopup(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dev Quick Links</h3>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowDevPopup(false)}>
                &times;
              </Button>
            </div>

            <div className="space-y-4">
              {/* Dashboards */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Dashboards</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Member', href: '/member-dashboard?dev=1' },
                    { label: 'Admin', href: '/admin-dashboard?dev=1' },
                  ].map(link => (
                    <Button key={link.href} asChild variant="default" size="sm" className="min-h-[44px] text-xs w-full">
                      <Link to={link.href}>{link.label}</Link>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Apps */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Apps</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'SOS App', href: '/sos-app?dev=1' },
                    { label: 'Family App', href: '/family-app?dev=1' },
                    { label: 'Mobile App', href: '/mobile-app?dev=1' },
                  ].map(link => (
                    <Button key={link.href} asChild variant="default" size="sm" className="min-h-[44px] text-xs w-full">
                      <Link to={link.href}>{link.label}</Link>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tablet */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Tablet</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button asChild variant="default" size="sm" className="min-h-[44px] text-xs w-full col-span-3">
                    <Link to="/tablet-dashboard?dev=1">Tablet Dashboard</Link>
                  </Button>
                </div>
              </div>

              {/* Disable dev mode */}
              {devBypassEnabled && (
                <div className="border-t pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      localStorage.removeItem('dev_bypass');
                      setDevBypassEnabled(false);
                      setShowDevPopup(false);
                      window.location.reload();
                    }}
                  >
                    Disable Dev Mode
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthPage;
