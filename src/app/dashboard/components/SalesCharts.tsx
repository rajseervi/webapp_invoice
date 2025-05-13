import React, { memo } from 'react';
import {
  Grid,
  Paper,
  Box,
  Typography,
  useTheme,
  Skeleton
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Define interfaces
interface MonthlySales {
  name: string;
  sales: number;
  target: number;
}

interface CategorySales {
  name: string;
  value: number;
}

interface DailySales {
  date: string;
  amount: number;
}

interface SalesChartsProps {
  monthlySalesData: MonthlySales[];
  categorySalesData: CategorySales[];
  dailySalesData: DailySales[];
  loading: boolean;
  formatCurrency: (amount: number) => string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Memoized component to prevent unnecessary re-renders
const SalesCharts = memo(({ monthlySalesData, categorySalesData, dailySalesData, loading, formatCurrency }: SalesChartsProps) => {
  const theme = useTheme();

  // Render skeletons when loading
  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="80%" height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={300} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="80%" height={24} sx={{ mb: 2 }} />
            <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="80%" height={24} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={300} />
          </Paper>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Monthly Sales Chart */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ 
          p: 3, 
          height: '100%', 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" gutterBottom>
            Monthly Sales Performance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Comparison of actual sales vs targets for the last 6 months
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlySalesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)}
                  labelStyle={{ fontWeight: 'bold' }}
                />
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
                  fill={theme.palette.grey[300]} 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
      
      {/* Category Sales Pie Chart */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ 
          p: 3, 
          height: '100%', 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" gutterBottom>
            Sales by Category
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Distribution of sales across product categories
          </Typography>
          <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
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
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
      
      {/* Daily Sales Trend */}
      <Grid item xs={12}>
        <Paper sx={{ 
          p: 3, 
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <Typography variant="h6" gutterBottom>
            Daily Sales Trend
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sales performance over the last 30 days
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailySalesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    // Show fewer ticks for better readability
                    const index = dailySalesData.findIndex(item => item.date === value);
                    return index % 5 === 0 ? value : '';
                  }}
                />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  name="Sales" 
                  stroke={theme.palette.primary.main}
                  fill={`${theme.palette.primary.main}20`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
});

SalesCharts.displayName = 'SalesCharts';

export default SalesCharts;