"use client";

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalShipping as LocalShippingIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { Order, OrderStatus, PaymentStatus } from '@/types/order';
import { formatCurrency } from '@/utils/numberUtils';
import { formatDate } from '@/utils/dateUtils';

interface BulkOrderOperationsProps {
  orders: Order[];
  selectedOrders: string[];
  onSelectionChange: (orderIds: string[]) => void;
  onBulkOperation: (operation: BulkOperation, data?: any) => Promise<void>;
  loading?: boolean;
}

interface BulkOperation {
  type: 'status_update' | 'payment_update' | 'cancel' | 'delete' | 'export' | 'print' | 'email';
  label: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  requiresConfirmation?: boolean;
  requiresInput?: boolean;
}

const bulkOperations: BulkOperation[] = [
  {
    type: 'status_update',
    label: 'Update Status',
    icon: <EditIcon />,
    color: 'primary',
    requiresInput: true
  },
  {
    type: 'payment_update',
    label: 'Update Payment',
    icon: <CheckCircleIcon />,
    color: 'success',
    requiresInput: true
  },
  {
    type: 'cancel',
    label: 'Cancel Orders',
    icon: <CancelIcon />,
    color: 'error',
    requiresConfirmation: true
  },
  {
    type: 'delete',
    label: 'Delete Orders',
    icon: <DeleteIcon />,
    color: 'error',
    requiresConfirmation: true
  },
  {
    type: 'export',
    label: 'Export Data',
    icon: <DownloadIcon />,
    color: 'info'
  },
  {
    type: 'print',
    label: 'Print Orders',
    icon: <PrintIcon />,
    color: 'secondary'
  },
  {
    type: 'email',
    label: 'Send Emails',
    icon: <EmailIcon />,
    color: 'primary',
    requiresInput: true
  }
];

