'use client';
import React, { useState } from 'react';
import {
  Button,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar
} from '@mui/material';
import * as XLSX from 'xlsx';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

interface ExcelUploadProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

interface ProductData {
  name: string;
  category: string;
  price: number;
  description?: string;
  sku: string;
  quantity: number;
  unit: string;
  minimumStock: number;
  maximumStock: number;
  isActive?: boolean;
}

export default function ExcelUpload({ onSuccess, onError }: ExcelUploadProps) {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ProductData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const validateData = (data: any[]): ProductData[] => {
    return data.map(row => {
      // Validate required fields
      if (!row['Product Name'] || !row['Category'] || !row['Price'] || !row['SKU'] || !row['Stock Quantity']) {
        throw new Error('Missing required fields in Excel data. Please use the template format.');
      }

      // Convert and validate numeric fields
      const price = Number(row['Price']);
      const quantity = Number(row['Stock Quantity']);
      const minimumStock = Number(row['Minimum Stock Level'] || 0);
      const maximumStock = Number(row['Maximum Stock Level'] || 0);

      if (isNaN(price) || isNaN(quantity) || isNaN(minimumStock) || isNaN(maximumStock)) {
        throw new Error('Invalid numeric values in Excel data');
      }

      return {
        name: String(row['Product Name']),
        category: String(row['Category']),
        price,
        description: row['Description'] ? String(row['Description']) : '',
        sku: String(row['SKU']),
        quantity,
        unit: String(row['Unit'] || 'pieces'),
        minimumStock,
        maximumStock,
        isActive: true
      };
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      // Validate file type and size
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        throw new Error('Please upload a valid Excel file (.xlsx or .xls)');
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB limit');
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            throw new Error('The Excel file is empty. Please add some data.');
          }

          if (jsonData.length > 1000) {
            throw new Error('Maximum 1000 products allowed per upload');
          }

          const validatedData = validateData(jsonData);
          setPreviewData(validatedData);
          setShowPreview(true);
        } catch (error) {
          onError(error instanceof Error ? error.message : 'Error processing Excel file');
        } finally {
          setLoading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      setLoading(false);
      onError(error instanceof Error ? error.message : 'Error uploading file');
    }
  };

  const handleConfirmUpload = async () => {
    try {
      setLoading(true);
      const productsCollection = collection(db, 'products');

      // Upload all products
      await Promise.all(previewData.map(async (product) => {
        await addDoc(productsCollection, {
          ...product,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }));

      setShowPreview(false);
      setPreviewData([]);
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error saving products');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/product_template.csv';
    link.download = 'product_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Please download and use the template file for correct data format. Maximum file size: 5MB.
        </Alert>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadIcon />}
            disabled={loading}
          >
            Upload Excel
            <input
              type="file"
              hidden
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
            />
          </Button>
          <Button
            variant="outlined"
            onClick={handleDownloadTemplate}
            disabled={loading}
          >
            Download Template
          </Button>
          {loading && <CircularProgress size={24} />}
        </Box>
      </Box>

      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Preview Products</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please review the products before confirming the upload.
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>SKU</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category ID</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Reorder Point</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.sku}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.categoryId}</TableCell>
                    <TableCell align="right">{row.price}</TableCell>
                    <TableCell align="right">{row.quantity}</TableCell>
                    <TableCell align="right">{row.reorderPoint}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Cancel</Button>
          <Button onClick={handleConfirmUpload} variant="contained" disabled={loading}>
            Confirm Upload
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}