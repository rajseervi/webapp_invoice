'use client';
import React, { useState, useEffect } from 'react';
import { 
  Button, Box, Typography, Input, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, Alert, CircularProgress, Select,
  MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Tabs, Tab
} from '@mui/material';

import { Container } from '@mui/material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import ProductForm from '@/components/ProductForm';
import { productService } from '@/services/productService';
import PdfUpload from '@/components/PdfUpload'; // Import the new PdfUpload component
import { Product } from '@/types/inventory';

// Define the ProductData interface to match the one in PdfUpload.tsx
interface ProductData {
  name: string;
  quantity: number;
  rate: number;
  sku?: string;
  category?: string;
  // Add other fields as needed
}

// Interface for product mapping
interface MappedProduct extends ProductData {
  mappedToExisting: boolean;
  existingProductId?: string;
  existingProductName?: string;
  updateQuantity: boolean;
  updatePrice: boolean;
}

const NewProduct = () => {
  const router = useRouter();
  const [extractedProducts, setExtractedProducts] = useState<ProductData[]>([]);
  const [mappedProducts, setMappedProducts] = useState<MappedProduct[]>([]);
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [saveResult, setSaveResult] = useState<{success: number, updated: number, failed: number} | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Fetch existing products when dialog opens
  useEffect(() => {
    if (showPreview) {
      fetchExistingProducts();
    }
  }, [showPreview]);
  
  // Fetch existing products for mapping
  const fetchExistingProducts = async () => {
    setIsLoadingExisting(true);
    try {
      const products = await productService.getProducts();
      setExistingProducts(products || []);
      
      // Initialize mapped products with default values
      const mapped = extractedProducts.map(product => ({
        ...product,
        mappedToExisting: false,
        existingProductId: undefined,
        existingProductName: undefined,
        updateQuantity: true,
        updatePrice: false
      }));
      
      // Try to auto-map products based on name or SKU
      const mappedWithSuggestions = mapped.map(product => {
        console.log("Attempting to map product:", product.name);
        
        // Try to find match by SKU first (if available)
        if (product.sku) {
          console.log("Checking for SKU match:", product.sku);
          const matchBySku = existingProducts.find(existing => 
            existing.sku?.toLowerCase() === product.sku?.toLowerCase()
          );
          
          if (matchBySku) {
            console.log("Found SKU match:", matchBySku.name);
            return {
              ...product,
              mappedToExisting: true,
              existingProductId: matchBySku.id,
              existingProductName: matchBySku.name
            };
          }
        }
        
        // Normalize product name for comparison
        const normalizeText = (text: string): string => {
          return text.toLowerCase()
                    .trim()
                    // Remove common filler words that might vary between descriptions
                    .replace(/\b(the|a|an|of|with|for|in|on|by|premium|quality|standard)\b/gi, '')
                    // Replace multiple spaces with single space
                    .replace(/\s+/g, ' ')
                    // Remove special characters
                    .replace(/[^\w\s]/g, '');
        };
        
        const normalizedProductName = normalizeText(product.name);
        console.log("Normalized product name:", normalizedProductName);
        
        // Calculate similarity between two strings (Levenshtein distance based)
        const calculateSimilarity = (str1: string, str2: string): number => {
          if (str1 === str2) return 1.0;
          
          const len1 = str1.length;
          const len2 = str2.length;
          
          // Quick length check for optimization
          if (Math.abs(len1 - len2) / Math.max(len1, len2) > 0.5) {
            return 0.0;
          }
          
          // Calculate word overlap for multi-word product names
          const words1 = str1.split(' ').filter(w => w.length > 2); // Only words > 2 chars
          const words2 = str2.split(' ').filter(w => w.length > 2);
          
          if (words1.length === 0 || words2.length === 0) return 0.0;
          
          // Count matching words
          let matchingWords = 0;
          for (const word1 of words1) {
            if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
              matchingWords++;
            }
          }
          
          // Calculate word similarity
          const wordSimilarity = (2.0 * matchingWords) / (words1.length + words2.length);
          return wordSimilarity;
        };
        
        // Try to find match by name (fuzzy match)
        let bestMatch = null;
        let bestSimilarity = 0.5; // Minimum threshold for considering a match
        
        for (const existing of existingProducts) {
          const normalizedExistingName = normalizeText(existing.name);
          const similarity = calculateSimilarity(normalizedProductName, normalizedExistingName);
          
          if (similarity > bestSimilarity) {
            bestMatch = existing;
            bestSimilarity = similarity;
          }
        }
        
        if (bestMatch) {
          console.log(`Found name match: ${bestMatch.name} (similarity: ${bestSimilarity.toFixed(2)})`);
          return {
            ...product,
            mappedToExisting: true,
            existingProductId: bestMatch.id,
            existingProductName: bestMatch.name
          };
        }
        
        console.log("No match found for product");
        return product;
      });
      
      setMappedProducts(mappedWithSuggestions);
    } catch (error) {
      console.error('Error fetching existing products:', error);
    } finally {
      setIsLoadingExisting(false);
    }
  };
  
  const handleSubmit = async (productData: any) => {
    try {
      await productService.createProduct(productData);
      router.push('/products');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product.');
    }
  };

  // Function to handle data extracted from PDF
  const handlePdfDataExtracted = (data: ProductData[]) => {
    console.log('Extracted data from PDF:', data);
    
    if (data.length === 0) {
      alert('No product data found in the PDF.');
      return;
    }
    
    // Store the extracted data and show the preview
    setExtractedProducts(data);
    setShowPreview(true);
  };
  
  // Function to handle product mapping changes
  const handleMappingChange = (index: number, field: string, value: any) => {
    const updatedMappedProducts = [...mappedProducts];
    
    if (field === 'existingProductId') {
      const selectedProduct = existingProducts.find(p => p.id === value);
      updatedMappedProducts[index] = {
        ...updatedMappedProducts[index],
        [field]: value,
        mappedToExisting: !!value,
        existingProductName: selectedProduct?.name
      };
    } else {
      updatedMappedProducts[index] = {
        ...updatedMappedProducts[index],
        [field]: value
      };
    }
    
    setMappedProducts(updatedMappedProducts);
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Function to handle saving the previewed products
  const handleSaveProducts = async () => {
    if (mappedProducts.length === 0) return;
    
    setIsSaving(true);
    setSaveResult(null);
    
    const successCount = { value: 0 };
    const updatedCount = { value: 0 };
    const failCount = { value: 0 };
    
    // Iterate through mapped data and create/update products
    for (const item of mappedProducts) {
      try {
        if (item.mappedToExisting && item.existingProductId) {
          // Update existing product
          const updateData: any = {};
          
          // Only update quantity if checkbox is checked
          if (item.updateQuantity) {
            updateData.quantity = item.quantity;
          }
          
          // Only update price if checkbox is checked
          if (item.updatePrice) {
            updateData.price = item.rate;
          }
          
          // Only update if there are changes
          if (Object.keys(updateData).length > 0) {
            await productService.updateProduct(item.existingProductId, updateData);
            updatedCount.value++;
            console.log(`Product ${item.existingProductName} updated successfully.`);
          } else {
            console.log(`No changes to update for ${item.existingProductName}.`);
          }
        } else {
          // Create new product
          const newProduct = {
            name: item.name,
            quantity: item.quantity,
            price: item.rate, // Using rate from PDF as price
            // Add default values for required fields
            description: `Imported from PDF - ${new Date().toLocaleDateString()}`,
            categoryId: item.category ? item.category : 'default', // Use category from import or default
            sku: item.sku || undefined, // Use SKU if available
            reorderPoint: Math.max(1, Math.floor(item.quantity * 0.1)), // Default reorder point at 10% of quantity
            isActive: true,
          };
          
          await productService.createProduct(newProduct);
          successCount.value++;
          console.log(`Product ${item.name} created successfully.`);
        }
      } catch (error) {
        failCount.value++;
        console.error(`Error processing product ${item.name}:`, error);
      }
    }
    
    setIsSaving(false);
    setSaveResult({ 
      success: successCount.value,
      updated: updatedCount.value,
      failed: failCount.value 
    });
  };
  
  // Function to close the preview dialog
  const handleClosePreview = () => {
    setShowPreview(false);
    // If products were successfully saved, refresh the page
    if (saveResult && (saveResult.success > 0 || saveResult.updated > 0) && saveResult.failed === 0) {
      router.refresh();
    }
  };
  
  // Helper function to get existing product details
  const getExistingProductDetails = (productId: string | undefined) => {
    if (!productId) return null;
    return existingProducts.find(p => p.id === productId);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Add New Product
        </Typography>
        {/* Integrate the PdfUpload component */}
        <PdfUpload onDataExtracted={handlePdfDataExtracted} />
        <ProductForm onSubmit={handleSubmit} />
        
        {/* Preview Dialog */}
        <Dialog 
          open={showPreview} 
          onClose={isSaving ? undefined : handleClosePreview}
          fullWidth
          maxWidth="lg"
        >
          <DialogTitle>Import Products from PDF</DialogTitle>
          <DialogContent>
            {saveResult && (
              <Alert 
                severity={saveResult.failed > 0 ? "warning" : "success"} 
                sx={{ mb: 2 }}
              >
                {saveResult.success} products created successfully.
                {saveResult.updated > 0 && ` ${saveResult.updated} existing products updated.`}
                {saveResult.failed > 0 && ` ${saveResult.failed} products failed to import.`}
              </Alert>
            )}
            
            {isLoadingExisting && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography>Loading existing products for mapping...</Typography>
              </Box>
            )}
            
            {!saveResult && !isLoadingExisting && (
              <>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                  <Tab label="Review & Map" />
                  <Tab label="Raw Data" />
                </Tabs>
                
                {activeTab === 0 && (
                  <>
                    <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                      Review extracted products and map them to existing products if needed. New products will be created for unmapped items.
                    </Typography>
                    
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                      <Table sx={{ minWidth: 650 }} size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Product Name</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Price</TableCell>
                            {extractedProducts.some(p => p.sku) && (
                              <TableCell>SKU</TableCell>
                            )}
                            <TableCell>Map to Existing</TableCell>
                            <TableCell>Update Options</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mappedProducts.map((product, index) => {
                            const existingProduct = getExistingProductDetails(product.existingProductId);
                            
                            return (
                              <TableRow key={index}>
                                <TableCell component="th" scope="row">
                                  {product.name}
                                  {product.mappedToExisting && existingProduct && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Will be mapped to: {product.existingProductName}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  {product.quantity}
                                  {product.mappedToExisting && existingProduct && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Current: {existingProduct.quantity}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  {product.rate.toFixed(2)}
                                  {product.mappedToExisting && existingProduct && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Current: {existingProduct.price?.toFixed(2) || 'N/A'}
                                    </Typography>
                                  )}
                                </TableCell>
                                {extractedProducts.some(p => p.sku) && (
                                  <TableCell>{product.sku || 'N/A'}</TableCell>
                                )}
                                <TableCell>
                                  <FormControl variant="outlined" size="small" fullWidth>
                                    <InputLabel id={`product-mapping-${index}`}>Map To</InputLabel>
                                    <Select
                                      labelId={`product-mapping-${index}`}
                                      value={product.existingProductId || ''}
                                      onChange={(e) => handleMappingChange(index, 'existingProductId', e.target.value)}
                                      label="Map To"
                                    >
                                      <MenuItem value="">
                                        <em>Create New</em>
                                      </MenuItem>
                                      {existingProducts.map((existingProduct) => (
                                        <MenuItem key={existingProduct.id} value={existingProduct.id}>
                                          {existingProduct.name}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </TableCell>
                                <TableCell>
                                  {product.mappedToExisting && (
                                    <Box>
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={product.updateQuantity}
                                            onChange={(e) => handleMappingChange(index, 'updateQuantity', e.target.checked)}
                                            size="small"
                                          />
                                        }
                                        label="Update Qty"
                                      />
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={product.updatePrice}
                                            onChange={(e) => handleMappingChange(index, 'updatePrice', e.target.checked)}
                                            size="small"
                                          />
                                        }
                                        label="Update Price"
                                      />
                                    </Box>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        New products will be created with default values for category, description, and other required fields.
                        Mapped products will only be updated if the corresponding update options are selected.
                      </Typography>
                    </Box>
                  </>
                )}
                
                {activeTab === 1 && (
                  <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product Name</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Price</TableCell>
                          {extractedProducts.some(p => p.sku) && (
                            <TableCell>SKU</TableCell>
                          )}
                          {extractedProducts.some(p => p.category) && (
                            <TableCell>Category</TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {extractedProducts.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell component="th" scope="row">
                              {product.name}
                            </TableCell>
                            <TableCell align="right">{product.quantity}</TableCell>
                            <TableCell align="right">{product.rate.toFixed(2)}</TableCell>
                            {extractedProducts.some(p => p.sku) && (
                              <TableCell>{product.sku || 'N/A'}</TableCell>
                            )}
                            {extractedProducts.some(p => p.category) && (
                              <TableCell>{product.category || 'N/A'}</TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleClosePreview} 
              disabled={isSaving}
            >
              {saveResult ? 'Close' : 'Cancel'}
            </Button>
            {!saveResult && !isLoadingExisting && (
              <Button 
                onClick={handleSaveProducts} 
                variant="contained" 
                color="primary"
                disabled={isSaving}
                startIcon={isSaving ? <CircularProgress size={20} /> : null}
              >
                {isSaving ? 'Saving...' : 'Process Products'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default NewProduct;