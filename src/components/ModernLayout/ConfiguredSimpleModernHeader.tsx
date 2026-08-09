'use client';

import React from 'react';
import { useHeaderConfiguration } from '@/hooks/useHeaderConfiguration';
import SimpleModernHeader from './SimpleModernHeader';

interface ConfiguredSimpleModernHeaderProps {
  pageType?: string;
  title?: string;
  showSearch?: boolean;
  showQuickActions?: boolean;
  showNotifications?: boolean;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  onMenuClick?: () => void;
  customQuickActions?: Array<{
    id: string;
    title: string;
    icon: React.ReactNode;
    path: string;
    color?: string;
    badge?: number;
    isNew?: boolean;
  }>;
  // Override any configuration
  overrideConfig?: Partial<{
    title: string;
    showSearch: boolean;
    showQuickActions: boolean;
    showNotifications: boolean;
    searchPlaceholder: string;
  }>;
}

/**
 * SimpleModernHeader with automatic configuration based on current route or page type
 */
export const ConfiguredSimpleModernHeader: React.FC<ConfiguredSimpleModernHeaderProps> = ({
  pageType,
  title,
  showSearch,
  showQuickActions,
  showNotifications,
  onThemeToggle,
  isDarkMode,
  onMenuClick,
  customQuickActions,
  overrideConfig,
}) => {
  const config = useHeaderConfiguration(pageType);

  // Merge configuration with props and overrides
  const finalConfig = {
    title: title ?? overrideConfig?.title ?? config.title,
    showSearch: showSearch ?? overrideConfig?.showSearch ?? config.showSearch,
    showQuickActions: showQuickActions ?? overrideConfig?.showQuickActions ?? config.showQuickActions,
    showNotifications: showNotifications ?? overrideConfig?.showNotifications ?? config.showNotifications,
    customQuickActions: customQuickActions ?? config.customQuickActions,
  };

  return (
    <SimpleModernHeader
      title={finalConfig.title}
      showSearch={finalConfig.showSearch}
      showQuickActions={finalConfig.showQuickActions}
      showNotifications={finalConfig.showNotifications}
      onThemeToggle={onThemeToggle}
      isDarkMode={isDarkMode}
      onMenuClick={onMenuClick}
      customQuickActions={finalConfig.customQuickActions}
      showSpeedDial={true}
    />
  );
};

export default ConfiguredSimpleModernHeader;