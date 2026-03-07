import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Crown, 
  Shield, 
  Plus, 
  Map,
  UserPlus,
  ArrowRight,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConnections } from '@/hooks/useConnections';

export const FamilyCircleOverview = () => {
  const navigate = useNavigate();
  const { data: familyConnections = [] } = useConnections('family_circle');
  const { data: trustedConnections = [] } = useConnections('trusted_contact');

  const activeFamily = familyConnections.filter(c => c.status === 'active');
  const activeTrusted = trustedConnections.filter(c => c.status === 'active');
  const totalActive = activeFamily.length + activeTrusted.length;
  const totalPending = [...familyConnections, ...trustedConnections].filter(c => c.status === 'pending').length;

  // Calculate circle health score
  const getCircleHealthScore = () => {
    let score = 0;
    if (activeFamily.length >= 2) score += 40;
    if (activeTrusted.length >= 1) score += 30;
    if (totalActive >= 5) score += 20;
    if (totalPending === 0) score += 10; // No pending means all invites are managed
    return Math.min(score, 100);
  };

  const circleHealth = getCircleHealthScore();

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-950';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-950';
    return 'bg-red-100 dark:bg-red-950';
  };

  return (
    <Card className={`${getHealthBg(circleHealth)} border-0`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Family Circle Status
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Your emergency network and protection readiness
            </p>
          </div>
          <Badge 
            variant={circleHealth >= 80 ? "default" : circleHealth >= 60 ? "secondary" : "destructive"}
            className="text-xs"
          >
            {circleHealth >= 80 ? 'Excellent' : circleHealth >= 60 ? 'Good' : 'Needs Setup'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{/* Circle Health Score & Connection Summary - Combined */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold">{circleHealth}%</p>
            <p className="text-xs font-medium text-muted-foreground">Circle Health</p>
            <div className={`flex items-center gap-1 mt-1 ${getHealthColor(circleHealth)}`}>
              {circleHealth >= 80 ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              <span className="text-xs font-medium">
                {circleHealth >= 80 ? 'Ready' : circleHealth >= 60 ? 'Almost Ready' : 'Setup Needed'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-primary">{totalActive}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-500">{totalPending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{activeFamily.length}</div>
              <div className="text-xs text-muted-foreground">Family</div>
            </div>
          </div>
        </div>
        
        <Progress value={circleHealth} className="h-2" />

        {/* Connection Types - Compact */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 rounded-lg border bg-background/50">
            <Crown className="h-4 w-4 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs">Family Circle</div>
              <div className="text-xs text-muted-foreground">
                {activeFamily.length} members
              </div>
            </div>
            <Badge variant="default" className="text-xs px-1 py-0">{activeFamily.length}</Badge>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg border bg-background/50">
            <Shield className="h-4 w-4 text-secondary" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs">Trusted Contacts</div>
              <div className="text-xs text-muted-foreground">
                {activeTrusted.length} contacts
              </div>
            </div>
            <Badge variant="secondary" className="text-xs px-1 py-0">{activeTrusted.length}</Badge>
          </div>
        </div>

        {/* Quick Actions - Compact */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => navigate('/member-dashboard/connections')}
            className="text-xs h-8"
            size="sm"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Add Connection
          </Button>
          <Button 
            onClick={() => navigate('/member-dashboard/live-map')} 
            variant="outline" 
            className="text-xs h-8"
            size="sm"
          >
            <Map className="h-3 w-3 mr-1" />
            Live Map
          </Button>
        </div>

        {/* Setup Recommendations - Compact */}
        {circleHealth < 80 && (
          <div className="p-2 rounded-lg bg-accent/50 border border-accent">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-medium mb-1">Improve your circle:</p>
                <ul className="space-y-0.5 text-muted-foreground text-xs leading-tight">
                  {activeFamily.length < 2 && <li>• Add 2+ family members</li>}
                  {activeTrusted.length < 1 && <li>• Add trusted contacts</li>}
                  {totalPending > 0 && <li>• Follow up on pending invites</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Compact */}
        {totalActive === 0 && (
          <div className="text-center py-3 border-t">
            <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <h4 className="font-semibold text-sm mb-1">Build your emergency network</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Add family members and trusted contacts for emergency alerts
            </p>
            <Button onClick={() => navigate('/member-dashboard/connections')} size="sm" className="h-8 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Get Started
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};