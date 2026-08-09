# Modern Layout Components

This directory contains the modern dashboard layout components for the application.

## Components

### ModernDashboardLayout
- Basic dashboard layout with sidebar and header
- Use for standard dashboard pages

### EnhancedModernDashboardLayout (ModernLayout)
- Enhanced version with additional features like theme provider, quick actions, etc.
- Use for pages that need advanced dashboard features
- Exported as `ModernLayout` for convenience

### ModernSidebar
- Standalone sidebar component
- Can be used independently if needed

### ModernThemeProvider
- Theme provider for consistent styling
- Exports `useModernTheme` hook

### SimpleModernHeader
- Standalone header component
- Can be used independently if needed

## Usage

### For Dashboard Pages
```tsx
import ModernDashboardLayout from '@/components/ModernLayout/ModernDashboardLayout';
// or
import { ModernLayout } from '@/components/ModernLayout';

export default function MyPage() {
  return (
    <ModernDashboardLayout title="My Page">
      {/* Your page content */}
    </ModernDashboardLayout>
  );
}
```

### For Pages Without Layout
```tsx
// Don't import any layout component
export default function LoginPage() {
  return (
    <div>
      {/* Your page content without layout */}
    </div>
  );
}
```

### For Admin Pages
```tsx
import { AdminLayout } from '@/app/admin/components/AdminLayout';

export default function AdminPage() {
  return (
    <AdminLayout title="Admin Page">
      {/* Your admin page content */}
    </AdminLayout>
  );
}
```

## Layout Selection

The layout is **NOT** applied globally. Each page must explicitly import and use the layout component it needs.

### Pages that should NOT use any layout:
- `/login`
- `/register` 
- `/forgot-password`
- `/reset-password`
- `/pending-approval`
- `/account-inactive`
- `/unauthorized`
- `/` (landing page)

### Pages that should use ModernDashboardLayout:
- `/dashboard`
- `/products`
- `/invoices`
- `/orders`
- `/parties`
- `/reports`
- etc.

### Pages that should use AdminLayout:
- `/admin/*` pages

## Troubleshooting

If you're seeing the dashboard layout on pages where it shouldn't appear:

1. Check if the page component is explicitly importing and using a layout component
2. Check if there are any wrapper components that might be applying the layout
3. Verify that the page is not nested under a layout file that applies the dashboard layout
4. Use the `useLayoutSelector` hook to programmatically determine the appropriate layout