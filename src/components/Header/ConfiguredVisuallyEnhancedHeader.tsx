'use client';

import React from 'react';
import { useHeaderConfiguration } from '@/hooks/useHeaderConfiguration';
import VisuallyEnhancedHeader from './VisuallyEnhancedHeader';

interface ConfiguredVisuallyEnhancedHeaderProps {
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
  enableVisualEffects?: boolean;
  enableAdvancedSearch?: boolean;
  enableVoiceSearch?: boolean;
  enableShortcuts?: boolean;
  showSpeedDial?: boolean;
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
 * VisuallyEnhancedHeader with automatic configuration based on current route or page type
 * Features modern visual effects, animations, gradients, and glass morphism
 */
export const ConfiguredVisuallyEnhancedHeader: React.FC<ConfiguredVisuallyEnhancedHeaderProps> = ({
  pageType,
  title,
  showSearch,
  showQuickActions,
  showNotifications,
  onThemeToggle,
  isDarkMode,
  onMenuClick,
  customQuickActions,
  enableVisualEffects = true,
  enableAdvancedSearch = true,
  enableVoiceSearch = false,
  enableShortcuts = true,
  showSpeedDial = true,
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
    <VisuallyEnhancedHeader
      title={finalConfig.title}
      showSearch={finalConfig.showSearch}
      showQuickActions={finalConfig.showQuickActions}
      showNotifications={finalConfig.showNotifications}
      onThemeToggle={onThemeToggle}
      isDarkMode={isDarkMode}
      onMenuClick={onMenuClick}
      customQuickActions={finalConfig.customQuickActions}
      enableVisualEffects={enableVisualEffects}
      enableAdvancedSearch={enableAdvancedSearch}
      enableVoiceSearch={enableVoiceSearch}
      enableShortcuts={enableShortcuts}
      showSpeedDial={showSpeedDial}
      showPartyQuickAccess={true}
    />
  );
};

export default ConfiguredVisuallyEnhancedHeader;