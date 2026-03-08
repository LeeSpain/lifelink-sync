import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, Shield, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface EmergencyDisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onCancel: () => void;
  subscriptionTier: 'basic' | 'call_centre' | null;
}

export const EmergencyDisclaimerModal: React.FC<EmergencyDisclaimerModalProps> = ({
  isOpen,
  onAccept,
  onCancel,
  subscriptionTier
}) => {
  const { t } = useTranslation();
  const [hasAccepted, setHasAccepted] = useState(false);

  const handleAccept = () => {
    setHasAccepted(true);
    onAccept();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-lg mx-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emergency/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-emergency" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-emergency">
            {t('emergency.disclaimerTitle')}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {t('emergency.disclaimerSubtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Subscription Tier Status */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{t('emergency.yourCurrentPlan')}:</span>
              {subscriptionTier === 'call_centre' ? (
                <Badge variant="default" className="bg-wellness text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  {t('emergency.callCentrePlan')}
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Shield className="w-3 h-3 mr-1" />
                  {t('emergency.basicPlan')}
                </Badge>
              )}
            </div>
          </div>

          {/* Basic Plan Description */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-900">{t('emergency.basicPlanTitle')}</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• {t('emergency.basicPlanItem1')}</li>
                  <li>• {t('emergency.basicPlanItem2')}</li>
                  <li>• {t('emergency.basicPlanItem3')}</li>
                </ul>
              </div>
            </div>

            {/* Call Centre Plan Description */}
            <div className={`space-y-1 p-3 rounded-lg border ${
              subscriptionTier === 'call_centre' 
                ? 'bg-wellness/10 border-wellness/30' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <Crown className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  subscriptionTier === 'call_centre' ? 'text-wellness' : 'text-gray-400'
                }`} />
                <div className="space-y-1">
                  <h4 className={`font-semibold ${
                    subscriptionTier === 'call_centre' ? 'text-wellness' : 'text-gray-600'
                  }`}>
                    {t('emergency.callCentrePlanTitle')}
                  </h4>
                  <ul className={`text-sm space-y-1 ${
                    subscriptionTier === 'call_centre' ? 'text-wellness' : 'text-gray-500'
                  }`}>
                    <li>• {t('emergency.callCentrePlanItem1')}</li>
                    <li>• {t('emergency.callCentrePlanItem2')}</li>
                    <li>• {t('emergency.callCentrePlanItem3')}</li>
                  </ul>
                  {subscriptionTier !== 'call_centre' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('emergency.upgradeToAccess')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Critical Warning */}
          <div className="bg-emergency/10 border border-emergency/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-emergency mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-bold text-emergency">{t('emergency.criticalWarning')}</h4>
                <p className="text-sm text-emergency font-medium">
                  {t('emergency.notReplacement')}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>{t('emergency.alwaysCall112')}</strong> {t('emergency.forLifeThreatening')}
                </p>
              </div>
            </div>
          </div>

          {/* Acknowledgment */}
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-center text-muted-foreground leading-relaxed">
              {t('emergency.acknowledgment')}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            {t('emergency.cancel')}
          </Button>
          <Button 
            onClick={handleAccept} 
            className="w-full sm:w-auto bg-emergency hover:bg-emergency/90"
          >
            {t('emergency.iUnderstandAccept')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};