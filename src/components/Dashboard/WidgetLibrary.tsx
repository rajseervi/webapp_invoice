"use client";

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  BarChart,
  PieChart,
  TrendingUp,
  ShoppingCart,
  Inventory,
  AttachMoney,
  PlayArrow,
  Notifications,
  CalendarToday,
  Cloud,
  CheckBox,
  DragIndicator
} from '@mui/icons-material';
import { useDraggable } from '@dnd-kit/core';
import { WidgetDefinition, WidgetType } from '@/types/dashboard';

const widgetDefinitions: WidgetDefinition[] = [
  // Analytics Widgets
  {
    type: 'stats-card',
    name: 'Stats Card',
    description: 'Display key metrics and KPIs',
    icon: 'TrendingUp',
    defaultSize: { width: 300, height: 150 },
    minSize: { width: 250, height: 120 },
    configurable: true,
    category: 'analytics'
  },
  {
    type: 'chart-line',
    name: 'Line Chart',
    description: 'Show trends over time',
    icon: 'TrendingUp',
    defaultSize: { width: 400, height: 300 },
    minSize: { width: 300, height: 200 },
    configurable: true,
    category: 'analytics'
  },
  {
    type: 'chart-bar',
    name: 'Bar Chart',
    description: 'Compare different categories',
    icon: 'BarChart',
    defaultSize: { width: 400, height: 300 },
    minSize: { width: 300, height: 200 },
    configurable: true,
    category: 'analytics'
  },
  {
    type: 'chart-pie',
    name: 'Pie Chart',
    description: 'Show proportional data',
    icon: 'PieChart',
    defaultSize: { width: 350, height: 350 },
    minSize: { width: 250, height: 250 },
    configurable: true,
    category: 'analytics'
  },
  {
    type: 'revenue-overview',
    name: 'Revenue Overview',
    description: 'Comprehensive revenue analytics',
    icon: 'AttachMoney',
    defaultSize: { width: 500, height: 350 },
    minSize: { width: 400, height: 250 },
    configurable: true,
    category: 'analytics'
  },
  // Content Widgets
  {
    type: 'recent-orders',
    name: 'Recent Orders',
    description: 'Latest order activity',
    icon: 'ShoppingCart',
    defaultSize: { width: 400, height: 300 },
    minSize: { width: 300, height: 200 },
    configurable: true,
    category: 'content'
  },
  {
    type: 'top-products',
    name: 'Top Products',
    description: 'Best selling products',
    icon: 'Inventory',
    defaultSize: { width: 350, height: 250 },
    minSize: { width: 300, height: 200 },
    configurable: true,
    category: 'content'
  },
  {
    type: 'notifications',
    name: 'Notifications',
    description: 'System alerts and updates',
    icon: 'Notifications',
    defaultSize: { width: 300, height: 400 },
    minSize: { width: 250, height: 300 },
    configurable: true,
    category: 'content'
  },
  // Productivity Widgets
  {
    type: 'calendar',
    name: 'Calendar',
    description: 'Schedule and events',
    icon: 'CalendarToday',
    defaultSize: { width: 350, height: 300 },
    minSize: { width: 300, height: 250 },
    configurable: true,
    category: 'productivity'
  },
  {
    type: 'todo-list',
    name: 'Todo List',
    description: 'Task management',
    icon: 'CheckBox',
    defaultSize: { width: 300, height: 350 },
    minSize: { width: 250, height: 250 },
    configurable: true,
    category: 'productivity'
  },
  {
    type: 'weather',
    name: 'Weather',
    description: 'Current weather conditions',
    icon: 'Cloud',
    defaultSize: { width: 250, height: 200 },
    minSize: { width: 200, height: 150 },
    configurable: true,
    category: 'productivity'
  },
  // Action Widgets
  {
    type: 'quick-actions',
    name: 'Quick Actions',
    description: 'Frequently used actions',
    icon: 'PlayArrow',
    defaultSize: { width: 300, height: 200 },
    minSize: { width: 250, height: 150 },
    configurable: true,
    category: 'actions'
  }
];

const iconMap: Record<string, React.ReactNode> = {
  TrendingUp: <TrendingUp />,
  BarChart: <BarChart />,
  PieChart: <PieChart />,
  ShoppingCart: <ShoppingCart />,
  Inventory: <Inventory />,
  AttachMoney: <AttachMoney />,
  PlayArrow: <PlayArrow />,
  Notifications: <Notifications />,
  CalendarToday: <CalendarToday />,
  Cloud: <Cloud />,
  CheckBox: <CheckBox />
};

interface DraggableWidgetProps {
  widget: WidgetDefinition;
}

function DraggableWidget({ widget }: DraggableWidgetProps) {
  const theme = useTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `new-widget-${widget.type}`,
    data: {
      type: 'new-widget',
      widgetType: widget.type,
      widget
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.8 : 1,
  } : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      sx={{
        mb: 1,
        cursor: 'grab',
        transition: 'all 0.2s ease',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        '&:hover': {
          borderColor: theme.palette.primary.main,
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)'
        },
        '&:active': {
          cursor: 'grabbing'
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            mr: 1.5
          }}>
            {iconMap[widget.icon]}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {widget.name}
            </Typography>
          </Box>
          <DragIndicator sx={{ color: 'text.secondary', fontSize: 16 }} />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {widget.description}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip 
            label={widget.category} 
            size="small" 
            variant="outlined"
            sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
          />
          <Typography variant="caption" color="text.secondary">
            {widget.defaultSize.width}×{widget.defaultSize.height}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

interface WidgetLibraryProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function WidgetLibrary({ isOpen, onToggle }: WidgetLibraryProps) {
  const theme = useTheme();
  
  const groupedWidgets = widgetDefinitions.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, WidgetDefinition[]>);

  const categoryLabels = {
    analytics: 'Analytics & Charts',
    content: 'Content & Data',
    productivity: 'Productivity',
    actions: 'Quick Actions'
  };

  const categoryIcons = {
    analytics: <BarChart />,
    content: <Inventory />,
    productivity: <CalendarToday />,
    actions: <PlayArrow />
  };

  if (!isOpen) return null;

  return (
    <Box
      sx={{
        width: 320,
        height: '100%',
        bgcolor: 'background.paper',
        borderRight: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.primary.main, 0.05)
      }}>
        <Typography variant="h6" fontWeight={600} color="primary">
          Widget Library
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Drag widgets to your dashboard
        </Typography>
      </Box>

      {/* Widget Categories */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {Object.entries(groupedWidgets).map(([category, widgets]) => (
          <Accordion 
            key={category} 
            defaultExpanded
            sx={{ 
              mb: 1,
              '&:before': { display: 'none' },
              boxShadow: 'none',
              border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              borderRadius: 1,
              '&.Mui-expanded': {
                margin: '0 0 8px 0'
              }
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                minHeight: 48,
                '&.Mui-expanded': {
                  minHeight: 48
                },
                '& .MuiAccordionSummary-content': {
                  margin: '8px 0',
                  '&.Mui-expanded': {
                    margin: '8px 0'
                  }
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 0.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  mr: 1,
                  fontSize: 16
                }}>
                  {categoryIcons[category as keyof typeof categoryIcons]}
                </Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </Typography>
                <Chip 
                  label={widgets.length} 
                  size="small" 
                  sx={{ ml: 'auto', mr: 1, minWidth: 24, height: 20 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 1 }}>
              {widgets.map((widget) => (
                <DraggableWidget key={widget.type} widget={widget} />
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ 
        p: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.default, 0.5)
      }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          {widgetDefinitions.length} widgets available
        </Typography>
      </Box>
    </Box>
  );
}