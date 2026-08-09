"use client";
import React from 'react';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import StockValidationTest from '@/components/testing/StockValidationTest';

export default function StockValidationTestPage() {
  return (
    <ImprovedDashboardLayout>
      <StockValidationTest />
    </ImprovedDashboardLayout>
  );
}