import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, Heart, MapPin, Phone, Globe, Plus, X } from 'lucide-react';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

const WelcomeQuestionnaire = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    street_address: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: '',
    language_preference: 'en',
    blood_type: '',
    medical_conditions: [] as string[],
    allergies: [] as string[],
    medications: [] as string[],
    emergency_contacts: [] as EmergencyContact[]
  });

  // Temporary input states
  const [newMedicalCondition, setNewMedicalCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newContact, setNewContact] = useState<EmergencyContact>({
    name: '',
    relationship: '',
    phone: '',
    email: ''
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Load existing profile data
    loadExistingProfile();
  }, [user, navigate]);

  const loadExistingProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      // Pre-populate with existing profile data
      let updatedFormData = {
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        phone: profile?.phone || '',
        date_of_birth: profile?.date_of_birth || '',
        street_address: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: profile?.country || '',
        language_preference: profile?.language_preference || 'en',
        blood_type: profile?.blood_type || '',
        medical_conditions: profile?.medical_conditions || [],
        allergies: profile?.allergies || [],
        medications: profile?.medications || [],
        emergency_contacts: (profile?.emergency_contacts as unknown as EmergencyContact[]) || []
      };

      // Parse existing address if available
      if (profile?.address) {
        updatedFormData.street_address = profile.address;
      }

      // If profile is empty or incomplete, try to get data from user metadata (registration)
      if (user?.user_metadata) {
        const metadata = user.user_metadata;
        
        // Pre-populate with registration data if profile fields are empty
        updatedFormData = {
          ...updatedFormData,
          first_name: updatedFormData.first_name || metadata.first_name || '',
          last_name: updatedFormData.last_name || metadata.last_name || '',
          phone: updatedFormData.phone || metadata.phone || metadata.phone_number || '',
          street_address: updatedFormData.street_address || metadata.current_location || '',
          language_preference: updatedFormData.language_preference || 
            (metadata.preferred_language === 'English' ? 'en' : metadata.preferred_language?.toLowerCase()) || 'en',
          medical_conditions: updatedFormData.medical_conditions.length > 0 ? 
            updatedFormData.medical_conditions : 
            (metadata.medical_conditions ? metadata.medical_conditions.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
          allergies: updatedFormData.allergies.length > 0 ? 
            updatedFormData.allergies : 
            (metadata.allergies ? metadata.allergies.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
          emergency_contacts: updatedFormData.emergency_contacts.length > 0 ? 
            updatedFormData.emergency_contacts : 
            (metadata.emergency_contacts ? JSON.parse(metadata.emergency_contacts) : [])
        };
      }

      setFormData(updatedFormData);
      
      // Debug logging
      console.log('User metadata:', user?.user_metadata);
      console.log('Profile data:', profile);
      console.log('Final form data:', updatedFormData);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const addArrayItem = (field: 'medical_conditions' | 'allergies' | 'medications', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      
      // Clear the input
      if (field === 'medical_conditions') setNewMedicalCondition('');
      if (field === 'allergies') setNewAllergy('');
      if (field === 'medications') setNewMedication('');
    }
  };

  const removeArrayItem = (field: 'medical_conditions' | 'allergies' | 'medications', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addEmergencyContact = () => {
    if (newContact.name && newContact.phone && newContact.email) {
      setFormData(prev => ({
        ...prev,
        emergency_contacts: [...prev.emergency_contacts, { ...newContact }]
      }));
      setNewContact({ name: '', relationship: '', phone: '', email: '' });
    }
  };

  const removeEmergencyContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emergency_contacts: prev.emergency_contacts.filter((_, i) => i !== index)
    }));
  };

  const calculateCompletionPercentage = () => {
    // Only count essential/required fields that are actually displayed as required to users
    const requiredFields = [
      formData.first_name,
      formData.last_name,
      formData.phone,
      formData.date_of_birth,
      formData.street_address,
      formData.country,
      formData.blood_type,
      formData.emergency_contacts.length > 0 ? 'has_contacts' : ''
    ];
    
    const completedFields = requiredFields.filter(field => field && field.toString().trim() !== '').length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const completionPercentage = calculateCompletionPercentage();
      
      // Use update instead of upsert since we know the profile exists
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth,
          address: `${formData.street_address}${formData.city ? ', ' + formData.city : ''}${formData.state_province ? ', ' + formData.state_province : ''}${formData.postal_code ? ' ' + formData.postal_code : ''}`.trim(),
          country: formData.country,
          language_preference: formData.language_preference,
          blood_type: formData.blood_type,
          medical_conditions: formData.medical_conditions,
          allergies: formData.allergies,
          medications: formData.medications,
          emergency_contacts: formData.emergency_contacts as any,
          profile_completion_percentage: completionPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile Complete!",
        description: `Profile updated with ${completionPercentage}% completion. Welcome to your dashboard!`,
      });

      // Redirect to member dashboard
      navigate('/member-dashboard');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <UserCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground">Personal Information</h2>
              <p className="text-muted-foreground">Let's start with your basic details</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name" className="flex items-center gap-2">
                  First Name
                  {formData.first_name && user?.user_metadata?.first_name && (
                    <Badge variant="secondary" className="text-xs">From registration</Badge>
                  )}
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <Label htmlFor="last_name" className="flex items-center gap-2">
                  Last Name
                  {formData.last_name && user?.user_metadata?.last_name && (
                    <Badge variant="secondary" className="text-xs">From registration</Badge>
                  )}
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                Phone Number
                {formData.phone && user?.user_metadata?.phone_number && (
                  <Badge variant="secondary" className="text-xs">From registration</Badge>
                )}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground">Location & Language</h2>
              <p className="text-muted-foreground">Where are you located?</p>
            </div>

            <div>
              <Label htmlFor="street_address" className="flex items-center gap-2">
                Street Address
                {formData.street_address && user?.user_metadata?.current_location && (
                  <Badge variant="secondary" className="text-xs">From registration</Badge>
                )}
              </Label>
              <Input
                id="street_address"
                value={formData.street_address}
                onChange={(e) => setFormData(prev => ({ ...prev, street_address: e.target.value }))}
                placeholder="Enter your street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter your city"
                />
              </div>
              <div>
                <Label htmlFor="state_province">State/Province</Label>
                <Input
                  id="state_province"
                  value={formData.state_province}
                  onChange={(e) => setFormData(prev => ({ ...prev, state_province: e.target.value }))}
                  placeholder="Enter state or province"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code">Postal/Zip Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="Enter postal or zip code"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Enter your country"
                />
              </div>
            </div>


            <div>
              <Label htmlFor="language" className="flex items-center gap-2">
                Preferred Language
                {formData.language_preference && user?.user_metadata?.preferred_language && (
                  <Badge variant="secondary" className="text-xs">From registration</Badge>
                )}
              </Label>
              <Select value={formData.language_preference} onValueChange={(value) => setFormData(prev => ({ ...prev, language_preference: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Heart className="w-16 h-16 text-emergency mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground">Medical Information</h2>
              <p className="text-muted-foreground">Important for emergency situations</p>
            </div>

            <div>
              <Label htmlFor="blood_type">Blood Type</Label>
              <Select value={formData.blood_type} onValueChange={(value) => setFormData(prev => ({ ...prev, blood_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood type" />
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

            <div>
              <Label className="flex items-center gap-2">
                Medical Conditions
                {formData.medical_conditions.length > 0 && user?.user_metadata?.medical_conditions && (
                  <Badge variant="secondary" className="text-xs">From registration</Badge>
                )}
              </Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newMedicalCondition}
                  onChange={(e) => setNewMedicalCondition(e.target.value)}
                  placeholder="Add medical condition"
                  onKeyPress={(e) => e.key === 'Enter' && addArrayItem('medical_conditions', newMedicalCondition)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayItem('medical_conditions', newMedicalCondition)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.medical_conditions.map((condition, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {condition}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeArrayItem('medical_conditions', index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Allergies
                {formData.allergies.length > 0 && user?.user_metadata?.allergies && (
                  <Badge variant="secondary" className="text-xs">From registration</Badge>
                )}
              </Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add allergy"
                  onKeyPress={(e) => e.key === 'Enter' && addArrayItem('allergies', newAllergy)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayItem('allergies', newAllergy)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.allergies.map((allergy, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {allergy}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeArrayItem('allergies', index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Current Medications</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  placeholder="Add medication"
                  onKeyPress={(e) => e.key === 'Enter' && addArrayItem('medications', newMedication)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addArrayItem('medications', newMedication)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.medications.map((medication, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {medication}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeArrayItem('medications', index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Phone className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground">Emergency Contacts</h2>
              <p className="text-muted-foreground">Who should we contact in an emergency?</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Add Emergency Contact
                  {formData.emergency_contacts.length > 0 && user?.user_metadata?.emergency_contacts && (
                    <Badge variant="secondary" className="text-xs">Some from registration</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_name">Name</Label>
                    <Input
                      id="contact_name"
                      value={newContact.name}
                      onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_relationship">Relationship</Label>
                    <Input
                      id="contact_relationship"
                      value={newContact.relationship}
                      onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                      placeholder="e.g., Spouse, Parent, Friend"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_phone">Phone</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                   <div>
                     <Label htmlFor="contact_email">Email</Label>
                     <Input
                       id="contact_email"
                       type="email"
                       value={newContact.email}
                       onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                       placeholder="email@example.com"
                       required
                     />
                   </div>
                </div>
                <Button
                  type="button"
                  onClick={addEmergencyContact}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </CardContent>
            </Card>

            {formData.emergency_contacts.length > 0 && (
              <div className="space-y-3">
                <Label>Your Emergency Contacts</Label>
                {formData.emergency_contacts.map((contact, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{contact.name}</h4>
                          <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                          <p className="text-sm">{contact.phone}</p>
                          {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmergencyContact(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 5:
        const completionPercentage = calculateCompletionPercentage();
        
        // Check which fields are missing
        const missingFields = [];
        const completedFields = [];
        
        const fieldChecks = [
          { key: 'first_name', label: 'First Name', value: formData.first_name },
          { key: 'last_name', label: 'Last Name', value: formData.last_name },
          { key: 'phone', label: 'Phone Number', value: formData.phone },
          { key: 'date_of_birth', label: 'Date of Birth', value: formData.date_of_birth },
          { key: 'street_address', label: 'Street Address', value: formData.street_address },
          { key: 'country', label: 'Country', value: formData.country },
          { key: 'blood_type', label: 'Blood Type', value: formData.blood_type },
          { key: 'emergency_contacts', label: 'Emergency Contacts', value: formData.emergency_contacts.length > 0 ? 'Yes' : '' }
        ];
        
        fieldChecks.forEach(field => {
          if (field.value && field.value.toString().trim() !== '') {
            completedFields.push(field);
          } else {
            missingFields.push(field);
          }
        });
        
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Globe className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground">Ready to Go!</h2>
              <p className="text-muted-foreground">Review your information and complete setup</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Profile Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Progress</span>
                    <span className="font-semibold">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="w-full" />
                  
                  {missingFields.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <h5 className="font-medium text-amber-800 mb-2">Missing Information:</h5>
                      <ul className="text-sm text-amber-700 space-y-1">
                        {missingFields.map(field => (
                          <li key={field.key} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                            {field.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Completed Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">✓ Information Provided</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    {completedFields.map(field => (
                      <div key={field.key} className="flex items-center gap-2 text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">{field.label}:</span>
                        <span>{field.key === 'emergency_contacts' ? `${formData.emergency_contacts.length} contact(s)` : field.value}</span>
                      </div>
                    ))}
                    {formData.medical_conditions.length > 0 && (
                      <div className="flex items-center gap-2 text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Medical Conditions:</span>
                        <span>{formData.medical_conditions.length} condition(s)</span>
                      </div>
                    )}
                    {formData.allergies.length > 0 && (
                      <div className="flex items-center gap-2 text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Allergies:</span>
                        <span>{formData.allergies.length} allergy(ies)</span>
                      </div>
                    )}
                    {formData.medications.length > 0 && (
                      <div className="flex items-center gap-2 text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">Medications:</span>
                        <span>{formData.medications.length} medication(s)</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Missing Information */}
              {missingFields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-amber-600">⚠ Still Needed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-2">
                      {missingFields.map(field => (
                        <div key={field.key} className="flex items-center gap-2 text-amber-700">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span>{field.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-600 mt-3">
                      You can complete these fields in your dashboard after setup.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
                <Badge variant="outline">
                  Step {currentStep} of {totalSteps}
                </Badge>
              </div>
              <Progress value={progress} className="w-full" />
            </CardHeader>
            
            <CardContent className="space-y-6">
              {renderStep()}
              
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep < totalSteps ? (
                  <Button
                    onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? 'Saving...' : 'Complete Setup'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WelcomeQuestionnaire;