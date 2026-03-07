import React from 'react';
import { MobileStatus } from './MobileStatus';
import { MobileReadinessPanel } from './MobileReadinessPanel';

export function MobileDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <MobileReadinessPanel />
        <MobileStatus />
      </div>
    </div>
  );
}