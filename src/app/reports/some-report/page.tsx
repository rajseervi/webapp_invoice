'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // Or useCurrentUser
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { CircularProgress, Box, Alert } from '@mui/material';

export default function SomeReportPage() {
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
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  // --- Render actual page content for authorized users ---
  return (
    <DashboardLayout>
      <h1>Some Report Content</h1>
      {/* ... rest of your report page component */}
    </DashboardLayout>
  );
}