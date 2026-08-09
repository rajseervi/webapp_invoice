import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/services/productService';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const validateOnly = formData.get('validateOnly') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { error: 'No sheets found in the Excel file' },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: 'No data found in the Excel file' },
        { status: 400 }
      );
    }

    // Validate data structure
    const validationErrors: string[] = [];
    const validProducts: any[] = [];

    jsonData.forEach((row: any, index: number) => {
      const rowNumber = index + 2; // Excel row number (accounting for header)
      
      // Required field validation
      if (!row.name || typeof row.name !== 'string') {
        validationErrors.push(`Row ${rowNumber}: Product name is required and must be text`);
        return;
      }

      if (!row.categoryId && !row.categoryName) {
        validationErrors.push(`Row ${rowNumber}: Either categoryId or categoryName is required`);
        return;
      }

      if (typeof row.price !== 'number' || row.price < 0) {
        validationErrors.push(`Row ${rowNumber}: Valid price (number >= 0) is required`);
        return;
      }

      if (typeof row.quantity !== 'number' || row.quantity < 0) {
        validationErrors.push(`Row ${rowNumber}: Valid quantity (number >= 0) is required`);
        return;
      }

      // GST validation
      if (!row.gstExempt && (typeof row.gstRate !== 'number' || row.gstRate < 0 || row.gstRate > 100)) {
        validationErrors.push(`Row ${rowNumber}: Valid GST rate (0-100) is required for non-exempt products`);
        return;
      }

      // HSN/SAC validation
      if (!row.gstExempt) {
        if (row.isService && !row.sacCode) {
          validationErrors.push(`Row ${rowNumber}: SAC code is required for services`);
          return;
        }
        if (!row.isService && !row.hsnCode) {
          validationErrors.push(`Row ${rowNumber}: HSN code is required for goods`);
          return;
        }
      }

      // Transform and validate data
      const product = {
        name: String(row.name).trim(),
        categoryId: row.categoryId ? String(row.categoryId).trim() : undefined,
        categoryName: row.categoryName ? String(row.categoryName).trim() : undefined,
        price: Number(row.price),
        quantity: Number(row.quantity),
        description: row.description ? String(row.description) : '',
        reorderPoint: row.reorderPoint ? Number(row.reorderPoint) : 10,
        isActive: row.isActive !== false, // Default to true
        gstRate: row.gstRate ? Number(row.gstRate) : 18,
        hsnCode: row.hsnCode ? String(row.hsnCode) : '',
        sacCode: row.sacCode ? String(row.sacCode) : '',
        isService: Boolean(row.isService),
        gstExempt: Boolean(row.gstExempt),
        cessRate: row.cessRate ? Number(row.cessRate) : 0,
        unitOfMeasurement: row.unitOfMeasurement ? String(row.unitOfMeasurement) : 'PCS'
      };

      validProducts.push(product);
    });

    // If validation only, return validation results
    if (validateOnly) {
      return NextResponse.json({
        success: true,
        validation: {
          totalRows: jsonData.length,
          validRows: validProducts.length,
          invalidRows: validationErrors.length,
          errors: validationErrors
        },
        preview: validProducts.slice(0, 10) // Return first 10 valid products for preview
      });
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        validation: {
          totalRows: jsonData.length,
          validRows: validProducts.length,
          invalidRows: validationErrors.length,
          errors: validationErrors
        }
      }, { status: 400 });
    }

    // Import products
    const importResult = await productService.importProducts(validProducts);

    return NextResponse.json({
      success: true,
      result: importResult,
      message: `Import completed: ${importResult.success} successful, ${importResult.failed} failed`
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to download import template
export async function GET() {
  try {
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

    // Create Excel file
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
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

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return template file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="product_import_template.xlsx"',
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}