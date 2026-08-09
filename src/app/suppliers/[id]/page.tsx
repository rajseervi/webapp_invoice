"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Tab,
  Tabs
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  AccountBalance as BankIcon,
  LocalShipping as ShippingIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { EnhancedSupplier, EnhancedPurchaseOrder } from '@/types/enhancedPurchase';
import EnhancedSupplierService from '@/services/enhancedSupplierService';
import EnhancedPurchaseEntryService from '@/services/enhancedPurchaseEntryService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`supplier-tabpanel-${index}`}
      aria-labelledby={`supplier-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SupplierDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { userId } = useCurrentUser();
  
  const [supplier, setSupplier] = useState<EnhancedSupplier | null>(null);
  const [purchases, setPurchases] = useState<EnhancedPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const supplierId = params.id as string;

  useEffect(() => {
    if (supplierId && userId) {
      loadSupplierDetails();
    }
  }, [supplierId, userId]);

  const loadSupplierDetails = async () => {
    try {
      setLoading(true);
      const [supplierData, purchasesData] = await Promise.all([
        EnhancedSupplierService.getSupplier(supplierId),
        EnhancedPurchaseEntryService.getPurchaseOrdersBySupplier(supplierId, userId)
      ]);
      
      setSupplier(supplierData);
      setPurchases(purchasesData || []);
    } catch (err) {
      console.error('Error loading supplier details:', err);
      setError('Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/suppliers/edit/${supplierId}`);
  };

  const handleBack = () => {
    router.push('/suppliers');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return dateObj.toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <ModernThemeProvider>
        <VisuallyEnhancedDashboardLayout
          title="Supplier Details"
          pageType="supplier"
          enableVisualEffects={true}
          enableParticles={false}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading supplier details...
            </Typography>
          </Box>
        </VisuallyEnhancedDashboardLayout>
      </ModernThemeProvider>
    );
  }

  if (error || !supplier) {
    return (
      <ModernThemeProvider>
        <VisuallyEnhancedDashboardLayout
          title="Supplier Details"
          pageType="supplier"
          enableVisualEffects={true}
          enableParticles={false}
        >
          <Container maxWidth="lg" sx={{ py: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || 'Supplier not found'}
            </Alert>
            <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
              Back to Suppliers
            </Button>
          </Container>
        </VisuallyEnhancedDashboardLayout>
      </ModernThemeProvider>
    );
  }

  const purchaseStats = {
    total: purchases.length,
    totalAmount: purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
    pending: purchases.filter(p => p.status === 'pending').length,
    completed: purchases.filter(p => p.status === 'received').length
  };

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title={supplier.name}
        pageType="supplier"
        enableVisualEffects={true}
        enableParticles={false}
        actions={
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit Supplier
            </Button>
          </Box>
        }
      >
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* Header Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 60,
                        height: 60,
                        mr: 3
                      }}
                    >
                      <BusinessIcon fontSize="large" />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" gutterBottom>
                        {supplier.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                          icon={supplier.isActive ? <CheckCircleIcon /> : <WarningIcon />}
                          label={supplier.isActive ? 'Active' : 'Inactive'}
                          color={supplier.isActive ? 'success' : 'default'}
                        />
                        {supplier.creditLimit && supplier.creditLimit > 100000 && (
                          <Chip
                            icon={<StarIcon />}
                            label="High Credit"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      {supplier.contactPerson && (
                        <Typography variant="subtitle1" color="text.secondary">
                          Contact: {supplier.contactPerson}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Current Balance
                    </Typography>
                    <Typography
                      variant="h4"
                      color={
                        (supplier.currentBalance || 0) > 0
                          ? 'warning.main'
                          : (supplier.currentBalance || 0) < 0
                          ? 'success.main'
                          : 'text.primary'
                      }
                    >
                      {formatCurrency(supplier.currentBalance || 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(supplier.currentBalance || 0) > 0 ? 'Amount Due' : 
                       (supplier.currentBalance || 0) < 0 ? 'Credit Balance' : 'Balanced'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Overview" />
                <Tab label="Purchase History" />
                <Tab label="Financial Details" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                {/* Contact Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                  <List>
                    {supplier.phone && (
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon />
                        </ListItemIcon>
                        <ListItemText primary="Phone" secondary={supplier.phone} />
                      </ListItem>
                    )}
                    {supplier.email && (
                      <ListItem>
                        <ListItemIcon>
                          <EmailIcon />
                        </ListItemIcon>
                        <ListItemText primary="Email" secondary={supplier.email} />
                      </ListItem>
                    )}
                    {supplier.address && (
                      <ListItem>
                        <ListItemIcon>
                          <LocationIcon />
                        </ListItemIcon>
                        <ListItemText primary="Address" secondary={supplier.address} />
                      </ListItem>
                    )}
                    {supplier.gstin && (
                      <ListItem>
                        <ListItemIcon>
                          <ReceiptIcon />
                        </ListItemIcon>
                        <ListItemText primary="GSTIN" secondary={supplier.gstin} />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                {/* Business Terms */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Business Terms
                  </Typography>
                  <List>
                    {supplier.paymentTerms && (
                      <ListItem>
                        <ListItemIcon>
                          <PaymentIcon />
                        </ListItemIcon>
                        <ListItemText primary="Payment Terms" secondary={supplier.paymentTerms} />
                      </ListItem>
                    )}
                    {supplier.leadTime && (
                      <ListItem>
                        <ListItemIcon>
                          <ScheduleIcon />
                        </ListItemIcon>
                        <ListItemText primary="Lead Time" secondary={`${supplier.leadTime} days`} />
                      </ListItem>
                    )}
                    {supplier.creditLimit && (
                      <ListItem>
                        <ListItemIcon>
                          <PaymentIcon />
                        </ListItemIcon>
                        <ListItemText primary="Credit Limit" secondary={formatCurrency(supplier.creditLimit)} />
                      </ListItem>
                    )}
                    {supplier.minimumOrderValue && (
                      <ListItem>
                        <ListItemIcon>
                          <ShippingIcon />
                        </ListItemIcon>
                        <ListItemText primary="Minimum Order" secondary={formatCurrency(supplier.minimumOrderValue)} />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                {/* Purchase Statistics */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Purchase Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4">{purchaseStats.total}</Typography>
                          <Typography color="text.secondary">Total Orders</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4">{formatCurrency(purchaseStats.totalAmount)}</Typography>
                          <Typography color="text.secondary">Total Amount</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4">{purchaseStats.pending}</Typography>
                          <Typography color="text.secondary">Pending Orders</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4">{purchaseStats.completed}</Typography>
                          <Typography color="text.secondary">Completed Orders</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Notes */}
                {supplier.notes && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Notes
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography>{supplier.notes}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Purchase History
              </Typography>
              {purchases.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No purchase orders found for this supplier
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>PO Number</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Items</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {purchases.map((purchase) => (
                        <TableRow key={purchase.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {purchase.purchaseOrderNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatDate(purchase.orderDate)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={purchase.status}
                              color={
                                purchase.status === 'received' ? 'success' :
                                purchase.status === 'pending' ? 'warning' : 'default'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(purchase.totalAmount || 0)}
                          </TableCell>
                          <TableCell>
                            {purchase.items?.length || 0} items
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                {/* Bank Details */}
                {supplier.bankDetails && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <BankIcon sx={{ mr: 1 }} />
                      Bank Details
                    </Typography>
                    <List>
                      {supplier.bankDetails.accountHolderName && (
                        <ListItem>
                          <ListItemText 
                            primary="Account Holder" 
                            secondary={supplier.bankDetails.accountHolderName} 
                          />
                        </ListItem>
                      )}
                      {supplier.bankDetails.accountNumber && (
                        <ListItem>
                          <ListItemText 
                            primary="Account Number" 
                            secondary={supplier.bankDetails.accountNumber} 
                          />
                        </ListItem>
                      )}
                      {supplier.bankDetails.bankName && (
                        <ListItem>
                          <ListItemText 
                            primary="Bank Name" 
                            secondary={supplier.bankDetails.bankName} 
                          />
                        </ListItem>
                      )}
                      {supplier.bankDetails.ifscCode && (
                        <ListItem>
                          <ListItemText 
                            primary="IFSC Code" 
                            secondary={supplier.bankDetails.ifscCode} 
                          />
                        </ListItem>
                      )}
                    </List>
                  </Grid>
                )}

                {/* Financial Summary */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssessmentIcon sx={{ mr: 1 }} />
                    Financial Summary
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText 
                        primary="Current Balance" 
                        secondary={formatCurrency(supplier.currentBalance || 0)} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Credit Limit" 
                        secondary={formatCurrency(supplier.creditLimit || 0)} 
                      />
                    </ListItem>
                    {supplier.discountPercentage && (
                      <ListItem>
                        <ListItemText 
                          primary="Discount Rate" 
                          secondary={`${supplier.discountPercentage}%`} 
                        />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemText 
                        primary="Total Purchase Amount" 
                        secondary={formatCurrency(purchaseStats.totalAmount)} 
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </TabPanel>
          </Card>
        </Container>
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}