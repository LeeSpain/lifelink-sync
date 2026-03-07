import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedCustomers } from '@/hooks/useEnhancedCustomers';
import { useBulkCustomerActions } from '@/hooks/useBulkCustomerActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Mail, Download, Eye, Users } from 'lucide-react';
import { format } from 'date-fns';

export const CustomersPageEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const { data: customers, isLoading } = useEnhancedCustomers();
  const { sendBulkCommunication, exportCustomers } = useBulkCustomerActions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<'email' | 'sms' | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const filteredCustomers = customers?.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.first_name?.toLowerCase().includes(searchLower) ||
      customer.last_name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.user_id)));
    } else {
      setSelectedCustomers(new Set());
    }
  };

  const handleSelectCustomer = (userId: string, checked: boolean) => {
    const newSelection = new Set(selectedCustomers);
    if (checked) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedCustomers(newSelection);
  };

  const handleBulkEmail = () => {
    setBulkAction('email');
    setShowBulkDialog(true);
  };

  const handleSendBulk = () => {
    if (bulkAction && selectedCustomers.size > 0) {
      sendBulkCommunication.mutate({
        customerIds: Array.from(selectedCustomers),
        type: bulkAction,
        subject: emailSubject,
        message: emailMessage,
      }, {
        onSuccess: () => {
          setShowBulkDialog(false);
          setSelectedCustomers(new Set());
          setEmailSubject('');
          setEmailMessage('');
        },
      });
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    const idsToExport = selectedCustomers.size > 0 
      ? Array.from(selectedCustomers)
      : filteredCustomers.map(c => c.user_id);
    exportCustomers(idsToExport, format);
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Customers</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {filteredCustomers.length} customers
            {selectedCustomers.size > 0 && ` • ${selectedCustomers.size} selected`}
          </p>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleBulkEmail}
                disabled={selectedCustomers.size === 0}
                className="text-xs sm:text-sm"
              >
                <Mail className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Email ({selectedCustomers.size})</span>
                <span className="sm:hidden">({selectedCustomers.size})</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                className="text-xs sm:text-sm"
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
                className="text-xs sm:text-sm"
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export JSON</span>
                <span className="sm:hidden">JSON</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left">
                      <Checkbox
                        checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-left font-medium">Customer</th>
                    <th className="p-3 text-left font-medium">Email</th>
                    <th className="p-3 text-left font-medium">Subscription</th>
                    <th className="p-3 text-left font-medium">Joined</th>
                    <th className="p-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.user_id} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedCustomers.has(customer.user_id)}
                          onCheckedChange={(checked) => handleSelectCustomer(customer.user_id, checked as boolean)}
                        />
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">
                            {customer.first_name} {customer.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">{customer.phone}</div>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{customer.email}</td>
                      <td className="p-3">
                        {customer.subscriber?.subscribed ? (
                          <Badge variant="default">
                            {customer.subscriber.subscription_tier || 'Basic'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No Subscription</Badge>
                        )}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {customer.created_at ? format(new Date(customer.created_at), 'PP') : 'N/A'}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin-dashboard/customers/${customer.user_id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Bulk {bulkAction === 'email' ? 'Email' : 'SMS'}</DialogTitle>
            <DialogDescription>
              Send a message to {selectedCustomers.size} selected customer(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {bulkAction === 'email' && (
              <div>
                <Label htmlFor="bulk-subject">Subject</Label>
                <Input
                  id="bulk-subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject..."
                />
              </div>
            )}
            <div>
              <Label htmlFor="bulk-message">Message</Label>
              <Textarea
                id="bulk-message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Message content..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendBulk} disabled={sendBulkCommunication.isPending}>
              {sendBulkCommunication.isPending ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};