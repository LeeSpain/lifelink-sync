import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCustomerServices } from '@/hooks/useCustomerServices';
import { Shield, Plus, Activity, DollarSign } from 'lucide-react';
import { AddServiceDialog } from './AddServiceDialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

interface CustomerServicesTabProps {
  userId: string;
}

export const CustomerServicesTab: React.FC<CustomerServicesTabProps> = ({ userId }) => {
  const { assignedServices, availableServices, stats, updateService, isLoading } = useCustomerServices(userId);
  const [showAddService, setShowAddService] = useState(false);

  const handleToggleService = (assignmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateService({ assignmentId, status: newStatus });
  };

  if (isLoading) {
    return <div>Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeServices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Services */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Regional Services</CardTitle>
          <Button onClick={() => setShowAddService(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </CardHeader>
        <CardContent>
          {assignedServices && assignedServices.length > 0 ? (
            <div className="space-y-4">
              {assignedServices.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{assignment.regional_services?.name}</h4>
                      <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Region: {assignment.regional_services?.region}
                    </div>
                    <div className="text-sm mt-1">
                      Price: ${(assignment.price_override || assignment.regional_services?.price || 0).toFixed(2)}/month
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Started: {format(new Date(assignment.start_date), 'MMM d, yyyy')}
                      {assignment.end_date && ` • Ends: ${format(new Date(assignment.end_date), 'MMM d, yyyy')}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Active</span>
                      <Switch
                        checked={assignment.status === 'active'}
                        onCheckedChange={() => handleToggleService(assignment.id, assignment.status)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No services assigned yet. Click "Add Service" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Service Dialog */}
      <AddServiceDialog
        userId={userId}
        availableServices={availableServices || []}
        open={showAddService}
        onClose={() => setShowAddService(false)}
      />
    </div>
  );
};
