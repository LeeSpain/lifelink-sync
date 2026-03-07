import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Edit, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MedicalInfoCardProps {
  profile: any;
  onProfileUpdate: () => void;
}

const MedicalInfoCard = ({ profile, onProfileUpdate }: MedicalInfoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [bloodType, setBloodType] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setMedicalConditions(profile.medical_conditions || []);
      setAllergies(profile.allergies || []);
      setMedications(profile.medications || []);
      setBloodType(profile.blood_type || "");
    }
  }, [profile]);

  const updateMedicalInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          medical_conditions: medicalConditions,
          allergies: allergies,
          medications: medications,
          blood_type: bloodType
        })
        .eq('user_id', user.id);

      if (error) throw error;

      onProfileUpdate();
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Medical information updated successfully."
      });
    } catch (error) {
      console.error('Error updating medical info:', error);
      toast({
        title: "Error",
        description: "Failed to update medical information.",
        variant: "destructive"
      });
    }
  };

  const addItem = (type: 'condition' | 'allergy' | 'medication', value: string) => {
    if (!value.trim()) return;
    
    switch (type) {
      case 'condition':
        setMedicalConditions([...medicalConditions, value]);
        setNewCondition("");
        break;
      case 'allergy':
        setAllergies([...allergies, value]);
        setNewAllergy("");
        break;
      case 'medication':
        setMedications([...medications, value]);
        setNewMedication("");
        break;
    }
  };

  const removeItem = (type: 'condition' | 'allergy' | 'medication', index: number) => {
    switch (type) {
      case 'condition':
        setMedicalConditions(medicalConditions.filter((_, i) => i !== index));
        break;
      case 'allergy':
        setAllergies(allergies.filter((_, i) => i !== index));
        break;
      case 'medication':
        setMedications(medications.filter((_, i) => i !== index));
        break;
    }
  };

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <Card className="bg-white/95 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Medical Information
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isEditing) {
                updateMedicalInfo();
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? 'Save' : 'Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Blood Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Blood Type</label>
            {isEditing ? (
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select blood type</option>
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            ) : (
              <p className="text-muted-foreground">{bloodType || "Not specified"}</p>
            )}
          </div>

          {/* Medical Conditions */}
          <div>
            <label className="block text-sm font-medium mb-2">Medical Conditions</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {medicalConditions.map((condition, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {condition}
                  {isEditing && (
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeItem('condition', index)}
                    />
                  )}
                </Badge>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  placeholder="Add medical condition"
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addItem('condition', newCondition);
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => addItem('condition', newCondition)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium mb-2">Allergies</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {allergies.map((allergy, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1 bg-red-50">
                  {allergy}
                  {isEditing && (
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeItem('allergy', index)}
                    />
                  )}
                </Badge>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add allergy"
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addItem('allergy', newAllergy);
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => addItem('allergy', newAllergy)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Medications */}
          <div>
            <label className="block text-sm font-medium mb-2">Current Medications</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {medications.map((medication, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1 bg-blue-50">
                  {medication}
                  {isEditing && (
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeItem('medication', index)}
                    />
                  )}
                </Badge>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  placeholder="Add medication"
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addItem('medication', newMedication);
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => addItem('medication', newMedication)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicalInfoCard;