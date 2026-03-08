import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, User, Eye, EyeOff, Check, X } from 'lucide-react';
import { isValidEmail, validatePasswordStrength } from '@/utils/security';
import { TermsDialog } from '@/components/legal/TermsDialog';
import { PrivacyDialog } from '@/components/legal/PrivacyDialog';

interface WizardData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

interface AccountStepProps {
  data: WizardData;
  onChange: (field: string, value: string | boolean) => void;
  error?: string;
}

const AccountStep: React.FC<AccountStepProps> = ({ data, onChange, error }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const passwordCheck = data.password ? validatePasswordStrength(data.password) : null;

  const passwordRules = [
    { label: '8+ characters', met: data.password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(data.password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(data.password) },
    { label: 'Number', met: /[0-9]/.test(data.password) },
    { label: 'Special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(data.password) },
  ];

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
          <User className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-poppins font-bold text-foreground">Create Your Account</h2>
        <p className="text-sm text-muted-foreground">Your credentials for accessing LifeLink Sync</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="firstName"
                value={data.firstName}
                onChange={(e) => onChange('firstName', e.target.value)}
                placeholder="First name"
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={data.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="you@example.com"
              className="pl-10"
            />
          </div>
          {data.email && !isValidEmail(data.email) && (
            <p className="text-xs text-destructive">Please enter a valid email address</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={data.password}
              onChange={(e) => onChange('password', e.target.value)}
              placeholder="Create a strong password"
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password strength indicators */}
          {data.password && (
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {passwordRules.map(({ label, met }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs">
                  {met ? (
                    <Check className="h-3 w-3 text-wellness" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className={met ? 'text-wellness' : 'text-muted-foreground'}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start space-x-3 pt-2">
          <Checkbox
            id="acceptTerms"
            checked={data.acceptTerms}
            onCheckedChange={(checked) => onChange('acceptTerms', checked as boolean)}
            className="mt-0.5"
          />
          <Label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer">
            I agree to the{' '}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-primary hover:underline font-medium"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => setShowPrivacy(true)}
              className="text-primary hover:underline font-medium"
            >
              Privacy Policy
            </button>
          </Label>
        </div>
      </div>

      <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
      <PrivacyDialog open={showPrivacy} onOpenChange={setShowPrivacy} />
    </div>
  );
};

export default AccountStep;
