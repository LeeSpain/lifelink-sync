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

  const getCircleHealthScore = () => {
    let score = 0;
    if (activeFamily.length >= 2) score += 40;
    else if (activeFamily.length >= 1) score += 20;
    if (activeTrusted.length >= 1) score += 30;
    if (totalActive >= 5) score += 20;
    if (totalPending === 0) score += 10;
    return Math.min(score, 100);
  };

  const circleHealth = getCircleHealthScore();

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Family Circle
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Your emergency network and protection readiness
            </p>
          </div>
          <Badge
            variant={circleHealth >= 80 ? "default" : circleHealth >= 60 ? "secondary" : "outline"}
          >
            {circleHealth >= 80 ? 'Excellent' : circleHealth >= 60 ? 'Good' : 'Setup Needed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Score and Stats */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-3xl font-bold text-foreground">{circleHealth}%</p>
            <p className="text-xs text-muted-foreground">Circle Health</p>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-semibold text-foreground">{totalActive}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-semibold text-foreground">{totalPending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-semibold text-foreground">{activeFamily.length}</div>
              <div className="text-xs text-muted-foreground">Family</div>
            </div>
          </div>
        </div>

        <Progress value={circleHealth} className="h-2" />

        {/* Connection Types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 p-3 rounded-lg border">
            <Crown className="h-4 w-4 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">Family Circle</div>
              <div className="text-xs text-muted-foreground">
                {activeFamily.length} member{activeFamily.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-lg border">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">Trusted Contacts</div>
              <div className="text-xs text-muted-foreground">
                {activeTrusted.length} contact{activeTrusted.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            onClick={() => navigate('/member-dashboard/connections')}
            size="sm"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Add Connection
          </Button>
          <Button
            onClick={() => navigate('/member-dashboard/live-map')}
            variant="outline"
            size="sm"
          >
            <Map className="h-3.5 w-3.5 mr-1.5" />
            Live Map
          </Button>
        </div>

        {/* Setup Recommendations */}
        {circleHealth < 80 && (
          <div className="p-3 rounded-lg border border-dashed">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-medium mb-1">Strengthen your circle</p>
                <ul className="space-y-0.5 text-muted-foreground">
                  {activeFamily.length < 2 && <li>Add 2+ family members for full coverage</li>}
                  {activeTrusted.length < 1 && <li>Add trusted contacts for backup</li>}
                  {totalPending > 0 && <li>Follow up on {totalPending} pending invite{totalPending !== 1 ? 's' : ''}</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalActive === 0 && totalPending === 0 && (
          <div className="text-center py-4 border-t">
            <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <h4 className="font-medium text-sm mb-1">Build your emergency network</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Add family members and trusted contacts for emergency alerts
            </p>
            <Button onClick={() => navigate('/member-dashboard/connections')} size="sm">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Get Started
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
