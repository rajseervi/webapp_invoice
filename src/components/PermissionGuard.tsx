"use client";
import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Typography, Button } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface PermissionGuardProps {
  pageId?: string;
  featureId?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that guards content based on user permissions
 * 
 * @param pageId - The ID of the page permission to check
 * @param featureId - The ID of the feature permission to check
 * @param children - The content to render if the user has permission
 * @param fallback - Optional content to render if the user doesn't have permission
 */
export default function PermissionGuard({ 
  pageId, 
  featureId, 
  children, 
  fallback 
}: PermissionGuardProps) {
  const { hasPermission, userRole } = useAuth();
  const router = useRouter();
  
  // Check if user has permission
  const hasPagePermission = pageId ? hasPermission('page', pageId) : true;
  const hasFeaturePermission = featureId ? hasPermission('feature', featureId) : true;
  
  // Admin users always have access
  if (userRole === 'admin') {
    return <>{children}</>;
  }
  
  // If user has both required permissions, render children
  if (hasPagePermission && hasFeaturePermission) {
    return <>{children}</>;
  }
  
  // If fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Default fallback
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center',
      height: '100%',
      minHeight: 200,
      p: 3,
      textAlign: 'center'
    }}>
      <SecurityIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
      <Typography variant="h6" color="error" gutterBottom>
        Access Denied
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 2 }}>
        You don't have permission to access this {pageId ? 'page' : 'feature'}.
        Please contact your administrator if you need access.
      </Typography>
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => router.push('/dashboard')}
      >
        Return to Dashboard
      </Button>
    </Box>
  );
}