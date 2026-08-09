"use client";

import React, { useState, useCallback } from 'react';
import {
  Box,
  useTheme,
  alpha,
  Typography,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';

import { useDroppable } from '@dnd-kit/core';
import { WidgetConfig, WidgetDefinition, DragItem } from '@/types/dashboard';
import WidgetRenderer from './WidgetRenderer';
import { GridOn, GridOff } from '@mui/icons-material';

interface DashboardCanvasProps {
  widgets: WidgetConfig[];
  onWidgetAdd: (widgetType: string, position: { x: number; y: number }) => void;
  onWidgetUpdate: (widget: WidgetConfig) => void;
  onWidgetDelete: (widgetId: string) => void;
  onWidgetSelect: (widgetId: string | null) => void;
  selectedWidgetId: string | null;
  onWidgetConfigure: (widget: WidgetConfig) => void;
}

interface DroppableCanvasProps {
  children: React.ReactNode;
  showGrid: boolean;
}

function DroppableCanvas({ children, showGrid }: DroppableCanvasProps) {
  const theme = useTheme();
  const { setNodeRef, isOver } = useDroppable({
    id: 'dashboard-canvas'
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '600px',
        bgcolor: isOver ? alpha(theme.palette.primary.main, 0.05) : 'background.default',
        backgroundImage: showGrid ? `
          linear-gradient(${alpha(theme.palette.divider, 0.1)} 1px, transparent 1px),
          linear-gradient(90deg, ${alpha(theme.palette.divider, 0.1)} 1px, transparent 1px)
        ` : 'none',
        backgroundSize: showGrid ? '20px 20px' : 'none',
        transition: 'all 0.2s ease',
        overflow: 'hidden'
      }}
    >
      {children}
      
      {/* Drop Zone Indicator */}
      {isOver && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: `2px dashed ${theme.palette.primary.main}`,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <Paper
            elevation={4}
            sx={{
              p: 3,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.primary.main}`,
              borderRadius: 2
            }}
          >
            <Typography variant="h6" color="primary" align="center">
              Drop widget here
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Release to add widget to dashboard
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default function DashboardCanvas({
  widgets,
  onWidgetAdd,
  onWidgetUpdate,
  onWidgetDelete,
  onWidgetSelect,
  selectedWidgetId,
  onWidgetConfigure
}: DashboardCanvasProps) {
  const theme = useTheme();
  const [showGrid, setShowGrid] = useState(true);

  const handleWidgetDuplicate = useCallback((widget: WidgetConfig) => {
    const newPosition = {
      x: widget.position.x + 20,
      y: widget.position.y + 20
    };
    
    onWidgetAdd(widget.type, newPosition);
  }, [onWidgetAdd]);

  return (
    <Box sx={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      {/* Canvas Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 100,
          display: 'flex',
          gap: 1
        }}
      >
        <Tooltip title={showGrid ? 'Hide Grid' : 'Show Grid'}>
          <IconButton
            onClick={() => setShowGrid(!showGrid)}
            sx={{
              bgcolor: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(8px)',
              '&:hover': {
                bgcolor: alpha(theme.palette.background.paper, 1)
              }
            }}
          >
            {showGrid ? <GridOff /> : <GridOn />}
          </IconButton>
        </Tooltip>
      </Box>

      <DroppableCanvas showGrid={showGrid}>
        <div id="dashboard-canvas" style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* Empty State */}
          {widgets.length === 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: 'text.secondary'
              }}
            >
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 300 }}>
                Your dashboard is empty
              </Typography>
              <Typography variant="body1">
                Drag widgets from the library to get started
              </Typography>
            </Box>
          )}

          {/* Render Widgets */}
          {widgets.map((widget) => (
            <WidgetRenderer
              key={widget.id}
              widget={widget}
              onConfigure={onWidgetConfigure}
              onDelete={onWidgetDelete}
              onDuplicate={handleWidgetDuplicate}
              isSelected={selectedWidgetId === widget.id}
              onSelect={onWidgetSelect}
            />
          ))}
        </div>
      </DroppableCanvas>
    </Box>
  );
}