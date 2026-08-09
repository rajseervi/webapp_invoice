"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Slider,
  Chip,
  IconButton,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Palette,
  Settings,
  Tune
} from '@mui/icons-material';
import { WidgetConfig } from '@/types/dashboard';

interface WidgetConfigPanelProps {
  widget: WidgetConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (widget: WidgetConfig) => void;
}

const colorOptions = [
  { name: 'Primary', value: '#1976d2' },
  { name: 'Secondary', value: '#dc004e' },
  { name: 'Success', value: '#2e7d32' },
  { name: 'Warning', value: '#ed6c02' },
  { name: 'Error', value: '#d32f2f' },
  { name: 'Info', value: '#0288d1' },
  { name: 'Purple', value: '#7b1fa2' },
  { name: 'Orange', value: '#f57c00' },
  { name: 'Teal', value: '#00695c' },
  { name: 'Pink', value: '#c2185b' }
];

export default function WidgetConfigPanel({
  widget,
  isOpen,
  onClose,
  onSave
}: WidgetConfigPanelProps) {
  const theme = useTheme();
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    if (widget) {
      setConfig({ ...widget.config });
    }
  }, [widget]);

  if (!isOpen || !widget) return null;

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    if (widget) {
      const updatedWidget: WidgetConfig = {
        ...widget,
        config,
        updatedAt: new Date()
      };
      onSave(updatedWidget);
      onClose();
    }
  };

  const renderStatsCardConfig = () => (
    <>
      <TextField
        fullWidth
        label="Title"
        value={config.title || ''}
        onChange={(e) => handleConfigChange('title', e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Value"
        value={config.value || ''}
        onChange={(e) => handleConfigChange('value', e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Change (%)"
        value={config.change || ''}
        onChange={(e) => handleConfigChange('change', e.target.value)}
        sx={{ mb: 2 }}
      />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Change Type</InputLabel>
        <Select
          value={config.changeType || 'positive'}
          onChange={(e) => handleConfigChange('changeType', e.target.value)}
        >
          <MenuItem value="positive">Positive</MenuItem>
          <MenuItem value="negative">Negative</MenuItem>
          <MenuItem value="neutral">Neutral</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Icon</InputLabel>
        <Select
          value={config.icon || 'money'}
          onChange={(e) => handleConfigChange('icon', e.target.value)}
        >
          <MenuItem value="money">Money</MenuItem>
          <MenuItem value="cart">Shopping Cart</MenuItem>
          <MenuItem value="people">People</MenuItem>
          <MenuItem value="inventory">Inventory</MenuItem>
          <MenuItem value="trending">Trending</MenuItem>
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Switch
            checked={config.showIcon || true}
            onChange={(e) => handleConfigChange('showIcon', e.target.checked)}
          />
        }
        label="Show Icon"
        sx={{ mb: 2 }}
      />
      <FormControlLabel
        control={
          <Switch
            checked={config.showChange || true}
            onChange={(e) => handleConfigChange('showChange', e.target.checked)}
          />
        }
        label="Show Change Indicator"
      />
    </>
  );

  const renderChartConfig = () => (
    <>
      <TextField
        fullWidth
        label="Chart Title"
        value={config.title || ''}
        onChange={(e) => handleConfigChange('title', e.target.value)}
        sx={{ mb: 2 }}
      />
      <FormControlLabel
        control={
          <Switch
            checked={config.showLegend || true}
            onChange={(e) => handleConfigChange('showLegend', e.target.checked)}
          />
        }
        label="Show Legend"
        sx={{ mb: 2 }}
      />
      <FormControlLabel
        control={
          <Switch
            checked={config.showGrid || true}
            onChange={(e) => handleConfigChange('showGrid', e.target.checked)}
          />
        }
        label="Show Grid"
        sx={{ mb: 2 }}
      />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Data Source</InputLabel>
        <Select
          value={config.dataSource || 'sample'}
          onChange={(e) => handleConfigChange('dataSource', e.target.value)}
        >
          <MenuItem value="sample">Sample Data</MenuItem>
          <MenuItem value="revenue">Revenue Data</MenuItem>
          <MenuItem value="orders">Orders Data</MenuItem>
          <MenuItem value="products">Products Data</MenuItem>
        </Select>
      </FormControl>
    </>
  );

  const renderContentConfig = () => (
    <>
      <TextField
        fullWidth
        label="Widget Title"
        value={config.title || ''}
        onChange={(e) => handleConfigChange('title', e.target.value)}
        sx={{ mb: 2 }}
      />
      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Max Items</Typography>
        <Slider
          value={config.maxItems || 5}
          onChange={(_, value) => handleConfigChange('maxItems', value)}
          min={1}
          max={10}
          marks
          valueLabelDisplay="auto"
        />
      </Box>
      <FormControlLabel
        control={
          <Switch
            checked={config.showRefresh || true}
            onChange={(e) => handleConfigChange('showRefresh', e.target.checked)}
          />
        }
        label="Show Refresh Button"
      />
    </>
  );

  const renderColorPicker = () => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Primary Color
      </Typography>
      <Grid container spacing={1}>
        {colorOptions.map((color) => (
          <Grid item key={color.value}>
            <Box
              onClick={() => handleConfigChange('color', color.value)}
              sx={{
                width: 32,
                height: 32,
                bgcolor: color.value,
                borderRadius: 1,
                cursor: 'pointer',
                border: config.color === color.value ? `3px solid ${theme.palette.text.primary}` : '2px solid transparent',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderSizeConfig = () => (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Widget Size
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Width"
            type="number"
            value={widget.position.width}
            onChange={(e) => {
              const newWidget = {
                ...widget,
                position: {
                  ...widget.position,
                  width: parseInt(e.target.value) || 300
                }
              };
              onSave(newWidget);
            }}
            InputProps={{ inputProps: { min: 200, max: 800 } }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Height"
            type="number"
            value={widget.position.height}
            onChange={(e) => {
              const newWidget = {
                ...widget,
                position: {
                  ...widget.position,
                  height: parseInt(e.target.value) || 200
                }
              };
              onSave(newWidget);
            }}
            InputProps={{ inputProps: { min: 150, max: 600 } }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 400,
        height: '100vh',
        bgcolor: 'background.paper',
        borderLeft: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[8],
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.primary.main, 0.05)
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={600} color="primary">
            Configure Widget
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {widget.title} • {widget.type}
        </Typography>
      </Box>

      {/* Configuration Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* General Settings */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Settings sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                General Settings
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {widget.type === 'stats-card' && renderStatsCardConfig()}
            {(widget.type.startsWith('chart-') || widget.type === 'revenue-overview') && renderChartConfig()}
            {(['recent-orders', 'top-products', 'notifications', 'quick-actions', 'calendar', 'weather', 'todo-list'].includes(widget.type)) && renderContentConfig()}
          </AccordionDetails>
        </Accordion>

        {/* Appearance */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Palette sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Appearance
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {renderColorPicker()}
          </AccordionDetails>
        </Accordion>

        {/* Size & Position */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tune sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Size & Position
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {renderSizeConfig()}
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        p: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.default, 0.5)
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={onClose} sx={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: 1 }}>
            Save Changes
          </Button>
        </Box>
      </Box>
    </Box>
  );
}