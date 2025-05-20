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

const Ledger = () => {
  const [transactions, setTransactions] = useState([]);
  const [open, setOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    partyName: '',
    type: 'credit',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const querySnapshot = await getDocs(collection(db, 'ledger'));
    setTransactions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleAddTransaction = async () => {
    await addDoc(collection(db, 'ledger'), newTransaction);
    setOpen(false);
    fetchTransactions();
  };

  return (
    <div>
      <Button variant="contained" onClick={() => setOpen(true)}>Add Transaction</Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Party Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>{transaction.partyName}</TableCell>
                <TableCell>{transaction.type}</TableCell>
                <TableCell>{transaction.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Transaction</DialogTitle>
        <DialogContent>
          <TextField
            label="Party Name"
            value={newTransaction.partyName}
            onChange={(e) => setNewTransaction({...newTransaction, partyName: e.target.value})}
            fullWidth
          />
          <TextField
            label="Amount"
            type="number"
            value={newTransaction.amount}
            onChange={(e) => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})}
            fullWidth
          />
          <TextField
            label="Date"
            type="date"
            value={newTransaction.date}
            onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
          <Button onClick={handleAddTransaction}>Add</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ledger;