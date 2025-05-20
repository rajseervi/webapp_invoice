import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
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

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, price: 0 });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const querySnapshot = await getDocs(collection(db, 'inventory'));
    setItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleAddItem = async () => {
    await addDoc(collection(db, 'inventory'), newItem);
    setOpen(false);
    fetchItems();
  };

  return (
    <div>
      <Button variant="contained" onClick={() => setOpen(true)}>Add Item</Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.price}</TableCell>
                <TableCell>
                  <Button>Edit</Button>
                  <Button color="error">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Item</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={newItem.name}
            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
            fullWidth
          />
          <TextField
            label="Quantity"
            type="number"
            value={newItem.quantity}
            onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value)})}
            fullWidth
          />
          <TextField
            label="Price"
            type="number"
            value={newItem.price}
            onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value)})}
            fullWidth
          />
          <Button onClick={handleAddItem}>Add</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;