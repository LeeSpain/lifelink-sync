import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Building, Users, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  region: string;
  locale_default: string;
  created_at: string;
}

export const RegionalOrganizationsPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      region: '',
      locale_default: 'es-ES'
    }
  });

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['regional-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Organization[];
    },
  });

  const createOrganization = useMutation({
    mutationFn: async (formData: any) => {
      const { data, error } = await supabase
        .from('organizations')
        .insert(formData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regional-organizations'] });
      setShowCreateModal(false);
      reset();
      toast({
        title: "Organization created",
        description: "New regional organization has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createOrganization.mutate(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading organizations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Regional Organizations
            </CardTitle>
            <CardDescription>
              Manage regional call centers and emergency response organizations
            </CardDescription>
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogDescription>
                  Set up a new regional emergency response organization
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    placeholder="Regional Emergency Center Spain"
                    {...register('name', { required: 'Organization name is required' })}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    placeholder="e.g., Madrid, Catalonia, Andalusia"
                    {...register('region')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locale">Default Language</Label>
                  <Select onValueChange={(value) => register('locale_default').onChange({ target: { value } })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="ca-ES">Catalan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createOrganization.isPending}>
                    {createOrganization.isPending ? 'Creating...' : 'Create Organization'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {organizations.length === 0 ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first regional emergency response organization
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Organization
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{org.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {org.region && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {org.region}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {org.locale_default}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    0 users
                  </Badge>
                  <Button size="sm" variant="outline">
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};