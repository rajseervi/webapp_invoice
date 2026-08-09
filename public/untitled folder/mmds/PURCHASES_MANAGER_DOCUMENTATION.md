# Purchases Manager Documentation

## Overview

The Purchases Manager is a comprehensive system for managing purchase orders, suppliers, and inventory procurement. It integrates seamlessly with the stock management system to automatically update inventory levels when purchases are received.

## Key Features

### ✅ **Purchase Order Management**
- **Create Purchase Orders**: Generate detailed purchase orders with multiple items
- **Order Tracking**: Track order status from draft to received
- **Approval Workflow**: Support for draft, pending, approved, and received statuses
- **Automatic Stock Updates**: Update inventory when orders are received

### ✅ **Supplier Management**
- **Supplier Database**: Maintain comprehensive supplier information
- **Contact Management**: Store contact details, payment terms, and credit limits
- **GSTIN Validation**: Validate GST identification numbers
- **Active/Inactive Status**: Manage supplier availability

### ✅ **Inventory Integration**
- **Automatic Stock Updates**: Increase stock levels when purchases are received
- **Stock Movement Tracking**: Complete audit trail of stock changes
- **Product Integration**: Seamless integration with existing product catalog
- **Receiving Process**: Detailed receiving workflow with condition tracking

### ✅ **Analytics & Reporting**
- **Purchase Statistics**: Comprehensive purchase analytics
- **Supplier Performance**: Track top suppliers and order volumes
- **Monthly Trends**: Monitor purchasing patterns over time
- **Cost Analysis**: Track total purchase amounts and average order values

## System Architecture

### Core Components

#### 1. **Purchase Service** (`/src/services/purchaseService.ts`)
- Purchase order CRUD operations
- Stock integration for automatic updates
- Order status management
- Purchase statistics and analytics

#### 2. **Supplier Service** (`/src/services/supplierService.ts`)
- Supplier management operations
- Data validation and verification
- Search and filtering capabilities
- Supplier statistics

#### 3. **Enhanced Stock Integration**
- Automatic stock updates on purchase receipt
- Stock movement tracking
- Inventory audit trails
- Error handling and rollback

### Data Models

#### Purchase Order
```typescript
interface PurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  totalGstAmount: number;
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
  stockUpdated: boolean;
  // ... additional fields
}
```

#### Supplier
```typescript
interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  contactPerson?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive: boolean;
  // ... additional fields
}
```

#### Purchase Item
```typescript
interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  gstRate?: number;
  gstAmount?: number;
  finalAmount: number;
  // ... additional fields
}
```

## User Interface Components

### 1. **Main Purchases Page** (`/src/app/purchases/page.tsx`)
- **Dashboard Overview**: Statistics cards showing key metrics
- **Tabbed Interface**: Separate tabs for orders, suppliers, and analytics
- **Quick Actions**: Easy access to create new orders and suppliers

### 2. **Purchase Orders List** (`/src/app/purchases/components/PurchaseOrdersList.tsx`)
- **Filterable Table**: Filter by status, payment status, supplier
- **Search Functionality**: Search across order numbers and suppliers
- **Action Buttons**: View, edit, receive, and delete orders
- **Status Indicators**: Visual status chips for quick identification

### 3. **Suppliers List** (`/src/app/purchases/components/SuppliersList.tsx`)
- **Supplier Directory**: Complete list of all suppliers
- **Search & Filter**: Find suppliers quickly
- **Status Management**: Activate/deactivate suppliers
- **Quick Actions**: Edit and delete suppliers

### 4. **New Purchase Order Form** (`/src/app/purchases/new/page.tsx`)
- **Supplier Selection**: Choose from active suppliers
- **Product Selection**: Add products from catalog
- **Dynamic Calculations**: Real-time total calculations
- **GST Handling**: Automatic GST calculations
- **Additional Charges**: Support for shipping and other charges

### 5. **Supplier Creation Form** (`/src/app/purchases/suppliers/new/page.tsx`)
- **Comprehensive Form**: All supplier details in one place
- **Validation**: Real-time validation for email, phone, GSTIN
- **Credit Management**: Set credit limits and payment terms

