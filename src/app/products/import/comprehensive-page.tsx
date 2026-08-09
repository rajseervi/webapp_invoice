"use client";
import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Divider,
  TextField,
  IconButton,
  Tooltip,
  Badge,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Snackbar,
  ButtonGroup,
  Checkbox,
  FormGroup,
  RadioGroup,
  Radio,
  Slider,
  Autocomplete
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  GetApp as GetTemplateIcon,
  Update as UpdateIcon,
  Visibility as PreviewIcon,
  FileUpload as FileUploadIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Analytics as AnalyticsIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  SkipNext as SkipIcon,
  Backup as BackupIcon,
  RestoreFromTrash as RestoreIcon,
  Compare as CompareIcon,
  Merge as MergeIcon,
  Transform as TransformIcon,
  FactCheck as ValidateIcon,
  DataUsage as DataIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { Product } from '@/types/inventory';
import * as XLSX from 'xlsx';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  warnings: string[];
  duplicates: number;
  updated: number;
  skipped: number;
  processingTime: number;
}

interface ImportOptions {
  updateExisting: boolean;
  skipDuplicates: boolean;
  validateOnly: boolean;
  batchSize: number;
  createCategories: boolean;
  defaultCategory: string;
  priceRounding: number;
  stockValidation: boolean;
  imageProcessing: boolean;
}

