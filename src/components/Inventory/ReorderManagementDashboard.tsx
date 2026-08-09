"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Badge,
  Alert,
  LinearProgress,
  Checkbox,
  Divider,
  Avatar,
  Menu,
  MenuList,
  MenuItem as MuiMenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from '@/contexts/AuthContext';
import { 
  StockReorderService, 
  ReorderSuggestion, 
  PurchaseOrder, 
  ReorderRule,
  SupplierPerformance 
} from '@/services/stockReorderService';

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
      id={`reorder-tabpanel-${index}`}
      aria-labelledby={`reorder-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const getUrgencyColor = (urgency: ReorderSuggestion['urgencyLevel']) => {
  switch (urgency) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'success';
    default: return 'default';
  }
};

const getStatusColor = (status: PurchaseOrder['status']) => {
  switch (status) {
    case 'completed': return 'success';
    case 'confirmed': return 'info';
    case 'sent': return 'warning';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

export default function ReorderManagementDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Data states
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([]);
  
  // Dialog states
  const [createOrderDialogOpen, setCreateOrderDialogOpen] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  
  // Form states
  const [supplierInfo, setSupplierInfo] = useState({
    supplierId: '',
    supplierName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [orderInfo, setOrderInfo] = useState({
    priority: 'medium' as PurchaseOrder['priority'],
    expectedDeliveryDate: '',
    notes: '',
    terms: ''
  });

  // Menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuOrder, setActionMenuOrder] = useState<PurchaseOrder | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [suggestionsData, ordersData, performanceData] = await Promise.all([
        StockReorderService.getReorderSuggestions(),
        StockReorderService.getPurchaseOrders(),
        StockReorderService.calculateSupplierPerformance()
      ]);

      setSuggestions(suggestionsData);
      setPurchaseOrders(ordersData);
      setSupplierPerformance(performanceData);
    } catch (error) {
      console.error('Error loading reorder data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate reorder suggestions
  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const newSuggestions = await StockReorderService.generateReorderSuggestions(user?.uid);
      if (newSuggestions.length > 0) {
        await loadData();
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestionId: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId)
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };

  const handleSelectAllSuggestions = () => {
    const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
    if (selectedSuggestions.length === pendingSuggestions.length) {
      setSelectedSuggestions([]);
    } else {
      setSelectedSuggestions(pendingSuggestions.map(s => s.id!));
    }
  };

  // Create purchase order
  const handleCreateOrder = async () => {
    if (selectedSuggestions.length === 0 || !supplierInfo.supplierName) {
      return;
    }

    setLoading(true);
    try {
      const orderId = await StockReorderService.createPurchaseOrder(
        {
          supplierId: supplierInfo.supplierId || `supplier-${Date.now()}`,
          supplierName: supplierInfo.supplierName,
          supplierContact: {
            email: supplierInfo.email,
            phone: supplierInfo.phone,
            address: supplierInfo.address
          }
        },
        selectedSuggestions,
        orderInfo,
        user?.uid
      );

      if (orderId) {
        setCreateOrderDialogOpen(false);
        setSelectedSuggestions([]);
        setSupplierInfo({
          supplierId: '',
          supplierName: '',
          email: '',
          phone: '',
          address: ''
        });
        setOrderInfo({
          priority: 'medium',
          expectedDeliveryDate: '',
          notes: '',
          terms: ''
        });
        await loadData();
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId: string, status: PurchaseOrder['status']) => {
    setLoading(true);
    try {
      await StockReorderService.updatePurchaseOrderStatus(orderId, status, undefined, user?.uid);
      await loadData();
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setLoading(false);
    }
    setActionMenuAnchor(null);
  };

  const openActionMenu = (event: React.MouseEvent<HTMLElement>, order: PurchaseOrder) => {
    setActionMenuAnchor(event.currentTarget);
    setActionMenuOrder(order);
  };

  const closeActionMenu = () => {
    setActionMenuAnchor(null);
    setActionMenuOrder(null);
  };

  const openOrderDetails = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setOrderDetailsDialogOpen(true);
    closeActionMenu();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && suggestions.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading reorder management...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">
            Reorder Management
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<TrendingUpIcon />}
              onClick={generateSuggestions}
              disabled={loading}
            >
              Generate Suggestions
            </Button>
            <Button
              variant="contained"
              startIcon={<ShoppingCartIcon />}
              onClick={() => setCreateOrderDialogOpen(true)}
              disabled={selectedSuggestions.length === 0}
            >
              Create Order ({selectedSuggestions.length})
            </Button>
          </Stack>
        </Stack>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <WarningIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {suggestions.filter(s => s.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Suggestions
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <ErrorIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {suggestions.filter(s => s.urgencyLevel === 'critical').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Critical Items
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <ReceiptIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {purchaseOrders.filter(o => ['draft', 'sent', 'confirmed'].includes(o.status)).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Orders
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(purchaseOrders.reduce((sum, o) => sum + o.totalCost, 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Order Value
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab 
                label={
                  <Badge badgeContent={suggestions.filter(s => s.status === 'pending').length} color="error">
                    Reorder Suggestions
                  </Badge>
                } 
              />
              <Tab label="Purchase Orders" />
              <Tab label="Supplier Performance" />
            </Tabs>
          </Box>

          {/* Reorder Suggestions Tab */}
          <TabPanel value={tabValue} index={0}>
            {/* Bulk Actions */}
            {selectedSuggestions.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography>
                    {selectedSuggestions.length} suggestion{selectedSuggestions.length > 1 ? 's' : ''} selected
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setCreateOrderDialogOpen(true)}
                  >
                    Create Purchase Order
                  </Button>
                </Stack>
              </Alert>
            )}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={suggestions.filter(s => s.status === 'pending').length > 0 && 
                                selectedSuggestions.length === suggestions.filter(s => s.status === 'pending').length}
                        indeterminate={selectedSuggestions.length > 0 && 
                                     selectedSuggestions.length < suggestions.filter(s => s.status === 'pending').length}
                        onChange={handleSelectAllSuggestions}
                      />
                    </TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Current Stock</TableCell>
                    <TableCell align="right">Reorder Point</TableCell>
                    <TableCell align="right">Suggested Qty</TableCell>
                    <TableCell>Urgency</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Est. Cost</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suggestions.map((suggestion) => (
                    <TableRow key={suggestion.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedSuggestions.includes(suggestion.id!)}
                          onChange={() => handleSuggestionSelect(suggestion.id!)}
                          disabled={suggestion.status !== 'pending'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {suggestion.productName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color={suggestion.currentStock <= 0 ? 'error' : 'inherit'}>
                          {suggestion.currentStock}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{suggestion.reorderPoint}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {suggestion.suggestedQuantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={suggestion.urgencyLevel.toUpperCase()}
                          color={getUrgencyColor(suggestion.urgencyLevel) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {suggestion.supplierName || 'Not specified'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {suggestion.costEstimate ? formatCurrency(suggestion.costEstimate) : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={suggestion.status.toUpperCase()}
                          color={suggestion.status === 'pending' ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {suggestions.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No reorder suggestions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All products are above their reorder points
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Purchase Orders Tab */}
          <TabPanel value={tabValue} index={1}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Items</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Expected Delivery</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseOrders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {order.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {order.supplierName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{order.items.length}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(order.totalCost)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.priority.toUpperCase()}
                          color={order.priority === 'urgent' ? 'error' : order.priority === 'high' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => openActionMenu(e, order)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {purchaseOrders.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No purchase orders
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create your first purchase order from reorder suggestions
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Supplier Performance Tab */}
          <TabPanel value={tabValue} index={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Total Orders</TableCell>
                    <TableCell align="right">Completed</TableCell>
                    <TableCell align="right">On-Time Rate</TableCell>
                    <TableCell align="right">Avg Lead Time</TableCell>
                    <TableCell align="right">Total Spent</TableCell>
                    <TableCell align="right">Overall Score</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supplierPerformance.map((supplier) => (
                    <TableRow key={supplier.supplierId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {supplier.supplierName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{supplier.totalOrders}</TableCell>
                      <TableCell align="right">{supplier.completedOrders}</TableCell>
                      <TableCell align="right">
                        {Math.round(supplier.onTimeDeliveryRate * 100)}%
                      </TableCell>
                      <TableCell align="right">
                        {supplier.averageLeadTime.toFixed(1)} days
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(supplier.totalSpent)}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LinearProgress
                            variant="determinate"
                            value={supplier.overallScore}
                            sx={{ width: 60 }}
                          />
                          <Typography variant="body2">
                            {Math.round(supplier.overallScore)}%
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={supplier.preferredSupplier ? 'Preferred' : 'Standard'}
                          color={supplier.preferredSupplier ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {supplierPerformance.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No supplier performance data
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete some purchase orders to see supplier metrics
                </Typography>
              </Box>
            )}
          </TabPanel>
        </Card>

        {/* Create Order Dialog */}
        <Dialog
          open={createOrderDialogOpen}
          onClose={() => setCreateOrderDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Typography variant="h6">Supplier Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Supplier Name"
                    value={supplierInfo.supplierName}
                    onChange={(e) => setSupplierInfo(prev => ({ ...prev, supplierName: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={supplierInfo.email}
                    onChange={(e) => setSupplierInfo(prev => ({ ...prev, email: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={supplierInfo.phone}
                    onChange={(e) => setSupplierInfo(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={orderInfo.priority}
                      onChange={(e) => setOrderInfo(prev => ({ ...prev, priority: e.target.value as any }))}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    multiline
                    rows={2}
                    value={supplierInfo.address}
                    onChange={(e) => setSupplierInfo(prev => ({ ...prev, address: e.target.value }))}
                  />
                </Grid>
              </Grid>

              <Divider />

              <Typography variant="h6">Order Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Expected Delivery Date"
                    value={orderInfo.expectedDeliveryDate ? new Date(orderInfo.expectedDeliveryDate) : null}
                    onChange={(date) => setOrderInfo(prev => ({ 
                      ...prev, 
                      expectedDeliveryDate: date ? date.toISOString() : '' 
                    }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={orderInfo.notes}
                    onChange={(e) => setOrderInfo(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Terms & Conditions"
                    multiline
                    rows={2}
                    value={orderInfo.terms}
                    onChange={(e) => setOrderInfo(prev => ({ ...prev, terms: e.target.value }))}
                  />
                </Grid>
              </Grid>

              <Divider />

              <Typography variant="h6">Selected Items ({selectedSuggestions.length})</Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {suggestions
                  .filter(s => selectedSuggestions.includes(s.id!))
                  .map((suggestion) => (
                    <Box key={suggestion.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {suggestion.productName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Quantity: {suggestion.suggestedQuantity}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="medium">
                          {suggestion.costEstimate ? formatCurrency(suggestion.costEstimate) : '-'}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOrderDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateOrder}
              disabled={loading || !supplierInfo.supplierName}
            >
              {loading ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Order Details Dialog */}
        <Dialog
          open={orderDetailsDialogOpen}
          onClose={() => setOrderDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Purchase Order Details</DialogTitle>
          <DialogContent>
            {selectedOrder && (
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Order Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedOrder.orderNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedOrder.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(selectedOrder.status) as any}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Supplier
                    </Typography>
                    <Typography variant="body1">
                      {selectedOrder.supplierName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Cost
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(selectedOrder.totalCost)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                <Typography variant="h6">Order Items</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Cost</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unitCost)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.totalCost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {selectedOrder.notes && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Notes
                      </Typography>
                      <Typography variant="body2">
                        {selectedOrder.notes}
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOrderDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={closeActionMenu}
        >
          <MuiMenuItem onClick={() => openOrderDetails(actionMenuOrder!)}>
            <ViewIcon sx={{ mr: 1 }} />
            View Details
          </MuiMenuItem>
          {actionMenuOrder?.status === 'draft' && (
            <MuiMenuItem onClick={() => handleUpdateOrderStatus(actionMenuOrder!.id!, 'sent')}>
              <SendIcon sx={{ mr: 1 }} />
              Send to Supplier
            </MuiMenuItem>
          )}
          {actionMenuOrder?.status === 'sent' && (
            <MuiMenuItem onClick={() => handleUpdateOrderStatus(actionMenuOrder!.id!, 'confirmed')}>
              <CheckCircleIcon sx={{ mr: 1 }} />
              Mark as Confirmed
            </MuiMenuItem>
          )}
          {['confirmed', 'partially_received'].includes(actionMenuOrder?.status || '') && (
            <MuiMenuItem onClick={() => handleUpdateOrderStatus(actionMenuOrder!.id!, 'completed')}>
              <ShippingIcon sx={{ mr: 1 }} />
              Mark as Received
            </MuiMenuItem>
          )}
        </Menu>

        {loading && (
          <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
            <LinearProgress />
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
}