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
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Snackbar
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext.js';
import { GoogleAuthProvider, signInWithPopup, browserSessionPersistence, setPersistence } from 'firebase/auth';
 
import { redirectBasedOnRole, handleLoginError, getCallbackUrl } from '@/utils/authRedirects';

export default function Login() {
  const router = useRouter();
  const { login, loginWithGoogle, currentUser, userRole, userStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  
  useEffect(() => {
    // Get query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const callbackUrl = getCallbackUrl();
    const pendingApproval = urlParams.get('pendingApproval');
    const errorParam = urlParams.get('error');
    
    // Show message if user registration is pending approval
    if (pendingApproval === 'true') {
      setSuccessMessage('Your account has been created and is pending admin approval. You will be notified when your account is approved.');
      setShowSuccessMessage(true);
    }
    
    // Show error message if provided in URL
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
    
    // If user is already logged in, redirect to appropriate page
    if (currentUser) {
      redirectBasedOnRole(router, userRole, callbackUrl, userStatus);
    }
    
    // Check if there's a lockout time in localStorage
    const storedLockout = localStorage.getItem('loginLockout');
    if (storedLockout) {
      const lockoutUntil = parseInt(storedLockout);
      if (lockoutUntil > Date.now()) {
        setLockoutTime(lockoutUntil);
      } else {
        localStorage.removeItem('loginLockout');
      }
    }
    
    // Check login attempts
    const attempts = localStorage.getItem('loginAttempts');
    if (attempts) {
      setLoginAttempts(parseInt(attempts));
    }
  }, [currentUser, router, userRole, userStatus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Check if user is locked out
    if (lockoutTime && lockoutTime > Date.now()) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
      setError(`Too many failed login attempts. Please try again in ${remainingTime} minutes.`);
      return;
    }
    
    // Validate form
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);

    try {
      // Set session persistence based on remember me option
      if (!rememberMe) {
        await setPersistence(auth, browserSessionPersistence);
      }
      
      // Use the login function from AuthContext
      const role = await login(formData.email, formData.password);
      
      // Reset login attempts on successful login
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('loginLockout');
      setLoginAttempts(0);
      
      // Show success message
      setSuccessMessage('Login successful! Redirecting...');
      setShowSuccessMessage(true);
      
      // Get callback URL
      const callbackUrl = getCallbackUrl();
      
      // Redirect based on callback URL or user role after a short delay
      setTimeout(() => {
        redirectBasedOnRole(router, role, callbackUrl, userStatus);
      }, 1000);
    } catch (err: any) {
      // Increment login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('loginAttempts', newAttempts.toString());
      
      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        const lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
        setLockoutTime(lockoutUntil);
        localStorage.setItem('loginLockout', lockoutUntil.toString());
        setError('Too many failed login attempts. Please try again in 15 minutes.');
      } else {
        // Use utility function to handle login errors
        handleLoginError(err, setError);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    // Check if user is locked out
    if (lockoutTime && lockoutTime > Date.now()) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
      setError(`Too many failed login attempts. Please try again in ${remainingTime} minutes.`);
      setLoading(false);
      return;
    }
    
    try {
      // Set session persistence based on remember me option
      if (!rememberMe) {
        await setPersistence(auth, browserSessionPersistence);
      }
      
      // Use the loginWithGoogle function from the auth context we already have
      const role = await loginWithGoogle();
      
      // Show success message
      setSuccessMessage('Google login successful! Redirecting...');
      setShowSuccessMessage(true);
      
      // Get callback URL
      const callbackUrl = getCallbackUrl();
      
      // Redirect based on role and callback URL
      setTimeout(() => {
        redirectBasedOnRole(router, role, callbackUrl, userStatus);
      }, 1000);
    } catch (err: any) {
      // Use utility function to handle login errors
      handleLoginError(err, setError);
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
              Sign in to your account
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
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                inputProps: {
                  'data-testid': 'email-input'
                }
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label={showPassword ? 'hide password' : 'show password'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                inputProps: {
                  'data-testid': 'password-input'
                }
              }}
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  color="primary"
                  data-testid="remember-me-checkbox"
                />
              }
              label="Remember me"
              sx={{ mt: 1 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2, mb: 2, py: 1.5 }}
              disabled={loading}
              data-testid="login-button"
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>

            <Divider sx={{ my: 2 }}>OR</Divider>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              sx={{ mb: 2, py: 1.5 }}
              onClick={handleGoogleSignIn}
              disabled={loading || (lockoutTime !== null && lockoutTime > Date.now())}
              data-testid="google-signin-button"
            >
              Continue with Google
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link href="/forgot-password">
                <Typography color="primary" sx={{ mb: 1, cursor: 'pointer' }}>
                  Forgot your password?
                </Typography>
              </Link>
              <Typography color="text.secondary">
                Do not have an account?{' '}
                <Link href="/register">
                  <Typography component="span" color="primary" sx={{ cursor: 'pointer' }}>
                    Sign up
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
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}
import { auth } from '../../firebase/config';
 