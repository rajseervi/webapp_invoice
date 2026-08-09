"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Alert,
  Button,
  Divider,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import StockValidationConfigService, { StockValidationConfig } from '@/services/stockValidationConfig';

const StockValidationSettings: React.FC = () => {
  const [config, setConfig] = useState<StockValidationConfig>(
    StockValidationConfigService.getConfig()
  );
  const [hasChanges, setHasChanges] = useState(false);

  const handleConfigChange = (key: keyof StockValidationConfig, value: boolean) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleSaveConfig = () => {
    StockValidationConfigService.updateConfig(config);
    setHasChanges(false);
    // In a real app, you'd save to database here
    alert('Configuration saved! Changes will apply to new invoices.');
  };

  const handleResetToDefault = () => {
    const defaultConfig = StockValidationConfigService.getConfig();
    setConfig(defaultConfig);
    setHasChanges(true);
  };

  const getConfigPreset = (preset: 'lenient' | 'standard' | 'strict') => {
    switch (preset) {
      case 'lenient':
        return {
          validateStock: true,
          updateStock: true,
          allowZeroStock: true,
          allowNegativeStock: true,
          strictMode: false,
          showWarnings: true,
          enforcementLevel: 'lenient' as const
        };
      case 'standard':
        return {
          validateStock: true,
          updateStock: true,
          allowZeroStock: true,
          allowNegativeStock: false,
          strictMode: false,
          showWarnings: true,
          enforcementLevel: 'standard' as const
        };
      case 'strict':
        return {
          validateStock: true,
          updateStock: true,
          allowZeroStock: false,
          allowNegativeStock: false,
          strictMode: true,
          showWarnings: true,
          enforcementLevel: 'strict' as const
        };
    }
  };

  const applyPreset = (preset: 'lenient' | 'standard' | 'strict') => {
    setConfig(getConfigPreset(preset));
    setHasChanges(true);
  };

  const getCurrentModeDescription = () => {
    if (!config.validateStock) {
      return {
        mode: 'No Validation',
        description: 'Stock validation is completely disabled',
        color: 'error' as const,
        icon: <BlockIcon />
      };
    }

    if (config.allowZeroStock && config.allowNegativeStock && !config.strictMode) {
      return {
        mode: 'Lenient Mode',
        description: 'Zero stock and negative stock sales are allowed with warnings',
        color: 'success' as const,
        icon: <CheckCircleIcon />
      };
    }

    if (!config.allowZeroStock && !config.allowNegativeStock) {
      return {
        mode: 'Strict Mode',
        description: 'Zero stock and negative stock sales are blocked',
        color: 'error' as const,
        icon: <BlockIcon />
      };
    }

    return {
      mode: 'Standard Mode',
      description: 'Custom validation rules applied',
      color: 'warning' as const,
      icon: <WarningIcon />
    };
  };

  const currentMode = getCurrentModeDescription();

  return (
    <Box p={3}>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <SettingsIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Stock Validation Settings
            </Typography>
          </Box>

          {/* Current Mode Display */}
          <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              {currentMode.icon}
              <Typography variant="h6" fontWeight="bold">
                Current Mode: {currentMode.mode}
              </Typography>
              <Chip 
                label={currentMode.mode} 
                color={currentMode.color} 
                variant="outlined" 
              />
            </Box>
            <Typography variant="body2" color="textSecondary">
              {currentMode.description}
            </Typography>
          </Paper>

          {/* Quick Presets */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Quick Presets
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant={config.allowZeroStock && config.allowNegativeStock && !config.strictMode ? "contained" : "outlined"}
                  color="success"
                  onClick={() => applyPreset('lenient')}
                  startIcon={<CheckCircleIcon />}
                >
                  Lenient Mode
                  <br />
                  <small>Allow all sales</small>
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  onClick={() => applyPreset('standard')}
                  startIcon={<WarningIcon />}
                >
                  Standard Mode
                  <br />
                  <small>Block negative stock</small>
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant={!config.allowZeroStock && !config.allowNegativeStock ? "contained" : "outlined"}
                  color="error"
                  onClick={() => applyPreset('strict')}
                  startIcon={<BlockIcon />}
                >
                  Strict Mode
                  <br />
                  <small>Block zero stock</small>
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Detailed Settings */}
          <Typography variant="h6" gutterBottom>
            Detailed Settings
          </Typography>

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={config.validateStock}
                  onChange={(e) => handleConfigChange('validateStock', e.target.checked)}
                />
              }
              label="Enable Stock Validation"
            />
            <Typography variant="caption" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
              When enabled, the system will check stock levels before creating invoices
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={config.updateStock}
                  onChange={(e) => handleConfigChange('updateStock', e.target.checked)}
                />
              }
              label="Update Stock After Sales"
            />
            <Typography variant="caption" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
              Automatically reduce stock quantities when invoices are created
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={config.allowZeroStock}
                  onChange={(e) => handleConfigChange('allowZeroStock', e.target.checked)}
                  color="success"
                />
              }
              label="Allow Zero Stock Sales"
            />
            <Typography variant="caption" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
              ✅ When enabled, products with 0 stock can be sold (with warnings)
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={config.allowNegativeStock}
                  onChange={(e) => handleConfigChange('allowNegativeStock', e.target.checked)}
                  color="success"
                />
              }
              label="Allow Negative Stock"
            />
            <Typography variant="caption" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
              ✅ When enabled, stock can go below zero (overselling allowed)
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={config.strictMode}
                  onChange={(e) => handleConfigChange('strictMode', e.target.checked)}
                  color="error"
                />
              }
              label="Strict Mode"
            />
            <Typography variant="caption" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
              When enabled, even warnings become blocking errors
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={config.showWarnings}
                  onChange={(e) => handleConfigChange('showWarnings', e.target.checked)}
                />
              }
              label="Show Stock Warnings"
            />
            <Typography variant="caption" color="textSecondary" sx={{ ml: 4, mb: 2 }}>
              Display warnings to users about low stock, etc.
            </Typography>
          </FormGroup>

          {/* Impact Preview */}
          <Box mt={3}>
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="body2" fontWeight="bold">
                Current Configuration Impact:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {config.allowZeroStock ? <CheckCircleIcon color="success" /> : <BlockIcon color="error" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={config.allowZeroStock ? "✅ Zero stock products CAN be sold" : "❌ Zero stock products CANNOT be sold"}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {config.allowNegativeStock ? <CheckCircleIcon color="success" /> : <BlockIcon color="error" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={config.allowNegativeStock ? "✅ Stock CAN go negative" : "❌ Stock CANNOT go negative"}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {config.updateStock ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={config.updateStock ? "✅ Stock levels will be updated" : "⚠️ Stock levels will NOT be updated"}
                  />
                </ListItem>
              </List>
            </Alert>
          </Box>

          {/* Action Buttons */}
          <Box display="flex" gap={2} mt={3}>
            <Button
              variant="contained"
              onClick={handleSaveConfig}
              disabled={!hasChanges}
              startIcon={<SettingsIcon />}
            >
              Save Configuration
            </Button>
            <Button
              variant="outlined"
              onClick={handleResetToDefault}
              disabled={!hasChanges}
            >
              Reset to Default
            </Button>
          </Box>

          {hasChanges && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You have unsaved changes. Click "Save Configuration" to apply them.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StockValidationSettings;