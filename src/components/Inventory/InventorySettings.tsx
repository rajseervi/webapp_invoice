"use client";
import React, { useState } from 'react';
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
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Chip,
  Alert,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  FormGroup,
  Checkbox
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  Hub as IntegrationIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';

interface InventorySettingsProps {
  onClose: () => void;
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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function InventorySettings({ onClose }: InventorySettingsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    general: {
      autoRefresh: true,
      refreshInterval: 5,
      defaultView: 'grid',
      itemsPerPage: 25,
      showOutOfStock: true,
      enableBarcodeScanning: false,
      currency: 'INR',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Asia/Kolkata'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      smsNotifications: false,
      lowStockThreshold: 10,
      criticalStockThreshold: 5,
      expiryWarningDays: 7,
      notificationFrequency: 'immediate',
      recipients: ['admin@company.com', 'inventory@company.com']
    },
    security: {
      requireApproval: true,
      enableAuditLog: true,
      sessionTimeout: 30,
      passwordPolicy: 'strong',
      twoFactorAuth: false,
      ipWhitelist: [],
      dataEncryption: true
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupTime: '02:00',
      retentionPeriod: 30,
      cloudBackup: false,
      backupLocation: '/backups/inventory'
    },
    integrations: {
      erpIntegration: false,
      accountingIntegration: false,
      ecommerceIntegration: false,
      apiAccess: false,
      webhooks: []
    },
    appearance: {
      theme: 'light',
      primaryColor: '#1976d2',
      compactMode: false,
      showAnimations: true,
      customLogo: '',
      language: 'en'
    }
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
    setUnsavedChanges(true);
  };

  const handleSave = () => {
    // Save settings to backend
    console.log('Saving settings:', settings);
    setUnsavedChanges(false);
  };

  const handleReset = () => {
    // Reset to default settings
    console.log('Resetting to defaults');
    setUnsavedChanges(false);
  };

