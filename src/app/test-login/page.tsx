"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from '@mui/material';

export default function TestLoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('user-1');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');

  const handleLogin = () => {
    try {
      // Store user data in localStorage
      const userData = {
        uid: userId,
        email: `${userId}@example.com`,
        displayName: `User ${userId.split('-')[1]}`
      };
      
      localStorage.setItem('authUser', JSON.stringify(userData));
      localStorage.setItem('userRole', role);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to log in. Please try again.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Test Login
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="user-id-label">User ID</InputLabel>
                <Select
                  labelId="user-id-label"
                  value={userId}
                  label="User ID"
                  onChange={(e) => setUserId(e.target.value)}
                >
                  <MenuItem value="user-1">User 1</MenuItem>
                  <MenuItem value="user-2">User 2</MenuItem>
                  <MenuItem value="manager-1">Manager 1</MenuItem>
                  <MenuItem value="admin-1">Admin 1</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  value={role}
                  label="Role"
                  onChange={(e) => setRole(e.target.value)}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {error && (
              <Grid item xs={12}>
                <FormHelperText error>{error}</FormHelperText>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleLogin}
                sx={{ mt: 2 }}
              >
                Login
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
}