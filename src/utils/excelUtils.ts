import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Product interface
interface Product {
  id?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

/**
 * Generate a sample Excel template for product upload
 */
export const generateProductTemplate = () => {
  // Sample data with one example row
  const sampleData = [
    {
      name: 'Sample Product',
      category: 'Sample Category',
      price: 100,
      stock: 50
    }
  ];

  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Add column headers with comments/instructions
  const headerComments = {
    A1: { t: 's', v: 'Product Name (Required)' },
    B1: { t: 's', v: 'Category (Required)' },
    C1: { t: 's', v: 'Price (Required)' },
    D1: { t: 's', v: 'Stock Quantity (Required)' }
  };

  // Apply column widths
  const wscols = [
    { wch: 25 }, // Name
    { wch: 20 }, // Category
    { wch: 15 }, // Price
    { wch: 15 }  // Stock
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
          if (!row.name || !row.category || 
              row.price === undefined || row.stock === undefined) {
            throw new Error(`Row ${index + 2}: Missing required fields (name, category, price, or stock)`);
          }
          
          return {
            name: row.name,
            category: row.category,
            price: Number(row.price),
            stock: Number(row.stock)
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
    { wch: 25 }, // Name
    { wch: 20 }, // Category
    { wch: 15 }, // Price
    { wch: 15 }  // Stock
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