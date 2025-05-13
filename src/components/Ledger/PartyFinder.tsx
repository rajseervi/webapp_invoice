import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Chip
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { Party } from '@/types/party';
import { PartyBalance } from '@/types/transaction';
import { partyService } from '@/services/partyService';
import { transactionService } from '@/services/transactionService';
import { format } from 'date-fns';

interface PartyFinderProps {
  onSelectParty: (partyId: string, party: Party) => void;
}

export default function PartyFinder({ onSelectParty }: PartyFinderProps) {
  const [parties, setParties] = useState<Party[]>([]);
  const [partyBalances, setPartyBalances] = useState<PartyBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch parties
      const partiesData = await partyService.getParties();
      setParties(partiesData);
      
      // Fetch party balances
      const balancesData = await transactionService.getPartyBalances();
      setPartyBalances(balancesData);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load parties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePartySelect = (party: Party | null) => {
    setSelectedParty(party);
    if (party) {
      onSelectParty(party.id!, party);
    }
  };

  const filteredParties = parties.filter(party => 
    party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    party.phone.includes(searchTerm) ||
    (party.email && party.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get summary statistics
  const totalOutstanding = partyBalances.reduce((sum, balance) => sum + (balance.balance > 0 ? balance.balance : 0), 0);
  const totalOwed = partyBalances.reduce((sum, balance) => sum + (balance.balance < 0 ? Math.abs(balance.balance) : 0), 0);
  const netBalance = totalOutstanding - totalOwed;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Party Finder</Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={fetchData}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Outstanding (Receivable)
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }} color="error.main">
                ₹{totalOutstanding.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Owed (Payable)
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }} color="success.main">
                ₹{totalOwed.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Net Balance
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ mt: 1 }} 
                color={netBalance > 0 ? 'error.main' : netBalance < 0 ? 'success.main' : 'text.primary'}
              >
                ₹{Math.abs(netBalance).toFixed(2)}
                {netBalance !== 0 && (
                  <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                    {netBalance > 0 ? '(Receivable)' : '(Payable)'}
                  </Typography>
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <Autocomplete
          options={parties}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Party"
              variant="outlined"
              fullWidth
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <SearchIcon color="action" sx={{ mr: 1 }} />
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}
          onChange={(_, value) => handlePartySelect(value)}
          loading={loading}
          loadingText="Loading parties..."
          noOptionsText="No parties found"
        />
      </Box>

      <Paper sx={{ p: 2 }}>
        {loading && partyBalances.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Party Name</TableCell>
                  <TableCell align="right">Total Debit</TableCell>
                  <TableCell align="right">Total Credit</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Last Transaction</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {partyBalances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No parties found</TableCell>
                  </TableRow>
                ) : (
                  partyBalances
                    .filter(balance => 
                      balance.partyName.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((balance) => (
                      <TableRow key={balance.partyId}>
                        <TableCell>{balance.partyName}</TableCell>
                        <TableCell align="right">₹{balance.totalDebit.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{balance.totalCredit.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Typography
                              variant="body2"
                              color={balance.balance > 0 ? 'error.main' : balance.balance < 0 ? 'success.main' : 'text.primary'}
                            >
                              ₹{Math.abs(balance.balance).toFixed(2)}
                            </Typography>
                            <Chip
                              size="small"
                              label={balance.balance > 0 ? 'DR' : balance.balance < 0 ? 'CR' : 'Settled'}
                              color={balance.balance > 0 ? 'error' : balance.balance < 0 ? 'success' : 'default'}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          {balance.lastTransactionDate 
                            ? format(new Date(balance.lastTransactionDate), 'dd/MM/yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              const party = parties.find(p => p.id === balance.partyId);
                              if (party) {
                                handlePartySelect(party);
                              }
                            }}
                          >
                            View Ledger
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
    </Box>
  );
}