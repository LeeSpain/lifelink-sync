import React from 'react';
import { Shield, Crown, Phone, AlertTriangle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SubscriptionTier } from '@/hooks/useSubscriptionTier';

interface EmergencyStatusBannerProps {
  subscriptionTier: SubscriptionTier;
  className?: string;
}

export const EmergencyStatusBanner: React.FC<EmergencyStatusBannerProps> = ({
  subscriptionTier,
  className = ""
}) => {
  return (
    <Card className={`border-2 ${subscriptionTier === 'call_centre' ? 'border-wellness/30 bg-wellness/5' : 'border-blue-200 bg-blue-50'} ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Current Plan Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {subscriptionTier === 'call_centre' ? (
                <Crown className="w-4 h-4 text-wellness" />
              ) : (
                <Shield className="w-4 h-4 text-blue-600" />
              )}
              <span className="font-semibold text-sm">Emergency Plan:</span>
            </div>
            {subscriptionTier === 'call_centre' ? (
              <Badge className="bg-wellness text-white">
                <Crown className="w-3 h-3 mr-1" />
                Call Centre Active
              </Badge>
            ) : (
              <Badge variant="outline" className="border-blue-300 text-blue-700">
                <Shield className="w-3 h-3 mr-1" />
                Basic Contacts
              </Badge>
            )}
          </div>

          {/* Plan Description */}
          <div className="text-sm">
            {subscriptionTier === 'call_centre' ? (
              <div className="text-wellness">
                <p className="font-medium">✅ Direct call centre connection active</p>
                <p className="text-xs text-wellness/80 mt-1">
                  Emergency calls route directly to Spain Emergency Response Centre
                </p>
              </div>
            ) : (
              <div className="text-blue-700">
                <p className="font-medium">📞 Emergency contacts will be called sequentially</p>
                <p className="text-xs text-blue-600 mt-1">
                  Contacts called one-by-one until someone answers (15-second intervals)
                </p>
              </div>
            )}
          </div>

          {/* Critical Notice */}
          <div className="border-t border-current/20 pt-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-emergency flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emergency">
                <span className="font-semibold">Always call 112/911 first</span> for life-threatening emergencies
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};