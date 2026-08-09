'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { 
  HeaderConfiguration, 
  getHeaderConfiguration, 
  getHeaderConfigurationByPath 
} from '@/config/headerConfigurations';

/**
 * Hook to get header configuration based on current route or specified page type
 */
export const useHeaderConfiguration = (pageType?: string): HeaderConfiguration => {
  const pathname = usePathname();
  
  return useMemo(() => {
    if (pageType) {
      return getHeaderConfiguration(pageType);
    }
    return getHeaderConfigurationByPath(pathname);
  }, [pathname, pageType]);
};

/**
 * Hook to get header configuration with theme support
 */
export const useHeaderConfigurationWithTheme = (
  pageType?: string,
  isDarkMode?: boolean,
  onThemeToggle?: () => void
) => {
  const config = useHeaderConfiguration(pageType);
  
  return useMemo(() => ({
    ...config,
    isDarkMode,
    onThemeToggle,
  }), [config, isDarkMode, onThemeToggle]);
};