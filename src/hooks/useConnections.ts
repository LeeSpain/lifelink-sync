import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Connection {
  id: string;
  owner_id: string;
  contact_user_id?: string;
  invite_email: string;
  type: 'family_circle' | 'trusted_contact';
  relationship?: string;
  escalation_priority: number;
  notify_channels: string[];
  preferred_language: string;
  status: 'pending' | 'active' | 'revoked';
  invite_token?: string;
  invited_at?: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateConnectionData {
  type: 'family_circle' | 'trusted_contact';
  invite_email: string;
  relationship?: string;
  escalation_priority?: number;
  notify_channels?: string[];
  preferred_language?: string;
}

export const useConnections = (type?: 'family_circle' | 'trusted_contact') => {
  const { user } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: ['connections', user?.id, type],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('connections')
        .select('*')
        .eq('owner_id', user.id)
        .order('escalation_priority', { ascending: true });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching connections:', error);
        throw error;
      }

      return data as Connection[];
    },
    enabled: !!user,
    staleTime: 30000,
    refetchInterval: 60000,
  });
};

export const useConnectionActions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const createConnection = useMutation({
    mutationFn: async (data: CreateConnectionData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase.functions.invoke('connections-invite', {
        body: {
          owner_id: user.id,
          ...data,
        },
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast({
        title: "Invitation sent",
        description: "The invitation has been sent successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating connection:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const promoteConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase.functions.invoke('connections-promote', {
        body: { connection_id: connectionId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast({
        title: "Connection promoted",
        description: "Connection has been promoted to family circle.",
      });
    },
    onError: (error) => {
      console.error('Error promoting connection:', error);
      toast({
        title: "Error",
        description: "Failed to promote connection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const demoteConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase.functions.invoke('connections-demote', {
        body: { connection_id: connectionId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast({
        title: "Connection demoted",
        description: "Connection has been demoted to trusted contact.",
      });
    },
    onError: (error) => {
      console.error('Error demoting connection:', error);
      toast({
        title: "Error",
        description: "Failed to demote connection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const revokeConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase.functions.invoke('connections-revoke', {
        body: { connection_id: connectionId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast({
        title: "Connection revoked",
        description: "Connection has been revoked successfully.",
      });
    },
    onError: (error) => {
      console.error('Error revoking connection:', error);
      toast({
        title: "Error",
        description: "Failed to revoke connection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePriorities = useMutation({
    mutationFn: async (updates: Array<{ id: string; priority: number }>) => {
      const { data, error } = await supabase.functions.invoke('connections-reorder', {
        body: { updates },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      toast({
        title: "Priorities updated",
        description: "Contact priorities have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating priorities:', error);
      toast({
        title: "Error",
        description: "Failed to update priorities. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    createConnection,
    promoteConnection,
    demoteConnection,
    revokeConnection,
    updatePriorities,
  };
};

export const useSpainRule = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spain-rule', user?.id],
    queryFn: async () => {
      if (!user) return { canProceed: false, activeConnections: 0, hasRegional: false };

      const { data, error } = await supabase.functions.invoke('check-spain-rule', {
        body: { user_id: user.id },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 30000,
  });
};