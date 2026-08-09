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
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon,
  GetApp as GetAppIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Product, Category } from '@/types/inventory';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';

interface ProductImportExportProps {
  onImportComplete: () => void;
  onClose: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

const importSteps = [
  'Upload File',
  'Validate Data',
  'Review & Fix',
  'Import Products'
];

export default function EnhancedProductImportExport({
  onImportComplete,
  onClose
}: ProductImportExportProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [activeTab, setActiveTab] = useState(0); // 0: Import, 1: Export
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Import states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Export states
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [exportFilters, setExportFilters] = useState({
    category: '',
    status: 'all',
    includeInactive: false
  });

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await categoryService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setActiveStep(1);
      validateFile(file);
    }
  };

  const validateFile = async (file: File) => {
    setLoading(true);
    setProgress(0);

    try {
      // Simulate file reading and validation
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        // Parse CSV content (simplified)
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          row._rowIndex = index + 2; // +2 because we start from line 2 (after header)
          return row;
        }).filter(row => Object.values(row).some(val => val !== ''));

        setImportData(data);
        
        // Validate data
        const errors = validateImportData(data);
        setValidationErrors(errors);
        setProgress(100);
        setActiveStep(2);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error validating file:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateImportData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const requiredFields = ['name', 'price', 'quantity'];

    data.forEach((row, index) => {
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          errors.push({
            row: row._rowIndex,
            field,
            message: `${field} is required`,
            severity: 'error'
          });
        }
      });

      // Validate price
      if (row.price && isNaN(parseFloat(row.price))) {
        errors.push({
          row: row._rowIndex,
          field: 'price',
          message: 'Price must be a valid number',
          severity: 'error'
        });
      }

      // Validate quantity
      if (row.quantity && isNaN(parseInt(row.quantity))) {
        errors.push({
          row: row._rowIndex,
          field: 'quantity',
          message: 'Quantity must be a valid number',
          severity: 'error'
        });
      }

      // Validate GST rate
      if (row.gstRate && ![0, 5, 12, 18, 28].includes(parseInt(row.gstRate))) {
        errors.push({
          row: row._rowIndex,
          field: 'gstRate',
          message: 'GST rate must be 0, 5, 12, 18, or 28',
          severity: 'warning'
        });
      }

      // Check if category exists
      if (row.categoryId && !categories.find(c => c.id === row.categoryId || c.name === row.categoryId)) {
        errors.push({
          row: row._rowIndex,
          field: 'categoryId',
          message: 'Category not found',
          severity: 'warning'
        });
      }
    });

    return errors;
  };

  const handleImport = async () => {
    setLoading(true);
    setProgress(0);

    try {
      // Filter out rows with critical errors
      const criticalErrors = validationErrors.filter(e => e.severity === 'error');
      const validData = importData.filter(row => 
        !criticalErrors.some(error => error.row === row._rowIndex)
      );

      // Simulate import progress
      const total = validData.length;
      let imported = 0;

      for (const row of validData) {
        // Transform data to match Product interface
        const productData = {
          name: row.name,
          description: row.description || '',
          price: parseFloat(row.price),
          quantity: parseInt(row.quantity),
          unitOfMeasurement: row.unitOfMeasurement || 'pcs',
          categoryId: row.categoryId || categories[0]?.id || '',
          gstRate: parseInt(row.gstRate) || 18,
          gstExempt: row.gstExempt === 'true',
          hsnCode: row.hsnCode || '',
          sacCode: row.sacCode || '',
          isService: row.isService === 'true',
          isActive: row.isActive !== 'false',
          reorderPoint: parseInt(row.reorderPoint) || 10
        };

        try {
          await productService.createProduct(productData);
          imported++;
          setProgress((imported / total) * 100);
        } catch (error) {
          console.error('Error importing product:', error);
        }
      }

      setImportResult({
        success: true,
        message: `Successfully imported ${imported} out of ${total} products`,
        data: { imported, total, errors: criticalErrors.length }
      });

      setActiveStep(3);
      setTimeout(() => {
        onImportComplete();
      }, 2000);
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Import failed',
        errors: ['An unexpected error occurred during import']
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    
    try {
      // Get products based on filters
      const filters = {
        category: exportFilters.category,
        status: exportFilters.status,
        includeInactive: exportFilters.includeInactive
      };

      // This would typically call a service method
      // const exportData = await productService.exportProducts(filters, exportFormat);
      
      // Simulate export
      const csvContent = generateCSVContent();
      downloadFile(csvContent, `products_export.${exportFormat}`);
      
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCSVContent = () => {
    const headers = [
      'name', 'description', 'price', 'quantity', 'unitOfMeasurement',
      'categoryId', 'gstRate', 'gstExempt', 'hsnCode', 'sacCode',
      'isService', 'isActive', 'reorderPoint'
    ];
    
    const csvRows = [headers.join(',')];
    // Add sample data or actual product data
    csvRows.push('Sample Product,Sample Description,100,50,pcs,cat1,18,false,1234,,,false,true,10');
    
    return csvRows.join('\n');
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const headers = [
      'name', 'description', 'price', 'quantity', 'unitOfMeasurement',
      'categoryId', 'gstRate', 'gstExempt', 'hsnCode', 'sacCode',
      'isService', 'isActive', 'reorderPoint'
    ];
    
    const sampleData = [
      'Product Name', 'Product Description', '100.00', '50', 'pcs',
      'category-id', '18', 'false', '1234', '', 'false', 'true', '10'
    ];
    
    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    downloadFile(csvContent, 'product_import_template.csv');
  };

  const renderImportStep = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Product Data File
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Upload CSV File
                    </Typography>
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                      <Typography variant="body1" gutterBottom>
                        Click to upload or drag and drop
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        CSV files only
                      </Typography>
                    </Box>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                    
                    {selectedFile && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Selected file: {selectedFile.name}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Import Template
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Download our template to ensure your data is formatted correctly.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={downloadTemplate}
                      fullWidth
                    >
                      Download Template
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Validating Data
            </Typography>
            {loading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Validating file content...
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Data & Fix Issues
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Validation Summary
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <InfoIcon color="info" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Total Rows"
                          secondary={importData.length}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <ErrorIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Errors"
                          secondary={validationErrors.filter(e => e.severity === 'error').length}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Warnings"
                          secondary={validationErrors.filter(e => e.severity === 'warning').length}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={8}>
                {validationErrors.length > 0 ? (
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Issues Found
                      </Typography>
                      <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Row</TableCell>
                              <TableCell>Field</TableCell>
                              <TableCell>Issue</TableCell>
                              <TableCell>Severity</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {validationErrors.slice(0, 20).map((error, index) => (
                              <TableRow key={index}>
                                <TableCell>{error.row}</TableCell>
                                <TableCell>{error.field}</TableCell>
                                <TableCell>{error.message}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={error.severity}
                                    color={error.severity === 'error' ? 'error' : 'warning'}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {validationErrors.length > 20 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Showing first 20 of {validationErrors.length} issues
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Alert severity="success">
                    No validation issues found. Ready to import!
                  </Alert>
                )}
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Import Complete
            </Typography>
            
            {loading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Importing products... {Math.round(progress)}%
                </Typography>
              </Box>
            )}
            
            {importResult && (
              <Alert severity={importResult.success ? 'success' : 'error'}>
                {importResult.message}
              </Alert>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const renderExportTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Export Products
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Export Options
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as 'csv' | 'xlsx')}
                      label="Format"
                    >
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={exportFilters.category}
                      onChange={(e) => setExportFilters(prev => ({ ...prev, category: e.target.value }))}
                      label="Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map(cat => (
                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={exportFilters.status}
                      onChange={(e) => setExportFilters(prev => ({ ...prev, status: e.target.value }))}
                      label="Status"
                    >
                      <MenuItem value="all">All Products</MenuItem>
                      <MenuItem value="active">Active Only</MenuItem>
                      <MenuItem value="inactive">Inactive Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={loading}
                fullWidth
                sx={{ mt: 2 }}
              >
                Export Products
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Export Information
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The export will include all product information including:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Basic product details (name, description, price)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Inventory information (quantity, unit of measurement)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Tax details (GST rate, HSN/SAC codes)" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Category and status information" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box>
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
        <Tab label="Import Products" icon={<UploadIcon />} />
        <Tab label="Export Products" icon={<DownloadIcon />} />
      </Tabs>
      
      <Box sx={{ mt: 3 }}>
        {activeTab === 0 ? (
          <Box>
            <Stepper activeStep={activeStep} orientation={isMobile ? 'vertical' : 'horizontal'}>
              {importSteps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                  {isMobile && (
                    <StepContent>
                      {renderImportStep(index)}
                      <Box sx={{ mb: 2 }}>
                        {index === 2 && (
                          <Button
                            variant="contained"
                            onClick={handleImport}
                            disabled={loading || validationErrors.filter(e => e.severity === 'error').length > 0}
                            sx={{ mt: 1, mr: 1 }}
                          >
                            Import Products
                          </Button>
                        )}
                      </Box>
                    </StepContent>
                  )}
                </Step>
              ))}
            </Stepper>

            {!isMobile && (
              <Box sx={{ mt: 3 }}>
                {renderImportStep(activeStep)}
                
                {activeStep === 2 && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleImport}
                      disabled={loading || validationErrors.filter(e => e.severity === 'error').length > 0}
                    >
                      Import Products
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        ) : (
          renderExportTab()
        )}
      </Box>
    </Box>
  );
}