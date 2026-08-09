"use client";
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  Button,
  Autocomplete,
  Paper,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Percent as PercentIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  History as HistoryIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

interface Party {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  isGstRegistered?: boolean;
  categoryDiscounts?: Record<string, number>;
  productDiscounts?: Record<string, number>;
  outstandingBalance?: number;
  creditLimit?: number;
  paymentTerms?: string;
  isFavorite?: boolean;
  lastTransactionDate?: string;
  totalInvoices?: number;
  totalAmount?: number;
  tags?: string[];
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface EnhancedPartySelectorProps {
  selectedParty: Party | null;
  onPartySelect: (party: Party | null) => void;
  onPartyCreate?: (party: Party) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  showCreateButton?: boolean;
  showFavorites?: boolean;
  showRecentParties?: boolean;
  showPartyStats?: boolean;
  showGstFilter?: boolean;
  maxRecentParties?: number;
  placeholder?: string;
  size?: 'small' | 'medium';
}

interface PartyStats {
  totalInvoices: number;
  totalAmount: number;
  outstandingBalance: number;
  lastTransactionDate: string | null;
}

export default function EnhancedPartySelector({
  selectedParty,
  onPartySelect,
  onPartyCreate,
  disabled = false,
  error = false,
  helperText,
  required = false,
  showCreateButton = true,
  showFavorites = true,
  showRecentParties = true,
  showPartyStats = true,
  showGstFilter = false,
  maxRecentParties = 5,
  placeholder = "Search parties by name, phone, email, or GSTIN...",
  size = 'small'
}: EnhancedPartySelectorProps) {
  const { userId } = useCurrentUser();
  
  // State management
  const [parties, setParties] = useState<Party[]>([]);
  const [recentParties, setRecentParties] = useState<Party[]>([]);
  const [favoriteParties, setFavoriteParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [gstFilter, setGstFilter] = useState<'all' | 'gst' | 'non-gst'>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'positive' | 'negative' | 'zero'>('all');
  const [partyStats, setPartyStats] = useState<Record<string, PartyStats>>({});
  
  // Create party dialog
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newParty, setNewParty] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
    isGstRegistered: false,
    paymentTerms: '',
    creditLimit: 0,
    notes: ''
  });
  const [creatingParty, setCreatingParty] = useState(false);

  // Load parties on component mount
  useEffect(() => {
    loadParties();
    if (showRecentParties) loadRecentParties();
    if (showFavorites) loadFavoriteParties();
  }, [userId]);

  // Load party statistics
  useEffect(() => {
    if (showPartyStats && parties.length > 0) {
      loadPartyStatistics();
    }
  }, [parties, showPartyStats]);

  const loadParties = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const partiesQuery = query(
        collection(db, 'parties'),
        where('userId', '==', userId),
        orderBy('name')
      );
      
      const snapshot = await getDocs(partiesQuery);
      const partiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Party[];
      
      setParties(partiesData);
    } catch (error) {
      console.error('Error loading parties:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentParties = async () => {
    if (!userId) return;
    
    try {
      // Get recent invoices to find recently used parties
      const recentInvoicesQuery = query(
        collection(db, 'invoices'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(maxRecentParties * 2) // Get more to filter unique parties
      );
      
      const snapshot = await getDocs(recentInvoicesQuery);
      const recentPartyIds = new Set<string>();
      const recentPartiesData: Party[] = [];
      
      snapshot.docs.forEach(doc => {
        const invoice = doc.data();
        if (invoice.partyId && !recentPartyIds.has(invoice.partyId) && recentPartyIds.size < maxRecentParties) {
          recentPartyIds.add(invoice.partyId);
          const party = parties.find(p => p.id === invoice.partyId);
          if (party) {
            recentPartiesData.push(party);
          }
        }
      });
      
      setRecentParties(recentPartiesData);
    } catch (error) {
      console.error('Error loading recent parties:', error);
    }
  };

  const loadFavoriteParties = async () => {
    const favorites = parties.filter(party => party.isFavorite);
    setFavoriteParties(favorites);
  };

  const loadPartyStatistics = async () => {
    if (!userId) return;
    
    try {
      const stats: Record<string, PartyStats> = {};
      
      for (const party of parties.slice(0, 20)) { // Limit to first 20 for performance
        const invoicesQuery = query(
          collection(db, 'invoices'),
          where('userId', '==', userId),
          where('partyId', '==', party.id),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(invoicesQuery);
        const invoices = snapshot.docs.map(doc => doc.data());
        
        stats[party.id] = {
          totalInvoices: invoices.length,
          totalAmount: invoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
          outstandingBalance: party.outstandingBalance || 0,
          lastTransactionDate: invoices.length > 0 ? invoices[0].createdAt?.toDate?.()?.toISOString() || null : null
        };
      }
      
      setPartyStats(stats);
    } catch (error) {
      console.error('Error loading party statistics:', error);
    }
  };

  // Filter parties based on search and filters
  const filteredParties = useMemo(() => {
    let filtered = parties;
    
    // Search filter
    if (searchValue.trim()) {
      const search = searchValue.toLowerCase().trim();
      filtered = filtered.filter(party => 
        party.name.toLowerCase().includes(search) ||
        (party.phone && party.phone.includes(search)) ||
        (party.email && party.email.toLowerCase().includes(search)) ||
        (party.gstin && party.gstin.toLowerCase().includes(search)) ||
        (party.address && party.address.toLowerCase().includes(search))
      );
    }
    
    // GST filter
    if (gstFilter !== 'all') {
      filtered = filtered.filter(party => {
        const hasGst = party.isGstRegistered && party.gstin;
        return gstFilter === 'gst' ? hasGst : !hasGst;
      });
    }
    
    // Balance filter
    if (balanceFilter !== 'all') {
      filtered = filtered.filter(party => {
        const balance = party.outstandingBalance || 0;
        switch (balanceFilter) {
          case 'positive': return balance > 0;
          case 'negative': return balance < 0;
          case 'zero': return balance === 0;
          default: return true;
        }
      });
    }
    
    return filtered;
  }, [parties, searchValue, gstFilter, balanceFilter]);

  const handleCreateParty = async () => {
    if (!newParty.name.trim()) return;
    
    try {
      setCreatingParty(true);
      
      const partyData = {
        ...newParty,
        name: newParty.name.trim(),
        userId,
        isGstRegistered: newParty.isGstRegistered,
        categoryDiscounts: {},
        productDiscounts: {},
        outstandingBalance: 0,
        isFavorite: false,
        totalInvoices: 0,
        totalAmount: 0,
        tags: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'parties'), partyData);
      
      const newPartyWithId = {
        ...partyData,
        id: docRef.id
      } as Party;
      
      setParties(prev => [...prev, newPartyWithId]);
      onPartySelect(newPartyWithId);
      
      if (onPartyCreate) {
        onPartyCreate(newPartyWithId);
      }
      
      setOpenCreateDialog(false);
      resetNewPartyForm();
    } catch (error) {
      console.error('Error creating party:', error);
    } finally {
      setCreatingParty(false);
    }
  };

  const resetNewPartyForm = () => {
    setNewParty({
      name: '',
      email: '',
      phone: '',
      address: '',
      gstin: '',
      isGstRegistered: false,
      paymentTerms: '',
      creditLimit: 0,
      notes: ''
    });
  };

  const getPartyDisplayText = (party: Party) => {
    let text = party.name;
    if (party.phone) text += ` • ${party.phone}`;
    if (party.gstin) text += ` • ${party.gstin}`;
    return text;
  };

  const getPartyChips = (party: Party) => {
    const chips = [];
    
    if (party.isGstRegistered && party.gstin) {
      chips.push(
        <Chip
          key="gst"
          label="GST"
          size="small"
          color="success"
          variant="outlined"
          icon={<VerifiedIcon />}
        />
      );
    }
    
    if (party.isFavorite) {
      chips.push(
        <Chip
          key="favorite"
          label="Favorite"
          size="small"
          color="warning"
          variant="outlined"
          icon={<StarIcon />}
        />
      );
    }
    
    const balance = party.outstandingBalance || 0;
    if (balance !== 0) {
      chips.push(
        <Chip
          key="balance"
          label={`₹${Math.abs(balance).toFixed(2)} ${balance > 0 ? 'Due' : 'Advance'}`}
          size="small"
          color={balance > 0 ? 'error' : 'info'}
          variant="outlined"
          icon={<AccountBalanceIcon />}
        />
      );
    }
    
    return chips;
  };

  const renderPartyOption = (props: any, party: Party) => {
    const stats = partyStats[party.id];
    
    return (
      <Box component="li" {...props} key={party.id}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            {party.name.charAt(0).toUpperCase()}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="body2" fontWeight="medium" noWrap>
                {party.name}
              </Typography>
              {party.isFavorite && (
                <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {getPartyChips(party)}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {party.phone && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 12 }} />
                  {party.phone}
                </Typography>
              )}
              
              {party.email && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EmailIcon sx={{ fontSize: 12 }} />
                  {party.email}
                </Typography>
              )}
              
              {party.gstin && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BusinessIcon sx={{ fontSize: 12 }} />
                  {party.gstin}
                </Typography>
              )}
            </Box>
            
            {showPartyStats && stats && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  {stats.totalInvoices} invoices • ₹{stats.totalAmount.toFixed(2)} total
                  {stats.lastTransactionDate && (
                    <> • Last: {new Date(stats.lastTransactionDate).toLocaleDateString()}</>
                  )}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  const QuickSelectSection = ({ title, parties: sectionParties, icon }: { title: string; parties: Party[]; icon: React.ReactNode }) => {
    if (sectionParties.length === 0) return null;
    
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          {icon}
          {title}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {sectionParties.map(party => (
            <Chip
              key={party.id}
              label={party.name}
              size="small"
              variant={selectedParty?.id === party.id ? "filled" : "outlined"}
              color={selectedParty?.id === party.id ? "primary" : "default"}
              onClick={() => onPartySelect(party)}
              avatar={<Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>
                {party.name.charAt(0).toUpperCase()}
              </Avatar>}
            />
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      {/* Quick Select Sections */}
      {(showFavorites || showRecentParties) && !searchValue && (
        <Box sx={{ mb: 2 }}>
          {showFavorites && (
            <QuickSelectSection
              title="Favorite Parties"
              parties={favoriteParties}
              icon={<StarIcon sx={{ fontSize: 14 }} />}
            />
          )}
          
          {showRecentParties && (
            <QuickSelectSection
              title="Recent Parties"
              parties={recentParties}
              icon={<HistoryIcon sx={{ fontSize: 14 }} />}
            />
          )}
        </Box>
      )}

      {/* Main Search and Selection */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Autocomplete
            options={filteredParties}
            getOptionLabel={getPartyDisplayText}
            value={selectedParty}
            onChange={(_, newValue) => onPartySelect(newValue)}
            disabled={disabled || loading}
            loading={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Party"
                placeholder={placeholder}
                size={size}
                error={error}
                helperText={helperText}
                required={required}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {loading && <CircularProgress size={20} />}
                      {selectedParty && (
                        <IconButton
                          size="small"
                          onClick={() => onPartySelect(null)}
                          edge="end"
                        >
                          <ClearIcon />
                        </IconButton>
                      )}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
            renderOption={renderPartyOption}
            filterOptions={(options) => options} // We handle filtering manually
            inputValue={searchValue}
            onInputChange={(_, newValue) => setSearchValue(newValue)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText={
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No parties found
                </Typography>
                {showCreateButton && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setNewParty(prev => ({ ...prev, name: searchValue }));
                      setOpenCreateDialog(true);
                    }}
                  >
                    Create "{searchValue}"
                  </Button>
                )}
              </Box>
            }
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {showCreateButton && (
            <Tooltip title="Create New Party">
              <IconButton
                onClick={() => setOpenCreateDialog(true)}
                disabled={disabled}
                color="primary"
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}

          {showGstFilter && (
            <Tooltip title="Advanced Filters">
              <IconButton
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                color={showAdvancedFilters ? "primary" : "default"}
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Advanced Filters */}
      <Collapse in={showAdvancedFilters}>
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Advanced Filters
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="GST Status"
                value={gstFilter}
                onChange={(e) => setGstFilter(e.target.value as any)}
                SelectProps={{ native: true }}
              >
                <option value="all">All Parties</option>
                <option value="gst">GST Registered</option>
                <option value="non-gst">Non-GST</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Balance Status"
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value as any)}
                SelectProps={{ native: true }}
              >
                <option value="all">All Balances</option>
                <option value="positive">Outstanding Due</option>
                <option value="negative">Advance Balance</option>
                <option value="zero">Zero Balance</option>
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Selected Party Information */}
      {selectedParty && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Selected Party: {selectedParty.name}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              {getPartyChips(selectedParty)}
            </Box>
            
            {selectedParty.isGstRegistered && selectedParty.gstin && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                GSTIN: {selectedParty.gstin} | 
                State: {selectedParty.gstin.substring(0, 2)} | 
                Tax Type: {selectedParty.gstin.substring(0, 2) === '27' ? 'Intra-State (CGST+SGST)' : 'May be Inter-State (IGST)'}
              </Typography>
            )}
            
            {showPartyStats && partyStats[selectedParty.id] && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {partyStats[selectedParty.id].totalInvoices} invoices • 
                ₹{partyStats[selectedParty.id].totalAmount.toFixed(2)} total value
              </Typography>
            )}
          </Box>
        </Alert>
      )}

      {/* Create Party Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Party</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Party Name"
              value={newParty.name}
              onChange={(e) => setNewParty(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
              error={!newParty.name.trim() && creatingParty}
              helperText={!newParty.name.trim() && creatingParty ? "Party name is required" : ""}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  value={newParty.email}
                  onChange={(e) => setNewParty(prev => ({ ...prev, email: e.target.value }))}
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  value={newParty.phone}
                  onChange={(e) => setNewParty(prev => ({ ...prev, phone: e.target.value }))}
                  fullWidth
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Address"
              value={newParty.address}
              onChange={(e) => setNewParty(prev => ({ ...prev, address: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
            
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={newParty.isGstRegistered}
                    onChange={(e) => setNewParty(prev => ({ ...prev, isGstRegistered: e.target.checked }))}
                  />
                }
                label="GST Registered"
              />
            </Box>
            
            {newParty.isGstRegistered && (
              <TextField
                label="GSTIN"
                value={newParty.gstin}
                onChange={(e) => setNewParty(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                fullWidth
                placeholder="e.g., 27AAAAA0000A1Z5"
                inputProps={{ maxLength: 15 }}
              />
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Payment Terms"
                  value={newParty.paymentTerms}
                  onChange={(e) => setNewParty(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  fullWidth
                  placeholder="e.g., Net 30 days"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Credit Limit"
                  type="number"
                  value={newParty.creditLimit}
                  onChange={(e) => setNewParty(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Notes"
              value={newParty.notes}
              onChange={(e) => setNewParty(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
              multiline
              rows={2}
              placeholder="Additional notes about this party..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateParty}
            variant="contained"
            disabled={creatingParty || !newParty.name.trim()}
            startIcon={creatingParty ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Create Party
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}