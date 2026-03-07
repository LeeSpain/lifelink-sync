import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, MoreVertical, RefreshCw, X, UserMinus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFamilyMemberActions, type FamilyMember, type PendingInvite } from "@/hooks/useFamilyMembers";
import { useToast } from "@/hooks/use-toast";

interface FamilyMemberCardProps {
  member?: FamilyMember;
  invite?: PendingInvite;
  isOwner?: boolean;
}

export function FamilyMemberCard({ member, invite, isOwner = false }: FamilyMemberCardProps) {
  const { resendInvite, cancelInvite, removeMember } = useFamilyMemberActions();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const data = member || invite;
  if (!data) return null;

  const isPending = !!invite;
  const isExpired = invite?.status === 'expired';
  
  const getStatusBadge = () => {
    if (member?.status === 'active') {
      return <Badge variant="default" className="text-xs">Active</Badge>;
    }
    if (invite?.status === 'pending') {
      return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    }
    if (invite?.status === 'expired') {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    }
    return null;
  };

  const getBillingBadge = () => {
    if (!member?.billing_status) return null;
    
    const variant = member.billing_status === 'active' ? 'default' : 
                   member.billing_status === 'grace' ? 'secondary' : 'destructive';
    
    return <Badge variant={variant} className="text-xs">{member.billing_status}</Badge>;
  };

  const handleResendInvite = async () => {
    if (!invite?.id) return;
    
    setIsLoading(true);
    try {
      await resendInvite(invite.id);
      toast({
        title: "Invite Resent",
        description: `Invitation resent to ${data.name}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvite = async () => {
    if (!invite?.id) return;
    
    setIsLoading(true);
    try {
      await cancelInvite(invite.id);
      toast({
        title: "Invite Cancelled",
        description: `Invitation to ${data.name} has been cancelled`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!member?.id) return;
    
    setIsLoading(true);
    try {
      await removeMember(member.id);
      toast({
        title: "Member Removed",
        description: `${data.name} has been removed from the family circle`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`transition-all hover:shadow-md ${isPending ? 'border-dashed' : ''} ${isExpired ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-foreground">{data.name}</h4>
                {getStatusBadge()}
                {getBillingBadge()}
              </div>
              
              <p className="text-sm text-muted-foreground">{data.relationship}</p>
              
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{data.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{data.phone}</span>
                </div>
              </div>

              {isPending && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    {isExpired ? 'Expired' : 'Invited'} {new Date(data.created_at).toLocaleDateString()}
                    {invite?.expires_at && !isExpired && (
                      <> • Expires {new Date(invite.expires_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isLoading}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isPending && (
                  <>
                    <DropdownMenuItem onClick={handleResendInvite} disabled={isLoading}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend Invite
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCancelInvite} disabled={isLoading} className="text-destructive">
                      <X className="h-4 w-4 mr-2" />
                      Cancel Invite
                    </DropdownMenuItem>
                  </>
                )}
                {member && (
                  <DropdownMenuItem onClick={handleRemoveMember} disabled={isLoading} className="text-destructive">
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove Member
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}