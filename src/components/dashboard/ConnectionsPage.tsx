import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConnectionsManager } from './ConnectionsManager';
import EnhancedEmergencyContactsSection from './profile/EnhancedEmergencyContactsSection';
import { useAuth } from '@/contexts/AuthContext';

export const ConnectionsPage: React.FC = () => {
  const { user } = useAuth();

  const handleProfileUpdate = () => {
    // Trigger any necessary updates
    console.log('Profile updated');
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Emergency Connections</h1>
        <p className="text-muted-foreground">
          Manage your emergency network and family connections
        </p>
      </div>
      
      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">Network Connections</TabsTrigger>
          <TabsTrigger value="emergency-contacts">Emergency Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          <ConnectionsManager />
        </TabsContent>

        <TabsContent value="emergency-contacts">
          <EnhancedEmergencyContactsSection 
            profile={user}
            onProfileUpdate={handleProfileUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};