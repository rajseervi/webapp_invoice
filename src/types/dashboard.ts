export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
}

export type WidgetType = 
  | 'stats-card'
  | 'chart-line'
  | 'chart-bar'
  | 'chart-pie'
  | 'recent-orders'
  | 'top-products'
  | 'revenue-overview'
  | 'quick-actions'
  | 'notifications'
  | 'calendar'
  | 'weather'
  | 'todo-list';

export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  defaultSize: {
    width: number;
    height: number;
  };
  minSize: {
    width: number;
    height: number;
  };
  maxSize?: {
    width: number;
    height: number;
  };
  configurable: boolean;
  category: 'analytics' | 'productivity' | 'content' | 'actions';
}

export interface WidgetConfigOptions {
  colors?: string[];
  dataSources?: string[];
  chartTypes?: string[];
  refreshIntervals?: number[];
  displayOptions?: Record<string, any>;
}

export interface DragItem {
  id: string;
  type: 'widget' | 'new-widget';
  widgetType?: WidgetType;
  position?: WidgetPosition;
}

export interface DropResult {
  id: string;
  position: WidgetPosition;
}