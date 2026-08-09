import * as XLSX from 'xlsx';
import { Product } from '@/types/inventory';

export interface ExcelImportResult {
  success: boolean;
  data: any[];
  errors: string[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface ExcelExportOptions {
  includeHeaders?: boolean;
  sheetName?: string;
  filename?: string;
  includeMetadata?: boolean;
}

export class ExcelService {
  /**
   * Read and parse Excel file
   */
  static async readExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          
          if (!sheetName) {
            reject(new Error('No sheets found in the Excel file'));
            return;
          }

          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Failed to read Excel file. Please ensure it\'s a valid Excel file.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Validate product data from Excel
   */
  static validateProductData(data: any[]): ExcelImportResult {
    const errors: string[] = [];
    const validData: any[] = [];
    
    data.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row number (accounting for header)
      const rowErrors: string[] = [];
      
      // Required field validation
      if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
        rowErrors.push(`Row ${rowNumber}: Product name is required and must be text`);
      }

      if (!row.categoryId && !row.categoryName) {
        rowErrors.push(`Row ${rowNumber}: Either categoryId or categoryName is required`);
      }

      if (typeof row.price !== 'number' || row.price < 0) {
        rowErrors.push(`Row ${rowNumber}: Valid price (number >= 0) is required`);
      }

      if (typeof row.quantity !== 'number' || row.quantity < 0) {
        rowErrors.push(`Row ${rowNumber}: Valid quantity (number >= 0) is required`);
      }

      // GST validation
      if (!row.gstExempt) {
        if (typeof row.gstRate !== 'number' || row.gstRate < 0 || row.gstRate > 100) {
          rowErrors.push(`Row ${rowNumber}: Valid GST rate (0-100) is required for non-exempt products`);
        }

        // HSN/SAC validation
        if (row.isService && !row.sacCode) {
          rowErrors.push(`Row ${rowNumber}: SAC code is required for services`);
        }
        if (!row.isService && !row.hsnCode) {
          rowErrors.push(`Row ${rowNumber}: HSN code is required for goods`);
        }
      }

      // Unit of measurement validation
      if (row.unitOfMeasurement && typeof row.unitOfMeasurement !== 'string') {
        rowErrors.push(`Row ${rowNumber}: Unit of measurement must be text`);
      }

      // Reorder point validation
      if (row.reorderPoint !== undefined && (typeof row.reorderPoint !== 'number' || row.reorderPoint < 0)) {
        rowErrors.push(`Row ${rowNumber}: Reorder point must be a number >= 0`);
      }

      // Cess rate validation
      if (row.cessRate !== undefined && (typeof row.cessRate !== 'number' || row.cessRate < 0 || row.cessRate > 100)) {
        rowErrors.push(`Row ${rowNumber}: Cess rate must be a number between 0-100`);
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        // Transform and clean data
        const cleanedProduct = {
          name: String(row.name).trim(),
          categoryId: row.categoryId ? String(row.categoryId).trim() : undefined,
          categoryName: row.categoryName ? String(row.categoryName).trim() : undefined,
          price: Number(row.price),
          quantity: Number(row.quantity),
          description: row.description ? String(row.description).trim() : '',
          reorderPoint: row.reorderPoint ? Number(row.reorderPoint) : 10,
          isActive: row.isActive !== false, // Default to true
          gstRate: row.gstRate ? Number(row.gstRate) : 18,
          hsnCode: row.hsnCode ? String(row.hsnCode).trim() : '',
          sacCode: row.sacCode ? String(row.sacCode).trim() : '',
          isService: Boolean(row.isService),
          gstExempt: Boolean(row.gstExempt),
          cessRate: row.cessRate ? Number(row.cessRate) : 0,
          unitOfMeasurement: row.unitOfMeasurement ? String(row.unitOfMeasurement).trim() : 'PCS'
        };

        validData.push(cleanedProduct);
      }
    });

