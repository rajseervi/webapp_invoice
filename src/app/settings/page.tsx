'use client';
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Box,
  Divider,
  TextField,
  Grid,
  Button,
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
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTemplate } from '@/contexts/TemplateContext';
import TemplateSwitcher from '@/app/invoices/components/TemplateSwitcher';
import { 
  DarkMode as DarkModeIcon, 
  LightMode as LightModeIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  ReceiptLong as ReceiptIcon,
  Analytics as AnalyticsIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { 
  getCompanyInfo, 
  saveCompanyInfo, 
  getUserPreferences, 
  saveUserPreferences,
  getStatisticsSettings,
  saveStatisticsSettings
} from '@/services/settingsService';
import { CompanyInfo, UserPreferences, StatisticsSettings } from '@/types/company';

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

export default function SettingsPage() {
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
  });

  // User Preferences
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    defaultInvoiceTemplate: 'modern',
    defaultCurrency: 'INR',
    defaultTaxRate: 18,
    showProductImages: true,
    enableStockAlerts: true,
    stockAlertThreshold: 10,
  });

  // Statistics Settings
  const [statisticsSettings, setStatisticsSettings] = useState<StatisticsSettings>({
    showRevenueStats: true,
    showProfitStats: true,
    showInventoryStats: true,
    showCustomerStats: true,
    dashboardTimeRange: '30days',
  });

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
        setCompanyInfo(companyData);
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

  const handleCompanyInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({
      ...prev,
      [name]: value
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

  const handleTemplateChange = (newTemplate: 'modern' | 'classic' | 'minimalist') => {
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
    <DashboardLayout>
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
              <Tab icon={<AnalyticsIcon />} label="Statistics" {...a11yProps(3)} />
              <Tab icon={<DarkModeIcon />} label="Appearance" {...a11yProps(4)} />
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
          
          {/* Statistics Settings Tab */}
          <TabPanel value={tabValue} index={3}>
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
          
          {/* Appearance Tab */}
          <TabPanel value={tabValue} index={4}>
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
      </Container>
      
      <Snackbar
        open={saveSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Settings saved successfully"
      />
    </DashboardLayout>
  );
}