interface ValidationRule {
  field: string;
  rule: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

interface ImportTemplate {
  name: string;
  description: string;
  fields: string[];
  validationRules: ValidationRule[];
  transformations: any[];
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
      id={`import-tabpanel-${index}`}
      aria-labelledby={`import-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ComprehensiveProductImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [tabValue, setTabValue] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Data states
  const [rawData, setRawData] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validatedData, setValidatedData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  
  // UI states
  const [showPreview, setShowPreview] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  
  // Configuration states
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    updateExisting: false,
    skipDuplicates: true,
    validateOnly: false,
    batchSize: 100,
    createCategories: false,
    defaultCategory: '',
    priceRounding: 2,
    stockValidation: true,
    imageProcessing: false
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [customValidationRules, setCustomValidationRules] = useState<ValidationRule[]>([]);
  const [fieldMapping, setFieldMapping] = useState<{[key: string]: string}>({});
  
  // Import templates
  const importTemplates: ImportTemplate[] = [
    {
      name: 'standard',
      description: 'Standard Product Import',
      fields: ['name', 'categoryId', 'price', 'quantity'],
      validationRules: [
        { field: 'name', rule: 'required', value: true, message: 'Product name is required', severity: 'error' },
        { field: 'price', rule: 'min', value: 0, message: 'Price must be positive', severity: 'error' },
        { field: 'quantity', rule: 'min', value: 0, message: 'Quantity must be non-negative', severity: 'error' }
      ],
      transformations: []
    },
    {
      name: 'ecommerce',
      description: 'E-commerce Product Import',
      fields: ['name', 'categoryId', 'price', 'quantity', 'brand', 'model', 'weight', 'dimensions', 'tags', 'images'],
      validationRules: [
        { field: 'name', rule: 'required', value: true, message: 'Product name is required', severity: 'error' },
        { field: 'brand', rule: 'required', value: true, message: 'Brand is required for e-commerce', severity: 'warning' }
      ],
      transformations: []
    },
    {
      name: 'inventory',
      description: 'Inventory Management Import',
      fields: ['name', 'categoryId', 'price', 'quantity', 'reorderPoint', 'supplier', 'location', 'barcode'],
      validationRules: [
        { field: 'reorderPoint', rule: 'required', value: true, message: 'Reorder point is required', severity: 'warning' },
        { field: 'barcode', rule: 'unique', value: true, message: 'Barcode must be unique', severity: 'error' }
      ],
      transformations: []
    }
  ];

  // Load categories on component mount
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

  // Template download functions
  const downloadTemplate = (templateType: string = 'standard') => {
    const template = importTemplates.find(t => t.name === templateType);
    if (!template) return;

    let sampleData: any = {};
    
    switch (templateType) {
      case 'standard':
        sampleData = [
          {
            name: 'Sample Product 1',
            categoryId: 'electronics',
            price: 1000,
            quantity: 50,
            reorderPoint: 10,
            isActive: true
          },
          {
            name: 'Sample Service 1',
            categoryId: 'services',
            price: 5000,
            quantity: 0,
            reorderPoint: 0,
            isActive: true
          }
        ];
        break;
      
      case 'ecommerce':
        sampleData = [
          {
            name: 'Premium Smartphone',
            categoryId: 'electronics',
            price: 25000,
            quantity: 100,
            brand: 'TechBrand',
            model: 'TB-2024',
            weight: 180,
            dimensions: '15.5x7.5x0.8',
            tags: 'smartphone,mobile,electronics,premium',
            images: 'image1.jpg,image2.jpg'
          }
        ];
        break;
      
      case 'inventory':
        sampleData = [
          {
            name: 'Office Chair',
            categoryId: 'furniture',
            price: 5000,
            quantity: 25,
            reorderPoint: 5,
            supplier: 'Furniture Supplier Ltd',
            location: 'Warehouse A-1',
            barcode: '1234567890123'
          }
        ];
        break;
    }

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, `product_import_template_${templateType}.xlsx`);
  };

  // File upload handler
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setProgress(0);

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress((e.loaded / e.total) * 30); // 30% for file reading
      }
    };

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        setRawData(jsonData);
        setPreviewData(jsonData.slice(0, 10)); // Show first 10 rows for preview
        setShowPreview(true);
        setActiveStep(1);
        setProgress(50);
        setSuccess(`File loaded successfully. Found ${jsonData.length} rows.`);
        setSnackbarOpen(true);
      } catch (err) {
        setError('Failed to read file. Please ensure it\'s a valid Excel file.');
        setProgress(0);
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
      setProgress(0);
    };

    reader.readAsArrayBuffer(file);
  }, []);

  // Data validation
  const validateData = useCallback(async () => {
    if (rawData.length === 0) return;

    setValidating(true);
    setProgress(0);

    try {
      const template = importTemplates.find(t => t.name === selectedTemplate);
      if (!template) throw new Error('Invalid template selected');

      const validatedResults = [];
      const errors: string[] = [];
      const warnings: string[] = [];

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 2; // Excel row number
        const rowErrors: string[] = [];
        const rowWarnings: string[] = [];

        // Apply validation rules
        template.validationRules.forEach(rule => {
          const fieldValue = row[rule.field];
          
          switch (rule.rule) {
            case 'required':
              if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
                if (rule.severity === 'error') {
                  rowErrors.push(`Row ${rowNumber}: ${rule.message}`);
                } else {
                  rowWarnings.push(`Row ${rowNumber}: ${rule.message}`);
                }
              }
              break;
            
            case 'min':
              if (typeof fieldValue === 'number' && fieldValue < rule.value) {
                if (rule.severity === 'error') {
                  rowErrors.push(`Row ${rowNumber}: ${rule.message}`);
                } else {
                  rowWarnings.push(`Row ${rowNumber}: ${rule.message}`);
                }
              }
              break;
            
            case 'unique':
              // Check for duplicates within the dataset
              const duplicates = rawData.filter((r, idx) => idx !== i && r[rule.field] === fieldValue);
              if (duplicates.length > 0) {
                rowWarnings.push(`Row ${rowNumber}: Duplicate ${rule.field} found`);
              }
              break;
          }
        });

        // Custom validation
        if (importOptions.gstValidation && !row.gstExempt) {
          if (!row.gstRate || row.gstRate < 0 || row.gstRate > 100) {
            rowErrors.push(`Row ${rowNumber}: Invalid GST rate`);
          }
          if (!row.isService && !row.hsnCode) {
            rowErrors.push(`Row ${rowNumber}: HSN code required for goods`);
          }
          if (row.isService && !row.sacCode) {
            rowErrors.push(`Row ${rowNumber}: SAC code required for services`);
          }
        }

        if (importOptions.stockValidation && row.quantity < 0) {
          rowErrors.push(`Row ${rowNumber}: Stock quantity cannot be negative`);
        }

        errors.push(...rowErrors);
        warnings.push(...rowWarnings);

        if (rowErrors.length === 0) {
          validatedResults.push({
            ...row,
            _rowNumber: rowNumber,
            _hasWarnings: rowWarnings.length > 0
          });
        }

        setProgress((i / rawData.length) * 100);
      }

      setValidatedData(validatedResults);
      setShowValidation(true);
      setActiveStep(2);
      
      if (errors.length === 0) {
        setSuccess(`Validation completed. ${validatedResults.length} rows ready for import.`);
      } else {
        setError(`Validation found ${errors.length} errors and ${warnings.length} warnings.`);
      }
      
      setSnackbarOpen(true);
    } catch (err) {
      setError('Validation failed. Please check your data and try again.');
    } finally {
      setValidating(false);
    }
  }, [rawData, selectedTemplate, importOptions]);

  // Import execution
  const executeImport = useCallback(async () => {
    if (validatedData.length === 0) return;

    setImporting(true);
    setProgress(0);

    try {
      // Transform validated data to the format expected by the service
      const productsToImport = validatedData.map(item => ({
        name: String(item.name).trim(),
        categoryId: String(item.categoryId).trim(),
        price: Number(item.price),
        quantity: Number(item.quantity),
        description: item.description ? String(item.description) : '',
        reorderPoint: item.reorderPoint ? Number(item.reorderPoint) : 10,
        isActive: item.isActive !== false,
        gstRate: item.gstRate ? Number(item.gstRate) : 18,
        hsnCode: item.hsnCode ? String(item.hsnCode) : '',
        sacCode: item.sacCode ? String(item.sacCode) : '',
        isService: Boolean(item.isService),
        gstExempt: Boolean(item.gstExempt),
        cessRate: item.cessRate ? Number(item.cessRate) : 0,
        unitOfMeasurement: item.unitOfMeasurement ? String(item.unitOfMeasurement) : 'PCS',
        brand: item.brand ? String(item.brand) : '',
        model: item.model ? String(item.model) : '',
        weight: item.weight ? Number(item.weight) : 0,
        barcode: item.barcode ? String(item.barcode) : '',
        supplier: item.supplier ? String(item.supplier) : '',
        location: item.location ? String(item.location) : ''
      }));

      // Use the enhanced import service
      const result = await productService.importProductsAdvanced(productsToImport, {
        updateExisting: importOptions.updateExisting,
        skipDuplicates: importOptions.skipDuplicates,
        validateOnly: importOptions.validateOnly,
        batchSize: importOptions.batchSize,
        createCategories: importOptions.createCategories
      });

      setImportResult(result);
      setActiveStep(3);
      setSuccess(`Import completed in ${(result.processingTime / 1000).toFixed(2)} seconds`);
      setSnackbarOpen(true);
    } catch (err) {
      setError('Import failed. Please try again.');
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  }, [validatedData, importOptions]);

  // Export functions
  const exportProducts = async (options: any = {}) => {
    try {
      const products = await productService.exportProducts(options);
      
      if (products.length === 0) {
        setError('No products to export');
        return;
      }

      const exportData = products.map(product => ({
        name: product.name,
        categoryId: product.categoryId,
        price: product.price,
        quantity: product.quantity,
        description: product.description || '', // TODO remove when description fully deprecated
        reorderPoint: product.reorderPoint,
        isActive: product.isActive,
        gstRate: product.gstRate || 0,
        hsnCode: product.hsnCode || '',
        sacCode: product.sacCode || '',
        isService: product.isService || false,
        gstExempt: product.gstExempt || false,
        cessRate: product.cessRate || 0,
        unitOfMeasurement: product.unitOfMeasurement || 'PCS',
        brand: product.brand || '',
        model: product.model || '',
        weight: product.weight || 0,
        barcode: product.barcode || '',
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      
      const fileName = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      setSuccess(`Exported ${products.length} products successfully`);
      setSnackbarOpen(true);
    } catch (err) {
      setError('Failed to export products');
    }
  };

  // Reset function
  const resetImport = () => {
    setRawData([]);
    setPreviewData([]);
    setValidatedData([]);
    setImportResult(null);
    setShowPreview(false);
    setShowValidation(false);
    setActiveStep(0);
    setProgress(0);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title="Comprehensive Product Import/Export"
          subtitle="Advanced product data management with validation, transformation, and batch processing"
          icon={<DataIcon />}
        />

        {/* Main Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Import Products" icon={<UploadIcon />} />
            <Tab label="Export Products" icon={<DownloadIcon />} />
            <Tab label="Bulk Operations" icon={<UpdateIcon />} />
            <Tab label="Templates" icon={<SettingsIcon />} />
            <Tab label="History" icon={<HistoryIcon />} />
            <Tab label="Analytics" icon={<AnalyticsIcon />} />
          </Tabs>
        </Paper>

        {/* Import Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Import Stepper */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Import Process
                  </Typography>
                  <Stepper activeStep={activeStep} orientation="vertical">
                    <Step>
                      <StepLabel>Upload File</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Select and upload your Excel file
                        </Typography>
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>Preview Data</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Review the imported data
                        </Typography>
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>Validate</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Check for errors and warnings
                        </Typography>
                      </StepContent>
                    </Step>
                    <Step>
                      <StepLabel>Import</StepLabel>
                      <StepContent>
                        <Typography variant="body2">
                          Execute the import process
                        </Typography>
                      </StepContent>
                    </Step>
                  </Stepper>
                </CardContent>
              </Card>
            </Grid>

            {/* Main Import Area */}
            <Grid item xs={12} md={9}>
              {/* Upload Section */}
              {activeStep === 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Upload Product Data
                    </Typography>
                    
                    {/* Template Selection */}
                    <Box sx={{ mb: 3 }}>
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Import Template</InputLabel>
                        <Select
                          value={selectedTemplate}
                          onChange={(e) => setSelectedTemplate(e.target.value)}
                          label="Import Template"
                        >
                          {importTemplates.map((template) => (
                            <MenuItem key={template.name} value={template.name}>
                              {template.description}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {importTemplates.find(t => t.name === selectedTemplate)?.description}
                      </Typography>
                    </Box>

                    {/* Template Download */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Download Template
                      </Typography>
                      <ButtonGroup variant="outlined" sx={{ mb: 2 }}>
                        <Button
                          startIcon={<GetTemplateIcon />}
                          onClick={() => downloadTemplate('standard')}
                        >
                          Standard
                        </Button>
                        <Button
                          startIcon={<GetTemplateIcon />}
                          onClick={() => downloadTemplate('ecommerce')}
                        >
                          E-commerce
                        </Button>
                        <Button
                          startIcon={<GetTemplateIcon />}
                          onClick={() => downloadTemplate('inventory')}
                        >
                          Inventory
                        </Button>
                      </ButtonGroup>
                    </Box>

                    {/* File Upload */}
                    <Box sx={{ mb: 3 }}>
                      <input
                        accept=".xlsx,.xls,.csv"
                        style={{ display: 'none' }}
                        id="file-upload"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                      <label htmlFor="file-upload">
                        <Button
                          variant="contained"
                          component="span"
                          startIcon={<UploadIcon />}
                          size="large"
                          fullWidth
                          sx={{ height: 60 }}
                        >
                          Upload Excel File
                        </Button>
                      </label>
                    </Box>

                    {/* Progress */}
                    {progress > 0 && progress < 100 && (
                      <Box sx={{ mb: 2 }}>
                        <LinearProgress variant="determinate" value={progress} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {progress.toFixed(0)}% complete
                        </Typography>
                      </Box>
                    )}

                    {/* Import Options */}
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">Import Options</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={importOptions.updateExisting}
                                  onChange={(e) => setImportOptions({
                                    ...importOptions,
                                    updateExisting: e.target.checked
                                  })}
                                />
                              }
                              label="Update Existing Products"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={importOptions.skipDuplicates}
                                  onChange={(e) => setImportOptions({
                                    ...importOptions,
                                    skipDuplicates: e.target.checked
                                  })}
                                />
                              }
                              label="Skip Duplicates"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={importOptions.validateOnly}
                                  onChange={(e) => setImportOptions({
                                    ...importOptions,
                                    validateOnly: e.target.checked
                                  })}
                                />
                              }
                              label="Validate Only (No Import)"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={importOptions.createCategories}
                                  onChange={(e) => setImportOptions({
                                    ...importOptions,
                                    createCategories: e.target.checked
                                  })}
                                />
                              }
                              label="Create Missing Categories"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Batch Size"
                              type="number"
                              value={importOptions.batchSize}
                              onChange={(e) => setImportOptions({
                                ...importOptions,
                                batchSize: Number(e.target.value)
                              })}
                              inputProps={{ min: 1, max: 1000 }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Default Category</InputLabel>
                              <Select
                                value={importOptions.defaultCategory}
                                onChange={(e) => setImportOptions({
                                  ...importOptions,
                                  defaultCategory: e.target.value
                                })}
                                label="Default Category"
                              >
                                <MenuItem value="">None</MenuItem>
                                {categories.map((category) => (
                                  <MenuItem key={category.id} value={category.id}>
                                    {category.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              {/* Preview Section */}
              {activeStep === 1 && showPreview && (
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Data Preview ({rawData.length} rows)
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          startIcon={<ValidateIcon />}
                          onClick={validateData}
                          disabled={validating}
                        >
                          {validating ? 'Validating...' : 'Validate Data'}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<RefreshIcon />}
                          onClick={resetImport}
                        >
                          Reset
                        </Button>
                      </Stack>
                    </Box>

                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {previewData.length > 0 && Object.keys(previewData[0]).map((key) => (
                              <TableCell key={key}>{key}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {previewData.map((row, index) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value: any, cellIndex) => (
                                <TableCell key={cellIndex}>
                                  {String(value).substring(0, 50)}
                                  {String(value).length > 50 && '...'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {rawData.length > 10 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Showing first 10 rows of {rawData.length} total rows
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Validation Section */}
              {activeStep === 2 && showValidation && (
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Validation Results
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          startIcon={<StartIcon />}
                          onClick={executeImport}
                          disabled={importing || validatedData.length === 0}
                        >
                          {importing ? 'Importing...' : 'Start Import'}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => setActiveStep(1)}
                        >
                          Edit Data
                        </Button>
                      </Stack>
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={3}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">
                              {validatedData.length}
                            </Typography>
                            <Typography variant="body2">Valid Rows</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="error.main">
                              {rawData.length - validatedData.length}
                            </Typography>
                            <Typography variant="body2">Invalid Rows</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main">
                              {validatedData.filter(row => row._hasWarnings).length}
                            </Typography>
                            <Typography variant="body2">Warnings</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4">
                              {rawData.length}
                            </Typography>
                            <Typography variant="body2">Total Rows</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Progress */}
                    {importing && (
                      <Box sx={{ mb: 3 }}>
                        <LinearProgress variant="determinate" value={progress} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Processing: {progress.toFixed(0)}% complete
                        </Typography>
                      </Box>
                    )}

                    {/* Validated Data Preview */}
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Row</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {validatedData.slice(0, 10).map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row._rowNumber}</TableCell>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>{row.categoryId}</TableCell>
                              <TableCell>₹{row.price}</TableCell>
                              <TableCell>{row.quantity}</TableCell>
                              <TableCell>
                                {row._hasWarnings ? (
                                  <Chip label="Warning" color="warning" size="small" />
                                ) : (
                                  <Chip label="Valid" color="success" size="small" />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Results Section */}
              {activeStep === 3 && importResult && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Import Results
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={2}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main">
                              {importResult.success}
                            </Typography>
                            <Typography variant="body2">Success</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="error.main">
                              {importResult.failed}
                            </Typography>
                            <Typography variant="body2">Failed</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="info.main">
                              {importResult.updated}
                            </Typography>
                            <Typography variant="body2">Updated</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="warning.main">
                              {importResult.duplicates}
                            </Typography>
                            <Typography variant="body2">Duplicates</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4">
                              {importResult.skipped}
                            </Typography>
                            <Typography variant="body2">Skipped</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Card variant="outlined">
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6">
                              {(importResult.processingTime / 1000).toFixed(2)}s
                            </Typography>
                            <Typography variant="body2">Time</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {importResult.errors.length > 0 && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Errors ({importResult.errors.length}):
                        </Typography>
                        <List dense>
                          {importResult.errors.slice(0, 10).map((error, index) => (
                            <ListItem key={index}>
                              <ListItemText primary={error} />
                            </ListItem>
                          ))}
                          {importResult.errors.length > 10 && (
                            <ListItem>
                              <ListItemText primary={`... and ${importResult.errors.length - 10} more errors`} />
                            </ListItem>
                          )}
                        </List>
                      </Alert>
                    )}

                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={resetImport}
                      >
                        Import More Products
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => {
                          // Download import report
                          const reportData = [{
                            timestamp: new Date().toISOString(),
                            totalRows: rawData.length,
                            successfulImports: importResult.success,
                            failedImports: importResult.failed,
                            updatedProducts: importResult.updated,
                            duplicatesFound: importResult.duplicates,
                            skippedRows: importResult.skipped,
                            processingTimeMs: importResult.processingTime,
                            errors: importResult.errors.join('; ')
                          }];
                          
                          const ws = XLSX.utils.json_to_sheet(reportData);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, 'Import Report');
                          XLSX.writeFile(wb, `import_report_${new Date().toISOString().split('T')[0]}.xlsx`);
                        }}
                      >
                        Download Report
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Export Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Export All Products
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Export all your products to an Excel file for backup or analysis.
                  </Typography>

                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportProducts()}
                    fullWidth
                    size="large"
                  >
                    Export All Products
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Custom Export
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Export products with custom filters and options.
                  </Typography>

                  <Stack spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>Category Filter</InputLabel>
                      <Select label="Category Filter">
                        <MenuItem value="">All Categories</MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControlLabel
                      control={<Switch />}
                      label="Include Inactive Products"
                    />

                    <FormControlLabel
                      control={<Switch />}
                      label="Include Stock History"
                    />

                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      fullWidth
                    >
                      Export with Filters
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Bulk Operations Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Bulk Operations
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Perform bulk operations on your product data.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <UpdateIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Bulk Price Update
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Update prices for multiple products at once
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Configure
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TransformIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Data Transformation
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Transform and clean your product data
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Configure
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <MergeIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Duplicate Merge
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Find and merge duplicate products
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Configure
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Templates Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Import Templates
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Manage and customize import templates for different use cases.
          </Typography>

          <Grid container spacing={3}>
            {importTemplates.map((template) => (
              <Grid item xs={12} md={4} key={template.name}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Fields: {template.fields.join(', ')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Validation Rules: {template.validationRules.length}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadTemplate(template.name)}
                      >
                        Download
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                      >
                        Edit
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* History Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Import History
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            View your import history and download previous reports.
          </Typography>

          <Alert severity="info">
            Import history feature will be available in the next update.
          </Alert>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>
            Import Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Analyze your import patterns and data quality metrics.
          </Typography>

          <Alert severity="info">
            Analytics dashboard will be available in the next update.
          </Alert>
        </TabPanel>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={error ? 'error' : 'success'}
            sx={{ width: '100%' }}
          >
            {error || success}
          </Alert>
        </Snackbar>
      </Container>
    </ImprovedDashboardLayout>
  );
}