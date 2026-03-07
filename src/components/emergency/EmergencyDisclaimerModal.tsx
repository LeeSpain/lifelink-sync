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
            🚨 Emergency SOS Disclaimer
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Please read carefully before using Emergency SOS
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Subscription Tier Status */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">Your Current Plan:</span>
              {subscriptionTier === 'call_centre' ? (
                <Badge variant="default" className="bg-wellness text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Call Centre Plan
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Shield className="w-3 h-3 mr-1" />
                  Basic Plan
                </Badge>
              )}
            </div>
          </div>

          {/* Basic Plan Description */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-900">BASIC PLAN: Emergency Contacts Only</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Contacts called one-by-one until someone answers (15-second intervals)</li>
                  <li>• Email alerts sent simultaneously with location</li>
                  <li>• You are responsible for ensuring contacts respond</li>
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
                    CALL CENTRE PLAN: Direct Professional Response
                  </h4>
                  <ul className={`text-sm space-y-1 ${
                    subscriptionTier === 'call_centre' ? 'text-wellness' : 'text-gray-500'
                  }`}>
                    <li>• Immediate connection to Spain Emergency Call Centre</li>
                    <li>• Professional emergency response coordination</li>
                    <li>• Backup contact alerts still sent as additional layer</li>
                  </ul>
                  {subscriptionTier !== 'call_centre' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Upgrade to access professional emergency response
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
                <h4 className="font-bold text-emergency">⚠️ CRITICAL WARNING</h4>
                <p className="text-sm text-emergency font-medium">
                  This service is NOT a replacement for official emergency services.
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Always call 112 (EU) / 911 (US) first</strong> for life-threatening emergencies.
                </p>
              </div>
            </div>
          </div>

          {/* Acknowledgment */}
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-center text-muted-foreground leading-relaxed">
              By using Emergency SOS, you acknowledge this service supplements but does not replace official emergency services.
              You understand the limitations of your current plan and accept responsibility for your emergency preparedness.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleAccept} 
            className="w-full sm:w-auto bg-emergency hover:bg-emergency/90"
          >
            I Understand & Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};