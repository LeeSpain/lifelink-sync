import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Send, AlertCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface Client {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  transferred_to_care: boolean;
  care_transfer_date: string | null;
  care_transfer_status: string;
  care_transfer_error: string | null;
}

export default function TransferToCare() {
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch clients ready to transfer
  const { data: readyClients = [], isLoading: loadingReady } = useQuery({
    queryKey: ['transfer-ready-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, phone, country, transferred_to_care, care_transfer_date, care_transfer_status, care_transfer_error')
        .eq('subscription_regional', true)
        .eq('transferred_to_care', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Client[];
    }
  });

  // Fetch transfer history
  const { data: transferHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['transfer-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, phone, country, transferred_to_care, care_transfer_date, care_transfer_status, care_transfer_error')
        .eq('transferred_to_care', true)
        .order('care_transfer_date', { ascending: false });

      if (error) throw error;
      return data as Client[];
    }
  });

  const transferMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('transfer-client-to-care', {
        body: { user_id: userId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, userId) => {
      toast({
        title: "Transfer Successful",
        description: `Client transferred to Care Conneqt successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['transfer-ready-clients'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-history'] });
      setSelectedClients(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    },
    onError: (error: any, userId) => {
      console.error('Transfer error:', error);
      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: error.message || "Failed to transfer client to Care Conneqt",
      });
    }
  });

  const handleTransfer = async (userId: string) => {
    await transferMutation.mutateAsync(userId);
  };

  const handleBatchTransfer = async () => {
    const clientsToTransfer = Array.from(selectedClients);
    
    toast({
      title: "Batch Transfer Started",
      description: `Transferring ${clientsToTransfer.length} clients...`,
    });

    for (const userId of clientsToTransfer) {
      await handleTransfer(userId);
      // Small delay between transfers to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const toggleClientSelection = (userId: string) => {
    setSelectedClients(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedClients.size === readyClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(readyClients.map(c => c.user_id)));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Transferred</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'not_transferred':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Ready</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transfer Clients to Care Conneqt</h1>
        <p className="text-muted-foreground">
          Transfer regional subscription clients to the Care Conneqt platform
        </p>
      </div>

      <Tabs defaultValue="ready" className="w-full">
        <TabsList>
          <TabsTrigger value="ready">
            Ready to Transfer
            {readyClients.length > 0 && (
              <Badge variant="secondary" className="ml-2">{readyClients.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            Transfer History
            {transferHistory.length > 0 && (
              <Badge variant="outline" className="ml-2">{transferHistory.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ready" className="space-y-4">
          {readyClients.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedClients.size === readyClients.length && readyClients.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedClients.size} of {readyClients.length} selected
                    </span>
                  </div>
                  {selectedClients.size > 0 && (
                    <Button
                      onClick={handleBatchTransfer}
                      disabled={transferMutation.isPending}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Transfer Selected ({selectedClients.size})
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          )}

          {loadingReady ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Loading clients...</p>
              </CardContent>
            </Card>
          ) : readyClients.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No clients ready to transfer</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {readyClients.map((client) => (
                <Card key={client.user_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedClients.has(client.user_id)}
                          onCheckedChange={() => toggleClientSelection(client.user_id)}
                        />
                        <div>
                          <CardTitle className="text-lg">
                            {client.first_name} {client.last_name}
                          </CardTitle>
                          <CardDescription>
                            <div className="space-y-1 mt-1">
                              <div>{client.phone}</div>
                              <div>{client.country}</div>
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(client.care_transfer_status)}
                        <Button
                          size="sm"
                          onClick={() => handleTransfer(client.user_id)}
                          disabled={transferMutation.isPending}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Transfer
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {loadingHistory ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Loading history...</p>
              </CardContent>
            </Card>
          ) : transferHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No transfer history yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {transferHistory.map((client) => (
                <Card key={client.user_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {client.first_name} {client.last_name}
                        </CardTitle>
                        <CardDescription>
                          <div className="space-y-1 mt-1">
                            <div>{client.phone}</div>
                            <div>{client.country}</div>
                            {client.care_transfer_date && (
                              <div className="text-xs mt-2">
                                Transferred: {format(new Date(client.care_transfer_date), 'PPpp')}
                              </div>
                            )}
                            {client.care_transfer_error && (
                              <div className="text-xs text-destructive mt-1">
                                Error: {client.care_transfer_error}
                              </div>
                            )}
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(client.care_transfer_status)}
                        {client.care_transfer_status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTransfer(client.user_id)}
                            disabled={transferMutation.isPending}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
