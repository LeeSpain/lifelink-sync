import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ClaraChatProvider } from "@/contexts/ClaraChatContext";
import GlobalClaraChat from "@/components/GlobalClaraChat";
import DeviceManagerButton from "@/components/devices/DeviceManagerButton";
import { queryClient } from "@/lib/queryClient";
import OptimizedSuspense from '@/components/OptimizedSuspense';
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { usePageTracking } from '@/hooks/usePageTracking';

// Import all pages
import Index from "./pages/Index";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AuthPage from "./pages/AuthPage";

// Live Map Pages
import MapScreen from "./pages/MapScreen";
import MyCirclesPage from "./pages/MyCirclesPage";
import PlacesManager from "./pages/PlacesManager";
import LocationHistoryPage from "./pages/LocationHistoryPage";
import MapDemo from "./pages/MapDemo";

// Dashboard Pages
import DashboardRedirect from "./components/DashboardRedirect";
import Dashboard from "./pages/Dashboard";
import FamilyDashboard from "./pages/FamilyDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// App Pages
import SOSAppPage from "./pages/SOSAppPage";
import FamilyAppPage from "./pages/FamilyAppPage";

// Support & Info Pages
import Support from "./pages/Support";
import Privacy from "./pages/Privacy"; // Legacy dialog-based (keep for backwards compatibility)
import Terms from "./pages/Terms"; // Legacy dialog-based (keep for backwards compatibility)
import PrivacyPolicy from "./pages/PrivacyPolicy"; // New production privacy policy
import TermsOfService from "./pages/TermsOfService"; // New production terms of service
import Contact from "./pages/Contact";
import Videos from "./pages/Videos";
import FamilyCarerAccessPage from "./pages/FamilyCarerAccess";

// Interactive and Mobile Pages
import FamilyAccessSetup from "./pages/FamilyAccessSetup";
import AIRegister from "./pages/AIRegister";
import RegisterPage from "./pages/RegisterPage";
import FamilyInviteAccept from "./pages/FamilyInviteAccept";
import { ConnectionAcceptPage } from "./pages/ConnectionAcceptPage";
const TestRegistration = import.meta.env.DEV ? React.lazy(() => import("./pages/TestRegistration")) : null;

// Payment Pages
import PaymentSuccess from "./pages/PaymentSuccess";
import FamilyCheckoutSuccess from "./pages/FamilyCheckoutSuccess";
import FamilyCheckoutCanceled from "./pages/FamilyCheckoutCanceled";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import WelcomeQuestionnaire from "./components/WelcomeQuestionnaire";
import OnboardingPage from "./pages/OnboardingPage";
import CheckoutPage from "./pages/CheckoutPage";
import TrialSignupPage from "./pages/TrialSignupPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import CheckoutCancelPage from "./pages/CheckoutCancelPage";

// Test Pages (dev only)
const TestPage = import.meta.env.DEV ? React.lazy(() => import("./pages/TestPage")) : null;

// Device Pages
import DeviceIceSosPendant from "./pages/DeviceIceSosPendant";

// Regional Pages
import RegionalCenterSpain from "./pages/RegionalCenterSpain";

// Protected Route Components
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import RegionalProtectedRoute from "./components/RegionalProtectedRoute";
import ProtectedSOSRoute from "./components/ProtectedSOSRoute";
import SmartAppRedirect from "./components/SmartAppRedirect";

import ScrollToTop from "./components/ScrollToTop";
import CookieConsent from "./components/CookieConsent";

