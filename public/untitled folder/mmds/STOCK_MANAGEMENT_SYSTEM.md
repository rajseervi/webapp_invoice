# Enhanced Stock Management System

## Overview

This document describes the comprehensive stock management system that automatically handles inventory updates when invoices are created, edited, or deleted. The system ensures accurate stock tracking and provides detailed audit trails for all stock movements.

## Key Features

### ✅ **Automatic Stock Updates**
- **Invoice Creation**: Automatically reduces stock for sales invoices, increases for purchase invoices
- **Invoice Editing**: Reverts original stock changes and applies new ones
- **Invoice Deletion**: Reverts all stock changes made by the invoice

### ✅ **Stock Validation**
- **Pre-sale Validation**: Checks stock availability before creating sales invoices
- **Insufficient Stock Prevention**: Prevents overselling with clear error messages
- **Low Stock Warnings**: Alerts when stock will fall below minimum levels

### ✅ **Comprehensive Audit Trail**
- **Stock Movements**: Detailed records of all stock changes
- **Reference Tracking**: Links stock movements to specific invoices
- **User Attribution**: Tracks who made each stock change
- **Timestamp Logging**: Records exact time of each movement

### ✅ **Advanced Features**
- **Transaction Safety**: Uses Firestore transactions for data consistency
- **Error Handling**: Graceful handling of failures with detailed error messages
- **Batch Operations**: Efficient processing of multiple items
- **Stock Alerts**: Automatic alerts for low stock, out of stock, and overstock situations

## System Architecture

### Core Services

#### 1. **EnhancedStockService** (`/src/services/enhancedStockService.ts`)
- Core stock management functionality
- Stock validation and movement tracking
- Low stock and out of stock detection
- Manual stock adjustments

#### 2. **InvoiceWithStockService** (`/src/services/invoiceWithStockService.ts`)
- Invoice-specific stock management
- Integration with invoice lifecycle
- Stock impact analysis
- Multi-invoice validation

#### 3. **StockMovement Interface**
```typescript
interface StockMovement {
  id?: string;
  productId: string;
  productName: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceType: 'invoice' | 'purchase' | 'adjustment' | 'return' | 'transfer';
  referenceId: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  userId?: string;
}
```

## Implementation Details

### Invoice Creation with Stock Management

```typescript
// Example: Creating an invoice with automatic stock updates
const createResult = await InvoiceWithStockService.createInvoiceWithStock(
  invoiceData,
  true, // validateStock
  true  // updateStock
);

if (!createResult.success) {
  // Handle validation errors (e.g., insufficient stock)
  console.error(createResult.errors);
} else {
  // Invoice created successfully with stock updated
  console.log('Invoice created:', createResult.invoiceId);
}
```

### Stock Validation Process

1. **Pre-validation**: Check if all products exist
2. **Availability Check**: Verify sufficient stock for each item
3. **Warning Generation**: Alert for low stock situations
4. **Error Reporting**: Detailed messages for insufficient stock

### Stock Movement Tracking

Every stock change creates a movement record with:
- **Product Information**: ID, name, category
- **Movement Details**: Type, quantity, before/after amounts
- **Reference Data**: Invoice number, transaction type
- **Audit Information**: User, timestamp, reason

### Transaction Safety

The system uses Firestore transactions to ensure:
- **Atomicity**: All stock updates succeed or fail together
- **Consistency**: Stock levels remain accurate
- **Isolation**: Concurrent operations don't interfere
- **Durability**: Changes are permanently recorded

## Usage Examples

### 1. Creating an Invoice with Stock Validation

