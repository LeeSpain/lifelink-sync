import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MapPin, Plus, Edit, Trash2, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  family_group_id: string;
  created_at: string;
}

interface PlaceFormData {
  name: string;
  lat: string;
  lng: string;
  radius_m: number;
}

export default function PlacesManager() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [formData, setFormData] = useState<PlaceFormData>({
    name: "",
    lat: "",
    lng: "",
    radius_m: 150
  });
  const [familyGroups, setFamilyGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  
  const { user } = useAuth();
  const { toast } = useToast();

  const loadFamilyGroups = async () => {
    if (!user) return;

    try {
      // Get owned groups
      const { data: ownedGroups, error: ownedError } = await supabase
        .from("family_groups")
        .select("id")
        .eq("owner_user_id", user.id);

      if (ownedError) throw ownedError;

      // Get member groups
      const { data: memberships, error: memberError } = await supabase
        .from("family_memberships")
        .select("group_id")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (memberError) throw memberError;

      const allGroupIds = [
        ...(ownedGroups?.map(g => g.id) || []),
        ...(memberships?.map(m => m.group_id) || [])
      ];

      const groups = allGroupIds.map(id => ({
        id,
        name: `Family Circle ${id.slice(0, 8)}`
      }));

      setFamilyGroups(groups);
      if (groups.length > 0) {
        setSelectedGroupId(groups[0].id);
      }
    } catch (error) {
      console.error("Error loading family groups:", error);
    }
  };

  const loadPlaces = async () => {
    if (!selectedGroupId) return;

    try {
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("family_group_id", selectedGroupId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlaces(data || []);
    } catch (error) {
      console.error("Error loading places:", error);
      toast({
        title: "Error",
        description: "Failed to load places",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamilyGroups();
  }, [user]);

  useEffect(() => {
    if (selectedGroupId) {
      loadPlaces();
    }
  }, [selectedGroupId]);

  const resetForm = () => {
    setFormData({
      name: "",
      lat: "",
      lng: "",
      radius_m: 150
    });
    setEditing(null);
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
      radius_m: place.radius_m
    });
    setEditing(place);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedGroupId || !formData.name || !formData.lat || !formData.lng) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Error",
        description: "Please enter valid latitude (-90 to 90) and longitude (-180 to 180)",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editing) {
        const { error } = await supabase
          .from("places")
          .update({
            name: formData.name,
            lat,
            lng,
            radius_m: formData.radius_m
          })
          .eq("id", editing.id);

        if (error) throw error;
        toast({ title: "Success", description: "Place updated successfully" });
      } else {
        const { error } = await supabase
          .from("places")
          .insert({
            family_group_id: selectedGroupId,
            name: formData.name,
            lat,
            lng,
            radius_m: formData.radius_m,
            created_by: user?.id
          });

        if (error) throw error;
        toast({ title: "Success", description: "Place created successfully" });
      }

      setDialogOpen(false);
      resetForm();
      loadPlaces();
    } catch (error) {
      console.error("Error saving place:", error);
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
        .from("places")
        .delete()
        .eq("id", place.id);

      if (error) throw error;
      
      toast({ title: "Success", description: "Place deleted successfully" });
      loadPlaces();
    } catch (error) {
      console.error("Error deleting place:", error);
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Places & Geofences</h1>
          <p className="text-muted-foreground">Manage important locations for your family circle</p>
        </div>
        
        <div className="flex items-center gap-3">
          {familyGroups.length > 1 && (
            <select 
              value={selectedGroupId} 
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              {familyGroups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          )}
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Place
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Place" : "Add New Place"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Place Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Home, School, Office"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      value={formData.lat}
                      onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                      placeholder="51.5074"
                      type="number"
                      step="any"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      value={formData.lng}
                      onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                      placeholder="-0.1278"
                      type="number"
                      step="any"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Radius: {formData.radius_m} meters</Label>
                  <Slider
                    value={[formData.radius_m]}
                    onValueChange={([value]) => setFormData(prev => ({ ...prev, radius_m: value }))}
                    min={50}
                    max={1000}
                    step={25}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>50m</span>
                    <span>1000m</span>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editing ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {places.map(place => (
          <Card key={place.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {place.name}
                </CardTitle>
                <Badge variant="outline">
                  {place.radius_m}m radius
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>📍 {place.lat.toFixed(6)}, {place.lng.toFixed(6)}</div>
                  <div className="text-xs">
                    Created {new Date(place.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openInMaps(place)}
                    className="flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    Open
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(place)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(place)}
                    className="flex items-center gap-1 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {places.length === 0 && (
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No Places Yet</h3>
                <p className="text-muted-foreground">
                  Add important locations like home, school, or work to get notifications when family members arrive or leave.
                </p>
              </div>
              <Button onClick={openCreateDialog} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Place
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}