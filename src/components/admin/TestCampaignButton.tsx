import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Play, RefreshCw } from 'lucide-react';

interface TestButtonProps {
  onSuccess?: () => void;
}

export default function TestCampaignButton({ onSuccess }: TestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Running test campaign...');
      
      const response = await supabase.functions.invoke('riven-marketing-enhanced', {
        body: {
          command: 'Create a test blog post about family safety and emergency preparedness for parents',
          title: 'Test Family Safety Blog Post',
          workflow_id: `test-workflow-${Date.now()}`,
          settings: {
            auto_approve_content: true,
            content_quality: 'high',
            seo_optimization: true
          },
          scheduling_options: {
            mode: 'optimal',
            schedule_time: null
          },
          publishing_controls: {
            approval_required: false,
            auto_schedule: false
          }
        }
      });

      console.log('📥 Test response:', response);

      if (response.error) {
        console.error('❌ Test failed:', response.error);
        throw new Error(response.error.message || 'Test failed');
      }

      const data = response.data;
      if (data?.success) {
        toast({
          title: "Test Successful!",
          description: `Campaign created: ${data.campaign_created ? '✅' : '❌'} | Response: ${data.response?.substring(0, 100)}...`,
        });
        onSuccess?.();
      } else {
        throw new Error(data?.error || 'Test failed');
      }
    } catch (error) {
      console.error('❌ Test error:', error);
      toast({
        title: "Test Failed",
        description: error.message || 'Failed to run test campaign',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={runTest} 
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      Test Campaign
    </Button>
  );
}