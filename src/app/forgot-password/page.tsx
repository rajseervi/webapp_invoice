"use client"
import React, { useState } from 'react';
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
  Snackbar
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPassword() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate email
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      // Send password reset email using the context function
      await resetPassword(email);
      
      // Show success message
      setSuccessMessage('Password reset email sent! Check your inbox for further instructions.');
      setShowSuccessMessage(true);
      
      // Clear form
      setEmail('');
      
      // Redirect to login page after a delay
      setTimeout(() => {
        router.push('/login');
      }, 5000);
    } catch (err: any) {
      // Handle errors
      if (err.message) {
        setError(err.message);
      } else {
        setError('An error occurred. Please try again later.');
        console.error('Password reset error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

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
              Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Enter your email address and we'll send you a link to reset your password.
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
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                inputProps: {
                  'data-testid': 'email-input'
                }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
              data-testid="reset-password-button"
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Remember your password?{' '}
                <Link href="/login">
                  <Typography component="span" color="primary" sx={{ cursor: 'pointer' }}>
                    Back to Login
                  </Typography>
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
      
      {/* Success message snackbar */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={5000}
        onClose={() => setShowSuccessMessage(false)}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}