```typescript
const invoiceData = {
  invoiceNumber: 'INV-001',
  type: 'sales',
  items: [
    { productId: 'prod1', quantity: 5, name: 'Product 1' },
    { productId: 'prod2', quantity: 3, name: 'Product 2' }
  ],
  // ... other invoice data
};

const result = await InvoiceWithStockService.createInvoiceWithStock(
  invoiceData,
  true, // Validate stock availability
  true  // Update stock automatically
);

if (result.success) {
  console.log('Invoice created successfully');
  if (result.warnings?.length > 0) {
    console.warn('Warnings:', result.warnings);
  }
} else {
  console.error('Failed to create invoice:', result.errors);
}
```

### 2. Updating an Invoice with Stock Adjustments

```typescript
const updateResult = await InvoiceWithStockService.updateInvoiceWithStock(
  invoiceId,
  updatedInvoiceData,
  true // Adjust stock for changes
);

if (updateResult.success) {
  console.log('Invoice updated with stock adjustments');
} else {
  console.error('Update failed:', updateResult.errors);
}
```

### 3. Deleting an Invoice with Stock Reversion

```typescript
const deleteResult = await InvoiceWithStockService.deleteInvoiceWithStock(
  invoiceId,
  true // Revert stock changes
);

if (deleteResult.success) {
  console.log('Invoice deleted and stock reverted');
  if (deleteResult.stockRevertResult?.processedItems > 0) {
    console.log(`Stock reverted for ${deleteResult.stockRevertResult.processedItems} items`);
  }
} else {
  console.error('Deletion failed:', deleteResult.errors);
}
```

### 4. Manual Stock Adjustment

```typescript
const adjustResult = await EnhancedStockService.adjustStock(
  productId,
  newQuantity,
  'Manual adjustment - inventory count',
  userId,
  'Correcting stock after physical count'
);

if (adjustResult.success) {
  console.log('Stock adjusted successfully');
} else {
  console.error('Adjustment failed:', adjustResult.errors);
}
```

## Stock Alerts and Monitoring

### Alert Types

1. **Low Stock**: When quantity falls below minimum level
2. **Out of Stock**: When quantity reaches zero
3. **Overstock**: When quantity exceeds maximum level
4. **Negative Stock**: When quantity goes below zero (error condition)

### Getting Stock Alerts

```typescript
const alerts = await EnhancedStockService.getStockAlerts(true); // Active alerts only
alerts.forEach(alert => {
  console.log(`${alert.alertType}: ${alert.productName} - ${alert.message}`);
});
```

### Stock Summary Dashboard

```typescript
const summary = await EnhancedStockService.getStockSummary();
console.log(`Total Products: ${summary.totalProducts}`);
console.log(`Total Stock Value: ₹${summary.totalStockValue}`);
console.log(`Low Stock Products: ${summary.lowStockCount}`);
console.log(`Out of Stock Products: ${summary.outOfStockCount}`);
```

## Error Handling

### Common Error Scenarios

1. **Insufficient Stock**
   - Error: "Insufficient stock. Available: 5, Required: 10"
   - Action: Prevent invoice creation, suggest reducing quantity

2. **Product Not Found**
   - Error: "Product not found"
   - Action: Remove invalid items or update product references

3. **Concurrent Updates**
   - Error: "Stock update conflict"
   - Action: Retry operation with latest stock data

4. **Network Issues**
   - Error: "Connection timeout"
   - Action: Retry with exponential backoff

### Error Response Format

```typescript
interface StockUpdateResult {
  success: boolean;
  processedItems: number;
  errors: Array<{
    productId: string;
    productName: string;
    error: string;
  }>;
  movements: StockMovement[];
}
```

## Best Practices

### 1. **Always Validate Before Creating Sales Invoices**
```typescript
// Good: Validate stock before creating invoice
const validation = await EnhancedStockService.validateStockForInvoice(items, 'sales');
if (!validation.isValid) {
  // Show errors to user
  return;
}
```

### 2. **Handle Warnings Appropriately**
```typescript
// Show warnings but allow user to proceed
if (result.warnings?.length > 0) {
  showWarningDialog(result.warnings);
}
```

