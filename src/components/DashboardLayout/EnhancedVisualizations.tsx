"use client";
import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  alpha,
  useMediaQuery
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Sample data
const monthlySalesData = [
  { name: 'Jan', sales: 4000, target: 4500 },
  { name: 'Feb', sales: 3000, target: 3500 },
  { name: 'Mar', sales: 5000, target: 4500 },
  { name: 'Apr', sales: 2780, target: 3000 },
  { name: 'May', sales: 1890, target: 2000 },
  { name: 'Jun', sales: 2390, target: 2500 },
];

const categorySalesData = [
  { name: 'Electronics', value: 35 },
  { name: 'Clothing', value: 25 },
  { name: 'Food', value: 20 },
  { name: 'Books', value: 10 },
  { name: 'Others', value: 10 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const EnhancedVisualizations = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('bar');
  
  // Determine chart height based on screen size
  const chartHeight = isMobile ? 200 : isTablet ? 250 : 300;
  
  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: 'line' | 'bar' | 'area' | null,
  ) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };

  return (
    <Grid container spacing={isMobile ? 2 : 3}>
      {/* Monthly Sales Chart */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ 
          p: { xs: 2, md: 3 }, 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom={isMobile}>
              Monthly Sales Performance
            </Typography>
            
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              aria-label="chart type"
              size={isMobile ? "small" : "medium"}
              sx={{ mt: isMobile ? 1 : 0 }}
            >
              <ToggleButton value="bar" aria-label="bar chart">
                Bar
              </ToggleButton>
              <ToggleButton value="line" aria-label="line chart">
                Line
              </ToggleButton>
              <ToggleButton value="area" aria-label="area chart">
                Area
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          <Box sx={{ height: chartHeight, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' && (
                <BarChart data={monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: 'none'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="sales" 
                    fill={alpha(theme.palette.primary.main, 0.8)}
                    radius={[4, 4, 0, 0]}
                    name="Sales"
                  />
                  <Bar 
                    dataKey="target" 
                    fill={alpha(theme.palette.secondary.main, 0.8)}
                    radius={[4, 4, 0, 0]}
                    name="Target"
                  />
                </BarChart>
              )}
              
              {chartType === 'line' && (
                <LineChart data={monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: 'none'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke={theme.palette.primary.main} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke={theme.palette.secondary.main} 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              )}
              
              {chartType === 'area' && (
                <AreaChart data={monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: 'none'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    fill={alpha(theme.palette.primary.main, 0.2)}
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="target" 
                    fill={alpha(theme.palette.secondary.main, 0.2)}
                    stroke={theme.palette.secondary.main}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
      
      {/* Category Sales Pie Chart */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ 
          p: { xs: 2, md: 3 }, 
          height: '100%',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Typography variant="h6" gutterBottom>
            Sales by Category
          </Typography>
          
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
              <PieChart>
                <Pie
                  data={categorySalesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 40 : 60}
                  outerRadius={isMobile ? 70 : 90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => isMobile ? 
                    `${(percent * 100).toFixed(0)}%` : 
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={!isMobile}
                >
                  {categorySalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default EnhancedVisualizations;