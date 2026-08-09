"use client";
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  InputAdornment,
  Autocomplete,
  DatePicker,
  Slider,
  Typography,
  Collapse,
  IconButton,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DateRange as DateRangeIcon,
  MonetizationOn as MoneyIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker as MuiDatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export interface InvoiceFilterOptions {
  searchTerm: string;
  status: string;
  period: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  amountMin: number;
  amountMax: number;
  gstRate: string;
  invoiceType: string;
  partyName: string;
  showArchived: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface InvoiceFiltersProps {
  filters: InvoiceFilterOptions;
  onFiltersChange: (filters: InvoiceFilterOptions) => void;
  parties: Array<{ id: string; name: string; gstin?: string }>;
  loading?: boolean;
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' }
];

const periodOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
];

const gstRateOptions = [
  { value: 'all', label: 'All GST Rates' },
  { value: '0', label: '0%' },
  { value: '5', label: '5%' },
  { value: '12', label: '12%' },
  { value: '18', label: '18%' },
  { value: '28', label: '28%' }
];

const invoiceTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'gst', label: 'GST Invoice' },
  { value: 'regular', label: 'Regular Invoice' },
  { value: 'inter-state', label: 'Inter-state (IGST)' },
  { value: 'intra-state', label: 'Intra-state (CGST+SGST)' }
];

const sortOptions = [
  { value: 'date', label: 'Date' },
  { value: 'invoiceNumber', label: 'Invoice Number' },
  { value: 'partyName', label: 'Party Name' },
  { value: 'amount', label: 'Amount' },
  { value: 'status', label: 'Status' }
];

export default function InvoiceFilters({ 
  filters, 
  onFiltersChange, 
  parties, 
  loading = false 
}: InvoiceFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  React.useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.status !== 'all') count++;
    if (filters.period !== 'all') count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.amountMin > 0 || filters.amountMax < 1000000) count++;
    if (filters.gstRate !== 'all') count++;
    if (filters.invoiceType !== 'all') count++;
    if (filters.partyName) count++;
    if (filters.showArchived) count++;
    
    setActiveFiltersCount(count);
  }, [filters]);

  const updateFilter = (key: keyof InvoiceFilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      status: 'all',
      period: 'all',
      dateFrom: null,
      dateTo: null,
      amountMin: 0,
      amountMax: 1000000,
      gstRate: 'all',
      invoiceType: 'all',
      partyName: '',
      showArchived: false,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {/* Basic Filters Row */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search invoices..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: filters.searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => updateFilter('searchTerm', '')}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => updateFilter('status', e.target.value)}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Period</InputLabel>
            <Select
              value={filters.period}
              label="Period"
              onChange={(e) => updateFilter('period', e.target.value)}
            >
              {periodOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sortBy}
              label="Sort By"
              onChange={(e) => updateFilter('sortBy', e.target.value)}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              Filters
              {activeFiltersCount > 0 && (
                <Chip
                  size="small"
                  label={activeFiltersCount}
                  color="primary"
                  sx={{ ml: 1 }}
                />
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                size="small"
                onClick={clearAllFilters}
                startIcon={<ClearIcon />}
              >
                Clear
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Advanced Filters */}
      <Collapse in={expanded}>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          {/* Date Range */}
          {filters.period === 'custom' && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <MuiDatePicker
                    label="From Date"
                    value={filters.dateFrom}
                    onChange={(date) => updateFilter('dateFrom', date)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <DateRangeIcon />
                            </InputAdornment>
                          )
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <MuiDatePicker
                    label="To Date"
                    value={filters.dateTo}
                    onChange={(date) => updateFilter('dateTo', date)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <DateRangeIcon />
                            </InputAdornment>
                          )
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </>
          )}

          {/* Amount Range */}
          <Grid item xs={12} md={6}>
            <Box sx={{ px: 2 }}>
              <Typography gutterBottom>
                Amount Range: {formatCurrency(filters.amountMin)} - {formatCurrency(filters.amountMax)}
              </Typography>
              <Slider
                value={[filters.amountMin, filters.amountMax]}
                onChange={(e, newValue) => {
                  const [min, max] = newValue as number[];
                  updateFilter('amountMin', min);
                  updateFilter('amountMax', max);
                }}
                valueLabelDisplay="auto"
                min={0}
                max={1000000}
                step={1000}
                valueLabelFormat={formatCurrency}
              />
            </Box>
          </Grid>

          {/* GST Rate */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>GST Rate</InputLabel>
              <Select
                value={filters.gstRate}
                label="GST Rate"
                onChange={(e) => updateFilter('gstRate', e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <BusinessIcon />
                  </InputAdornment>
                }
              >
                {gstRateOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Invoice Type */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Invoice Type</InputLabel>
              <Select
                value={filters.invoiceType}
                label="Invoice Type"
                onChange={(e) => updateFilter('invoiceType', e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <ReceiptIcon />
                  </InputAdornment>
                }
              >
                {invoiceTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Party Selection */}
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              size="small"
              options={parties}
              getOptionLabel={(option) => `${option.name}${option.gstin ? ` (${option.gstin})` : ''}`}
              value={parties.find(p => p.name === filters.partyName) || null}
              onChange={(e, newValue) => updateFilter('partyName', newValue?.name || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Party"
                  placeholder="Choose a party"
                />
              )}
            />
          </Grid>

          {/* Additional Options */}
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.showArchived}
                    onChange={(e) => updateFilter('showArchived', e.target.checked)}
                  />
                }
                label="Show Archived"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.sortOrder === 'desc'}
                    onChange={(e) => updateFilter('sortOrder', e.target.checked ? 'desc' : 'asc')}
                  />
                }
                label="Descending Order"
              />
            </Box>
          </Grid>

          {/* Quick Filter Chips */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mr: 1, alignSelf: 'center' }}>
                Quick Filters:
              </Typography>
              <Chip
                label="This Month"
                variant={filters.period === 'month' ? 'filled' : 'outlined'}
                onClick={() => updateFilter('period', 'month')}
                size="small"
              />
              <Chip
                label="Pending"
                variant={filters.status === 'pending' ? 'filled' : 'outlined'}
                onClick={() => updateFilter('status', 'pending')}
                size="small"
                color="warning"
              />
              <Chip
                label="Paid"
                variant={filters.status === 'paid' ? 'filled' : 'outlined'}
                onClick={() => updateFilter('status', 'paid')}
                size="small"
                color="success"
              />
              <Chip
                label="High Value (>₹50k)"
                variant={filters.amountMin >= 50000 ? 'filled' : 'outlined'}
                onClick={() => {
                  updateFilter('amountMin', filters.amountMin >= 50000 ? 0 : 50000);
                }}
                size="small"
                color="primary"
              />
              <Chip
                label="18% GST"
                variant={filters.gstRate === '18' ? 'filled' : 'outlined'}
                onClick={() => updateFilter('gstRate', filters.gstRate === '18' ? 'all' : '18')}
                size="small"
                color="secondary"
              />
            </Box>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
}