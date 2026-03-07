import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Phone,
  Users,
  MapPin,
  Heart,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConnections } from '@/hooks/useConnections';

interface EmergencyPreparednessProps {
  profile: any;
  subscription: any;
}

export const EmergencyPreparedness = ({ profile, subscription }: EmergencyPreparednessProps) => {
  const navigate = useNavigate();
  const { data: familyConnections = [] } = useConnections('family_circle');
  const { data: trustedConnections = [] } = useConnections('trusted_contact');

  const activeFamily = familyConnections.filter(c => c.status === 'active');
  const activeTrusted = trustedConnections.filter(c => c.status === 'active');

  // Calculate emergency preparedness score
  const getPreparednessScore = () => {
    let score = 0;
    
    // Basic protection (30 points)
    if (subscription?.subscribed) score += 30;
    
    // Emergency contacts (25 points)
    if (activeTrusted.length >= 1) score += 10;
    if (activeTrusted.length >= 3) score += 15;
    
    // Family network (25 points)
    if (activeFamily.length >= 1) score += 15;
    if (activeFamily.length >= 2) score += 10;
    
    // Profile completeness (20 points)
    if (profile?.first_name && profile?.last_name) score += 5;
    if (profile?.phone) score += 5;
    if (profile?.medical_conditions?.length > 0) score += 5;
    if (profile?.location_sharing_enabled) score += 5;
    
    return Math.min(score, 100);
  };

  const preparednessScore = getPreparednessScore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-950';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-950';
    return 'bg-red-100 dark:bg-red-950';
  };

  const preparednessItems = [
    {
      title: 'Active Protection',
      status: subscription?.subscribed,
      icon: Shield,
      action: () => navigate('/member-dashboard/subscription'),
      description: subscription?.subscribed ? 'Emergency services active' : 'Activate emergency monitoring'
    },
    {
      title: 'Emergency Contacts',
      status: activeTrusted.length >= 3,
      icon: Phone,
      action: () => navigate('/member-dashboard/connections'),
      description: `${activeTrusted.length}/3+ emergency contacts configured`
    },
    {
      title: 'Family Network',
      status: activeFamily.length >= 2,
      icon: Users,
      action: () => navigate('/member-dashboard/connections'),
      description: `${activeFamily.length}/2+ family members connected`
    },
    {
      title: 'Medical Information',
      status: profile?.medical_conditions?.length > 0,
      icon: Heart,
      action: () => navigate('/member-dashboard/profile'),
      description: profile?.medical_conditions?.length > 0 ? 'Medical info configured' : 'Add medical information'
    },
    {
      title: 'Location Sharing',
      status: profile?.location_sharing_enabled,
      icon: MapPin,
      action: () => navigate('/member-dashboard/settings'),
      description: profile?.location_sharing_enabled ? 'Location sharing enabled' : 'Enable location sharing'
    }
  ];

  return (
    <Card className={getScoreBg(preparednessScore)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-emergency" />
            Emergency Preparedness
          </CardTitle>
          <Badge 
            variant={preparednessScore >= 80 ? "default" : preparednessScore >= 60 ? "secondary" : "destructive"}
            className="text-xs"
          >
            {preparednessScore >= 80 ? 'Ready' : preparednessScore >= 60 ? 'Good' : 'Setup Needed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preparedness Score */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{preparednessScore}%</p>
            <p className="text-sm font-medium text-muted-foreground">Emergency Ready</p>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-2 ${getScoreColor(preparednessScore)}`}>
              {preparednessScore >= 80 ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              <span className="text-sm font-medium">
                {preparednessScore >= 80 ? 'Fully Ready' : preparednessScore >= 60 ? 'Almost Ready' : 'Needs Setup'}
              </span>
            </div>
          </div>
        </div>
        
        <Progress value={preparednessScore} className="h-3" />

        {/* Preparedness Checklist */}
        <div className="space-y-3">
          {preparednessItems.map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
              onClick={item.action}
            >
              <div className={`p-1.5 rounded-lg ${item.status ? 'bg-green-100 dark:bg-green-950' : 'bg-gray-100 dark:bg-gray-950'}`}>
                <item.icon className={`h-4 w-4 ${item.status ? 'text-green-600' : 'text-gray-500'}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{item.title}</p>
                  {item.status ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>

              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>

        {/* Improvement Suggestions */}
        {preparednessScore < 100 && (
          <div className="p-3 rounded-lg bg-accent/50 border border-accent">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium mb-1">Improve your emergency readiness:</p>
                <ul className="space-y-1 text-muted-foreground">
                  {!subscription?.subscribed && <li>• Activate emergency monitoring service</li>}
                  {activeTrusted.length < 3 && <li>• Add more emergency contacts ({3 - activeTrusted.length} more needed)</li>}
                  {activeFamily.length < 2 && <li>• Connect more family members</li>}
                  {!profile?.medical_conditions?.length && <li>• Add medical information for emergencies</li>}
                  {!profile?.location_sharing_enabled && <li>• Enable location sharing for faster response</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Quick Setup Action */}
        {preparednessScore < 80 && (
          <Button 
            onClick={() => navigate('/member-dashboard/connections')} 
            className="w-full" 
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Complete Emergency Setup
          </Button>
        )}
      </CardContent>
    </Card>
  );
};