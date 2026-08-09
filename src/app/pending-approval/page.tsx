"use client"
import React from 'react';
import { Box, Typography, Paper, Button, Container, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; 
import { handleLogout } from '@/utils/authRedirects';
import { HourglassEmpty as HourglassIcon } from '@mui/icons-material';
 
export default function PendingApprovalPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const performLogout = async () => {
    try {
      // Use the utility function for logout
      await handleLogout(logout, router);
    } catch (error) {
      console.error('Error logging out:', error);
      // If the utility function fails, try a direct redirect
      router.push('/login');
    }
  };
 

  
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <HourglassIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          
          <Typography variant="h4" gutterBottom>
            Account Pending Approval
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
            Your account is currently pending approval by an administrator. 
            You will receive an email notification once your account has been approved.
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            If you believe this is an error or have any questions, please contact support.
          </Typography>
          
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
          
            <Button 
              variant="contained" 
              color="primary" 
              onClick={performLogout}
              size="medium"
            >
              Return to Login
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}