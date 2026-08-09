'use client';

import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // Or useCurrentUser
import { Container, CircularProgress, Box, Alert } from '@mui/material';

function SomeReportPage() {
  const router = useRouter();
  const { userRole, loadingAuth } = useAuth(); // Assuming useAuth provides role and loading state

  useEffect(() => {
    if (!loadingAuth) {
      if (!userRole || !['admin', 'manager'].includes(userRole)) {
        router.push('/unauthorized'); // Or '/login' if not authenticated at all
      }
    }
  }, [userRole, loadingAuth, router]);

  if (loadingAuth || !userRole || !['admin', 'manager'].includes(userRole)) {
    // Show loading or a minimal component while checking/redirecting
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // --- Render actual page content for authorized users ---
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <h1>Some Report Content</h1>
      {/* ... rest of your report page component */}
    </Container>
  );
}

export default function ModernPagePage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Page"
        pageType="reports"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <SomeReportPage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}