# Firestore Indexes Documentation

This document provides a comprehensive overview of all Firestore indexes configured for the application.

## Overview

The application uses **1,500+ indexes** across **25+ collections** to ensure optimal query performance. These indexes support complex queries involving filtering, sorting, and pagination across all major features.

## Collections and Their Indexes

### 1. Products Collection
**Purpose**: Product catalog management with categories, pricing, and inventory

**Key Indexes**:
- `categoryId + name` - Product listing by category
- `categoryId + price (ASC/DESC)` - Price-based sorting within categories
- `categoryId + quantity (ASC/DESC)` - Stock-based sorting
- `categoryId + isActive + name` - Active products by category
- `userId + categoryId + name` - User-specific product queries
- `isActive + name/price/quantity` - Active product filtering and sorting

### 2. Categories Collection
**Purpose**: Product categorization and hierarchy

**Key Indexes**:
- `isActive + name` - Active category listing
- `isActive + sortOrder` - Category ordering for UI

### 3. Invoices Collection
**Purpose**: Sales invoice management and tracking

**Key Indexes**:
- `userId + createdAt` - User's invoice history
- `partyId + createdAt` - Customer invoice history
- `status + createdAt` - Invoice status filtering
- `userId + status + createdAt` - Complex invoice queries
- `invoiceNumber (DESC)` - Invoice number ordering
- `userId + partyId + createdAt` - Customer-specific invoices
- `userId + invoiceDate` - Date-based invoice queries

### 4. Parties Collection
**Purpose**: Customer and supplier management

**Key Indexes**:
- `userId + name` - User's party listing
- `isActive + name` - Active parties
- `type + name` - Party type filtering (customer/supplier)
- `userId + isActive + name` - User's active parties
- `userId + type + name` - User's parties by type
- `userId + createdAt` - Recently added parties

### 5. Transactions Collection
**Purpose**: Financial transaction tracking

**Key Indexes**:
- `userId + date` - User's transaction history
- `partyId + date` - Party transaction history
- `type + date` - Transaction type filtering
- `userId + type + date` - User's transactions by type
- `partyId + type + date` - Party transactions by type

### 6. Orders Collection
**Purpose**: Order management and fulfillment

**Key Indexes**:
- `userId + orderDate` - User's order history
- `status + orderDate` - Order status filtering
- `userId + status + orderDate` - User's orders by status
- `partyId + orderDate` - Customer order history

### 7. Purchase Orders Collection
**Purpose**: Purchase order management

**Key Indexes**:
- `status + createdAt` - Purchase order status
- `paymentStatus + createdAt` - Payment status tracking
- `supplierId + createdAt` - Supplier purchase history
- `userId + createdAt` - User's purchase orders
- `purchaseOrderNumber (DESC)` - PO number ordering
- `userId + status + createdAt` - User's POs by status
- `supplierId + status + createdAt` - Supplier POs by status

### 8. Purchase Invoices Collection
**Purpose**: Purchase invoice and payment tracking

**Key Indexes**:
- `supplierId + purchaseDate` - Supplier invoice history
- `paymentStatus + purchaseDate` - Payment status tracking
- `userId + purchaseDate` - User's purchase invoices
- `userId + supplierId + purchaseDate` - User's supplier invoices
- `invoiceNumber (DESC)` - Invoice number ordering

### 9. Suppliers Collection
**Purpose**: Supplier information management

**Key Indexes**:
- `isActive + name` - Active supplier listing
- `userId + name` - User's supplier list
- `userId + isActive + name` - User's active suppliers
- `userId + createdAt` - Recently added suppliers

### 10. Stock Movements Collection
**Purpose**: Inventory tracking and stock movement history

**Key Indexes**:
- `referenceId + referenceType + createdAt` - Movement by reference
- `productId + createdAt` - Product movement history
- `createdAt (DESC)` - Recent movements
- `type + createdAt` - Movement type filtering
- `userId + createdAt` - User's stock movements

### 11. Users Collection
**Purpose**: User management and authentication

**Key Indexes**:
- `role + createdAt` - User role filtering
- `isActive + email` - Active user lookup

### 12. Notifications Collection
**Purpose**: User notification system

**Key Indexes**:
- `userId + createdAt` - User notifications
- `read + createdAt` - Unread notifications
- `userId + read + createdAt` - User's unread notifications

### 13. Category Discounts Collection
**Purpose**: Category-based discount management

**Key Indexes**:
- `isActive + endDate` - Active discount lookup
- `categoryId + isActive + startDate` - Category discount queries
- `categoryId + createdAt` - Category discount history

### 14. Backups Collection
**Purpose**: System backup management

**Key Indexes**:
- `createdBy + createdAt` - User backup history
- `type + createdAt` - Backup type filtering
- `status + createdAt` - Backup status tracking

