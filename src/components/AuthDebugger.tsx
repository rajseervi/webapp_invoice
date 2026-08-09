'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Alert, 
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';

interface AuthDebuggerProps {
  onClose?: () => void;
}

export const AuthDebugger: React.FC<AuthDebuggerProps> = ({ onClose }) => {
  const { currentUser, userRole, userStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [userDoc, setUserDoc] = useState<any>(null);

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  const checkUserDocument = async () => {
    if (!currentUser) {
      showMessage('No authenticated user found', 'error');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserDoc(userData);
        showMessage('User document found in Firestore', 'success');
      } else {
        setUserDoc(null);
        showMessage('User document not found in Firestore', 'error');
      }
    } catch (error: any) {
      console.error('Error checking user document:', error);
      showMessage(`Error checking user document: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const createUserDocument = async () => {
    if (!currentUser) {
      showMessage('No authenticated user found', 'error');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        email: currentUser.email,
        displayName: currentUser.displayName || 'Admin User',
        role: 'admin',
        status: 'active',
        isActive: true,
        createdAt: new Date().toISOString(),
        permissions: {
          pages: {
            dashboard: true,
            invoices: true,
            products: true,
            parties: true,
            reports: true
          },
          features: {
            create: true,
            edit: true,
            delete: true,
            export: true
          }
        }
      };

      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, userData);
      
      setUserDoc(userData);
      showMessage('User document created successfully! Please refresh the page.', 'success');
      
      // Update localStorage
      localStorage.setItem('authUser', JSON.stringify({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName
      }));
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userStatus', 'active');
      
    } catch (error: any) {
      console.error('Error creating user document:', error);
      showMessage(`Error creating user document: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateUserDocument = async () => {
    if (!currentUser || !userDoc) {
      showMessage('No user document to update', 'error');
      return;
    }

    setLoading(true);
    try {
      const updates = {
        role: 'admin',
        status: 'active',
        isActive: true,
        updatedAt: new Date().toISOString()
      };

      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { ...userDoc, ...updates }, { merge: true });
      
      setUserDoc({ ...userDoc, ...updates });
      showMessage('User document updated successfully! Please refresh the page.', 'success');
      
    } catch (error: any) {
      console.error('Error updating user document:', error);
      showMessage(`Error updating user document: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      checkUserDocument();
    }
  }, [currentUser]);

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Authentication Debugger</Typography>
          {onClose && (
            <Button onClick={onClose} size="small">Close</Button>
          )}
        </Box>

        {message && (
          <Alert severity={messageType} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>
            Firebase Auth Status:
          </Typography>
          <Box display="flex" gap={1} mb={1}>
            <Chip 
              label={currentUser ? 'Authenticated' : 'Not Authenticated'} 
              color={currentUser ? 'success' : 'error'} 
              size="small" 
            />
            {currentUser && (
              <Chip 
                label={`Role: ${userRole || 'Unknown'}`} 
                color={userRole === 'admin' ? 'success' : 'warning'} 
                size="small" 
              />
            )}
            {currentUser && (
              <Chip 
                label={`Status: ${userStatus || 'Unknown'}`} 
                color={userStatus === 'active' ? 'success' : 'warning'} 
                size="small" 
              />
            )}
          </Box>
          
          {currentUser && (
            <Box>
              <Typography variant="body2" color="textSecondary">
                UID: {currentUser.uid}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Email: {currentUser.email}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>
            Firestore User Document:
          </Typography>
          
          {loading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={16} />
              <Typography variant="body2">Checking...</Typography>
            </Box>
          ) : userDoc ? (
            <Box>
              <Chip label="Document Exists" color="success" size="small" sx={{ mb: 1 }} />
              <Typography variant="body2" color="textSecondary">
                Role: {userDoc.role || 'Not set'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Status: {userDoc.status || 'Not set'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active: {userDoc.isActive ? 'Yes' : 'No'}
              </Typography>
            </Box>
          ) : (
            <Chip label="Document Missing" color="error" size="small" />
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" gap={1} flexWrap="wrap">
          <Button 
            variant="outlined" 
            onClick={checkUserDocument}
            disabled={loading || !currentUser}
            size="small"
          >
            Check User Document
          </Button>
          
          {!userDoc && currentUser && (
            <Button 
              variant="contained" 
              onClick={createUserDocument}
              disabled={loading}
              size="small"
              color="primary"
            >
              Create User Document
            </Button>
          )}
          
          {userDoc && currentUser && (userDoc.role !== 'admin' || userDoc.status !== 'active' || !userDoc.isActive) && (
            <Button 
              variant="contained" 
              onClick={updateUserDocument}
              disabled={loading}
              size="small"
              color="warning"
            >
              Fix User Document
            </Button>
          )}
        </Box>

        <Box mt={2}>
          <Typography variant="caption" color="textSecondary">
            This debugger helps identify and fix authentication issues. 
            Once fixed, refresh the page to see changes.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AuthDebugger;