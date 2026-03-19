import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, HelpCircle, XCircle } from 'lucide-react';

interface ContactConfidenceBadgeProps {
  confidence: string | null | undefined;
  size?: 'sm' | 'md';
}

const CONFIG: Record<string, { label: string; className: string; Icon: React.ComponentType<any> }> = {
  verified: { label: 'Verified', className: 'bg-green-100 text-green-700 border-green-200', Icon: CheckCircle },
  likely:   { label: 'Likely',   className: 'bg-amber-100 text-amber-700 border-amber-200', Icon: AlertCircle },
  guessed:  { label: 'Guessed',  className: 'bg-gray-100 text-gray-500 border-gray-200',    Icon: HelpCircle },
};

const MISSING = { label: 'No contact', className: 'bg-red-100 text-red-600 border-red-200', Icon: XCircle };

export const ContactConfidenceBadge: React.FC<ContactConfidenceBadgeProps> = ({ confidence, size = 'sm' }) => {
  const hasContact = !!confidence && confidence !== 'unknown';
  const cfg = hasContact ? (CONFIG[confidence!] || CONFIG.guessed) : MISSING;
  const { label, className, Icon } = cfg;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <Badge variant="outline" className={`${className} ${size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5'} flex items-center gap-1`}>
      <Icon className={iconSize} />
      {label}
    </Badge>
  );
};

export const EmailVerificationBadge: React.FC<{ status: string | null | undefined }> = ({ status }) => {
  if (!status) return null;

  const cfg: Record<string, { label: string; className: string }> = {
    valid:   { label: 'Email verified',   className: 'bg-green-100 text-green-700 border-green-200' },
    invalid: { label: 'Email invalid',    className: 'bg-red-100 text-red-600 border-red-200' },
    risky:   { label: 'Email risky',      className: 'bg-amber-100 text-amber-700 border-amber-200' },
    unknown: { label: 'Email unverified', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  };

  const { label, className } = cfg[status] || cfg.unknown;

  return (
    <Badge variant="outline" className={`${className} text-xs px-1.5 py-0`}>
      {label}
    </Badge>
  );
};
