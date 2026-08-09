# SimpleModernHeader Configurations for All Pages

This document provides comprehensive configurations for SimpleModernHeader across different page types in your application.

## 🚀 Quick Start

### Method 1: Using ConfiguredSimpleModernHeader (Recommended)

```tsx
import { ConfiguredSimpleModernHeader } from '@/components/ModernLayout';

// Automatic configuration based on current route
<ConfiguredSimpleModernHeader />

// Or specify page type
<ConfiguredSimpleModernHeader pageType="products" />

// Or override specific settings
<ConfiguredSimpleModernHeader 
  pageType="dashboard"
  title="Custom Dashboard Title"
  showSearch={false}
/>
```

### Method 2: Using ModernDashboardLayout with Header

```tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';

export default function MyPage() {
  return (
    <ModernDashboardLayout 
      title="My Page"
      pageType="products"
      showHeader={true}
    >
      {/* Your page content */}
    </ModernDashboardLayout>
  );
}
```

### Method 3: Manual Configuration

```tsx
import { SimpleModernHeader } from '@/components/ModernLayout';
import { useHeaderConfiguration } from '@/hooks/useHeaderConfiguration';

export default function MyPage() {
  const config = useHeaderConfiguration('products');
  
  return (
    <>
      <SimpleModernHeader
        title={config.title}
        showSearch={config.showSearch}
        showQuickActions={config.showQuickActions}
        showNotifications={config.showNotifications}
        customQuickActions={config.customQuickActions}
      />
      {/* Your page content */}
    </>
  );
}
```

## 📋 Page-Specific Configurations

### 1. Dashboard Pages

```tsx
// /src/app/dashboard/page.tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';

export default function DashboardPage() {
  return (
    <ModernDashboardLayout pageType="dashboard">
      {/* Dashboard content */}
    </ModernDashboardLayout>
  );
}
```

**Configuration:**
- Title: "Dashboard"
- Search: ✅ "Search dashboard, quick stats..."
- Quick Actions: New Invoice, New Product, New Party, New Order, Reports
- Notifications: ✅

### 2. Admin Dashboard

```tsx
// /src/app/admin/dashboard/page.tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';

export default function AdminDashboardPage() {
  return (
    <ModernDashboardLayout pageType="adminDashboard">
      {/* Admin dashboard content */}
    </ModernDashboardLayout>
  );
}
```

**Configuration:**
- Title: "Admin Dashboard"
- Search: ✅ "Search admin panel, users, settings..."
- Quick Actions: User Management, System Settings, Analytics, Reports
- Notifications: ✅

### 3. Product Management

```tsx
// /src/app/products/page.tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';

export default function ProductsPage() {
  return (
    <ModernDashboardLayout pageType="products">
      {/* Products content */}
    </ModernDashboardLayout>
  );
}
```

**Configuration:**
- Title: "Product Management"
- Search: ✅ "Search products, categories, SKU..."
- Quick Actions: New Product, Categories, Bulk Import, Inventory, Dashboard
- Notifications: ✅

### 4. Invoice Management

```tsx
// /src/app/invoices/page.tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';

export default function InvoicesPage() {
  return (
    <ModernDashboardLayout pageType="invoices">
      {/* Invoices content */}
    </ModernDashboardLayout>
  );
}
```

**Configuration:**
- Title: "Invoice Management"
- Search: ✅ "Search invoices, parties, amounts..."
- Quick Actions: New Invoice, GST Invoices, Regular Invoices, Parties, Dashboard
- Notifications: ✅

### 5. Party Management

```tsx
// /src/app/parties/page.tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';

export default function PartiesPage() {
  return (
    <ModernDashboardLayout pageType="parties">
      {/* Parties content */}
    </ModernDashboardLayout>
  );
}
```

**Configuration:**
- Title: "Party Management"
- Search: ✅ "Search parties, contacts, GST numbers..."
- Quick Actions: New Party, Party Ledger, Invoices, Orders, Dashboard
- Notifications: ✅

### 6. Order Management

```tsx
// /src/app/orders/page.tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';

export default function OrdersPage() {
  return (
    <ModernDashboardLayout pageType="orders">
      {/* Orders content */}
    </ModernDashboardLayout>
  );
}
```

**Configuration:**
- Title: "Order Management"
- Search: ✅ "Search orders, order numbers, parties..."
- Quick Actions: New Order, Pending Orders (with badge), Parties, Products, Dashboard
- Notifications: ✅

### 7. Reports & Analytics

```tsx
// /src/app/reports/page.tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';

export default function ReportsPage() {
  return (
    <ModernDashboardLayout pageType="reports">
      {/* Reports content */}
    </ModernDashboardLayout>
  );
}
```

**Configuration:**
- Title: "Reports & Analytics"
- Search: ✅ "Search reports, analytics, data..."
- Quick Actions: Sales Report, Profit & Loss, Product Report, Dashboard
- Notifications: ✅

### 8. Inventory Management

```tsx
// /src/app/inventory/page.tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';

export default function InventoryPage() {
  return (
    <ModernDashboardLayout pageType="inventory">
      {/* Inventory content */}
    </ModernDashboardLayout>
  );
}
```

**Configuration:**
- Title: "Inventory Management"
- Search: ✅ "Search inventory, stock levels, alerts..."
- Quick Actions: Stock Alerts (with badge), Products, Purchases, Dashboard
- Notifications: ✅

### 9. Purchase Management

