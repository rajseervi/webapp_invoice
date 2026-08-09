# Admin Dashboard API Enhancement Documentation

## Overview
The Admin Dashboard API has been enhanced with three major features:
1. **Sales Activity Data** - Monthly reports with total sales and invoices in graphs
2. **Product Details** - Low stock alerts, category analysis, and inventory graphs  
3. **Party Search & Ledger** - Search parties and view complete ledger statements

---

## 🔥 Feature 1: Sales Activity Data

### GET `/api/admin/dashboard`
Enhanced response now includes comprehensive sales analytics:

```json
{
  "success": true,
  "data": {
    "chartData": {
      "salesActivity": {
        "monthlyChart": [
          {
            "month": "Jan 24",
            "totalSales": 125000,
            "totalInvoices": 45,
            "paidAmount": 100000,
            "pendingAmount": 20000,
            "overdueAmount": 5000,
            "averageOrderValue": 2777.78
          }
          // ... 12 months of data
        ],
        "summary": {
          "totalSalesThisYear": 1500000,
          "totalInvoicesThisYear": 540,
          "averageMonthlyGrowth": 12.5,
          "bestMonth": {
            "month": "Dec 24",
            "totalSales": 180000
          },
          "salesTrend": "growing"
        }
      }
    }
  }
}
```

### Key Metrics:
- **Monthly Sales Chart**: 12 months of sales data with trends
- **Invoice Count Tracking**: Monthly invoice generation patterns
- **Payment Analysis**: Paid vs Pending vs Overdue amounts
- **Growth Calculations**: Month-over-month growth rates
- **Sales Trends**: Growing/Declining/Stable trend analysis

---

## 📦 Feature 2: Product Details & Analytics

### GET `/api/admin/dashboard`
Enhanced response includes detailed product analytics:

```json
{
  "success": true,
  "data": {
    "chartData": {
      "productAnalytics": {
        "totalItems": 250,
        "totalCategories": 8,
        "lowStockItems": [
          {
            "id": "prod-123",
            "name": "Product Name",
            "category": "Electronics",
            "currentStock": 5,
            "minStock": 10,
            "status": "Low Stock",
            "reorderQuantity": 15
          }
        ],
        "categoryBreakdown": {
          "Electronics": {
            "count": 45,
            "totalValue": 125000,
            "averagePrice": 2777.78,
            "lowStockCount": 3
          }
        },
        "stockAnalysis": {
          "inStock": 200,
          "lowStock": 35,
          "outOfStock": 10,
          "overStock": 5
        },
        "categoryChart": [
          {
            "name": "Electronics",
            "value": 45,
            "totalValue": 125000,
            "color": "#FF6384"
          }
        ],
        "stockChart": [
          {
            "name": "In Stock",
            "value": 200,
            "color": "#4caf50"
          },
          {
            "name": "Low Stock", 
            "value": 35,
            "color": "#ff9800"
          }
        ]
      }
    }
  }
}
```

### Key Features:
- **Stock Status Analysis**: In Stock, Low Stock, Out of Stock, Over Stock
- **Category Breakdown**: Products by category with value analysis
- **Low Stock Alerts**: Detailed list of items needing reorder
- **Visual Charts**: Category distribution and stock status charts
- **Reorder Suggestions**: Automatic calculation of reorder quantities

---

## 🔍 Feature 3: Party Search & Ledger

### Search Parties
**POST** `/api/admin/dashboard`
```json
{
  "action": "search_parties",
  "searchQuery": "john"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "party-123",
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com",
      "gstNumber": "GST123456",
      "address": "123 Main St",
      "type": "customer",
      "isActive": true,
      "avatar": "J",
      "lastActivity": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "query": "john"
}
```

### Get Party Ledger
**POST** `/api/admin/dashboard`
```json
{
  "action": "get_party_ledger",
  "partyId": "party-123",
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "partyDetails": {
      "id": "party-123",
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com",
      "gstNumber": "GST123456",
      "address": "123 Main St",
      "type": "customer"
    },
    "summary": {
      "totalInvoices": 15,
      "totalAmount": 75000,
      "paidAmount": 60000,
      "pendingAmount": 15000,
      "currentBalance": 15000,
      "averageInvoiceValue": 5000,
      "paymentRate": 80,
      "lastInvoiceDate": "2024-01-15T10:30:00Z",
      "firstInvoiceDate": "2024-01-01T09:00:00Z"
    },
    "ledgerEntries": [
      {
        "id": "inv-456",
        "date": "2024-01-15T10:30:00Z",
        "description": "Invoice INV-001",
        "invoiceNumber": "INV-001",
        "debit": 5000,
        "credit": 0,
        "balance": 15000,
        "status": "Pending",
        "type": "invoice",
        "reference": "inv-456"
      },
      {
        "id": "pay-456",
        "date": "2024-01-10T14:20:00Z",
        "description": "Payment for Invoice INV-002",
        "invoiceNumber": "INV-002",
        "debit": 0,
        "credit": 3000,
        "balance": 10000,
        "status": "Paid",
        "type": "payment",
        "reference": "inv-789",
        "paymentMethod": "Bank Transfer"
      }
    ],
    "dateRange": {
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-12-31T23:59:59Z"
    },
    "metadata": {
      "totalEntries": 30,
      "generatedAt": "2024-01-15T15:45:00Z",
      "period": "1/1/2024 to 12/31/2024"
    }
  }
}
```

