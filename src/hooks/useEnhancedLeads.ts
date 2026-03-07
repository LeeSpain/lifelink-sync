import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface EnhancedLead {
  id: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  job_title?: string;
  lead_source: string;
  lead_score: number;
  interest_level: number;
  status: string;
  tags: string[];
  last_contacted_at?: string;
  next_follow_up_at?: string;
  deal_value?: number;
  probability: number;
  assigned_to?: string;
  notes?: string;
  website?: string;
  linkedin_url?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  conversation_summary?: string;
  recommended_plan?: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  subject?: string;
  content?: string;
  metadata: any;
  created_by?: string;
  created_at: string;
  scheduled_at?: string;
  completed_at?: string;
}

export interface LeadTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export const useEnhancedLeads = () => {
  const [leads, setLeads] = useState<EnhancedLead[]>([]);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async (leadId?: string) => {
    try {
      let query = supabase
        .from('lead_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  };

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Log status change activity
      await addActivity(id, 'status_change', 'Status Update', `Status changed to ${status}`);

      setLeads(prev => prev.map(lead => 
        lead.id === id ? { ...lead, status } : lead
      ));

      toast({
        title: "Success",
        description: "Lead status updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  const updateLead = async (id: string, updates: Partial<EnhancedLead>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => prev.map(lead => 
        lead.id === id ? { ...lead, ...updates } : lead
      ));

      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    }
  };

  const addActivity = async (
    leadId: string, 
    activityType: string, 
    subject?: string, 
    content?: string,
    metadata: any = {}
  ) => {
    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .insert({
          lead_id: leadId,
          activity_type: activityType,
          subject,
          content,
          metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setActivities(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Failed to add activity:', err);
      throw err;
    }
  };

  const scheduleFollowUp = async (leadId: string, followUpDate: string, notes?: string) => {
    try {
      // Update lead with next follow-up date
      await updateLead(leadId, { next_follow_up_at: followUpDate });

      // Add activity for scheduled follow-up
      await addActivity(
        leadId, 
        'follow_up_scheduled', 
        'Follow-up Scheduled', 
        notes || `Follow-up scheduled for ${new Date(followUpDate).toLocaleDateString()}`,
        { scheduled_for: followUpDate }
      );

      toast({
        title: "Success",
        description: "Follow-up scheduled successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to schedule follow-up",
        variant: "destructive",
      });
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadLeads();
    loadTags();
  }, []);

  return {
    leads,
    activities,
    tags,
    loading,
    error,
    updateLeadStatus,
    updateLead,
    addActivity,
    scheduleFollowUp,
    deleteLead,
    loadActivities,
    refreshLeads: loadLeads,
  };
};