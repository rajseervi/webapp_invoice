import React from 'react';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import LedgerManagement from '@/components/Ledger/LedgerManagement';

export default function OriginalPageComponent() {
  return (
    <ImprovedDashboardLayout>
      <LedgerManagement />
    </ImprovedDashboardLayout>
  );
}