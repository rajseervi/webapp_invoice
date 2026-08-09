"use client";
import React, { useState } from 'react';
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
  Divider
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
  Settings as SettingsIcon
} from '@mui/icons-material';
import ImprovedDashboardLayout from '@/components/DashboardLayout/ImprovedDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

export default function EnhancedProductImportPage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  
  // Export options
  const [exportOptions, setExportOptions] = useState({
    includeInactive: false,
    categoryId: '',
    format: 'xlsx'
  });

  // Bulk update options
  const [bulkUpdateOptions, setBulkUpdateOptions] = useState({
    updateMode: 'update' // 'update' or 'upsert'
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
    setImportResult(null);
  };

  // Download templates
  const downloadImportTemplate = async () => {
    try {
      const response = await fetch('/api/products/import');
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product_import_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download import template');
    }
  };

  const downloadBulkUpdateTemplate = async () => {
    try {
      const response = await fetch('/api/products/bulk-update');
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk_update_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download bulk update template');
    }
  };

  // Import functionality
  const handleImportFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('validateOnly', 'true');

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to validate file');
      }

      setPreviewData(result.preview || []);
      setImportResult(result.validation);
      setShowPreview(true);
      setActiveStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setImporting(false);
    }
  };

  const confirmImport = async () => {
    if (!previewData.length) return;

    setImporting(true);
    setError(null);

    try {
      const fileInput = document.getElementById('import-file-upload') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      
      if (!file) {
        throw new Error('No file selected');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('validateOnly', 'false');

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import products');
      }

      setImportResult(result.result);
      setSuccess(result.message);
      setShowPreview(false);
      setActiveStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import products');
    } finally {
      setImporting(false);
    }
  };

  // Export functionality
  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (exportOptions.includeInactive) params.append('includeInactive', 'true');
      if (exportOptions.categoryId) params.append('categoryId', exportOptions.categoryId);
      params.append('format', exportOptions.format);

      const response = await fetch(`/api/products/export?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export products');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Products exported successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export products');
    } finally {
      setExporting(false);
    }
  };

  // Bulk update functionality
  const handleBulkUpdateFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBulkUpdating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('updateMode', bulkUpdateOptions.updateMode);

      const response = await fetch('/api/products/bulk-update', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to perform bulk update');
      }

      setImportResult(result.results);
      setSuccess(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform bulk update');
    } finally {
      setBulkUpdating(false);
    }
  };

  const resetImportProcess = () => {
    setActiveStep(0);
    setPreviewData([]);
    setImportResult(null);
    setError(null);
    setSuccess(null);
    const fileInput = document.getElementById('import-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <ImprovedDashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title="Product Import/Export Manager"
          subtitle="Comprehensive tool for managing product data with Excel files"
          icon={<FileUploadIcon />}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Paper sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<UploadIcon />} label="Import Products" />
            <Tab icon={<DownloadIcon />} label="Export Products" />
            <Tab icon={<UpdateIcon />} label="Bulk Update" />
          </Tabs>

          {/* Import Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Import Products from Excel
                    </Typography>
                    
                    <Stepper activeStep={activeStep} orientation="vertical">
                      <Step>
                        <StepLabel>Upload Excel File</StepLabel>
                        <StepContent>
                          <Box sx={{ mb: 2 }}>
                            <Button
                              variant="outlined"
                              startIcon={<GetTemplateIcon />}
                              onClick={downloadImportTemplate}
                              sx={{ mb: 2, mr: 2 }}
                            >
                              Download Template
                            </Button>
                            
                            <input
                              accept=".xlsx,.xls"
                              style={{ display: 'none' }}
                              id="import-file-upload"
                              type="file"
                              onChange={handleImportFileUpload}
                            />
                            <label htmlFor="import-file-upload">
                              <Button
                                variant="contained"
                                component="span"
                                startIcon={<UploadIcon />}
                                disabled={importing}
                              >
                                {importing ? 'Processing...' : 'Upload Excel File'}
                              </Button>
                            </label>
                          </Box>
                          {importing && <LinearProgress sx={{ mb: 2 }} />}
                        </StepContent>
                      </Step>

                      <Step>
                        <StepLabel>Review & Confirm</StepLabel>
                        <StepContent>
                          {importResult && (
                            <Box sx={{ mb: 2 }}>
                              <Alert severity={importResult.invalidRows > 0 ? "warning" : "success"}>
                                Validation Results: {importResult.validRows} valid, {importResult.invalidRows} invalid
                              </Alert>
                              
                              {importResult.errors.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="subtitle2">Errors:</Typography>
                                  <List dense>
                                    {importResult.errors.slice(0, 5).map((error: string, index: number) => (
                                      <ListItem key={index}>
                                        <ListItemText primary={error} />
                                      </ListItem>
                                    ))}
                                  </List>
                                  {importResult.errors.length > 5 && (
                                    <Typography variant="body2">
                                      ... and {importResult.errors.length - 5} more errors
                                    </Typography>
                                  )}
                                </Box>
                              )}
                              
                              <Box sx={{ mt: 2 }}>
                                <Button
                                  variant="contained"
                                  onClick={confirmImport}
                                  disabled={importing || importResult.validRows === 0}
                                  sx={{ mr: 2 }}
                                >
                                  {importing ? 'Importing...' : `Import ${importResult.validRows} Products`}
                                </Button>
                                <Button onClick={resetImportProcess}>
                                  Start Over
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </StepContent>
                      </Step>

                      <Step>
                        <StepLabel>Complete</StepLabel>
                        <StepContent>
                          {importResult && (
                            <Box>
                              <Alert severity="success">
                                Import completed successfully!
                              </Alert>
                              <Button onClick={resetImportProcess} sx={{ mt: 2 }}>
                                Import More Products
                              </Button>
                            </Box>
                          )}
                        </StepContent>
                      </Step>
                    </Stepper>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Import Guidelines
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Required Fields" 
                          secondary="name, categoryId/categoryName, price, quantity" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="GST Information" 
                          secondary="gstRate, hsnCode (goods), sacCode (services)" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="File Format" 
                          secondary="Excel (.xlsx or .xls) files only" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Validation" 
                          secondary="All data is validated before import" 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Export Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Export Products to Excel
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={exportOptions.includeInactive}
                              onChange={(e) => setExportOptions(prev => ({
                                ...prev,
                                includeInactive: e.target.checked
                              }))}
                            />
                          }
                          label="Include Inactive Products"
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Category Filter</InputLabel>
                          <Select
                            value={exportOptions.categoryId}
                            label="Category Filter"
                            onChange={(e) => setExportOptions(prev => ({
                              ...prev,
                              categoryId: e.target.value
                            }))}
                          >
                            <MenuItem value="">All Categories</MenuItem>
                            <MenuItem value="electronics">Electronics</MenuItem>
                            <MenuItem value="services">Services</MenuItem>
                            <MenuItem value="food">Food Items</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={handleExport}
                      disabled={exporting}
                      size="large"
                    >
                      {exporting ? 'Exporting...' : 'Export Products'}
                    </Button>

                    {exporting && <LinearProgress sx={{ mt: 2 }} />}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Export Features
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Complete Data" 
                          secondary="All product fields including GST info" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Filtering Options" 
                          secondary="Filter by category or status" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Excel Format" 
                          secondary="Ready for editing and re-import" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Timestamped" 
                          secondary="Files include export date" 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Bulk Update Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Bulk Update Products
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
                        <InputLabel>Update Mode</InputLabel>
                        <Select
                          value={bulkUpdateOptions.updateMode}
                          label="Update Mode"
                          onChange={(e) => setBulkUpdateOptions(prev => ({
                            ...prev,
                            updateMode: e.target.value
                          }))}
                        >
                          <MenuItem value="update">Update Only (existing products)</MenuItem>
                          <MenuItem value="upsert">Update or Create (upsert mode)</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Button
                        variant="outlined"
                        startIcon={<GetTemplateIcon />}
                        onClick={downloadBulkUpdateTemplate}
                        sx={{ mb: 2, mr: 2 }}
                      >
                        Download Template
                      </Button>
                      
                      <input
                        accept=".xlsx,.xls"
                        style={{ display: 'none' }}
                        id="bulk-update-file-upload"
                        type="file"
                        onChange={handleBulkUpdateFileUpload}
                      />
                      <label htmlFor="bulk-update-file-upload">
                        <Button
                          variant="contained"
                          component="span"
                          startIcon={<UpdateIcon />}
                          disabled={bulkUpdating}
                        >
                          {bulkUpdating ? 'Updating...' : 'Upload Update File'}
                        </Button>
                      </label>
                    </Box>

                    {bulkUpdating && <LinearProgress sx={{ mb: 2 }} />}

                    {importResult && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        Bulk update completed: {importResult.updated} updated, {importResult.created} created, {importResult.failed} failed
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Bulk Update Guide
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Update Mode" 
                          secondary="Only updates existing products" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Upsert Mode" 
                          secondary="Updates existing or creates new products" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="ID Required" 
                          secondary="Product ID needed for updates" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Partial Updates" 
                          secondary="Only specified fields are updated" 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>

        {/* Preview Dialog */}
        <Dialog 
          open={showPreview} 
          onClose={() => setShowPreview(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Preview Import Data ({previewData.length} products)
          </DialogTitle>
          <DialogContent>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>GST Rate</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.categoryId || row.categoryName}</TableCell>
                      <TableCell>₹{row.price}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>
                        {row.gstExempt ? (
                          <Chip label="Exempt" size="small" />
                        ) : (
                          `${row.gstRate || 0}%`
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.isService ? 'Service' : 'Goods'} 
                          size="small" 
                          color={row.isService ? 'secondary' : 'primary'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {previewData.length > 10 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                ... and {previewData.length - 10} more products
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ImprovedDashboardLayout>
  );
}