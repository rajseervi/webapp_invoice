"use client";
import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Box,
  Typography,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  alpha,
  ButtonGroup,
  Button
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  CalendarViewWeek as CalendarViewWeekIcon,
  CalendarViewMonth as CalendarViewMonthIcon,
  CalendarToday as CalendarTodayIcon,
  DateRange as DateRangeIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  BubbleChart as BubbleChartIcon,
  DonutLarge as DonutLargeIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

// Define interfaces
interface SalesData {
  name: string;
  sales?: number;
  target?: number;
  amount?: number;
  value?: number;
  uv?: number;
  pv?: number;
}

interface PerformanceData {
  subject: string;
  A: number;
  B: number;
  fullMark: number;
}

interface ScatterData {
  x: number;
  y: number;
  z: number;
  name: string;
}

interface EnhancedVisualizationsProps {
  monthlySalesData: SalesData[];
  categorySalesData: SalesData[];
  dailySalesData: SalesData[];
  formatCurrency: (amount: number) => string;
  onRefresh: () => void;
}

// Color schemes
const COLORS = ['#4361ee', '#3a0ca3', '#4895ef', '#4cc9f0', '#f72585', '#7209b7', '#3f37c9', '#4cc9f0', '#480ca8', '#b5179e'];
const SEQUENTIAL_COLORS = ['#caf0f8', '#90e0ef', '#00b4d8', '#0077b6', '#03045e'];
const DIVERGING_COLORS = ['#d8f3dc', '#95d5b2', '#52b788', '#2d6a4f', '#081c15'];

// Sample performance data for radar chart
const performanceData = [
  { subject: 'Sales', A: 120, B: 110, fullMark: 150 },
  { subject: 'Marketing', A: 98, B: 130, fullMark: 150 },
  { subject: 'Development', A: 86, B: 130, fullMark: 150 },
  { subject: 'Customer Support', A: 99, B: 100, fullMark: 150 },
  { subject: 'HR', A: 85, B: 90, fullMark: 150 },
  { subject: 'Finance', A: 65, B: 85, fullMark: 150 },
];

// Sample data for scatter chart
const scatterData = [
  { x: 100, y: 200, z: 200, name: 'Product A' },
  { x: 120, y: 100, z: 260, name: 'Product B' },
  { x: 170, y: 300, z: 400, name: 'Product C' },
  { x: 140, y: 250, z: 280, name: 'Product D' },
  { x: 150, y: 400, z: 500, name: 'Product E' },
  { x: 110, y: 280, z: 200, name: 'Product F' },
];

