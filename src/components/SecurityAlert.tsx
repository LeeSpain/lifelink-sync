import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface SecurityAlertProps {
  type: 'warning' | 'info' | 'error';
  title: string;
  description: string;
  className?: string;
}

const SecurityAlert: React.FC<SecurityAlertProps> = ({ 
  type, 
  title, 
  description, 
  className = '' 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Alert variant={getVariant()} className={className}>
      {getIcon()}
      <AlertDescription>
        <strong>{title}:</strong> {description}
      </AlertDescription>
    </Alert>
  );
};

export default SecurityAlert;