import React, { memo } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// Define interfaces
interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  date: string;
}

interface RecentInvoicesProps {
  recentInvoices: RecentInvoice[];
  loading: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}

// Memoized component to prevent unnecessary re-renders
const RecentInvoices = memo(({ recentInvoices, loading, formatCurrency, formatDate, getStatusColor }: RecentInvoicesProps) => {
  const router = useRouter();
  const theme = useTheme();

  // Render skeleton when loading
  if (loading) {
    return (
      <Paper sx={{ 
        p: 3, 
        height: '100%', 
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="text" width={150} height={32} />
          <Skeleton variant="text" width={80} height={32} />
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        <List sx={{ p: 0 }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <ListItem key={item} disablePadding sx={{ mb: 1 }}>
              <Box sx={{ width: '100%', p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Skeleton variant="text" width={120} />
                  <Skeleton variant="text" width={80} />
                </Box>
                <Skeleton variant="text" width="60%" />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Skeleton variant="text" width={100} />
                  <Skeleton variant="rectangular" width={70} height={24} />
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" width="100%" height={48} />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ 
      p: 3, 
      height: '100%', 
      borderRadius: 2,
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Recent Invoices</Typography>
        <Button 
          size="small" 
          endIcon={<ArrowForwardIcon />}
          onClick={() => router.push('/invoices')}
        >
          View All
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      {recentInvoices.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No recent invoices found
        </Typography>
      ) : (
        <List sx={{ p: 0 }}>
          {recentInvoices.map((invoice) => (
            <ListItem 
              key={invoice.id} 
              disablePadding 
              sx={{ 
                mb: 1,
                '&:last-child': { mb: 0 }
              }}
            >
              <ListItemButton 
                sx={{ 
                  px: 2, 
                  py: 1.5, 
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => router.push(`/invoices/${invoice.id}`)}
              >
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" fontWeight={500}>
                        {invoice.invoiceNumber}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(invoice.amount)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography variant="body2" component="span">
                        {invoice.customerName}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(invoice.date)}
                        </Typography>
                        <Chip 
                          label={invoice.status} 
                          color={getStatusColor(invoice.status) as any} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </React.Fragment>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/invoices/new')}
          fullWidth
          sx={{ 
            borderRadius: 2,
            py: 1,
            bgcolor: theme.palette.success.main,
            '&:hover': { bgcolor: theme.palette.success.dark }
          }}
        >
          Create New Invoice
        </Button>
      </Box>
    </Paper>
  );
});

RecentInvoices.displayName = 'RecentInvoices';

export default RecentInvoices;