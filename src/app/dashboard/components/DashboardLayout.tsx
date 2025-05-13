import React, { ReactNode } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  useTheme
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  error?: string | null;
  actions?: ReactNode;
}

const DashboardLayout = ({ 
  children, 
  title = 'Dashboard', 
  error = null,
  actions
}: DashboardLayoutProps) => {
  const theme = useTheme();
  const router = useRouter();

  // Default actions if none provided
  const defaultActions = (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Button 
        variant="contained" 
        startIcon={<ReceiptIcon />}
        onClick={() => router.push('/invoices/new')}
        sx={{ bgcolor: theme.palette.success.main, '&:hover': { bgcolor: theme.palette.success.dark } }}
      >
        New Invoice
      </Button>
      <Button 
        variant="contained" 
        startIcon={<PersonIcon />}
        onClick={() => router.push('/parties')}
      >
        New Customer
      </Button>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
        {actions || defaultActions}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {children}
    </Container>
  );
};

export default DashboardLayout;