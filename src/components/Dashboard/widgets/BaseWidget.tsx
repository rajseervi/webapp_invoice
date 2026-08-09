"use client";

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  DragIndicator,
  Fullscreen,
  ContentCopy
} from '@mui/icons-material';
import { useDraggable } from '@dnd-kit/core';
import { WidgetConfig } from '@/types/dashboard';

interface BaseWidgetProps {
  widget: WidgetConfig;
  children: React.ReactNode;
  onConfigure?: (widget: WidgetConfig) => void;
  onDelete?: (widgetId: string) => void;
  onDuplicate?: (widget: WidgetConfig) => void;
  isSelected?: boolean;
  onSelect?: (widgetId: string) => void;
}

export default function BaseWidget({
  widget,
  children,
  onConfigure,
  onDelete,
  onDuplicate,
  isSelected = false,
  onSelect
}: BaseWidgetProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: widget.id,
    data: {
      type: 'widget',
      widget
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : isSelected ? 100 : 1,
  } : {
    zIndex: isSelected ? 100 : 1,
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleConfigure = () => {
    handleMenuClose();
    onConfigure?.(widget);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete?.(widget.id);
  };

  const handleDuplicate = () => {
    handleMenuClose();
    onDuplicate?.(widget);
  };

  const handleCardClick = () => {
    onSelect?.(widget.id);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'absolute',
        left: widget.position.x,
        top: widget.position.y,
        width: widget.position.width,
        height: widget.position.height,
        cursor: isDragging ? 'grabbing' : 'default',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        border: isSelected 
          ? `2px solid ${theme.palette.primary.main}` 
          : `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        boxShadow: isSelected 
          ? theme.shadows[8]
          : isDragging 
            ? theme.shadows[12]
            : isHovered 
              ? theme.shadows[4] 
              : theme.shadows[1],
        '&:hover': {
          borderColor: isSelected 
            ? theme.palette.primary.main 
            : alpha(theme.palette.primary.main, 0.3),
        },
        opacity: isDragging ? 0.8 : 1,
        overflow: 'hidden'
      }}
    >
      {/* Widget Header */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 40,
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          alignItems: 'center',
          px: 1,
          opacity: isHovered || isSelected ? 1 : 0,
          transition: 'opacity 0.2s ease',
          zIndex: 10
        }}
      >
        {/* Drag Handle */}
        <Box
          {...listeners}
          {...attributes}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'grab',
            mr: 1,
            '&:active': {
              cursor: 'grabbing'
            }
          }}
        >
          <DragIndicator sx={{ fontSize: 16, color: 'text.secondary' }} />
        </Box>

        {/* Widget Title */}
        <Typography 
          variant="caption" 
          sx={{ 
            flex: 1, 
            fontWeight: 600,
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {widget.title}
        </Typography>

        {/* Widget Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Widget options">
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ 
                width: 24, 
                height: 24,
                '&:hover': {
                  bgcolor: alpha(theme.palette.action.hover, 0.5)
                }
              }}
            >
              <MoreVertIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Widget Content */}
      <CardContent 
        sx={{ 
          height: '100%',
          p: 2,
          pt: isHovered || isSelected ? 5 : 2,
          transition: 'padding-top 0.2s ease',
          overflow: 'auto',
          '&:last-child': {
            pb: 2
          }
        }}
      >
        {children}
      </CardContent>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            minWidth: 160,
            boxShadow: theme.shadows[8]
          }
        }}
      >
        {onConfigure && (
          <MenuItem onClick={handleConfigure}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Configure</ListItemText>
          </MenuItem>
        )}
        {onDuplicate && (
          <MenuItem onClick={handleDuplicate}>
            <ListItemIcon>
              <ContentCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Selection Indicator */}
      {isSelected && (
        <Box
          sx={{
            position: 'absolute',
            top: -1,
            left: -1,
            right: -1,
            bottom: -1,
            border: `2px solid ${theme.palette.primary.main}`,
            borderRadius: 1,
            pointerEvents: 'none',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -4,
              left: -4,
              width: 8,
              height: 8,
              bgcolor: theme.palette.primary.main,
              borderRadius: '50%'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 8,
              height: 8,
              bgcolor: theme.palette.primary.main,
              borderRadius: '50%'
            }
          }}
        />
      )}
    </Card>
  );
}