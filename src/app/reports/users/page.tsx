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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
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
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import DashboardLayout from '@/components/DashboardLayout';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function UserReport() {
  const [userData, setUserData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    recentActivity: [],
    roleDistribution: [],
    activityByTime: []
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Fetch users collection
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Process user data
      const roles = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});

      const roleDistribution = Object.entries(roles).map(([name, value]) => ({
        name,
        value
      }));

      // Simulate activity data (replace with actual data in production)
      const activityByTime = [
        { time: '00:00', count: 10 },
        { time: '04:00', count: 5 },
        { time: '08:00', count: 45 },
        { time: '12:00', count: 60 },
        { time: '16:00', count: 55 },
        { time: '20:00', count: 30 }
      ];

      setUserData({
        totalUsers: users.length,
        activeUsers: users.filter(user => user.status === 'active').length,
        recentActivity: users
          .filter(user => user.lastLogin)
          .sort((a, b) => b.lastLogin - a.lastLogin)
          .slice(0, 5),
        roleDistribution,
        activityByTime
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  return (
   <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          User Activity Report
        </Typography>

        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">
                  {userData.totalUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Users
                </Typography>
                <Typography variant="h4">
                  {userData.activeUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Role Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
              <Typography variant="h6" gutterBottom>
                User Role Distribution
              </Typography>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={userData.roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userData.roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Activity by Time */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
              <Typography variant="h6" gutterBottom>
                User Activity by Time
              </Typography>
              <ResponsiveContainer>
                <BarChart
                  data={userData.activityByTime}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Active Users" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Recent Activity Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent User Activity
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userData.recentActivity.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2 }}>{user.name?.[0]}</Avatar>
                            <Typography>{user.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          {new Date(user.lastLogin).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.status}
                            color={user.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>
   </DashboardLayout>
  );
}