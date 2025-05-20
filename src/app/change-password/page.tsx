"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Snackbar,
  IconButton,
  InputAdornment,
  LinearProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext.js';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export default function ChangePassword() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Calculate password strength if the new password field is being updated
    if (name === 'newPassword') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(0);
      setPasswordFeedback('');
      return;
    }

    let strength = 0;
    let feedback = '';

    // Length check
    if (password.length >= 8) {
      strength += 25;
    } else {
      feedback = 'Password should be at least 8 characters long';
      setPasswordStrength(strength);
      setPasswordFeedback(feedback);
      return;
    }

    // Contains lowercase letters
    if (/[a-z]/.test(password)) {
      strength += 25;
    } else {
      feedback = 'Add lowercase letters to strengthen your password';
      setPasswordStrength(strength);
      setPasswordFeedback(feedback);
      return;
    }

    // Contains uppercase letters
    if (/[A-Z]/.test(password)) {
      strength += 25;
    } else {
      feedback = 'Add uppercase letters to strengthen your password';
      setPasswordStrength(strength);
      setPasswordFeedback(feedback);
      return;
    }

    // Contains numbers or special characters
    if (/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      strength += 25;
    } else {
      feedback = 'Add numbers or special characters to strengthen your password';
      setPasswordStrength(strength);
      setPasswordFeedback(feedback);
      return;
    }

    // Set feedback based on overall strength
    if (strength <= 25) {
      feedback = 'Weak password';
    } else if (strength <= 50) {
      feedback = 'Fair password';
    } else if (strength <= 75) {
      feedback = 'Good password';
    } else {
      feedback = 'Strong password';
    }

    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'error';
    if (passwordStrength <= 50) return 'warning';
    if (passwordStrength <= 75) return 'info';
    return 'success';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validate form
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (passwordStrength < 75) {
      setError('Please choose a stronger password');
      return;
    }

    setLoading(true);

    try {
      if (!currentUser || !currentUser.email) {
        throw new Error('User not authenticated');
      }

      // Reauthenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        formData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, formData.newPassword);
      
      // Show success message
      setSuccessMessage('Password updated successfully!');
      setShowSuccessMessage(true);
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Redirect to profile page after a delay
      setTimeout(() => {
        router.push('/profile');
      }, 3000);
    } catch (err: any) {
      // Handle errors
      if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else if (err.code === 'auth/weak-password') {
        setError('New password is too weak');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('This operation requires recent authentication. Please log in again before retrying.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError('An error occurred. Please try again later.');
        console.error('Change password error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Redirecting to login...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography component="h1" variant="h5" sx={{ mt: 2 }}>
              Change Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Update your password to keep your account secure.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              name="currentPassword"
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                      aria-label={showCurrentPassword ? 'hide password' : 'show password'}
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                      aria-label={showNewPassword ? 'hide password' : 'show password'}
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {formData.newPassword && (
              <Box sx={{ mt: 1, mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={passwordStrength} 
                  color={getPasswordStrengthColor() as "error" | "warning" | "info" | "success"}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {passwordFeedback}
                </Typography>
              </Box>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      aria-label={showConfirmPassword ? 'hide password' : 'show password'}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Update Password'
              )}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link href="/profile">
                <Typography color="primary" sx={{ cursor: 'pointer' }}>
                  Back to Profile
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
      
      {/* Success message snackbar */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}