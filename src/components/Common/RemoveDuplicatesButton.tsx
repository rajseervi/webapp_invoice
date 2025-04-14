import React, { useState } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import { removeDuplicateProducts } from '@/utils/productUtils';

interface RemoveDuplicatesButtonProps {
  onSuccess?: () => void;
}

export const RemoveDuplicatesButton: React.FC<RemoveDuplicatesButtonProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleRemoveDuplicates = async () => {
    if (!window.confirm('Are you sure you want to remove duplicate products? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      console.log('Starting duplicate product removal process...');
      const result = await removeDuplicateProducts();
      console.log('Duplicate removal result:', result);
      
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? 'success' : 'error'
      });

      if (result.success && onSuccess) {
        // Wait a moment before refreshing the data
        setTimeout(() => {
          console.log('Refreshing product data after duplicate removal');
          onSuccess();
        }, 500);
      }
    } catch (error) {
      console.error('Unexpected error in RemoveDuplicatesButton:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
        
      setSnackbar({
        open: true,
        message: `An error occurred while removing duplicates: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <Button
        variant="contained"
        color="warning"
        onClick={handleRemoveDuplicates}
        disabled={loading}
      >
        {loading ? 'Removing Duplicates...' : 'Remove Duplicate Products'}
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};