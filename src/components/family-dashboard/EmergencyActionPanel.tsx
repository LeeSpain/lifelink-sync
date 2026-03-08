import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Phone, 
  Shield, 
  Heart, 
  Car, 
  MessageSquare,
  CheckCircle,
  Clock,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface EmergencyActionPanelProps {
  onEmergencyTrigger: (type: 'sos' | 'panic' | 'medical' | 'accident', message?: string) => void;
  onCheckIn: (message?: string) => void;
  isConnected: boolean;
  className?: string;
}

interface EmergencyAction {
  id: 'sos' | 'panic' | 'medical' | 'accident';
  labelKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  color: string;
  priority: 'critical' | 'high' | 'medium';
}

const emergencyActions: EmergencyAction[] = [
  {
    id: 'sos',
    labelKey: 'familyDashboard.generalSos',
    descriptionKey: 'familyDashboard.needImmediateHelp',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-red-600 bg-red-100 hover:bg-red-200',
    priority: 'critical'
  },
  {
    id: 'medical',
    labelKey: 'familyDashboard.medicalEmergency',
    descriptionKey: 'familyDashboard.medicalAssistanceNeeded',
    icon: <Heart className="h-5 w-5" />,
    color: 'text-red-600 bg-red-100 hover:bg-red-200',
    priority: 'critical'
  },
  {
    id: 'accident',
    labelKey: 'familyDashboard.accident',
    descriptionKey: 'familyDashboard.vehicleInjuryAccident',
    icon: <Car className="h-5 w-5" />,
    color: 'text-orange-600 bg-orange-100 hover:bg-orange-200',
    priority: 'high'
  },
  {
    id: 'panic',
    labelKey: 'familyDashboard.panicButton',
    descriptionKey: 'familyDashboard.silentEmergencyAlert',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-purple-600 bg-purple-100 hover:bg-purple-200',
    priority: 'high'
  }
];

export function EmergencyActionPanel({
  onEmergencyTrigger,
  onCheckIn,
  isConnected,
  className
}: EmergencyActionPanelProps) {
  const { t } = useTranslation();
  const [selectedAction, setSelectedAction] = useState<EmergencyAction | null>(null);
  const [message, setMessage] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [showCheckInForm, setShowCheckInForm] = useState(false);

  const handleEmergencyClick = (action: EmergencyAction) => {
    setSelectedAction(action);
    setIsConfirming(true);
    setMessage('');
  };

  const handleConfirmEmergency = () => {
    if (selectedAction) {
      onEmergencyTrigger(selectedAction.id, message || undefined);
      setIsConfirming(false);
      setSelectedAction(null);
      setMessage('');
    }
  };

  const handleCheckInSubmit = () => {
    onCheckIn(checkInMessage || undefined);
    setShowCheckInForm(false);
    setCheckInMessage('');
  };

  const handleCancel = () => {
    setIsConfirming(false);
    setSelectedAction(null);
    setMessage('');
    setShowCheckInForm(false);
    setCheckInMessage('');
  };

  if (isConfirming && selectedAction) {
    return (
      <Card className={cn("border-red-200 bg-red-50", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-full", selectedAction.color)}>
              {selectedAction.icon}
            </div>
            <div>
              <CardTitle className="text-lg text-red-800">
                {t('familyDashboard.confirm', { action: t(selectedAction.labelKey) })}
              </CardTitle>
              <p className="text-sm text-red-600">
                {t(selectedAction.descriptionKey)}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-3 bg-red-100 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 font-medium mb-1">
              {t('familyDashboard.alertAllMembers')}
            </p>
            <p className="text-xs text-red-600">
              {t('familyDashboard.locationSharedWarning')}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-red-800 mb-2 block">
              {t('familyDashboard.optionalMessage')}
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('familyDashboard.messagePlaceholder')}
              className="border-red-200 focus:border-red-400"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleConfirmEmergency}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={!isConnected}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {t('familyDashboard.confirmEmergency')}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-6"
            >
              {t('familyDashboard.cancel')}
            </Button>
          </div>

          {!isConnected && (
            <div className="text-xs text-red-600 text-center">
              {t('familyDashboard.noConnectionWarning')}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (showCheckInForm) {
    return (
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-green-800">
                {t('familyDashboard.familyCheckIn')}
              </CardTitle>
              <p className="text-sm text-green-600">
                {t('familyDashboard.letFamilyKnowSafe')}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-green-800 mb-2 block">
              {t('familyDashboard.optionalMessageLabel')}
            </label>
            <Textarea
              value={checkInMessage}
              onChange={(e) => setCheckInMessage(e.target.value)}
              placeholder={t('familyDashboard.checkInPlaceholder')}
              className="border-green-200 focus:border-green-400"
              rows={2}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleCheckInSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={!isConnected}
            >
              <Send className="h-4 w-4 mr-2" />
              {t('familyDashboard.sendCheckIn')}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-6"
            >
              {t('familyDashboard.cancel')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t('familyDashboard.emergencyActions')}
          <Badge variant={isConnected ? "default" : "secondary"} className="ml-auto">
            {isConnected ? t('familyDashboard.online') : t('familyDashboard.offline')}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Emergency Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          {emergencyActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              onClick={() => handleEmergencyClick(action)}
              className={cn(
                "h-auto p-3 flex flex-col items-center gap-2 hover:scale-105 transition-transform",
                action.color
              )}
              disabled={!isConnected}
            >
              {action.icon}
              <div className="text-center">
                <div className="font-medium text-xs">{t(action.labelKey)}</div>
                <div className="text-xs opacity-75 font-normal">
                  {t(action.descriptionKey)}
                </div>
              </div>
              {action.priority === 'critical' && (
                <Badge variant="destructive" className="text-xs">
                  {t('familyDashboard.critical')}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => setShowCheckInForm(true)}
            className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
            disabled={!isConnected}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {t('familyDashboard.checkIn')}
          </Button>

          <Button
            variant="outline"
            onClick={() => window.open('tel:911', '_self')}
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Phone className="h-4 w-4 mr-2" />
            {t('familyDashboard.call911')}
          </Button>
        </div>
        
        {/* Status Information */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{t('familyDashboard.instantFamilyAlerts')}</span>
          </div>
          {!isConnected && (
            <Badge variant="outline" className="text-xs text-orange-600">
              {t('familyDashboard.offlineMode')}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}