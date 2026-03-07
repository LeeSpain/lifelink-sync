import React from 'react';
import { WorkflowProvider } from '@/contexts/RivenWorkflowContext';
import { SimplifiedRivenWorkflow } from './SimplifiedRivenWorkflow';

export const UnifiedRivenWorkflow: React.FC = () => {
  return (
    <WorkflowProvider>
      <SimplifiedRivenWorkflow />
    </WorkflowProvider>
  );
};