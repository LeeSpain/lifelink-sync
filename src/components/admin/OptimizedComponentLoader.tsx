import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WorkflowProvider } from '@/contexts/RivenWorkflowContext';
import { SimplifiedRivenWorkflow } from './SimplifiedRivenWorkflow';
import { ContentApprovalDashboard } from './ContentApprovalDashboard';
import { RealContentApproval } from './RealContentApproval';
import { SocialHub } from './SocialHub';
import { RealSocialMediaOAuth } from './RealSocialMediaOAuth';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import CampaignMonitor from './CampaignMonitor';
import EnhancedContentApproval from './content/EnhancedContentApproval';

// Enhanced Professional Components
import EnhancedContentApprovalDashboard from './enhanced/ContentApprovalDashboard';
import AdvancedAnalyticsDashboard from './enhanced/AdvancedAnalyticsDashboard';
import ProfessionalSocialHub from './enhanced/ProfessionalSocialHub';
import AdvancedCampaignMonitor from './enhanced/AdvancedCampaignMonitor';

// AI & Configuration Components - Direct imports
import AIModelSettingsPage from './pages/AIModelSettingsPage';
import AITrainingPage from './pages/AITrainingPage';
import RivenConfigurationPage from './pages/RivenConfigurationPage';
import WorkflowPipeline from './workflow/WorkflowPipeline';

// Quality Assurance Components
import QualityAssuranceDashboard from './monitoring/QualityAssuranceDashboard';

interface OptimizedComponentLoaderProps {
  type: 'command-center' | 'workflow-pipeline' | 'content-approval' | 'social-hub' | 'analytics' | 'monitor' | 'ai-settings' | 'training-data' | 'riven-config' | 'quality-assurance-dashboard';
  props: any;
  enhanced?: boolean; // Flag to use enhanced components
}

export default function OptimizedComponentLoader({ type, props, enhanced = true }: OptimizedComponentLoaderProps) {
  console.log('Loading component type:', type, 'Enhanced:', enhanced);
  
  try {
    switch (type) {
      case 'command-center':
        return (
          <WorkflowProvider>
            <SimplifiedRivenWorkflow />
          </WorkflowProvider>
        );
      case 'workflow-pipeline':
        return <WorkflowPipeline {...props} />;
      case 'content-approval':
        return (
          <WorkflowProvider>
            <EnhancedContentApproval 
              content={props.contents || []}
              onApprove={props.onContentApproval || (() => {})}
              onReject={props.onRejectContent || (() => {})}
              onPublish={props.onPublishContent || (() => {})}
              onDelete={props.onDeleteContent || (() => {})}
              onEdit={props.onEditContent || (() => {})}
            />
          </WorkflowProvider>
        );
      case 'social-hub':
        return enhanced ? (
          <ProfessionalSocialHub onAccountsUpdate={props.onAccountsUpdate || (() => {})} />
        ) : (
          <RealSocialMediaOAuth onAccountsUpdate={props.onAccountsUpdate || (() => {})} />
        );
      case 'analytics':
        return enhanced ? (
          <AdvancedAnalyticsDashboard {...props} />
        ) : (
          <AnalyticsDashboard {...props} />
        );
      case 'monitor':
        return enhanced ? (
          <AdvancedCampaignMonitor {...props} />
        ) : (
          <CampaignMonitor {...props} />
        );
      case 'ai-settings':
        return <AIModelSettingsPage {...props} />;
      case 'training-data':
        return <AITrainingPage {...props} />;
      case 'riven-config':
        return <RivenConfigurationPage {...props} />;
      case 'quality-assurance-dashboard':
        return <QualityAssuranceDashboard {...props} />;
      default:
        console.warn('Unknown component type:', type);
        return null;
    }
  } catch (error) {
    console.error('Error loading component:', type, error);
    return <div>Error loading component: {type}</div>;
  }
}