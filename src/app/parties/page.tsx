"use client"
import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
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
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Tooltip,
  Fade,
  Skeleton,
  useTheme,
  alpha,
  Stack,
  Divider,
  TablePagination,
  TableSortLabel,
  Fab,
  Zoom
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  History as HistoryIcon,
  LocalOffer as DiscountIcon
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
import { useRouter } from 'next/navigation'; // Import useRouter

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
  const router = useRouter();
  const theme = useTheme();
  const [parties, setParties] = useState<Party[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View and layout state
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [orderBy, setOrderBy] = useState<keyof Party>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    categoryDiscounts: {} as Record<string, number>,
    productDiscounts: {} as Record<string, number>
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

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredParties, setFilteredParties] = useState<Party[]>([]);

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

  // Update filtered parties when search query or parties change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredParties(parties);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = parties.filter(party => 
      party.name.toLowerCase().includes(query) ||
      party.email.toLowerCase().includes(query) ||
      party.phone.toLowerCase().includes(query) ||
      party.address.toLowerCase().includes(query)
    );
    setFilteredParties(filtered);
  }, [searchQuery, parties]);

  // Sorting function
  const handleRequestSort = (property: keyof Party) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sort parties
  const sortedParties = useMemo(() => {
    return [...filteredParties].sort((a, b) => {
      if (orderBy === 'name') {
        return order === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      return 0;
    });
  }, [filteredParties, order, orderBy]);

  // Paginated parties
  const paginatedParties = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return sortedParties.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedParties, page, rowsPerPage]);

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get party initials for avatar
  const getPartyInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get party avatar color
  const getPartyAvatarColor = (name: string) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.success.main,
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Ensure handlePartyNameClick is defined within the PartiesPage component scope
  const handlePartyNameClick = (partyId: string) => {
    router.push(`/parties/${partyId}/history`);
  };

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

  // Render loading skeleton for cards
  const renderLoadingSkeleton = () => (
    <Grid container spacing={3}>
      {Array.from(new Array(6)).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="80%" height={24} />
                  <Skeleton variant="text" width="60%" height={20} />
                </Box>
              </Box>
              <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="90%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="70%" height={20} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Render party cards
  const renderPartyCards = () => (
    <Fade in={!loading}>
      <Grid container spacing={3}>
        {paginatedParties.map((party) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={party.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: getPartyAvatarColor(party.name),
                      width: 48,
                      height: 48,
                      mr: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                    }}
                  >
                    {getPartyInitials(party.name)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => handlePartyNameClick(party.id)}
                    >
                      {party.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customer
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {party.email || 'No email'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {party.phone || 'No phone'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary', mt: 0.2 }} />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {party.address || 'No address'}
                    </Typography>
                  </Box>

                  {Object.keys(party.categoryDiscounts || {}).length > 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <DiscountIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Discounts
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Object.entries(party.categoryDiscounts || {}).slice(0, 2).map(([category, discount]) => (
                          <Chip
                            key={category}
                            label={`${category}: ${discount}%`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                        {Object.keys(party.categoryDiscounts || {}).length > 2 && (
                          <Chip
                            label={`+${Object.keys(party.categoryDiscounts).length - 2} more`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </Stack>
              </CardContent>
              
              <Divider />
              
              <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Box>
                  <Tooltip title="View History">
                    <IconButton
                      size="small"
                      onClick={() => handlePartyNameClick(party.id)}
                      sx={{ mr: 1 }}
                    >
                      <HistoryIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Party">
                    <IconButton
                      size="small"
                      onClick={() => handleEditParty(party)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Tooltip title="Delete Party">
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteParty(party.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
        
        {paginatedParties.length === 0 && !loading && (
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 6, 
                textAlign: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchQuery ? 'No parties found matching your search' : 'No parties yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchQuery 
                  ? 'Try adjusting your search terms or clear the search to see all parties.'
                  : 'Get started by adding your first party to the system.'
                }
              </Typography>
              {!searchQuery && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddParty}
                  size="large"
                >
                  Add Your First Party
                </Button>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Fade>
  );

  // Render table view
  const renderTableView = () => (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'name'}
                direction={orderBy === 'name' ? order : 'asc'}
                onClick={() => handleRequestSort('name')}
              >
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Category Discounts</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedParties.map((party) => (
            <TableRow key={party.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      bgcolor: getPartyAvatarColor(party.name),
                      width: 32,
                      height: 32,
                      mr: 2,
                      fontSize: '0.875rem',
                    }}
                  >
                    {getPartyInitials(party.name)}
                  </Avatar>
                  <Typography
                    sx={{
                      cursor: 'pointer',
                      color: 'primary.main',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                    onClick={() => handlePartyNameClick(party.id)}
                  >
                    {party.name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>{party.email || '-'}</TableCell>
              <TableCell>{party.phone || '-'}</TableCell>
              <TableCell>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {party.address || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Object.entries(party.categoryDiscounts || {}).map(([category, discount]) => (
                    <Chip
                      key={category}
                      label={`${category}: ${discount}%`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="View History">
                  <IconButton
                    size="small"
                    onClick={() => handlePartyNameClick(party.id)}
                    sx={{ mr: 1 }}
                  >
                    <HistoryIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => handleEditParty(party)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteParty(party.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Parties
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your customers and suppliers
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddParty}
              size="large"
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Add Party
            </Button>
          </Box>

          {/* Search and Controls */}
          <Paper 
            sx={{ 
              p: 3, 
              mb: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 2,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search parties by name, email, phone, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearchQuery('')}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Tooltip title="Table View">
                    <IconButton
                      onClick={() => setViewMode('table')}
                      color={viewMode === 'table' ? 'primary' : 'default'}
                      sx={{
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        borderRadius: 1.5,
                      }}
                    >
                      <ViewListIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Card View">
                    <IconButton
                      onClick={() => setViewMode('cards')}
                      color={viewMode === 'cards' ? 'primary' : 'default'}
                      sx={{
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        borderRadius: 1.5,
                      }}
                    >
                      <ViewModuleIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                  {parties.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Parties
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                  {parties.filter(p => Object.keys(p.categoryDiscounts || {}).length > 0).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  With Discounts
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                  {filteredParties.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Search Results
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, textAlign: 'center', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                  {categories.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Categories
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Content */}
        {loading ? (
          renderLoadingSkeleton()
        ) : (
          <>
            {viewMode === 'cards' ? renderPartyCards() : renderTableView()}
            
            {/* Pagination */}
            {sortedParties.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Paper sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <TablePagination
                    component="div"
                    count={sortedParties.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[6, 12, 24, 48]}
                    labelRowsPerPage="Items per page:"
                  />
                </Paper>
              </Box>
            )}
          </>
        )}

        {/* Floating Action Button for Mobile */}
        <Zoom in={!loading}>
          <Fab
            color="primary"
            aria-label="add party"
            onClick={handleAddParty}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              display: { xs: 'flex', md: 'none' },
            }}
          >
            <AddIcon />
          </Fab>
        </Zoom>

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
      </Container>
    </DashboardLayout>
  );
}