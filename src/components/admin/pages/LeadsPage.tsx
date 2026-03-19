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
import { TrendingUp, Users, Target, CheckCircle, Zap, Kanban, List, Plus, Filter, Mail, Trash2, XCircle, Bot, RefreshCw, Send, ExternalLink, Shield } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useEnhancedLeads, EnhancedLead } from '@/hooks/useEnhancedLeads';
import { ContactConfidenceBadge } from '@/components/admin/leads/ContactConfidenceBadge';
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

// ─── Invite Pipeline Summary ─────────────────────────────────────────────────

function InvitePipelineSummary({ leads }: { leads: EnhancedLead[] }) {
  const stages = [
    { key: 'not_invited', label: 'Not Invited', color: 'bg-gray-100 text-gray-700' },
    { key: 'invited', label: 'Invited', color: 'bg-blue-100 text-blue-700' },
    { key: 'clicked', label: 'Clicked', color: 'bg-yellow-100 text-yellow-700' },
    { key: 'talking', label: 'Talking', color: 'bg-purple-100 text-purple-700' },
    { key: 'trial', label: 'Trial', color: 'bg-green-100 text-green-700' },
    { key: 'subscribed', label: 'Subscribed', color: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-white border rounded-xl">
      <span className="font-semibold text-sm text-gray-900 mr-2 self-center">
        Total: {leads.length}
      </span>
      {stages.map(s => {
        const count = leads.filter((l: any) => (l.invite_status || 'not_invited') === s.key).length;
        return (
          <Badge key={s.key} className={`${s.color} text-xs px-3 py-1`}>
            {s.label}: {count}
          </Badge>
        );
      })}
    </div>
  );
}

// ─── Main LeadsPage ──────────────────────────────────────────────────────────

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filteredLeads, setFilteredLeads] = useState<EnhancedLead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [interestFilter, setInterestFilter] = useState('all');
  const [contactQualityFilter, setContactQualityFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<EnhancedLead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [enrollments, setEnrollments] = useState<Map<string, SequenceEnrollment>>(new Map());
  const [engagements, setEngagements] = useState<Map<string, LeadEngagement>>(new Map());
  const [addForm, setAddForm] = useState({ full_name: '', email: '', phone: '', lead_source: 'manual_invite', notes: '', preferred_language: 'en' });
  const [addSaving, setAddSaving] = useState(false);
  const { toast } = useToast();

  const { leads, loading, updateLeadStatus, deleteLead, refreshLeads } = useEnhancedLeads();

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, sourceFilter, interestFilter, contactQualityFilter]);

  useEffect(() => {
    const loadEnrollmentsAndEngagements = async () => {
      if (leads.length === 0) return;

      const leadIds = leads.map(l => l.id);

      try {
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
      } catch (e) {
        console.warn('followup_enrollments query failed:', e);
      }

      try {
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
      } catch (e) {
        console.warn('riven_lead_engagement query failed:', e);
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

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.lead_source === sourceFilter);
    }

    if (interestFilter !== 'all') {
      const level = parseInt(interestFilter);
      filtered = filtered.filter(lead => lead.interest_level >= level);
    }

    if (contactQualityFilter !== 'all') {
      if (contactQualityFilter === 'missing') {
        filtered = filtered.filter(lead => !lead.contact_confidence || lead.contact_confidence === 'unknown');
      } else {
        filtered = filtered.filter(lead => lead.contact_confidence === contactQualityFilter);
      }
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

  const getSourceBadge = (source: string) => {
    const map: Record<string, { label: string; color: string }> = {
      'whatsapp_chat': { label: 'WhatsApp Chat', color: 'bg-green-100 text-green-700' },
      'whatsapp_signup': { label: 'WhatsApp Signup', color: 'bg-green-100 text-green-700' },
      'contact_form': { label: 'Contact Form', color: 'bg-blue-100 text-blue-700' },
      'manual_invite': { label: 'Manual Invite', color: 'bg-red-100 text-red-700' },
      'clara_invite': { label: 'CLARA Invite', color: 'bg-red-100 text-red-700' },
      'proactive_invite': { label: 'Proactive', color: 'bg-purple-100 text-purple-700' },
      'chat_widget': { label: 'Chat Widget', color: 'bg-amber-100 text-amber-700' },
      'gift_purchase': { label: 'Gift', color: 'bg-pink-100 text-pink-700' },
      'referral': { label: 'Referral', color: 'bg-indigo-100 text-indigo-700' },
      'lead_intelligence': { label: 'Intelligence', color: 'bg-cyan-100 text-cyan-700' },
    };
    const match = map[source] || { label: source || 'Unknown', color: 'bg-gray-100 text-gray-600' };
    return match;
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

  const getInviteStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      'not_invited': { label: 'Not Invited', color: 'bg-gray-100 text-gray-600' },
      'invited': { label: 'Invited', color: 'bg-blue-100 text-blue-700' },
      'clicked': { label: 'Clicked', color: 'bg-yellow-100 text-yellow-700' },
      'talking': { label: 'Talking', color: 'bg-purple-100 text-purple-700' },
      'trial': { label: 'Trial', color: 'bg-green-100 text-green-700' },
      'subscribed': { label: 'Subscribed', color: 'bg-red-100 text-red-700 font-bold' },
      'lost': { label: 'Lost', color: 'bg-gray-200 text-gray-500' },
    };
    return map[status] || map['not_invited'];
  };

  const handleAddLead = async () => {
    if (!addForm.full_name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setAddSaving(true);
    try {
      const nameParts = addForm.full_name.trim().split(' ');
      const { error } = await supabase.from('leads').insert({
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || null,
        full_name: addForm.full_name,
        email: addForm.email || `${Date.now()}@lead.lifelink-sync.com`,
        phone: addForm.phone || null,
        lead_source: addForm.lead_source,
        status: 'new',
        interest_level: 5,
        lead_score: 20,
        language: addForm.preferred_language,
        notes: addForm.notes || null,
        tags: [addForm.lead_source],
        session_id: crypto.randomUUID(),
      });
      if (error) throw error;
      toast({ title: 'Lead added successfully' });
      setShowAddLead(false);
      setAddForm({ full_name: '', email: '', phone: '', lead_source: 'manual_invite', notes: '', preferred_language: 'en' });
      refreshLeads();
    } catch (err: any) {
      toast({ title: 'Failed to add lead', description: err.message, variant: 'destructive' });
    } finally {
      setAddSaving(false);
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
    <div className="px-8 py-6 w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            CLARA invite system + full CRM pipeline
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshLeads()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}>
            {viewMode === 'list' ? <Kanban className="h-4 w-4 mr-2" /> : <List className="h-4 w-4 mr-2" />}
            {viewMode === 'list' ? 'Kanban View' : 'List View'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin-dashboard/command-centre')}>
            <Bot className="h-4 w-4 mr-2" />
            Ask CLARA
          </Button>
          <Button onClick={() => setShowAddLead(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
          <Button onClick={() => navigate('/admin-dashboard/manual-invite')} className="bg-red-500 hover:bg-red-600 text-white">
            <Send className="h-4 w-4 mr-2" />
            Invite Centre
          </Button>
        </div>
      </div>

      {/* Invite Pipeline Summary */}
      <InvitePipelineSummary leads={leads as any} />

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
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
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
              <Label htmlFor="source">Source</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="whatsapp_chat">WhatsApp Chat</SelectItem>
                  <SelectItem value="whatsapp_signup">WhatsApp Signup</SelectItem>
                  <SelectItem value="contact_form">Contact Form</SelectItem>
                  <SelectItem value="manual_invite">Manual Invite</SelectItem>
                  <SelectItem value="clara_invite">CLARA Invite</SelectItem>
                  <SelectItem value="proactive_invite">Proactive</SelectItem>
                  <SelectItem value="chat_widget">Chat Widget</SelectItem>
                  <SelectItem value="lead_intelligence">Intelligence</SelectItem>
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
            <div className="space-y-2">
              <Label htmlFor="contactQuality">Contact Quality</Label>
              <Select value={contactQualityFilter} onValueChange={setContactQualityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All contacts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="likely">Likely</SelectItem>
                  <SelectItem value="guessed">Guessed</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
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
              Full CRM with invite tracking and CLARA automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading leads...</div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {filteredLeads.map((lead) => {
                    const inviteStatus = (lead as any).invite_status || 'not_invited';
                    const inviteBadge = getInviteStatusBadge(inviteStatus);

                    return (
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
                                <ContactConfidenceBadge confidence={lead.contact_confidence} />
                                {lead.language && lead.language !== 'en' && (
                                  <span className="text-sm" title={lead.language === 'es' ? 'Spanish' : lead.language === 'nl' ? 'Dutch' : 'English'}>
                                    {lead.language === 'es' ? '\u{1F1EA}\u{1F1F8}' : lead.language === 'nl' ? '\u{1F1F3}\u{1F1F1}' : '\u{1F1EC}\u{1F1E7}'}
                                  </span>
                                )}
                                {lead.lead_score > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Score: {lead.lead_score}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                              {lead.phone && (
                                <p className="text-xs text-muted-foreground">{lead.phone}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Invite status badge */}
                              <Badge className={`text-xs ${inviteBadge.color}`}>
                                {inviteBadge.label}
                              </Badge>
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
                                <Badge className="text-xs flex items-center gap-1 bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3" />
                                  Replied ({engagements.get(lead.id)?.total_replies || 1})
                                </Badge>
                              )}
                              {lead.lead_source && (() => {
                                const src = getSourceBadge(lead.lead_source);
                                return <Badge className={`text-xs ${src.color}`}>{src.label}</Badge>;
                              })()}
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
                        </div>
                        <div className="ml-4 flex flex-col gap-1">
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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 mt-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete lead "${lead.first_name || lead.email}"? This cannot be undone.`)) {
                                  deleteLead(lead.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

      {/* Add Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowAddLead(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add New Lead</h2>
              <button onClick={() => setShowAddLead(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><XCircle className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Full name *</Label>
                <Input value={addForm.full_name} onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))} placeholder="e.g. David Slader" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Email</Label>
                  <Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">WhatsApp / Phone</Label>
                  <Input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="+34 600 000 000" className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Source</Label>
                  <select value={addForm.lead_source} onChange={e => setAddForm(f => ({ ...f, lead_source: e.target.value }))} className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm">
                    <option value="manual_invite">Manual Invite</option>
                    <option value="whatsapp_chat">WhatsApp Chat</option>
                    <option value="contact_form">Contact Form</option>
                    <option value="referral">Referral</option>
                    <option value="website">Website</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Language</Label>
                  <select value={addForm.preferred_language} onChange={e => setAddForm(f => ({ ...f, preferred_language: e.target.value }))} className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="nl">Dutch</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Notes</Label>
                <textarea value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this lead..." rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <Button variant="outline" onClick={() => setShowAddLead(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddLead} disabled={addSaving} className="flex-1 bg-red-500 hover:bg-red-600 text-white">{addSaving ? 'Saving...' : 'Add Lead'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
