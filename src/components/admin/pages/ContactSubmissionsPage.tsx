import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, MessageSquare, Mail, Phone, Calendar, User, AlertCircle, CheckCircle2, Clock, Eye } from 'lucide-react';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  admin_response?: string;
  responded_at?: string;
  responded_by?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  created_at: string;
  updated_at: string;
}

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<ContactSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [searchTerm, statusFilter, submissions]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const { data: submissionsData, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading contact submissions:', error);
        return;
      }

      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error('Error loading contact submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(submission => 
        submission.name.toLowerCase().includes(searchLower) ||
        submission.email.toLowerCase().includes(searchLower) ||
        submission.subject.toLowerCase().includes(searchLower) ||
        submission.message.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.status === statusFilter);
    }

    setFilteredSubmissions(filtered);
  };

  const updateSubmissionStatus = async (submissionId: string, newStatus: string, adminResponse?: string) => {
    try {
      setResponding(true);
      const updateData: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      };

      if (adminResponse) {
        updateData.admin_response = adminResponse;
        updateData.responded_at = new Date().toISOString();
        updateData.responded_by = 'admin'; // You might want to get the actual admin user
      }

      const { error } = await supabase
        .from('contact_submissions')
        .update(updateData)
        .eq('id', submissionId);

      if (error) {
        console.error('Error updating submission status:', error);
        toast({
          title: "Error",
          description: "Failed to update submission status.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setSubmissions(submissions.map(submission => 
        submission.id === submissionId 
          ? { ...submission, ...updateData }
          : submission
      ));

      toast({
        title: "Status Updated",
        description: "Contact submission status has been updated.",
      });

      setSelectedSubmission(null);
      setResponseText('');
    } catch (error) {
      console.error('Error updating submission status:', error);
      toast({
        title: "Error",
        description: "Failed to update submission status.",
        variant: "destructive",
      });
    } finally {
      setResponding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'responded': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'new': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'responded': return CheckCircle2;
      case 'in_progress': return Clock;
      case 'new': return AlertCircle;
      default: return MessageSquare;
    }
  };

  const stats = {
    total: submissions.length,
    new: submissions.filter(s => s.status === 'new').length,
    inProgress: submissions.filter(s => s.status === 'in_progress').length,
    responded: submissions.filter(s => s.status === 'responded').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Contact Submissions</h1>
          <p className="text-muted-foreground">Loading contact submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contact Submissions</h1>
          <p className="text-muted-foreground">Manage and respond to customer inquiries</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              <div>
                <p className="text-xl font-bold">{stats.new}</p>
                <p className="text-sm text-muted-foreground">New</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-xl font-bold">{stats.responded}</p>
                <p className="text-sm text-muted-foreground">Responded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, subject, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">Export</Button>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contact Submissions ({filteredSubmissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => {
                  const StatusIcon = getStatusIcon(submission.status);
                  return (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {submission.name}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {submission.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {submission.id.substring(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium">{submission.subject}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {submission.message.substring(0, 100)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(submission.status)} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {submission.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(submission.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(submission.created_at).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.responded_at ? (
                          <div className="text-sm text-green-600">
                            ✓ {new Date(submission.responded_at).toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Not responded
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedSubmission(submission)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Contact Submission Details</DialogTitle>
                              </DialogHeader>
                              {selectedSubmission && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Name</label>
                                      <p className="text-sm">{selectedSubmission.name}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Email</label>
                                      <p className="text-sm">{selectedSubmission.email}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">Subject</label>
                                    <p className="text-sm">{selectedSubmission.subject}</p>
                                  </div>
                                  
                                  <div>
                                    <label className="text-sm font-medium">Message</label>
                                    <div className="bg-muted p-3 rounded-md text-sm">
                                      {selectedSubmission.message}
                                    </div>
                                  </div>

                                  {selectedSubmission.admin_response && (
                                    <div>
                                      <label className="text-sm font-medium">Admin Response</label>
                                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-sm">
                                        {selectedSubmission.admin_response}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <label className="text-sm font-medium">Response</label>
                                    <Textarea
                                      value={responseText}
                                      onChange={(e) => setResponseText(e.target.value)}
                                      placeholder="Type your response here..."
                                      className="mt-2"
                                    />
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => updateSubmissionStatus(selectedSubmission.id, 'in_progress')}
                                      variant="outline"
                                      disabled={responding}
                                    >
                                      Mark In Progress
                                    </Button>
                                    <Button
                                      onClick={() => updateSubmissionStatus(selectedSubmission.id, 'responded', responseText)}
                                      disabled={!responseText.trim() || responding}
                                    >
                                      {responding ? 'Responding...' : 'Send Response'}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}