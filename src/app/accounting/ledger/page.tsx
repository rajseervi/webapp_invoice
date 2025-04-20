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
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import PartyFinder from '@/components/Ledger/PartyFinder';
import PartyLedger from '@/components/Ledger/PartyLedger';
import { Party } from '@/types/party';
import { partyService } from '@/services/partyService';

export default function LedgerPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
  };

  const filteredParties = parties.filter(party => 
    party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (party.gstin && party.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (party.phone && party.phone.includes(searchQuery))
  );

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Party Ledger</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => window.location.href = '/parties/new'}
          >
            Add Party
          </Button>
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
          {/* Party Selection */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Select Party
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <TextField
                fullWidth
                placeholder="Search by name, GSTIN, or phone"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ mb: 2 }}
              />
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {filteredParties.length > 0 ? (
                    filteredParties.map((party) => (
                      <Card 
                        key={party.id} 
                        variant="outlined" 
                        sx={{ 
                          mb: 1, 
                          cursor: 'pointer',
                          bgcolor: selectedParty?.id === party.id ? 'primary.light' : 'background.paper',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          }
                        }}
                        onClick={() => handleSelectParty(party)}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="subtitle1" fontWeight={500}>
                            {party.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {party.gstin || 'No GSTIN'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Chip 
                              label={party.type} 
                              size="small" 
                              color={party.type === 'customer' ? 'primary' : 'secondary'} 
                              variant="outlined"
                            />
                            {party.balance !== undefined && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  ml: 1,
                                  color: party.balance > 0 ? 'success.main' : party.balance < 0 ? 'error.main' : 'text.secondary'
                                }}
                              >
                                {party.balance > 0 ? `₹${party.balance} CR` : party.balance < 0 ? `₹${Math.abs(party.balance)} DR` : '₹0'}
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                      No parties found matching your search
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Ledger Display */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
              {selectedParty ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {selectedParty.name} Ledger
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => window.location.href = `/accounting/transactions/new?partyId=${selectedParty.id}`}
                    >
                      Add Transaction
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <PartyLedger partyId={selectedParty.id} />
                </>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Party Selected
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Select a party from the list to view their ledger details
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </DashboardLayout>
  );
}