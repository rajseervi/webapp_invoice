"use client"
import React from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Box,
  Chip
} from '@mui/material';

const dummyPurchaseOrders = [
  { 
    id: 1, 
    date: '2024-01-15', 
    supplier: 'Supplier A', 
    items: 3,
    total: 15000,
    status: 'Pending'
  },
  { 
    id: 2, 
    date: '2024-01-14', 
    supplier: 'Supplier B', 
    items: 5,
    total: 25000,
    status: 'Delivered'
  },
];

export default function PurchaseOrders() {
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h4">Purchase Orders</Typography>
        <Button variant="contained" color="primary">
          Create New Order
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Date</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell align="right">Items</TableCell>
              <TableCell align="right">Total (₹)</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dummyPurchaseOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.date}</TableCell>
                <TableCell>{order.supplier}</TableCell>
                <TableCell align="right">{order.items}</TableCell>
                <TableCell align="right">{order.total}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={order.status} 
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Button size="small" sx={{ mr: 1 }}>View</Button>
                  <Button size="small" color="error">Cancel</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}