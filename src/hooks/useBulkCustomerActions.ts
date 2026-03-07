import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBulkCustomerActions = () => {
  const { toast } = useToast();

  const sendBulkCommunication = useMutation({
    mutationFn: async ({
      customerIds,
      type,
      subject,
      message,
    }: {
      customerIds: string[];
      type: 'email' | 'sms';
      subject?: string;
      message: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-customer-communication', {
        body: { customerIds, type, subject, message },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Communication sent',
        description: `Successfully sent to ${data.sent} customers. ${data.failed} failed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send communication',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const exportCustomers = async (customerIds: string[], format: 'csv' | 'json' = 'csv') => {
    try {
      const { data: customers, error } = await supabase
        .from('profiles')
        .select('*, subscribers(*)')
        .in('user_id', customerIds);

      if (error) throw error;

      if (format === 'csv') {
        const csvContent = convertToCSV(customers);
        downloadFile(csvContent, 'customers.csv', 'text/csv');
      } else {
        const jsonContent = JSON.stringify(customers, null, 2);
        downloadFile(jsonContent, 'customers.json', 'application/json');
      }

      toast({ title: `Exported ${customers.length} customers successfully` });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    sendBulkCommunication,
    exportCustomers,
  };
};

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Phone', 'Country', 'Subscribed', 'Subscription Tier'];
  const rows = data.map(customer => [
    customer.user_id,
    customer.email || '',
    customer.first_name || '',
    customer.last_name || '',
    customer.phone || '',
    customer.country || '',
    customer.subscribers?.[0]?.subscribed ? 'Yes' : 'No',
    customer.subscribers?.[0]?.subscription_tier || 'None',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}