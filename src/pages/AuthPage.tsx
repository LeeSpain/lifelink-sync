import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import useRateLimit from '@/hooks/useRateLimit';
import { PageSEO } from '@/components/PageSEO';
import { logSecurityEvent } from '@/utils/security';

const AuthPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Rate limiting for auth attempts
  const {
    isRateLimited,
    recordAttempt,
    getRemainingTime,
    reset: resetRateLimit
  } = useRateLimit('auth-attempts', { maxAttempts: 5, windowMs: 15 * 60 * 1000 }); // 5 attempts per 15 minutes

  // Move all useCallback hooks here BEFORE any early returns
  const handleSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRateLimited()) {
      setError(`Too many attempts. Please wait ${getRemainingTime()} seconds.`);
      return;
    }

    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
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
        // If invalid credentials, try to create the account automatically
        const msg = (error.message || '').toLowerCase();
        const code = (error as any).code || '';
        if (msg.includes('invalid login') || code === 'invalid_credentials') {
          const redirectUrl = `${window.location.origin}/`;
          const { error: signUpError } = await supabase.auth.signUp({
            email: emailTrimmed,
            password,
            options: { emailRedirectTo: redirectUrl }
          });
          if (!signUpError) {
            setSuccess('Account created. Please check your email to confirm and then sign in.');
            resetRateLimit();
            return;
          }
        }

        // Log failed sign in attempt
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
        setSuccess('Sign in successful! Redirecting...');
        resetRateLimit();
        // Log successful sign in
        setTimeout(() => {
          logSecurityEvent('signin_success', {
            user_id: data.user.id,
            email: data.user.email,
            timestamp: new Date().toISOString(),
            ip_address: 'client_side',
            source: 'auth_page'
          });
        }, 0);
        
        // Check for 'next' parameter to redirect after login
        const nextUrl = searchParams.get('next');
        const planParam = searchParams.get('plan');
        
        // Build redirect URL
        let redirectTo = '/dashboard';
        if (nextUrl) {
          redirectTo = nextUrl;
          if (planParam) {
            redirectTo += `${nextUrl.includes('?') ? '&' : '?'}plan=${planParam}`;
          }
        }
        
        // Redirect after successful sign in
        setTimeout(() => {
          navigate(redirectTo);
        }, 1000);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Failed to sign in');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, isRateLimited, getRemainingTime, recordAttempt, resetRateLimit]);

  console.log('🔐 AuthPage render:', { 
    hasUser: !!user, 
    userEmail: user?.email,
    loading, 
    isSubmitting,
    path: window.location.pathname,
    href: window.location.href
  });

  // NOW do conditional returns AFTER all hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Only redirect logged-in users if they're not explicitly on the auth page
  const isExplicitAuthVisit = window.location.pathname === '/auth';
  
  // Don't redirect if user explicitly navigated to /auth (let them see they're logged in)
  if (user && !isExplicitAuthVisit) {
    return <Navigate to="/dashboard" replace />;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Sign In to LifeLink Sync – Emergency Protection Access",
    "description": "Access your LifeLink Sync emergency protection dashboard. Sign in to manage your safety profile and emergency contacts.",
    "provider": {
      "@type": "Organization",
      "name": "LifeLink Sync",
      "url": "https://lifelink-sync.com"
    },
    "mainEntity": {
      "@type": "WebApplication",
      "name": "LifeLink Sync Dashboard",
      "applicationCategory": "HealthApplication",
      "operatingSystem": "Web Browser"
    }
  };

  return (
    <>
      <PageSEO pageType="auth" />
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                className="w-full" 
                disabled={isSubmitting || isRateLimited()}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
              
              {isRateLimited() && (
                <p className="text-sm text-muted-foreground text-center">
                  Too many attempts. Try again in {getRemainingTime()} seconds.
                </p>
              )}
            </form>
            
            {/* Link to registration */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Button asChild variant="link" className="p-0 h-auto font-medium">
                  <Link to="/ai-register">Register here</Link>
                </Button>
              </p>
            </div>

            {/* Dev Quick Links */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center uppercase tracking-wide">Quick Links (Testing)</h3>
              <p className="text-[10px] text-muted-foreground text-center mb-4">
                Links marked with * require login first. Log in above, then click.
              </p>

              <div className="space-y-4">
                {/* Dashboards */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Dashboards *</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Dashboard', to: '/dashboard' },
                      { label: 'Member', to: '/member-dashboard' },
                      { label: 'Family', to: '/family-dashboard' },
                      { label: 'Admin', to: '/admin-dashboard' },
                    ].map(link => (
                      <Button key={link.to} asChild variant="outline" size="sm" className="h-7 text-xs">
                        <a href={link.to}>{link.label}</a>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Apps */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Apps *</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'SOS App', to: '/sos-app' },
                      { label: 'Family App', to: '/family-app' },
                      { label: 'Mobile App', to: '/mobile-app' },
                      { label: 'Smart Redirect', to: '/app' },
                    ].map(link => (
                      <Button key={link.to} asChild variant="outline" size="sm" className="h-7 text-xs">
                        <a href={link.to}>{link.label}</a>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Key Pages (Protected) */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Key Pages *</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Map', to: '/map' },
                      { label: 'Circles', to: '/circles' },
                      { label: 'Places', to: '/places' },
                      { label: 'History', to: '/history' },
                      { label: 'Onboarding', to: '/dashboard/onboarding' },
                      { label: 'Questionnaire', to: '/welcome-questionnaire' },
                      { label: 'Family Setup', to: '/family-access-setup' },
                    ].map(link => (
                      <Button key={link.to} asChild variant="outline" size="sm" className="h-7 text-xs">
                        <a href={link.to}>{link.label}</a>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Public Pages */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Public Pages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Home', to: '/' },
                      { label: 'AI Register', to: '/ai-register' },
                      { label: 'Family Carer', to: '/family-carer-access' },
                      { label: 'Checkout', to: '/checkout' },
                      { label: 'Blog', to: '/blog' },
                      { label: 'Videos', to: '/videos' },
                      { label: 'Contact', to: '/contact' },
                      { label: 'Support', to: '/support' },
                      { label: 'Privacy', to: '/privacy' },
                      { label: 'Terms', to: '/terms' },
                      { label: 'Pendant', to: '/devices/lifelink-sync-pendant' },
                      { label: 'Spain Centre', to: '/regional-center/spain' },
                      { label: 'Map Demo', to: '/map-demo' },
                      { label: 'Test Page', to: '/test' },
                    ].map(link => (
                      <Button key={link.to} asChild variant="outline" size="sm" className="h-7 text-xs">
                        <a href={link.to}>{link.label}</a>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AuthPage;