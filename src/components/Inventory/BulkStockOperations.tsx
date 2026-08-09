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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  Autocomplete
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  SwapHoriz as SwapHorizIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/inventory';
import { productService } from '@/services/productService';
import { StockManagementService, BulkStockUpdate } from '@/services/stockManagementService';
import { EnhancedInventoryTrackingService, StockAdjustment } from '@/services/enhancedInventoryTrackingService';

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
      id={`bulk-tabpanel-${index}`}
      aria-labelledby={`bulk-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface BulkUpdateItem {
  productId: string;
  productName: string;
  currentQuantity: number;
  newQuantity: number;
  adjustment: number;
  reason: string;
  selected: boolean;
}

interface CycleCountItem {
  productId: string;
  productName: string;
  expectedQuantity: number;
  actualQuantity: number;
  variance: number;
  notes: string;
  counted: boolean;
}

export default function BulkStockOperations() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Bulk Update State
  const [bulkUpdateItems, setBulkUpdateItems] = useState<BulkUpdateItem[]>([]);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [bulkUpdateReason, setBulkUpdateReason] = useState('');
  const [bulkUpdateType, setBulkUpdateType] = useState<'add' | 'subtract' | 'set'>('add');
  const [bulkUpdateValue, setBulkUpdateValue] = useState<number>(0);
  
  // Cycle Count State
  const [cycleCountItems, setCycleCountItems] = useState<CycleCountItem[]>([]);
  const [cycleCountDialogOpen, setCycleCountDialogOpen] = useState(false);
  const [cycleCountStep, setCycleCountStep] = useState(0);
  
  // Import/Export State
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<string>('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  
  // Results State
  const [operationResults, setOperationResults] = useState<{
    success: number;
    failed: number;
    errors: Array<{ productId: string; error: string }>;
  } | null>(null);

  // Load products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData);
      
      // Initialize bulk update items
      setBulkUpdateItems(productsData.map(product => ({
        productId: product.id!,
        productName: product.name,
        currentQuantity: product.quantity || 0,
        newQuantity: product.quantity || 0,
        adjustment: 0,
        reason: '',
        selected: false
      })));
      
      // Initialize cycle count items
      setCycleCountItems(productsData.map(product => ({
        productId: product.id!,
        productName: product.name,
        expectedQuantity: product.quantity || 0,
        actualQuantity: product.quantity || 0,
        variance: 0,
        notes: '',
        counted: false
      })));
      
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Bulk Update Functions
  const handleBulkUpdateItemChange = (productId: string, field: keyof BulkUpdateItem, value: any) => {
    setBulkUpdateItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const updated = { ...item, [field]: value };
        if (field === 'newQuantity') {
          updated.adjustment = value - item.currentQuantity;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSelectAllBulkUpdate = () => {
    const allSelected = bulkUpdateItems.every(item => item.selected);
    setBulkUpdateItems(prev => prev.map(item => ({ ...item, selected: !allSelected })));
  };

  const applyBulkOperation = () => {
    setBulkUpdateItems(prev => prev.map(item => {
      if (item.selected) {
        let newQuantity: number;
        switch (bulkUpdateType) {
          case 'add':
            newQuantity = item.currentQuantity + bulkUpdateValue;
            break;
          case 'subtract':
            newQuantity = Math.max(0, item.currentQuantity - bulkUpdateValue);
            break;
          case 'set':
            newQuantity = bulkUpdateValue;
            break;
          default:
            newQuantity = item.currentQuantity;
        }
        return {
          ...item,
          newQuantity,
          adjustment: newQuantity - item.currentQuantity,
          reason: bulkUpdateReason
        };
      }
      return item;
    }));
  };

  const executeBulkUpdate = async () => {
    const selectedItems = bulkUpdateItems.filter(item => item.selected && item.adjustment !== 0);
    
    if (selectedItems.length === 0) {
      alert('No items selected for update');
      return;
    }

    setLoading(true);
    try {
      const updates: BulkStockUpdate[] = selectedItems.map(item => ({
        productId: item.productId,
        newQuantity: item.newQuantity,
        reason: item.reason || bulkUpdateReason
      }));

      const result = await StockManagementService.bulkUpdateStock(
        updates,
        bulkUpdateReason,
        'adjustment',
        `BULK-${Date.now()}`,
        user?.uid
      );

      setOperationResults(result);
      setBulkUpdateDialogOpen(false);
      await loadProducts(); // Refresh data
      
    } catch (error) {
      console.error('Error executing bulk update:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cycle Count Functions
  const handleCycleCountItemChange = (productId: string, field: keyof CycleCountItem, value: any) => {
    setCycleCountItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const updated = { ...item, [field]: value };
        if (field === 'actualQuantity') {
          updated.variance = value - item.expectedQuantity;
        }
        return updated;
      }
      return item;
    }));
  };

  const executeCycleCount = async () => {
    const countedItems = cycleCountItems.filter(item => item.counted);
    
    if (countedItems.length === 0) {
      alert('No items counted');
      return;
    }

    setLoading(true);
    try {
      const countData = countedItems.map(item => ({
        productId: item.productId,
        expectedQuantity: item.expectedQuantity,
        actualQuantity: item.actualQuantity,
        notes: item.notes,
        countedBy: user?.displayName || user?.email
      }));

      const result = await EnhancedInventoryTrackingService.performCycleCount(countData);
      
      setOperationResults({
        success: result.variances.length,
        failed: 0,
        errors: []
      });
      
      setCycleCountDialogOpen(false);
      await loadProducts(); // Refresh data
      
    } catch (error) {
      console.error('Error executing cycle count:', error);
    } finally {
      setLoading(false);
    }
  };

  // Import/Export Functions
  const handleImportData = () => {
    try {
      const lines = importData.trim().split('\n');
      const errors: string[] = [];
      const updates: BulkUpdateItem[] = [];

      lines.forEach((line, index) => {
        const [productName, quantity] = line.split(',').map(s => s.trim());
        
        if (!productName || !quantity) {
          errors.push(`Line ${index + 1}: Invalid format`);
          return;
        }

        const product = products.find(p => 
          p.name.toLowerCase() === productName.toLowerCase() ||
          p.sku === productName
        );

        if (!product) {
          errors.push(`Line ${index + 1}: Product "${productName}" not found`);
          return;
        }

        const newQuantity = parseInt(quantity);
        if (isNaN(newQuantity) || newQuantity < 0) {
          errors.push(`Line ${index + 1}: Invalid quantity "${quantity}"`);
          return;
        }

        updates.push({
          productId: product.id!,
          productName: product.name,
          currentQuantity: product.quantity || 0,
          newQuantity,
          adjustment: newQuantity - (product.quantity || 0),
          reason: 'Bulk import',
          selected: true
        });
      });

      setImportErrors(errors);
      
      if (errors.length === 0) {
        setBulkUpdateItems(prev => prev.map(item => {
          const update = updates.find(u => u.productId === item.productId);
          return update || item;
        }));
        setImportDialogOpen(false);
      }
      
    } catch (error) {
      setImportErrors(['Failed to parse import data']);
    }
  };

  const exportStockData = () => {
    const csvData = products.map(product => 
      `${product.name},${product.sku || ''},${product.quantity || 0}`
    ).join('\n');
    
    const header = 'Product Name,SKU,Current Quantity\n';
    const blob = new Blob([header + csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Bulk Stock Operations
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportStockData}
          >
            Export Stock
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadProducts}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* Results Alert */}
      {operationResults && (
        <Alert 
          severity={operationResults.failed > 0 ? 'warning' : 'success'} 
          sx={{ mb: 3 }}
          onClose={() => setOperationResults(null)}
        >
          <Typography variant="body2">
            Operation completed: {operationResults.success} successful, {operationResults.failed} failed
          </Typography>
          {operationResults.errors.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {operationResults.errors.slice(0, 3).map((error, index) => (
                <Typography key={index} variant="caption" display="block">
                  • {error.error}
                </Typography>
              ))}
              {operationResults.errors.length > 3 && (
                <Typography variant="caption">
                  ... and {operationResults.errors.length - 3} more errors
                </Typography>
              )}
            </Box>
          )}
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Bulk Stock Update" />
            <Tab label="Cycle Count" />
            <Tab label="Import/Export" />
          </Tabs>
        </Box>

        {/* Bulk Stock Update Tab */}
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            {/* Bulk Operations Controls */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bulk Operations
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Operation</InputLabel>
                      <Select
                        value={bulkUpdateType}
                        onChange={(e) => setBulkUpdateType(e.target.value as any)}
                      >
                        <MenuItem value="add">Add Quantity</MenuItem>
                        <MenuItem value="subtract">Subtract Quantity</MenuItem>
                        <MenuItem value="set">Set Quantity</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Value"
                      value={bulkUpdateValue}
                      onChange={(e) => setBulkUpdateValue(Number(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Reason"
                      value={bulkUpdateReason}
                      onChange={(e) => setBulkUpdateReason(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        onClick={applyBulkOperation}
                        disabled={!bulkUpdateReason || bulkUpdateItems.filter(i => i.selected).length === 0}
                      >
                        Apply
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => setBulkUpdateDialogOpen(true)}
                        disabled={bulkUpdateItems.filter(i => i.selected && i.adjustment !== 0).length === 0}
                      >
                        Execute
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Products Table */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={bulkUpdateItems.length > 0 && bulkUpdateItems.every(item => item.selected)}
                        indeterminate={bulkUpdateItems.some(item => item.selected) && !bulkUpdateItems.every(item => item.selected)}
                        onChange={handleSelectAllBulkUpdate}
                      />
                    </TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Current</TableCell>
                    <TableCell align="right">New Quantity</TableCell>
                    <TableCell align="right">Adjustment</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bulkUpdateItems.map((item) => (
                    <TableRow key={item.productId} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={item.selected}
                          onChange={(e) => handleBulkUpdateItemChange(item.productId, 'selected', e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.productName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {item.currentQuantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.newQuantity}
                          onChange={(e) => handleBulkUpdateItemChange(item.productId, 'newQuantity', Number(e.target.value))}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={item.adjustment >= 0 ? `+${item.adjustment}` : item.adjustment}
                          color={item.adjustment > 0 ? 'success' : item.adjustment < 0 ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.reason}
                          onChange={(e) => handleBulkUpdateItemChange(item.productId, 'reason', e.target.value)}
                          placeholder="Reason for adjustment"
                          sx={{ width: 200 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </TabPanel>

        {/* Cycle Count Tab */}
        <TabPanel value={tabValue} index={1}>
          <Stack spacing={3}>
            {/* Cycle Count Controls */}
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    Physical Stock Count
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setCycleCountDialogOpen(true)}
                    disabled={cycleCountItems.filter(i => i.counted && i.variance !== 0).length === 0}
                  >
                    Process Count
                  </Button>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Enter actual quantities found during physical count
                </Typography>
              </CardContent>
            </Card>

            {/* Cycle Count Table */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Expected</TableCell>
                    <TableCell align="right">Actual</TableCell>
                    <TableCell align="right">Variance</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="center">Counted</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cycleCountItems.map((item) => (
                    <TableRow key={item.productId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.productName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {item.expectedQuantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.actualQuantity}
                          onChange={(e) => handleCycleCountItemChange(item.productId, 'actualQuantity', Number(e.target.value))}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={item.variance >= 0 ? `+${item.variance}` : item.variance}
                          color={item.variance > 0 ? 'success' : item.variance < 0 ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={item.notes}
                          onChange={(e) => handleCycleCountItemChange(item.productId, 'notes', e.target.value)}
                          placeholder="Count notes"
                          sx={{ width: 200 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={item.counted}
                          onChange={(e) => handleCycleCountItemChange(item.productId, 'counted', e.target.checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </TabPanel>

        {/* Import/Export Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Import Stock Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Import stock quantities from CSV format: Product Name, Quantity
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      multiline
                      rows={8}
                      fullWidth
                      placeholder="Product A, 100&#10;Product B, 50&#10;SKU123, 25"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => setImportDialogOpen(true)}
                      disabled={!importData.trim()}
                    >
                      Import Data
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Export Stock Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Export current stock levels to CSV file
                  </Typography>
                  <Stack spacing={2}>
                    <Alert severity="info">
                      Export includes: Product Name, SKU, Current Quantity
                    </Alert>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={exportStockData}
                    >
                      Export to CSV
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Bulk Update Confirmation Dialog */}
      <Dialog
        open={bulkUpdateDialogOpen}
        onClose={() => setBulkUpdateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Confirm Bulk Stock Update</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are about to update {bulkUpdateItems.filter(i => i.selected && i.adjustment !== 0).length} products.
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Current</TableCell>
                  <TableCell align="right">New</TableCell>
                  <TableCell align="right">Change</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bulkUpdateItems
                  .filter(item => item.selected && item.adjustment !== 0)
                  .slice(0, 10)
                  .map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell align="right">{item.currentQuantity}</TableCell>
                      <TableCell align="right">{item.newQuantity}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={item.adjustment >= 0 ? `+${item.adjustment}` : item.adjustment}
                          color={item.adjustment > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          {bulkUpdateItems.filter(i => i.selected && i.adjustment !== 0).length > 10 && (
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              ... and {bulkUpdateItems.filter(i => i.selected && i.adjustment !== 0).length - 10} more items
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkUpdateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={executeBulkUpdate}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cycle Count Confirmation Dialog */}
      <Dialog
        open={cycleCountDialogOpen}
        onClose={() => setCycleCountDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Process Cycle Count</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Processing count for {cycleCountItems.filter(i => i.counted && i.variance !== 0).length} products with variances.
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Expected</TableCell>
                  <TableCell align="right">Actual</TableCell>
                  <TableCell align="right">Variance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cycleCountItems
                  .filter(item => item.counted && item.variance !== 0)
                  .map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell align="right">{item.expectedQuantity}</TableCell>
                      <TableCell align="right">{item.actualQuantity}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={item.variance >= 0 ? `+${item.variance}` : item.variance}
                          color={item.variance > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCycleCountDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={executeCycleCount}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Process Count'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Confirmation Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Import</DialogTitle>
        <DialogContent>
          {importErrors.length > 0 ? (
            <Stack spacing={2}>
              <Alert severity="error">
                Found {importErrors.length} error(s) in import data:
              </Alert>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {importErrors.map((error, index) => (
                  <Typography key={index} variant="body2" color="error">
                    • {error}
                  </Typography>
                ))}
              </Box>
            </Stack>
          ) : (
            <Typography variant="body2">
              Ready to import stock data. This will update the bulk update table with the imported quantities.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>
            Cancel
          </Button>
          {importErrors.length === 0 && (
            <Button
              variant="contained"
              onClick={handleImportData}
            >
              Import
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {loading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
}