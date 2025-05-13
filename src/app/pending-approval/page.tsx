"use client"
import React from 'react';
import { Box, Typography, Paper, Button, Container, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; 
import { handleLogout } from '@/utils/authRedirects';
import { HourglassEmpty as HourglassIcon } from '@mui/icons-material';
import { Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';

export default function PendingApprovalPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const performLogout = async () => {
    try {
      // Use the utility function for logout
      await handleLogout(logout, router);
    } catch (error) {
      console.error('Error logging out:', error);
      // If the utility function fails, try a direct redirect
      router.push('/login');
    }
  };
 

  // Handle download button click
  const handleDownload = () => {
    // Create a Blob with the HTML content
    const blob = new Blob([getPrintableHTML()], { type: 'text/html' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = 'account-pending-approval.html';
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle print button click
  const handlePrint = () => {
    // Create a new window
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      // Write the HTML content to the new window
      printWindow.document.write(getPrintableHTML());
      printWindow.document.close();
      
      // Wait for content to load before printing
      printWindow.onload = function() {
        printWindow.print();
        // Close the window after printing (optional)
        // printWindow.onafterprint = function() {
        //   printWindow.close();
        // };
      };
    } else {
      alert('Please allow popups to print this document.');
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
          <HourglassIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          
          <Typography variant="h4" gutterBottom>
            Account Pending Approval
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
            Your account is currently pending approval by an administrator. 
            You will receive an email notification once your account has been approved.
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            If you believe this is an error or have any questions, please contact support.
          </Typography>
          
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleDownload}
              startIcon={<DownloadIcon />}
              size="medium"
            >
              Download
            </Button>
            
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handlePrint}
              startIcon={<PrintIcon />}
              size="medium"
            >
              Print
            </Button>
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={performLogout}
              size="medium"
            >
              Return to Login
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}