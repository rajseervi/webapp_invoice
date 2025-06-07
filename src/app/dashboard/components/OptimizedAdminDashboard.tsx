import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  Avatar,
  Autocomplete,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Invoice } from '@/services/invoiceService';
import { Order, OrderStatus } from '@/types/order';
import { Party } from '@/types/party';

export default function OptimizedAdminDashboard() {
  const theme = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [partySearchLoading, setPartySearchLoading] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch recent 10 invoices
        const invoicesRef = collection(db, 'invoices');
        const recentInvoicesQuery = query(
          invoicesRef,
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const invoicesSnapshot = await getDocs(recentInvoicesQuery);
        const invoicesData = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Invoice[];
        setRecentInvoices(invoicesData);

        // Fetch pending orders
        const ordersRef = collection(db, 'orders');
        const pendingOrdersQuery = query(
          ordersRef,
          where('status', '==', OrderStatus.PENDING),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const ordersSnapshot = await getDocs(pendingOrdersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setPendingOrders(ordersData);

        // Fetch all parties for the search dropdown
        const partiesRef = collection(db, 'parties');
        const partiesQuery = query(partiesRef, orderBy('name', 'asc'));
        const partiesSnapshot = await getDocs(partiesQuery);
        const partiesData = partiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Party[];
        setParties(partiesData);
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Handle party selection and navigate to statement
  const handlePartySelect = (party: Party | null) => {
    setSelectedParty(party);
    if (party) {
      router.push(`/parties/${party.id}/history`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 60,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.palette.primary.main,
            },
          }}
        >
          Admin Dashboard
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {/* Party Search Section */}
          <Paper
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 3,
              boxShadow: theme.shadows[3],
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: theme.palette.info.main, width: 48, height: 48 }}>
                <AccountBalanceIcon />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Party Statement Viewer
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Autocomplete
                options={parties}
                getOptionLabel={(option) => `${option.name} - ${option.email}`}
                value={selectedParty}
                onChange={(event, newValue) => handlePartySelect(newValue)}
                loading={partySearchLoading}
                sx={{ flexGrow: 1, minWidth: 300 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Party"
                    placeholder="Type party name or email..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {partySearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.light }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {option.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.email} • {option.phone}
                      </Typography>
                      {option.outstandingBalance && (
                        <Typography variant="caption" color="warning.main">
                          Outstanding: {formatCurrency(option.outstandingBalance)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                noOptionsText="No parties found"
              />
              
              <Button
                variant="contained"
                disabled={!selectedParty}
                onClick={() => selectedParty && router.push(`/parties/${selectedParty.id}/history`)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  py: 1.5,
                  minWidth: 120,
                }}
              >
                View Statement
              </Button>
            </Box>
            
            {selectedParty && (
              <Box sx={{ mt: 3, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Selected Party Details:
                </Typography>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Name:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedParty.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Email:</Typography>
                    <Typography variant="body1">{selectedParty.email}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phone:</Typography>
                    <Typography variant="body1">{selectedParty.phone}</Typography>
                  </Box>
                  {selectedParty.outstandingBalance && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Outstanding Balance:</Typography>
                      <Typography variant="body1" color="warning.main" sx={{ fontWeight: 600 }}>
                        {formatCurrency(selectedParty.outstandingBalance)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Paper>

          <Grid container spacing={4}>
          {/* Recent Invoices Section */}
          <Grid item xs={12} lg={6}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: theme.shadows[3],
                height: '100%',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
                    <ReceiptIcon />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Recent Invoices
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push('/invoices')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    '&:hover': { 
                      backgroundColor: theme.palette.primary.light,
                      borderColor: theme.palette.primary.dark,
                    },
                  }}
                >
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              {recentInvoices.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <ReceiptIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No invoices found
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Recent invoices will appear here
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {recentInvoices.map((invoice, index) => (
                    <ListItem
                      key={invoice.id}
                      disablePadding
                      sx={{
                        mb: 2,
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <ListItemButton
                        onClick={() => router.push(`/invoices/${invoice.id}`)}
                        sx={{
                          px: 3,
                          py: 2,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[2],
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Avatar sx={{ bgcolor: theme.palette.success.light, mr: 2 }}>
                            <ReceiptIcon sx={{ color: theme.palette.success.main }} />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {invoice.invoiceNumber}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {invoice.partyName || invoice.customer?.name || 'Unknown Customer'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(invoice.date)}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <MoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
                              <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                                {formatCurrency(invoice.totalAmount || invoice.total || 0)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Pending Orders Section */}
          <Grid item xs={12} lg={6}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: theme.shadows[3],
                height: '100%',
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 48, height: 48 }}>
                    <ShoppingCartIcon />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Pending Orders
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => router.push('/orders?status=pending')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: theme.palette.warning.main,
                    color: theme.palette.warning.main,
                    '&:hover': { 
                      backgroundColor: theme.palette.warning.light,
                      borderColor: theme.palette.warning.dark,
                    },
                  }}
                >
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              {pendingOrders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No pending orders
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Pending orders will appear here
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {pendingOrders.map((order, index) => (
                    <ListItem
                      key={order.id}
                      disablePadding
                      sx={{
                        mb: 2,
                        '&:last-child': { mb: 0 },
                      }}
                    >
                      <ListItemButton
                        onClick={() => router.push(`/orders/${order.id}`)}
                        sx={{
                          px: 3,
                          py: 2,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[2],
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Avatar sx={{ bgcolor: theme.palette.warning.light, mr: 2 }}>
                            <ShoppingCartIcon sx={{ color: theme.palette.warning.main }} />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {order.orderNumber}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {order.partyName}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(order.createdAt)}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <MoneyIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                <Typography variant="h6" color="warning.main" sx={{ fontWeight: 600 }}>
                                  {formatCurrency(order.total)}
                                </Typography>
                              </Box>
                              <Chip 
                                label="PENDING" 
                                color="warning" 
                                size="small" 
                                sx={{ fontWeight: 600 }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
}