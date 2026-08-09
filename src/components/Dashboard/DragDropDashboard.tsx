"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  alpha,
  Tooltip,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Menu as MenuIcon,
  Save as SaveIcon,
  FolderOpen as LoadIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Dashboard as DashboardIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
  rectIntersection
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout, WidgetConfig, WidgetType } from '@/types/dashboard';
import { DashboardService } from '@/services/dashboardService';
import WidgetLibrary from './WidgetLibrary';
import DashboardCanvas from './DashboardCanvas';
import WidgetConfigPanel from './WidgetConfigPanel';

export default function DragDropDashboard() {
  const theme = useTheme();
  const { currentUser: user } = useAuth();
  
  // State management
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [configWidget, setConfigWidget] = useState<WidgetConfig | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout | null>(null);
  const [userLayouts, setUserLayouts] = useState<DashboardLayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadMenuAnchor, setLoadMenuAnchor] = useState<null | HTMLElement>(null);
  const [layoutName, setLayoutName] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedWidget, setDraggedWidget] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load user layouts and default layout on mount
  useEffect(() => {
    if (user?.uid) {
      loadUserLayouts();
    }
  }, [user]);

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const loadUserLayouts = async () => {
    if (!user?.uid) return;
    
    try {
      setIsLoading(true);
      const layouts = await DashboardService.getUserLayouts(user.uid);
      setUserLayouts(layouts);
      
      // Load default layout or create one if none exists
      let defaultLayout = layouts.find(layout => layout.isDefault);
      
      if (!defaultLayout && layouts.length === 0) {
        // Create default layout for new users
        const layoutId = await DashboardService.createDefaultLayout(user.uid);
        defaultLayout = await DashboardService.getLayout(layoutId);
        if (defaultLayout) {
          setUserLayouts([defaultLayout]);
        }
      } else if (!defaultLayout && layouts.length > 0) {
        // Use first layout as default
        defaultLayout = layouts[0];
      }
      
      if (defaultLayout) {
        setCurrentLayout(defaultLayout);
        setWidgets(defaultLayout.widgets);
      }
    } catch (error) {
      console.error('Error loading layouts:', error);
      showNotification('Failed to load dashboard layouts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const generateWidgetId = () => {
    return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleWidgetAdd = useCallback(async (widgetType: WidgetType, position: { x: number; y: number }) => {
    const widgetId = generateWidgetId();
    
    // Get default configuration based on widget type
    const getDefaultConfig = (type: WidgetType) => {
      switch (type) {
        case 'stats-card':
          return {
            title: 'New Stat',
            value: '0',
            change: '+0%',
            changeType: 'positive',
            icon: 'trending',
            showIcon: true,
            showChange: true
          };
        case 'chart-line':
        case 'chart-bar':
        case 'chart-pie':
          return {
            title: 'New Chart',
            showLegend: true,
            showGrid: true,
            dataSource: 'sample'
          };
        default:
          return {
            title: 'New Widget',
            maxItems: 5,
            showRefresh: true
          };
      }
    };

    const getDefaultSize = (type: WidgetType) => {
      switch (type) {
        case 'stats-card':
          return { width: 300, height: 150 };
        case 'chart-line':
        case 'chart-bar':
          return { width: 400, height: 300 };
        case 'chart-pie':
          return { width: 350, height: 350 };
        case 'recent-orders':
        case 'top-products':
          return { width: 400, height: 300 };
        case 'notifications':
          return { width: 300, height: 400 };
        default:
          return { width: 300, height: 250 };
      }
    };

    const defaultSize = getDefaultSize(widgetType);
    
    const newWidget: WidgetConfig = {
      id: widgetId,
      type: widgetType,
      title: getDefaultConfig(widgetType).title,
      position: {
        x: position.x,
        y: position.y,
        ...defaultSize
      },
      config: getDefaultConfig(widgetType),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);

    // Auto-save if we have a current layout
    if (currentLayout && user?.uid) {
      try {
        await DashboardService.updateLayout(currentLayout.id, { widgets: updatedWidgets });
        showNotification('Widget added successfully', 'success');
      } catch (error) {
        console.error('Error saving widget:', error);
        showNotification('Failed to save widget', 'error');
      }
    }
  }, [widgets, currentLayout, user]);

  const handleWidgetUpdate = useCallback(async (updatedWidget: WidgetConfig) => {
    const updatedWidgets = widgets.map(widget => 
      widget.id === updatedWidget.id ? updatedWidget : widget
    );
    setWidgets(updatedWidgets);

    // Auto-save if we have a current layout
    if (currentLayout && user?.uid) {
      try {
        await DashboardService.updateLayout(currentLayout.id, { widgets: updatedWidgets });
      } catch (error) {
        console.error('Error updating widget:', error);
        showNotification('Failed to update widget', 'error');
      }
    }
  }, [widgets, currentLayout, user]);

  const handleWidgetDelete = useCallback(async (widgetId: string) => {
    const updatedWidgets = widgets.filter(widget => widget.id !== widgetId);
    setWidgets(updatedWidgets);
    
    if (selectedWidgetId === widgetId) {
      setSelectedWidgetId(null);
    }

    // Auto-save if we have a current layout
    if (currentLayout && user?.uid) {
      try {
        await DashboardService.updateLayout(currentLayout.id, { widgets: updatedWidgets });
        showNotification('Widget deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting widget:', error);
        showNotification('Failed to delete widget', 'error');
      }
    }
  }, [widgets, selectedWidgetId, currentLayout, user]);

  const handleWidgetConfigure = (widget: WidgetConfig) => {
    setConfigWidget(widget);
    setIsConfigPanelOpen(true);
  };

  const handleConfigSave = (updatedWidget: WidgetConfig) => {
    handleWidgetUpdate(updatedWidget);
    setIsConfigPanelOpen(false);
    setConfigWidget(null);
  };

  const handleSaveLayout = async () => {
    if (!user?.uid || !layoutName.trim()) return;

    try {
      if (currentLayout) {
        // Update existing layout
        await DashboardService.updateLayout(currentLayout.id, { 
          name: layoutName,
          widgets 
        });
        showNotification('Layout saved successfully', 'success');
      } else {
        // Create new layout
        const layoutId = await DashboardService.createLayout(user.uid, layoutName, widgets);
        const newLayout = await DashboardService.getLayout(layoutId);
        if (newLayout) {
          setCurrentLayout(newLayout);
          setUserLayouts(prev => [newLayout, ...prev]);
        }
        showNotification('New layout created successfully', 'success');
      }
      
      setSaveDialogOpen(false);
      setLayoutName('');
      await loadUserLayouts();
    } catch (error) {
      console.error('Error saving layout:', error);
      showNotification('Failed to save layout', 'error');
    }
  };

  const handleLoadLayout = async (layout: DashboardLayout) => {
    try {
      setCurrentLayout(layout);
      setWidgets(layout.widgets);
      setSelectedWidgetId(null);
      setLoadMenuAnchor(null);
      showNotification(`Loaded "${layout.name}" layout`, 'success');
    } catch (error) {
      console.error('Error loading layout:', error);
      showNotification('Failed to load layout', 'error');
    }
  };

  const handleRefreshLayout = async () => {
    if (currentLayout) {
      try {
        const refreshedLayout = await DashboardService.getLayout(currentLayout.id);
        if (refreshedLayout) {
          setCurrentLayout(refreshedLayout);
          setWidgets(refreshedLayout.widgets);
          showNotification('Layout refreshed', 'success');
        }
      } catch (error) {
        console.error('Error refreshing layout:', error);
        showNotification('Failed to refresh layout', 'error');
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Determine what's being dragged
    if (active.data.current?.type === 'widget') {
      setDraggedWidget(active.data.current.widget);
    } else if (active.data.current?.type === 'new-widget') {
      setDraggedWidget(active.data.current.widget);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event;
    
    setActiveId(null);
    setDraggedWidget(null);

    if (!over) return;

    const activeData = active.data.current;
    
    if (over.id === 'dashboard-canvas') {
      if (activeData?.type === 'new-widget') {
        // Adding new widget - calculate position relative to canvas
        const canvasElement = document.getElementById('dashboard-canvas');
        if (canvasElement) {
          const canvasRect = canvasElement.getBoundingClientRect();
          // Use event coordinates if available, otherwise default to center
          const pointerEvent = event.activatorEvent as any;
          const x = Math.max(0, (pointerEvent?.clientX || canvasRect.width / 2) - canvasRect.left - 150);
          const y = Math.max(0, (pointerEvent?.clientY || canvasRect.height / 2) - canvasRect.top - 75);
          
          handleWidgetAdd(activeData.widgetType, { x, y });
        }
      } else if (activeData?.type === 'widget') {
        // Moving existing widget
        const widget = activeData.widget as WidgetConfig;
        const newX = Math.max(0, widget.position.x + delta.x);
        const newY = Math.max(0, widget.position.y + delta.y);
        
        const updatedWidget: WidgetConfig = {
          ...widget,
          position: {
            ...widget.position,
            x: newX,
            y: newY
          },
          updatedAt: new Date()
        };
        
        handleWidgetUpdate(updatedWidget);
      }
    }
  }, [handleWidgetAdd, handleWidgetUpdate]);

  const renderDragOverlay = () => {
    if (!draggedWidget) return null;

    return (
      <Box
        sx={{
          width: draggedWidget.defaultSize?.width || 300,
          height: draggedWidget.defaultSize?.height || 200,
          bgcolor: 'background.paper',
          border: '2px solid',
          borderColor: 'primary.main',
          borderRadius: 1,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.8,
          boxShadow: 8
        }}
      >
        <Typography variant="h6" color="primary">
          {draggedWidget.name || draggedWidget.title}
        </Typography>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        bgcolor: 'background.default'
      }}>
        <Typography variant="h6" color="text.secondary">
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      {/* Top App Bar */}
      <AppBar 
        position="static" 
        elevation={1}
        sx={{ 
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <DashboardIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Dashboard Builder
            {currentLayout && (
              <Chip 
                label={currentLayout.name}
                size="small"
                variant="outlined"
                sx={{ ml: 2 }}
              />
            )}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh Layout">
              <IconButton onClick={handleRefreshLayout}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              startIcon={<SaveIcon />}
              onClick={() => {
                setLayoutName(currentLayout?.name || '');
                setSaveDialogOpen(true);
              }}
              variant="outlined"
              size="small"
            >
              Save
            </Button>
            
            <Button
              startIcon={<LoadIcon />}
              onClick={(e) => setLoadMenuAnchor(e.currentTarget)}
              variant="outlined"
              size="small"
            >
              Load
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Widget Library Sidebar */}
          {isLibraryOpen && (
            <WidgetLibrary 
              isOpen={isLibraryOpen}
              onToggle={() => setIsLibraryOpen(!isLibraryOpen)}
            />
          )}

          {/* Dashboard Canvas */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <DashboardCanvas
              widgets={widgets}
              onWidgetAdd={handleWidgetAdd}
              onWidgetUpdate={handleWidgetUpdate}
              onWidgetDelete={handleWidgetDelete}
              onWidgetSelect={setSelectedWidgetId}
              selectedWidgetId={selectedWidgetId}
              onWidgetConfigure={handleWidgetConfigure}
            />
          </Box>

          {/* Widget Configuration Panel */}
          <WidgetConfigPanel
            widget={configWidget}
            isOpen={isConfigPanelOpen}
            onClose={() => {
              setIsConfigPanelOpen(false);
              setConfigWidget(null);
            }}
            onSave={handleConfigSave}
          />
        </Box>

        <DragOverlay>
          {renderDragOverlay()}
        </DragOverlay>
      </DndContext>

      {/* Save Layout Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Dashboard Layout</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Layout Name"
            fullWidth
            variant="outlined"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveLayout} variant="contained" disabled={!layoutName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Load Layout Menu */}
      <Menu
        anchorEl={loadMenuAnchor}
        open={Boolean(loadMenuAnchor)}
        onClose={() => setLoadMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 250 } }}
      >
        {userLayouts.length === 0 ? (
          <MenuItem disabled>No saved layouts</MenuItem>
        ) : (
          userLayouts.map((layout) => (
            <MenuItem 
              key={layout.id} 
              onClick={() => handleLoadLayout(layout)}
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography variant="body2">{layout.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {layout.widgets.length} widgets
                </Typography>
              </Box>
              {layout.isDefault && (
                <Chip label="Default" size="small" color="primary" />
              )}
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}