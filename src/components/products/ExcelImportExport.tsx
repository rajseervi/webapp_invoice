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
  Divider
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  CloudDownload as DownloadIcon,
  FileDownload as TemplateIcon
} from '@mui/icons-material';
import { generateProductTemplate, parseProductExcel } from '@/utils/excelUtils';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface Product {
  id?: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  description?: string;
  unit?: string;
  minStockLevel?: number;
  barcode?: string;
  isActive?: boolean;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setSuccess(null);
    setProducts([]);
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
    
    try {
      const batch = writeBatch(db);
      const productsRef = collection(db, 'products');
      
      // Add timestamp to each product
      const timestamp = new Date();
      const productsWithTimestamp = products.map(product => ({
        ...product,
        createdAt: timestamp,
        updatedAt: timestamp
      }));
      
      // Use batch write for better performance
      for (const product of productsWithTimestamp) {
        const newDocRef = doc(productsRef);
        batch.set(newDocRef, product);
      }
      
      await batch.commit();
      
      setSuccess(`Successfully uploaded ${products.length} products to the database.`);
      setProducts([]);
      onSuccess(); // Refresh product list
    } catch (err: any) {
      console.error('Error uploading products:', err);
      setError(`Error uploading products: ${err.message}`);
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
        Import/Export
      </Button>
      
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Import/Export Products</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Excel Import/Export Tools
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Use these tools to import products from Excel or download templates and exports.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<TemplateIcon />}
                onClick={handleDownloadTemplate}
              >
                Download Template
              </Button>
              
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadIcon />}
                disabled={uploading}
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
            </Box>
            
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
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress />
              </Box>
            )}
            
            {products.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {products.length} Products Ready to Upload:
                </Typography>
                <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                  <List dense>
                    {products.slice(0, 100).map((product, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText
                            primary={product.name}
                            secondary={`SKU: ${product.sku} | Category: ${product.category} | Price: ${product.price} | Stock: ${product.stock}`}
                          />
                        </ListItem>
                        {index < products.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                    {products.length > 100 && (
                      <ListItem>
                        <ListItemText
                          primary={`... and ${products.length - 100} more products`}
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
                >
                  {uploading ? <CircularProgress size={24} /> : `Upload ${products.length} Products`}
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