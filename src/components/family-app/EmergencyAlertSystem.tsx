import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Phone, MapPin, Clock, Bell } from 'lucide-react';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { toast } from 'sonner';

interface EmergencyAlert {
  id: string;
  memberName: string;
  type: 'sos' | 'fall' | 'panic' | 'medical';
  location: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const EmergencyAlertSystem = () => {
  const { data: familyRole } = useFamilyRole();
  const { data: familyData } = useFamilyMembers(familyRole?.familyGroupId);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [acknowledgingAlert, setAcknowledgingAlert] = useState<string | null>(null);

  // Mock emergency alerts for demonstration
  useEffect(() => {
    const mockAlerts: EmergencyAlert[] = [
      // Uncomment to see demo alerts
      // {
      //   id: '1',
      //   memberName: 'John Doe',
      //   type: 'sos',
      //   location: 'Central Park, NYC',
      //   timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      //   status: 'active',
      //   priority: 'critical'
      // }
    ];
    setAlerts(mockAlerts);
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'sos': return <AlertTriangle className="h-4 w-4" />;
      case 'fall': return <AlertTriangle className="h-4 w-4" />;
      case 'panic': return <AlertTriangle className="h-4 w-4" />;
      case 'medical': return <Phone className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    setAcknowledgingAlert(alertId);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged' as const }
        : alert
    ));
    
    setAcknowledgingAlert(null);
    toast.success('Alert acknowledged');
  };

  const handleCallMember = (memberName: string) => {
    toast.info(`Calling ${memberName}...`);
    // In real implementation, this would initiate a call
  };

  const activeAlerts = alerts.filter(alert => alert.status === 'active');

  return (
    <Card className="bg-white/10 border-white/20 text-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Emergency Alerts
          </CardTitle>
          <Badge 
            variant={activeAlerts.length > 0 ? 'destructive' : 'default'} 
            className="text-xs"
          >
            {activeAlerts.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-white/60">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No emergency alerts</p>
            <p className="text-xs opacity-60">Family members are safe</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.id} className="bg-white/5 border-white/10">
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full ${getAlertColor(alert.priority)} mt-1`}></div>
                  <div className="flex-1">
                    <AlertDescription className="text-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getAlertIcon(alert.type)}
                          <span className="font-medium">{alert.memberName}</span>
                          <Badge variant="outline" className="text-xs border-white/20">
                            {alert.type.toUpperCase()}
                          </Badge>
                        </div>
                        <Badge 
                          variant={alert.status === 'active' ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {alert.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-white/80">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>{alert.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{alert.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {alert.status === 'active' && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            disabled={acknowledgingAlert === alert.id}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {acknowledgingAlert === alert.id ? 'Acknowledging...' : 'Acknowledge'}
                          </Button>
                          <Button
                            onClick={() => handleCallMember(alert.memberName)}
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergencyAlertSystem;