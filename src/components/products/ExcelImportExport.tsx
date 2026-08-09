import React, { useState, useRef } from 'react';
import { 
  Button, 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Alert, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  LinearProgress,
  Chip,
  Grid
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  CloudDownload as DownloadIcon,
  FileDownload as TemplateIcon
} from '@mui/icons-material';
import { generateProductTemplate, parseProductExcel } from '@/utils/excelUtils';
import { findOrCreateCategory } from '@/utils/categoryUtils';
import { collection, addDoc, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface Product {
  id?: string;
  name: string;
  category: string; // This will be the category name from Excel
  categoryId?: string; // This will be the resolved category ID
  price: number;
  stock: number;
  createdAt?: any;
  updatedAt?: any;
}

interface ExcelImportExportProps {
  onSuccess: () => void;
}

const ExcelImportExport: React.FC<ExcelImportExportProps> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setSuccess(null);
    setProducts([]);
    setProgress(0);
    setCurrentStep('');
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDownloadTemplate = () => {
    generateProductTemplate();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const parsedProducts = await parseProductExcel(file);
      setProducts(parsedProducts);
      setSuccess(`Successfully parsed ${parsedProducts.length} products from Excel file.`);
    } catch (err: any) {
      console.error('Error parsing Excel file:', err);
      setError(`Error parsing Excel file: ${err.message}`);
      setProducts([]);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (products.length === 0) {
      setError('No products to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);
    setCurrentStep('Initializing upload...');
    
    try {
      const batch = writeBatch(db);
      const productsRef = collection(db, 'products');
      
      // Step 1: Validate all products before processing
      setCurrentStep('Validating products...');
      setProgress(5);
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (!product.name || !product.category || !product.price || !product.stock) {
          throw new Error(`Product ${i + 1}: Missing required fields (name, category, price, or stock)`);
        }
        if (product.price <= 0) {
          throw new Error(`Product ${i + 1} (${product.name}): Price must be greater than 0`);
        }
        if (product.stock < 0) {
          throw new Error(`Product ${i + 1} (${product.name}): Stock cannot be negative`);
        }
      }
      
      // Step 2: Resolve all category names to category IDs
      setCurrentStep('Processing categories...');
      setProgress(10);
      
      const productsWithCategoryIds = [];
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        setCurrentStep(`Processing category "${product.category}" for product ${i + 1} of ${products.length}...`);
        setProgress(10 + (40 * (i + 1)) / products.length);
        
        const categoryId = await findOrCreateCategory(product.category);
        if (!categoryId) {
          throw new Error(`Failed to create or find category "${product.category}" for product "${product.name}"`);
        }
        
        productsWithCategoryIds.push({
          name: product.name,
          categoryId: categoryId,
          price: product.price, // Keep for backward compatibility
          salePrice: product.price, // Required field
          purchasePrice: product.price * 0.7, // Default purchase price at 70% of selling price
          quantity: product.stock, // Use 'quantity' instead of 'stock' to match your schema
          unitOfMeasurement: 'pcs', // Default unit
          isService: false, // Default to physical product
          isActive: true, // Set status to active as requested
          reorderPoint: 10, // Default reorder point
          sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Auto-generate SKU
          description: `Imported product: ${product.name}`,
          tags: [product.category.toLowerCase()],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      // Step 3: Prepare batch write
      setCurrentStep('Preparing products for upload...');
      setProgress(60);
      
      for (const product of productsWithCategoryIds) {
        const newDocRef = doc(productsRef);
        batch.set(newDocRef, product);
      }
      
      // Step 4: Upload to database
      setCurrentStep('Uploading to database...');
      setProgress(85);
      
      await batch.commit();
      
      setProgress(100);
      setCurrentStep('Upload completed!');
      setSuccess(`Successfully uploaded ${products.length} products and created/found categories.`);
      setProducts([]);
      
      // Add a small delay to ensure Firebase consistency
      setTimeout(() => {
        onSuccess(); // Refresh product list
      }, 1000);
    } catch (err: any) {
      console.error('Error uploading products:', err);
      setError(`Error uploading products: ${err.message}`);
      setCurrentStep('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<UploadIcon />}
        onClick={handleOpen}
        sx={{ mr: 1 }}
      >
        Simple Import/Export
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Simple Product Import/Export</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Excel Import/Export Tools
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Use these tools to import products from Excel with minimal required fields: Name, Category, Price, and Stock.
              Categories will be automatically created if they don't exist.
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  startIcon={<TemplateIcon />}
                  onClick={handleDownloadTemplate}
                  fullWidth
                  size="large"
                >
                  Download Template
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadIcon />}
                  disabled={uploading}
                  fullWidth
                  size="large"
                >
                  Select Excel File
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              </Grid>
            </Grid>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            {uploading && (
              <Box sx={{ my: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {currentStep}
                </Typography>
                <LinearProgress variant="determinate" value={progress} sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={24} />
                </Box>
              </Box>
            )}
            
            {products.length > 0 && !uploading && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1">
                    Products Ready to Upload:
                  </Typography>
                  <Chip 
                    label={`${products.length} items`} 
                    color="primary" 
                    size="small" 
                  />
                </Box>
                
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                  <List dense>
                    {products.slice(0, 50).map((product, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" component="span">
                                  {product.name}
                                </Typography>
                                <Chip 
                                  label={product.category} 
                                  size="small" 
                                  variant="outlined" 
                                />
                              </Box>
                            }
                            secondary={`Price: ₹${product.price} | Stock: ${product.stock} units`}
                          />
                        </ListItem>
                        {index < Math.min(products.length - 1, 49) && <Divider />}
                      </React.Fragment>
                    ))}
                    {products.length > 50 && (
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="body2" color="text.secondary" align="center">
                              ... and {products.length - 50} more products
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </Paper>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpload}
                  disabled={uploading}
                  fullWidth
                  size="large"
                  startIcon={<UploadIcon />}
                >
                  Upload {products.length} Products & Create Categories
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExcelImportExport;