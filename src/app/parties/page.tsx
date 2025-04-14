"use client"
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '@/firebase/config';

// Define interfaces
interface Party {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  categoryDiscounts: Record<string, number>;
  productDiscounts?: Record<string, number>; // Add product-specific discounts
}

interface Category {
  id: string;
  name: string;
}

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    categoryDiscounts: {} as Record<string, number>,
    productDiscounts: {} as Record<string, number> // Add product discounts to form state
  });
  
  // Discount dialog state
  const [openDiscountDialog, setOpenDiscountDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Product discount dialog state
  const [openProductDiscountDialog, setOpenProductDiscountDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productDiscountValue, setProductDiscountValue] = useState<number>(0);
  const [products, setProducts] = useState<{id: string, name: string}[]>([]);

  // Fetch data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch parties
        const partiesCollection = collection(db, 'parties');
        const partiesSnapshot = await getDocs(partiesCollection);
        const partiesList = partiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          categoryDiscounts: doc.data().categoryDiscounts || {},
          productDiscounts: doc.data().productDiscounts || {}
        } as Party));
        setParties(partiesList);
        
        // Fetch categories
        const categoriesCollection = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesCollection);
        const categoriesList = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Category));
        setCategories(categoriesList);
        
        // Fetch products
        const productsCollection = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        const productsList = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setProducts(productsList);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddParty = () => {
    setSelectedParty(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      categoryDiscounts: {}
    });
    setOpenDialog(true);
  };

  const handleEditParty = (party: Party) => {
    setSelectedParty(party);
    setFormData({
      name: party.name,
      email: party.email,
      phone: party.phone,
      address: party.address,
      categoryDiscounts: party.categoryDiscounts || {},
      productDiscounts: party.productDiscounts || {} // Include product discounts
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSaveParty = async () => {
    try {
      setLoading(true);
      
      if (selectedParty) {
        // Update existing party
        const partyRef = doc(db, 'parties', selectedParty.id);
        await updateDoc(partyRef, formData);
        
        // Update local state
        setParties(parties.map(p => 
          p.id === selectedParty.id ? { ...p, ...formData } : p
        ));
      } else {
        // Create new party
        const partiesCollection = collection(db, 'parties');
        const docRef = await addDoc(partiesCollection, formData);
        
        // Add to local state
        setParties([...parties, {
          id: docRef.id,
          ...formData
        }]);
      }
      
      setOpenDialog(false);
      setError(null);
    } catch (err) {
      console.error('Error saving party:', err);
      setError('Failed to save party. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParty = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this party?')) {
      try {
        setLoading(true);
        
        // Delete from Firebase
        const partyRef = doc(db, 'parties', id);
        await deleteDoc(partyRef);
        
        // Remove from local state
        setParties(parties.filter(p => p.id !== id));
        setError(null);
      } catch (err) {
        console.error('Error deleting party:', err);
        setError('Failed to delete party. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Open discount dialog
  const handleAddDiscount = () => {
    setSelectedCategory('');
    setDiscountValue(0);
    setOpenDiscountDialog(true);
  };

  // Save discount
  const handleSaveDiscount = () => {
    if (!selectedCategory) return;
    
    setFormData({
      ...formData,
      categoryDiscounts: {
        ...formData.categoryDiscounts,
        [selectedCategory]: discountValue
      }
    });
    
    setOpenDiscountDialog(false);
  };

  // Remove discount
  const handleRemoveDiscount = (category: string) => {
    const updatedDiscounts = { ...formData.categoryDiscounts };
    delete updatedDiscounts[category];
    
    setFormData({
      ...formData,
      categoryDiscounts: updatedDiscounts
    });
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">Parties</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddParty}
          >
            Add Party
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No parties found</TableCell>
                    </TableRow>
                  ) : (
                    parties.map((party) => (
                      <TableRow key={party.id}>
                        <TableCell>{party.name}</TableCell>
                        <TableCell>{party.email || '-'}</TableCell>
                        <TableCell>{party.phone || '-'}</TableCell>
                        <TableCell>{party.address || '-'}</TableCell>
                        <TableCell align="center">
                          <Button 
                            size="small" 
                            onClick={() => handleEditParty(party)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>

      {/* Add/Edit Party Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedParty ? 'Edit Party' : 'Add New Party'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Party Name"
                  name="name"
                  fullWidth
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  name="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone"
                  name="phone"
                  fullWidth
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  name="address"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1">Category Discounts</Typography>
                  <Button 
                    size="small" 
                    startIcon={<AddIcon />}
                    onClick={handleAddDiscount}
                  >
                    Add Discount
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(formData.categoryDiscounts).map(([category, discount]) => (
                    <Chip 
                      key={category}
                      label={`${category}: ${discount}%`}
                      onDelete={() => handleRemoveDiscount(category)}
                      color="primary"
                    />
                  ))}
                  {Object.keys(formData.categoryDiscounts).length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No category discounts added yet
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveParty} 
            variant="contained"
            disabled={!formData.name || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Category Discount Dialog */}
      <Dialog open={openDiscountDialog} onClose={() => setOpenDiscountDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Category Discount</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem 
                    key={category.id} 
                    value={category.name}
                    disabled={formData.categoryDiscounts[category.name] !== undefined}
                  >
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Discount (%)"
              type="number"
              fullWidth
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              InputProps={{
                inputProps: { min: 0, max: 100 },
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDiscountDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveDiscount} 
            variant="contained"
            disabled={!selectedCategory || discountValue < 0 || discountValue > 100}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
   </DashboardLayout>
  );
}