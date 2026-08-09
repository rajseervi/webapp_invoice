"use client";

import React from 'react';
import { WidgetConfig } from '@/types/dashboard';
import { StatsCardWidget, ChartWidget, ContentWidget } from './widgets';

interface WidgetRendererProps {
  widget: WidgetConfig;
  onConfigure?: (widget: WidgetConfig) => void;
  onDelete?: (widgetId: string) => void;
  onDuplicate?: (widget: WidgetConfig) => void;
  isSelected?: boolean;
  onSelect?: (widgetId: string) => void;
}

export default function WidgetRenderer({
  widget,
  onConfigure,
  onDelete,
  onDuplicate,
  isSelected,
  onSelect
}: WidgetRendererProps) {
  const commonProps = {
    widget,
    onConfigure,
    onDelete,
    onDuplicate,
    isSelected,
    onSelect
  };

  switch (widget.type) {
    case 'stats-card':
      return <StatsCardWidget {...commonProps} />;
    
    case 'chart-line':
    case 'chart-bar':
    case 'chart-pie':
      return <ChartWidget {...commonProps} />;
    
    case 'recent-orders':
    case 'top-products':
    case 'notifications':
      return <ContentWidget {...commonProps} />;
    
    case 'revenue-overview':
      return <ChartWidget {...commonProps} />;
    
    case 'quick-actions':
    case 'calendar':
    case 'weather':
    case 'todo-list':
      return <ContentWidget {...commonProps} />;
    
    default:
      return <ContentWidget {...commonProps} />;
  }
}