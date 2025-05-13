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
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// Define interfaces
interface TopCustomer {
  id: string;
  name: string;
  totalPurchases: number;
  lastPurchase: string;
}

interface TopCustomersProps {
  topCustomers: TopCustomer[];
  filteredCustomers: TopCustomer[];
  customerSearchQuery: string;
  setCustomerSearchQuery: (query: string) => void;
  loading: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  getCustomerInitial: (name: string) => string;
  getCustomerAvatarColor: (id: string) => string;
}

// Memoized component to prevent unnecessary re-renders
const TopCustomers = memo(({ 
  topCustomers, 
  filteredCustomers, 
  customerSearchQuery, 
  setCustomerSearchQuery, 
  loading, 
  formatCurrency, 
  formatDate,
  getCustomerInitial,
  getCustomerAvatarColor
}: TopCustomersProps) => {
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
        
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ mb: 2, borderRadius: 1 }} />
        
        <List sx={{ p: 0 }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <ListItem key={item} disablePadding sx={{ mb: 1 }}>
              <Box sx={{ width: '100%', p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.paper', borderRadius: 1 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width={120} />
                  <Skeleton variant="text" width="60%" />
                </Box>
                <Skeleton variant="circular" width={32} height={32} />
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
        <Typography variant="h6">Top Customers</Typography>
        <Button 
          size="small" 
          endIcon={<ArrowForwardIcon />}
          onClick={() => router.push('/parties')}
        >
          View All
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      <TextField
        fullWidth
        placeholder="Search customers..."
        variant="outlined"
        size="small"
        value={customerSearchQuery}
        onChange={(e) => setCustomerSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      
      {filteredCustomers.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No customers found
        </Typography>
      ) : (
        <List sx={{ p: 0 }}>
          {filteredCustomers.map((customer) => (
            <ListItem 
              key={customer.id} 
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
                onClick={() => router.push(`/parties?id=${customer.id}`)}
              >
                <Avatar 
                  sx={{ 
                    mr: 2, 
                    bgcolor: getCustomerAvatarColor(customer.id),
                    width: 40,
                    height: 40
                  }}
                >
                  {getCustomerInitial(customer.name)}
                </Avatar>
                <ListItemText 
                  primary={
                    <Typography variant="body1" fontWeight={500}>
                      {customer.name}
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography variant="body2" component="span" color="text.secondary">
                        Total: {formatCurrency(customer.totalPurchases)}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        Last purchase: {formatDate(customer.lastPurchase)}
                      </Typography>
                    </React.Fragment>
                  }
                />
                <IconButton 
                  color="primary"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/invoices/new?customer=${customer.id}`);
                  }}
                  sx={{ 
                    ml: 1,
                    bgcolor: `${theme.palette.primary.main}10`,
                    '&:hover': { bgcolor: `${theme.palette.primary.main}20` }
                  }}
                  title="Create invoice for this customer"
                >
                  <ReceiptIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="outlined" 
          startIcon={<PersonIcon />}
          onClick={() => router.push('/parties')}
          fullWidth
          sx={{ 
            borderRadius: 2,
            py: 1
          }}
        >
          Add New Customer
        </Button>
      </Box>
    </Paper>
  );
});

TopCustomers.displayName = 'TopCustomers';

export default TopCustomers;