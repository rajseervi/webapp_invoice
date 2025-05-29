"use client";
import { useEffect, useState } from "react";
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import OptimizedAdminDashboard from '@/app/dashboard/components/OptimizedAdminDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Container, Typography, Box, CircularProgress, Paper, Button } from '@mui/material';

export default function AdminDashboardPage() {
  // Declare all hooks at the top level
  const { userRole, loadingAuth, currentUser } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle authentication and authorization
  useEffect(() => {
    // Only proceed if auth is done loading
    if (!loadingAuth) {
      if (!currentUser) {
        // User is not logged in
        router.push('/login?callbackUrl=/admin/dashboard');
      } else if (userRole !== 'admin') {
        // User is logged in but not an admin
        router.push('/unauthorized');
      } else {
        // User is an admin
        setIsAuthorized(true);
      }
      setIsLoading(false);
    }
  }, [currentUser, userRole, loadingAuth, router]);

  // Always return the same structure
  return (
    <DashboardLayout>
      {isLoading || loadingAuth ? (
        <Container
          maxWidth="lg"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 120px)',
          }}
        >
          <CircularProgress />
        </Container>
      ) : !isAuthorized ? (
        <Container
          maxWidth="lg"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 'calc(100vh - 120px)',
          }}
        >
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>Access Denied</Typography>
            <Typography color="textSecondary">
              You do not have permission to view this page.
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/dashboard')}
              sx={{ mt: 2 }}
            >
              Go to Dashboard
            </Button>
          </Paper>
        </Container>
      ) : (
        <OptimizedAdminDashboard />
      )}
    </DashboardLayout>
  );
}