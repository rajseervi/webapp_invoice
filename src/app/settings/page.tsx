"use client";
import React, { useState, useEffect } from 'react';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';

import { useAuth } from '@/contexts/AuthContext';
import { useTemplate } from '@/contexts/TemplateContext';
import TemplateSwitcher from '@/app/invoices/components/TemplateSwitcher';
import { CompanyInfo, UserPreferences, StatisticsSettings, PrintingPreferences } from '@/types/company';
import {
  Button,
  Stack,
  Container,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Box,
  Divider,
  TextField,
  Grid,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  DarkMode as DarkModeIcon, 
  LightMode as LightModeIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  ReceiptLong as ReceiptIcon,
  Analytics as AnalyticsIcon,
  Save as SaveIcon,
  AccountBalance as GstIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import {
  getCompanyInfo, 
  saveCompanyInfo, 
  getUserPreferences, 
  saveUserPreferences,
  getStatisticsSettings,
  saveStatisticsSettings,
  getPrintingPreferences,
  savePrintingPreferences,
  DEFAULT_PRINTING_PREFERENCES
} from '@/services/settingsService';
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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

function SettingsPage() {
  const theme = useTheme();
  const { currentUser, userRole } = useAuth();
  const { template, setTemplate } = useTemplate();
  const [tabValue, setTabValue] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  // Company Information
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
    website: '',
    logo: '',
    bankDetails: {
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branch: '',
      upiId: ''
    }
  });

  // User Preferences
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    defaultInvoiceTemplate: 'modern',
    defaultCurrency: 'INR',
    defaultTaxRate: 18,
    showProductImages: true,
    enableStockAlerts: true,
    stockAlertThreshold: 10,
    printing: DEFAULT_PRINTING_PREFERENCES,
  });

  // Statistics Settings
  const [statisticsSettings, setStatisticsSettings] = useState<StatisticsSettings>({
    showRevenueStats: true,
    showProfitStats: true,
    showInventoryStats: true,
    showCustomerStats: true,
    dashboardTimeRange: '30days',
  });

  // Printing Preferences
  const [printingPreferences, setPrintingPreferences] = useState<PrintingPreferences>(DEFAULT_PRINTING_PREFERENCES);

  useEffect(() => {
    // Get the theme preference from localStorage on component mount
    const savedTheme = localStorage.getItem('themeMode');
    setIsDarkMode(savedTheme === 'dark');
    
    // Load company information and user preferences
    if (currentUser) {
      loadSettings();
    }
  }, [currentUser, setTemplate]);

  const loadSettings = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Load company information
      const companyData = await getCompanyInfo();
      if (companyData) {
        setCompanyInfo(prev => ({
          ...prev,
          ...companyData,
          bankDetails: {
            ...prev.bankDetails,
            ...(companyData.bankDetails || {})
          }
        }));
      }
      
      // Load user preferences
      const userPrefsData = await getUserPreferences(currentUser.uid);
      if (userPrefsData) {
        setUserPreferences(userPrefsData);
        // Update template in context if it exists in preferences
        if (userPrefsData.defaultInvoiceTemplate) {
          setTemplate(userPrefsData.defaultInvoiceTemplate as 'modern' | 'classic' | 'minimalist');
        }
      }
      
      // Load statistics settings
      const statsData = await getStatisticsSettings(currentUser.uid);
      if (statsData) {
        setStatisticsSettings(statsData);
      }
      
      // Load printing preferences
      const printingData = await getPrintingPreferences(currentUser.uid);
      setPrintingPreferences(printingData);
    } catch (error) {
      console.error('Error loading settings:', error);
      setSaveError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newThemeMode = event.target.checked ? 'dark' : 'light';
    setIsDarkMode(event.target.checked);
    localStorage.setItem('themeMode', newThemeMode);
    // Theme change will be handled by ThemeRegistry
    window.dispatchEvent(new CustomEvent('themeChange', { detail: newThemeMode }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [name]: name === 'ifscCode' ? value.toUpperCase() : value
      }
    }));
  };

  const handleUserPreferencesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setUserPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleStatisticsSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setStatisticsSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePrintingPreferencesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setPrintingPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleTemplateChange = (newTemplate: 'modern' | 'classic' | 'minimalist') => {
    console.log('Settings: Template changed to:', newTemplate);
    setTemplate(newTemplate);
    setUserPreferences(prev => ({
      ...prev,
      defaultInvoiceTemplate: newTemplate
    }));
  };

  const saveSettings = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setSaveError('');
    
    try {
      // Save company information (only admins can do this)
      if (userRole === 'admin') {
        await saveCompanyInfo(companyInfo);
      }
      
      // Save user preferences
      await saveUserPreferences(currentUser.uid, userPreferences);
      
      // Save statistics settings
      await saveStatisticsSettings(currentUser.uid, statisticsSettings);
      
      // Save printing preferences
      await savePrintingPreferences(currentUser.uid, printingPreferences);
      
      setSaveSuccess(true);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSaveSuccess(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" gutterBottom>
              Settings
            </Typography>
            {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
          </Box>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="settings tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab 
                icon={<BusinessIcon />} 
                label="Company" 
                {...a11yProps(0)} 
                disabled={userRole !== 'admin'}
              />
              <Tab icon={<PersonIcon />} label="User Preferences" {...a11yProps(1)} />
              <Tab icon={<ReceiptIcon />} label="Invoice Templates" {...a11yProps(2)} />
              <Tab icon={<AccountBalanceIcon />} label="Bank Details" {...a11yProps(3)} disabled={userRole !== 'admin'} />
              <Tab icon={<PrintIcon />} label="Printing" {...a11yProps(4)} />
              <Tab icon={<AnalyticsIcon />} label="Statistics" {...a11yProps(5)} />
              <Tab icon={<GstIcon />} label="GST Settings" {...a11yProps(6)} />
              <Tab icon={<DarkModeIcon />} label="Appearance" {...a11yProps(7)} />
            </Tabs>
          </Box>
          
          {saveError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {saveError}
            </Alert>
          )}
          
          {/* Company Information Tab */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Company Information
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This information will appear on your invoices and other documents.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="name"
                  value={companyInfo.name}
                  onChange={handleCompanyInfoChange}
                  margin="normal"
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  value={companyInfo.email}
                  onChange={handleCompanyInfoChange}
                  margin="normal"
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={companyInfo.phone}
                  onChange={handleCompanyInfoChange}
                  margin="normal"
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Website"
                  name="website"
                  value={companyInfo.website}
                  onChange={handleCompanyInfoChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={companyInfo.address}
                  onChange={handleCompanyInfoChange}
                  margin="normal"
                  variant="outlined"
                  multiline
                  rows={4}
                />
                <TextField
                  fullWidth
                  label="GSTIN"
                  name="gstin"
                  value={companyInfo.gstin}
                  onChange={handleCompanyInfoChange}
                  margin="normal"
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Logo URL"
                  name="logo"
                  value={companyInfo.logo}
                  onChange={handleCompanyInfoChange}
                  margin="normal"
                  variant="outlined"
                  helperText="Enter the URL of your company logo"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* User Preferences Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              User Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Customize your experience with these personal preferences.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Default Currency"
                  name="defaultCurrency"
                  value={userPreferences.defaultCurrency}
                  onChange={handleUserPreferencesChange}
                  margin="normal"
                  variant="outlined"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                </TextField>
                
                <TextField
                  fullWidth
                  label="Default Tax Rate (%)"
                  name="defaultTaxRate"
                  type="number"
                  value={userPreferences.defaultTaxRate}
                  onChange={handleUserPreferencesChange}
                  margin="normal"
                  variant="outlined"
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userPreferences.showProductImages}
                      onChange={handleUserPreferencesChange}
                      name="showProductImages"
                    />
                  }
                  label="Show Product Images"
                />
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPreferences.enableStockAlerts}
                        onChange={handleUserPreferencesChange}
                        name="enableStockAlerts"
                      />
                    }
                    label="Enable Stock Alerts"
                  />
                </Box>
                
                <TextField
                  fullWidth
                  label="Stock Alert Threshold"
                  name="stockAlertThreshold"
                  type="number"
                  value={userPreferences.stockAlertThreshold}
                  onChange={handleUserPreferencesChange}
                  margin="normal"
                  variant="outlined"
                  disabled={!userPreferences.enableStockAlerts}
                  InputProps={{ inputProps: { min: 1 } }}
                  helperText="Alert when stock falls below this number"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Invoice Templates Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Invoice Template Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Choose your default invoice template. This will be used when creating new invoices.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <TemplateSwitcher
                selectedTemplate={template}
                onTemplateChange={handleTemplateChange}
                showLabels={true}
                label="Default Invoice Template"
              />
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: template === 'modern' ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                    borderColor: template === 'modern' ? 'primary.main' : 'divider',
                    bgcolor: template === 'modern' ? alpha(theme.palette.primary.main, 0.05) : 'background.paper'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Modern</Typography>
                    <Typography variant="body2" color="text.secondary">
                      A clean, contemporary design with a focus on visual hierarchy and modern typography.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: template === 'classic' ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                    borderColor: template === 'classic' ? 'primary.main' : 'divider',
                    bgcolor: template === 'classic' ? alpha(theme.palette.primary.main, 0.05) : 'background.paper'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Classic</Typography>
                    <Typography variant="body2" color="text.secondary">
                      A traditional invoice layout with a formal structure, suitable for professional services.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: template === 'minimalist' ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                    borderColor: template === 'minimalist' ? 'primary.main' : 'divider',
                    bgcolor: template === 'minimalist' ? alpha(theme.palette.primary.main, 0.05) : 'background.paper'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Minimalist</Typography>
                    <Typography variant="body2" color="text.secondary">
                      A simple, clean design with minimal elements, focusing on essential information only.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Bank Details Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Bank Details
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Manage the bank account information that appears on invoices and payment documents.
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Holder Name"
                  name="accountHolderName"
                  value={companyInfo.bankDetails?.accountHolderName || ''}
                  onChange={handleBankDetailsChange}
                  margin="normal"
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Bank Name"
                  name="bankName"
                  value={companyInfo.bankDetails?.bankName || ''}
                  onChange={handleBankDetailsChange}
                  margin="normal"
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Account Number"
                  name="accountNumber"
                  value={companyInfo.bankDetails?.accountNumber || ''}
                  onChange={handleBankDetailsChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="IFSC Code"
                  name="ifscCode"
                  value={companyInfo.bankDetails?.ifscCode || ''}
                  onChange={handleBankDetailsChange}
                  margin="normal"
                  variant="outlined"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
                <TextField
                  fullWidth
                  label="Branch"
                  name="branch"
                  value={companyInfo.bankDetails?.branch || ''}
                  onChange={handleBankDetailsChange}
                  margin="normal"
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="UPI ID"
                  name="upiId"
                  value={companyInfo.bankDetails?.upiId || ''}
                  onChange={handleBankDetailsChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Printing Preferences Tab */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" gutterBottom>
              Printing Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure your default printing settings. These settings will be used when printing invoices and other documents.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Default Number of Copies"
                  name="defaultCopies"
                  type="number"
                  value={printingPreferences.defaultCopies}
                  onChange={handlePrintingPreferencesChange}
                  margin="normal"
                  variant="outlined"
                  InputProps={{ inputProps: { min: 1, max: 10 } }}
                  helperText="Set the default number of copies to print (Default: 2)"
                />
                
                <TextField
                  select
                  fullWidth
                  label="Paper Size"
                  name="paperSize"
                  value={printingPreferences.paperSize}
                  onChange={handlePrintingPreferencesChange}
                  margin="normal"
                  variant="outlined"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                  <option value="Thermal">Thermal (80mm)</option>
                </TextField>
                
                <TextField
                  select
                  fullWidth
                  label="Orientation"
                  name="orientation"
                  value={printingPreferences.orientation}
                  onChange={handlePrintingPreferencesChange}
                  margin="normal"
                  variant="outlined"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </TextField>
                
                <TextField
                  select
                  fullWidth
                  label="Color Mode"
                  name="colorMode"
                  value={printingPreferences.colorMode}
                  onChange={handlePrintingPreferencesChange}
                  margin="normal"
                  variant="outlined"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="color">Color</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="blackwhite">Black & White</option>
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Default Template"
                  name="template"
                  value={printingPreferences.template}
                  onChange={handlePrintingPreferencesChange}
                  margin="normal"
                  variant="outlined"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="minimal">Minimal</option>
                  <option value="thermal">Thermal Receipt</option>
                  <option value="dualapp">Dual App</option>
                </TextField>
                
                <Box sx={{ mt: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={printingPreferences.includeHeader}
                        onChange={handlePrintingPreferencesChange}
                        name="includeHeader"
                      />
                    }
                    label="Include Header"
                  />
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={printingPreferences.includeFooter}
                        onChange={handlePrintingPreferencesChange}
                        name="includeFooter"
                      />
                    }
                    label="Include Footer"
                  />
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={printingPreferences.showWatermark}
                        onChange={handlePrintingPreferencesChange}
                        name="showWatermark"
                      />
                    }
                    label="Show Watermark"
                  />
                </Box>
              </Grid>
            </Grid>
            
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Default Copies:</strong> The number of copies is set to {printingPreferences.defaultCopies} by default. 
                You can always change this when printing individual documents.
              </Typography>
            </Alert>
          </TabPanel>
          
          {/* Statistics Settings Tab */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" gutterBottom>
              Statistics & Dashboard Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure which statistics are displayed on your dashboard.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={statisticsSettings.showRevenueStats}
                      onChange={handleStatisticsSettingsChange}
                      name="showRevenueStats"
                    />
                  }
                  label="Show Revenue Statistics"
                />
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={statisticsSettings.showProfitStats}
                        onChange={handleStatisticsSettingsChange}
                        name="showProfitStats"
                      />
                    }
                    label="Show Profit Statistics"
                  />
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={statisticsSettings.showInventoryStats}
                        onChange={handleStatisticsSettingsChange}
                        name="showInventoryStats"
                      />
                    }
                    label="Show Inventory Statistics"
                  />
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={statisticsSettings.showCustomerStats}
                        onChange={handleStatisticsSettingsChange}
                        name="showCustomerStats"
                      />
                    }
                    label="Show Customer Statistics"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Dashboard Time Range"
                  name="dashboardTimeRange"
                  value={statisticsSettings.dashboardTimeRange}
                  onChange={handleStatisticsSettingsChange}
                  margin="normal"
                  variant="outlined"
                  helperText="Default time period for dashboard statistics"
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="year">Last Year</option>
                  <option value="all">All Time</option>
                </TextField>
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* GST Settings Tab */}
          <TabPanel value={tabValue} index={5}>
            <Typography variant="h6" gutterBottom>
              GST Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure GST settings for your invoices. For detailed GST configuration, visit the dedicated GST settings page.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<GstIcon />}
                onClick={() => window.open('/settings/gst', '_blank')}
              >
                Open GST Settings
              </Button>
            </Box>
            
            <Alert severity="info">
              <Typography variant="body2">
                The GST settings page allows you to:
              </Typography>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                <li>Enable/disable GST for invoices</li>
                <li>Configure company GSTIN</li>
                <li>Set default GST rates</li>
                <li>Manage state codes and tax calculations</li>
              </ul>
            </Alert>
          </TabPanel>
          
          {/* Appearance Tab */}
          <TabPanel value={tabValue} index={6}>
            <Typography variant="h6" gutterBottom>
              Appearance Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Customize the look and feel of the application.
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isDarkMode}
                    onChange={handleThemeChange}
                    icon={<LightModeIcon />}
                    checkedIcon={<DarkModeIcon />}
                  />
                }
                label={isDarkMode ? 'Dark Mode' : 'Light Mode'}
              />
            </Box>
          </TabPanel>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={saveSettings}
              disabled={loading}
              startIcon={<SaveIcon />}
            >
              Save Settings
            </Button>
          </Box>
        </Paper>
        
        <Snackbar
          open={saveSuccess}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message="Settings saved successfully"
        />
    </Container>
  );
}

export default function ModernSettingsPage() {
  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Settings"
        pageType="settings"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <SettingsPage />
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}