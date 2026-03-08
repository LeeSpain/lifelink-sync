import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, UserPlus, MapPin, Crown, Shield, Plus,
  MoreVertical, Clock, CheckCircle, XCircle,
  Mail, UserMinus, Trash2, Copy, Map, AlertTriangle, MapPinOff
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useConnections, useConnectionActions, Connection } from "@/hooks/useConnections";
import { ConnectionInviteModal } from "@/components/dashboard/ConnectionInviteModal";

export default function MyCirclesPage() {
  const { data: familyConnections = [], isLoading: familyLoading } = useConnections('family_circle');
  const { data: trustedConnections = [], isLoading: trustedLoading } = useConnections('trusted_contact');
  const { promoteConnection, demoteConnection, revokeConnection, updateLocationSharing } = useConnectionActions();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteType, setInviteType] = useState<'family_circle' | 'trusted_contact'>('family_circle');

  const loading = familyLoading || trustedLoading;
  const activeFamily = familyConnections.filter(c => c.status === 'active');
  const pendingFamily = familyConnections.filter(c => c.status === 'pending');
  const activeTrusted = trustedConnections.filter(c => c.status === 'active');
  const pendingTrusted = trustedConnections.filter(c => c.status === 'pending');
  const totalActive = activeFamily.length + activeTrusted.length;

  const openInviteModal = (type: 'family_circle' | 'trusted_contact') => {
    setInviteType(type);
    setInviteModalOpen(true);
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

  // Circle health score
  const getCircleHealth = () => {
    let score = 0;
    if (activeFamily.length >= 2) score += 40;
    else if (activeFamily.length >= 1) score += 20;
    if (activeTrusted.length >= 1) score += 30;
    if (totalActive >= 3) score += 20;
    if (pendingFamily.length === 0 && pendingTrusted.length === 0) score += 10;
    return Math.min(score, 100);
  };

  const circleHealth = getCircleHealth();

  const ConnectionCard = ({ connection }: { connection: Connection }) => (
    <Card className={`transition-all hover:shadow-md ${connection.status === 'pending' ? 'border-dashed' : ''} ${connection.status === 'revoked' ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              connection.type === 'family_circle' ? 'bg-primary/10' : 'bg-secondary/10'
            }`}>
              {connection.type === 'family_circle' ?
                <Crown className="h-5 w-5 text-primary" /> :
                <Shield className="h-5 w-5 text-secondary" />
              }
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-foreground">{connection.invite_email}</h4>
                {getStatusBadge(connection)}
                <Badge variant="outline" className="text-xs">
                  {t('connections.priority')} {connection.escalation_priority}
                </Badge>
              </div>

              {connection.relationship && (
                <p className="text-sm text-muted-foreground">{connection.relationship}</p>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{t('connections.channels')}: {connection.notify_channels.join(', ')}</span>
                <span>{t('connections.language')}: {connection.preferred_language}</span>
              </div>

              {connection.status === 'active' && (
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    {connection.share_my_location ? (
                      <MapPin className="h-3 w-3 text-green-500" />
                    ) : (
                      <MapPinOff className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="text-muted-foreground">Sharing my location:</span>
                    <Switch
                      className="scale-75"
                      checked={connection.share_my_location}
                      onCheckedChange={(checked) =>
                        updateLocationSharing.mutate({ connectionId: connection.id, shareMyLocation: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {connection.contact_share_location ? (
                      <MapPin className="h-3 w-3 text-green-500" />
                    ) : (
                      <MapPinOff className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span>Their location: {connection.contact_share_location ? 'Shared' : 'Not shared'}</span>
                  </div>
                </div>
              )}

              {connection.status === 'pending' && connection.invited_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('connections.invited')} {new Date(connection.invited_at).toLocaleDateString()}
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
                    <Copy className="h-4 w-4 mr-2" />
                    {t('connections.copyInviteLink')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {connection.type === 'trusted_contact' && connection.status === 'active' && (
                <DropdownMenuItem onClick={() => handlePromote(connection.id)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('connections.promoteToFamily')}
                </DropdownMenuItem>
              )}

              {connection.type === 'family_circle' && connection.status === 'active' && (
                <DropdownMenuItem onClick={() => handleDemote(connection.id)}>
                  <UserMinus className="h-4 w-4 mr-2" />
                  {t('connections.demoteToTrusted')}
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('circles.title')}</h1>
          <p className="text-muted-foreground">{t('circles.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/member-dashboard/live-map")}
            className="flex items-center gap-2"
          >
            <Map className="w-4 h-4" />
            {t('circles.liveMap')}
          </Button>
          <Button
            onClick={() => openInviteModal('family_circle')}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {t('circles.addMember')}
          </Button>
        </div>
      </div>

      {/* Circle Health Summary */}
      <Card className={`${circleHealth >= 80 ? 'bg-green-50 dark:bg-green-950/30' : circleHealth >= 50 ? 'bg-yellow-50 dark:bg-yellow-950/30' : 'bg-red-50 dark:bg-red-950/30'} border-0`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold">{circleHealth}%</p>
                <p className="text-xs text-muted-foreground">{t('circles.circleHealth')}</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-lg font-bold text-primary">{activeFamily.length}</div>
                  <div className="text-xs text-muted-foreground">{t('circles.family')}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-secondary-foreground">{activeTrusted.length}</div>
                  <div className="text-xs text-muted-foreground">{t('circles.trusted')}</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-500">{pendingFamily.length + pendingTrusted.length}</div>
                  <div className="text-xs text-muted-foreground">{t('circles.pending')}</div>
                </div>
              </div>
            </div>
            <Badge variant={circleHealth >= 80 ? "default" : circleHealth >= 50 ? "secondary" : "destructive"}>
              {circleHealth >= 80 ? t('circles.excellent') : circleHealth >= 50 ? t('circles.good') : t('circles.needsSetup')}
            </Badge>
          </div>

          {circleHealth < 80 && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-background/60">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-medium mb-1">{t('circles.strengthenCircle')}</p>
                <ul className="space-y-0.5 text-muted-foreground">
                  {activeFamily.length < 2 && <li>{t('circles.addFamilyForCoverage')}</li>}
                  {activeTrusted.length < 1 && <li>{t('circles.addTrustedForBackup')}</li>}
                  {(pendingFamily.length + pendingTrusted.length) > 0 && <li>{t('circles.followUpPending', { count: pendingFamily.length + pendingTrusted.length })}</li>}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connections Tabs */}
      <Tabs defaultValue="family" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="family" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            {`${t('circles.familyCircle')} (${familyConnections.filter(c => c.status !== 'revoked').length})`}
          </TabsTrigger>
          <TabsTrigger value="trusted" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {`${t('circles.trustedContacts')} (${trustedConnections.filter(c => c.status !== 'revoked').length})`}
          </TabsTrigger>
        </TabsList>

        {/* Family Circle Tab */}
        <TabsContent value="family" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    {t('circles.familyCircleMembers')}
                  </CardTitle>
                  <CardDescription>
                    {t('circles.familyCircleDesc')}
                  </CardDescription>
                </div>
                <Button onClick={() => openInviteModal('family_circle')} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('circles.inviteFamily')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {familyConnections.filter(c => c.status !== 'revoked').length === 0 ? (
                <div className="text-center py-8">
                  <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-medium mb-2">{t('circles.noFamilyMembers')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('circles.addFamilyDesc')}
                  </p>
                  <Button onClick={() => openInviteModal('family_circle')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('circles.inviteFirstFamily')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {familyConnections.filter(c => c.status !== 'revoked').map((connection) => (
                    <ConnectionCard key={connection.id} connection={connection} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trusted Contacts Tab */}
        <TabsContent value="trusted" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-secondary" />
                    {t('circles.trustedContacts')}
                  </CardTitle>
                  <CardDescription>
                    {t('circles.trustedContactsDesc')}
                  </CardDescription>
                </div>
                <Button onClick={() => openInviteModal('trusted_contact')} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('circles.addContact')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {trustedConnections.filter(c => c.status !== 'revoked').length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-medium mb-2">{t('circles.noTrustedContacts')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('circles.addTrustedDesc')}
                  </p>
                  <Button onClick={() => openInviteModal('trusted_contact')}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('circles.addFirstTrusted')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {trustedConnections.filter(c => c.status !== 'revoked').map((connection) => (
                    <ConnectionCard key={connection.id} connection={connection} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Modal */}
      <ConnectionInviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        type={inviteType}
      />
    </div>
  );
}
