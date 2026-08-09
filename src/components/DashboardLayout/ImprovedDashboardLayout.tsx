"use client";
import React, { ReactNode } from 'react';

interface ImprovedDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  // Kept for backwards compatibility; width is now controlled globally in EnhancedNavigation
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  showBackToTop?: boolean;
}

// Simplified wrapper with no layout (no sidebar/header). Renders children only.
export default function ImprovedDashboardLayout({
  children,
}: ImprovedDashboardLayoutProps) {
  return <>{children}</>;
}
