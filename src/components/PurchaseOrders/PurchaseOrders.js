import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField
} from '@mui/material';

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    supplierName: '',
    items: [],
    totalAmount: 0,
    status: 'pending',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const querySnapshot = await getDocs(collection(db, 'purchaseOrders'));
    setOrders(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleAddOrder = async () => {
    await addDoc(collection(db, 'purchaseOrders'), newOrder);
    setOpen(false);
    fetchOrders();
  };

  const handleReceiveOrder = async (orderId) => {
    const orderRef = doc(db, 'purchaseOrders', orderId);
    await updateDoc(orderRef, { status: 'received' });
    fetchOrders();
  };

  return (
    <div>
      <Button variant="contained" onClick={() => setOpen(true)}>New Purchase Order</Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.date}</TableCell>
                <TableCell>{order.supplierName}</TableCell>
                <TableCell>{order.totalAmount}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>
                  {order.status === 'pending' && (
                    <Button onClick={() => handleReceiveOrder(order.id)}>
                      Mark as Received
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>New Purchase Order</DialogTitle>
        <DialogContent>
          <TextField
            label="Supplier Name"
            value={newOrder.supplierName}
            onChange={(e) => setNewOrder({...newOrder, supplierName: e.target.value})}
            fullWidth
          />
          <TextField
            label="Total Amount"
            type="number"
            value={newOrder.totalAmount}
            onChange={(e) => setNewOrder({...newOrder, totalAmount: parseFloat(e.target.value)})}
            fullWidth
          />
          <Button onClick={handleAddOrder}>Create Order</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;