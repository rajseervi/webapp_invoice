# Modern Sidebar Component for Next.js

A modern, responsive sidebar component for Next.js applications with Material UI and Framer Motion animations.

## Features

- 🎨 Modern, clean design with smooth animations
- 📱 Fully responsive (mobile and desktop)
- 🔄 Collapsible/expandable functionality
- 📚 Multi-level navigation menu
- 👤 User profile section
- 🌓 Dark/light mode compatible
- 🔔 Badge support for notifications
- 🆕 "New" label support for menu items
- 🔒 Permission-based menu items (optional)

## Installation

The component is already part of your project. It uses:

- Material UI
- Framer Motion
- Next.js

## Usage

```tsx
import { ModernSidebar } from '@/components/ModernSidebar';
import { useState } from 'react';

export default function YourLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex' }}>
      <ModernSidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onMobileClose={() => setSidebarOpen(false)}
        userName="John Doe"
        userRole="Administrator"
        userAvatar="/path/to/avatar.jpg" // Optional
      />
      
      <main style={{ flexGrow: 1 }}>
        {/* Your page content */}
      </main>
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | `true` | Controls whether the sidebar is open |
| `onToggle` | function | - | Callback when the toggle button is clicked |
| `onMobileClose` | function | - | Callback when a navigation item is clicked on mobile |
| `userName` | string | "John Doe" | User's name to display in the profile section |
| `userRole` | string | "Admin" | User's role to display in the profile section |
| `userAvatar` | string | - | URL to the user's avatar image |

## Demo

A demo page is available at `/sidebar-demo` in your application.

## Customization

### Navigation Items

To customize the navigation items, modify the `navigationSections` array in the `ModernSidebar.tsx` file:

```tsx
const navigationSections: NavSection[] = [
  {
    title: "Section Title",
    items: [
      {
        title: "Item Title",
        path: "/item-path",
        icon: <YourIcon />,
        badge: 5, // Optional: Shows a badge with the number
        isNew: true, // Optional: Shows a "New" label
        children: [ // Optional: For submenu items
          {
            title: "Subitem Title",
            path: "/subitem-path",
            icon: <SubitemIcon />
          }
        ]
      }
    ]
  }
];
```

### Styling

The component uses Material UI's theming system. You can customize the appearance by modifying your theme or the style properties in the component.

## Integration with Authentication

To integrate with your authentication system, uncomment and modify the permission checks in the component:

```tsx
// Import your auth context
import { useAuth } from '@/contexts/AuthContext';

// In the component
const { hasPermission } = useAuth();

// In the renderNavItem function
if (item.permission && !hasPermission(item.permission)) {
  return null;
}
```