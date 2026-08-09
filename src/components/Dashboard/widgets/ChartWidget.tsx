"use client";

import React from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { WidgetConfig } from '@/types/dashboard';
import BaseWidget from './BaseWidget';

interface ChartWidgetProps {
  widget: WidgetConfig;
  onConfigure?: (widget: WidgetConfig) => void;
  onDelete?: (widgetId: string) => void;
  onDuplicate?: (widget: WidgetConfig) => void;
  isSelected?: boolean;
  onSelect?: (widgetId: string) => void;
}

// Sample data - in a real app, this would come from props or API
const sampleLineData = [
  { name: 'Jan', value: 4000, revenue: 2400 },
  { name: 'Feb', value: 3000, revenue: 1398 },
  { name: 'Mar', value: 2000, revenue: 9800 },
  { name: 'Apr', value: 2780, revenue: 3908 },
  { name: 'May', value: 1890, revenue: 4800 },
  { name: 'Jun', value: 2390, revenue: 3800 },
];

const sampleBarData = [
  { name: 'Products', value: 400 },
  { name: 'Orders', value: 300 },
  { name: 'Customers', value: 200 },
  { name: 'Revenue', value: 278 },
];

const samplePieData = [
  { name: 'Electronics', value: 400, color: '#0088FE' },
  { name: 'Clothing', value: 300, color: '#00C49F' },
  { name: 'Books', value: 300, color: '#FFBB28' },
  { name: 'Home', value: 200, color: '#FF8042' },
];

export default function ChartWidget({
  widget,
  onConfigure,
  onDelete,
  onDuplicate,
  isSelected,
  onSelect
}: ChartWidgetProps) {
  const theme = useTheme();
  
  // Default configuration
  const config = {
    chartType: widget.type.replace('chart-', ''), // line, bar, pie
    title: 'Chart',
    showLegend: true,
    showGrid: true,
    colors: [theme.palette.primary.main, theme.palette.secondary.main],
    dataSource: 'sample',
    ...widget.config
  };

  const renderChart = () => {
    const commonProps = {
      width: '100%',
      height: '100%'
    };

    switch (config.chartType) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={sampleLineData}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />}
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  boxShadow: theme.shadows[4]
                }}
              />
              {config.showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={config.colors[0]} 
                strokeWidth={2}
                dot={{ fill: config.colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: config.colors[0], strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke={config.colors[1] || theme.palette.secondary.main} 
                strokeWidth={2}
                dot={{ fill: config.colors[1] || theme.palette.secondary.main, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: config.colors[1] || theme.palette.secondary.main, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={sampleBarData}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />}
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  boxShadow: theme.shadows[4]
                }}
              />
              {config.showLegend && <Legend />}
              <Bar 
                dataKey="value" 
                fill={config.colors[0]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={samplePieData}
                cx="50%"
                cy="50%"
                outerRadius={Math.min(widget.position.width, widget.position.height) * 0.15}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {samplePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                  boxShadow: theme.shadows[4]
                }}
              />
              {config.showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: 'text.secondary'
          }}>
            <CircularProgress />
          </Box>
        );
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
        {/* Chart Title */}
        {config.title && (
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              fontSize: widget.position.height < 250 ? '1rem' : '1.25rem'
            }}
          >
            {config.title}
          </Typography>
        )}

        {/* Chart Container */}
        <Box sx={{ 
          flex: 1, 
          minHeight: 0, // Important for ResponsiveContainer
          '& .recharts-wrapper': {
            fontSize: '12px'
          }
        }}>
          {renderChart()}
        </Box>
      </Box>
    </BaseWidget>
  );
}