const EnhancedVisualizations: React.FC<EnhancedVisualizationsProps> = ({ 
  monthlySalesData, 
  categorySalesData, 
  dailySalesData, 
  formatCurrency,
  onRefresh
}) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('area');
  
  // Handle time range change
  const handleTimeRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeRange: 'day' | 'week' | 'month' | 'year' | null,
  ) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };
  
  // Handle chart type change
  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: 'bar' | 'line' | 'area' | null,
  ) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };
  
  // Custom tooltip component for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, boxShadow: theme.shadows[3] }}>
          <Typography variant="subtitle2" color="text.primary">
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={`item-${index}`} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: entry.color,
                  mr: 1,
                  borderRadius: '50%',
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {entry.name}: {entry.value && formatCurrency ? formatCurrency(entry.value) : entry.value}
              </Typography>
            </Box>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Grid container spacing={{ xs: 2, sm: 3 }}>
      {/* Sales Performance Chart */}
      <Grid item xs={12}>
        <Paper sx={{ 
          p: { xs: 2, sm: 3 }, 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', md: 'center' }, 
            mb: { xs: 3, sm: 2 },
            gap: { xs: 2, md: 0 }
          }}>
            <Box>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                Sales Performance Dashboard
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                Comprehensive view of your business performance metrics
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              gap: { xs: 1, sm: 0 },
              width: { xs: '100%', md: 'auto' }
            }}>
              <ToggleButtonGroup
                value={timeRange}
                exclusive
                onChange={handleTimeRangeChange}
                size="small"
                sx={{ 
                  mr: { xs: 1, sm: 2 },
                  '.MuiToggleButton-root': {
                    padding: { xs: '4px 8px', sm: '6px 12px' }
                  }
                }}
              >
                <ToggleButton value="day">
                  <Tooltip title="Daily">
                    <CalendarTodayIcon sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }} />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="week">
                  <Tooltip title="Weekly">
                    <CalendarViewWeekIcon sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }} />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="month">
                  <Tooltip title="Monthly">
                    <CalendarViewMonthIcon sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }} />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="year">
                  <Tooltip title="Yearly">
                    <DateRangeIcon sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }} />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
              
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={handleChartTypeChange}
                size="small"
                sx={{ 
                  mr: { xs: 1, sm: 2 },
                  '.MuiToggleButton-root': {
                    padding: { xs: '4px 8px', sm: '6px 12px' }
                  }
                }}
              >
                <ToggleButton value="bar">
                  <Tooltip title="Bar Chart">
                    <BarChartIcon sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }} />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="line">
                  <Tooltip title="Line Chart">
                    <TimelineIcon sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }} />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="area">
                  <Tooltip title="Area Chart">
                    <DonutLargeIcon sx={{ fontSize: { xs: '0.875rem', sm: '1.25rem' } }} />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
              
              <Tooltip title="Refresh Data">
                <IconButton 
                  onClick={onRefresh} 
                  size="small"
                  sx={{ padding: { xs: '4px', sm: '8px' } }}
                >
                  <RefreshIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Box sx={{ 
            height: { xs: 300, sm: 350, md: 400 }, 
            mt: { xs: 2, sm: 3 }
          }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart
                  data={monthlySalesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="sales" 
                    name="Actual Sales" 
                    fill={theme.palette.primary.main} 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="target" 
                    name="Target" 
                    fill={theme.palette.secondary.main} 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart
                  data={monthlySalesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    name="Actual Sales" 
                    stroke={theme.palette.primary.main} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    name="Target" 
                    stroke={theme.palette.secondary.main} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : (
                <AreaChart
                  data={monthlySalesData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    name="Actual Sales" 
                    stroke={theme.palette.primary.main}
                    fill={alpha(theme.palette.primary.main, 0.2)}
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="target" 
                    name="Target" 
                    stroke={theme.palette.secondary.main}
                    fill={alpha(theme.palette.secondary.main, 0.2)}
                    strokeWidth={2}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
      
      {/* Advanced Visualizations Row */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ 
          p: 3, 
          height: '100%', 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Department Performance
            </Typography>
            <ButtonGroup size="small">
              <Button variant="outlined">This Year</Button>
              <Button variant="outlined">Last Year</Button>
            </ButtonGroup>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Comparative performance across departments
          </Typography>
          <Box sx={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={150} data={performanceData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                <Radar
                  name="This Year"
                  dataKey="A"
                  stroke={theme.palette.primary.main}
                  fill={alpha(theme.palette.primary.main, 0.2)}
                  fillOpacity={0.6}
                />
                <Radar
                  name="Last Year"
                  dataKey="B"
                  stroke={theme.palette.secondary.main}
                  fill={alpha(theme.palette.secondary.main, 0.2)}
                  fillOpacity={0.6}
                />
                <Legend />
                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ 
          p: 3, 
          height: '100%', 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Product Performance Matrix
            </Typography>
            <Tooltip title="Bubble size represents revenue">
              <IconButton size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Relationship between price, quantity sold, and revenue
          </Typography>
          <Box sx={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Price" 
                  unit="$"
                  label={{ value: 'Price ($)', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Quantity" 
                  unit=" units"
                  label={{ value: 'Quantity Sold', angle: -90, position: 'insideLeft' }}
                />
                <ZAxis 
                  type="number" 
                  dataKey="z" 
                  range={[60, 400]} 
                  name="Revenue" 
                  unit="$"
                />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter 
                  name="Products" 
                  data={scatterData} 
                  fill={theme.palette.primary.main}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
      
      {/* Category Distribution */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ 
          p: 3, 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" gutterBottom>
            Sales by Category
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Distribution of sales across product categories
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySalesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {categorySalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
      
      {/* Treemap Visualization */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ 
          p: 3, 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" gutterBottom>
            Product Category Breakdown
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Hierarchical view of product categories by sales volume
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={categorySalesData}
                dataKey="value"
                nameKey="name"
                stroke="#fff"
                fill={theme.palette.primary.main}
              >
                {categorySalesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Treemap>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default EnhancedVisualizations;