export default function BulkOrderOperations({
  orders,
  selectedOrders,
  onSelectionChange,
  onBulkOperation,
  loading = false
}: BulkOrderOperationsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<BulkOperation | null>(null);
  const [operationData, setOperationData] = useState<any>({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id!));
  const allSelected = orders.length > 0 && selectedOrders.length === orders.length;
  const someSelected = selectedOrders.length > 0 && selectedOrders.length < orders.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(orders.map(order => order.id!));
    }
  };

  const handleOperationClick = (operation: BulkOperation) => {
    if (selectedOrders.length === 0) {
      return;
    }

    setCurrentOperation(operation);
    setOperationData({});
    setResults(null);
    setDialogOpen(true);
  };

  const handleExecuteOperation = async () => {
    if (!currentOperation) return;

    try {
      setProcessing(true);
      setProgress(0);

      // Simulate progress for operations that take time
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onBulkOperation(currentOperation, operationData);

      clearInterval(progressInterval);
      setProgress(100);

      // Simulate results
      setResults({
        success: selectedOrders.length,
        failed: 0,
        errors: []
      });

      setTimeout(() => {
        setDialogOpen(false);
        setProcessing(false);
        setProgress(0);
      }, 1500);
    } catch (error) {
      setProcessing(false);
      setProgress(0);
      setResults({
        success: 0,
        failed: selectedOrders.length,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      });
    }
  };

  const renderOperationDialog = () => {
    if (!currentOperation) return null;

    const renderOperationContent = () => {
      switch (currentOperation.type) {
        case 'status_update':
          return (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={operationData.status || ''}
                  onChange={(e) => setOperationData({ ...operationData, status: e.target.value })}
                  label="New Status"
                >
                  <MenuItem value={OrderStatus.PENDING}>Pending</MenuItem>
                  <MenuItem value={OrderStatus.CONFIRMED}>Confirmed</MenuItem>
                  <MenuItem value={OrderStatus.PROCESSING}>Processing</MenuItem>
                  <MenuItem value={OrderStatus.PICKING}>Picking</MenuItem>
                  <MenuItem value={OrderStatus.PACKED}>Packed</MenuItem>
                  <MenuItem value={OrderStatus.SHIPPED}>Shipped</MenuItem>
                  <MenuItem value={OrderStatus.DELIVERED}>Delivered</MenuItem>
                  <MenuItem value={OrderStatus.COMPLETED}>Completed</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={operationData.notes || ''}
                onChange={(e) => setOperationData({ ...operationData, notes: e.target.value })}
                placeholder="Add notes about this status update..."
              />
            </Box>
          );

        case 'payment_update':
          return (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={operationData.paymentStatus || ''}
                  onChange={(e) => setOperationData({ ...operationData, paymentStatus: e.target.value })}
                  label="Payment Status"
                >
                  <MenuItem value={PaymentStatus.PENDING}>Pending</MenuItem>
                  <MenuItem value={PaymentStatus.AUTHORIZED}>Authorized</MenuItem>
                  <MenuItem value={PaymentStatus.PARTIAL}>Partial</MenuItem>
                  <MenuItem value={PaymentStatus.PAID}>Paid</MenuItem>
                  <MenuItem value={PaymentStatus.FAILED}>Failed</MenuItem>
                  <MenuItem value={PaymentStatus.REFUNDED}>Refunded</MenuItem>
                </Select>
              </FormControl>
              {operationData.paymentStatus === PaymentStatus.PARTIAL && (
                <TextField
                  fullWidth
                  label="Paid Amount"
                  type="number"
                  value={operationData.paidAmount || ''}
                  onChange={(e) => setOperationData({ ...operationData, paidAmount: e.target.value })}
                  sx={{ mb: 2 }}
                />
              )}
              <TextField
                fullWidth
                label="Transaction ID (Optional)"
                value={operationData.transactionId || ''}
                onChange={(e) => setOperationData({ ...operationData, transactionId: e.target.value })}
              />
            </Box>
          );

        case 'email':
          return (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Email Template</InputLabel>
                <Select
                  value={operationData.template || ''}
                  onChange={(e) => setOperationData({ ...operationData, template: e.target.value })}
                  label="Email Template"
                >
                  <MenuItem value="order_confirmation">Order Confirmation</MenuItem>
                  <MenuItem value="shipping_notification">Shipping Notification</MenuItem>
                  <MenuItem value="delivery_confirmation">Delivery Confirmation</MenuItem>
                  <MenuItem value="payment_reminder">Payment Reminder</MenuItem>
                  <MenuItem value="custom">Custom Message</MenuItem>
                </Select>
              </FormControl>
              {operationData.template === 'custom' && (
                <>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={operationData.subject || ''}
                    onChange={(e) => setOperationData({ ...operationData, subject: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Message"
                    multiline
                    rows={4}
                    value={operationData.message || ''}
                    onChange={(e) => setOperationData({ ...operationData, message: e.target.value })}
                  />
                </>
              )}
            </Box>
          );

        default:
          return null;
      }
    };

    return (
      <Dialog 
        open={dialogOpen} 
        onClose={() => !processing && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {currentOperation.icon}
              <Typography variant="h6" sx={{ ml: 1 }}>
                {currentOperation.label}
              </Typography>
            </Box>
            {!processing && (
              <IconButton onClick={() => setDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          {processing ? (
            <Box sx={{ py: 3 }}>
              <Typography variant="body1" gutterBottom>
                Processing {selectedOrders.length} orders...
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ mb: 2, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary">
                {progress < 100 ? 'Please wait...' : 'Operation completed!'}
              </Typography>
            </Box>
          ) : results ? (
            <Box sx={{ py: 2 }}>
              <Alert 
                severity={results.failed === 0 ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              >
                Operation completed: {results.success} successful, {results.failed} failed
              </Alert>
              {results.errors.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Errors:
                  </Typography>
                  {results.errors.map((error, index) => (
                    <Typography key={index} variant="body2" color="error" gutterBottom>
                      • {error}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              {/* Selected Orders Summary */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Selected Orders ({selectedOrders.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {selectedOrdersData.slice(0, 5).map(order => (
                      <Chip
                        key={order.id}
                        label={order.orderNumber}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {selectedOrdersData.length > 5 && (
                      <Chip
                        label={`+${selectedOrdersData.length - 5} more`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Value: {formatCurrency(selectedOrdersData.reduce((sum, order) => sum + order.total, 0))}
                  </Typography>
                </CardContent>
              </Card>

              {/* Operation-specific content */}
              {renderOperationContent()}

              {/* Confirmation for destructive operations */}
              {currentOperation.requiresConfirmation && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    This action cannot be undone. Are you sure you want to {currentOperation.label.toLowerCase()} {selectedOrders.length} order(s)?
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        {!processing && !results && (
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleExecuteOperation}
              color={currentOperation.color}
              disabled={
                (currentOperation.requiresInput && !operationData.status && !operationData.paymentStatus && !operationData.template) ||
                selectedOrders.length === 0
              }
            >
              {currentOperation.label}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    );
  };

  return (
    <Box>
      {/* Bulk Operations Toolbar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={handleSelectAll}
              icon={<CheckBoxOutlineBlankIcon />}
              checkedIcon={<CheckBoxIcon />}
            />
            <Typography variant="body2" color="text.secondary">
              {selectedOrders.length === 0 
                ? `Select orders (${orders.length} total)`
                : `${selectedOrders.length} of ${orders.length} selected`
              }
            </Typography>
            {selectedOrders.length > 0 && (
              <Chip
                label={`Total: ${formatCurrency(selectedOrdersData.reduce((sum, order) => sum + order.total, 0))}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {bulkOperations.map((operation) => (
              <Tooltip key={operation.type} title={operation.label}>
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={operation.icon}
                    onClick={() => handleOperationClick(operation)}
                    disabled={selectedOrders.length === 0 || loading}
                    color={operation.color}
                    sx={{ minWidth: 'auto' }}
                  >
                    {operation.label}
                  </Button>
                </span>
              </Tooltip>
            ))}
          </Box>
        </Box>

        {/* Quick Actions for Common Operations */}
        {selectedOrders.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Quick Actions:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleOperationClick({
                  type: 'status_update',
                  label: 'Mark as Completed',
                  icon: <CheckCircleIcon />
                })}
              >
                Mark Completed
              </Button>
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<LocalShippingIcon />}
                onClick={() => handleOperationClick({
                  type: 'status_update',
                  label: 'Mark as Shipped',
                  icon: <LocalShippingIcon />
                })}
              >
                Mark Shipped
              </Button>
              <Button
                size="small"
                variant="contained"
                color="info"
                startIcon={<PrintIcon />}
                onClick={() => handleOperationClick({
                  type: 'print',
                  label: 'Print Orders',
                  icon: <PrintIcon />
                })}
              >
                Print All
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Operation Dialog */}
      {renderOperationDialog()}

      {/* Selection Summary */}
      {selectedOrders.length > 0 && (
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              Selected Orders Summary ({selectedOrders.length} orders)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary.main">
                      {selectedOrders.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Orders Selected
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(selectedOrdersData.reduce((sum, order) => sum + order.total, 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Value
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="info.main">
                      {selectedOrdersData.filter(o => o.status === OrderStatus.PENDING).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Orders
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="warning.main">
                      {selectedOrdersData.filter(o => o.paymentStatus === PaymentStatus.PENDING).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payment Pending
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}"use client";

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalShipping as LocalShippingIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { Order, OrderStatus, PaymentStatus } from '@/types/order';
import { formatCurrency } from '@/utils/numberUtils';
import { formatDate } from '@/utils/dateUtils';

interface BulkOrderOperationsProps {
  orders: Order[];
  selectedOrders: string[];
  onSelectionChange: (orderIds: string[]) => void;
  onBulkOperation: (operation: BulkOperation, data?: any) => Promise<void>;
  loading?: boolean;
}

interface BulkOperation {
  type: 'status_update' | 'payment_update' | 'cancel' | 'delete' | 'export' | 'print' | 'email';
  label: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  requiresConfirmation?: boolean;
  requiresInput?: boolean;
}

const bulkOperations: BulkOperation[] = [
  {
    type: 'status_update',
    label: 'Update Status',
    icon: <EditIcon />,
    color: 'primary',
    requiresInput: true
  },
  {
    type: 'payment_update',
    label: 'Update Payment',
    icon: <CheckCircleIcon />,
    color: 'success',
    requiresInput: true
  },
  {
    type: 'cancel',
    label: 'Cancel Orders',
    icon: <CancelIcon />,
    color: 'error',
    requiresConfirmation: true
  },
  {
    type: 'delete',
    label: 'Delete Orders',
    icon: <DeleteIcon />,
    color: 'error',
    requiresConfirmation: true
  },
  {
    type: 'export',
    label: 'Export Data',
    icon: <DownloadIcon />,
    color: 'info'
  },
  {
    type: 'print',
    label: 'Print Orders',
    icon: <PrintIcon />,
    color: 'secondary'
  },
  {
    type: 'email',
    label: 'Send Emails',
    icon: <EmailIcon />,
    color: 'primary',
    requiresInput: true
  }
];

export default function BulkOrderOperations({
  orders,
  selectedOrders,
  onSelectionChange,
  onBulkOperation,
  loading = false
}: BulkOrderOperationsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<BulkOperation | null>(null);
  const [operationData, setOperationData] = useState<any>({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id!));
  const allSelected = orders.length > 0 && selectedOrders.length === orders.length;
  const someSelected = selectedOrders.length > 0 && selectedOrders.length < orders.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(orders.map(order => order.id!));
    }
  };

  const handleOperationClick = (operation: BulkOperation) => {
    if (selectedOrders.length === 0) {
      return;
    }

    setCurrentOperation(operation);
    setOperationData({});
    setResults(null);
    setDialogOpen(true);
  };

  const handleExecuteOperation = async () => {
    if (!currentOperation) return;

    try {
      setProcessing(true);
      setProgress(0);

      // Simulate progress for operations that take time
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onBulkOperation(currentOperation, operationData);

      clearInterval(progressInterval);
      setProgress(100);

      // Simulate results
      setResults({
        success: selectedOrders.length,
        failed: 0,
        errors: []
      });

      setTimeout(() => {
        setDialogOpen(false);
        setProcessing(false);
        setProgress(0);
      }, 1500);
    } catch (error) {
      setProcessing(false);
      setProgress(0);
      setResults({
        success: 0,
        failed: selectedOrders.length,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      });
    }
  };

  const renderOperationDialog = () => {
    if (!currentOperation) return null;

    const renderOperationContent = () => {
      switch (currentOperation.type) {
        case 'status_update':
          return (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={operationData.status || ''}
                  onChange={(e) => setOperationData({ ...operationData, status: e.target.value })}
                  label="New Status"
                >
                  <MenuItem value={OrderStatus.PENDING}>Pending</MenuItem>
                  <MenuItem value={OrderStatus.CONFIRMED}>Confirmed</MenuItem>
                  <MenuItem value={OrderStatus.PROCESSING}>Processing</MenuItem>
                  <MenuItem value={OrderStatus.PICKING}>Picking</MenuItem>
                  <MenuItem value={OrderStatus.PACKED}>Packed</MenuItem>
                  <MenuItem value={OrderStatus.SHIPPED}>Shipped</MenuItem>
                  <MenuItem value={OrderStatus.DELIVERED}>Delivered</MenuItem>
                  <MenuItem value={OrderStatus.COMPLETED}>Completed</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={operationData.notes || ''}
                onChange={(e) => setOperationData({ ...operationData, notes: e.target.value })}
                placeholder="Add notes about this status update..."
              />
            </Box>
          );

        case 'payment_update':
          return (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={operationData.paymentStatus || ''}
                  onChange={(e) => setOperationData({ ...operationData, paymentStatus: e.target.value })}
                  label="Payment Status"
                >
                  <MenuItem value={PaymentStatus.PENDING}>Pending</MenuItem>
                  <MenuItem value={PaymentStatus.AUTHORIZED}>Authorized</MenuItem>
                  <MenuItem value={PaymentStatus.PARTIAL}>Partial</MenuItem>
                  <MenuItem value={PaymentStatus.PAID}>Paid</MenuItem>
                  <MenuItem value={PaymentStatus.FAILED}>Failed</MenuItem>
                  <MenuItem value={PaymentStatus.REFUNDED}>Refunded</MenuItem>
                </Select>
              </FormControl>
              {operationData.paymentStatus === PaymentStatus.PARTIAL && (
                <TextField
                  fullWidth
                  label="Paid Amount"
                  type="number"
                  value={operationData.paidAmount || ''}
                  onChange={(e) => setOperationData({ ...operationData, paidAmount: e.target.value })}
                  sx={{ mb: 2 }}
                />
              )}
              <TextField
                fullWidth
                label="Transaction ID (Optional)"
                value={operationData.transactionId || ''}
                onChange={(e) => setOperationData({ ...operationData, transactionId: e.target.value })}
              />
            </Box>
          );

        case 'email':
          return (
            <Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Email Template</InputLabel>
                <Select
                  value={operationData.template || ''}
                  onChange={(e) => setOperationData({ ...operationData, template: e.target.value })}
                  label="Email Template"
                >
                  <MenuItem value="order_confirmation">Order Confirmation</MenuItem>
                  <MenuItem value="shipping_notification">Shipping Notification</MenuItem>
                  <MenuItem value="delivery_confirmation">Delivery Confirmation</MenuItem>
                  <MenuItem value="payment_reminder">Payment Reminder</MenuItem>
                  <MenuItem value="custom">Custom Message</MenuItem>
                </Select>
              </FormControl>
              {operationData.template === 'custom' && (
                <>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={operationData.subject || ''}
                    onChange={(e) => setOperationData({ ...operationData, subject: e.target.value })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Message"
                    multiline
                    rows={4}
                    value={operationData.message || ''}
                    onChange={(e) => setOperationData({ ...operationData, message: e.target.value })}
                  />
                </>
              )}
            </Box>
          );

        default:
          return null;
      }
    };

    return (
      <Dialog 
        open={dialogOpen} 
        onClose={() => !processing && setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {currentOperation.icon}
              <Typography variant="h6" sx={{ ml: 1 }}>
                {currentOperation.label}
              </Typography>
            </Box>
            {!processing && (
              <IconButton onClick={() => setDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          {processing ? (
            <Box sx={{ py: 3 }}>
              <Typography variant="body1" gutterBottom>
                Processing {selectedOrders.length} orders...
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ mb: 2, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary">
                {progress < 100 ? 'Please wait...' : 'Operation completed!'}
              </Typography>
            </Box>
          ) : results ? (
            <Box sx={{ py: 2 }}>
              <Alert 
                severity={results.failed === 0 ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              >
                Operation completed: {results.success} successful, {results.failed} failed
              </Alert>
              {results.errors.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Errors:
                  </Typography>
                  {results.errors.map((error, index) => (
                    <Typography key={index} variant="body2" color="error" gutterBottom>
                      • {error}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              {/* Selected Orders Summary */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Selected Orders ({selectedOrders.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {selectedOrdersData.slice(0, 5).map(order => (
                      <Chip
                        key={order.id}
                        label={order.orderNumber}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {selectedOrdersData.length > 5 && (
                      <Chip
                        label={`+${selectedOrdersData.length - 5} more`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Value: {formatCurrency(selectedOrdersData.reduce((sum, order) => sum + order.total, 0))}
                  </Typography>
                </CardContent>
              </Card>

              {/* Operation-specific content */}
              {renderOperationContent()}

              {/* Confirmation for destructive operations */}
              {currentOperation.requiresConfirmation && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    This action cannot be undone. Are you sure you want to {currentOperation.label.toLowerCase()} {selectedOrders.length} order(s)?
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        {!processing && !results && (
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleExecuteOperation}
              color={currentOperation.color}
              disabled={
                (currentOperation.requiresInput && !operationData.status && !operationData.paymentStatus && !operationData.template) ||
                selectedOrders.length === 0
              }
            >
              {currentOperation.label}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    );
  };

  return (
    <Box>
      {/* Bulk Operations Toolbar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={handleSelectAll}
              icon={<CheckBoxOutlineBlankIcon />}
              checkedIcon={<CheckBoxIcon />}
            />
            <Typography variant="body2" color="text.secondary">
              {selectedOrders.length === 0 
                ? `Select orders (${orders.length} total)`
                : `${selectedOrders.length} of ${orders.length} selected`
              }
            </Typography>
            {selectedOrders.length > 0 && (
              <Chip
                label={`Total: ${formatCurrency(selectedOrdersData.reduce((sum, order) => sum + order.total, 0))}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {bulkOperations.map((operation) => (
              <Tooltip key={operation.type} title={operation.label}>
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={operation.icon}
                    onClick={() => handleOperationClick(operation)}
                    disabled={selectedOrders.length === 0 || loading}
                    color={operation.color}
                    sx={{ minWidth: 'auto' }}
                  >
                    {operation.label}
                  </Button>
                </span>
              </Tooltip>
            ))}
          </Box>
        </Box>

        {/* Quick Actions for Common Operations */}
        {selectedOrders.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Quick Actions:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleOperationClick({
                  type: 'status_update',
                  label: 'Mark as Completed',
                  icon: <CheckCircleIcon />
                })}
              >
                Mark Completed
              </Button>
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<LocalShippingIcon />}
                onClick={() => handleOperationClick({
                  type: 'status_update',
                  label: 'Mark as Shipped',
                  icon: <LocalShippingIcon />
                })}
              >
                Mark Shipped
              </Button>
              <Button
                size="small"
                variant="contained"
                color="info"
                startIcon={<PrintIcon />}
                onClick={() => handleOperationClick({
                  type: 'print',
                  label: 'Print Orders',
                  icon: <PrintIcon />
                })}
              >
                Print All
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Operation Dialog */}
      {renderOperationDialog()}

      {/* Selection Summary */}
      {selectedOrders.length > 0 && (
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              Selected Orders Summary ({selectedOrders.length} orders)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary.main">
                      {selectedOrders.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Orders Selected
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(selectedOrdersData.reduce((sum, order) => sum + order.total, 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Value
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="info.main">
                      {selectedOrdersData.filter(o => o.status === OrderStatus.PENDING).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Orders
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="warning.main">
                      {selectedOrdersData.filter(o => o.paymentStatus === PaymentStatus.PENDING).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payment Pending
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}