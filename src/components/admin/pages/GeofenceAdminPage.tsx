import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Navigation, MapPin, Plus, Trash2, Edit, RefreshCw, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  family_group_id: string;
  created_at: string;
  created_by?: string;
}

interface FamilyGroup {
  id: string;
  owner_user_id: string;
  created_at: string;
}

export default function GeofenceAdminPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    lat: '',
    lng: '',
    radius_m: '100',
    family_group_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all places (admin can see all)
      const { data: placesData, error: placesError } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });

      if (placesError) {
        console.error('Places error:', placesError);
      }

      // Load family groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('family_groups')
        .select('*');

      if (groupsError) {
        console.error('Groups error:', groupsError);
      }

      setPlaces(placesData || []);
      setFamilyGroups(groupsData || []);

    } catch (error) {
      console.error('Error loading geofence data:', error);
      toast({
        title: "Error",
        description: "Failed to load geofence data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSamplePlaces = async () => {
    try {
      setLoading(true);
      toast({
        title: "Creating Sample Places",
        description: "Generating sample geofence locations..."
      });

      // Get a family group to assign places to
      let targetGroupId = familyGroups[0]?.id;
      
      if (!targetGroupId) {
        // Create a sample family group if none exists
        const { data: newGroup, error: groupError } = await supabase
          .from('family_groups')
          .insert({
            owner_user_id: '11111111-1111-1111-1111-111111111111',
            owner_seat_quota: 5
          })
          .select()
          .single();

        if (groupError) throw groupError;
        targetGroupId = newGroup.id;
      }

      const samplePlaces = [
        {
          name: 'Home',
          lat: 37.3881024,
          lng: -2.1417503,
          radius_m: 150,
          family_group_id: targetGroupId,
          created_by: '11111111-1111-1111-1111-111111111111'
        },
        {
          name: 'School',
          lat: 37.3901024,
          lng: -2.1437503,
          radius_m: 200,
          family_group_id: targetGroupId,
          created_by: '11111111-1111-1111-1111-111111111111'
        },
        {
          name: 'Work Office',
          lat: 37.3861024,
          lng: -2.1397503,
          radius_m: 100,
          family_group_id: targetGroupId,
          created_by: '11111111-1111-1111-1111-111111111111'
        }
      ];

      const { error } = await supabase
        .from('places')
        .insert(samplePlaces);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sample geofence places created successfully!"
      });

      await loadData();
    } catch (error) {
      console.error('Error creating sample places:', error);
      toast({
        title: "Error",
        description: "Failed to create sample places",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      lat: '',
      lng: '',
      radius_m: '100',
      family_group_id: ''
    });
    setEditingPlace(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (place: Place) => {
    setFormData({
      name: place.name,
      lat: place.lat.toString(),
      lng: place.lng.toString(),
      radius_m: place.radius_m.toString(),
      family_group_id: place.family_group_id
    });
    setEditingPlace(place);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const lat = parseFloat(formData.lat);
      const lng = parseFloat(formData.lng);
      const radius_m = parseInt(formData.radius_m);

      if (!formData.name || isNaN(lat) || isNaN(lng) || isNaN(radius_m)) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields with valid values",
          variant: "destructive"
        });
        return;
      }

      const placeData = {
        name: formData.name,
        lat,
        lng,
        radius_m,
        family_group_id: formData.family_group_id || familyGroups[0]?.id,
        created_by: '11111111-1111-1111-1111-111111111111'
      };

      if (editingPlace) {
        const { error } = await supabase
          .from('places')
          .update(placeData)
          .eq('id', editingPlace.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Place updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('places')
          .insert(placeData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Place created successfully"
        });
      }

      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving place:', error);
      toast({
        title: "Error",
        description: "Failed to save place",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (place: Place) => {
    if (!confirm(`Are you sure you want to delete "${place.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('places')
        .delete()
        .eq('id', place.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Place deleted successfully"
      });

      await loadData();
    } catch (error) {
      console.error('Error deleting place:', error);
      toast({
        title: "Error",
        description: "Failed to delete place",
        variant: "destructive"
      });
    }
  };

  const openInMaps = (place: Place) => {
    const url = `https://www.google.com/maps?q=${place.lat},${place.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Geofence Management</h1>
          <p className="text-muted-foreground">Manage place-based alerts and location boundaries</p>
        </div>
        <div className="flex gap-2">
          {places.length === 0 && (
            <Button onClick={createSamplePlaces} disabled={loading} variant="default">
              Create Sample Places
            </Button>
          )}
          <Button onClick={openCreateDialog} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Add Place
          </Button>
          <Button onClick={loadData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Places</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{places.length}</div>
            <p className="text-xs text-muted-foreground">Geofenced locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Family Groups</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{familyGroups.length}</div>
            <p className="text-xs text-muted-foreground">With geofences</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Radius</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {places.length > 0 ? Math.round(places.reduce((sum, p) => sum + p.radius_m, 0) / places.length) : 0}m
            </div>
            <p className="text-xs text-muted-foreground">Average geofence size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Place Types</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(places.map(p => p.name.toLowerCase().includes('home') ? 'Home' : 
                                     p.name.toLowerCase().includes('work') ? 'Work' : 
                                     p.name.toLowerCase().includes('school') ? 'School' : 'Other')).size}
            </div>
            <p className="text-xs text-muted-foreground">Different categories</p>
          </CardContent>
        </Card>
      </div>

      {/* No Data Alert */}
      {places.length === 0 && !loading && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Navigation className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">No Geofences Configured</h3>
                <p className="text-sm text-yellow-700">
                  No geofenced places have been set up yet. Create sample places to see how location-based alerts work.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Places List */}
      {places.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Geofenced Places</CardTitle>
            <CardDescription>Manage location boundaries and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {places.map((place) => (
                <div key={place.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">{place.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {place.lat.toFixed(6)}, {place.lng.toFixed(6)} • {place.radius_m}m radius
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Group {place.family_group_id.slice(0, 8)}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => openInMaps(place)}>
                      <Globe className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(place)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(place)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlace ? 'Edit Place' : 'Create New Place'}</DialogTitle>
            <DialogDescription>
              {editingPlace ? 'Update the place details below.' : 'Add a new geofenced location for family monitoring.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Place Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Home, School, Office"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({...formData, lat: e.target.value})}
                placeholder="37.3881024"
              />
            </div>
            <div>
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData({...formData, lng: e.target.value})}
                placeholder="-2.1417503"
              />
            </div>
            </div>
            
            <div>
              <Label htmlFor="radius_m">Radius (meters)</Label>
              <Input
                id="radius_m"
                type="number"
                value={formData.radius_m}
                onChange={(e) => setFormData({...formData, radius_m: e.target.value})}
                placeholder="100"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingPlace ? 'Update' : 'Create'} Place
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}