# Invoice Tab Panel Implementation

## Overview
This implementation provides a comprehensive tab panel view for managing invoices with separate tabs for GST and Regular invoices.

## Features

### 1. Three Main Tabs
- **All Invoices**: Shows all invoices regardless of type
- **GST Invoices**: Shows only invoices with GST components
- **Regular Invoices**: Shows only non-GST invoices

### 2. Invoice Type Detection
The system automatically categorizes invoices as GST or Regular based on:
- `type` field in the invoice document
- Presence of GST-related fields (`gstAmount`, `cgst`, `sgst`, `igst`)
- Party GSTIN information (`partyGstin`)

### 3. Enhanced Features
- **Search & Filter**: Search by invoice number or party name
- **Status Filtering**: Filter by draft, sent, paid, or overdue status
- **Date Range Filtering**: Filter invoices by date range
- **Party Filtering**: Filter by specific party names
- **Summary Statistics**: Real-time statistics for each tab
- **Responsive Design**: Works on desktop and mobile devices

### 4. Action Buttons
- **View Invoice**: Navigate to invoice details
- **Edit Invoice**: Navigate to invoice edit form
- **Print Invoice**: Print or download invoice
- **WhatsApp Share**: Share invoice via WhatsApp
- **Delete Invoice**: Delete invoice with confirmation

### 5. Create Invoice Buttons
- **New Regular Invoice**: Creates a standard invoice
- **New GST Invoice**: Creates a GST-compliant invoice

## File Structure

```
src/
├── components/
│   └── invoices/
│       └── InvoiceTabPanel.tsx    # Main tab panel component
└── app/
    └── invoices/
        └── page.tsx               # Invoices page using the tab panel
```

## Usage

### Basic Implementation
```tsx
import InvoiceTabPanel from '@/components/invoices/InvoiceTabPanel';

function InvoicesPage() {
  const handleCreateInvoice = () => {
    // Navigate to regular invoice creation
  };

  const handleCreateGstInvoice = () => {
    // Navigate to GST invoice creation
  };

  return (
    <InvoiceTabPanel 
      onCreateInvoice={handleCreateInvoice}
      onCreateGstInvoice={handleCreateGstInvoice}
    />
  );
}
```

### Props
- `onCreateInvoice?: () => void` - Callback for creating regular invoices
- `onCreateGstInvoice?: () => void` - Callback for creating GST invoices

## Data Structure

### Invoice Interface
```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  partyName: string;
  total: number;
  createdAt: any;
  status?: 'draft' | 'sent' | 'paid' | 'overdue';
  partyId?: string;
  items?: any[];
  subtotal?: number;
  discount?: number;
  type?: 'gst' | 'regular';
  gstAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  partyGstin?: string;
}
```

## GST vs Regular Invoice Logic

### GST Invoices
An invoice is considered a GST invoice if:
- `type === 'gst'` OR
- Has `gstAmount` > 0 OR
- Has any of `cgst`, `sgst`, `igst` > 0 OR
- Party has `partyGstin`

### Regular Invoices
An invoice is considered a regular invoice if:
- `type === 'regular'` OR
- None of the GST criteria are met

## Summary Statistics

Each tab shows relevant statistics:
- **Total Invoices**: Count of invoices in current tab
- **Total Amount**: Sum of all invoice amounts
- **Paid Amount**: Sum of paid invoices
- **Pending Amount**: Sum of pending invoices
- **GST Amount**: Total GST collected (GST tab only)

## Responsive Design

The component is fully responsive with:
- Mobile-friendly table layout
- Collapsible filter sections
- Touch-friendly action buttons
- Responsive grid layout for summary cards

## Integration with Existing System

The tab panel integrates seamlessly with:
- Firebase Firestore for data storage
- Material-UI for consistent styling
- Next.js routing for navigation
- Existing invoice components for printing and actions

## Future Enhancements

Potential improvements:
1. Export functionality for each tab
2. Bulk operations (delete, status update)
3. Advanced filtering options
4. Invoice templates per type
5. Automated GST calculations
6. Integration with accounting systems

## Dependencies

- React 18+
- Material-UI v5+
- Firebase v9+
- Next.js 13+
- TypeScript 4.5+