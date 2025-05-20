import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Product interface
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

// Price update interface
interface PriceUpdate {
  productId: string;
  productName: string;
  category: string;
  currentPrice: number;
  newPrice: number;
}

/**
 * Generate an Excel template for category price updates
 */
export const generateCategoryPriceTemplate = (categoryName: string, products: Product[]) => {
  // Prepare data for Excel
  const templateData = products.map(product => ({
    productId: product.id,
    productName: product.name,
    category: product.category,
    currentPrice: Number(product.price) || 0,
    newPrice: Number(product.price) || 0, // Default to current price
  }));

  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Add column headers with comments/instructions
  const headerComments = {
    A1: { t: 's', v: 'Product ID (Do Not Change)' },
    B1: { t: 's', v: 'Product Name (Do Not Change)' },
    C1: { t: 's', v: 'Category (Do Not Change)' },
    D1: { t: 's', v: 'Current Price (Do Not Change)' },
    E1: { t: 's', v: 'New Price (Update This)' }
  };

  // Apply column widths
  const wscols = [
    { wch: 40 }, // Product ID
    { wch: 30 }, // Product Name
    { wch: 15 }, // Category
    { wch: 15 }, // Current Price
    { wch: 15 }, // New Price
  ];

  worksheet['!cols'] = wscols;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${categoryName} Prices`);

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Save file
  saveAs(blob, `${categoryName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_price_update.xlsx`);
};

/**
 * Parse Excel file and extract price updates
 */
export const parseCategoryPriceExcel = async (file: File, products: Product[]): Promise<PriceUpdate[]> => {
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
        
        // Create a map of product IDs for quick lookup
        const productMap = new Map(products.map(product => [product.id, product]));
        
        // Map to price update objects and validate
        const priceUpdates: PriceUpdate[] = [];
        
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i] as any;
          const rowIndex = i + 2; // Excel row number (1-based, plus header row)
          
          // Validate required fields
          if (!row.productId || !row.productName || !row.category || 
              row.currentPrice === undefined || row.newPrice === undefined) {
            throw new Error(`Row ${rowIndex}: Missing required fields`);
          }
          
          // Validate product ID exists
          if (!productMap.has(row.productId)) {
            throw new Error(`Row ${rowIndex}: Product ID ${row.productId} not found`);
          }
          
          // Validate new price is a number
          const newPrice = Number(row.newPrice);
          if (isNaN(newPrice) || newPrice < 0) {
            throw new Error(`Row ${rowIndex}: Invalid new price ${row.newPrice}`);
          }
          
          // Only include rows where the price has changed
          const currentPrice = Number(row.currentPrice);
          if (newPrice !== currentPrice) {
            priceUpdates.push({
              productId: row.productId,
              productName: row.productName,
              category: row.category,
              currentPrice: currentPrice,
              newPrice: newPrice
            });
          }
        }
        
        resolve(priceUpdates);
      } catch (error: any) {
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
 * Generate a summary report of price updates
 */
export const generatePriceUpdateSummary = (priceUpdates: PriceUpdate[]) => {
  // Calculate statistics
  let totalIncrease = 0;
  let totalDecrease = 0;
  let increaseCount = 0;
  let decreaseCount = 0;
  let noChangeCount = 0;
  
  priceUpdates.forEach(update => {
    const diff = update.newPrice - update.currentPrice;
    if (diff > 0) {
      totalIncrease += diff;
      increaseCount++;
    } else if (diff < 0) {
      totalDecrease += Math.abs(diff);
      decreaseCount++;
    } else {
      noChangeCount++;
    }
  });
  
  // Prepare summary data
  const summaryData = [
    {
      metric: 'Total Products',
      value: priceUpdates.length
    },
    {
      metric: 'Price Increases',
      value: increaseCount
    },
    {
      metric: 'Price Decreases',
      value: decreaseCount
    },
    {
      metric: 'No Change',
      value: noChangeCount
    },
    {
      metric: 'Average Increase',
      value: increaseCount > 0 ? `$${(totalIncrease / increaseCount).toFixed(2)}` : 'N/A'
    },
    {
      metric: 'Average Decrease',
      value: decreaseCount > 0 ? `$${(totalDecrease / decreaseCount).toFixed(2)}` : 'N/A'
    }
  ];
  
  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(summaryData);
  
  // Apply column widths
  const wscols = [
    { wch: 20 }, // Metric
    { wch: 15 }, // Value
  ];
  
  worksheet['!cols'] = wscols;
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Price Update Summary');
  
  // Add detailed updates sheet
  const detailsWorksheet = XLSX.utils.json_to_sheet(priceUpdates.map(update => ({
    'Product Name': update.productName,
    'Category': update.category,
    'Old Price': update.currentPrice,
    'New Price': update.newPrice,
    'Difference': update.newPrice - update.currentPrice,
    'Change %': `${(((update.newPrice - update.currentPrice) / update.currentPrice) * 100).toFixed(2)}%`
  })));
  
  XLSX.utils.book_append_sheet(workbook, detailsWorksheet, 'Detailed Updates');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Save file
  saveAs(blob, `price_update_summary_${new Date().toISOString().split('T')[0]}.xlsx`);
};