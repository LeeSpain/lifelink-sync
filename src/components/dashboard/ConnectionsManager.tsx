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

export const ConnectionsManager: React.FC = () => {
  const { data: familyConnections = [] } = useConnections('family_circle');
  const { data: trustedConnections = [] } = useConnections('trusted_contact');
  const { promoteConnection, demoteConnection, revokeConnection } = useConnectionActions();
  const { toast } = useToast();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteType, setInviteType] = useState<'family_circle' | 'trusted_contact'>('family_circle');

  const openInviteModal = (type: 'family_circle' | 'trusted_contact') => {
    setInviteType(type);
    setInviteModalOpen(true);
  };

  const getStatusBadge = (connection: Connection) => {
    switch (connection.status) {
      case 'active':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'revoked':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Revoked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
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
      title: "Invite link copied",
      description: "The invitation link has been copied to your clipboard.",
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
    if (window.confirm('Are you sure you want to revoke this connection? This action cannot be undone.')) {
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
                  Priority {connection.escalation_priority}
                </Badge>
              </div>
              {connection.relationship && (
                <p className="text-sm text-muted-foreground">{connection.relationship}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <span>Channels: {connection.notify_channels.join(', ')}</span>
                <span>Language: {connection.preferred_language}</span>
              </div>
              {connection.status === 'pending' && connection.invited_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Invited: {new Date(connection.invited_at).toLocaleDateString()}
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
                    Copy Invite Link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              {connection.type === 'trusted_contact' && connection.status === 'active' && (
                <DropdownMenuItem onClick={() => handlePromote(connection.id)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Promote to Family
                </DropdownMenuItem>
              )}
              
              {connection.type === 'family_circle' && connection.status === 'active' && (
                <DropdownMenuItem onClick={() => handleDemote(connection.id)}>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Demote to Trusted
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleRevoke(connection.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Revoke Connection
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
          <h2 className="text-2xl font-bold">Manage Connections</h2>
          <p className="text-muted-foreground">
            Control your emergency network and family circle access
          </p>
        </div>
      </div>

      <Tabs defaultValue="family" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="family" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Family Circle ({familyConnections.length})
          </TabsTrigger>
          <TabsTrigger value="trusted" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Trusted Contacts ({trustedConnections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="family" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Family Circle
                  </CardTitle>
                  <CardDescription>
                    Family members have full access to your emergency dashboard and history
                  </CardDescription>
                </div>
                <Button onClick={() => openInviteModal('family_circle')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Family Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {familyConnections.length === 0 ? (
                <div className="text-center py-8">
                  <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-medium mb-2">No family members yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add family members to give them full access to your emergency information
                  </p>
                  <Button onClick={() => openInviteModal('family_circle')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite First Family Member
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
                    Trusted Contacts
                  </CardTitle>
                  <CardDescription>
                    Trusted contacts receive notifications only during active emergencies
                  </CardDescription>
                </div>
                <Button onClick={() => openInviteModal('trusted_contact')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trusted Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {trustedConnections.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-medium mb-2">No trusted contacts yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add trusted contacts who should be notified during emergencies
                  </p>
                  <Button onClick={() => openInviteModal('trusted_contact')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Trusted Contact
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