// Component to handle page tracking inside Router context
function AppWithTracking() {
  usePageTracking();
  
  return (
    <>
      <ScrollToTop />
      <main id="main-content" className="min-h-screen bg-background text-foreground">
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={
            <OptimizedSuspense skeletonType="card">
              <Index />
            </OptimizedSuspense>
          } />
                
                {/* Auth Page */}
                <Route path="/auth" element={
                  <OptimizedSuspense skeletonType="card">
                    <AuthPage />
                  </OptimizedSuspense>
                } />
                <Route path="/register" element={
                  <OptimizedSuspense skeletonType="card">
                    <RegisterPage />
                  </OptimizedSuspense>
                } />
                <Route path="/ai-register" element={<Navigate to="/register" replace />} />
                <Route path="/trial-signup" element={
                  <OptimizedSuspense skeletonType="card">
                    <TrialSignupPage />
                  </OptimizedSuspense>
                } />

                {/* Invitation Accept Routes */}
                <Route path="/family-invite/:token" element={
                  <OptimizedSuspense skeletonType="card">
                    <FamilyInviteAccept />
                  </OptimizedSuspense>
                } />
                <Route path="/invite/connections/:token" element={
                  <OptimizedSuspense skeletonType="card">
                    <ConnectionAcceptPage />
                  </OptimizedSuspense>
                } />
                {import.meta.env.DEV && TestRegistration && (
                  <Route path="/test-registration" element={
                    <OptimizedSuspense skeletonType="card">
                      <TestRegistration />
                    </OptimizedSuspense>
                  } />
                )}

                {/* Blog Pages */}
                <Route path="/blog" element={
                  <OptimizedSuspense skeletonType="card">
                    <Blog />
                  </OptimizedSuspense>
                } />
                <Route path="/blog/:slug" element={
                  <OptimizedSuspense skeletonType="card">
                    <BlogPost />
                  </OptimizedSuspense>
                } />

                {/* Public Pages */}
                <Route path="/contact" element={
                  <OptimizedSuspense skeletonType="card">
                    <Contact />
                  </OptimizedSuspense>
                } />
                
                <Route path="/videos" element={
                  <OptimizedSuspense skeletonType="card">
                    <Videos />
                  </OptimizedSuspense>
                } />
                
                {/* Production Privacy & Terms (Full Pages) */}
                <Route path="/privacy" element={
                  <OptimizedSuspense skeletonType="card">
                    <PrivacyPolicy />
                  </OptimizedSuspense>
                } />

                <Route path="/terms" element={
                  <OptimizedSuspense skeletonType="card">
                    <TermsOfService />
                  </OptimizedSuspense>
                } />

                {/* Legacy Privacy & Terms (Dialog-based - deprecated but kept for compatibility) */}
                <Route path="/privacy-legacy" element={
                  <OptimizedSuspense skeletonType="card">
                    <Privacy />
                  </OptimizedSuspense>
                } />

                <Route path="/terms-legacy" element={
                  <OptimizedSuspense skeletonType="card">
                    <Terms />
                  </OptimizedSuspense>
                } />
                
                <Route path="/support" element={
                  <OptimizedSuspense skeletonType="card">
                    <Support />
                  </OptimizedSuspense>
                } />
                
                
                <Route path="/family-carer-access" element={
                  <OptimizedSuspense skeletonType="card">
                    <FamilyCarerAccessPage />
                  </OptimizedSuspense>
                } />

                {/* Checkout Pages */}
                <Route path="/checkout" element={
                  <OptimizedSuspense skeletonType="card">
                    <CheckoutPage />
                  </OptimizedSuspense>
                } />
                
                <Route path="/checkout/success" element={
                  <OptimizedSuspense skeletonType="card">
                    <CheckoutSuccessPage />
                  </OptimizedSuspense>
                } />
                
                <Route path="/checkout/cancel" element={
                  <OptimizedSuspense skeletonType="card">
                    <CheckoutCancelPage />
                  </OptimizedSuspense>
                } />

                {/* Payment Success Pages */}
                <Route path="/payment-success" element={
                  <OptimizedSuspense skeletonType="card">
                    <PaymentSuccess />
                  </OptimizedSuspense>
                } />
                
                <Route path="/family-checkout-success" element={
                  <OptimizedSuspense skeletonType="card">
                    <FamilyCheckoutSuccess />
                  </OptimizedSuspense>
                } />
                
                <Route path="/family-checkout-canceled" element={
                  <OptimizedSuspense skeletonType="card">
                    <FamilyCheckoutCanceled />
                  </OptimizedSuspense>
                } />
                
                <Route path="/registration-success" element={
                  <OptimizedSuspense skeletonType="card">
                    <RegistrationSuccess />
                  </OptimizedSuspense>
                } />
                
                <Route path="/welcome-questionnaire" element={
                  <ProtectedRoute>
                    <OptimizedSuspense skeletonType="card">
                      <WelcomeQuestionnaire />
                    </OptimizedSuspense>
                  </ProtectedRoute>
                } />

                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <OptimizedSuspense skeletonType="dashboard">
                      <DashboardRedirect />
                    </OptimizedSuspense>
                  </ProtectedRoute>
                } />

                {/* Onboarding Route */}
                <Route path="/dashboard/onboarding" element={
                  <ProtectedRoute>
                    <OptimizedSuspense skeletonType="card">
                      <OnboardingPage />
                    </OptimizedSuspense>
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin-dashboard/*" element={
                  <AdminProtectedRoute>
                    <OptimizedSuspense skeletonType="dashboard">
                      <AdminDashboard />
                    </OptimizedSuspense>
                  </AdminProtectedRoute>
                } />

                {/* Member Dashboard - Main user dashboard */}
                <Route path="/member-dashboard/*" element={
                  <ProtectedRoute>
                    <OptimizedSuspense skeletonType="dashboard">
                      <Dashboard />
                    </OptimizedSuspense>
                  </ProtectedRoute>
                } />

                {/* Family Dashboard */}
                <Route path="/family-dashboard/*" element={
                  <ProtectedRoute>
                    <OptimizedSuspense skeletonType="dashboard">
                      <FamilyDashboard />
                    </OptimizedSuspense>
                  </ProtectedRoute>
                } />

                {/* SOS App */}
                <Route path="/sos-app" element={
                  <ProtectedSOSRoute>
                    <OptimizedSuspense skeletonType="card">
                      <SOSAppPage />
                    </OptimizedSuspense>
                  </ProtectedSOSRoute>
                } />

                {/* Family App */}
                <Route path="/family-app" element={
                  <ProtectedRoute>
                    <OptimizedSuspense skeletonType="card">
                      <FamilyAppPage />
                    </OptimizedSuspense>
                  </ProtectedRoute>
                } />

                {/* Mobile Apps */}
                <Route path="/app" element={
                  <ProtectedRoute>
                    <OptimizedSuspense skeletonType="card">
                      <SmartAppRedirect />
                    </OptimizedSuspense>
                  </ProtectedRoute>
                } />
                
                <Route path="/mobile-app" element={
                  <ProtectedRoute>
                    <OptimizedSuspense skeletonType="card">
                      <Dashboard />
                    </OptimizedSuspense>
                  </ProtectedRoute>
                } />

                {/* Family Setup and Access */}
                <Route path="/family-access-setup" element={
                  <ProtectedRoute>
                    <OptimizedSuspense skeletonType="card">
                      <FamilyAccessSetup />
                    </OptimizedSuspense>
                  </ProtectedRoute>
                } />

                {/* Live Map Routes */}
                <Route path="/map" element={
                  <ProtectedRoute>
                    <OptimizedSuspense skeletonType="card">
                      <MapScreen />
                    </OptimizedSuspense>
                  </ProtectedRoute>
                } />
                
                <Route path="/circles" element={
                  <ProtectedRoute>
                    <OptimizedSuspense skeletonType="card">
                      <MyCirclesPage />
                    </OptimizedSuspense>
                  </ProtectedRoute>
                } />
                
                <Route path="/places" element={
                  <ProtectedRoute>
                    <OptimizedSuspense skeletonType="card">
                      <PlacesManager />
                    </OptimizedSuspense>
                  </ProtectedRoute>
                } />

                <Route path="/history" element={
                  <ProtectedRoute>
                    <OptimizedSuspense skeletonType="card">
                      <LocationHistoryPage />
                    </OptimizedSuspense>
                  </ProtectedRoute>
                } />

                {/* Demo and Test Pages */}
                <Route path="/map-demo" element={
                  <OptimizedSuspense skeletonType="card">
                    <MapDemo />
                  </OptimizedSuspense>
                } />

                {import.meta.env.DEV && TestPage && (
                  <Route path="/test" element={
                    <OptimizedSuspense skeletonType="card">
                      <TestPage />
                    </OptimizedSuspense>
                  } />
                )}

                {/* Device Pages */}
                <Route path="/devices/lifelink-sync-pendant" element={
                  <OptimizedSuspense skeletonType="card">
                    <DeviceIceSosPendant />
                  </OptimizedSuspense>
                } />

                {/* Regional Pages */}
                <Route path="/regional-center/spain" element={
                  <OptimizedSuspense skeletonType="card">
                    <RegionalCenterSpain />
                  </OptimizedSuspense>
                } />

                {/* Legacy SOS route redirect */}
                <Route path="/sos" element={
                  <ProtectedSOSRoute>
                    <Navigate to="/sos-app" replace />
                  </ProtectedSOSRoute>
                } />

                {/* Legacy family route redirect */}
                <Route path="/family/*" element={
                  <Navigate to="/family-dashboard" replace />
                } />

                {/* Common short paths redirect to member dashboard */}
                <Route path="/subscription" element={
                  <Navigate to="/member-dashboard/subscription" replace />
                } />
                <Route path="/emergency" element={
                  <Navigate to="/member-dashboard/emergency" replace />
                } />
                <Route path="/profile" element={
                  <Navigate to="/member-dashboard/profile" replace />
                } />

                {/* 404 - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <DeviceManagerButton />
            </main>
            <Toaster />
          </>
        );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <EnhancedErrorBoundary>
          <AnalyticsProvider>
            <ClaraChatProvider>
              <AppWithTracking />
              <GlobalClaraChat />
              <CookieConsent />
            </ClaraChatProvider>
          </AnalyticsProvider>
        </EnhancedErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;