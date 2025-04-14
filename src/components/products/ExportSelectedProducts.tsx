import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { FileDownload as DownloadIcon } from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
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

interface ExportSelectedProductsProps {
  selectedIds: string[];
}

const ExportSelectedProducts: React.FC<ExportSelectedProductsProps> = ({ selectedIds }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one product to export.');
      return;
    }

    setLoading(true);
    try {
      // Fetch selected products from Firestore
      const productsPromises = selectedIds.map(async (id) => {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return {
            id: docSnap.id,
            ...docSnap.data()
          } as Product;
        }
        return null;
      });
      
      const products = (await Promise.all(productsPromises)).filter(p => p !== null) as Product[];
      
      // Export to Excel
      exportProductsToExcel(products);
    } catch (error) {
      console.error('Error exporting selected products:', error);
      alert('Failed to export selected products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
      onClick={handleExport}
      disabled={loading || selectedIds.length === 0}
    >
      Export Selected ({selectedIds.length})
    </Button>
  );
};

export default ExportSelectedProducts;