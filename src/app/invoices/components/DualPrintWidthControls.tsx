"use client";
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Slider,
  Switch,
  FormControlLabel,
  Paper,
  Grid,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Stack,
  Button
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon
} from '@mui/icons-material';

interface DualPrintWidthControlsProps {
  onSettingsChange: (settings: any) => void;
  initialSettings?: any;
  onPreview?: () => void;
  onPrint?: () => void;
}

const DualPrintWidthControls: React.FC<DualPrintWidthControlsProps> = ({
  onSettingsChange,
  initialSettings = {},
  onPreview,
  onPrint
}) => {
  const [settings, setSettings] = useState({
    leftWidth: 50,
    rightWidth: 50,
    gapWidth: 12,
    equalWidth: true,
    fontSize: 10,
    orientation: 'landscape', // Default to landscape for dual layout
    colorMode: 'color',
    showWatermark: false,
    ...initialSettings
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    
    // Auto-adjust widths when equal width is enabled
    if (key === 'equalWidth' && value) {
      newSettings.leftWidth = 50;
      newSettings.rightWidth = 50;
    }
    
    // Ensure widths don't exceed 100% total
    if (key === 'leftWidth' && !newSettings.equalWidth) {
      const maxRight = 100 - value;
      if (newSettings.rightWidth > maxRight) {
        newSettings.rightWidth = maxRight;
      }
    }
    
    if (key === 'rightWidth' && !newSettings.equalWidth) {
      const maxLeft = 100 - value;
      if (newSettings.leftWidth > maxLeft) {
        newSettings.leftWidth = maxLeft;
      }
    }
    
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      leftWidth: 50,
      rightWidth: 50,
      gapWidth: 12,
      equalWidth: true,
      fontSize: 10,
      orientation: 'landscape', // Default to landscape for dual layout
      colorMode: 'color',
      showWatermark: false
    };
    setSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  const presetConfigurations = [
    { name: 'Equal Split', leftWidth: 50, rightWidth: 50, equalWidth: true, gapWidth: 12 },
    { name: 'Original Focus', leftWidth: 60, rightWidth: 40, equalWidth: false, gapWidth: 12 },
    { name: 'Duplicate Focus', leftWidth: 40, rightWidth: 60, equalWidth: false, gapWidth: 12 },
    { name: 'Narrow Gap', leftWidth: 50, rightWidth: 50, gapWidth: 6, equalWidth: true },
    { name: 'Wide Gap', leftWidth: 50, rightWidth: 50, gapWidth: 20, equalWidth: true },
    { name: 'Landscape Optimal', leftWidth: 50, rightWidth: 50, gapWidth: 8, equalWidth: true, orientation: 'landscape' },
    { name: 'Portrait Standard', leftWidth: 50, rightWidth: 50, gapWidth: 12, equalWidth: true, orientation: 'portrait' }
  ];

  const applyPreset = (preset: any) => {
    const newSettings = { ...settings, ...preset };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Dual Print Width Settings
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Reset to defaults">
            <IconButton onClick={resetToDefaults} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {onPreview && (
            <Button
              onClick={onPreview}
              startIcon={<VisibilityIcon />}
              variant="outlined"
              size="small"
            >
              Preview
            </Button>
          )}
          {onPrint && (
            <Button
              onClick={onPrint}
              startIcon={<PrintIcon />}
              variant="contained"
              size="small"
            >
              Print
            </Button>
          )}
        </Stack>
      </Box>

      {/* Quick Presets */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Quick Presets
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {presetConfigurations.map((preset, index) => (
            <Chip
              key={index}
              label={preset.name}
              onClick={() => applyPreset(preset)}
              variant="outlined"
              sx={{ 
                cursor: 'pointer',
                '&:hover': { bgcolor: 'primary.main', color: 'white' }
              }}
            />
          ))}
        </Stack>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={3}>
        {/* Width Controls */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Width Configuration
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.equalWidth}
                onChange={(e) => handleSettingChange('equalWidth', e.target.checked)}
                color="primary"
              />
            }
            label="Equal Width (50/50)"
            sx={{ mb: 2 }}
          />

          {!settings.equalWidth && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Original Copy Width: {settings.leftWidth}%
                </Typography>
                <Slider
                  value={settings.leftWidth}
                  onChange={(_, value) => handleSettingChange('leftWidth', value)}
                  min={20}
                  max={80}
                  step={5}
                  marks={[
                    { value: 20, label: '20%' },
                    { value: 50, label: '50%' },
                    { value: 80, label: '80%' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Duplicate Copy Width: {settings.rightWidth}%
                </Typography>
                <Slider
                  value={settings.rightWidth}
                  onChange={(_, value) => handleSettingChange('rightWidth', value)}
                  min={20}
                  max={80}
                  step={5}
                  marks={[
                    { value: 20, label: '20%' },
                    { value: 50, label: '50%' },
                    { value: 80, label: '80%' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>
            </>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Gap Width: {settings.gapWidth}px
            </Typography>
            <Slider
              value={settings.gapWidth}
              onChange={(_, value) => handleSettingChange('gapWidth', value)}
              min={4}
              max={30}
              step={2}
              marks={[
                { value: 4, label: '4px' },
                { value: 12, label: '12px' },
                { value: 30, label: '30px' }
              ]}
              valueLabelDisplay="auto"
            />
          </Box>
        </Grid>

        {/* Advanced Settings */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Advanced Settings
            </Typography>
            <Switch
              checked={showAdvanced}
              onChange={(e) => setShowAdvanced(e.target.checked)}
              size="small"
            />
          </Box>

          {showAdvanced && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Font Size: {settings.fontSize}pt
                </Typography>
                <Slider
                  value={settings.fontSize}
                  onChange={(_, value) => handleSettingChange('fontSize', value)}
                  min={8}
                  max={14}
                  step={1}
                  marks={[
                    { value: 8, label: '8pt' },
                    { value: 10, label: '10pt' },
                    { value: 12, label: '12pt' },
                    { value: 14, label: '14pt' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.orientation === 'landscape'}
                      onChange={(e) => handleSettingChange('orientation', e.target.checked ? 'landscape' : 'portrait')}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {settings.orientation === 'landscape' ? '🖼️ Landscape' : '📄 Portrait'} Orientation
                      </Typography>
                      <Chip 
                        label={settings.orientation === 'landscape' ? 'More Space' : 'Standard'} 
                        size="small" 
                        color={settings.orientation === 'landscape' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  }
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, ml: 4 }}>
                  {settings.orientation === 'landscape' 
                    ? 'Wider layout with more horizontal space for content'
                    : 'Standard vertical layout, good for most invoices'
                  }
                </Typography>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.colorMode === 'color'}
                    onChange={(e) => handleSettingChange('colorMode', e.target.checked ? 'color' : 'blackwhite')}
                    color="primary"
                  />
                }
                label="Color Mode"
                sx={{ mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.showWatermark}
                    onChange={(e) => handleSettingChange('showWatermark', e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Watermark"
              />
            </>
          )}
        </Grid>
      </Grid>

      {/* Width Preview */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Width Preview
          </Typography>
          <Chip 
            label={`${settings.orientation === 'landscape' ? '🖼️' : '📄'} ${settings.orientation.toUpperCase()}`}
            size="small"
            color={settings.orientation === 'landscape' ? 'success' : 'primary'}
            variant="filled"
          />
        </Box>
        <Box sx={{ 
          display: 'flex', 
          height: settings.orientation === 'landscape' ? 30 : 40, 
          width: settings.orientation === 'landscape' ? '100%' : '80%',
          border: '1px solid #ddd', 
          borderRadius: 1, 
          overflow: 'hidden',
          mx: settings.orientation === 'landscape' ? 0 : 'auto'
        }}>
          <Box
            sx={{
              width: `${settings.leftWidth}%`,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            ORIGINAL ({settings.leftWidth}%)
          </Box>
          <Box
            sx={{
              width: `${settings.gapWidth}px`,
              bgcolor: 'grey.300',
              flexShrink: 0
            }}
          />
          <Box
            sx={{
              width: `${settings.rightWidth}%`,
              bgcolor: 'secondary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            DUPLICATE ({settings.rightWidth}%)
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Total: {settings.leftWidth + settings.rightWidth}% content + {settings.gapWidth}px gap
        </Typography>
      </Box>
    </Paper>
  );
};

export default DualPrintWidthControls;