    return {
      success: errors.length === 0,
      data: validData,
      errors,
      totalRows: data.length,
      validRows: validData.length,
      invalidRows: errors.length
    };
  }

  /**
   * Export products to Excel
   */
  static exportProductsToExcel(
    products: Product[], 
    options: ExcelExportOptions = {}
  ): void {
    const {
      includeHeaders = true,
      sheetName = 'Products',
      filename = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`,
      includeMetadata = true
    } = options;

    // Prepare export data
    const exportData = products.map(product => ({
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      categoryName: product.categoryName || '',
      price: product.price,
      quantity: product.quantity,
      description: product.description || '',
      reorderPoint: product.reorderPoint || 10,
      isActive: product.isActive,
      gstRate: product.gstRate || 0,
      hsnCode: product.hsnCode || '',
      sacCode: product.sacCode || '',
      isService: product.isService || false,
      gstExempt: product.gstExempt || false,
      cessRate: product.cessRate || 0,
      unitOfMeasurement: product.unitOfMeasurement || 'PCS',
      ...(includeMetadata && {
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      })
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Add metadata sheet if requested
    if (includeMetadata) {
      const metadata = [
        { Field: 'Export Date', Value: new Date().toISOString() },
        { Field: 'Total Products', Value: products.length },
        { Field: 'Active Products', Value: products.filter(p => p.isActive).length },
        { Field: 'Inactive Products', Value: products.filter(p => !p.isActive).length },
        { Field: 'Services', Value: products.filter(p => p.isService).length },
        { Field: 'Goods', Value: products.filter(p => !p.isService).length },
        { Field: 'GST Exempt', Value: products.filter(p => p.gstExempt).length }
      ];

      const metadataSheet = XLSX.utils.json_to_sheet(metadata);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Export Info');
    }

    // Download file
    XLSX.writeFile(workbook, filename);
  }

  /**
   * Create import template
   */
  static createImportTemplate(): void {
    const template = [
      {
        name: 'Sample Product 1',
        categoryId: 'electronics',
        categoryName: 'Electronics',
        price: 1000,
        quantity: 50,
        description: 'Sample product description',
        reorderPoint: 10,
        isActive: true,
        gstRate: 18,
        hsnCode: '8517',
        sacCode: '',
        isService: false,
        gstExempt: false,
        cessRate: 0,
        unitOfMeasurement: 'PCS'
      },
      {
        name: 'Sample Service 1',
        categoryId: 'services',
        categoryName: 'Services',
        price: 5000,
        quantity: 0,
        description: 'Sample service description',
        reorderPoint: 0,
        isActive: true,
        gstRate: 18,
        hsnCode: '',
        sacCode: '998314',
        isService: true,
        gstExempt: false,
        cessRate: 0,
        unitOfMeasurement: 'HOUR'
      },
      {
        name: 'GST Exempt Product',
        categoryId: 'food',
        categoryName: 'Food Items',
        price: 100,
        quantity: 200,
        description: 'GST exempt food item',
        reorderPoint: 20,
        isActive: true,
        gstRate: 0,
        hsnCode: '1006',
        sacCode: '',
        isService: false,
        gstExempt: true,
        cessRate: 0,
        unitOfMeasurement: 'KG'
      }
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Template');

    // Add instructions sheet
    const instructions = [
      { Field: 'name', Required: 'Yes', Description: 'Product name (text)', Example: 'Sample Product 1' },
      { Field: 'categoryId', Required: 'Yes*', Description: 'Category identifier (text)', Example: 'electronics' },
      { Field: 'categoryName', Required: 'Yes*', Description: 'Category name (text)', Example: 'Electronics' },
      { Field: 'price', Required: 'Yes', Description: 'Product price (number)', Example: '1000' },
      { Field: 'quantity', Required: 'Yes', Description: 'Stock quantity (number)', Example: '50' },
      { Field: 'description', Required: 'No', Description: 'Product description (text)', Example: 'Sample description' },
      { Field: 'reorderPoint', Required: 'No', Description: 'Reorder threshold (number)', Example: '10' },
      { Field: 'isActive', Required: 'No', Description: 'Product status (true/false)', Example: 'true' },
      { Field: 'gstRate', Required: 'Yes**', Description: 'GST percentage (0-100)', Example: '18' },
      { Field: 'hsnCode', Required: 'Yes***', Description: 'HSN code for goods', Example: '8517' },
      { Field: 'sacCode', Required: 'Yes****', Description: 'SAC code for services', Example: '998314' },
      { Field: 'isService', Required: 'No', Description: 'Service type (true/false)', Example: 'false' },
      { Field: 'gstExempt', Required: 'No', Description: 'GST exemption (true/false)', Example: 'false' },
      { Field: 'cessRate', Required: 'No', Description: 'Cess percentage (number)', Example: '0' },
      { Field: 'unitOfMeasurement', Required: 'No', Description: 'Unit of measurement', Example: 'PCS' }
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Add notes sheet
    const notes = [
      { Note: '* Either categoryId OR categoryName is required' },
      { Note: '** gstRate is required unless gstExempt is true' },
      { Note: '*** hsnCode is required for goods (isService = false)' },
      { Note: '**** sacCode is required for services (isService = true)' },
      { Note: '' },
      { Note: 'Default values:' },
      { Note: '- reorderPoint: 10' },
      { Note: '- isActive: true' },
      { Note: '- gstRate: 18' },
      { Note: '- isService: false' },
      { Note: '- gstExempt: false' },
      { Note: '- cessRate: 0' },
      { Note: '- unitOfMeasurement: PCS' }
    ];

    const notesSheet = XLSX.utils.json_to_sheet(notes);
    XLSX.utils.book_append_sheet(workbook, notesSheet, 'Notes');

    XLSX.writeFile(workbook, 'product_import_template.xlsx');
  }

  /**
   * Create bulk update template with existing products
   */
  static createBulkUpdateTemplate(existingProducts: Product[] = []): void {
    let template;

    if (existingProducts.length > 0) {
      template = existingProducts.slice(0, 10).map(product => ({
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        categoryName: product.categoryName || '',
        price: product.price,
        quantity: product.quantity,
        description: product.description || '',
        reorderPoint: product.reorderPoint || 10,
        isActive: product.isActive,
        gstRate: product.gstRate || 0,
        hsnCode: product.hsnCode || '',
        sacCode: product.sacCode || '',
        isService: product.isService || false,
        gstExempt: product.gstExempt || false,
        cessRate: product.cessRate || 0,
        unitOfMeasurement: product.unitOfMeasurement || 'PCS'
      }));
    } else {
      template = [
        {
          id: 'SAMPLE_ID_1',
          name: 'Sample Product 1',
          categoryId: 'electronics',
          categoryName: 'Electronics',
          price: 1000,
          quantity: 50,
          description: 'Sample product for bulk update',
          reorderPoint: 10,
          isActive: true,
          gstRate: 18,
          hsnCode: '8517',
          sacCode: '',
          isService: false,
          gstExempt: false,
          cessRate: 0,
          unitOfMeasurement: 'PCS'
        }
      ];
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bulk Update Template');

    // Add instructions
    const instructions = [
      { Instruction: 'BULK UPDATE INSTRUCTIONS' },
      { Instruction: '' },
      { Instruction: '1. Keep the "id" column to update existing products' },
      { Instruction: '2. Remove the "id" column or leave it empty to create new products (upsert mode)' },
      { Instruction: '3. Only modify the fields you want to update' },
      { Instruction: '4. Leave fields empty to keep existing values' },
      { Instruction: '5. Upload this file using the bulk update feature' },
      { Instruction: '' },
      { Instruction: 'IMPORTANT NOTES:' },
      { Instruction: '- ID field is used to identify existing products' },
      { Instruction: '- If ID is not found, product will be created (in upsert mode)' },
      { Instruction: '- Price and quantity must be valid numbers' },
      { Instruction: '- GST rate must be between 0-100' },
      { Instruction: '- HSN code required for goods, SAC code for services' }
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    XLSX.writeFile(workbook, 'bulk_update_template.xlsx');
  }

  /**
   * Validate bulk update data
   */
  static validateBulkUpdateData(data: any[]): ExcelImportResult {
    const errors: string[] = [];
    const validData: any[] = [];
    
    data.forEach((row, index) => {
      const rowNumber = index + 2;
      const rowErrors: string[] = [];
      
      // ID validation for updates
      if (row.id && typeof row.id !== 'string') {
        rowErrors.push(`Row ${rowNumber}: Product ID must be text`);
      }

      // If no ID, validate required fields for new products
      if (!row.id) {
        if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
          rowErrors.push(`Row ${rowNumber}: Product name is required for new products`);
        }
        if (typeof row.price !== 'number' || row.price < 0) {
          rowErrors.push(`Row ${rowNumber}: Valid price is required for new products`);
        }
        if (typeof row.quantity !== 'number' || row.quantity < 0) {
          rowErrors.push(`Row ${rowNumber}: Valid quantity is required for new products`);
        }
      }

      // Validate fields that are provided
      if (row.price !== undefined && (typeof row.price !== 'number' || row.price < 0)) {
        rowErrors.push(`Row ${rowNumber}: Price must be a valid number >= 0`);
      }

      if (row.quantity !== undefined && (typeof row.quantity !== 'number' || row.quantity < 0)) {
        rowErrors.push(`Row ${rowNumber}: Quantity must be a valid number >= 0`);
      }

      if (row.gstRate !== undefined && (typeof row.gstRate !== 'number' || row.gstRate < 0 || row.gstRate > 100)) {
        rowErrors.push(`Row ${rowNumber}: GST rate must be between 0-100`);
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        const cleanedData: any = {};
        
        // Only include fields that are provided
        if (row.id !== undefined) cleanedData.id = String(row.id).trim();
        if (row.name !== undefined) cleanedData.name = String(row.name).trim();
        if (row.categoryId !== undefined) cleanedData.categoryId = String(row.categoryId).trim();
        if (row.categoryName !== undefined) cleanedData.categoryName = String(row.categoryName).trim();
        if (row.price !== undefined) cleanedData.price = Number(row.price);
        if (row.quantity !== undefined) cleanedData.quantity = Number(row.quantity);
        if (row.description !== undefined) cleanedData.description = String(row.description).trim();
        if (row.reorderPoint !== undefined) cleanedData.reorderPoint = Number(row.reorderPoint);
        if (row.isActive !== undefined) cleanedData.isActive = Boolean(row.isActive);
        if (row.gstRate !== undefined) cleanedData.gstRate = Number(row.gstRate);
        if (row.hsnCode !== undefined) cleanedData.hsnCode = String(row.hsnCode).trim();
        if (row.sacCode !== undefined) cleanedData.sacCode = String(row.sacCode).trim();
        if (row.isService !== undefined) cleanedData.isService = Boolean(row.isService);
        if (row.gstExempt !== undefined) cleanedData.gstExempt = Boolean(row.gstExempt);
        if (row.cessRate !== undefined) cleanedData.cessRate = Number(row.cessRate);
        if (row.unitOfMeasurement !== undefined) cleanedData.unitOfMeasurement = String(row.unitOfMeasurement).trim();

        validData.push(cleanedData);
      }
    });

    return {
      success: errors.length === 0,
      data: validData,
      errors,
      totalRows: data.length,
      validRows: validData.length,
      invalidRows: errors.length
    };
  }
}

export default ExcelService;