// This component now uses the enhanced version with bulk operations and exports
export { CustomersPageEnhanced as default } from './CustomersPageEnhanced';

// OLD VERSION BELOW - Keeping for reference
/*
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users, 
  Plus, 
  Eye, 
  Download,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Activity,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCustomers } from '@/hooks/useOptimizedData';
import { useDebounce } from '@/hooks/useDebounce';
import CustomerDetailsModal from '@/components/admin/CustomerDetailsModal';
import AddCustomerModal from '@/components/admin/AddCustomerModal';
import { CustomerStatsCards } from '../CustomerStatsCards';
import { CustomerFilters } from '../CustomerFilters';
import { CustomerAnalytics } from '../CustomerAnalytics';
import { VirtualizedList } from '@/hooks/usePerformanceOptimizedComponents';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
  country?: string;
  subscriber?: {
    created_at: string;
    email: string;
    id: string;
    stripe_customer_id: string;
    subscribed: boolean;
    subscription_end: string;
    subscription_tier: string;
    updated_at: string;
    user_id: string;
  };
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    country: "",
    subscriptionStatus: "",
    registrationDate: "",
    orderStatus: ""
  });
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  // Use optimized data fetching
  const { data: customers = [], isLoading, error, refetch } = useCustomers();

  const handleSeedDemoCustomers = async () => {
    setIsSeeding(true);
    try {
      const { error } = await supabase.functions.invoke('seed-demo-customers');
      if (error) throw error;
      
      toast({
        title: "Demo customers added",
        description: "5 demo customers have been successfully added",
      });
      setTimeout(() => refetch(), 1500);
    } catch (err: any) {
      toast({
        title: "Failed to add demo customers",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // Debounce search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    return customers.filter((customer: Customer) => {
      const searchFields = [
        customer.first_name,
        customer.last_name,
        customer.phone,
        customer.subscriber?.email,
        customer.country
      ].filter(Boolean);
      
      const searchString = searchFields.join(' ').toLowerCase();
      const matchesSearch = searchString.includes(debouncedSearchTerm.toLowerCase());
      
      const matchesCountry = !filters.country || customer.country === filters.country;
      const customerStatus = customer.subscriber?.subscribed ? 'active' : 'inactive';
      const matchesSubscription = !filters.subscriptionStatus || customerStatus === filters.subscriptionStatus.toLowerCase();
      
      return matchesSearch && matchesCountry && matchesSubscription;
    });
  }, [customers, debouncedSearchTerm, filters]);

  const customerMetrics = useMemo(() => {
    if (!customers) return { total: 0, newThisMonth: 0, activeSubscriptions: 0, totalRevenue: 0 };
    
    const total = customers.length;
    const newThisMonth = customers.filter((c: Customer) => {
      const createdAt = new Date(c.created_at);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;
    
    const activeSubscriptions = customers.filter((c: Customer) => c.subscriber?.subscribed).length;
    const totalRevenue = customers.reduce((sum, customer) => {
      const subscription = customer.subscriber;
      if (subscription?.subscribed && subscription.subscription_tier) {
        switch (subscription.subscription_tier) {
          case 'premium': return sum + 0.99;
          case 'call_centre': return sum + 4.99;
          default: return sum;
        }
      }
      return sum;
    }, 0);
    
    return { total, newThisMonth, activeSubscriptions, totalRevenue };
  }, [customers]);

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalOpen(true);
  };

  const handleExportData = () => {
    const csv = [
      ['Name', 'Phone', 'Country', 'Subscription', 'Joined'].join(','),
      ...filteredCustomers.map(customer => [
        `"${customer.first_name || ''} ${customer.last_name || ''}"`,
        `"${customer.phone || ''}"`,
        `"${customer.country || ''}"`,
        `"${customer.subscriber?.subscribed ? customer.subscriber.subscription_tier || 'Basic' : 'Free'}"`,
        `"${new Date(customer.created_at).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Customer Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive customer management with advanced analytics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      <CustomerStatsCards 
        totalCustomers={customerMetrics.total}
        newCustomersThisMonth={customerMetrics.newThisMonth}
        activeSubscriptions={customerMetrics.activeSubscriptions}
        totalRevenue={customerMetrics.totalRevenue}
      />

      {customers && customers.length > 0 && (
        <CustomerAnalytics customers={customers} />
      )}

      <CustomerFilters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFiltersChange={setFilters}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSeedDemoCustomers}
                disabled={isSeeding}
              >
                <Plus className="mr-2 h-4 w-4" />
                {isSeeding ? "Adding..." : "Add 5 Sample Customers"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length > 100 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <VirtualizedList
                        items={filteredCustomers}
                        itemHeight={65}
                        containerHeight={500}
                        renderItem={(customer: any, index: number) => (
                          <div key={customer.id} className="flex items-center p-4 border-b hover:bg-muted/50">
                            <div className="flex-1 grid grid-cols-6 gap-4">
                              <div className="font-medium">
                                {customer.first_name || customer.last_name 
                                  ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                                  : 'Unnamed User'
                                }
                              </div>
                              <div>
                                {customer.phone && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Phone className="h-3 w-3" />
                                    {customer.phone}
                                  </div>
                                )}
                              </div>
                              <div>{customer.country || 'Not specified'}</div>
                              <div>
                                <Badge variant={customer.subscriber?.subscribed ? "default" : "secondary"}>
                                  {customer.subscriber?.subscribed ? customer.subscriber.subscription_tier || 'Active' : 'Free'}
                                </Badge>
                              </div>
                              <div>{new Date(customer.created_at).toLocaleDateString()}</div>
                               <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => navigate(`/admin-dashboard/customers/${customer.user_id}`)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Profile
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="font-medium">
                          {customer.first_name || customer.last_name 
                            ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                            : 'Unnamed User'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{customer.country || 'Not specified'}</TableCell>
                      <TableCell>
                        <Badge variant={customer.subscriber?.subscribed ? "default" : "secondary"}>
                          {customer.subscriber?.subscribed ? customer.subscriber.subscription_tier || 'Active' : 'Free'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(customer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/admin-dashboard/customers/${customer.user_id}`)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Profile
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <CustomerDetailsModal
        customer={selectedCustomer}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCustomer(null);
        }}
        onUpdate={() => refetch()}
      />

      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={() => refetch()}
      />
    </div>
  );
}
*/