import React from 'react';
import { Phone, Heart, Users } from 'lucide-react';
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts';
import { Badge } from '@/components/ui/badge';

export const FamilyContactsList: React.FC = () => {
  const { contacts, loading } = useEmergencyContacts();

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-4 space-y-2">
        <Users className="h-8 w-8 text-gray-400 mx-auto" />
        <p className="text-sm text-gray-500">No emergency contacts configured</p>
        <p className="text-xs text-gray-400">Set up contacts in your dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Heart className="h-4 w-4 text-red-500 animate-pulse" />
        <span className="text-sm font-medium text-gray-700">Emergency Contacts</span>
        <Badge variant="secondary" className="text-xs">
          {contacts.length}
        </Badge>
      </div>
      
      <div className="grid gap-2">
        {contacts.slice(0, 3).map((contact, index) => (
          <div 
            key={contact.id || index}
            className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100 hover:from-red-100 hover:to-orange-100 transition-all duration-200"
          >
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <Phone className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate">
                  {contact.name}
                </span>
                {index === 0 && (
                  <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
                    Primary
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600 truncate">
                {contact.relationship} • {contact.phone}
              </p>
            </div>
          </div>
        ))}
        
        {contacts.length > 3 && (
          <div className="text-center py-2">
            <span className="text-xs text-gray-500">
              +{contacts.length - 3} more contacts
            </span>
          </div>
        )}
      </div>
    </div>
  );
};