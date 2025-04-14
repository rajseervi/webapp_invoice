import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { CloudDownload as DownloadIcon } from '@mui/icons-material';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { exportProductsToExcel } from '@/utils/excelUtils';

interface Product {
  id: string;
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
}

const ExportAllProducts: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // Fetch all products from Firestore
      const productsQuery = query(
        collection(db, 'products'),
        orderBy('name')
      );
      const snapshot = await getDocs(productsQuery);
      
      const products: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      
      // Export to Excel
      exportProductsToExcel(products);
    } catch (error) {
      console.error('Error exporting products:', error);
      alert('Failed to export products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
      onClick={handleExport}
      disabled={loading}
    >
      Export All
    </Button>
  );
};

export default ExportAllProducts;