import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Phone, Calendar, MapPin, Globe, Edit, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PersonalInfo {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  address: string;
  country: string;
  language_preference: string;
}

interface PersonalInformationSectionProps {
  profile: any;
  onProfileUpdate: () => void;
}

const PersonalInformationSection = ({ profile, onProfileUpdate }: PersonalInformationSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<PersonalInfo>({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    date_of_birth: profile?.date_of_birth || '',
    address: profile?.address || '',
    country: profile?.country || '',
    language_preference: profile?.language_preference || 'en'
  });

  const { toast } = useToast();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' }
  ];

  const handleInputChange = (field: keyof PersonalInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...formData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      onProfileUpdate();
      setIsModalOpen(false);
      toast({
        title: "Success",
        description: "Personal information updated successfully."
      });
    } catch (error) {
      console.error('Error updating personal info:', error);
      toast({
        title: "Error",
        description: "Failed to update personal information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    const fields = Object.values(formData).filter(Boolean);
    return Math.round((fields.length / Object.keys(formData).length) * 100);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">{completionPercentage}% complete</span>
              </div>
            </div>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Edit Personal Information
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date of Birth
                    </Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your address"
                    rows={2}
                  />
                </div>

                {/* Country and Language */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="Enter your country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language_preference" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Preferred Language
                    </Label>
                    <Select value={formData.language_preference} onValueChange={(value) => handleInputChange('language_preference', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  <Check className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
            <p className="font-medium">
              {formData.first_name && formData.last_name 
                ? `${formData.first_name} ${formData.last_name}`
                : 'Not provided'
              }
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <p className="font-medium">{formData.phone || 'Not provided'}</p>
          </div>

          {/* Date of Birth */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date of Birth
            </Label>
            <p className="font-medium">
              {formData.date_of_birth 
                ? new Date(formData.date_of_birth).toLocaleDateString()
                : 'Not provided'
              }
            </p>
          </div>

          {/* Country */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-muted-foreground">Country</Label>
            <p className="font-medium">{formData.country || 'Not provided'}</p>
          </div>

          {/* Address */}
          <div className="space-y-1 md:col-span-2">
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            <p className="font-medium">{formData.address || 'Not provided'}</p>
          </div>

          {/* Language */}
          <div className="space-y-1">
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Language
            </Label>
            <Badge variant="outline">
              {languages.find(lang => lang.code === formData.language_preference)?.name || 'English'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInformationSection;