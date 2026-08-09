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
  // Sample data with example rows showing different use cases
  const sampleData = [
    {
      name: 'Wireless Headphones',
      category: 'Electronics',
      price: 2999,
      stock: 25
    },
    {
      name: 'Cotton T-Shirt',
      category: 'Clothing',
      price: 499,
      stock: 100
    },
    {
      name: 'Office Chair',
      category: 'Furniture',
      price: 8999,
      stock: 12
    }
  ];

  // Rename columns for clarity
  const worksheetData = sampleData.map(item => ({
    'Product Name': item.name,
    'Category': item.category,
    'Price': item.price,
    'Stock Quantity': item.stock
  }));

  // Create worksheet from renamed data
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

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
          // Support multiple column name variations
          const name = row.name || row.Name || row.product_name || row['Product Name'] || row.productName || row['product name'];
          const category = row.category || row.Category || row.category_name || row['Category Name'] || row.categoryName || row['category name'];
          const price = row.price || row.Price || row.sale_price || row['Sale Price'] || row.salePrice || row['sale price'];
          const stock = row.stock || row.Stock || row.quantity || row.Quantity || row.qty || row.Qty || row['Stock Quantity'] || row.stockQuantity || row['stock quantity'];
          
          // Validate required fields
          if (!name || !category || price === undefined || stock === undefined) {
            throw new Error(`Row ${index + 2}: Missing required fields. Expected column names like: "Product Name", "Category", "Price", "Stock Quantity". Found columns: ${Object.keys(row).join(', ')}`);
          }
          
          return {
            name: String(name).trim(),
            category: String(category).trim(),
            price: Number(price),
            stock: Number(stock)
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

/**
 * Generic export to Excel function
 */
export const exportToExcel = (data: any[], filename: string = 'export.xlsx') => {
  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Auto-size columns based on content
  if (data.length > 0) {
    const colWidths = Object.keys(data[0]).map(key => {
      const maxLength = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) }; // Max width of 50
    });
    worksheet['!cols'] = colWidths;
  }
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Save file
  saveAs(blob, filename);
};