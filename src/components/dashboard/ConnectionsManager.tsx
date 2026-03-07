import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Crown, Shield, Plus, MoreVertical, Mail, Phone, ArrowUp, ArrowDown,
  CheckCircle, Clock, XCircle, AlertTriangle, Edit, Trash2, UserMinus, UserPlus
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useConnections, useConnectionActions, Connection } from '@/hooks/useConnections';
import { ConnectionInviteModal } from './ConnectionInviteModal';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export const ConnectionsManager: React.FC = () => {
  const { data: familyConnections = [] } = useConnections('family_circle');
  const { data: trustedConnections = [] } = useConnections('trusted_contact');
  const { promoteConnection, demoteConnection, revokeConnection } = useConnectionActions();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteType, setInviteType] = useState<'family_circle' | 'trusted_contact'>('family_circle');

  const openInviteModal = (type: 'family_circle' | 'trusted_contact') => {
    setInviteType(type);
    setInviteModalOpen(true);
  };

  const getStatusBadge = (connection: Connection) => {
    switch (connection.status) {
      case 'active':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />{t('connections.active')}</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{t('connections.pending')}</Badge>;
      case 'revoked':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{t('connections.revoked')}</Badge>;
      default:
        return <Badge variant="outline">{t('connections.unknown')}</Badge>;
    }
  };

  const getInviteUrl = (connection: Connection) => {
    if (!connection.invite_token) return '';
    return `${window.location.origin}/invite/connections/${connection.invite_token}`;
  };

  const copyInviteUrl = (connection: Connection) => {
    const url = getInviteUrl(connection);
    navigator.clipboard.writeText(url);
    toast({
      title: t('connections.inviteLinkCopied'),
      description: t('connections.inviteLinkCopiedDesc'),
    });
  };

  const handlePromote = async (connectionId: string) => {
    try {
      await promoteConnection.mutateAsync(connectionId);
    } catch (error) {
      console.error('Failed to promote connection:', error);
    }
  };

  const handleDemote = async (connectionId: string) => {
    try {
      await demoteConnection.mutateAsync(connectionId);
    } catch (error) {
      console.error('Failed to demote connection:', error);
    }
  };

  const handleRevoke = async (connectionId: string) => {
    if (window.confirm(t('connections.revokeConfirm'))) {
      try {
        await revokeConnection.mutateAsync(connectionId);
      } catch (error) {
        console.error('Failed to revoke connection:', error);
      }
    }
  };

  const ConnectionCard = ({ connection }: { connection: Connection }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              connection.type === 'family_circle' ? 'bg-primary/10' : 'bg-secondary/10'
            }`}>
              {connection.type === 'family_circle' ? 
                <Crown className="h-5 w-5 text-primary" /> : 
                <Shield className="h-5 w-5 text-secondary" />
              }
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{connection.invite_email}</h4>
                {getStatusBadge(connection)}
                <Badge variant="outline" className="text-xs">
                  {t('connections.priority')} {connection.escalation_priority}
                </Badge>
              </div>
              {connection.relationship && (
                <p className="text-sm text-muted-foreground">{connection.relationship}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <span>{t('connections.channels')}: {connection.notify_channels.join(', ')}</span>
                <span>{t('connections.language')}: {connection.preferred_language}</span>
              </div>
              {connection.status === 'pending' && connection.invited_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('connections.invited')}: {new Date(connection.invited_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {connection.status === 'pending' && (
                <>
                  <DropdownMenuItem onClick={() => copyInviteUrl(connection)}>
                    <Mail className="h-4 w-4 mr-2" />
                    {t('connections.copyInviteLink')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              {connection.type === 'trusted_contact' && connection.status === 'active' && (
                <DropdownMenuItem onClick={() => handlePromote(connection.id)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('connections.promoteToFamilyShort')}
                </DropdownMenuItem>
              )}
              
              {connection.type === 'family_circle' && connection.status === 'active' && (
                <DropdownMenuItem onClick={() => handleDemote(connection.id)}>
                  <UserMinus className="h-4 w-4 mr-2" />
                  {t('connections.demoteToTrustedShort')}
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleRevoke(connection.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('connections.revokeConnection')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('connections.manageConnections')}</h2>
          <p className="text-muted-foreground">
            {t('connections.controlNetwork')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="family" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="family" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            {t('connections.familyCircle')} ({familyConnections.length})
          </TabsTrigger>
          <TabsTrigger value="trusted" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('connections.trustedContacts')} ({trustedConnections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="family" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    {t('connections.familyCircle')}
                  </CardTitle>
                  <CardDescription>
                    {t('connections.familyDesc')}
                  </CardDescription>
                </div>
                <Button onClick={() => openInviteModal('family_circle')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('connections.inviteFamilyMember')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {familyConnections.length === 0 ? (
                <div className="text-center py-8">
                  <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-medium mb-2">{t('connections.noFamilyYet')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('connections.addFamilyInfo')}
                  </p>
                  <Button onClick={() => openInviteModal('family_circle')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('connections.inviteFirstFamily')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-0">
                  {familyConnections.map((connection) => (
                    <ConnectionCard key={connection.id} connection={connection} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trusted" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-secondary" />
                    {t('connections.trustedContacts')}
                  </CardTitle>
                  <CardDescription>
                    {t('connections.trustedDesc')}
                  </CardDescription>
                </div>
                <Button onClick={() => openInviteModal('trusted_contact')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('connections.addTrustedContact')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {trustedConnections.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-medium mb-2">{t('connections.noTrustedYet')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('connections.addTrustedInfo')}
                  </p>
                  <Button onClick={() => openInviteModal('trusted_contact')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('connections.addFirstTrusted')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-0">
                  {trustedConnections.map((connection) => (
                    <ConnectionCard key={connection.id} connection={connection} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConnectionInviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        type={inviteType}
      />
    </div>
  );
};