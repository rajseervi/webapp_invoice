"use client";
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  Autocomplete
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useParties } from "@/app/hooks/useParties";
import { useProducts } from '@/app/hooks/useProducts';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions 
} from '@mui/material'; 
import { useRouter } from 'next/navigation';

interface Party {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  categoryDiscounts: Record<string, number>;
  productDiscounts?: Record<string, number>;
}

interface InvoiceLineItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  discount: number;
  discountType: 'none' | 'category' | 'product';
  finalPrice: number;
}

interface InvoiceFormProps {
  onSuccess?: () => void;
  invoiceId?: string;
}

export default function InvoiceForm({ onSuccess, invoiceId }: InvoiceFormProps) {
  const router = useRouter();
  const { parties, loading: loadingParties } = useParties();
  const { products, loading: loadingProducts } = useProducts();
  const quantityInputRef = React.useRef<HTMLInputElement>(null);
  
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openPartyDialog, setOpenPartyDialog] = useState(false);
  const [newParty, setNewParty] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    categoryDiscounts: {} as Record<string, number>,
    productDiscounts: {} as Record<string, number>
  });
  const [creatingParty, setCreatingParty] = useState(false);

  // Fetch existing invoice data if editing
  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!invoiceId) return;
      if (!parties.length || !products.length) return;
      
      try {
        setLoading(true);
        const invoiceRef = doc(db, 'invoices', invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);
        
        if (!invoiceSnap.exists()) {
          setError('Invoice not found');
          return;
        }
        
        const invoiceData = invoiceSnap.data();
        setInvoiceNumber(invoiceData.invoiceNumber);
        setInvoiceDate(invoiceData.date);
        setSelectedPartyId(invoiceData.partyId);
        
        // Find the party to get their discounts
        const party = parties.find(p => p.id === invoiceData.partyId);
        
        // Map items preserving original discount values
        setLineItems(invoiceData.items.map((item) => {
          const product = products.find(p => p.id === item.productId);
          
          // Determine the appropriate discount based on saved values
          let discount = 0;
          let discountType: 'none' | 'category' | 'product' = 'none';
          
          if (item.discountType === 'product' || item.discountType === 'category') {
            discount = item.discount;
            discountType = item.discountType;
          } else if (party) {
            // Check for product-specific discount first
            const productDiscount = party.productDiscounts?.[item.productId] || 0;
            const categoryDiscount = party.categoryDiscounts[product?.category || ''] || 0;
            
            if (productDiscount > 0) {
              discount = productDiscount;
              discountType = 'product';
            } else if (categoryDiscount > 0) {
              discount = categoryDiscount;
              discountType = 'category';
            }
          }
          
          const finalPrice = item.price * (1 - discount/100) * item.quantity;
          
          return {
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            category: product?.category || '',
            discount,
            discountType,
            finalPrice: parseFloat(finalPrice.toFixed(2))
          };
        }));
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError('Failed to load invoice data');
      } finally {
        setLoading(false);
      }
    };
    
    if (invoiceId) {
      fetchInvoiceData();
    } else {
      // Generate sequential invoice number for new invoices
      const generateInvoiceNumber = async () => {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        // Get the latest invoice for the current month
        const invoicesQuery = query(
          collection(db, 'invoices'),
          where('invoiceNumber', '>=', `INV-${year}${month}-000`),
          where('invoiceNumber', '<=', `INV-${year}${month}-999`),
          orderBy('invoiceNumber', 'desc'),
          limit(1)
        );
        
        const snapshot = await getDocs(invoicesQuery);
        let sequence = 1;
        
        if (!snapshot.empty) {
          const latestInvoice = snapshot.docs[0].data();
          const latestNumber = latestInvoice.invoiceNumber;
          
          // Extract the sequence number and increment it
          const currentSequence = parseInt(latestNumber.split('-')[2]);
          sequence = currentSequence + 1;
          
          // If sequence exceeds 999, show error
          if (sequence > 999) {
            setError('Maximum invoice number reached for this month');
            return null;
          }
        }
        
        // Format the sequence number with leading zeros
        const sequenceStr = sequence.toString().padStart(3, '0');
        return `INV-${year}${month}-${sequenceStr}`;
      };
      
      const initializeInvoiceNumber = async () => {
        const number = await generateInvoiceNumber();
        if (number) setInvoiceNumber(number);
      };
      initializeInvoiceNumber();
    }
  }, []);
  
  // Get selected party
  const selectedParty = parties.find(party => party.id === selectedPartyId) || null;
  
  // Calculate discounts for a single line item
  const calculateItemDiscounts = (item: InvoiceLineItem, party: Party | null) => {
    if (!party) return item;
    
    const product = products.find(p => p.id === item.productId);
    if (!product) return item;
    
    const categoryDiscount = party.categoryDiscounts[product.category] || 0;
    const productDiscount = party.productDiscounts?.[item.productId] || 0;
    
    let discount = 0;
    let discountType: 'none' | 'category' | 'product' = 'none';
    
    if (productDiscount > 0) {
      discount = productDiscount;
      discountType = 'product';
    } else if (categoryDiscount > 0) {
      discount = categoryDiscount;
      discountType = 'category';
    }
    
    const finalPrice = item.price * (1 - discount/100) * item.quantity;
    
    return { 
      ...item, 
      discount, 
      discountType,
      finalPrice: parseFloat(finalPrice.toFixed(2))
    };
  };

  // Update discounts when party changes
  useEffect(() => {
    if (!selectedParty) return;
    
    const updatedItems = lineItems.map(item => calculateItemDiscounts(item, selectedParty));
    setLineItems(updatedItems);
  }, [selectedPartyId, products, selectedParty]);
  
  const handleOpenPartyDialog = () => {
    setNewParty({
      name: '',
      email: '',
      phone: '',
      address: '',
      categoryDiscounts: {},
      productDiscounts: {}
    });
    setOpenPartyDialog(true);
  };

  const handlePartyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewParty(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateParty = async () => {
    if (!newParty.name) {
      setError('Party name is required');
      return;
    }
    
    try {
      setCreatingParty(true);
      
      const partyRef = await addDoc(collection(db, 'parties'), {
        ...newParty,
        createdAt: serverTimestamp()
      });
      
      const newPartyWithId = {
        ...newParty,
        id: partyRef.id
      };
      
      parties.push(newPartyWithId);
      setSelectedPartyId(partyRef.id);
      setOpenPartyDialog(false);
      setError(null);
    } catch (err) {
      console.error('Error creating party:', err);
      setError('Failed to create party. Please try again.');
    } finally {
      setCreatingParty(false);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    let discount = 0;
    let discountType: 'none' | 'category' | 'product' = 'none';
    
    if (selectedParty) {
      const categoryDiscount = selectedParty.categoryDiscounts[product.category] || 0;
      const productDiscount = selectedParty.productDiscounts?.[product.id] || 0;
      
      if (productDiscount > 0) {
        discount = productDiscount;
        discountType = 'product';
      } else if (categoryDiscount > 0) {
        discount = categoryDiscount;
        discountType = 'category';
      }
    }
    
    const finalPrice = product.price * (1 - discount/100);
    
    let newItem: InvoiceLineItem = {
      productId: product.id,
      name: product.name,
      quantity: 0,
      price: product.price,
      category: product.category || '',
      discount: 0,
      discountType: 'none',
      finalPrice: product.price
    };
    
    // Calculate discounts for the new item if a party is selected
    newItem = calculateItemDiscounts(newItem, selectedParty);
    
    setLineItems([...lineItems, newItem]);
    setSelectedProductId('');
    
    // Focus on the quantity input of the newly added item
    setTimeout(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
      }
    }, 0);
  };
  
  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    
    const updatedItems = lineItems.map((item, i) => {
      if (i !== index) return item;
      
      const updatedItem = { ...item, quantity };
      return calculateItemDiscounts(updatedItem, selectedParty);
    });
    
    setLineItems(updatedItems);
  };
  
  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };
  
  const subtotal = lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal - lineItems.reduce((sum, item) => sum + item.finalPrice, 0);
  const total = subtotal - discountAmount;
  
  const handleSaveInvoice = async () => {
    if (!selectedPartyId || lineItems.length === 0) {
      setError('Please select a party and add at least one product');
      return;
    }

    const maxRetries = 3;
    let retryCount = 0;

    const saveWithRetry = async () => {
      try {
        setLoading(true);
        setError(null);

        const invoiceData = {
          invoiceNumber,
          date: invoiceDate,
          partyId: selectedPartyId,
          partyName: selectedParty?.name || '',
          items: lineItems.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            discountType: item.discountType,
            finalPrice: item.finalPrice
          })),
          subtotal,
          discount: discountAmount,
          total,
          updatedAt: serverTimestamp()
        };

        if (invoiceId) {
          // Update existing invoice
          const invoiceRef = doc(db, 'invoices', invoiceId);
          await updateDoc(invoiceRef, invoiceData);
        } else {
          // Create new invoice
          invoiceData.createdAt = serverTimestamp();
          await addDoc(collection(db, 'invoices'), invoiceData);
        }
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/invoices');
        }
        
        setError(null);
      } catch (err) {
        console.error('Error saving invoice:', err);
        const isConnectivityError = err instanceof Error && 
          (err.message.includes('Could not reach Cloud Firestore backend') ||
           err.message.includes('network error') ||
           err.message.includes('offline'));

        if (isConnectivityError && retryCount < maxRetries) {
          retryCount++;
          setError(`Connection error. Retrying... (Attempt ${retryCount}/${maxRetries})`);
          // Exponential backoff: wait longer between each retry
          await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount - 1)));
          return saveWithRetry();
        }

        setError(
          isConnectivityError
            ? 'Unable to connect to the server. Please check your internet connection and try again.'
            : err instanceof Error ? err.message : 'Failed to save invoice'
        );
      } finally {
        if (retryCount === maxRetries) {
          setLoading(false);
        }
      }
    };

    await saveWithRetry();

  };

  return (
    <Box sx={{ mt: 3, maxWidth: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Invoice Details
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: { xs: 2, sm: 3 },
          mb: 3,
          '& > *': { flex: 1 }
        }}>
          <TextField
            fullWidth
            label="Invoice Number"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            size="small"
          />
          
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            alignItems: 'flex-start'
          }}>
            <FormControl fullWidth size="small">
              <InputLabel>Party</InputLabel>
              <Select
                value={selectedPartyId}
                label="Party"
                onChange={(e: SelectChangeEvent) => setSelectedPartyId(e.target.value)}
                disabled={loadingParties}
              >
                {parties.map(party => (
                  <MenuItem key={party.id} value={party.id}>
                    {party.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button 
              variant="outlined" 
              onClick={handleOpenPartyDialog}
              size="small"
              sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
            >
              New Party
            </Button>
          </Box>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          Products
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2, 
          mb: 3,
          alignItems: 'flex-start'
        }}>
          <Autocomplete
            fullWidth
            options={products}
            getOptionLabel={(product) => `${product.name} - ₹${product.price}`}
            renderOption={(props, product) => (
              <Box component="li" {...props} key={product.id}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {product.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                      ₹{product.price.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Category: {product.category || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Products"
                disabled={loadingProducts}
                placeholder="Type to search..."
                size="small"
              />
            )}
            onChange={(_, product) => setSelectedProductId(product ? product.id : '')}
            value={products.find(p => p.id === selectedProductId) || null}
            loading={loadingProducts}
            loadingText="Loading products..."
            noOptionsText="No products found"
          />
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddProduct}
            disabled={!selectedProductId}
            size="small"
            sx={{ minWidth: 'auto', alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
          >
            Add
          </Button>
        </Box>
        
        <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', maxHeight: { xs: 400, sm: 'none' }, mb: 2 }}>
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 150 }}>Product</TableCell>
                <TableCell align="right" sx={{ minWidth: 80 }}>Price</TableCell>
                <TableCell align="right" sx={{ minWidth: 100 }}>Quantity</TableCell>
                <TableCell align="right" sx={{ minWidth: 120 }}>Discount</TableCell>
                <TableCell align="right" sx={{ minWidth: 100 }}>Total</TableCell>
                <TableCell align="center" sx={{ minWidth: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No products added
                  </TableCell>
                </TableRow>
              ) : (
                lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">₹{item.price}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value))}
                        inputProps={{ min: '' }}
                        sx={{ width: { xs: '60px', sm: '70px' } }}
                        inputRef={index === lineItems.length - 1 ? quantityInputRef : null}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <TextField
                          type="number"
                          size="small"
                          value={item.discount}
                          onChange={(e) => {
                            const updatedItems = [...lineItems];
                            const updatedItem = updatedItems[index];
                            updatedItem.discount = parseFloat(e.target.value) || 0;
                            updatedItem.discountType = 'none';
                            updatedItem.finalPrice = updatedItem.price * (1 - updatedItem.discount/100) * updatedItem.quantity;
                            updatedItem.finalPrice = parseFloat(updatedItem.finalPrice.toFixed(2));
                            setLineItems(updatedItems);
                          }}
                          inputProps={{ min: 0, max: 100, step: 0.1 }}
                          sx={{ width: '80px' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          %{item.discountType !== 'none' && ` (${item.discountType})`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">₹{item.finalPrice}</TableCell>
                    <TableCell align="center">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
              
              <TableRow>
                <TableCell colSpan={4} align="right">
                  <Typography variant="subtitle2">Subtotal:</Typography>
                </TableCell>
                <TableCell align="right">₹{subtotal.toFixed(2)}</TableCell>
                <TableCell />
              </TableRow>
              
              <TableRow>
                <TableCell colSpan={4} align="right">
                  <Typography variant="subtitle2">Discount:</Typography>
                </TableCell>
                <TableCell align="right">₹{discountAmount.toFixed(2)}</TableCell>
                <TableCell />
              </TableRow>
              
              <TableRow>
                <TableCell colSpan={4} align="right">
                  <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle1" fontWeight="bold">
                    ₹{total.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveInvoice}
            disabled={loading || lineItems.length === 0 || !selectedPartyId}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Invoice'}
          </Button>
        </Box>
      </Paper>
      
      <Dialog open={openPartyDialog} onClose={() => setOpenPartyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Party</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Party Name"
              name="name"
              value={newParty.name}
              onChange={handlePartyInputChange}
              fullWidth
              required
            />
            
            <TextField
              label="Email"
              name="email"
              type="email"
              value={newParty.email}
              onChange={handlePartyInputChange}
              fullWidth
            />
            
            <TextField
              label="Phone"
              name="phone"
              value={newParty.phone}
              onChange={handlePartyInputChange}
              fullWidth
            />
            
            <TextField
              label="Address"
              name="address"
              value={newParty.address}
              onChange={handlePartyInputChange}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPartyDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateParty} 
            variant="contained" 
            disabled={creatingParty || !newParty.name}
          >
            {creatingParty ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
