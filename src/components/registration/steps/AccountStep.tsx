import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const passwordCheck = data.password ? validatePasswordStrength(data.password) : null;

  const passwordRules = [
    { label: t('registration.account.password8chars'), met: data.password.length >= 8 },
    { label: t('registration.account.passwordUppercase'), met: /[A-Z]/.test(data.password) },
    { label: t('registration.account.passwordLowercase'), met: /[a-z]/.test(data.password) },
    { label: t('registration.account.passwordNumber'), met: /[0-9]/.test(data.password) },
    { label: t('registration.account.passwordSpecial'), met: /[!@#$%^&*(),.?":{}|<>]/.test(data.password) },
  ];

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
          <User className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-poppins font-bold text-foreground">{t('registration.account.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('registration.account.subtitle')}</p>
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
            <Label htmlFor="firstName">{t('registration.account.firstName')}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="firstName"
                value={data.firstName}
                onChange={(e) => onChange('firstName', e.target.value)}
                placeholder={t('registration.account.firstNamePlaceholder')}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t('registration.account.lastName')}</Label>
            <Input
              id="lastName"
              value={data.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              placeholder={t('registration.account.lastNamePlaceholder')}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">{t('registration.account.emailAddress')}</Label>
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
            <p className="text-xs text-destructive">{t('registration.account.invalidEmail')}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">{t('registration.account.password')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={data.password}
              onChange={(e) => onChange('password', e.target.value)}
              placeholder={t('registration.account.passwordPlaceholder')}
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
            {t('registration.account.agreeToThe')}{' '}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-primary hover:underline font-medium"
            >
              {t('registration.account.termsOfService')}
            </button>{' '}
            {t('registration.account.and')}{' '}
            <button
              type="button"
              onClick={() => setShowPrivacy(true)}
              className="text-primary hover:underline font-medium"
            >
              {t('registration.account.privacyPolicy')}
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
