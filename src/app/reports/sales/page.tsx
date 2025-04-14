'use client';
import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import DashboardLayout from '@/components/DashboardLayout';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function SalesReport() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date(),
  });
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData();
  }, [dateRange]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const invoicesRef = collection(db, 'invoices');
      const q = query(
        invoicesRef,
        where('date', '>=', dateRange.start),
        where('date', '<=', dateRange.end)
      );

      const querySnapshot = await getDocs(q);
      const invoices = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Process sales data for charts
      const salesByDate = {};
      const productSales = {};
      const customerSales = {};

      invoices.forEach(invoice => {
        // Daily sales
        const date = new Date(invoice.date).toLocaleDateString();
        salesByDate[date] = (salesByDate[date] || 0) + invoice.total;

        // Product sales
        invoice.items?.forEach(item => {
          productSales[item.productName] = (productSales[item.productName] || 0) + (item.quantity * item.price);
        });

        // Customer sales
        customerSales[invoice.partyName] = (customerSales[invoice.partyName] || 0) + invoice.total;
      });

      // Format data for charts
      const dailySales = Object.entries(salesByDate).map(([date, amount]) => ({
        date,
        amount
      }));

      const topProductsList = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      const topCustomersList = Object.entries(customerSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      setSalesData(dailySales);
      setTopProducts(topProductsList);
      setTopCustomers(topCustomersList);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
   <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Sales Report
        </Typography>

        {/* Date Range Filters */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, start: newValue }))}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={dateRange.end}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, end: newValue }))}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                onClick={fetchSalesData}
                fullWidth
              >
                Update Report
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Sales Overview */}
        <Grid container spacing={3}>
          {/* Daily Sales Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Daily Sales Trend
              </Typography>
              <ResponsiveContainer>
                <LineChart
                  data={salesData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Sales Amount" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Top Products */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Top Products by Sales
              </Typography>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={topProducts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Top Customers */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Top Customers by Revenue
              </Typography>
              <ResponsiveContainer>
                <BarChart
                  data={topCustomers}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#82ca9d" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
   </DashboardLayout>
  );
}