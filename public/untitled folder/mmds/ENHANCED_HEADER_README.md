# 🚀 Super Enhanced Header Bar

A comprehensive, feature-rich header bar component with advanced search capabilities, party management, and intelligent user experience features.

## ✨ Features

### 🔍 Enhanced Search System
- **Multi-Entity Search**: Search across parties, products, invoices, and pages
- **Advanced Filters**: Filter by type (party, product, invoice, recent)
- **Real-time Results**: Instant search results with debounced queries
- **Search History**: Track and suggest previous searches
- **Relevance Scoring**: Intelligent result ranking based on relevance
- **Keyboard Shortcuts**: Global search with `Ctrl+K`
- **Mobile Optimized**: Full-screen search overlay for mobile devices

### 👥 Party Quick Access
- **Recent Parties**: Quick access to recently viewed parties
- **Favorite Parties**: Mark and access favorite parties
- **Party Status**: Visual status indicators (active/inactive)
- **Quick Actions**: Direct invoice creation from party menu
- **Outstanding Balances**: Display outstanding amounts
- **Contact Information**: Quick access to phone and email

### 🔔 Smart Notifications
- **Priority System**: High, medium, low priority notifications
- **Categorized Alerts**: Payment overdue, low stock, system notifications
- **Action-based**: Direct links to relevant pages
- **Mark as Read**: Individual and bulk read functionality
- **Real-time Updates**: Live notification updates

### ⚡ Quick Actions
- **Categorized Actions**: Primary, secondary, and utility actions
- **Keyboard Shortcuts**: Shortcut keys for common actions
- **Badge Support**: Show counts and "new" indicators
- **Customizable**: Support for custom action sets
- **Visual Hierarchy**: Color-coded action categories

### 🎨 User Experience
- **Responsive Design**: Optimized for all screen sizes
- **Theme Support**: Light and dark mode compatibility
- **Smooth Animations**: Framer Motion powered transitions
- **Accessibility**: Full keyboard navigation and screen reader support
- **Customizable**: Extensive configuration options

## 📦 Installation

1. **Copy the components** to your project:
   ```
   src/components/Header/SuperEnhancedHeader.tsx
   src/hooks/useSuperEnhancedHeader.ts
   src/contexts/HeaderContext.tsx
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install @mui/material @mui/icons-material framer-motion
   ```

3. **Add the HeaderProvider** to your app:
   ```tsx
   import { HeaderProvider } from '@/contexts/HeaderContext';
   
   function App() {
     return (
       <HeaderProvider>
         {/* Your app content */}
       </HeaderProvider>
     );
   }
   ```

## 🚀 Usage

### Basic Usage

```tsx
import SuperEnhancedHeader from '@/components/Header/SuperEnhancedHeader';

function Layout() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <SuperEnhancedHeader
        onDrawerToggle={() => setIsDrawerOpen(!isDrawerOpen)}
        isDrawerOpen={isDrawerOpen}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        isDarkMode={isDarkMode}
      />
      {/* Your content */}
    </>
  );
}
```

### Advanced Configuration

```tsx
<SuperEnhancedHeader
  title="Custom Page Title"
  showSearch={true}
  showQuickActions={true}
  showPartyQuickAccess={true}
  enableAdvancedSearch={true}
  enableVoiceSearch={false}
  enableShortcuts={true}
  customQuickActions={[
    {
      id: 'custom-action',
      title: 'Custom Action',
      icon: <CustomIcon />,
      path: '/custom',
      color: '#FF5722',
      category: 'primary',
      shortcut: 'Ctrl+X',
    }
  ]}
/>
```

## ⚙️ Configuration Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onDrawerToggle` | `() => void` | - | Callback for drawer toggle |
| `isDrawerOpen` | `boolean` | `false` | Drawer open state |
| `onThemeToggle` | `() => void` | - | Theme toggle callback |
| `isDarkMode` | `boolean` | `false` | Dark mode state |
| `title` | `string` | - | Custom page title |
| `showSearch` | `boolean` | `true` | Show search bar |
| `showQuickActions` | `boolean` | `true` | Show quick actions menu |
| `showPartyQuickAccess` | `boolean` | `true` | Show party quick access |
| `enableAdvancedSearch` | `boolean` | `true` | Enable search filters |
| `enableVoiceSearch` | `boolean` | `false` | Enable voice search |
| `enableShortcuts` | `boolean` | `true` | Enable keyboard shortcuts |
| `customQuickActions` | `QuickAction[]` | - | Custom quick actions |