  return (
    <Box>
      {/* Settings Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Inventory Settings
        </Typography>
        {unsavedChanges && (
          <Chip label="Unsaved Changes" color="warning" size="small" />
        )}
      </Box>

      {/* Settings Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="General" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Notifications" icon={<NotificationsIcon />} iconPosition="start" />
          <Tab label="Security" icon={<SecurityIcon />} iconPosition="start" />
          <Tab label="Backup" icon={<BackupIcon />} iconPosition="start" />
          <Tab label="Integrations" icon={<IntegrationIcon />} iconPosition="start" />
          <Tab label="Appearance" icon={<PaletteIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* General Settings */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Display Settings
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Default View</InputLabel>
                    <Select
                      value={settings.general.defaultView}
                      label="Default View"
                      onChange={(e) => handleSettingChange('general', 'defaultView', e.target.value)}
                    >
                      <MenuItem value="grid">Grid View</MenuItem>
                      <MenuItem value="list">List View</MenuItem>
                      <MenuItem value="table">Table View</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Items Per Page</InputLabel>
                    <Select
                      value={settings.general.itemsPerPage}
                      label="Items Per Page"
                      onChange={(e) => handleSettingChange('general', 'itemsPerPage', e.target.value)}
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={25}>25</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                      <MenuItem value={100}>100</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.general.showOutOfStock}
                        onChange={(e) => handleSettingChange('general', 'showOutOfStock', e.target.checked)}
                      />
                    }
                    label="Show Out of Stock Items"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.general.enableBarcodeScanning}
                        onChange={(e) => handleSettingChange('general', 'enableBarcodeScanning', e.target.checked)}
                      />
                    }
                    label="Enable Barcode Scanning"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Settings
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.general.autoRefresh}
                        onChange={(e) => handleSettingChange('general', 'autoRefresh', e.target.checked)}
                      />
                    }
                    label="Auto Refresh Data"
                  />

                  {settings.general.autoRefresh && (
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Refresh Interval: {settings.general.refreshInterval} minutes
                      </Typography>
                      <Slider
                        value={settings.general.refreshInterval}
                        onChange={(e, value) => handleSettingChange('general', 'refreshInterval', value)}
                        min={1}
                        max={60}
                        marks={[
                          { value: 1, label: '1m' },
                          { value: 15, label: '15m' },
                          { value: 30, label: '30m' },
                          { value: 60, label: '1h' }
                        ]}
                      />
                    </Box>
                  )}

                  <FormControl fullWidth size="small">
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={settings.general.currency}
                      label="Currency"
                      onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                    >
                      <MenuItem value="INR">Indian Rupee (₹)</MenuItem>
                      <MenuItem value="USD">US Dollar ($)</MenuItem>
                      <MenuItem value="EUR">Euro (€)</MenuItem>
                      <MenuItem value="GBP">British Pound (£)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Date Format</InputLabel>
                    <Select
                      value={settings.general.dateFormat}
                      label="Date Format"
                      onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                    >
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Notification Settings */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Channels
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.emailNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.pushNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                      />
                    }
                    label="Push Notifications"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.smsNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                      />
                    }
                    label="SMS Notifications"
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel>Notification Frequency</InputLabel>
                    <Select
                      value={settings.notifications.notificationFrequency}
                      label="Notification Frequency"
                      onChange={(e) => handleSettingChange('notifications', 'notificationFrequency', e.target.value)}
                    >
                      <MenuItem value="immediate">Immediate</MenuItem>
                      <MenuItem value="hourly">Hourly Digest</MenuItem>
                      <MenuItem value="daily">Daily Digest</MenuItem>
                      <MenuItem value="weekly">Weekly Digest</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alert Thresholds
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Low Stock Threshold: {settings.notifications.lowStockThreshold} units
                    </Typography>
                    <Slider
                      value={settings.notifications.lowStockThreshold}
                      onChange={(e, value) => handleSettingChange('notifications', 'lowStockThreshold', value)}
                      min={1}
                      max={100}
                      marks={[
                        { value: 5, label: '5' },
                        { value: 25, label: '25' },
                        { value: 50, label: '50' },
                        { value: 100, label: '100' }
                      ]}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Critical Stock Threshold: {settings.notifications.criticalStockThreshold} units
                    </Typography>
                    <Slider
                      value={settings.notifications.criticalStockThreshold}
                      onChange={(e, value) => handleSettingChange('notifications', 'criticalStockThreshold', value)}
                      min={1}
                      max={20}
                      marks={[
                        { value: 1, label: '1' },
                        { value: 5, label: '5' },
                        { value: 10, label: '10' },
                        { value: 20, label: '20' }
                      ]}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Expiry Warning: {settings.notifications.expiryWarningDays} days
                    </Typography>
                    <Slider
                      value={settings.notifications.expiryWarningDays}
                      onChange={(e, value) => handleSettingChange('notifications', 'expiryWarningDays', value)}
                      min={1}
                      max={30}
                      marks={[
                        { value: 1, label: '1d' },
                        { value: 7, label: '7d' },
                        { value: 15, label: '15d' },
                        { value: 30, label: '30d' }
                      ]}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Recipients
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Email Recipients (comma separated)"
                  value={settings.notifications.recipients.join(', ')}
                  onChange={(e) => handleSettingChange('notifications', 'recipients', e.target.value.split(', '))}
                  helperText="Enter email addresses separated by commas"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Security Settings */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Access Control
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.requireApproval}
                        onChange={(e) => handleSettingChange('security', 'requireApproval', e.target.checked)}
                      />
                    }
                    label="Require Approval for Stock Changes"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.enableAuditLog}
                        onChange={(e) => handleSettingChange('security', 'enableAuditLog', e.target.checked)}
                      />
                    }
                    label="Enable Audit Logging"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                      />
                    }
                    label="Two-Factor Authentication"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.security.dataEncryption}
                        onChange={(e) => handleSettingChange('security', 'dataEncryption', e.target.checked)}
                      />
                    }
                    label="Data Encryption"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Management
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Session Timeout: {settings.security.sessionTimeout} minutes
                    </Typography>
                    <Slider
                      value={settings.security.sessionTimeout}
                      onChange={(e, value) => handleSettingChange('security', 'sessionTimeout', value)}
                      min={5}
                      max={120}
                      marks={[
                        { value: 5, label: '5m' },
                        { value: 30, label: '30m' },
                        { value: 60, label: '1h' },
                        { value: 120, label: '2h' }
                      ]}
                    />
                  </Box>

                  <FormControl fullWidth size="small">
                    <InputLabel>Password Policy</InputLabel>
                    <Select
                      value={settings.security.passwordPolicy}
                      label="Password Policy"
                      onChange={(e) => handleSettingChange('security', 'passwordPolicy', e.target.value)}
                    >
                      <MenuItem value="basic">Basic (8+ characters)</MenuItem>
                      <MenuItem value="medium">Medium (8+ chars, numbers)</MenuItem>
                      <MenuItem value="strong">Strong (8+ chars, numbers, symbols)</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Backup Settings */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Backup Configuration
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.backup.autoBackup}
                        onChange={(e) => handleSettingChange('backup', 'autoBackup', e.target.checked)}
                      />
                    }
                    label="Enable Automatic Backup"
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel>Backup Frequency</InputLabel>
                    <Select
                      value={settings.backup.backupFrequency}
                      label="Backup Frequency"
                      onChange={(e) => handleSettingChange('backup', 'backupFrequency', e.target.value)}
                    >
                      <MenuItem value="hourly">Hourly</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    size="small"
                    label="Backup Time"
                    type="time"
                    value={settings.backup.backupTime}
                    onChange={(e) => handleSettingChange('backup', 'backupTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.backup.cloudBackup}
                        onChange={(e) => handleSettingChange('backup', 'cloudBackup', e.target.checked)}
                      />
                    }
                    label="Enable Cloud Backup"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Retention Policy
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Retention Period: {settings.backup.retentionPeriod} days
                    </Typography>
                    <Slider
                      value={settings.backup.retentionPeriod}
                      onChange={(e, value) => handleSettingChange('backup', 'retentionPeriod', value)}
                      min={7}
                      max={365}
                      marks={[
                        { value: 7, label: '7d' },
                        { value: 30, label: '30d' },
                        { value: 90, label: '90d' },
                        { value: 365, label: '1y' }
                      ]}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    size="small"
                    label="Backup Location"
                    value={settings.backup.backupLocation}
                    onChange={(e) => handleSettingChange('backup', 'backupLocation', e.target.value)}
                  />

                  <Alert severity="info">
                    Last backup: Today at 02:00 AM
                    <br />
                    Next backup: Tomorrow at 02:00 AM
                  </Alert>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Integration Settings */}
      <TabPanel value={activeTab} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  External Integrations
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        ERP Integration
                      </Typography>
                      <Switch
                        checked={settings.integrations.erpIntegration}
                        onChange={(e) => handleSettingChange('integrations', 'erpIntegration', e.target.checked)}
                      />
                      <Typography variant="body2" color="textSecondary">
                        Connect with ERP systems
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Accounting
                      </Typography>
                      <Switch
                        checked={settings.integrations.accountingIntegration}
                        onChange={(e) => handleSettingChange('integrations', 'accountingIntegration', e.target.checked)}
                      />
                      <Typography variant="body2" color="textSecondary">
                        Sync with accounting software
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        E-commerce
                      </Typography>
                      <Switch
                        checked={settings.integrations.ecommerceIntegration}
                        onChange={(e) => handleSettingChange('integrations', 'ecommerceIntegration', e.target.checked)}
                      />
                      <Typography variant="body2" color="textSecondary">
                        Connect online stores
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        API Access
                      </Typography>
                      <Switch
                        checked={settings.integrations.apiAccess}
                        onChange={(e) => handleSettingChange('integrations', 'apiAccess', e.target.checked)}
                      />
                      <Typography variant="body2" color="textSecondary">
                        Enable API endpoints
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Appearance Settings */}
      <TabPanel value={activeTab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Theme Settings
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Theme</InputLabel>
                    <Select
                      value={settings.appearance.theme}
                      label="Theme"
                      onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="auto">Auto (System)</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    size="small"
                    label="Primary Color"
                    type="color"
                    value={settings.appearance.primaryColor}
                    onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={settings.appearance.language}
                      label="Language"
                      onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="hi">Hindi</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Display Options
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.appearance.compactMode}
                        onChange={(e) => handleSettingChange('appearance', 'compactMode', e.target.checked)}
                      />
                    }
                    label="Compact Mode"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.appearance.showAnimations}
                        onChange={(e) => handleSettingChange('appearance', 'showAnimations', e.target.checked)}
                      />
                    }
                    label="Show Animations"
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Custom Logo URL"
                    value={settings.appearance.customLogo}
                    onChange={(e) => handleSettingChange('appearance', 'customLogo', e.target.value)}
                    helperText="URL to your company logo"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Action Buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={handleReset}
          disabled={!unsavedChanges}
        >
          Reset to Defaults
        </Button>

        <Stack direction="row" spacing={2}>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!unsavedChanges}
          >
            Save Settings
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}