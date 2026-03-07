import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RegionalOrganizationsPage from '@/components/admin/pages/RegionalOrganizationsPage';
import RegionalUsersPage from '@/components/admin/pages/RegionalUsersPage';
import RegionalAuditPage from '@/components/admin/pages/RegionalAuditPage';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Users, Shield } from 'lucide-react';

const RegionalSection = () => {
  return (
    <Routes>
      <Route path="/" element={<RegionalOverview />} />
      <Route path="/organizations" element={<RegionalOrganizationsPage />} />
      <Route path="/users" element={<RegionalUsersPage />} />
      <Route path="/audit" element={<RegionalAuditPage />} />
    </Routes>
  );
};

const RegionalOverview = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Regional Management</h1>
        <p className="text-muted-foreground">
          Manage regional emergency response organizations and operations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Organizations</h3>
                <p className="text-sm text-muted-foreground">
                  Manage regional emergency response centers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Staff Management</h3>
                <p className="text-sm text-muted-foreground">
                  Invite and manage operators and supervisors
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Audit Logs</h3>
                <p className="text-sm text-muted-foreground">
                  Track all regional system activities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegionalSection;