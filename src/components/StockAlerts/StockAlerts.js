import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Chip
} from '@mui/material';

const StockAlerts = () => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const LOW_STOCK_THRESHOLD = 10;

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    const querySnapshot = await getDocs(
      query(collection(db, 'inventory'), 
      where('quantity', '<=', LOW_STOCK_THRESHOLD))
    );
    setLowStockItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Stock Alerts
      </Typography>
      <List>
        {lowStockItems.map((item) => (
          <ListItem key={item.id}>
            <ListItemText
              primary={item.name}
              secondary={`Current quantity: ${item.quantity}`}
            />
            <Chip
              color="error"
              label="Low Stock"
              size="small"
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default StockAlerts;