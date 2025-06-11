# Enhanced Modern Sidebar & Dashboard Layout

A comprehensive, responsive, and accessible sidebar implementation with advanced features for modern web applications.

## 🚀 Features

### Core Features
- **Responsive Design**: Automatically adapts to different screen sizes
- **Touch-Friendly**: Optimized for mobile and tablet interactions
- **Accessibility First**: Full keyboard navigation and screen reader support
- **Performance Optimized**: Efficient rendering with React.memo and optimized re-renders
- **Smooth Animations**: Powered by Framer Motion for fluid transitions

### Advanced Features
- **Hover-to-Expand**: Mini sidebar expands on hover (desktop only)
- **Persistent State**: Remembers sidebar state across sessions
- **Keyboard Shortcuts**: Ctrl+B to toggle, Escape to close
- **Mobile Gestures**: Swipe and tap interactions
- **Back-to-Top**: Optional floating action button
- **Notification System**: Built-in notification badges and menu
- **User Profile**: Integrated user menu with avatar

### Responsive Behavior
- **Desktop (≥768px)**: 
  - Full sidebar with mini mode option
  - Hover-to-expand functionality
  - Persistent state management
- **Mobile (<768px)**: 
  - Overlay sidebar with backdrop
  - Touch-friendly interactions
  - Automatic close on navigation

## 📱 Components

### ModernSidebar
The main sidebar component with enhanced features.

```tsx
import { ModernSidebar } from '@/components/ModernSidebar';

<ModernSidebar 
  isOpen={true}
  onToggle={() => {}}
  onMobileClose={() => {}}
  userName="John Doe"
  userRole="Admin"
  userAvatar="/avatar.jpg"
  variant="permanent"
  customSections={navigationSections}
/>
```

### EnhancedDashboardLayout
Complete dashboard layout with integrated sidebar.

```tsx
import EnhancedDashboardLayout from '@/components/DashboardLayout/EnhancedDashboardLayout';

export default function MyPage() {
  return (
    <EnhancedDashboardLayout 
      title="My Page Title"
      showBackToTop={true}
      maxWidth="lg"
    >
      <YourPageContent />
    </EnhancedDashboardLayout>
  );
}
```

## 🎛️ Props

### ModernSidebar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `true` | Controls sidebar visibility |
| `onToggle` | `() => void` | - | Toggle callback |
| `onMobileClose` | `() => void` | - | Mobile close callback |
| `userName` | `string` | `"John Doe"` | User display name |
| `userRole` | `string` | `"Admin"` | User role |
| `userAvatar` | `string` | - | User avatar URL |
| `variant` | `'permanent' \| 'temporary' \| 'persistent'` | `'permanent'` | Sidebar variant |
| `customSections` | `NavSection[]` | - | Custom navigation sections |