### 3. **Provide Clear Error Messages**
```typescript
// Transform technical errors into user-friendly messages
const userMessage = result.errors?.map(error => 
  `${error.productName}: ${error.message}`
).join('\n');
```

### 4. **Monitor Stock Levels Regularly**
```typescript
// Check for low stock alerts daily
const lowStockProducts = await EnhancedStockService.getLowStockProducts();
if (lowStockProducts.length > 0) {
  sendLowStockNotification(lowStockProducts);
}
```

## Database Schema

### Products Collection
```typescript
{
  id: string;
  name: string;
  quantity: number; // Current stock level
  stock: number; // Backup field for compatibility
  minStockLevel?: number; // Reorder point
  maxStockLevel?: number; // Maximum stock level
  reorderPoint?: number; // Alternative to minStockLevel
  price: number;
  category: string;
  // ... other product fields
}
```

### Stock Movements Collection
```typescript
{
  id: string;
  productId: string;
  productName: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceType: 'invoice' | 'purchase' | 'adjustment';
  referenceId: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  userId?: string;
}
```

### Invoices Collection (Stock-related fields)
```typescript
{
  id: string;
  stockUpdated: boolean; // Whether stock has been updated
  items: Array<{
    productId: string;
    quantity: number;
    // ... other item fields
  }>;
  // ... other invoice fields
}
```

## Performance Considerations

### 1. **Batch Operations**
- Process multiple stock updates in single transaction
- Reduce database round trips

### 2. **Indexing**
- Index on `productId` for stock movements
- Index on `referenceId` for invoice lookups
- Index on `createdAt` for chronological queries

### 3. **Caching**
- Cache frequently accessed product data
- Use local state for real-time stock updates

### 4. **Pagination**
- Paginate stock movement history
- Limit query results for large datasets

## Security Considerations

### 1. **User Permissions**
- Validate user permissions before stock operations
- Log all stock changes with user attribution

### 2. **Data Validation**
- Validate all input data before processing
- Prevent negative stock unless explicitly allowed

### 3. **Audit Trail**
- Maintain complete audit trail for compliance
- Include user context in all operations

## Future Enhancements

### 1. **Advanced Features**
- **Batch Stock Import**: Import stock levels from CSV/Excel
- **Stock Forecasting**: Predict future stock needs
- **Supplier Integration**: Automatic reordering from suppliers
- **Barcode Scanning**: Mobile stock management with barcode support

### 2. **Reporting**
- **Stock Movement Reports**: Detailed movement history
- **Stock Valuation Reports**: Current stock value analysis
- **Turnover Analysis**: Product movement velocity
- **Variance Reports**: Differences between expected and actual stock

### 3. **Notifications**
- **Email Alerts**: Automated low stock notifications
- **SMS Alerts**: Critical stock level warnings
- **Dashboard Widgets**: Real-time stock status display

## Troubleshooting

### Common Issues and Solutions

1. **Stock Levels Don't Match**
   - Check stock movement history
   - Verify all invoices have `stockUpdated: true`
   - Run stock reconciliation process

2. **Negative Stock Levels**
   - Identify source of negative stock
   - Use manual adjustment to correct
   - Review validation logic

3. **Missing Stock Movements**
   - Check for failed transactions
   - Verify error handling in invoice processing
   - Manually create missing movements if needed

4. **Performance Issues**
   - Review database indexes
   - Optimize query patterns
   - Consider data archiving for old movements

## Conclusion

The Enhanced Stock Management System provides a robust, reliable, and comprehensive solution for inventory tracking in the invoice management application. It ensures data consistency, provides detailed audit trails, and offers advanced features for modern business needs.

The system is designed to be:
- **Reliable**: Uses transactions for data consistency
- **Scalable**: Handles large volumes of stock movements
- **Maintainable**: Clean, well-documented code structure
- **Extensible**: Easy to add new features and integrations

For support or questions about the stock management system, refer to the service documentation or contact the development team.