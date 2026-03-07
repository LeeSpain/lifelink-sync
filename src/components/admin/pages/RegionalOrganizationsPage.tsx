import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Building, MapPin, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  region: string;
  locale_default: string;
  created_at: string;
  user_count?: number;
}

const RegionalOrganizationsPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    region: '',
    locale_default: 'es'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_users (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data?.map(org => ({
        ...org,
        user_count: org.organization_users?.[0]?.count || 0
      })) || [];
    }
  });

  const createOrgMutation = useMutation({
    mutationFn: async (orgData: typeof newOrg) => {
      const { data, error } = await supabase
        .from('organizations')
        .insert([orgData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setIsCreateOpen(false);
      setNewOrg({ name: '', region: '', locale_default: 'es' });
      toast({
        title: "Organization Created",
        description: "The regional organization has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateOrg = () => {
    if (!newOrg.name || !newOrg.region) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createOrgMutation.mutate(newOrg);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading organizations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Regional Organizations</h1>
          <p className="text-muted-foreground">
            Manage regional emergency response organizations
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Set up a new regional emergency response organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  placeholder="Emergency Response Center Madrid"
                />
              </div>
              <div>
                <Label htmlFor="region">Region *</Label>
                <Input
                  id="region"
                  value={newOrg.region}
                  onChange={(e) => setNewOrg({ ...newOrg, region: e.target.value })}
                  placeholder="Madrid, Spain"
                />
              </div>
              <div>
                <Label htmlFor="locale">Default Language</Label>
                <Select 
                  value={newOrg.locale_default} 
                  onValueChange={(value) => setNewOrg({ ...newOrg, locale_default: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="nl">Nederlands</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateOrg}
                  disabled={createOrgMutation.isPending}
                >
                  {createOrgMutation.isPending ? 'Creating...' : 'Create Organization'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {organizations?.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {org.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {org.region}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Language:</span>
                  <Badge variant="secondary">{org.locale_default}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Staff:</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{org.user_count}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <span className="text-sm">
                    {new Date(org.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {organizations?.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organizations Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first regional organization to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RegionalOrganizationsPage;