### EnhancedDashboardLayout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Page content |
| `title` | `string` | - | Page title in header |
| `showBackToTop` | `boolean` | `true` | Show back-to-top button |
| `maxWidth` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| false` | `false` | Content max width |

## 🎨 Customization

### Navigation Sections
Define custom navigation sections:

```tsx
const customSections: NavSection[] = [
  {
    id: 'main',
    title: 'Main Navigation',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        path: '/dashboard',
        icon: <DashboardIcon />,
        description: 'Main dashboard view',
        badge: 5,
        children: [
          {
            id: 'analytics',
            title: 'Analytics',
            path: '/dashboard/analytics',
            icon: <AnalyticsIcon />
          }
        ]
      }
    ]
  }
];
```

### Theming
The sidebar respects Material-UI theme settings:

```tsx
const theme = createTheme({
  palette: {
    mode: 'dark', // or 'light'
    primary: {
      main: '#1976d2',
    },
  },
});
```

## ⌨️ Keyboard Navigation

| Key | Action |
|-----|--------|
| `Ctrl + B` | Toggle sidebar |
| `Escape` | Close mobile sidebar |
| `Tab` | Navigate through items |
| `Enter` | Activate focused item |
| `Arrow Keys` | Navigate menu items |

## 📱 Mobile Behavior

### Touch Interactions
- **Tap**: Open/close sidebar
- **Swipe**: Navigate between sections
- **Backdrop Tap**: Close sidebar

### Responsive Breakpoints
- **xs**: 0px - 599px (Mobile)
- **sm**: 600px - 959px (Tablet)
- **md**: 960px+ (Desktop)

## 🔧 Installation & Setup

1. **Install Dependencies**:
```bash
npm install @mui/material @emotion/react @emotion/styled
npm install framer-motion
npm install @mui/icons-material
```

2. **Import Components**:
```tsx
import { ModernSidebar } from '@/components/ModernSidebar';
import EnhancedDashboardLayout from '@/components/DashboardLayout/EnhancedDashboardLayout';
```

3. **Use in Your App**:
```tsx
export default function App() {
  return (
    <EnhancedDashboardLayout>
      <YourContent />
    </EnhancedDashboardLayout>
  );
}
```

## 🎯 Best Practices

### Performance
- Use `React.memo` for navigation items
- Implement `useCallback` for event handlers
- Lazy load heavy components

### Accessibility
- Provide meaningful ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper focus management

### Mobile UX
- Use appropriate touch targets (44px minimum)
- Provide visual feedback for interactions
- Implement proper gesture handling
- Test on actual devices

## 🧪 Testing

### Manual Testing Checklist
- [ ] Desktop sidebar toggle works
- [ ] Mobile overlay functions correctly
- [ ] Keyboard navigation is smooth
- [ ] Touch interactions are responsive
- [ ] State persists across page reloads
- [ ] Animations are smooth
- [ ] Accessibility features work

### Automated Testing
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ModernSidebar } from '@/components/ModernSidebar';

test('sidebar toggles correctly', () => {
  const onToggle = jest.fn();
  render(<ModernSidebar onToggle={onToggle} />);
  
  const toggleButton = screen.getByLabelText(/toggle sidebar/i);
  fireEvent.click(toggleButton);
  
  expect(onToggle).toHaveBeenCalled();
});
```

## 🔄 Migration Guide

### From Basic Sidebar
1. Replace `Sidebar` with `ModernSidebar`
2. Update prop names and structure
3. Add responsive breakpoints
4. Test mobile behavior

### From Old Dashboard Layout
1. Replace with `EnhancedDashboardLayout`
2. Update navigation structure
3. Add new props as needed
4. Test responsive behavior

## 🐛 Troubleshooting

### Common Issues

**Sidebar not responsive on mobile**
- Check Material-UI theme provider
- Verify breakpoint configuration
- Test viewport meta tag

**Animations not working**
- Ensure Framer Motion is installed
- Check for CSS conflicts
- Verify animation preferences

**State not persisting**
- Check localStorage availability
- Verify JSON serialization
- Test in incognito mode

## 📚 Examples

### Basic Usage
```tsx
import EnhancedDashboardLayout from '@/components/DashboardLayout/EnhancedDashboardLayout';

export default function Dashboard() {
  return (
    <EnhancedDashboardLayout title="Dashboard">
      <h1>Welcome to Dashboard</h1>
    </EnhancedDashboardLayout>
  );
}
```

### Custom Navigation
```tsx
const customNav = [
  {
    id: 'business',
    title: 'Business',
    items: [
      {
        id: 'sales',
        title: 'Sales',
        path: '/sales',
        icon: <SalesIcon />,
        badge: 12
      }
    ]
  }
];

<ModernSidebar customSections={customNav} />
```

### Mobile-First Layout
```tsx
<EnhancedDashboardLayout 
  maxWidth="sm"
  showBackToTop={false}
>
  <MobileOptimizedContent />
</EnhancedDashboardLayout>
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Related Components

- [ThemeToggle](../ThemeToggle/README.md)
- [Navbar](../Navbar/README.md)
- [PageHeader](../PageHeader/README.md)

---

**Built with ❤️ using React, Material-UI, and Framer Motion**