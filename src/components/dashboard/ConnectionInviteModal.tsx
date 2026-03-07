import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Crown, Shield, Mail, Users, Phone, MessageSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useConnectionActions, CreateConnectionData } from '@/hooks/useConnections';

interface ConnectionInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'family_circle' | 'trusted_contact';
}

interface FormData {
  invite_email: string;
  relationship: string;
  escalation_priority: number;
  notify_channels: string[];
  preferred_language: string;
}

export const ConnectionInviteModal: React.FC<ConnectionInviteModalProps> = ({
  open,
  onOpenChange,
  type
}) => {
  const { createConnection } = useConnectionActions();
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      escalation_priority: 3,
      notify_channels: ['app'],
      preferred_language: 'en'
    }
  });

  const notifyChannels = watch('notify_channels');

  const handleChannelChange = (channel: string, checked: boolean) => {
    const current = notifyChannels || [];
    if (checked) {
      setValue('notify_channels', [...current, channel]);
    } else {
      setValue('notify_channels', current.filter(c => c !== channel));
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createConnection.mutateAsync({
        type,
        ...data
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create connection:', error);
    }
  };

  const getIcon = () => {
    return type === 'family_circle' ? (
      <Crown className="h-5 w-5 text-primary" />
    ) : (
      <Shield className="h-5 w-5 text-secondary" />
    );
  };

  const getTitle = () => {
    return type === 'family_circle' ? t('connections.inviteFamilyTitle') : t('connections.addTrustedTitle');
  };

  const getDescription = () => {
    return type === 'family_circle'
      ? t('connections.familyInviteDesc')
      : t('connections.trustedInviteDesc');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('connections.emailAddress')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={t('connections.enterEmail')}
                className="pl-10"
                {...register('invite_email', {
                  required: t('connections.emailRequired'),
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: t('connections.invalidEmail')
                  }
                })}
              />
            </div>
            {errors.invite_email && (
              <p className="text-sm text-destructive">{errors.invite_email.message}</p>
            )}
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <Label htmlFor="relationship">{t('connections.relationship')}</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="relationship"
                placeholder={t('connections.relationshipPlaceholder')}
                className="pl-10"
                {...register('relationship')}
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>{t('connections.contactPriority')}</Label>
            <Select onValueChange={(value) => setValue('escalation_priority', parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder={t('connections.selectPriority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('connections.primaryPriority')}</SelectItem>
                <SelectItem value="2">{t('connections.secondaryPriority')}</SelectItem>
                <SelectItem value="3">{t('connections.tertiaryPriority')}</SelectItem>
                <SelectItem value="4">{t('connections.lowPriority')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notification Channels */}
          <div className="space-y-2">
            <Label>{t('connections.notificationMethods')}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="app"
                  checked={notifyChannels?.includes('app')}
                  onCheckedChange={(checked) => handleChannelChange('app', checked as boolean)}
                />
                <Label htmlFor="app" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('connections.appNotifications')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms"
                  checked={notifyChannels?.includes('sms')}
                  onCheckedChange={(checked) => handleChannelChange('sms', checked as boolean)}
                />
                <Label htmlFor="sms" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('connections.sms')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={notifyChannels?.includes('email')}
                  onCheckedChange={(checked) => handleChannelChange('email', checked as boolean)}
                />
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('connections.email')}
                </Label>
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label>{t('connections.preferredLanguage')}</Label>
            <Select onValueChange={(value) => setValue('preferred_language', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('connections.selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('connections.english')}</SelectItem>
                <SelectItem value="es">{t('connections.spanish')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('connections.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('connections.sending') : t('connections.sendInvitation')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};