### 6. **Purchase Receiving** (`/src/app/purchases/[id]/receive/page.tsx`)
- **Item-by-Item Receiving**: Receive each item individually
- **Condition Tracking**: Mark items as good, damaged, or partial
- **Quantity Validation**: Ensure received quantities don't exceed ordered
- **Automatic Stock Updates**: Update inventory upon receiving

## Workflow Examples

### Creating a Purchase Order

1. **Navigate to Purchases**
   ```
   /purchases → New Purchase Order
   ```

2. **Fill Order Details**
   - Select supplier from dropdown
   - Set order date and status
   - Add purchase order number (auto-generated)

3. **Add Items**
   - Select products from catalog
   - Set quantities and verify prices
   - Add descriptions if needed
   - System calculates GST and totals

4. **Review and Submit**
   - Review all details and totals
   - Add notes and terms if needed
   - Submit order

### Receiving a Purchase Order

1. **Find Approved Order**
   ```
   /purchases → Find order with "Approved" status
   ```

2. **Start Receiving Process**
   - Click "Receive" button
   - Review order details

3. **Receive Items**
   - Set received quantity for each item
   - Mark condition (good/damaged/partial)
   - Add notes for any issues

4. **Complete Receiving**
   - Review received quantities and values
   - Submit to update stock automatically

### Managing Suppliers

1. **Add New Supplier**
   ```
   /purchases → Suppliers tab → Add Supplier
   ```

2. **Fill Supplier Information**
   - Basic details (name, contact person)
   - Contact information (email, phone, address)
   - Tax information (GSTIN)
   - Payment terms and credit limit

3. **Activate Supplier**
   - Set as active to make available for orders
   - Suppliers can be deactivated without deletion

## Integration with Stock Management

### Automatic Stock Updates

When a purchase order is received:

1. **Stock Validation**
   - Verify all products exist in catalog
   - Check for any data inconsistencies

2. **Stock Movement Creation**
   - Create stock movement records for audit trail
   - Record movement type as 'in' (stock increase)
   - Link movements to purchase order

3. **Inventory Update**
   - Increase product quantities by received amounts
   - Update both `quantity` and `stock` fields for compatibility
   - Use Firestore transactions for data consistency

4. **Error Handling**
   - Rollback changes if any step fails
   - Provide detailed error messages
   - Maintain data integrity

### Stock Movement Tracking

Every purchase creates detailed movement records:

```typescript
{
  productId: "prod123",
  productName: "Sample Product",
  movementType: "in",
  quantity: 50,
  previousQuantity: 100,
  newQuantity: 150,
  reason: "Purchase - PO-2024-001",
  referenceType: "purchase",
  referenceId: "po123",
  referenceNumber: "PO-2024-001",
  createdAt: "2024-01-15T10:30:00Z",
  userId: "user123"
}
```

## API Reference

### Purchase Service Methods

#### `createPurchaseOrder(purchaseData, updateStock)`
Creates a new purchase order with optional stock updates.

**Parameters:**
- `purchaseData`: Purchase order data
- `updateStock`: Boolean to enable automatic stock updates

**Returns:** `PurchaseResult` with success status and details

#### `receivePurchaseOrder(orderId, receivedItems, userId)`
Processes purchase order receiving and updates stock.

**Parameters:**
- `orderId`: Purchase order ID
- `receivedItems`: Array of received item details
- `userId`: User performing the operation

**Returns:** `PurchaseResult` with stock update details

#### `getPurchaseStatistics(userId, dateFrom, dateTo)`
Retrieves comprehensive purchase statistics.

**Parameters:**
- `userId`: Optional user filter
- `dateFrom`: Optional start date filter
- `dateTo`: Optional end date filter

**Returns:** `PurchaseStatistics` object

### Supplier Service Methods

#### `createSupplier(supplierData)`
Creates a new supplier record.

**Parameters:**
- `supplierData`: Supplier information

**Returns:** Supplier ID string

#### `getActiveSuppliers(userId)`
Retrieves all active suppliers for a user.

**Parameters:**
- `userId`: Optional user filter

**Returns:** Array of active suppliers

