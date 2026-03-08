import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, MapPin, Globe, Calendar } from 'lucide-react';

interface ProfileStepProps {
  data: {
    phone: string;
    city: string;
    country: string;
    dateOfBirth: string;
  };
  onChange: (field: string, value: string) => void;
}

const countries = [
  { value: 'ES', label: 'Spain' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IT', label: 'Italy' },
  { value: 'PT', label: 'Portugal' },
  { value: 'BE', label: 'Belgium' },
  { value: 'IE', label: 'Ireland' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'OTHER', label: 'Other' },
];

const ProfileStep: React.FC<ProfileStepProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
          <MapPin className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-poppins font-bold text-foreground">Your Profile</h2>
        <p className="text-sm text-muted-foreground">Help us personalise your safety experience</p>
      </div>

      <div className="space-y-4">
        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              value={data.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="+34 600 123 456"
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">Include country code for emergency services</p>
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="city"
              value={data.city}
              onChange={(e) => onChange('city', e.target.value)}
              placeholder="Your city"
              className="pl-10"
            />
          </div>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label>Country</Label>
          <Select value={data.country} onValueChange={(v) => onChange('country', v)}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select your country" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth <span className="text-muted-foreground">(optional)</span></Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="dateOfBirth"
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => onChange('dateOfBirth', e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">Helps medical responders provide appropriate care</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileStep;
