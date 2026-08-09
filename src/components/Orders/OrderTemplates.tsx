"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Stack,
  Box,
  TextField,
  InputAdornment,
  Alert,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  Avatar
} from '@mui/material';

import {
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  Bookmark as BookmarkIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';

import { Order } from '@/types/order';

interface OrderTemplate {
  id: string;
  name: string;
  description: string;
  category: 'frequent' | 'seasonal' | 'bulk' | 'custom';
  customerName?: string;
  itemCount: number;
  totalValue: number;
  lastUsed?: string;
  useCount: number;
  isFavorite: boolean;
  tags: string[];
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

interface OrderTemplatesProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: OrderTemplate) => void;
}

// Mock templates data
const mockTemplates: OrderTemplate[] = [
  {
    id: '1',
    name: 'Office Supplies Bundle',
    description: 'Complete office supplies package for small businesses',
    category: 'frequent',
    customerName: 'ABC Corp',
    itemCount: 8,
    totalValue: 15000,
    lastUsed: '2024-01-15',
    useCount: 12,
    isFavorite: true,
    tags: ['office', 'supplies', 'bulk'],
    items: [
      { productName: 'A4 Paper (500 sheets)', quantity: 10, price: 250 },
      { productName: 'Ballpoint Pens (Pack of 10)', quantity: 5, price: 150 },
      { productName: 'Stapler', quantity: 2, price: 300 },
      { productName: 'File Folders (Pack of 25)', quantity: 4, price: 200 }
    ]
  },
  {
    id: '2',
    name: 'Electronics Starter Kit',
    description: 'Basic electronics components for beginners',
    category: 'bulk',
    itemCount: 15,
    totalValue: 25000,
    lastUsed: '2024-01-10',
    useCount: 8,
    isFavorite: false,
    tags: ['electronics', 'components', 'starter'],
    items: [
      { productName: 'Arduino Uno', quantity: 2, price: 800 },
      { productName: 'Breadboard', quantity: 5, price: 150 },
      { productName: 'LED Pack (50pcs)', quantity: 3, price: 200 },
      { productName: 'Resistor Kit', quantity: 2, price: 500 }
    ]
  },
  {
    id: '3',
    name: 'Seasonal Decoration Set',
    description: 'Festival decoration items for retail stores',
    category: 'seasonal',
    itemCount: 12,
    totalValue: 18000,
    lastUsed: '2023-12-20',
    useCount: 4,
    isFavorite: true,
    tags: ['decoration', 'festival', 'seasonal'],
    items: [
      { productName: 'LED String Lights', quantity: 20, price: 300 },
      { productName: 'Paper Lanterns', quantity: 15, price: 100 },
      { productName: 'Garland (10ft)', quantity: 10, price: 250 }
    ]
  },
  {
    id: '4',
    name: 'Restaurant Essentials',
    description: 'Daily essentials for restaurant operations',
    category: 'frequent',
    customerName: 'Food Palace',
    itemCount: 20,
    totalValue: 35000,
    lastUsed: '2024-01-18',
    useCount: 25,
    isFavorite: true,
    tags: ['restaurant', 'food', 'essentials'],
    items: [
      { productName: 'Disposable Plates (100pcs)', quantity: 10, price: 200 },
      { productName: 'Paper Napkins (500pcs)', quantity: 8, price: 150 },
      { productName: 'Plastic Cups (100pcs)', quantity: 12, price: 180 }
    ]
  }
];

