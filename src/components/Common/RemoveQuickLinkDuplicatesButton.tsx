import React, { useState } from 'react';
import { Button, Snackbar, Alert, CircularProgress } from '@mui/material';
import { removeQuickLinkDuplicates } from '@/utils/quickLinkUtils';

interface RemoveQuickLinkDuplicatesButtonProps {
  onComplete?: () => void;
}

export const RemoveQuickLinkDuplicatesButton: React.FC<RemoveQuickLinkDuplicatesButtonProps> = ({ 
  onComplete 
}) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleRemoveDuplicates = async () => {
    if (!window.confirm('Are you sure you want to remove duplicate quick links? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      console.log('Starting duplicate quick link removal process...');
      const result = await removeQuickLinkDuplicates();
      console.log('Duplicate removal result:', result);
      
      setSnackbar({
        open: true,
        message: result.message,
        severity: result.success ? 'success' : 'error'
      });

      if (result.success && onComplete) {
        // Wait a moment before refreshing the data
        setTimeout(() => {
          console.log('Refreshing data after duplicate removal');
          onComplete();
        }, 500);
      }
    } catch (error) {
      console.error('Unexpected error in RemoveQuickLinkDuplicatesButton:', error);
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
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        sx={{ ml: 1 }}
      >
        {loading ? 'Removing Duplicates...' : 'Remove Duplicate Quick Links'}
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