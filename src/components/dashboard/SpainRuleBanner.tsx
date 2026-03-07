import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown, Shield } from 'lucide-react';

interface SpainRuleBannerProps {
  spainRule?: {
    canProceed: boolean;
    activeConnections: number;
    hasRegional: boolean;
    isSpain: boolean;
  } | null;
}

export const SpainRuleBanner: React.FC<SpainRuleBannerProps> = ({ spainRule }) => {
  if (!spainRule || !spainRule.isSpain || spainRule.canProceed) {
    return null;
  }

  const handleSubscribeRegional = () => {
    // TODO: Implement regional subscription flow
    console.log('Subscribe to regional support');
  };

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold mb-1">Spain Compliance Requirement</p>
            <p className="text-sm">
              To complete onboarding and activate emergency services, you must have at least one active connection 
              OR subscribe to Regional Support. You currently have {spainRule.activeConnections} active connections.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSubscribeRegional}
            className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            Subscribe to Regional
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};