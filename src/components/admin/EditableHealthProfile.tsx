import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Heart, Plus, X, Save, Edit2 } from 'lucide-react';

interface EditableHealthProfileProps {
  userId: string;
  healthData: {
    blood_type?: string;
    allergies?: string[];
    medications?: string[];
    medical_conditions?: string[];
  };
}

export function EditableHealthProfile({ userId, healthData }: EditableHealthProfileProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [bloodType, setBloodType] = useState(healthData.blood_type || '');
  const [allergies, setAllergies] = useState<string[]>(healthData.allergies || []);
  const [medications, setMedications] = useState<string[]>(healthData.medications || []);
  const [conditions, setConditions] = useState<string[]>(healthData.medical_conditions || []);
  
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newCondition, setNewCondition] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          blood_type: bloodType || null,
          allergies: allergies.length > 0 ? allergies : null,
          medications: medications.length > 0 ? medications : null,
          medical_conditions: conditions.length > 0 ? conditions : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Health profile updated successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating health profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update health profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setBloodType(healthData.blood_type || '');
    setAllergies(healthData.allergies || []);
    setMedications(healthData.medications || []);
    setConditions(healthData.medical_conditions || []);
    setIsEditing(false);
  };

  const addItem = (type: 'allergy' | 'medication' | 'condition') => {
    if (type === 'allergy' && newAllergy.trim()) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    } else if (type === 'medication' && newMedication.trim()) {
      setMedications([...medications, newMedication.trim()]);
      setNewMedication('');
    } else if (type === 'condition' && newCondition.trim()) {
      setConditions([...conditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeItem = (type: 'allergy' | 'medication' | 'condition', index: number) => {
    if (type === 'allergy') {
      setAllergies(allergies.filter((_, i) => i !== index));
    } else if (type === 'medication') {
      setMedications(medications.filter((_, i) => i !== index));
    } else if (type === 'condition') {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Health Profile
            </CardTitle>
            <CardDescription>Manage medical information and allergies</CardDescription>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} size="sm" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Blood Type */}
        <div className="space-y-2">
          <Label>Blood Type</Label>
          {isEditing ? (
            <Input
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              placeholder="e.g., A+, O-, AB+"
              disabled={isSaving}
            />
          ) : (
            <p className="text-sm">{bloodType || 'Not specified'}</p>
          )}
        </div>

        {/* Allergies */}
        <div className="space-y-2">
          <Label>Allergies</Label>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add allergy..."
                onKeyPress={(e) => e.key === 'Enter' && addItem('allergy')}
                disabled={isSaving}
              />
              <Button
                size="icon"
                onClick={() => addItem('allergy')}
                disabled={!newAllergy.trim() || isSaving}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {allergies.length > 0 ? (
              allergies.map((allergy, index) => (
                <Badge key={index} variant="destructive">
                  {allergy}
                  {isEditing && (
                    <button
                      onClick={() => removeItem('allergy', index)}
                      className="ml-2 hover:bg-destructive-foreground/20 rounded-full"
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No allergies recorded</p>
            )}
          </div>
        </div>

        {/* Medications */}
        <div className="space-y-2">
          <Label>Current Medications</Label>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Add medication..."
                onKeyPress={(e) => e.key === 'Enter' && addItem('medication')}
                disabled={isSaving}
              />
              <Button
                size="icon"
                onClick={() => addItem('medication')}
                disabled={!newMedication.trim() || isSaving}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {medications.length > 0 ? (
              medications.map((medication, index) => (
                <Badge key={index} variant="secondary">
                  {medication}
                  {isEditing && (
                    <button
                      onClick={() => removeItem('medication', index)}
                      className="ml-2 hover:bg-secondary-foreground/20 rounded-full"
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No medications recorded</p>
            )}
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="space-y-2">
          <Label>Medical Conditions</Label>
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="Add condition..."
                onKeyPress={(e) => e.key === 'Enter' && addItem('condition')}
                disabled={isSaving}
              />
              <Button
                size="icon"
                onClick={() => addItem('condition')}
                disabled={!newCondition.trim() || isSaving}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {conditions.length > 0 ? (
              conditions.map((condition, index) => (
                <Badge key={index} variant="outline">
                  {condition}
                  {isEditing && (
                    <button
                      onClick={() => removeItem('condition', index)}
                      className="ml-2 hover:bg-muted rounded-full"
                      disabled={isSaving}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No conditions recorded</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