### Get Party Statement (Formatted for Print/Export)
**POST** `/api/admin/dashboard`
```json
{
  "action": "get_party_statement",
  "partyId": "party-123",
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

**Response:** Similar to ledger but includes formatted fields for printing:
```json
{
  "success": true,
  "data": {
    "statementHeader": {
      "title": "Account Statement",
      "generatedOn": "1/15/2024",
      "generatedBy": "Admin Dashboard",
      "statementId": "STMT-1705334700000"
    },
    "formattedEntries": [
      {
        "formattedDate": "1/15/2024",
        "formattedDebit": "5,000",
        "formattedCredit": "-",
        "formattedBalance": "15,000"
      }
    ],
    "totals": {
      "totalDebits": 75000,
      "totalCredits": 60000,
      "finalBalance": 15000
    }
  }
}
```

---

## 🎯 Usage Examples

### Frontend Integration Examples:

#### 1. Sales Activity Chart Component
```javascript
// Fetch sales data
const response = await fetch('/api/admin/dashboard?period=1year');
const data = await response.json();

// Use the monthly chart data
const salesData = data.data.chartData.salesActivity.monthlyChart;

// For Chart.js or similar
const chartConfig = {
  labels: salesData.map(item => item.month),
  datasets: [
    {
      label: 'Total Sales',
      data: salesData.map(item => item.totalSales),
      backgroundColor: '#4caf50'
    },
    {
      label: 'Total Invoices',
      data: salesData.map(item => item.totalInvoices),
      backgroundColor: '#2196f3'
    }
  ]
};
```

#### 2. Product Analytics Dashboard
```javascript
// Get product analytics
const response = await fetch('/api/admin/dashboard');
const data = await response.json();

const productData = data.data.chartData.productAnalytics;

// Low stock alerts
const lowStockItems = productData.lowStockItems;
console.log(`${lowStockItems.length} items need reordering`);

// Category pie chart
const categoryChart = productData.categoryChart;
```

#### 3. Party Search & Ledger
```javascript
// Search for parties
const searchParties = async (query) => {
  const response = await fetch('/api/admin/dashboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'search_parties',
      searchQuery: query
    })
  });
  return await response.json();
};

// Get party ledger
const getPartyLedger = async (partyId, dateRange) => {
  const response = await fetch('/api/admin/dashboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_party_ledger',
      partyId: partyId,
      dateRange: dateRange
    })
  });
  return await response.json();
};

// Usage
const parties = await searchParties('john');
if (parties.success && parties.data.length > 0) {
  const ledger = await getPartyLedger(parties.data[0].id, {
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });
  console.log('Party Balance:', ledger.data.summary.currentBalance);
}
```

---

## 🚀 Key Benefits

### Sales Activity:
- **Visual Trends**: 12-month sales visualization
- **Growth Tracking**: Automatic growth rate calculations
- **Performance Insights**: Best performing months identification
- **Payment Analysis**: Detailed payment status breakdown

### Product Analytics:
- **Inventory Management**: Real-time stock status monitoring
- **Category Insights**: Product distribution analysis
- **Reorder Automation**: Smart reorder quantity suggestions
- **Visual Dashboards**: Interactive charts for quick insights

### Party Ledger:
- **Universal Search**: Search by name, phone, email, GST number
- **Complete History**: Full transaction history with running balance
- **Professional Statements**: Print-ready formatted statements
- **Date Range Flexibility**: Custom date range selection
- **Payment Tracking**: Detailed payment method tracking

---

## 📊 Chart Data Structure

All chart data is optimized for popular charting libraries like Chart.js, Recharts, or D3.js:

- **Colors**: Predefined color schemes for consistency
- **Formatting**: Pre-formatted numbers and dates
- **Responsive**: Data structure supports responsive design
- **Interactive**: Includes metadata for tooltips and interactions

---

## 🔧 Error Handling

All endpoints include comprehensive error handling:

```json
{
  "success": false,
  "error": "Failed to fetch dashboard data",
  "details": "Specific error message",
  "timestamp": "2024-01-15T15:45:00Z"
}
```

Common error scenarios:
- Database connection issues
- Invalid party IDs
- Date range validation
- Search query validation
- Timeout protection (10 seconds max)

---

## 🎉 Ready to Use!

Your enhanced Admin Dashboard API is now ready with all three requested features:

1. ✅ **Sales Activity Data** - Monthly reports with graphs
2. ✅ **Product Details** - Low stock, categories, inventory graphs  
3. ✅ **Party Search & Ledger** - Complete ledger statements

The API is backward compatible and includes comprehensive error handling, performance optimization, and detailed documentation for easy frontend integration.