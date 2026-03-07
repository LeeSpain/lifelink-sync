import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Edit, 
  MapPin, 
  Phone, 
  Calendar, 
  Globe, 
  Heart, 
  Users, 
  Plus, 
  Trash2, 
  AlertTriangle,
  UserPlus,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FamilyInviteModal from "@/components/dashboard/family/FamilyInviteModal";

interface PersonalDetailsCardProps {
  profile: any;
  onProfileUpdate: () => void;
}

const PersonalDetailsCard = ({ profile, onProfileUpdate }: PersonalDetailsCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    address: '',
    country: '',
    language_preference: 'en'
  });

  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [healthInfo, setHealthInfo] = useState({
    bloodType: "",
    allergies: [],
    medications: [],
    medicalConditions: [],
    emergencyMedicalInfo: ""
  });
  const [familyMembers, setFamilyMembers] = useState([]);
  const [editingContact, setEditingContact] = useState<number | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        address: profile.address || '',
        country: profile.country || '',
        language_preference: profile.language_preference || 'en'
      });

      // Load real emergency contacts from profile
      setEmergencyContacts(profile.emergency_contacts || []);

      // Load real health info from profile
      setHealthInfo({
        bloodType: profile.blood_type || "",
        allergies: profile.allergies || [],
        medications: profile.medications || [],
        medicalConditions: profile.medical_conditions || [],
        emergencyMedicalInfo: profile.emergency_medical_info || ""
      });

      // Load family invites from database
      loadFamilyMembers();
    }
  }, [profile]);

  const loadFamilyMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: invites, error } = await supabase
        .from('family_invites')
        .select('*')
        .eq('inviter_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFamilyMembers(invites?.map(invite => ({
        id: invite.id,
        name: invite.invitee_name,
        relationship: invite.relationship,
        phone: '', // Not stored in invites
        email: invite.invitee_email,
        status: invite.status === 'accepted' ? 'Connected' : 
               invite.status === 'pending' ? 'Pending' : 'Expired'
      })) || []);
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const savePersonalDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save personal details + health info + emergency contacts
      const updateData = {
        ...formData,
        emergency_contacts: emergencyContacts,
        blood_type: healthInfo.bloodType,
        allergies: healthInfo.allergies,
        medications: healthInfo.medications,
        medical_conditions: healthInfo.medicalConditions,
        emergency_medical_info: healthInfo.emergencyMedicalInfo
      };

      // Check if profile exists, if not create one
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            ...updateData
          });

        if (insertError) throw insertError;
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      }

      onProfileUpdate();
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully."
      });
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
    setEditingContact(emergencyContacts.length);
  };

  const updateEmergencyContact = (index: number, field: string, value: string) => {
    const updatedContacts = [...emergencyContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setEmergencyContacts(updatedContacts);
  };

  const saveEmergencyContact = (index: number) => {
    setEditingContact(null);
    // Auto-save when editing is complete
    if (emergencyContacts[index].name && emergencyContacts[index].phone) {
      savePersonalDetails();
    }
  };

  const removeEmergencyContact = (index: number) => {
    if (confirm("Are you sure you want to remove this contact?")) {
      const updatedContacts = emergencyContacts.filter((_, i) => i !== index);
      setEmergencyContacts(updatedContacts);
      setTimeout(() => savePersonalDetails(), 100);
    }
  };

  // Health Information Functions
  const addHealthItem = (type: 'allergies' | 'medications' | 'medicalConditions') => {
    const item = prompt(`Add ${type.slice(0, -1)}:`);
    if (item && item.trim()) {
      setHealthInfo(prev => ({
        ...prev,
        [type]: [...prev[type], item.trim()]
      }));
    }
  };

  const removeHealthItem = (type: 'allergies' | 'medications' | 'medicalConditions', index: number) => {
    setHealthInfo(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  // Family Functions
  const handleInviteFamily = () => {
    setIsInviteModalOpen(true);
  };

  const handleInviteCreated = () => {
    loadFamilyMembers();
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

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' }
  ];

  const sections = [
    { id: 'personal', title: 'Personal', icon: User },
    { id: 'emergency', title: 'Emergency', icon: Phone },
    { id: 'health', title: 'Health', icon: Heart },
    { id: 'family', title: 'Family', icon: Users }
  ];

  return (
    <Card className="bg-white/95 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="h-6 w-6 text-primary" />
            Personal Details
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isEditing) {
                savePersonalDetails();
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? 'Save' : 'Edit'}
          </Button>
        </div>
        
        {/* Section Tabs */}
        <div className="flex gap-1 mt-4 p-1 bg-muted rounded-lg">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${
                activeSection === section.id
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <section.icon className="h-4 w-4" />
              {section.title}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Personal Information Section */}
        {activeSection === 'personal' && (
          <div className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                {isEditing ? (
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Enter your first name"
                  />
                ) : (
                  <p className="px-3 py-2 text-sm bg-muted/50 rounded-md">
                    {formData.first_name || 'Not provided'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Enter your last name"
                  />
                ) : (
                  <p className="px-3 py-2 text-sm bg-muted/50 rounded-md">
                    {formData.last_name || 'Not provided'}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="px-3 py-2 text-sm bg-muted/50 rounded-md">
                    {formData.phone || 'Not provided'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </Label>
                {isEditing ? (
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  />
                ) : (
                  <p className="px-3 py-2 text-sm bg-muted/50 rounded-md">
                    {formData.date_of_birth 
                      ? new Date(formData.date_of_birth).toLocaleDateString()
                      : 'Not provided'
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your address"
                />
              ) : (
                <p className="px-3 py-2 text-sm bg-muted/50 rounded-md">
                  {formData.address || 'Not provided'}
                </p>
              )}
            </div>

            {/* Country and Language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                {isEditing ? (
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Enter your country"
                  />
                ) : (
                  <p className="px-3 py-2 text-sm bg-muted/50 rounded-md">
                    {formData.country || 'Not provided'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="language_preference" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Preferred Language
                </Label>
                {isEditing ? (
                  <select
                    id="language_preference"
                    value={formData.language_preference}
                    onChange={(e) => handleInputChange('language_preference', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="px-3 py-2 text-sm bg-muted/50 rounded-md">
                    {languages.find(lang => lang.code === formData.language_preference)?.name || 'English'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Emergency Contacts Section */}
        {activeSection === 'emergency' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="h-5 w-5 text-red-500" />
                Emergency Contacts
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={addEmergencyContact}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
            <div className="space-y-3">
              {emergencyContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No emergency contacts added yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addEmergencyContact}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Contact
                  </Button>
                </div>
              ) : (
                emergencyContacts.map((contact, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-muted/20">
                    {editingContact === index ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Contact {index + 1}</h4>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveEmergencyContact(index)}
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingContact(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Name"
                            value={contact.name}
                            onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                          />
                          <Input
                            placeholder="Phone"
                            value={contact.phone}
                            onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                          />
                          <Input
                            placeholder="Email"
                            value={contact.email}
                            onChange={(e) => updateEmergencyContact(index, 'email', e.target.value)}
                          />
                          <Input
                            placeholder="Relationship"
                            value={contact.relationship}
                            onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                            <Phone className="h-6 w-6 text-red-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-base">{contact.name || 'Unnamed Contact'}</h4>
                            <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                            <p className="text-sm text-muted-foreground">{contact.phone}</p>
                            {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingContact(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeEmergencyContact(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Health Information Section */}
        {activeSection === 'health' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Health Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Blood Type</Label>
                {isEditing ? (
                  <select
                    value={healthInfo.bloodType}
                    onChange={(e) => setHealthInfo(prev => ({...prev, bloodType: e.target.value}))}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background mt-1"
                  >
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <p className="px-3 py-2 text-sm bg-muted/50 rounded-md mt-1">
                    {healthInfo.bloodType || "Not specified"}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Allergies</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {healthInfo.allergies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No allergies recorded</p>
                ) : (
                  healthInfo.allergies.map((allergy, index) => (
                    <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {allergy}
                      {isEditing && (
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
                          onClick={() => removeHealthItem('allergies', index)}
                        />
                      )}
                    </Badge>
                  ))
                )}
                {isEditing && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => addHealthItem('allergies')}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Current Medications</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {healthInfo.medications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No medications recorded</p>
                ) : (
                  healthInfo.medications.map((medication, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 flex items-center gap-1">
                      {medication}
                      {isEditing && (
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
                          onClick={() => removeHealthItem('medications', index)}
                        />
                      )}
                    </Badge>
                  ))
                )}
                {isEditing && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => addHealthItem('medications')}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Medical Conditions</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {healthInfo.medicalConditions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No medical conditions recorded</p>
                ) : (
                  healthInfo.medicalConditions.map((condition, index) => (
                    <Badge key={index} variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 flex items-center gap-1">
                      {condition}
                      {isEditing && (
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-600"
                          onClick={() => removeHealthItem('medicalConditions', index)}
                        />
                      )}
                    </Badge>
                  ))
                )}
                {isEditing && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => addHealthItem('medicalConditions')}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Emergency Medical Information</Label>
              <Textarea
                value={healthInfo.emergencyMedicalInfo}
                onChange={(e) => setHealthInfo(prev => ({...prev, emergencyMedicalInfo: e.target.value}))}
                readOnly={!isEditing}
                placeholder="Additional medical information for emergency responders..."
                className="mt-1 bg-muted/50"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Family Connections Section */}
        {activeSection === 'family' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Family Connections
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleInviteFamily}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Family
              </Button>
            </div>
            <div className="space-y-3">
              {familyMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No family members connected yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInviteFamily}
                    className="mt-4"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Family
                  </Button>
                </div>
              ) : (
                familyMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">{member.relationship}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge 
                        variant={member.status === 'Connected' ? 'default' : 'secondary'}
                        className={member.status === 'Connected' ? 'bg-emergency text-black' : ''}
                      >
                        {member.status}
                      </Badge>
                      {member.status !== 'Connected' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => removeFamilyMember(member.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <FamilyInviteModal
        isOpen={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        onInviteCreated={handleInviteCreated}
      />
    </Card>
  );
};

export default PersonalDetailsCard;