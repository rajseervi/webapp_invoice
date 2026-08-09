"use client";

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  AttachMoney,
  ShoppingCart,
  People,
  Inventory
} from '@mui/icons-material';
import { WidgetConfig } from '@/types/dashboard';
import BaseWidget from './BaseWidget';

interface StatsCardWidgetProps {
  widget: WidgetConfig;
  onConfigure?: (widget: WidgetConfig) => void;
  onDelete?: (widgetId: string) => void;
  onDuplicate?: (widget: WidgetConfig) => void;
  isSelected?: boolean;
  onSelect?: (widgetId: string) => void;
}

const iconMap = {
  money: AttachMoney,
  cart: ShoppingCart,
  people: People,
  inventory: Inventory,
  trending: TrendingUp
};

export default function StatsCardWidget({
  widget,
  onConfigure,
  onDelete,
  onDuplicate,
  isSelected,
  onSelect
}: StatsCardWidgetProps) {
  const theme = useTheme();
  
  // Default configuration
  const config = {
    title: 'Revenue',
    value: '₹2,45,000',
    change: '+12.5%',
    changeType: 'positive' as 'positive' | 'negative' | 'neutral',
    icon: 'money',
    color: theme.palette.primary.main,
    showIcon: true,
    showChange: true,
    ...widget.config
  };

  const IconComponent = iconMap[config.icon as keyof typeof iconMap] || TrendingUp;
  
  const getTrendIcon = () => {
    switch (config.changeType) {
      case 'positive':
        return <TrendingUp sx={{ fontSize: 16 }} />;
      case 'negative':
        return <TrendingDown sx={{ fontSize: 16 }} />;
      default:
        return <TrendingFlat sx={{ fontSize: 16 }} />;
    }
  };

  const getChangeColor = () => {
    switch (config.changeType) {
      case 'positive':
        return theme.palette.success.main;
      case 'negative':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <BaseWidget
      widget={widget}
      onConfigure={onConfigure}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {config.title}
          </Typography>
          {config.showIcon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(config.color, 0.1),
                color: config.color
              }}
            >
              <IconComponent sx={{ fontSize: 20 }} />
            </Box>
          )}
        </Box>

        {/* Main Value */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: 'text.primary',
              mb: 1,
              fontSize: widget.position.height < 150 ? '1.5rem' : '2rem'
            }}
          >
            {config.value}
          </Typography>

          {/* Change Indicator */}
          {config.showChange && config.change && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip
                icon={getTrendIcon()}
                label={config.change}
                size="small"
                sx={{
                  bgcolor: alpha(getChangeColor(), 0.1),
                  color: getChangeColor(),
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: 'inherit'
                  }
                }}
              />
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 'auto', pt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>
    </BaseWidget>
  );
}