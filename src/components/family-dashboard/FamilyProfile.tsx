import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Shield, 
  Heart,
  Save,
  Users,
  Settings,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { useToast } from '@/hooks/use-toast';

const FamilyProfile = () => {
  const { user } = useOptimizedAuth();
  const { data: familyRole } = useFamilyRole();
  const { toast } = useToast();
  
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [ownerEmergencyContacts, setOwnerEmergencyContacts] = useState<any[]>([]);
  const [familyGroup, setFamilyGroup] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [familyMembership, setFamilyMembership] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    medical_conditions: [] as string[],
    allergies: [] as string[],
    address: '',
    date_of_birth: ''
  });

  useEffect(() => {
    if (user && familyRole?.familyGroupId) {
      loadProfileData();
    } else if (user && familyRole && (familyRole.role === 'none' || !familyRole.familyGroupId)) {
      // User is authenticated but has no family role - still load their basic profile
      loadBasicProfile();
    }
  }, [user, familyRole]);

  const loadBasicProfile = async () => {
    if (!user) return;
    
    try {
      const { data: userProfileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setUserProfile(userProfileData);
      
      if (userProfileData) {
        setProfileData({
          first_name: userProfileData.first_name || '',
          last_name: userProfileData.last_name || '',
          phone: userProfileData.phone || '',
          medical_conditions: userProfileData.medical_conditions || [],
          allergies: userProfileData.allergies || [],
          address: userProfileData.address || '',
          date_of_birth: userProfileData.date_of_birth || ''
        });
      }
    } catch (error) {
      console.error('Error loading basic profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfileData = async () => {
    if (!user || !familyRole?.familyGroupId) return;

    try {
      // Load family group data
      const { data: groupData } = await supabase
        .from('family_groups')
        .select('*')
        .eq('id', familyRole.familyGroupId)
        .single();

      if (groupData) {
        setFamilyGroup(groupData);
        
        // Load owner profile separately
        if (groupData.owner_user_id) {
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', groupData.owner_user_id)
            .single();

          setOwnerProfile(ownerData);
        }
      }

      // Load owner's emergency contacts
      if (groupData?.owner_user_id) {
        const { data: contacts } = await supabase
          .from('emergency_contacts')
          .select('*')
          .eq('user_id', groupData.owner_user_id)
          .order('priority');

        setOwnerEmergencyContacts(contacts || []);
      }

      // Load current user's profile (for family member info)
      const { data: userProfileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setUserProfile(userProfileData);
      
      if (userProfileData) {
        setProfileData({
          first_name: userProfileData.first_name || '',
          last_name: userProfileData.last_name || '',
          phone: userProfileData.phone || '',
          medical_conditions: userProfileData.medical_conditions || [],
          allergies: userProfileData.allergies || [],
          address: userProfileData.address || '',
          date_of_birth: userProfileData.date_of_birth || ''
        });
      }

      // Load family membership details
      const { data: membership } = await supabase
        .from('family_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('group_id', familyRole.familyGroupId)
        .single();

      setFamilyMembership(membership);

    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency information",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          medical_conditions: profileData.medical_conditions,
          allergies: profileData.allergies,
          address: profileData.address,
          date_of_birth: profileData.date_of_birth,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your family profile has been saved successfully"
      });

      loadProfileData();

    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    const firstName = profileData.first_name || '';
    const lastName = profileData.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {familyRole?.role === 'owner' ? 'My Emergency Information' : 
             ownerProfile ? `${ownerProfile.first_name}'s Emergency Information` : 
             'Emergency Information'}
          </h1>
          <p className="text-muted-foreground">
            {familyRole?.role === 'owner' 
              ? 'Manage your emergency information and medical details'
              : familyRole?.role === 'none' || !familyRole?.familyGroupId
                ? 'Basic profile information - no family emergency access'
                : `View emergency contact and medical information for ${ownerProfile?.first_name || 'your family member'}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <Heart className="h-3 w-3" />
            {familyRole?.role === 'owner' ? 'Account Owner' : 
             familyRole?.role === 'none' ? 'No Access' : 'Family Access'}
          </Badge>
          {ownerProfile && familyRole?.role !== 'owner' && (
            <Badge variant="secondary" className="gap-2">
              <Shield className="h-3 w-3" />
              Connected to {ownerProfile.first_name}'s Plan
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Owner Emergency Information - For Family Members */}
        {ownerProfile && familyRole?.role !== 'owner' && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {ownerProfile.first_name}'s Emergency Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Owner Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {`${ownerProfile.first_name?.charAt(0) || ''}${ownerProfile.last_name?.charAt(0) || ''}`.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {ownerProfile.first_name} {ownerProfile.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">Emergency Account Owner</p>
                  <Badge variant="default" className="mt-1">
                    Primary Emergency Contact
                  </Badge>
                </div>
              </div>

              {/* Owner Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{ownerProfile.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{ownerProfile.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              {(ownerProfile.medical_conditions?.length > 0 || ownerProfile.allergies?.length > 0) && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Medical Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ownerProfile.medical_conditions?.length > 0 && (
                      <div className="space-y-2">
                        <Label>Medical Conditions</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm">{ownerProfile.medical_conditions.join(', ')}</p>
                        </div>
                      </div>
                    )}
                    {ownerProfile.allergies?.length > 0 && (
                      <div className="space-y-2">
                        <Label>Allergies</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm">{ownerProfile.allergies.join(', ')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contacts */}
              {ownerEmergencyContacts.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Emergency Contacts</h4>
                  <div className="space-y-3">
                    {ownerEmergencyContacts.map((contact, index) => (
                      <div key={contact.id} className="p-3 bg-muted rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                            <p className="text-sm">{contact.phone}</p>
                            {contact.email && <p className="text-sm">{contact.email}</p>}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Priority {contact.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions for Family Members */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button variant="outline" className="gap-2" asChild>
                  <a href={`tel:${ownerProfile.phone}`}>
                    <Phone className="h-4 w-4" />
                    Call {ownerProfile.first_name}
                  </a>
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <a href="/family-dashboard/emergency-map">
                    <MapPin className="h-4 w-4" />
                    View Location
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Owner's Profile Management */}
        {familyRole?.role === 'owner' && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {getInitials() || 'FM'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {profileData.first_name} {profileData.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="default" className="mt-1">
                    Emergency Account Owner
                  </Badge>
                </div>
              </div>

              {/* Personal Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Home address"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={profileData.date_of_birth}
                    onChange={(e) => setProfileData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
              </div>


              {/* Save Button */}
              <Button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Your Family Access Information - For Family Members Only */}
        {familyRole?.role !== 'owner' && (
          <Card className="lg:col-span-2 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Family Access Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Your Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {getInitials() || 'FM'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {profileData.first_name} {profileData.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="outline" className="mt-1">
                    {familyMembership?.relationship || 'Family Member'}
                  </Badge>
                </div>
              </div>

              {/* Personal Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Your Information'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Privacy & Security */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Location Privacy</p>
                  <p className="text-muted-foreground">Live location is shared continuously with family members. Emergency contacts only receive location when SOS is activated.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Data Protection</p>
                  <p className="text-muted-foreground">All emergency data is encrypted and securely stored.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Family Connection</p>
                  <p className="text-muted-foreground">
                    {familyRole?.role === 'owner' 
                      ? 'You control who has access to your emergency information.'
                      : `You have secure access to ${ownerProfile?.first_name || 'your family member'}'s emergency status.`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default FamilyProfile;