```tsx
// /src/app/purchases/page.tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';

export default function PurchasesPage() {
  return (
    <ModernDashboardLayout pageType="purchases">
      {/* Purchases content */}
    </ModernDashboardLayout>
  );
}
```

**Configuration:**
- Title: "Purchase Management"
- Search: ✅ "Search purchases, suppliers, PO numbers..."
- Quick Actions: New Purchase, Suppliers, Inventory, Dashboard
- Notifications: ✅

### 10. Settings

```tsx
// /src/app/settings/page.tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';

export default function SettingsPage() {
  return (
    <ModernDashboardLayout pageType="settings">
      {/* Settings content */}
    </ModernDashboardLayout>
  );
}
```

**Configuration:**
- Title: "Settings"
- Search: ✅ "Search settings, preferences..."
- Quick Actions: ❌ (disabled for settings)
- Notifications: ✅

### 11. Profile

```tsx
// /src/app/profile/page.tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';

export default function ProfilePage() {
  return (
    <ModernDashboardLayout pageType="profile">
      {/* Profile content */}
    </ModernDashboardLayout>
  );
}
```

**Configuration:**
- Title: "Profile"
- Search: ❌
- Quick Actions: Dashboard, Settings
- Notifications: ✅

### 12. Help & Support

```tsx
// /src/app/help-desk/page.tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';

export default function HelpPage() {
  return (
    <ModernDashboardLayout pageType="help">
      {/* Help content */}
    </ModernDashboardLayout>
  );
}
```

**Configuration:**
- Title: "Help & Support"
- Search: ✅ "Search help articles, FAQs..."
- Quick Actions: Documentation, Dashboard, Settings
- Notifications: ❌

## 🎨 Custom Configurations

### Override Default Configuration

```tsx
import { ConfiguredSimpleModernHeader } from '@/components/ModernLayout';

<ConfiguredSimpleModernHeader
  pageType="products"
  overrideConfig={{
    title: "Custom Product Title",
    showSearch: false,
    showNotifications: false,
  }}
/>
```

### Custom Quick Actions

```tsx
import { ConfiguredSimpleModernHeader } from '@/components/ModernLayout';
import { Add, Settings } from '@mui/icons-material';

const customActions = [
  {
    id: 'custom-action',
    title: 'Custom Action',
    icon: <Add />,
    path: '/custom',
    color: '#FF5722',
    isNew: true,
  },
];

<ConfiguredSimpleModernHeader
  pageType="dashboard"
  customQuickActions={customActions}
/>
```

### Theme Integration

```tsx
import { ConfiguredSimpleModernHeader } from '@/components/ModernLayout';
import { useState } from 'react';

export default function MyPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <ConfiguredSimpleModernHeader
      pageType="dashboard"
      isDarkMode={isDarkMode}
      onThemeToggle={() => setIsDarkMode(!isDarkMode)}
    />
  );
}
```

## 🔧 Advanced Usage

### Route-Based Auto Configuration

The header automatically detects the current route and applies the appropriate configuration:

- `/dashboard` → Dashboard configuration
- `/products` → Products configuration
- `/admin/*` → Admin Dashboard configuration
- `/invoices` → Invoice configuration
- etc.

### Responsive Behavior

The header automatically adapts to different screen sizes:

- **Desktop**: Full search bar, quick actions button, all icons
- **Mobile**: Hamburger menu, search icon, condensed layout

### Search Functionality

Each page type has a customized search placeholder:

- Dashboard: "Search dashboard, quick stats..."
- Products: "Search products, categories, SKU..."
- Invoices: "Search invoices, parties, amounts..."
- etc.

### Notification System

The header includes a notification system with:

- Badge count display
- Dropdown menu with recent notifications
- "View all notifications" link

### Quick Actions Menu

Context-aware quick actions based on page type:

- **Dashboard**: Create new items (Invoice, Product, Party, Order)
- **Products**: Product management actions (New Product, Categories, Import)
- **Invoices**: Invoice-related actions (New Invoice, GST, Regular)
- etc.

## 📱 Mobile Optimizations

- Hamburger menu for sidebar toggle
- Condensed search (icon only)
- Touch-friendly button sizes
- Responsive typography
- Optimized spacing

## 🎯 Best Practices

1. **Use ConfiguredSimpleModernHeader** for automatic configuration
2. **Specify pageType** for consistent behavior across similar pages
3. **Override sparingly** - only when necessary
4. **Test on mobile** - ensure responsive behavior works
5. **Keep quick actions relevant** - don't overwhelm users
6. **Use consistent colors** - follow the established color scheme

## 🔄 Migration Guide

### From PageHeader to SimpleModernHeader

```tsx
// Before
import PageHeader from '@/components/PageHeader/PageHeader';

<PageHeader 
  title="Products" 
  action={<Button>Add Product</Button>}
/>

// After
import { ConfiguredSimpleModernHeader } from '@/components/ModernLayout';

<ConfiguredSimpleModernHeader pageType="products" />
```

### From Manual Header to Configured Header

```tsx
// Before
import SimpleModernHeader from '@/components/ModernLayout/SimpleModernHeader';

<SimpleModernHeader
  title="Products"
  showSearch={true}
  showQuickActions={true}
  customQuickActions={[...]}
/>

// After
import { ConfiguredSimpleModernHeader } from '@/components/ModernLayout';

<ConfiguredSimpleModernHeader pageType="products" />
```

This configuration system provides consistent, context-aware headers across your entire application while maintaining flexibility for customization when needed.