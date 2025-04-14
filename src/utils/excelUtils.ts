import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Product interface
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
}

/**
 * Generate a sample Excel template for product upload
 */
export const generateProductTemplate = () => {
  // Sample data with one example row
  const sampleData = [
    {
      name: 'Sample Product',
      sku: 'SAMPLE-001',
      category: 'Sample Category',
      price: 100,
      costPrice: 80,
      stock: 50,
      description: 'This is a sample product description',
      unit: 'pcs',
      minStockLevel: 10,
      barcode: '1234567890123',
      isActive: true
    }
  ];

  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Add column headers with comments/instructions
  const headerComments = {
    A1: { t: 's', v: 'Product Name (Required)' },
    B1: { t: 's', v: 'SKU (Required)' },
    C1: { t: 's', v: 'Category (Required)' },
    D1: { t: 's', v: 'Selling Price (Required)' },
    E1: { t: 's', v: 'Cost Price (Required)' },
    F1: { t: 's', v: 'Stock Quantity (Required)' },
    G1: { t: 's', v: 'Description (Optional)' },
    H1: { t: 's', v: 'Unit (Optional, e.g., pcs, kg, ltr)' },
    I1: { t: 's', v: 'Min Stock Level (Optional)' },
    J1: { t: 's', v: 'Barcode (Optional)' },
    K1: { t: 's', v: 'Active (Optional, true/false)' }
  };

  // Apply column widths
  const wscols = [
    { wch: 20 }, // Name
    { wch: 15 }, // SKU
    { wch: 15 }, // Category
    { wch: 12 }, // Price
    { wch: 12 }, // Cost Price
    { wch: 12 }, // Stock
    { wch: 30 }, // Description
    { wch: 10 }, // Unit
    { wch: 15 }, // Min Stock Level
    { wch: 15 }, // Barcode
    { wch: 10 }  // isActive
  ];

  worksheet['!cols'] = wscols;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Save file
  saveAs(blob, 'product_upload_template.xlsx');
};

/**
 * Parse Excel file and convert to product objects
 */
export const parseProductExcel = async (file: File): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Map to product objects and validate
        const products: Product[] = jsonData.map((row: any, index) => {
          // Validate required fields
          if (!row.name || !row.sku || !row.category || 
              row.price === undefined || row.costPrice === undefined || 
              row.stock === undefined) {
            throw new Error(`Row ${index + 2}: Missing required fields`);
          }
          
          return {
            name: row.name,
            sku: row.sku,
            category: row.category,
            price: Number(row.price),
            costPrice: Number(row.costPrice),
            stock: Number(row.stock),
            description: row.description || '',
            unit: row.unit || 'pcs',
            minStockLevel: row.minStockLevel !== undefined ? Number(row.minStockLevel) : 0,
            barcode: row.barcode || '',
            isActive: row.isActive !== undefined ? Boolean(row.isActive) : true
          };
        });
        
        resolve(products);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Export products to Excel file
 */
export const exportProductsToExcel = (products: Product[]) => {
  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(products);
  
  // Apply column widths
  const wscols = [
    { wch: 20 }, // Name
    { wch: 15 }, // SKU
    { wch: 15 }, // Category
    { wch: 12 }, // Price
    { wch: 12 }, // Cost Price
    { wch: 12 }, // Stock
    { wch: 30 }, // Description
    { wch: 10 }, // Unit
    { wch: 15 }, // Min Stock Level
    { wch: 15 }, // Barcode
    { wch: 10 }  // isActive
  ];
  
  worksheet['!cols'] = wscols;
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Save file
  saveAs(blob, 'products_export.xlsx');
};