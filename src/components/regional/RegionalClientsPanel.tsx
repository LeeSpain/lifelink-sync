import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MapPin, Clock, AlertTriangle } from 'lucide-react';

interface RegionalClientsPanelProps {
  clients: any[];
  selectedClient: any;
  onSelectClient: (client: any) => void;
  organizationId?: string;
}

export const RegionalClientsPanel: React.FC<RegionalClientsPanelProps> = ({
  clients,
  selectedClient,
  onSelectClient,
  organizationId
}) => {
  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No regional clients found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Clients with regional subscriptions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {clients.map((client) => {
        const isSelected = selectedClient?.user_id === client.user_id;
        const hasActiveEmergency = false; // TODO: Check for active emergencies
        
        return (
          <Card 
            key={client.user_id} 
            className={`cursor-pointer transition-colors ${
              isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectClient(client)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={client.avatar_url} />
                    <AvatarFallback>
                      {client.first_name?.[0]}{client.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h4 className="font-medium">
                      {client.first_name} {client.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {client.phone || 'No phone number'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {hasActiveEmergency && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      EMERGENCY
                    </Badge>
                  )}
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Online
                  </div>
                </div>
              </div>

              {client.last_known_location && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    Last location: {new Date(client.last_seen).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};