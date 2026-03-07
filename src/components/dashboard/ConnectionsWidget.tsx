import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Shield, Plus, ArrowRight, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useConnections, useSpainRule } from '@/hooks/useConnections';
import { SpainRuleBanner } from './SpainRuleBanner';

export const ConnectionsWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: familyConnections = [] } = useConnections('family_circle');
  const { data: trustedConnections = [] } = useConnections('trusted_contact');
  const { data: spainRule } = useSpainRule();

  const activeFamily = familyConnections.filter(c => c.status === 'active');
  const activeTrusted = trustedConnections.filter(c => c.status === 'active');
  const totalActive = activeFamily.length + activeTrusted.length;
  const totalPending = [...familyConnections, ...trustedConnections].filter(c => c.status === 'pending').length;

  const handleManageConnections = () => {
    navigate('/member-dashboard/connections');
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      {/* Spain Rule Banner */}
      <SpainRuleBanner spainRule={spainRule} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Emergency Connections
              </CardTitle>
              <CardDescription>
                Manage your family circle and trusted contacts for emergency situations
              </CardDescription>
            </div>
            <Button onClick={handleManageConnections} size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalActive}</div>
              <div className="text-sm text-muted-foreground">Active Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{totalPending}</div>
              <div className="text-sm text-muted-foreground">Pending Invites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{activeFamily.length}</div>
              <div className="text-sm text-muted-foreground">Family Members</div>
            </div>
          </div>

          {/* Connection Types */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5">
              <Crown className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <div className="font-semibold">Family Circle</div>
                <div className="text-sm text-muted-foreground">
                  {activeFamily.length} members with full access
                </div>
              </div>
              <Badge variant="default">{activeFamily.length}</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border bg-secondary/5">
              <Shield className="h-8 w-8 text-secondary" />
              <div className="flex-1">
                <div className="font-semibold">Trusted Contacts</div>
                <div className="text-sm text-muted-foreground">
                  {activeTrusted.length} emergency-only contacts
                </div>
              </div>
              <Badge variant="secondary">{activeTrusted.length}</Badge>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button onClick={handleManageConnections} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
            <Button onClick={handleManageConnections} variant="outline" className="flex-1">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Empty State */}
          {totalActive === 0 && (
            <div className="text-center py-6 border-t">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h4 className="font-semibold mb-2">No connections yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Add family members and trusted contacts to notify them during emergencies
              </p>
              <Button onClick={handleManageConnections}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Connection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};