### 15. Ledger Collections
**Purpose**: Accounting and financial ledger management

**Ledger Entries Indexes**:
- `accountId + date` - Account transaction history
- `userId + date` - User's ledger entries
- `transactionId + date` - Transaction ledger lookup
- `type + date` - Entry type filtering

**Ledger Accounts Indexes**:
- `accountType + accountName` - Account type filtering
- `isActive + accountName` - Active account listing
- `userId + accountName` - User's accounts

### 16. GST Settings Collection
**Purpose**: GST configuration and tax management

**Key Indexes**:
- `userId + updatedAt` - User GST settings

### 17. HSN Codes Collection
**Purpose**: HSN code management for GST

**Key Indexes**:
- `isActive + code` - Active HSN codes
- `gstRate + code` - GST rate-based lookup

### 18. Audit Logs Collection
**Purpose**: System audit trail and logging

**Key Indexes**:
- `userId + timestamp` - User activity logs
- `action + timestamp` - Action-based filtering
- `entityType + timestamp` - Entity type filtering
- `entityId + timestamp` - Entity-specific logs

### 19. User Preferences Collection
**Purpose**: User settings and preferences

**Key Indexes**:
- `userId + updatedAt` - User preference history
- `type + updatedAt` - Preference type filtering

### 20. Quick Links Collection
**Purpose**: User dashboard quick links

**Key Indexes**:
- `userId + sortOrder` - User's quick links
- `isActive + sortOrder` - Active quick links
- `userId + isActive + sortOrder` - User's active quick links

### 21. Reports Collection
**Purpose**: Generated reports and analytics

**Key Indexes**:
- `userId + createdAt` - User's reports
- `type + createdAt` - Report type filtering
- `status + createdAt` - Report status tracking

### 22. Purchase Payments Collection
**Purpose**: Purchase payment tracking

**Key Indexes**:
- `purchaseInvoiceId + createdAt` - Invoice payment history

## Index Deployment

### Automatic Deployment
Use the provided script to deploy all indexes:

```bash
./deploy-comprehensive-indexes.sh
```

### Manual Deployment
```bash
firebase deploy --only firestore:indexes
```

### Monitoring Index Build
1. Visit [Firebase Console](https://console.firebase.google.com)
2. Navigate to Firestore → Indexes
3. Monitor build progress and status

## Performance Benefits

### Query Performance
- **Complex Filtering**: Multi-field queries execute efficiently
- **Sorting**: Large datasets sort quickly with proper indexes
- **Pagination**: Cursor-based pagination works smoothly
- **Real-time Updates**: Live queries perform optimally

### Cost Optimization
- **Read Efficiency**: Indexes reduce document scan costs
- **Write Optimization**: Balanced index strategy minimizes write costs
- **Storage Efficiency**: Optimized field selection reduces index storage

## Best Practices

### Query Design
1. **Use Indexed Fields**: Always query on indexed field combinations
2. **Limit Results**: Use pagination to limit result sets
3. **Avoid Array Queries**: Minimize array-contains queries
4. **Optimize Sorting**: Use indexed sort orders

### Index Management
1. **Monitor Usage**: Remove unused indexes periodically
2. **Test Queries**: Validate query performance in development
3. **Update Indexes**: Add indexes for new query patterns
4. **Cost Monitoring**: Track index-related costs

## Troubleshooting

### Common Issues
1. **Missing Index Error**: Add required composite index
2. **Slow Queries**: Check if proper indexes exist
3. **High Costs**: Review and optimize index usage
4. **Build Failures**: Check field types and constraints

### Debug Commands
```bash
# Check current indexes
firebase firestore:indexes

# Validate index configuration
firebase deploy --only firestore:indexes --dry-run

# Monitor index build status
firebase firestore:indexes --status
```

## Maintenance

### Regular Tasks
1. **Monthly Review**: Check index usage and performance
2. **Quarterly Cleanup**: Remove unused indexes
3. **Performance Testing**: Validate query performance
4. **Cost Analysis**: Review indexing costs

### Updates
When adding new features:
1. Identify new query patterns
2. Add required indexes to `firestore.indexes.json`
3. Deploy indexes before feature release
4. Test query performance

## Security Considerations

### Index Security
- Indexes respect Firestore security rules
- Sensitive data in indexes follows same access controls
- Index queries still require proper authentication

### Best Practices
1. **Field Selection**: Only index necessary fields
2. **Access Control**: Ensure proper security rules
3. **Data Privacy**: Consider privacy implications of indexed fields

---

**Last Updated**: December 2024  
**Total Indexes**: 1,500+  
**Collections Covered**: 25+  
**Deployment Script**: `deploy-comprehensive-indexes.sh`