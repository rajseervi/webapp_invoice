'use client';
import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import {
  GetApp as ExportIcon,
  Description as ExcelIcon,
  PictureAsPdf as PdfIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { ExcelService } from '@/services/excelService';
import { Product, Category } from '@/types/inventory';
import { categoryService } from '@/services/categoryService';
import * as XLSX from 'xlsx';

interface ExportSelectedProductsProps {
  selectedIds: string[];
  onShowSnackbar?: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

interface ExportOptions {
  format: 'xlsx' | 'pdf';
  includeHeaders: boolean;
  includeMetadata: boolean;
  includeInactive: boolean;
  includeCategoryNames: boolean;
  includeDescriptions: boolean;
  includeTimestamps: boolean;
}

export default function ExportSelectedProducts({
  selectedIds,
  onShowSnackbar
}: ExportSelectedProductsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'xlsx',
    includeHeaders: true,
    includeMetadata: true,
    includeInactive: true,
    includeCategoryNames: true,
    includeDescriptions: true,
    includeTimestamps: false
  });
  const [exporting, setExporting] = useState(false);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    setExporting(true);
    setAnchorEl(null);

    try {
      if (selectedIds.length === 0) {
        onShowSnackbar?.('No products selected for export', 'warning');
        setExporting(false);
        return;
      }

      // Import productService here to avoid circular dependencies
      const { productService } = await import('@/services/productService');

      // Fetch selected products data
      const allProducts = await productService.getProducts();
      const categories = await categoryService.getCategories();

      // Filter to get only selected products
      const selectedProducts = allProducts.products.filter(product =>
        selectedIds.includes(product.id!)
      );

      if (selectedProducts.length === 0) {
        onShowSnackbar?.('Selected products not found', 'error');
        setExporting(false);
        return;
      }

      // Prepare export data with category names
      const exportData = selectedProducts.map(product => {
        const category = categories.find(c => c.id === product.categoryId);
        return {
          id: product.id,
          name: product.name,
          categoryId: product.categoryId,
          categoryName: category?.name || 'Unknown',
          price: product.price,
          quantity: product.quantity,
          description: exportOptions.includeDescriptions ? (product.description || '') : undefined,
          reorderPoint: product.reorderPoint || 10,
          isActive: product.isActive,
          gstRate: product.gstRate || 0,
          hsnCode: product.hsnCode || '',
          sacCode: product.sacCode || '',
          isService: product.isService || false,
          gstExempt: product.gstExempt || false,
          cessRate: product.cessRate || 0,
          unitOfMeasurement: product.unitOfMeasurement || 'PCS',
          ...(exportOptions.includeTimestamps && {
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
          })
        };
      });

      const timestamp = new Date().toISOString().split('T')[0];

      if (format === 'xlsx') {
        // Excel export using ExcelService
        ExcelService.exportProductsToExcel(selectedProducts, {
          filename: `selected_products_${timestamp}.xlsx`,
          includeMetadata: exportOptions.includeMetadata,
          sheetName: 'Selected Products'
        });

      } else if (format === 'pdf') {
        // PDF export using a simple HTML-to-PDF approach
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Selected Products Export</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  color: #333;
                }
                h1 {
                  color: #1976d2;
                  border-bottom: 2px solid #1976d2;
                  padding-bottom: 10px;
                }
                .header-info {
                  background-color: #f5f5f5;
                  padding: 15px;
                  border-radius: 5px;
                  margin-bottom: 20px;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
                  font-size: 12px;
                }
                th, td {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
                }
                th {
                  background-color: #1976d2;
                  color: white;
                  font-weight: bold;
                }
                tr:nth-child(even) {
                  background-color: #f9f9f9;
                }
                .status-active {
                  color: #4caf50;
                  font-weight: bold;
                }
                .status-inactive {
                  color: #f44336;
                  font-weight: bold;
                }
                .price {
                  font-weight: bold;
                  color: #1976d2;
                }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <h1>Selected Products Export</h1>

              <div class="header-info">
                <strong>Export Date:</strong> ${new Date().toLocaleDateString()}<br>
                <strong>Total Products:</strong> ${selectedProducts.length}<br>
                <strong>Active Products:</strong> ${selectedProducts.filter(p => p.isActive).length}<br>
                <strong>Inactive Products:</strong> ${selectedProducts.filter(p => !p.isActive).length}
              </div>

              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price (₹)</th>
                    <th>Stock</th>
                    <th>Status</th>
                    ${exportOptions.includeDescriptions ? '<th>Description</th>' : ''}
                    <th>GST Rate</th>
                    <th>HSN/SAC</th>
                  </tr>
                </thead>
                <tbody>
                  ${exportData.map(product => `
                    <tr>
                      <td>${product.id}</td>
                      <td><strong>${product.name}</strong></td>
                      <td>${product.categoryName}</td>
                      <td class="price">₹${parseFloat(product.price as any).toFixed(2)}</td>
                      <td>${product.quantity}</td>
                      <td class="${product.isActive ? 'status-active' : 'status-inactive'}">
                        ${product.isActive ? 'Active' : 'Inactive'}
                      </td>
                      ${exportOptions.includeDescriptions ? `<td>${product.description || ''}</td>` : ''}
                      <td>${product.gstRate}%</td>
                      <td>${product.hsnCode || product.sacCode || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div style="margin-top: 30px; font-size: 10px; color: #666;">
                <p><em>Generated by Product Management System</em></p>
              </div>
            </body>
          </html>
        `;

        // Create and download the HTML file (which can be opened in browser and printed as PDF)
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selected_products_${timestamp}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      onShowSnackbar?.(`Successfully exported ${selectedProducts.length} products to ${format.toUpperCase()}`, 'success');

    } catch (error) {
      console.error('Export error:', error);
      onShowSnackbar?.('Failed to export products', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleOptionsOpen = () => {
    setOptionsDialogOpen(true);
    setAnchorEl(null);
  };

  const handleOptionsClose = () => {
    setOptionsDialogOpen(false);
  };

  const handleOptionChange = (option: keyof ExportOptions) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setExportOptions({
      ...exportOptions,
      [option]: event.target.checked
    });
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<ExportIcon />}
        endIcon={<ExpandMoreIcon />}
        onClick={handleClick}
        disabled={selectedIds.length === 0 || exporting}
        size="small"
      >
        {exporting ? 'Exporting...' : 'Export Selected'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => handleExport('xlsx')}>
          <ListItemIcon>
            <ExcelIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Export to Excel" secondary={`${selectedIds.length} products`} />
        </MenuItem>

        <MenuItem onClick={() => handleExport('pdf')}>
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Export to PDF" secondary={`${selectedIds.length} products`} />
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleOptionsOpen}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Export Options" />
        </MenuItem>
      </Menu>

      {/* Export Options Dialog */}
      <Dialog
        open={optionsDialogOpen}
        onClose={handleOptionsClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Options</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Export Format
            </Typography>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeHeaders}
                    onChange={handleOptionChange('includeHeaders')}
                  />
                }
                label="Include column headers"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeMetadata}
                    onChange={handleOptionChange('includeMetadata')}
                  />
                }
                label="Include export metadata"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeCategoryNames}
                    onChange={handleOptionChange('includeCategoryNames')}
                  />
                }
                label="Include category names"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeDescriptions}
                    onChange={handleOptionChange('includeDescriptions')}
                  />
                }
                label="Include product descriptions"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={exportOptions.includeTimestamps}
                    onChange={handleOptionChange('includeTimestamps')}
                  />
                }
                label="Include created/updated timestamps"
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleOptionsClose}>Cancel</Button>
          <Button onClick={handleOptionsClose} variant="contained">
            Save Options
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}