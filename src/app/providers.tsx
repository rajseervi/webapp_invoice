'use client';

import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { TemplateProvider } from '../contexts/TemplateContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TemplateProvider>
        {children}
      </TemplateProvider>
    </AuthProvider>
  );
}