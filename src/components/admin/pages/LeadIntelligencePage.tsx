import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Globe, 
  FileText, 
  History, 
  Loader2, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Target,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles
} from 'lucide-react';

interface ExtractedLead {
  email: string | null;
  phone: string | null;
  name: string | null;
  company: string | null;
  role: string | null;
  location: string | null;
  lead_score_0_100: number;
  interest_level_0_10: number;
  recommended_plan: string | null;
  notes: string;
  tags: string[];
  selected?: boolean;
  // Classification fields (populated after save)
  savedStatus?: 'saved' | 'duplicate';
  segment?: string;
  intent?: string;
  priority?: string;
}

interface IntelligenceRun {
  id: string;
  source_type: 'url' | 'text';
  source_value: string;
  extracted_count: number;
  saved_count: number;
  model: string | null;
  summary: string | null;
  created_at: string;
}

const LeadIntelligencePage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // URL Analyzer state
  const [url, setUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  
  // Text Analyzer state
  const [text, setText] = useState('');
  const [sourceLabel, setSourceLabel] = useState('Other');
  const [textLoading, setTextLoading] = useState(false);
  
  // Results state
  const [leads, setLeads] = useState<ExtractedLead[]>([]);
  const [summary, setSummary] = useState('');
  const [model, setModel] = useState('');
  const [currentSourceType, setCurrentSourceType] = useState<'url' | 'text'>('url');
  const [currentSourceValue, setCurrentSourceValue] = useState('');
  
  // Saving state
  const [saving, setSaving] = useState(false);
  
  // Audit runs state
  const [runs, setRuns] = useState<IntelligenceRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);

  // Riven Send Modal state
  const [rivenModalOpen, setRivenModalOpen] = useState(false);
  const [selectedLeadForRiven, setSelectedLeadForRiven] = useState<ExtractedLead | null>(null);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    setRunsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_intelligence_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRuns((data as IntelligenceRun[]) || []);
    } catch (error) {
      console.error('Error loading runs:', error);
    } finally {
      setRunsLoading(false);
    }
  };

  const analyzeUrl = async () => {
    if (!url.trim()) {
      toast({ title: 'Error', description: 'Please enter a URL', variant: 'destructive' });
      return;
    }

    setUrlLoading(true);
    setLeads([]);
    setSummary('');

    try {
      const { data, error } = await supabase.functions.invoke('lead-intelligence', {
        body: { action: 'analyze_url', url: url.trim() }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const extractedLeads = (data.leads || []).map((lead: ExtractedLead) => ({
        ...lead,
        selected: !!(lead.email || lead.phone) // Auto-select if has contact info
      }));

      setLeads(extractedLeads);
      setSummary(data.summary || '');
      setModel(data.model || '');
      setCurrentSourceType('url');
      setCurrentSourceValue(url.trim());

      toast({ 
        title: 'Analysis Complete', 
        description: `Found ${extractedLeads.length} potential leads` 
      });

    } catch (error) {
      console.error('URL analysis error:', error);
      toast({ 
        title: 'Analysis Failed', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    } finally {
      setUrlLoading(false);
    }
  };

  const analyzeText = async () => {
    if (!text.trim() || text.trim().length < 20) {
      toast({ title: 'Error', description: 'Please enter at least 20 characters', variant: 'destructive' });
      return;
    }

    setTextLoading(true);
    setLeads([]);
    setSummary('');

    try {
      const { data, error } = await supabase.functions.invoke('lead-intelligence', {
        body: { action: 'analyze_text', text: text.trim(), source: sourceLabel }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const extractedLeads = (data.leads || []).map((lead: ExtractedLead) => ({
        ...lead,
        selected: !!(lead.email || lead.phone)
      }));

      setLeads(extractedLeads);
      setSummary(data.summary || '');
      setModel(data.model || '');
      setCurrentSourceType('text');
      setCurrentSourceValue(`${sourceLabel}: ${text.substring(0, 100)}...`);

      toast({ 
        title: 'Analysis Complete', 
        description: `Found ${extractedLeads.length} potential leads` 
      });

    } catch (error) {
      console.error('Text analysis error:', error);
      toast({ 
        title: 'Analysis Failed', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    } finally {
      setTextLoading(false);
    }
  };

  const toggleLeadSelection = (index: number) => {
    setLeads(prev => prev.map((lead, i) => 
      i === index ? { ...lead, selected: !lead.selected } : lead
    ));
  };

  const selectAll = () => {
    setLeads(prev => prev.map(lead => ({ ...lead, selected: true })));
  };

  const deselectAll = () => {
    setLeads(prev => prev.map(lead => ({ ...lead, selected: false })));
  };

  const saveSelectedLeads = async () => {
    const selectedLeads = leads.filter(l => l.selected);
    if (selectedLeads.length === 0) {
      toast({ title: 'No Selection', description: 'Please select at least one lead', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('lead-intelligence', {
        body: {
          action: 'save_leads',
          leads: selectedLeads,
          source_type: currentSourceType,
          source_value: currentSourceValue,
          summary,
          model
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Update leads with saved status and classification info
      const savedLeadsInfo = data.saved_leads || [];
      setLeads(prev => prev.map(lead => {
        if (!lead.selected) return lead;
        
        // Find matching saved lead info
        const savedInfo = savedLeadsInfo.find((s: any) => s.email === lead.email);
        
        if (savedInfo) {
          return {
            ...lead,
            savedStatus: 'saved' as const,
            segment: savedInfo.segment,
            intent: savedInfo.intent,
            priority: savedInfo.priority,
            tags: savedInfo.tags || lead.tags
          };
        } else {
          // Was a duplicate or failed
          return {
            ...lead,
            savedStatus: 'duplicate' as const
          };
        }
      }));

      toast({ 
        title: 'Leads Saved & Classified', 
        description: `Saved ${data.saved} leads, skipped ${data.duplicates} duplicates` 
      });

      // Reload runs
      loadRuns();

    } catch (error) {
      console.error('Save error:', error);
      toast({ 
        title: 'Save Failed', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const selectedCount = leads.filter(l => l.selected).length;

  // Open Riven modal and generate draft
  const openRivenModal = async (lead: ExtractedLead) => {
    setSelectedLeadForRiven(lead);
    setEmailSubject('');
    setEmailBody('');
    setRivenModalOpen(true);
    setGeneratingDraft(true);

    try {
      const { data, error } = await supabase.functions.invoke('lead-intelligence', {
        body: {
          action: 'generate_intro',
          lead: {
            email: lead.email,
            phone: lead.phone,
            name: lead.name,
            company: lead.company,
            role: lead.role,
            location: lead.location,
            notes: lead.notes,
            tags: lead.tags
          }
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setEmailSubject(data.subject || `Introducing LifeLink Sync${lead.company ? ` - For ${lead.company}` : ''}`);
      setEmailBody(data.body || '');

    } catch (error) {
      console.error('Draft generation error:', error);
      toast({
        title: 'Draft Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate email draft',
        variant: 'destructive'
      });
      // Set fallback content
      setEmailSubject(`Introducing LifeLink Sync${lead.company ? ` - For ${lead.company}` : ''}`);
      setEmailBody(`Dear ${lead.name || 'Team'},\n\nI wanted to reach out regarding LifeLink Sync, our emergency safety solution designed for families, seniors, and care organisations.\n\nWould you be open to a brief conversation to learn more?\n\nBest regards`);
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Queue email and update lead status
  const handleApproveAndSend = async () => {
    if (!selectedLeadForRiven?.email || !emailSubject.trim() || !emailBody.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Email, subject, and body are required',
        variant: 'destructive'
      });
      return;
    }

    setSendingEmail(true);

    try {
      // Insert into email_queue
      const { error: queueError } = await supabase
        .from('email_queue')
        .insert({
          recipient_email: selectedLeadForRiven.email,
          subject: emailSubject.trim(),
          body: emailBody.trim(),
          campaign_id: null, // We use metadata instead
          status: 'pending',
          priority: 5,
          scheduled_at: new Date().toISOString()
        });

      if (queueError) throw queueError;

      // Find and update the lead in the database if it exists
      // First check if this lead has been saved to the leads table
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id, metadata')
        .eq('email', selectedLeadForRiven.email)
        .maybeSingle();

      if (existingLead) {
        const currentMetadata = (existingLead.metadata as Record<string, any>) || {};
        const updatedMetadata = {
          ...currentMetadata,
          last_contacted_at: new Date().toISOString(),
          outreach_channel: 'email',
          outreach_source: 'riven_intro'
        };

        await supabase
          .from('leads')
          .update({
            status: 'contacted',
            metadata: updatedMetadata,
            last_contacted_at: new Date().toISOString()
          })
          .eq('id', existingLead.id);
      }

      toast({
        title: 'Email Queued',
        description: 'Intro email queued successfully'
      });

      setRivenModalOpen(false);
      setSelectedLeadForRiven(null);

    } catch (error) {
      console.error('Queue email error:', error);
      toast({
        title: 'Queue Failed',
        description: error instanceof Error ? error.message : 'Failed to queue email',
        variant: 'destructive'
      });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Lead Intelligence</h1>
          <p className="text-muted-foreground">
            Analyze a URL or pasted text to discover leads and add them to CRM
          </p>
        </div>
      </div>

      <Tabs defaultValue="url" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            URL Analyzer
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Text Analyzer
          </TabsTrigger>
          <TabsTrigger value="runs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Runs
          </TabsTrigger>
        </TabsList>

        {/* URL Analyzer Tab */}
        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Analyze Website
              </CardTitle>
              <CardDescription>
                Enter a URL to extract potential leads from the page content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/about-us"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && analyzeUrl()}
                  disabled={urlLoading}
                />
                <Button onClick={analyzeUrl} disabled={urlLoading}>
                  {urlLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">Analyze</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Only HTTP/HTTPS URLs supported. PDFs and images are not processed.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Text Analyzer Tab */}
        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Analyze Text
              </CardTitle>
              <CardDescription>
                Paste text content (e.g., from LinkedIn, directories, forums) to extract leads
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">Source:</span>
                <Select value={sourceLabel} onValueChange={setSourceLabel}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Directory">Directory</SelectItem>
                    <SelectItem value="Forum">Forum</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="Paste text content here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                disabled={textLoading}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {text.length} / 50,000 characters
                </p>
                <Button onClick={analyzeText} disabled={textLoading || text.length < 20}>
                  {textLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">Analyze</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Runs Tab */}
        <TabsContent value="runs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Analysis Runs
              </CardTitle>
              <CardDescription>
                Last 20 lead intelligence analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {runsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : runs.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No analysis runs yet
                </p>
              ) : (
                <div className="space-y-3">
                  {runs.map((run) => (
                    <div key={run.id} className="flex items-start gap-4 p-3 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {run.source_type === 'url' ? (
                          <Globe className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-purple-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {run.source_value.length > 60 
                            ? run.source_value.substring(0, 60) + '...' 
                            : run.source_value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {run.summary?.substring(0, 100) || 'No summary'}
                        </p>
                        <div className="flex gap-3 mt-2 text-xs">
                          <span className="text-muted-foreground">
                            Extracted: <strong>{run.extracted_count}</strong>
                          </span>
                          <span className="text-green-600">
                            Saved: <strong>{run.saved_count}</strong>
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(run.created_at).toLocaleDateString()} {new Date(run.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Section */}
      {leads.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Extracted Leads ({leads.length})
                </CardTitle>
                {summary && (
                  <CardDescription className="mt-1">{summary}</CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {leads.map((lead, index) => (
                <div 
                  key={index} 
                  className={`p-4 border rounded-lg transition-colors ${
                    lead.selected ? 'bg-primary/5 border-primary/30' : 'bg-background'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={lead.selected}
                      onCheckedChange={() => toggleLeadSelection(index)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          {lead.company && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{lead.company}</span>
                            </div>
                          )}
                          {lead.name && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{lead.name}</span>
                              {lead.role && (
                                <span className="text-sm text-muted-foreground">({lead.role})</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <div className={`text-lg font-bold ${getScoreColor(lead.lead_score_0_100)}`}>
                            {lead.lead_score_0_100}%
                          </div>
                          <div className="w-20">
                            <Progress 
                              value={lead.lead_score_0_100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        {lead.email && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                        )}
                        {lead.location && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {lead.location}
                          </div>
                        )}
                      </div>

                      {lead.notes && (
                        <p className="text-sm text-muted-foreground">{lead.notes}</p>
                      )}

                      <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div className="flex flex-wrap gap-2 items-center">
                          {/* Saved status indicator */}
                          {lead.savedStatus === 'saved' && (
                            <Badge className="bg-green-500 text-white text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Saved ✓
                            </Badge>
                          )}
                          {lead.savedStatus === 'duplicate' && (
                            <Badge variant="secondary" className="text-xs">
                              Duplicate
                            </Badge>
                          )}
                          
                          {/* Classification badges (shown after save) */}
                          {lead.intent && (
                            <Badge 
                              className={`text-xs ${
                                lead.intent === 'hot' ? 'bg-red-500 text-white' :
                                lead.intent === 'warm' ? 'bg-orange-500 text-white' :
                                'bg-blue-500 text-white'
                              }`}
                            >
                              {lead.intent.toUpperCase()}
                            </Badge>
                          )}
                          {lead.segment && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {lead.segment.replace('_', ' ')}
                            </Badge>
                          )}
                          {lead.priority && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                lead.priority === 'high' ? 'border-red-500 text-red-600' :
                                lead.priority === 'medium' ? 'border-orange-500 text-orange-600' :
                                'border-blue-500 text-blue-600'
                              }`}
                            >
                              Priority: {lead.priority}
                            </Badge>
                          )}
                          
                          {/* Original tags */}
                          {lead.tags?.filter(tag => 
                            !tag.startsWith('lead:') && 
                            !tag.startsWith('segment:') && 
                            !tag.startsWith('intent:')
                          ).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {lead.recommended_plan && (
                            <Badge variant="outline" className="text-xs">
                              Plan: {lead.recommended_plan}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Interest: {lead.interest_level_0_10}/10
                          </Badge>
                          {!lead.email && !lead.phone && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              No contact info
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!lead.email}
                          onClick={(e) => {
                            e.stopPropagation();
                            openRivenModal(lead);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          Send via Riven
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedCount} of {leads.length} leads selected
              </p>
              <Button 
                onClick={saveSelectedLeads} 
                disabled={saving || selectedCount === 0}
                size="lg"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Save Selected to CRM
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Riven Send Modal */}
      <Dialog open={rivenModalOpen} onOpenChange={setRivenModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Send Intro via Riven
            </DialogTitle>
            <DialogDescription>
              AI-generated intro email for review before sending
            </DialogDescription>
          </DialogHeader>

          {selectedLeadForRiven && (
            <div className="space-y-4">
              {/* Lead Summary */}
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  {selectedLeadForRiven.company && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <strong>{selectedLeadForRiven.company}</strong>
                    </span>
                  )}
                  {selectedLeadForRiven.name && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedLeadForRiven.name}
                    </span>
                  )}
                  {selectedLeadForRiven.role && (
                    <span className="text-muted-foreground">
                      ({selectedLeadForRiven.role})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  <Mail className="h-3 w-3" />
                  {selectedLeadForRiven.email}
                </div>
              </div>

              {/* Loading state */}
              {generatingDraft && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Generating draft with Riven AI...</span>
                </div>
              )}

              {/* Email form */}
              {!generatingDraft && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-body">Body</Label>
                    <Textarea
                      id="email-body"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={10}
                      placeholder="Email body..."
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRivenModalOpen(false)}
              disabled={sendingEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveAndSend}
              disabled={generatingDraft || sendingEmail || !emailSubject.trim() || !emailBody.trim()}
            >
              {sendingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Approve & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadIntelligencePage;
