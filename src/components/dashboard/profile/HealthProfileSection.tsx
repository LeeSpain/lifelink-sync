import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Heart, 
  Plus, 
  Edit, 
  X, 
  Check, 
  AlertTriangle,
  Pill,
  Activity,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

interface HealthData {
  blood_type: string;
  allergies: string[];
  medications: string[];
  medical_conditions: string[];
  emergency_medical_info: string;
  insurance_provider: string;
  insurance_policy: string;
  doctor_name: string;
  doctor_phone: string;
}

interface HealthProfileSectionProps {
  profile: any;
  onProfileUpdate: () => void;
}

const HealthProfileSection = ({ profile, onProfileUpdate }: HealthProfileSectionProps) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [activeSection, setActiveSection] = useState<'allergies' | 'medications' | 'conditions'>('allergies');
  
  const [healthData, setHealthData] = useState<HealthData>({
    blood_type: profile?.blood_type || '',
    allergies: profile?.allergies || [],
    medications: profile?.medications || [],
    medical_conditions: profile?.medical_conditions || [],
    emergency_medical_info: profile?.emergency_medical_info || '',
    insurance_provider: profile?.insurance_provider || '',
    insurance_policy: profile?.insurance_policy || '',
    doctor_name: profile?.doctor_name || '',
    doctor_phone: profile?.doctor_phone || ''
  });

  const { toast } = useToast();

  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...healthData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      onProfileUpdate();
      setIsModalOpen(false);
      toast({
        title: t('profileSection.success'),
        description: t('profileSection.healthProfileUpdated')
      });
    } catch (error) {
      console.error('Error updating health profile:', error);
      toast({
        title: t('profileSection.error'),
        description: t('profileSection.failedToUpdateHealthProfile'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = (type: 'allergies' | 'medications' | 'medical_conditions') => {
    if (!newItem.trim()) return;
    
    setHealthData(prev => ({
      ...prev,
      [type]: [...prev[type], newItem.trim()]
    }));
    setNewItem('');
  };

  const removeItem = (type: 'allergies' | 'medications' | 'medical_conditions', index: number) => {
    setHealthData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const getCompletionPercentage = () => {
    const fields = [
      healthData.blood_type,
      healthData.allergies.length > 0,
      healthData.medications.length > 0,
      healthData.medical_conditions.length > 0,
      healthData.doctor_name,
      healthData.doctor_phone,
      healthData.insurance_provider
    ].filter(Boolean);
    return Math.round((fields.length / 7) * 100);
  };

  const completionPercentage = getCompletionPercentage();
  const totalItems = healthData.allergies.length + healthData.medications.length + healthData.medical_conditions.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-lg">{t('profileSection.medicalProfile')}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">{t('profileSection.percentComplete', { percent: completionPercentage })}</span>
              </div>
            </div>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                {t('profileSection.edit')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  {t('profileSection.editMedicalProfile')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Basic Medical Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="blood_type">{t('profileSection.bloodType')}</Label>
                    <Select value={healthData.blood_type} onValueChange={(value) => setHealthData({ ...healthData, blood_type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('profileSection.selectBloodType')} />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_medical_info">{t('profileSection.emergencyMedicalNotes')}</Label>
                    <Textarea
                      id="emergency_medical_info"
                      value={healthData.emergency_medical_info}
                      onChange={(e) => setHealthData({ ...healthData, emergency_medical_info: e.target.value })}
                      placeholder={t('profileSection.criticalMedicalInfoPlaceholder')}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {t('profileSection.doctorInformation')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="doctor_name">{t('profileSection.doctorName')}</Label>
                      <Input
                        id="doctor_name"
                        value={healthData.doctor_name}
                        onChange={(e) => setHealthData({ ...healthData, doctor_name: e.target.value })}
                        placeholder="Dr. John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doctor_phone">{t('profileSection.doctorPhone')}</Label>
                      <Input
                        id="doctor_phone"
                        type="tel"
                        value={healthData.doctor_phone}
                        onChange={(e) => setHealthData({ ...healthData, doctor_phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                </div>

                {/* Insurance Information */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t('profileSection.insuranceInformation')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="insurance_provider">{t('profileSection.insuranceProvider')}</Label>
                      <Input
                        id="insurance_provider"
                        value={healthData.insurance_provider}
                        onChange={(e) => setHealthData({ ...healthData, insurance_provider: e.target.value })}
                        placeholder="Blue Cross Blue Shield"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insurance_policy">{t('profileSection.policyNumber')}</Label>
                      <Input
                        id="insurance_policy"
                        value={healthData.insurance_policy}
                        onChange={(e) => setHealthData({ ...healthData, insurance_policy: e.target.value })}
                        placeholder={t('profileSection.policyMemberIdPlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Items */}
                <div className="space-y-4">
                  <div className="flex gap-1 p-1 bg-muted rounded-lg">
                    {(['allergies', 'medications', 'conditions'] as const).map((section) => (
                      <button
                        key={section}
                        onClick={() => setActiveSection(section)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                          activeSection === section
                            ? 'bg-white shadow-sm text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {section === 'allergies' ? t('profileSection.allergies') : section === 'medications' ? t('profileSection.medications') : t('profileSection.medicalConditions')}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder={activeSection === 'allergies' ? t('profileSection.addAllergy') : activeSection === 'medications' ? t('profileSection.addMedication') : t('profileSection.addCondition')}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addItem(activeSection === 'conditions' ? 'medical_conditions' : activeSection);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => addItem(activeSection === 'conditions' ? 'medical_conditions' : activeSection)}
                        disabled={!newItem.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(activeSection === 'conditions' ? healthData.medical_conditions : healthData[activeSection]).map((item, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {item}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-500"
                            onClick={() => removeItem(activeSection === 'conditions' ? 'medical_conditions' : activeSection, index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  {t('profileSection.cancel')}
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  <Check className="h-4 w-4 mr-2" />
                  {isLoading ? t('profileSection.saving') : t('profileSection.saveChanges')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Quick Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">{t('profileSection.bloodType')}</Label>
              <p className="font-medium">
                {healthData.blood_type || (
                  <span className="text-muted-foreground">{t('profileSection.notSet')}</span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">{t('profileSection.totalItems')}</Label>
              <p className="font-medium">{t('profileSection.itemsCount', { count: totalItems })}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">{t('profileSection.doctor')}</Label>
              <p className="font-medium">
                {healthData.doctor_name || (
                  <span className="text-muted-foreground">{t('profileSection.notSet')}</span>
                )}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium text-muted-foreground">{t('profileSection.insurance')}</Label>
              <p className="font-medium">
                {healthData.insurance_provider || (
                  <span className="text-muted-foreground">{t('profileSection.notSet')}</span>
                )}
              </p>
            </div>
          </div>

          {/* Medical Items */}
          {totalItems > 0 ? (
            <div className="space-y-4">
              {healthData.allergies.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <Label className="font-medium">{t('profileSection.allergies')}</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {healthData.allergies.map((allergy, index) => (
                      <Badge key={index} variant="outline" className="bg-red-50 border-red-200 text-red-700">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {healthData.medications.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="h-4 w-4 text-blue-500" />
                    <Label className="font-medium">{t('profileSection.medications')}</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {healthData.medications.map((medication, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                        {medication}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {healthData.medical_conditions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-orange-500" />
                    <Label className="font-medium">{t('profileSection.medicalConditions')}</Label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {healthData.medical_conditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium mb-2">{t('profileSection.noMedicalInfoYet')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('profileSection.addMedicalInfoDescription')}
              </p>
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('profileSection.addMedicalInfo')}
              </Button>
            </div>
          )}

          {/* Emergency Medical Info */}
          {healthData.emergency_medical_info && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <Label className="font-medium text-red-800">{t('profileSection.emergencyMedicalNotes')}</Label>
              </div>
              <p className="text-sm text-red-700">{healthData.emergency_medical_info}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthProfileSection;