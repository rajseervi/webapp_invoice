'use client';
import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  GetApp as ExportIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { Product, Category } from '@/types/inventory';
import { productService } from '@/services/productService';
import * as XLSX from 'xlsx';

interface ProductImportExportProps {
  products: Product[];
  categories: Category[];
  onImportSuccess: () => void;
  onShowSnackbar: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

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
      id={`import-export-tabpanel-${index}`}
      aria-labelledby={`import-export-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProductImportExport({ 
  products, 
  categories, 
  onImportSuccess, 
  onShowSnackbar 
}: ProductImportExportProps) {
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export options
  const [exportOptions, setExportOptions] = useState({
    format: 'xlsx',
    includeInactive: false,
    categoryFilter: '',
    fields: {
      basic: true,
      pricing: true,
      inventory: true,
      gst: true,
      advanced: false
    }
  });

  // Import options
  const [importOptions, setImportOptions] = useState({
    updateExisting: false,
    createCategories: true,
    skipErrors: true
  });

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Generate sample template
  const generateTemplate = () => {
    const template = [
      {
        name: 'Sample Product 1',
        description: 'This is a sample product description',
        categoryName: 'Electronics',
        price: 1000,
        quantity: 50,
        unitOfMeasurement: 'PCS',
        hsnCode: '85171200',
        gstRate: 18,
        isService: false,
        gstExempt: false,
        reorderPoint: 10,
        sku: 'SKU001',
        brand: 'Sample Brand',
        isActive: true
      },
      {
        name: 'Sample Product 2',
        description: 'Another sample product',
        categoryName: 'Clothing',
        price: 500,
        quantity: 100,
        unitOfMeasurement: 'PCS',
        hsnCode: '62051000',
        gstRate: 12,
        isService: false,
        gstExempt: false,
        reorderPoint: 20,
        sku: 'SKU002',
        brand: 'Sample Brand',
        isActive: true
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products Template');
    XLSX.writeFile(wb, 'products_template.xlsx');
    
    onShowSnackbar('Template downloaded successfully', 'success');
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        setPreviewData(jsonData);
        setShowPreview(true);
        onShowSnackbar(`Loaded ${jsonData.length} rows for preview`, 'info');
      } catch (error) {
        console.error('Error reading file:', error);
        onShowSnackbar('Error reading file. Please check the format.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle import
  const handleImport = async () => {
    if (previewData.length === 0) {
      onShowSnackbar('No data to import', 'warning');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const result = await productService.importProducts(previewData);
      setImportResult(result);
      setProgress(100);
      
      if (result.success > 0) {
        onShowSnackbar(`Successfully imported ${result.success} products`, 'success');
        onImportSuccess();
      }
      
      if (result.failed > 0) {
        onShowSnackbar(`${result.failed} products failed to import`, 'warning');
      }
    } catch (error) {
      console.error('Error importing products:', error);
      onShowSnackbar('Failed to import products', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = () => {
    let exportProducts = [...products];

    // Apply filters
    if (!exportOptions.includeInactive) {
      exportProducts = exportProducts.filter(p => p.isActive);
    }

    if (exportOptions.categoryFilter) {
      exportProducts = exportProducts.filter(p => p.categoryId === exportOptions.categoryFilter);
    }

    // Prepare data based on selected fields
    const exportData = exportProducts.map(product => {
      const categoryName = categories.find(c => c.id === product.categoryId)?.name || '';
      
      let data: any = {};

      if (exportOptions.fields.basic) {
        data = {
          ...data,
          name: product.name,
          description: product.description || '',
          categoryName,
          isActive: product.isActive
        };
      }

      if (exportOptions.fields.pricing) {
        data = {
          ...data,
          price: product.price,
          discountedPrice: product.discountedPrice || ''
        };
      }

      if (exportOptions.fields.inventory) {
        data = {
          ...data,
          quantity: product.quantity,
          unitOfMeasurement: product.unitOfMeasurement,
          reorderPoint: product.reorderPoint || '',
          maxStockLevel: product.maxStockLevel || '',
          minStockLevel: product.minStockLevel || ''
        };
      }

      if (exportOptions.fields.gst) {
        data = {
          ...data,
          hsnCode: product.hsnCode || '',
          sacCode: product.sacCode || '',
          gstRate: product.gstRate,
          gstExempt: product.gstExempt,
          cessRate: product.cessRate || '',
          isService: product.isService
        };
      }

      if (exportOptions.fields.advanced) {
        data = {
          ...data,
          sku: product.sku || '',
          barcode: product.barcode || '',
          brand: product.brand || '',
          model: product.model || '',
          weight: product.weight || '',
          tags: product.tags?.join(', ') || '',
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        };
      }

      return data;
    });

    // Generate file
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    const fileName = `products_export_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
    XLSX.writeFile(wb, fileName);

    onShowSnackbar(`Exported ${exportData.length} products successfully`, 'success');
    setExportDialogOpen(false);
  };

  // Clear preview
  const clearPreview = () => {
    setPreviewData([]);
    setShowPreview(false);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Import & Export Products
      </Typography>

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Import Products" icon={<UploadIcon />} />
        <Tab label="Export Products" icon={<DownloadIcon />} />
        <Tab label="Templates & Help" icon={<DescriptionIcon />} />
      </Tabs>

      {/* Import Tab */}
      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Upload Products File
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    fullWidth
                    size="large"
                  >
                    Choose File (Excel/CSV)
                  </Button>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  Supported formats: .xlsx, .xls, .csv
                  <br />
                  Maximum file size: 10MB
                </Alert>

                <Typography variant="subtitle2" gutterBottom>
                  Import Options:
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Update Existing Products</InputLabel>
                  <Select
                    value={importOptions.updateExisting.toString()}
                    label="Update Existing Products"
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      updateExisting: e.target.value === 'true'
                    })}
                  >
                    <MenuItem value="false">Create New Only</MenuItem>
                    <MenuItem value="true">Update if Exists</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Create Missing Categories</InputLabel>
                  <Select
                    value={importOptions.createCategories.toString()}
                    label="Create Missing Categories"
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      createCategories: e.target.value === 'true'
                    })}
                  >
                    <MenuItem value="true">Yes, Create Automatically</MenuItem>
                    <MenuItem value="false">No, Skip Missing</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Import Status
                </Typography>

                {loading && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress variant="determinate" value={progress} />
                    <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                      Importing products... {progress.toFixed(0)}%
                    </Typography>
                  </Box>
                )}

                {showPreview && !importResult && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Ready to import {previewData.length} products.
                      Please review the preview below and click Import to proceed.
                    </Typography>
                  </Alert>
                )}

                {importResult && (
                  <Box sx={{ mb: 2 }}>
                    <Alert severity={importResult.failed === 0 ? 'success' : 'warning'}>
                      <Typography variant="body2">
                        Import completed: {importResult.success} successful, {importResult.failed} failed
                      </Typography>
                    </Alert>
                    
                    {importResult.errors.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="error">
                          Errors:
                        </Typography>
                        <List dense>
                          {importResult.errors.slice(0, 5).map((error, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <ErrorIcon color="error" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={error} />
                            </ListItem>
                          ))}
                          {importResult.errors.length > 5 && (
                            <ListItem>
                              <ListItemText primary={`... and ${importResult.errors.length - 5} more errors`} />
                            </ListItem>
                          )}
                        </List>
                      </Box>
                    )}
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={handleImport}
                    disabled={!showPreview || loading}
                    fullWidth
                  >
                    Import Products
                  </Button>
                  
                  {showPreview && (
                    <Button
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={clearPreview}
                      disabled={loading}
                    >
                      Clear
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Preview Table */}
          {showPreview && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Import Preview ({previewData.length} rows)
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell>HSN Code</TableCell>
                          <TableCell align="right">GST Rate</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewData.slice(0, 10).map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.name || '-'}</TableCell>
                            <TableCell>{row.categoryName || '-'}</TableCell>
                            <TableCell align="right">{row.price || '-'}</TableCell>
                            <TableCell align="right">{row.quantity || '-'}</TableCell>
                            <TableCell>{row.hsnCode || '-'}</TableCell>
                            <TableCell align="right">{row.gstRate || '-'}%</TableCell>
                            <TableCell>
                              <Chip
                                label={row.name ? 'Valid' : 'Missing Name'}
                                color={row.name ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {previewData.length > 10 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              <Typography variant="body2" color="text.secondary">
                                ... and {previewData.length - 10} more rows
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Export Tab */}
      <TabPanel value={currentTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Export Options
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Export Format</InputLabel>
                  <Select
                    value={exportOptions.format}
                    label="Export Format"
                    onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value })}
                  >
                    <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                    <MenuItem value="csv">CSV (.csv)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Category Filter</InputLabel>
                  <Select
                    value={exportOptions.categoryFilter}
                    label="Category Filter"
                    onChange={(e) => setExportOptions({ ...exportOptions, categoryFilter: e.target.value })}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography variant="subtitle2" gutterBottom>
                  Include Fields:
                </Typography>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <FormControl component="fieldset">
                      <label>
                        <input
                          type="checkbox"
                          checked={exportOptions.fields.basic}
                          onChange={(e) => setExportOptions({
                            ...exportOptions,
                            fields: { ...exportOptions.fields, basic: e.target.checked }
                          })}
                        />
                        Basic Info
                      </label>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl component="fieldset">
                      <label>
                        <input
                          type="checkbox"
                          checked={exportOptions.fields.pricing}
                          onChange={(e) => setExportOptions({
                            ...exportOptions,
                            fields: { ...exportOptions.fields, pricing: e.target.checked }
                          })}
                        />
                        Pricing
                      </label>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl component="fieldset">
                      <label>
                        <input
                          type="checkbox"
                          checked={exportOptions.fields.inventory}
                          onChange={(e) => setExportOptions({
                            ...exportOptions,
                            fields: { ...exportOptions.fields, inventory: e.target.checked }
                          })}
                        />
                        Inventory
                      </label>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl component="fieldset">
                      <label>
                        <input
                          type="checkbox"
                          checked={exportOptions.fields.gst}
                          onChange={(e) => setExportOptions({
                            ...exportOptions,
                            fields: { ...exportOptions.fields, gst: e.target.checked }
                          })}
                        />
                        GST Details
                      </label>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <label>
                        <input
                          type="checkbox"
                          checked={exportOptions.fields.advanced}
                          onChange={(e) => setExportOptions({
                            ...exportOptions,
                            fields: { ...exportOptions.fields, advanced: e.target.checked }
                          })}
                        />
                        Advanced Fields (SKU, Barcode, etc.)
                      </label>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Export Summary
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Products to export: {
                      exportOptions.categoryFilter 
                        ? products.filter(p => p.categoryId === exportOptions.categoryFilter && (exportOptions.includeInactive || p.isActive)).length
                        : products.filter(p => exportOptions.includeInactive || p.isActive).length
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Format: {exportOptions.format.toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Include inactive: {exportOptions.includeInactive ? 'Yes' : 'No'}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<ExportIcon />}
                  onClick={handleExport}
                  fullWidth
                  size="large"
                >
                  Export Products
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Templates & Help Tab */}
      <TabPanel value={currentTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Download Templates
                </Typography>

                <Typography variant="body2" sx={{ mb: 3 }}>
                  Download pre-formatted templates to ensure your data imports correctly.
                </Typography>

                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={generateTemplate}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Download Excel Template
                </Button>

                <Alert severity="info">
                  The template includes sample data and all required columns for product import.
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Import Guidelines
                </Typography>

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Name and Price are required fields" />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon color="info" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Use categoryName to auto-create categories" />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="HSN codes should be valid for GST compliance" />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Boolean fields: true/false or 1/0" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Required Columns
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Column Name</TableCell>
                        <TableCell>Required</TableCell>
                        <TableCell>Data Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Example</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>name</TableCell>
                        <TableCell><Chip label="Required" color="error" size="small" /></TableCell>
                        <TableCell>Text</TableCell>
                        <TableCell>Product name</TableCell>
                        <TableCell>iPhone 13 Pro</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>price</TableCell>
                        <TableCell><Chip label="Required" color="error" size="small" /></TableCell>
                        <TableCell>Number</TableCell>
                        <TableCell>Product price</TableCell>
                        <TableCell>999.99</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>categoryName</TableCell>
                        <TableCell><Chip label="Optional" color="default" size="small" /></TableCell>
                        <TableCell>Text</TableCell>
                        <TableCell>Category name (will be created if not exists)</TableCell>
                        <TableCell>Electronics</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>quantity</TableCell>
                        <TableCell><Chip label="Optional" color="default" size="small" /></TableCell>
                        <TableCell>Number</TableCell>
                        <TableCell>Stock quantity</TableCell>
                        <TableCell>100</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>hsnCode</TableCell>
                        <TableCell><Chip label="Optional" color="default" size="small" /></TableCell>
                        <TableCell>Text</TableCell>
                        <TableCell>HSN/SAC code for GST</TableCell>
                        <TableCell>85171200</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>gstRate</TableCell>
                        <TableCell><Chip label="Optional" color="default" size="small" /></TableCell>
                        <TableCell>Number</TableCell>
                        <TableCell>GST rate percentage</TableCell>
                        <TableCell>18</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}