## 🎯 Search Features

### Search Filters
- **All**: Search across all entities
- **Party**: Search only parties
- **Product**: Search only products
- **Recent**: Search recent queries

### Search Results
Each search result includes:
- **Title**: Primary identifier
- **Subtitle**: Secondary information
- **Description**: Additional context
- **Badge**: Entity type indicator
- **Actions**: Quick action buttons
- **Metadata**: Tags, status, amounts

### Search Analytics
The system tracks:
- Search queries and results
- User interaction patterns
- Performance metrics
- Relevance optimization data

## 🔧 Customization

### Custom Quick Actions

```tsx
const customActions: QuickAction[] = [
  {
    id: 'reports',
    title: 'Generate Report',
    icon: <ReportIcon />,
    path: '/reports/generate',
    color: '#9C27B0',
    category: 'primary',
    shortcut: 'Ctrl+R',
    badge: 3,
    isNew: true,
  }
];
```

### Custom Search Results

```tsx
// Extend the search functionality in useSuperEnhancedHeader.ts
const performCustomSearch = async (query: string) => {
  // Add your custom search logic
  const customResults = await yourCustomSearchAPI(query);
  
  return customResults.map(result => ({
    id: result.id,
    title: result.name,
    subtitle: result.description,
    type: 'custom',
    path: `/custom/${result.id}`,
    icon: <CustomIcon />,
    badge: 'Custom',
    actions: [
      {
        id: 'view',
        label: 'View',
        icon: <ViewIcon />,
        action: () => navigate(`/custom/${result.id}`),
      }
    ],
  }));
};
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Open global search |
| `Ctrl + D` | Navigate to dashboard |
| `Ctrl + N` | Create new invoice |
| `Ctrl + P` | Add new party |
| `Esc` | Close search/menus |

## 📱 Mobile Support

The header automatically adapts for mobile devices:
- **Collapsible Search**: Full-screen search overlay
- **Touch Optimized**: Larger touch targets
- **Responsive Layout**: Optimized for small screens
- **Gesture Support**: Swipe and tap interactions

## 🎨 Theming

The header supports Material-UI theming:

```tsx
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark', // or 'light'
    primary: {
      main: '#2196F3',
    },
    // ... other theme options
  },
});

<ThemeProvider theme={theme}>
  <SuperEnhancedHeader />
</ThemeProvider>
```

## 🔌 Integration

### With Existing Services

```tsx
// Update your services to work with the enhanced search
export const partyService = {
  async searchParties(query: string, options: SearchOptions) {
    // Your search implementation
    return results;
  }
};
```

### With Analytics

```tsx
// Track search analytics
const trackSearch = (query: string, results: number) => {
  analytics.track('header_search', {
    query,
    resultCount: results,
    timestamp: new Date(),
  });
};
```

## 🚀 Performance

### Optimization Features
- **Debounced Search**: 300ms delay to reduce API calls
- **Result Caching**: Cache search results for better performance
- **Lazy Loading**: Load components only when needed
- **Virtual Scrolling**: Handle large result sets efficiently

### Best Practices
- Limit search results to 12 items
- Use relevance scoring for better UX
- Implement proper error handling
- Add loading states for better feedback

## 🧪 Testing

### Demo Page
Visit `/demo/enhanced-header` to see all features in action.

### Test Scenarios
1. **Search Functionality**: Test various search queries
2. **Keyboard Shortcuts**: Verify all shortcuts work
3. **Mobile Experience**: Test on different screen sizes
4. **Theme Switching**: Test light/dark mode transitions
5. **Performance**: Test with large datasets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This component is part of the Hanuam Kothur project and follows the same license terms.

## 🆘 Support

For issues and questions:
1. Check the demo page for examples
2. Review the configuration options
3. Check the console for error messages
4. Create an issue with detailed information

---

**Built with ❤️ using React, Material-UI, and TypeScript**