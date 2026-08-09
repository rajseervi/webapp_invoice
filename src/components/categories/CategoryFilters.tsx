import React from 'react';
import {
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Typography,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
} from '@mui/icons-material';

type ViewMode = 'grid' | 'list';
type FilterOption = 'all' | 'active' | 'inactive' | 'with-products' | 'empty';

interface CategoryFiltersProps {
  searchTerm: string;
  filterOption: FilterOption;
  viewMode: ViewMode;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: FilterOption) => void;
  onViewModeChange: (value: ViewMode) => void;
  totalCategories: number;
}

const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  searchTerm,
  filterOption,
  viewMode,
  onSearchChange,
  onFilterChange,
  onViewModeChange,
  totalCategories,
}) => {
  const filterOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'active', label: 'Active Only' },
    { value: 'inactive', label: 'Inactive Only' },
    { value: 'with-products', label: 'With Products' },
    { value: 'empty', label: 'Empty Categories' },
  ];

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />

        {/* Filter */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            value={filterOption}
            onChange={(e) => onFilterChange(e.target.value as FilterOption)}
            label="Filter"
          >
            {filterOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* View Mode */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, value) => value && onViewModeChange(value)}
          aria-label="view mode"
        >
          <ToggleButton value="grid" aria-label="grid view">
            <GridViewIcon />
          </ToggleButton>
          <ToggleButton value="list" aria-label="list view">
            <ListViewIcon />
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Results Count */}
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 'fit-content' }}>
          {totalCategories} categories
        </Typography>
      </Box>
    </Paper>
  );
};

export default CategoryFilters;