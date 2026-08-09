"use client"
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  TextField,
  Chip,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Merge as MergeIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  LocalOffer as PriceIcon,
  Inventory as StockIcon
} from '@mui/icons-material';

interface ExtractedProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
  sku?: string;
  confidence: number;
  rawText?: string;
}

interface ExistingProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface Category {
  id: string;
  name: string;
}

interface ProductMapping {
  extractedProductId: string;
  action: 'create' | 'update' | 'ignore';
  existingProductId?: string;
  newCategory?: string;
  updatePrice?: boolean;
  updateStock?: boolean;
  confidence: number;
}

interface ProductMappingDialogProps {
  open: boolean;
  onClose: () => void;
  extractedProducts: ExtractedProduct[];
  existingProducts: ExistingProduct[];
  categories: Category[];
  onMappingComplete: (mappings: ProductMapping[]) => void;
}

const ProductMappingDialog: React.FC<ProductMappingDialogProps> = ({
  open,
  onClose,
  extractedProducts,
  existingProducts,
  categories,
  onMappingComplete
}) => {
  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [autoMappingEnabled, setAutoMappingEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<'all' | 'create' | 'update' | 'ignore'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize mappings when dialog opens
  useEffect(() => {
    if (open && extractedProducts.length > 0) {
      if (autoMappingEnabled) {
        performAutoMapping();
      } else {
        initializeBasicMappings();
      }
    }
  }, [open, extractedProducts, autoMappingEnabled]);

  // Auto-mapping logic
  const performAutoMapping = () => {
    setIsProcessing(true);
    
    const newMappings: ProductMapping[] = extractedProducts.map(extracted => {
      // Try exact name match first
      const exactMatch = existingProducts.find(
        existing => existing.name.toLowerCase().trim() === extracted.name.toLowerCase().trim()
      );

      if (exactMatch) {
        return {
          extractedProductId: extracted.id,
          action: 'update',
          existingProductId: exactMatch.id,
          updatePrice: true,
          updateStock: true,
          confidence: 95
        };
      }

      // Try fuzzy matching
      const fuzzyMatch = findBestMatch(extracted.name, existingProducts);
      if (fuzzyMatch && fuzzyMatch.similarity > 0.8) {
        return {
          extractedProductId: extracted.id,
          action: 'update',
          existingProductId: fuzzyMatch.product.id,
          updatePrice: false, // Don't auto-update price for fuzzy matches
          updateStock: true,
          confidence: Math.round(fuzzyMatch.similarity * 100)
        };
      }

      // Create new product
      return {
        extractedProductId: extracted.id,
        action: 'create',
        newCategory: extracted.category || inferCategory(extracted.name),
        confidence: 70
      };
    });

    setMappings(newMappings);
    setIsProcessing(false);
  };

  // Initialize basic mappings (all create)
  const initializeBasicMappings = () => {
    const newMappings: ProductMapping[] = extractedProducts.map(extracted => ({
      extractedProductId: extracted.id,
      action: 'create',
      newCategory: extracted.category || 'General',
      confidence: 50
    }));
    setMappings(newMappings);
  };

  // Find best matching product using similarity
  const findBestMatch = (productName: string, products: ExistingProduct[]) => {
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const product of products) {
      const similarity = calculateSimilarity(productName, product.name);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = { product, similarity };
      }
    }

    return bestMatch;
  };

  // Simple similarity calculation
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    
    // Check if one string contains the other
    if (longer.includes(shorter)) {
      return shorter.length / longer.length;
    }
    
    // Levenshtein distance
    const editDistance = levenshteinDistance(s1, s2);
    return (longer.length - editDistance) / longer.length;
  };

  // Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Infer category from product name
  const inferCategory = (productName: string): string => {
    const categoryKeywords = {
      'Electronics': ['laptop', 'computer', 'phone', 'tablet', 'monitor', 'keyboard', 'mouse', 'headphone', 'speaker', 'camera'],
      'Office Supplies': ['pen', 'paper', 'notebook', 'folder', 'stapler', 'clip', 'desk', 'chair', 'printer'],
      'Furniture': ['table', 'chair', 'desk', 'cabinet', 'shelf', 'sofa', 'bed', 'drawer'],
      'Clothing': ['shirt', 'pant', 'dress', 'shoe', 'jacket', 'hat', 'sock', 'belt'],
      'Books': ['book', 'manual', 'guide', 'textbook', 'novel', 'magazine', 'journal'],
      'Tools': ['hammer', 'screwdriver', 'drill', 'saw', 'wrench', 'plier', 'tool']
    };

    const nameLower = productName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => nameLower.includes(keyword))) {
        return category;
      }
    }
    
    return 'General';
  };

  // Update mapping
  const updateMapping = (extractedProductId: string, updates: Partial<ProductMapping>) => {
    setMappings(prev =>
      prev.map(mapping =>
        mapping.extractedProductId === extractedProductId
          ? { ...mapping, ...updates }
          : mapping
      )
    );
  };

  // Get extracted product by ID
  const getExtractedProduct = (id: string) => {
    return extractedProducts.find(p => p.id === id);
  };

  // Get existing product by ID
  const getExistingProduct = (id: string) => {
    return existingProducts.find(p => p.id === id);
  };

  // Filter mappings based on search and action
  const filteredMappings = mappings.filter(mapping => {
    const extracted = getExtractedProduct(mapping.extractedProductId);
    if (!extracted) return false;

    // Filter by search term
    if (searchTerm && !extracted.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filter by action
    if (selectedAction !== 'all' && mapping.action !== selectedAction) {
      return false;
    }

    return true;
  });

  // Handle complete mapping
  const handleComplete = () => {
    onMappingComplete(mappings);
  };

  // Get statistics
  const stats = {
    total: mappings.length,
    create: mappings.filter(m => m.action === 'create').length,
    update: mappings.filter(m => m.action === 'update').length,
    ignore: mappings.filter(m => m.action === 'ignore').length,
    highConfidence: mappings.filter(m => m.confidence > 80).length
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Map Products to Database</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={autoMappingEnabled}
                onChange={(e) => setAutoMappingEnabled(e.target.checked)}
              />
            }
            label="Auto Mapping"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="primary">{stats.total}</Typography>
                <Typography variant="body2">Total Products</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="success.main">{stats.create}</Typography>
                <Typography variant="body2">New Products</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="warning.main">{stats.update}</Typography>
                <Typography variant="body2">Updates</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" color="info.main">{stats.highConfidence}</Typography>
                <Typography variant="body2">High Confidence</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Search Products"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Action</InputLabel>
            <Select
              value={selectedAction}
              label="Filter by Action"
              onChange={(e) => setSelectedAction(e.target.value as any)}
            >
              <MenuItem value="all">All Actions</MenuItem>
              <MenuItem value="create">Create New</MenuItem>
              <MenuItem value="update">Update Existing</MenuItem>
              <MenuItem value="ignore">Ignore</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {isProcessing && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Processing auto-mapping...
            </Typography>
          </Box>
        )}

        {/* Mapping Table */}
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Extracted Product</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Target Product</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Options</TableCell>
                <TableCell>Confidence</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMappings.map((mapping) => {
                const extracted = getExtractedProduct(mapping.extractedProductId);
                const existing = mapping.existingProductId ? getExistingProduct(mapping.existingProductId) : null;
                
                if (!extracted) return null;

                return (
                  <TableRow key={mapping.extractedProductId}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {extracted.name}
                        </Typography>
                        {extracted.sku && (
                          <Typography variant="caption" color="text.secondary">
                            SKU: {extracted.sku}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{extracted.quantity}</TableCell>
                    <TableCell>${extracted.price}</TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={mapping.action}
                          onChange={(e) => updateMapping(mapping.extractedProductId, { 
                            action: e.target.value as any,
                            existingProductId: e.target.value === 'create' ? undefined : mapping.existingProductId
                          })}
                        >
                          <MenuItem value="create">Create New</MenuItem>
                          <MenuItem value="update">Update Existing</MenuItem>
                          <MenuItem value="ignore">Ignore</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      {mapping.action === 'update' ? (
                        <Autocomplete
                          size="small"
                          options={existingProducts}
                          getOptionLabel={(option) => option.name}
                          value={existing}
                          onChange={(_, newValue) => 
                            updateMapping(mapping.extractedProductId, { 
                              existingProductId: newValue?.id 
                            })
                          }
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Select product" />
                          )}
                          sx={{ minWidth: 200 }}
                        />
                      ) : mapping.action === 'create' ? (
                        <Typography variant="body2" color="text.secondary">
                          New Product
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {mapping.action === 'create' ? (
                        <Autocomplete
                          size="small"
                          options={categories}
                          getOptionLabel={(option) => option.name}
                          value={categories.find(c => c.name === mapping.newCategory) || null}
                          onChange={(_, newValue) => 
                            updateMapping(mapping.extractedProductId, { 
                              newCategory: newValue?.name 
                            })
                          }
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Select category" />
                          )}
                          sx={{ minWidth: 150 }}
                        />
                      ) : existing ? (
                        <Typography variant="body2">{existing.category}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {mapping.action === 'update' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Update Price">
                            <IconButton
                              size="small"
                              color={mapping.updatePrice ? 'primary' : 'default'}
                              onClick={() => updateMapping(mapping.extractedProductId, { 
                                updatePrice: !mapping.updatePrice 
                              })}
                            >
                              <PriceIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Update Stock">
                            <IconButton
                              size="small"
                              color={mapping.updateStock ? 'primary' : 'default'}
                              onClick={() => updateMapping(mapping.extractedProductId, { 
                                updateStock: !mapping.updateStock 
                              })}
                            >
                              <StockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${mapping.confidence}%`}
                        size="small"
                        color={
                          mapping.confidence > 80 ? 'success' :
                          mapping.confidence > 60 ? 'warning' : 'error'
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredMappings.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No products match the current filters.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleComplete}
          disabled={mappings.length === 0}
        >
          Apply Mappings ({mappings.filter(m => m.action !== 'ignore').length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductMappingDialog;