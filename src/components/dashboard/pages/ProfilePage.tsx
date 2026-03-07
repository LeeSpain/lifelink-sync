import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Phone, 
  Heart, 
  Users, 
  MapPin, 
  Calendar, 
  Mail,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  UserPlus,
  Activity,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import FamilyInviteModal from "@/components/dashboard/family/FamilyInviteModal";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    dateOfBirth: "",
    address: "",
    country: "",
    language: "English"
  });

  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [healthInfo, setHealthInfo] = useState({
    bloodType: "",
    allergies: [],
    medications: [],
    medicalConditions: [],
    emergencyMedicalInfo: ""
  });
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (profileData) {
        setProfile({
          firstName: profileData.first_name || "",
          lastName: profileData.last_name || "",
          email: user.email || "",
          phone: profileData.phone || "",
          dateOfBirth: profileData.date_of_birth || "",
          address: profileData.address || "",
          country: profileData.country || "",
          language: profileData.language_preference || "English"
        });

        setEmergencyContacts(Array.isArray(profileData.emergency_contacts) ? profileData.emergency_contacts : []);
        setHealthInfo({
          bloodType: profileData.blood_type || "",
          allergies: Array.isArray(profileData.allergies) ? profileData.allergies : [],
          medications: Array.isArray(profileData.medications) ? profileData.medications : [],
          medicalConditions: Array.isArray(profileData.medical_conditions) ? profileData.medical_conditions : [],
          emergencyMedicalInfo: "" // Will be added to database schema if needed
        });
      }

      // Load family members
      const { data: familyData } = await supabase
        .from('family_invites')
        .select('*')
        .eq('inviter_user_id', user.id);

      setFamilyMembers(familyData || []);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
          date_of_birth: profile.dateOfBirth || null,
          address: profile.address,
          country: profile.country,
          language_preference: profile.language,
          emergency_contacts: emergencyContacts,
          blood_type: healthInfo.bloodType,
          allergies: healthInfo.allergies,
          medications: healthInfo.medications,
          medical_conditions: healthInfo.medicalConditions,
          emergency_medical_info: healthInfo.emergencyMedicalInfo,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully."
      });
      loadProfileData(); // Reload data after update
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive"
      });
    }
  };

  // Emergency Contact Functions
  const addEmergencyContact = () => {
    const newContact = {
      name: "",
      phone: "",
      email: "",
      relationship: ""
    };
    setEmergencyContacts([...emergencyContacts, newContact]);
  };

  const editEmergencyContact = (index: number) => {
    const contact = emergencyContacts[index];
    const name = prompt("Enter name:", contact.name);
    const phone = prompt("Enter phone:", contact.phone);
    const email = prompt("Enter email:", contact.email);
    const relationship = prompt("Enter relationship:", contact.relationship);
    
    if (name !== null && phone !== null && email !== null && relationship !== null) {
      const updatedContacts = [...emergencyContacts];
      updatedContacts[index] = { name, phone, email, relationship };
      setEmergencyContacts(updatedContacts);
      updateProfile();
    }
  };

  const removeEmergencyContact = (index: number) => {
    if (confirm("Are you sure you want to remove this emergency contact?")) {
      const updatedContacts = emergencyContacts.filter((_, i) => i !== index);
      setEmergencyContacts(updatedContacts);
      updateProfile();
    }
  };

  // Health Information Functions
  const addAllergy = () => {
    const allergy = prompt("Enter allergy:");
    if (allergy && allergy.trim()) {
      setHealthInfo(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergy.trim()]
      }));
    }
  };

  const removeAllergy = (index: number) => {
    setHealthInfo(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const addMedication = () => {
    const medication = prompt("Enter medication:");
    if (medication && medication.trim()) {
      setHealthInfo(prev => ({
        ...prev,
        medications: [...prev.medications, medication.trim()]
      }));
    }
  };

  const removeMedication = (index: number) => {
    setHealthInfo(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const addMedicalCondition = () => {
    const condition = prompt("Enter medical condition:");
    if (condition && condition.trim()) {
      setHealthInfo(prev => ({
        ...prev,
        medicalConditions: [...prev.medicalConditions, condition.trim()]
      }));
    }
  };

  const removeMedicalCondition = (index: number) => {
    setHealthInfo(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.filter((_, i) => i !== index)
    }));
  };

  // Family Functions
  const handleInviteFamily = () => {
    setIsInviteModalOpen(true);
  };

  const handleInviteCreated = () => {
    loadProfileData(); // Reload data including family members
  };

  const removeFamilyMember = async (memberId: string) => {
    if (confirm("Are you sure you want to remove this family member?")) {
      try {
        const { error } = await supabase
          .from('family_invites')
          .delete()
          .eq('id', memberId);

        if (error) throw error;

        setFamilyMembers(familyMembers.filter(member => member.id !== memberId));
        toast({
          title: "Success",
          description: "Family member removed successfully."
        });
      } catch (error) {
        console.error('Error removing family member:', error);
        toast({
          title: "Error",
          description: "Failed to remove family member.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <User className="h-6 w-6 text-primary" />
              Profile, Emergency, Health & Family
            </CardTitle>
            <CardDescription className="text-base">
              Manage your personal information, emergency contacts, health details, and family connections
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-sm">
              Your basic profile information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => setProfile(prev => ({...prev, firstName: e.target.value}))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => setProfile(prev => ({...prev, lastName: e.target.value}))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({...prev, email: e.target.value}))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({...prev, phone: e.target.value}))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(e) => setProfile(prev => ({...prev, dateOfBirth: e.target.value}))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="language" className="text-sm font-medium">Language</Label>
                <Select value={profile.language} onValueChange={(value) => setProfile(prev => ({...prev, language: value}))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="address" className="text-sm font-medium">Address</Label>
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) => setProfile(prev => ({...prev, address: e.target.value}))}
                className="mt-1"
                rows={2}
              />
            </div>
            <Button onClick={updateProfile} className="w-full md:w-auto">
              <Edit className="h-4 w-4 mr-2" />
              Update Profile
            </Button>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Phone className="h-5 w-5 text-red-500" />
                  Emergency Contacts
                </CardTitle>
                <CardDescription className="text-sm">
                  People to contact in case of emergency
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => addEmergencyContact()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emergencyContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No emergency contacts added yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addEmergencyContact()}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Contact
                  </Button>
                </div>
              ) : (
                emergencyContacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                        <Phone className="h-6 w-6 text-red-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base">{contact.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => editEmergencyContact(index)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeEmergencyContact(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Health Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Heart className="h-5 w-5 text-red-500" />
              Health Information
            </CardTitle>
            <CardDescription className="text-sm">
              Important medical information for emergency situations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bloodType" className="text-sm font-medium">Blood Type</Label>
                <Select value={healthInfo.bloodType} onValueChange={(value) => setHealthInfo(prev => ({...prev, bloodType: value}))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Allergies</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {healthInfo.allergies.map((allergy, index) => (
                  <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {allergy}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                      onClick={() => removeAllergy(index)}
                    />
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2"
                  onClick={() => addAllergy()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Current Medications</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {healthInfo.medications.map((medication, index) => (
                  <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 flex items-center gap-1">
                    {medication}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                      onClick={() => removeMedication(index)}
                    />
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2"
                  onClick={() => addMedication()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Medical Conditions</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {healthInfo.medicalConditions.map((condition, index) => (
                  <Badge key={index} variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 flex items-center gap-1">
                    {condition}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                      onClick={() => removeMedicalCondition(index)}
                    />
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2"
                  onClick={() => addMedicalCondition()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="emergencyMedicalInfo" className="text-sm font-medium">Emergency Medical Information</Label>
              <Textarea
                id="emergencyMedicalInfo"
                value={healthInfo.emergencyMedicalInfo}
                onChange={(e) => setHealthInfo(prev => ({...prev, emergencyMedicalInfo: e.target.value}))}
                placeholder="Additional medical information for emergency responders..."
                className="mt-1"
                rows={3}
              />
            </div>

            <Button 
              className="w-full md:w-auto"
              onClick={updateProfile}
            >
              <Heart className="h-4 w-4 mr-2" />
              Update Health Information
            </Button>
          </CardContent>
        </Card>

        {/* Family Connections */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-blue-500" />
                  Family Connections
                </CardTitle>
                <CardDescription className="text-sm">
                  Connected family members who can access your location and emergency information
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleInviteFamily}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Family
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {familyMembers.length > 0 ? familyMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base">{member.invitee_name}</h3>
                        <Badge 
                          variant={member.status === 'accepted' ? 'default' : 'secondary'}
                          className={member.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                        >
                          {member.status === 'accepted' ? 'Connected' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.relationship}</p>
                      <p className="text-sm text-muted-foreground">{member.invitee_email}</p>
                    </div>
                  </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeFamilyMember(member.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                </div>
              )) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No family members yet</p>
                  <p className="text-sm">Use the Family page to invite family members</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <FamilyInviteModal
        isOpen={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        onInviteCreated={handleInviteCreated}
      />
    </div>
  );
}