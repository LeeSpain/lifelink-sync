
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import EnhancedDashboardOverview from '@/components/admin/pages/EnhancedDashboardOverview';
import CustomersPage from '@/components/admin/pages/CustomersPage';
import CustomerProfilePage from '@/components/admin/CustomerProfilePage';
import LeadsPage from '@/components/admin/pages/LeadsPage';
import LeadIntelligencePage from '@/components/admin/pages/LeadIntelligencePage';
import ConversationsPage from '@/components/admin/pages/ConversationsPage';
import SubscriptionsPage from '@/components/admin/pages/SubscriptionsPage';
import ActivityPage from '@/components/admin/pages/ActivityPage';
import RevenueAnalyticsPage from '@/components/admin/pages/RevenueAnalyticsPage';
import UserGrowthPage from '@/components/admin/pages/UserGrowthPage';
import AIAgentPage from '@/components/admin/pages/AIAgentPage';
import AITrainingPage from '@/components/admin/pages/AITrainingPage';
import AIModelSettingsPage from '@/components/admin/pages/AIModelSettingsPage';
import RivenMarketingAI from '@/components/admin/pages/RivenMarketingAI';
import { EmailManagement } from '@/components/admin/EmailManagement';
import BlogManagementPage from '@/components/admin/pages/BlogManagementPage';
import { EnhancedMarketingCampaigns } from '@/components/admin/EnhancedMarketingCampaigns';
import ProductsPage from '@/components/admin/pages/ProductsPage';
import RegionalServicesPage from '@/components/admin/pages/RegionalServicesPage';
import GlobalProtectionPlansPage from '@/components/admin/pages/GlobalProtectionPlansPage';
import CommunicationPage from '@/components/admin/pages/CommunicationPage';
import FamilyAccountsPage from '@/components/admin/pages/FamilyAccountsPage';
import SystemSettingsPage from '@/components/admin/pages/SystemSettingsPage';
import ReportsPage from '@/components/admin/pages/ReportsPage';
import SubscriptionPlansPage from '@/components/admin/pages/SubscriptionPlansPage';
import AppTestingPage from '@/components/admin/pages/AppTestingPage';
import FlicControlAdminPage from '@/components/admin/pages/FlicControlAdminPage';
import ContactSubmissionsPage from '@/components/admin/pages/ContactSubmissionsPage';
import AnalyticsPage from '@/components/admin/pages/AnalyticsPage';
import VideoAnalyticsPage from '@/components/admin/pages/VideoAnalyticsPage';
import EmergencyIncidentsPage from '@/components/admin/pages/EmergencyIncidentsPage';
import SafetyMonitoringPage from '@/components/admin/pages/SafetyMonitoringPage';
import WhatsAppIntegrationPage from '@/components/admin/pages/WhatsAppIntegrationPage';
import AIPerformancePage from '@/components/admin/pages/AIPerformancePage';
import LiveMapMonitorPage from '@/components/admin/pages/LiveMapMonitorPage';
import CircleAnalyticsPage from '@/components/admin/pages/CircleAnalyticsPage';
import GeofenceAdminPage from '@/components/admin/pages/GeofenceAdminPage';
import LocationDataAdminPage from '@/components/admin/pages/LocationDataAdminPage';
import RegionalOrganizationsPage from '@/components/admin/pages/RegionalOrganizationsPage';
import RegionalUsersPage from '@/components/admin/pages/RegionalUsersPage';
import RegionalAuditPage from '@/components/admin/pages/RegionalAuditPage';
import RegionalHubPage from '@/components/admin/pages/RegionalHubPage';
import ProductionReadinessPanel from '@/components/admin/ProductionReadinessPanel';
import StripeSetupPage from '@/components/admin/pages/StripeSetupPage';
import MobileAppLaunchPage from '@/components/admin/pages/MobileAppLaunchPage';
import HealthCheckPage from '@/components/admin/pages/HealthCheckPage';
import GoLivePreparationPage from '@/components/admin/pages/GoLivePreparationPage';
import TransferToCare from '@/pages/admin/TransferToCare';

const AdminDashboard: React.FC = () => {
  useScrollToTop();
  
  console.log('🚀 AdminDashboard component is rendering at:', window.location.pathname);
  console.log('🚀 AdminDashboard: Full URL details:', {
    pathname: window.location.pathname,
    href: window.location.href,
    search: window.location.search,
    hash: window.location.hash,
    timestamp: new Date().toISOString()
  });
  
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<EnhancedDashboardOverview />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="video-analytics" element={<VideoAnalyticsPage />} />
        <Route path="revenue" element={<RevenueAnalyticsPage />} />
        <Route path="growth" element={<UserGrowthPage />} />
        <Route path="ai-agent" element={<AIAgentPage />} />
        <Route path="riven-marketing" element={<RivenMarketingAI />} />
        <Route path="email-management" element={<EmailManagement />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:userId" element={<CustomerProfilePage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="protection-plans" element={<GlobalProtectionPlansPage />} />
        <Route path="families" element={<FamilyAccountsPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="lead-intelligence" element={<LeadIntelligencePage />} />
        <Route path="conversations" element={<ConversationsPage />} />
        <Route path="ai-metrics" element={<AIPerformancePage />} />
        <Route path="contact-submissions" element={<ContactSubmissionsPage />} />
        <Route path="communication" element={<CommunicationPage />} />
        <Route path="whatsapp" element={<WhatsAppIntegrationPage />} />
        <Route path="live-map-monitor" element={<LiveMapMonitorPage />} />
        <Route path="circle-analytics" element={<CircleAnalyticsPage />} />
        <Route path="geofence-admin" element={<GeofenceAdminPage />} />
        <Route path="location-admin" element={<LocationDataAdminPage />} />
        <Route path="emergencies" element={<EmergencyIncidentsPage />} />
        <Route path="safety" element={<SafetyMonitoringPage />} />
        <Route path="regional-hub" element={<RegionalHubPage />} />
        <Route path="regional-organizations" element={<RegionalOrganizationsPage />} />
        <Route path="regional-users" element={<RegionalUsersPage />} />
        <Route path="regional-audit" element={<RegionalAuditPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="regional-services" element={<RegionalServicesPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="app-testing" element={<AppTestingPage />} />
        <Route path="flic-control" element={<FlicControlAdminPage />} />
        <Route path="production-check" element={<ProductionReadinessPanel />} />
        <Route path="health-check" element={<HealthCheckPage />} />
        <Route path="stripe-setup" element={<StripeSetupPage />} />
        <Route path="mobile-launch" element={<MobileAppLaunchPage />} />
        <Route path="go-live" element={<GoLivePreparationPage />} />
        <Route path="transfer-to-care" element={<TransferToCare />} />
        <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminDashboard;
