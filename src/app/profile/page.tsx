'use client';
import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Avatar, Box, Button, Divider } from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { Person as PersonIcon, Lock as LockIcon, Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function ProfilePage() {
  const { currentUser, userRole } = useAuth();
  const [userData, setUserData] = useState({
    name: 'User',
    email: '',
    role: ''
  });

  useEffect(() => {
    if (currentUser) {
      setUserData({
        name: currentUser.displayName || 'User',
        email: currentUser.email || '',
        role: userRole || 'User'
      });
    }
  }, [currentUser, userRole]);

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ width: 100, height: 100, mb: 3 }}>
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" style={{ width: '100%', height: '100%' }} />
            ) : (
              <PersonIcon sx={{ fontSize: 60 }} />
            )}
          </Avatar>
          <Typography variant="h4" gutterBottom>
            {userData.name}
          </Typography>
          <Box sx={{ width: '100%', mt: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Email:</strong> {userData.email}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Role:</strong> {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Account Status:</strong> Active
            </Typography>
          </Box>

          <Divider sx={{ width: '100%', my: 3 }} />
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              component={Link}
              href="/change-password"
              variant="contained"
              color="primary"
              startIcon={<LockIcon />}
            >
              Change Password
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
            >
              Edit Profile
            </Button>
          </Box>
        </Paper>
      </Container>
    </DashboardLayout>
  );
}