"use client";
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import PermissionGuard from '@/components/PermissionGuard';

// Lazy load dashboard components for better performance
const OptimizedAdminDashboard = lazy(() => import('@/components/Dashboard/OptimizedAdminDashboard'));
const ManagerDashboard = lazy(() => import('@/components/Dashboard/ManagerDashboard'));
const UserDashboard = lazy(() => import('@/components/Dashboard/UserDashboard'));

export default function Dashboard() {
  const { currentUser, userRole, userStatus, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setLoading(true);
        
        // Verify authentication status with retry logic
        let authData;
        let retries = 3;
        
        while (retries > 0) {
          try {
            const authResponse = await fetch('/api/auth/verify', {
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
              }
            });
            
            // Check if the response is JSON
            const contentType = authResponse.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
              authData = await authResponse.json();
              break; // Successfully got JSON data, exit the retry loop
            } else {
              // Wait a moment before retrying
              await new Promise(resolve => setTimeout(resolve, 500));
              retries--;
              
              if (retries === 0) {
                // Handle non-JSON response after all retries
                console.error('Received non-JSON response from auth verify endpoint');
                try {
                  const text = await authResponse.text();
                  console.error('Response text:', text.substring(0, 200) + '...');
                  console.error('Status code:', authResponse.status);
                  console.error('Content-Type:', contentType);
                } catch (textError) {
                  console.error('Error reading response text:', textError);
                }
                
                setError('Authentication service unavailable. Please try refreshing the page or clearing your browser cookies.');
                setLoading(false);
                return;
              }
            }
          } catch (fetchError) {
            console.error('Error fetching auth status:', fetchError);
            retries--;
            
            if (retries === 0) {
              setError('Failed to connect to authentication service. Please check your internet connection and try again.');
              setLoading(false);
              return;
            }
            
            // Wait a moment before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Check authentication result
        if (!authData || !authData.authenticated) {
          console.error('User is not authenticated:', authData?.message || 'No authentication data');
          router.push('/login?callbackUrl=' + encodeURIComponent('/dashboard'));
          return;
        }
        
        // Check if user status is pending
        if (userStatus === 'pending') {
          router.push('/pending-approval');
          return;
        }
        
        // Check if user status is inactive
        if (userStatus === 'inactive') {
          router.push('/account-inactive');
          return;
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error verifying authentication:', err);
        setError('Failed to verify authentication. Please check your internet connection and try again.');
        setLoading(false);
      }
    };
    
    verifyAuth();
  }, [router, userStatus]);
  
  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: 'calc(100vh - 88px)',
          gap: 2
        }}>
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            Loading dashboard...
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: 'calc(100vh - 88px)',
          gap: 2,
          p: 3
        }}>
          <Typography variant="h6" color="error" align="center" gutterBottom>
            {error}
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 600, mb: 2 }}>
            This could be due to a temporary server issue or an expired session.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button 
              variant="contained" 
              onClick={() => {
                // Clear any session data and redirect to login
                fetch('/api/auth/logout', { method: 'POST' })
                  .then(() => router.push('/login'))
                  .catch(() => router.push('/login'));
              }}
            >
              Return to Login
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 4 }}>
            If this problem persists, please clear your browser cookies or contact support.
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }
  
  // Render the appropriate dashboard based on user role with permission guards
  return (
    <DashboardLayout>
      <Suspense fallback={
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: 'calc(100vh - 88px)',
          gap: 2
        }}>
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            Loading dashboard components...
          </Typography>
        </Box>
      }>
        {userRole === 'admin' && (
          <PermissionGuard pageId="admin">
            <OptimizedAdminDashboard />
          </PermissionGuard>
        )}
        
        {userRole === 'manager' && (
          <PermissionGuard pageId="dashboard">
            <ManagerDashboard />
          </PermissionGuard>
        )}
        
        {(userRole === 'staff' || userRole === 'user') && (
          <PermissionGuard pageId="dashboard">
            <UserDashboard />
          </PermissionGuard>
        )}
      </Suspense>
    </DashboardLayout>
  );
}
