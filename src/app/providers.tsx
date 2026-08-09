'use client';

import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { TemplateProvider } from '../contexts/TemplateContext';
import { SpeedDialProvider } from '../contexts/SpeedDialContext';
import { FirebaseQueryProvider } from '../lib/FirebaseQueryProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseQueryProvider>
      <SpeedDialProvider>
        <AuthProvider>
          <TemplateProvider>
            {children}
          </TemplateProvider>
        </AuthProvider>
      </SpeedDialProvider>
    </FirebaseQueryProvider>
  );
}
