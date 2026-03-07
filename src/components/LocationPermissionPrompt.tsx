import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useLocationServices } from '@/hooks/useLocationServices';

export const LocationPermissionPrompt = () => {
  const { permissionState, requestLocationPermission } = useLocationServices();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    await requestLocationPermission();
    setIsRequesting(false);
  };

  const getStatusBadge = () => {
    if (permissionState.granted) {
      return (
        <Badge variant="default" className="bg-success/10 text-success border-success/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Location Access Granted
        </Badge>
      );
    }
    
    if (permissionState.denied) {
      return (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
          <XCircle className="h-3 w-3 mr-1" />
          Location Access Denied
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Location Permission Required
      </Badge>
    );
  };

  if (permissionState.granted) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-guardian">Location Services Active</p>
              <p className="text-xs text-gray-600">GPS location sharing enabled</p>
            </div>
          </div>
          <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-3 bg-gray-50 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
              <Shield className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-guardian">Location Access Required</p>
              <p className="text-xs text-gray-600">Enable GPS for emergency alerts</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
        
        {!permissionState.denied && (
          <Button 
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="w-full"
            size="sm"
          >
            {isRequesting ? 'Requesting Permission...' : 'Enable Location Access'}
          </Button>
        )}
        
        {permissionState.denied && (
          <div className="space-y-2">
            <p className="text-sm text-destructive">
              Location access was denied. To enable:
            </p>
            <ul className="text-xs text-gray-600 space-y-1 ml-4">
              <li>• Click the location icon in your browser's address bar</li>
              <li>• Select "Allow" for location access</li>
              <li>• Refresh this page</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};