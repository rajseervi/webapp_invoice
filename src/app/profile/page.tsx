'use client';
import React from 'react';
import { Container, Typography, Paper, Avatar, Box } from '@mui/material';
import DashboardLayout from '../../components/DashboardLayout';
import { Person as PersonIcon } from '@mui/icons-material';

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ width: 100, height: 100, mb: 3 }}>
            <PersonIcon sx={{ fontSize: 60 }} />
          </Avatar>
          <Typography variant="h4" gutterBottom>
            Admin Profile
          </Typography>
          <Box sx={{ width: '100%', mt: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Name:</strong> Admin User
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Email:</strong> admin@example.com
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Role:</strong> Administrator
            </Typography>
          </Box>
        </Paper>
      </Container>
    </DashboardLayout>
  );
}