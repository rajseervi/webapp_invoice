import React from 'react';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import StockDashboard from '@/components/StockManagement/StockDashboard';

export default function OriginalPageComponent() {
  return (
    <ImprovedDashboardLayout>
      <StockDashboard />
    </ImprovedDashboardLayout>
  );
}