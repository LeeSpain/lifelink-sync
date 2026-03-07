import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, Users, Target, CheckCircle, Zap, Kanban, List, Plus, Filter, Mail } from "lucide-react";
import { useEnhancedLeads, EnhancedLead } from '@/hooks/useEnhancedLeads';
import { LeadDetailModal } from '@/components/admin/leads/LeadDetailModal';
import { LeadKanbanBoard } from '@/components/admin/leads/LeadKanbanBoard';
import { supabase } from '@/integrations/supabase/client';

interface SequenceEnrollment {
  lead_id: string;
  status: string;
  current_step: number;
}

interface LeadEngagement {
  lead_id: string;
  total_replies: number;
  last_reply_at: string | null;
}

const LeadsPage: React.FC = () => {
  const [filteredLeads, setFilteredLeads] = useState<EnhancedLead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [interestFilter, setInterestFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<EnhancedLead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [enrollments, setEnrollments] = useState<Map<string, SequenceEnrollment>>(new Map());
  const [engagements, setEngagements] = useState<Map<string, LeadEngagement>>(new Map());
  const { toast } = useToast();
  
  const { leads, loading, updateLeadStatus } = useEnhancedLeads();

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, interestFilter]);

  // Load sequence enrollments and engagements for displayed leads
  useEffect(() => {
    const loadEnrollmentsAndEngagements = async () => {
      if (leads.length === 0) return;
      
      const leadIds = leads.map(l => l.id);
      
      // Load enrollments
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('followup_enrollments')
        .select('lead_id, status, current_step')
        .in('lead_id', leadIds);
      
      if (!enrollmentError && enrollmentData) {
        const enrollmentMap = new Map<string, SequenceEnrollment>();
        enrollmentData.forEach((e: any) => {
          enrollmentMap.set(e.lead_id, e);
        });
        setEnrollments(enrollmentMap);
      }

      // Load engagements (replies)
      const { data: engagementData, error: engagementError } = await supabase
        .from('riven_lead_engagement')
        .select('lead_id, total_replies, last_reply_at')
        .in('lead_id', leadIds);
      
      if (!engagementError && engagementData) {
        const engagementMap = new Map<string, LeadEngagement>();
        engagementData.forEach((e: any) => {
          engagementMap.set(e.lead_id, e);
        });
        setEngagements(engagementMap);
      }
    };
    
    loadEnrollmentsAndEngagements();
  }, [leads]);

  const filterLeads = () => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone && lead.phone.includes(searchTerm)) ||
        (lead.first_name && lead.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.last_name && lead.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.company_name && lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (interestFilter !== 'all') {
      const level = parseInt(interestFilter);
      filtered = filtered.filter(lead => lead.interest_level >= level);
    }

    setFilteredLeads(filtered);
  };

  const getInterestColor = (level: number) => {
    if (level >= 8) return 'bg-green-100 text-green-800';
    if (level >= 6) return 'bg-yellow-100 text-yellow-800';
    if (level >= 4) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getInterestLabel = (level: number) => {
    if (level >= 8) return 'High';
    if (level >= 6) return 'Medium';
    if (level >= 4) return 'Low';
    return 'Very Low';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLeadClick = (lead: EnhancedLead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  // Calculate stats
  const totalLeads = leads.length;
  const newLeads = leads.filter(lead => lead.status === 'new').length;
  const qualifiedLeads = leads.filter(lead => lead.status === 'qualified').length;
  const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
  const highInterestLeads = leads.filter(lead => lead.interest_level >= 8).length;
  const totalDealValue = leads.reduce((sum, lead) => sum + (lead.deal_value || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Lead Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Professional CRM with AI-powered insights and automation
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}>
            {viewMode === 'list' ? <Kanban className="h-4 w-4 mr-2" /> : <List className="h-4 w-4 mr-2" />}
            {viewMode === 'list' ? 'Kanban View' : 'List View'}
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualifiedLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertedLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Interest</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highInterestLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalDealValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, email, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal Sent</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interest">Interest Level</Label>
              <Select value={interestFilter} onValueChange={setInterestFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="8">High (8+)</SelectItem>
                  <SelectItem value="6">Medium (6+)</SelectItem>
                  <SelectItem value="4">Low (4+)</SelectItem>
                  <SelectItem value="1">Very Low (1+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {viewMode === 'kanban' ? (
        <LeadKanbanBoard leads={filteredLeads} onLeadClick={handleLeadClick} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Leads ({filteredLeads.length})</CardTitle>
            <CardDescription>
              Professional CRM with enhanced lead tracking and management
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading leads...</div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleLeadClick(lead)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {lead.first_name} {lead.last_name}
                              </p>
                              {lead.lead_score > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Score: {lead.lead_score}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{lead.email}</p>
                            {lead.company_name && (
                              <p className="text-sm text-muted-foreground">
                                {lead.job_title} at {lead.company_name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Sequence enrollment badge */}
                            {enrollments.get(lead.id) && (
                              <Badge 
                                className={`text-xs flex items-center gap-1 ${
                                  enrollments.get(lead.id)?.status === 'active' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                <Mail className="h-3 w-3" />
                                Sequence: {enrollments.get(lead.id)?.status === 'active' 
                                  ? `Step ${enrollments.get(lead.id)?.current_step}` 
                                  : enrollments.get(lead.id)?.status}
                              </Badge>
                            )}
                            {/* Replied badge */}
                            {engagements.get(lead.id) && (engagements.get(lead.id)!.total_replies > 0 || engagements.get(lead.id)!.last_reply_at) && (
                              <Badge 
                                className="text-xs flex items-center gap-1 bg-green-100 text-green-800"
                                title={engagements.get(lead.id)?.last_reply_at 
                                  ? `Last reply: ${new Date(engagements.get(lead.id)!.last_reply_at!).toLocaleDateString()}`
                                  : undefined
                                }
                              >
                                <CheckCircle className="h-3 w-3" />
                                Replied ({engagements.get(lead.id)?.total_replies || 1})
                              </Badge>
                            )}
                            <Badge className={getInterestColor(lead.interest_level)}>
                              {getInterestLabel(lead.interest_level)} ({lead.interest_level})
                            </Badge>
                            <Badge className={getStatusColor(lead.status)}>
                              {lead.status}
                            </Badge>
                          </div>
                          <div className="text-right">
                            {lead.deal_value && (
                              <p className="text-sm font-medium">
                                ${lead.deal_value.toLocaleString()}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </p>
                            {lead.next_follow_up_at && (
                              <p className="text-xs text-orange-600">
                                Follow-up: {new Date(lead.next_follow_up_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {lead.conversation_summary && (
                          <p className="text-sm text-muted-foreground mt-2 truncate">
                            {lead.conversation_summary}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={lead.status}
                            onValueChange={(newStatus) => updateLeadStatus(lead.id, newStatus)}
                          >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="proposal">Proposal</SelectItem>
                            <SelectItem value="negotiation">Negotiation</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredLeads.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No leads found matching your criteria
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      <LeadDetailModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default LeadsPage;