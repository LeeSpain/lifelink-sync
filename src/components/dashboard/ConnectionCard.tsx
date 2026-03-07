import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Crown, 
  Shield, 
  Mail, 
  Phone, 
  Clock, 
  Check, 
  X, 
  ArrowUp, 
  ArrowDown,
  GripVertical,
  Users
} from 'lucide-react';
import { Connection, useConnectionActions } from '@/hooks/useConnections';

interface ConnectionCardProps {
  connection: Connection;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection }) => {
  const { promoteConnection, demoteConnection, revokeConnection } = useConnectionActions();

  const getStatusBadge = () => {
    switch (connection.status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'revoked':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Revoked</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = () => {
    return connection.type === 'family_circle' ? (
      <Badge variant="default" className="bg-primary/10 text-primary">
        <Crown className="h-3 w-3 mr-1" />
        Family Circle
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-secondary/10 text-secondary">
        <Shield className="h-3 w-3 mr-1" />
        Trusted Contact
      </Badge>
    );
  };

  const getInitials = () => {
    if (connection.contact_user_id) {
      // If we have user data, derive from name
      return 'U'; // Placeholder - would need actual user data
    }
    return connection.invite_email.slice(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (connection.contact_user_id) {
      return 'User Name'; // Placeholder - would need actual user data
    }
    return connection.invite_email;
  };

  const getPriorityText = () => {
    const priorities = {
      1: 'Primary',
      2: 'Secondary', 
      3: 'Tertiary',
    };
    return priorities[connection.escalation_priority as keyof typeof priorities] || `Priority ${connection.escalation_priority}`;
  };

  const handlePromote = () => {
    promoteConnection.mutate(connection.id);
  };

  const handleDemote = () => {
    demoteConnection.mutate(connection.id);
  };

  const handleRevoke = () => {
    if (window.confirm('Are you sure you want to revoke this connection? This action cannot be undone.')) {
      revokeConnection.mutate(connection.id);
    }
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      connection.status === 'revoked' ? 'opacity-60' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Drag Handle */}
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Avatar */}
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold truncate">{getDisplayName()}</h4>
                {getTypeBadge()}
                {getStatusBadge()}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {connection.relationship && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {connection.relationship}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {getPriorityText()}
                  </Badge>
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {connection.invite_email}
                </span>
              </div>

              {/* Notification Channels */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Notifications:</span>
                {connection.notify_channels.map((channel) => (
                  <Badge key={channel} variant="outline" className="text-xs">
                    {channel}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs">
                  {connection.preferred_language.toUpperCase()}
                </Badge>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground mt-2">
                {connection.status === 'pending' && connection.invited_at && (
                  <span>Invited {new Date(connection.invited_at).toLocaleDateString()}</span>
                )}
                {connection.status === 'active' && connection.accepted_at && (
                  <span>Accepted {new Date(connection.accepted_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {connection.status !== 'revoked' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {connection.type === 'trusted_contact' && (
                  <DropdownMenuItem onClick={handlePromote}>
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Promote to Family Circle
                  </DropdownMenuItem>
                )}
                {connection.type === 'family_circle' && (
                  <DropdownMenuItem onClick={handleDemote}>
                    <ArrowDown className="h-4 w-4 mr-2" />
                    Demote to Trusted Contact
                  </DropdownMenuItem>
                )}
                {connection.status === 'pending' && (
                  <DropdownMenuItem>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Invitation
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleRevoke} className="text-destructive">
                  <X className="h-4 w-4 mr-2" />
                  Revoke Access
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
};