"use client"
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  Badge,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Sort as SortIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import PartyLedger from '@/components/Ledger/PartyLedger';
import { Party } from '@/types/party';
import { partyService } from '@/services/partyService';

export default function LedgerPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [partyType, setPartyType] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortField, setSortField] = useState<'name' | 'balance'>('name');

  const fetchParties = async () => {
    try {
      setLoading(true);
      const partiesData = await partyService.getParties();
      if (!partiesData || partiesData.length === 0) {
        setParties([]);
        setError('No parties found. Please add parties first.');
      } else {
        setParties(partiesData);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching parties:', err);
      setError('Failed to load parties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const handleSelectParty = (party: Party) => {
    setSelectedParty(party);
    // On mobile, we might want to auto-scroll to the ledger section
    if (isMobile) {
      setTimeout(() => {
        document.getElementById('ledger-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleClearSelection = () => {
    setSelectedParty(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string | null) => {
    setPartyType(newValue);
  };

  const handleSort = (field: 'name' | 'balance') => {
    if (sortField === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter parties based on search query and selected type
  const filteredParties = parties.filter(party => {
    const matchesSearch = 
      party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (party.gstin && party.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (party.phone && party.phone.includes(searchQuery));
    
    const matchesType = partyType === null || (party.type && party.type === partyType);
    
    return matchesSearch && matchesType;
  });

  // Sort the filtered parties
  const sortedParties = [...filteredParties].sort((a, b) => {
    if (sortField === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      // Sort by balance
      const balanceA = a.balance || 0;
      const balanceB = b.balance || 0;
      return sortOrder === 'asc' 
        ? balanceA - balanceB
        : balanceB - balanceA;
    }
  });

  // Count parties by type
  const customerCount = parties.filter(p => p.type && p.type === 'customer').length;
  const supplierCount = parties.filter(p => p.type && p.type === 'supplier').length;

  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 3,
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Party Ledger
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage financial transactions with your parties
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchParties}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => window.location.href = '/parties/new'}
            >
              Add Party
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={fetchParties}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Party Selection Panel */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper 
              elevation={2} 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                  Select Party
                </Typography>
                
                <TextField
                  fullWidth
                  placeholder="Search by name, GSTIN, or phone"
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton 
                          size="small" 
                          onClick={() => setSearchQuery('')}
                          edge="end"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                  sx={{ mb: 2 }}
                />
                
                <Tabs 
                  value={partyType} 
                  onChange={handleTabChange} 
                  variant="fullWidth"
                  indicatorColor="primary"
                  textColor="primary"
                >
                  <Tab 
                    label="All" 
                    value={null} 
                  />
                  <Tab 
                    label={
                      <Badge badgeContent={customerCount} color="primary" max={999}>
                        <Box sx={{ mr: 1 }}>Customers</Box>
                      </Badge>
                    } 
                    value="customer" 
                  />
                  <Tab 
                    label={
                      <Badge badgeContent={supplierCount} color="secondary" max={999}>
                        <Box sx={{ mr: 1 }}>Suppliers</Box>
                      </Badge>
                    } 
                    value="supplier" 
                  />
                </Tabs>
              </Box>
              
              <Box sx={{ 
                p: 1, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'action.hover'
              }}>
                <Typography variant="body2" color="text.secondary">
                  {sortedParties.length} {partyType || 'parties'} found
                </Typography>
                <Box>
                  <Tooltip title="Sort by name">
                    <IconButton 
                      size="small" 
                      color={sortField === 'name' ? 'primary' : 'default'}
                      onClick={() => handleSort('name')}
                    >
                      <Typography variant="caption" sx={{ mr: 0.5 }}>Name</Typography>
                      {sortField === 'name' && sortOrder === 'asc' ? 
                        <ArrowUpwardIcon fontSize="small" /> : 
                        <ArrowDownwardIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sort by balance">
                    <IconButton 
                      size="small"
                      color={sortField === 'balance' ? 'primary' : 'default'}
                      onClick={() => handleSort('balance')}
                    >
                      <Typography variant="caption" sx={{ mr: 0.5 }}>Balance</Typography>
                      {sortField === 'balance' && sortOrder === 'asc' ? 
                        <ArrowUpwardIcon fontSize="small" /> : 
                        <ArrowDownwardIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Box sx={{ 
                flexGrow: 1, 
                overflow: 'auto',
                maxHeight: { xs: '300px', md: 'calc(100vh - 350px)' },
                minHeight: '200px',
                px: 1 // Add horizontal padding
              }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : sortedParties.length > 0 ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    width: '100%' 
                  }}>
                    {sortedParties.map((party) => (
                      <Card 
                        key={party.id} 
                        variant="outlined" 
                        sx={{ 
                          width: '100%',
                          mb: 1.5, 
                          cursor: 'pointer',
                          bgcolor: selectedParty?.id === party.id ? 'primary.light' : 'background.paper',
                          borderColor: selectedParty?.id === party.id ? 'primary.main' : 'divider',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: selectedParty?.id === party.id ? 'primary.light' : 'action.hover',
                            transform: 'translateY(-2px)',
                            boxShadow: 1
                          }
                        }}
                        onClick={() => handleSelectParty(party)}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {party.type && party.type === 'customer' ? (
                              <PersonIcon fontSize="small" color="primary" sx={{ mr: 1, flexShrink: 0 }} />
                            ) : (
                              <BusinessIcon fontSize="small" color="secondary" sx={{ mr: 1, flexShrink: 0 }} />
                            )}
                            <Typography variant="subtitle1" fontWeight={500} noWrap sx={{ flexGrow: 1 }}>
                              {party.name}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {party.gstin || party.phone || 'No additional details'}
                          </Typography>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            mt: 1,
                            flexWrap: { xs: 'wrap', sm: 'nowrap' },
                            gap: 1
                          }}>
                            <Chip 
                              label={party.type || 'unknown'} 
                              size="small" 
                              color={party.type && party.type === 'customer' ? 'primary' : 'secondary'} 
                              variant="outlined"
                              sx={{ flexShrink: 0 }}
                            />
                            {party.balance !== undefined && (
                              <Typography 
                                variant="body2" 
                                fontWeight="medium"
                                sx={{ 
                                  color: party.balance > 0 ? 'success.main' : party.balance < 0 ? 'error.main' : 'text.secondary',
                                  ml: 'auto'
                                }}
                              >
                                {party.balance > 0 ? `₹${party.balance} CR` : party.balance < 0 ? `₹${Math.abs(party.balance)} DR` : '₹0'}
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%', 
                    width: '100%',
                    p: 3 
                  }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                      No parties found matching your search
                    </Typography>
                    {searchQuery && (
                      <Button 
                        size="small" 
                        onClick={() => setSearchQuery('')}
                        startIcon={<CloseIcon />}
                        sx={{ mt: 1 }}
                      >
                        Clear search
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Ledger Display */}
          <Grid item xs={12} md={8} lg={9} id="ledger-section">
            <Paper 
              elevation={2} 
              sx={{ 
                height: '100%',
                minHeight: { xs: '400px', md: 'calc(100vh - 200px)' },
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {selectedParty ? (
                <>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h6">
                          {selectedParty.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedParty.type ? `${selectedParty.type.charAt(0).toUpperCase()}${selectedParty.type.slice(1)}` : 'Party'} • {selectedParty.gstin || 'No GSTIN'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {isMobile && (
                        <Button
                          variant="outlined"
                          color="inherit"
                          size="small"
                          onClick={handleClearSelection}
                        >
                          Back
                        </Button>
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => window.location.href = `/accounting/transactions/new?partyId=${selectedParty.id}`}
                      >
                        Add Transaction
                      </Button>
                    </Box>
                  </Box>
                  
                  <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                    <PartyLedger partyId={selectedParty.id} party={selectedParty} />
                  </Box>
                </>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  p: 3 
                }}>
                  <AccountBalanceIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Party Selected
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400, mb: 3 }}>
                    Select a party from the list to view their ledger details, transaction history, and balance information.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => window.location.href = '/parties/new'}
                  >
                    Add New Party
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </DashboardLayout>
  );
}