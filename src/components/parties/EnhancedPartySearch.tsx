import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Avatar,
  Chip,
  InputAdornment,
  Grid,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Skeleton,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { Party } from '@/types/party';
import { partyService } from '@/services/partyService';

interface EnhancedPartySearchProps {
  onPartySelect: (party: Party | null) => void;
  selectedParty?: Party | null;
  placeholder?: string;
  showCreateButton?: boolean;
  onCreateNew?: () => void;
  showFilters?: boolean;
  userId: string;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  disabled?: boolean;
}

interface FilterOptions {
  gstEnabled?: boolean | null;
  category?: string;
  location?: string;
}

const EnhancedPartySearch: React.FC<EnhancedPartySearchProps> = ({
  onPartySelect,
  selectedParty,
  placeholder = "🔍 Search parties by name, phone, email, or GSTIN...",
  showCreateButton = true,
  onCreateNew,
  showFilters = true,
  userId,
  variant = 'outlined',
  size = 'small',
  fullWidth = true,
  disabled = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [filters, setFilters] = useState<FilterOptions>({});

  // Load parties on component mount
  useEffect(() => {
    if (userId) {
      loadParties();
    }
  }, [userId]);

  const loadParties = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedParties = await partyService.getPartiesByUser(userId);
      setParties(fetchedParties);
    } catch (error) {
      console.error('Error loading parties:', error);
      setError('Failed to load parties');
    } finally {
      setLoading(false);
    }
  };

  // Filter parties based on search input and filters
  const filteredParties = useMemo(() => {
    let filtered = parties;

    // Apply search filter
    if (inputValue.trim()) {
      const searchTerm = inputValue.toLowerCase().trim();
      filtered = filtered.filter(party => 
        party.name.toLowerCase().includes(searchTerm) ||
        party.phone?.toLowerCase().includes(searchTerm) ||
        party.email?.toLowerCase().includes(searchTerm) ||
        party.gstin?.toLowerCase().includes(searchTerm) ||
        party.address?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply additional filters
    if (filters.gstEnabled !== null && filters.gstEnabled !== undefined) {
      filtered = filtered.filter(party => 
        filters.gstEnabled ? (party.gstin && party.gstin.trim() !== '') : (!party.gstin || party.gstin.trim() === '')
      );
    }

    if (filters.location) {
      filtered = filtered.filter(party => 
        party.address?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    return filtered;
  }, [parties, inputValue, filters]);

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterToggle = (filterType: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? null : value
    }));
    handleFilterClose();
  };

  const clearFilters = () => {
    setFilters({});
    setInputValue('');
    onPartySelect(null);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== null && value !== undefined).length;
  };

  const renderPartyOption = (props: any, option: Party) => (
    <Box component="li" {...props} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Avatar 
            sx={{ 
              bgcolor: option.gstin ? 'success.main' : 'grey.400',
              width: 48, 
              height: 48,
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
          >
            {option.name.charAt(0).toUpperCase()}
          </Avatar>
        </Grid>
        <Grid item xs>
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 0.5 }}>
              {option.name}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {option.phone && (
                <Chip 
                  icon={<PhoneIcon />} 
                  label={option.phone} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
              {option.email && (
                <Chip 
                  icon={<EmailIcon />} 
                  label={option.email} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
              {option.gstin && (
                <Chip 
                  icon={<BusinessIcon />} 
                  label={`GST: ${option.gstin}`} 
                  size="small" 
                  color="success"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
            </Box>
            {option.address && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <LocationIcon sx={{ fontSize: 14, color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {option.address}
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Card 
      sx={{ 
        mb: 2, 
        boxShadow: theme.shadows[2],
        borderRadius: 2,
        '&:hover': {
          boxShadow: theme.shadows[4],
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            fontWeight="bold" 
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <PersonIcon color="primary" />
            Party Search
          </Typography>
          
          {showCreateButton && onCreateNew && (
            <Button
              variant="contained"
              size={isMobile ? "small" : "medium"}
              startIcon={<AddIcon />}
              onClick={onCreateNew}
              sx={{ borderRadius: 2 }}
            >
              {isMobile ? "Add" : "Create New"}
            </Button>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search and Filters Row */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={showFilters ? 10 : 12}>
            <Autocomplete
              fullWidth={fullWidth}
              size={size}
              disabled={disabled}
              loading={loading}
              options={filteredParties}
              getOptionLabel={(option) => option.name}
              value={selectedParty}
              onChange={(_, newValue) => onPartySelect(newValue)}
              inputValue={inputValue}
              onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
              noOptionsText={inputValue.trim() ? "No parties found" : "Start typing to search..."}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant={variant}
                  placeholder={placeholder}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        {inputValue && (
                          <IconButton size="small" onClick={clearFilters}>
                            <ClearIcon />
                          </IconButton>
                        )}
                        {params.InputProps.endAdornment}
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.grey[50],
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.grey[100],
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
                      }
                    }
                  }}
                />
              )}
              renderOption={renderPartyOption}
              ListboxProps={{
                sx: { 
                  maxHeight: 400,
                  '& .MuiAutocomplete-option': {
                    padding: 0,
                  }
                }
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  boxShadow: theme.shadows[8],
                }
              }}
            />
          </Grid>

          {/* Filters */}
          {showFilters && (
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'center' } }}>
                <Tooltip title="Filter options">
                  <IconButton
                    onClick={handleFilterClick}
                    sx={{
                      position: 'relative',
                      border: getActiveFiltersCount() > 0 ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                      borderColor: getActiveFiltersCount() > 0 ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: 'primary.main',
                      }
                    }}
                  >
                    <FilterIcon color={getActiveFiltersCount() > 0 ? 'primary' : 'action'} />
                    {getActiveFiltersCount() > 0 && (
                      <Chip
                        label={getActiveFiltersCount()}
                        size="small"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          minWidth: 20,
                          height: 20,
                          fontSize: '0.75rem'
                        }}
                      />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Active filters:
            </Typography>
            {filters.gstEnabled !== null && filters.gstEnabled !== undefined && (
              <Chip
                label={filters.gstEnabled ? "GST Enabled" : "GST Disabled"}
                size="small"
                color="primary"
                onDelete={() => handleFilterToggle('gstEnabled', filters.gstEnabled)}
              />
            )}
            <Button size="small" onClick={clearFilters} startIcon={<ClearIcon />}>
              Clear All
            </Button>
          </Box>
        )}

        {/* Results Summary */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {loading ? (
              <Skeleton width={100} />
            ) : (
              `${filteredParties.length} of ${parties.length} parties`
            )}
          </Typography>
          
          {selectedParty && (
            <Chip
              icon={<ReceiptIcon />}
              label={`Selected: ${selectedParty.name}`}
              color="primary"
              variant="outlined"
              onDelete={() => onPartySelect(null)}
            />
          )}
        </Box>

        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 200,
              boxShadow: theme.shadows[8],
            }
          }}
        >
          <MenuItem onClick={() => handleFilterToggle('gstEnabled', true)}>
            <ListItemIcon>
              <BusinessIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>GST Enabled Only</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleFilterToggle('gstEnabled', false)}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Regular Parties Only</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default EnhancedPartySearch;