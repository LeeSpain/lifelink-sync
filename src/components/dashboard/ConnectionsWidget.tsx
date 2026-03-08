import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Shield, Plus, ArrowRight, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useConnections, useSpainRule } from '@/hooks/useConnections';
import { SpainRuleBanner } from './SpainRuleBanner';

export const ConnectionsWidget = () => {
  const { t } = useTranslation();
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
                {t('connectionsWidget.title')}
              </CardTitle>
              <CardDescription>
                {t('connectionsWidget.description')}
              </CardDescription>
            </div>
            <Button onClick={handleManageConnections} size="sm">
              <Settings className="h-4 w-4 mr-2" />
              {t('connectionsWidget.manage')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">{totalActive}</div>
              <div className="text-sm text-muted-foreground">{t('connectionsWidget.activeConnections')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">{totalPending}</div>
              <div className="text-sm text-muted-foreground">{t('connectionsWidget.pendingInvites')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">{activeFamily.length}</div>
              <div className="text-sm text-muted-foreground">{t('connectionsWidget.familyMembers')}</div>
            </div>
          </div>

          {/* Connection Types */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <Crown className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="font-semibold">{t('connectionsWidget.familyCircle')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('connectionsWidget.membersWithAccess', { count: activeFamily.length })}
                </div>
              </div>
              <Badge variant="default">{activeFamily.length}</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-semibold">{t('connectionsWidget.trustedContacts')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('connectionsWidget.emergencyOnlyContacts', { count: activeTrusted.length })}
                </div>
              </div>
              <Badge variant="secondary">{activeTrusted.length}</Badge>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button onClick={handleManageConnections} size="sm" className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              {t('connectionsWidget.addConnection')}
            </Button>
            <Button onClick={handleManageConnections} variant="outline" size="sm" className="flex-1">
              {t('connectionsWidget.viewAll')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Empty State */}
          {totalActive === 0 && (
            <div className="text-center py-6 border-t">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h4 className="font-semibold mb-2">{t('connectionsWidget.noConnectionsYet')}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t('connectionsWidget.addToNotify')}
              </p>
              <Button onClick={handleManageConnections}>
                <Plus className="h-4 w-4 mr-2" />
                {t('connectionsWidget.addFirstConnection')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};