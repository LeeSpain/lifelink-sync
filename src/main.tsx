import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { HelmetProvider } from 'react-helmet-async'
import { PreferencesProvider } from '@/contexts/PreferencesContext'
import { AuthProvider } from '@/contexts/AuthContext'

import { performanceMonitor } from '@/utils/performance'
import ErrorBoundary from './components/ErrorBoundary'
import './utils/errorReporting' // Initialize global error handlers

// Initialize performance monitoring
performanceMonitor.mark('app-start');


// Preload critical resources
const preloadCriticalResources = () => {
  const criticalImages = [
    '/lovable-uploads/7ad599e6-d1cd-4a1b-84f4-9b6b1e4242e1.png',
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

preloadCriticalResources();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <HelmetProvider>
      <AuthProvider>
        <PreferencesProvider>
          <App />
        </PreferencesProvider>
      </AuthProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

// Log performance metrics after app loads
window.addEventListener('load', () => {
  performanceMonitor.mark('app-loaded');
  performanceMonitor.measure('app-load-time', 'app-start', 'app-loaded');
  
  // Log Core Web Vitals after a delay
  setTimeout(() => {
    performanceMonitor.logSummary();
  }, 2000);
});