#### `validateSupplierData(supplierData)`
Validates supplier data before creation/update.

**Parameters:**
- `supplierData`: Supplier data to validate

**Returns:** Validation result with errors if any

## Security & Permissions

### Data Access Control
- **User-based filtering**: Users only see their own data
- **Role-based access**: Different permissions for different user roles
- **Secure operations**: All database operations use proper authentication

### Data Validation
- **Input sanitization**: All user inputs are validated and sanitized
- **Business rule enforcement**: Enforce business logic at service level
- **Error handling**: Comprehensive error handling with user-friendly messages

## Performance Considerations

### Database Optimization
- **Indexed queries**: Proper indexing for fast searches
- **Pagination**: Large datasets are paginated for performance
- **Batch operations**: Multiple updates use batch operations

### Caching Strategy
- **Supplier caching**: Frequently accessed suppliers are cached
- **Product integration**: Leverage existing product caching
- **Real-time updates**: Balance between real-time data and performance

## Error Handling

### Common Error Scenarios

1. **Supplier Not Found**
   ```typescript
   {
     success: false,
     errors: ["Supplier not found"]
   }
   ```

2. **Stock Update Failure**
   ```typescript
   {
     success: false,
     errors: ["Failed to update stock for Product A"],
     warnings: ["Purchase order created but stock update failed"]
   }
   ```

3. **Validation Errors**
   ```typescript
   {
     success: false,
     errors: ["Invalid GSTIN format", "Email is required"]
   }
   ```

### Error Recovery
- **Graceful degradation**: System continues to function even if some features fail
- **User feedback**: Clear error messages help users understand issues
- **Retry mechanisms**: Automatic retry for transient failures

## Best Practices

### 1. **Data Consistency**
- Always use transactions for multi-step operations
- Validate data at multiple levels (client, service, database)
- Implement proper error handling and rollback mechanisms

### 2. **User Experience**
- Provide real-time feedback during operations
- Use loading states and progress indicators
- Implement proper form validation with helpful messages

### 3. **Performance**
- Implement pagination for large datasets
- Use efficient queries with proper indexing
- Cache frequently accessed data

### 4. **Security**
- Validate all user inputs
- Implement proper authentication and authorization
- Use secure communication protocols

## Future Enhancements

### Planned Features

1. **Advanced Workflows**
   - Multi-level approval processes
   - Automated reordering based on stock levels
   - Integration with accounting systems

2. **Enhanced Analytics**
   - Supplier performance metrics
   - Cost analysis and trends
   - Predictive analytics for purchasing

3. **Mobile Support**
   - Mobile app for purchase order management
   - Barcode scanning for receiving
   - Push notifications for order updates

4. **Integration Capabilities**
   - ERP system integration
   - Supplier portal for direct communication
   - API for third-party integrations

### Technical Improvements

1. **Performance Optimization**
   - Advanced caching strategies
   - Database query optimization
   - Real-time data synchronization

2. **Enhanced Security**
   - Advanced audit logging
   - Role-based permissions
   - Data encryption at rest

3. **Scalability**
   - Microservices architecture
   - Cloud-native deployment
   - Auto-scaling capabilities

## Troubleshooting

### Common Issues

1. **Purchase Order Not Creating**
   - Check supplier selection
   - Verify all required fields are filled
   - Ensure products are selected with valid quantities

2. **Stock Not Updating**
   - Verify purchase order status is "received"
   - Check product IDs are valid
   - Review error logs for specific issues

3. **Supplier Validation Errors**
   - Verify GSTIN format (15 characters)
   - Check email format
   - Ensure required fields are not empty

### Debug Steps

1. **Check Browser Console**
   - Look for JavaScript errors
   - Review network requests and responses

2. **Review Service Logs**
   - Check for service-level errors
   - Verify database connection status

3. **Validate Data**
   - Ensure all required data is present
   - Check data format and types

## Conclusion

The Purchases Manager provides a comprehensive solution for procurement and supplier management. It integrates seamlessly with the existing inventory system to provide automatic stock updates and complete audit trails. The system is designed to be user-friendly, secure, and scalable to meet growing business needs.

For additional support or questions, refer to the service documentation or contact the development team.