"use client"
import React from 'react';
import { Box, Typography, Paper, Button, Container } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext.js';
import { handleLogout } from '@/utils/authRedirects';
import { Block as BlockIcon } from '@mui/icons-material';

export default function AccountInactivePage() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogoutAction = async () => {
    try {
      // Use the utility function for logout
      await handleLogout(logout, router);
    } catch (error) {
      console.error('Error logging out:', error);
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
          <BlockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          
          <Typography variant="h4" gutterBottom>
            Account Inactive
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
            Your account has been deactivated. This could be due to:
          </Typography>
          
          <Box sx={{ textAlign: 'left', mb: 3 }}>
            <Typography component="ul" variant="body2" color="text.secondary">
              <li>Account inactivity for an extended period</li>
              <li>Violation of terms of service</li>
              <li>Administrative action</li>
              <li>Expired subscription</li>
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            If you believe this is an error or would like to reactivate your account, 
            please contact our support team.
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleLogoutAction}
            sx={{ mt: 2 }}
          >
            Return to Login
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}