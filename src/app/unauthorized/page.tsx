"use client"
import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import { LockOutlined } from '@mui/icons-material';

export default function Unauthorized() {
  const router = useRouter();

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Box 
          sx={{ 
            bgcolor: 'error.main', 
            color: 'white', 
            borderRadius: '50%', 
            p: 2,
            mb: 2
          }}
        >
          <LockOutlined fontSize="large" />
        </Box>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Access Denied
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 4 }}>
          You do not have permission to access this page. Please contact your administrator if you believe this is an error.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}