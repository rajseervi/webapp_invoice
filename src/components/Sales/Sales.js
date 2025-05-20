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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [newSale, setNewSale] = useState({
    itemId: '',
    quantity: 0,
    price: 0,
    customerName: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchSales();
    fetchInventory();
  }, []);

  const fetchSales = async () => {
    const querySnapshot = await getDocs(collection(db, 'sales'));
    setSales(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchInventory = async () => {
    const querySnapshot = await getDocs(collection(db, 'inventory'));
    setInventory(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleAddSale = async () => {
    // Update inventory quantity
    const itemRef = doc(db, 'inventory', newSale.itemId);
    const item = inventory.find(i => i.id === newSale.itemId);
    await updateDoc(itemRef, {
      quantity: item.quantity - newSale.quantity
    });

    // Add sale record
    await addDoc(collection(db, 'sales'), newSale);
    setOpen(false);
    fetchSales();
    fetchInventory();
  };

  return (
    <div>
      <Button variant="contained" onClick={() => setOpen(true)}>New Sale</Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{sale.date}</TableCell>
                <TableCell>{sale.customerName}</TableCell>
                <TableCell>{inventory.find(i => i.id === sale.itemId)?.name}</TableCell>
                <TableCell>{sale.quantity}</TableCell>
                <TableCell>{sale.price}</TableCell>
                <TableCell>{sale.quantity * sale.price}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>New Sale</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>Item</InputLabel>
            <Select
              value={newSale.itemId}
              onChange={(e) => setNewSale({...newSale, itemId: e.target.value})}
            >
              {inventory.map(item => (
                <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Customer Name"
            value={newSale.customerName}
            onChange={(e) => setNewSale({...newSale, customerName: e.target.value})}
            fullWidth
          />
          <TextField
            label="Quantity"
            type="number"
            value={newSale.quantity}
            onChange={(e) => setNewSale({...newSale, quantity: parseInt(e.target.value)})}
            fullWidth
          />
          <TextField
            label="Price"
            type="number"
            value={newSale.price}
            onChange={(e) => setNewSale({...newSale, price: parseFloat(e.target.value)})}
            fullWidth
          />
          <Button onClick={handleAddSale}>Complete Sale</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;