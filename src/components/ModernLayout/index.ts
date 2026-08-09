// Modern Layout Components
export { default as ModernDashboardLayout } from './ModernDashboardLayout';
export { default as EnhancedModernDashboardLayout } from './EnhancedModernDashboardLayout';
export { default as VisuallyEnhancedDashboardLayout } from './VisuallyEnhancedDashboardLayout';
export { default as ModernSidebar } from './ModernSidebar';
export { default as ModernThemeProvider, useModernTheme } from './ModernThemeProvider';
export { default as SimpleModernHeader } from './SimpleModernHeader';
export { default as ConfiguredSimpleModernHeader } from './ConfiguredSimpleModernHeader';

// Re-export for convenience
// Note: ModernLayout is an alias for EnhancedModernDashboardLayout
// Use this for pages that need the full dashboard layout with sidebar, header, etc.
export { default as ModernLayout } from './EnhancedModernDashboardLayout';
export { useModernTheme as useTheme } from './ModernThemeProvider';

// Layout selection utilities
export type { LayoutType } from '../../hooks/useLayoutSelector';
export { useLayoutSelector, getLayoutConfig } from '../../hooks/useLayoutSelector';