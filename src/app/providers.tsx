'use client';

import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { TemplateProvider } from '../contexts/TemplateContext';
import { DashboardDataProvider } from './dashboard/hooks/dashboardData';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TemplateProvider>
        <DashboardDataProvider>
          {children}
        </DashboardDataProvider>
      </TemplateProvider>
    </AuthProvider>
  );
}