export const OrderTemplates: React.FC<OrderTemplatesProps> = ({
  open,
  onClose,
  onSelectTemplate
}) => {
  const theme = useTheme();
  
  const [templates, setTemplates] = useState<OrderTemplate[]>(mockTemplates);
  const [filteredTemplates, setFilteredTemplates] = useState<OrderTemplate[]>(mockTemplates);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter templates
  useEffect(() => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory]);

  const toggleFavorite = (templateId: string) => {
    setTemplates(prev =>
      prev.map(template =>
        template.id === templateId
          ? { ...template, isFavorite: !template.isFavorite }
          : template
      )
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'frequent': return <TrendingUpIcon />;
      case 'seasonal': return <ScheduleIcon />;
      case 'bulk': return <ShoppingCartIcon />;
      case 'custom': return <BookmarkIcon />;
      default: return <CategoryIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'frequent': return 'success';
      case 'seasonal': return 'warning';
      case 'bulk': return 'info';
      case 'custom': return 'secondary';
      default: return 'default';
    }
  };

  const categories = [
    { value: 'all', label: 'All Templates', count: templates.length },
    { value: 'frequent', label: 'Frequent', count: templates.filter(t => t.category === 'frequent').length },
    { value: 'seasonal', label: 'Seasonal', count: templates.filter(t => t.category === 'seasonal').length },
    { value: 'bulk', label: 'Bulk Orders', count: templates.filter(t => t.category === 'bulk').length },
    { value: 'custom', label: 'Custom', count: templates.filter(t => t.category === 'custom').length }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BookmarkIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Order Templates
            </Typography>
            <Chip label={`${filteredTemplates.length} templates`} size="small" />
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Stack spacing={3}>
          {/* Search and Filters */}
          <Box>
            <TextField
              fullWidth
              placeholder="Search templates by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {categories.map((category) => (
                <Chip
                  key={category.value}
                  label={`${category.label} (${category.count})`}
                  onClick={() => setSelectedCategory(category.value)}
                  color={selectedCategory === category.value ? 'primary' : 'default'}
                  variant={selectedCategory === category.value ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </Box>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <Alert severity="info">
              No templates found matching your criteria. Try adjusting your search or filters.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredTemplates.map((template) => (
                <Grid item xs={12} md={6} lg={4} key={template.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: template.isFavorite ? `2px solid ${theme.palette.warning.main}` : '1px solid',
                      borderColor: template.isFavorite ? theme.palette.warning.main : theme.palette.divider,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}
                    onClick={() => onSelectTemplate(template)}
                  >
                    <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Header */}
                      <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {template.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {template.description}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(template.id);
                          }}
                          sx={{ color: template.isFavorite ? theme.palette.warning.main : theme.palette.grey[400] }}
                        >
                          {template.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                        </IconButton>
                      </Stack>

                      {/* Category and Customer */}
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip
                          icon={getCategoryIcon(template.category)}
                          label={template.category}
                          size="small"
                          color={getCategoryColor(template.category) as any}
                          variant="outlined"
                        />
                        {template.customerName && (
                          <Chip
                            icon={<PersonIcon />}
                            label={template.customerName}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>

                      {/* Stats */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={4}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="primary" fontWeight={700}>
                              {template.itemCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Items
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="success.main" fontWeight={700}>
                              ₹{(template.totalValue / 1000).toFixed(0)}K
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Value
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box textAlign="center">
                            <Typography variant="h6" color="info.main" fontWeight={700}>
                              {template.useCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Used
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Sample Items */}
                      <Box sx={{ mb: 2, flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Sample Items:
                        </Typography>
                        <Stack spacing={0.5}>
                          {template.items.slice(0, 3).map((item, index) => (
                            <Typography key={index} variant="caption" color="text.secondary">
                              • {item.productName} (Qty: {item.quantity})
                            </Typography>
                          ))}
                          {template.items.length > 3 && (
                            <Typography variant="caption" color="primary">
                              +{template.items.length - 3} more items
                            </Typography>
                          )}
                        </Stack>
                      </Box>

                      {/* Tags */}
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: 2 }}>
                        {template.tags.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        ))}
                      </Stack>

                      {/* Last Used */}
                      {template.lastUsed && (
                        <Typography variant="caption" color="text.secondary">
                          Last used: {new Date(template.lastUsed).toLocaleDateString()}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            // Handle create new template
            console.log('Create new template');
          }}
        >
          Create New Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderTemplates;