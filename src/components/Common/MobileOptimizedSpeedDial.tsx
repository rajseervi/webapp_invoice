'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  useTheme,
  useMediaQuery,
  alpha,
  Backdrop,
  Fab,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Close as CloseIcon, MoreVert as MoreVertIcon, SwipeUp as SwipeUpIcon } from '@mui/icons-material';

export interface SpeedDialActionConfig {
  icon: React.ReactNode;
  name: string;
  onClick: () => void;
  color?: string;
  badge?: number | string;
  disabled?: boolean;
}

export interface MobileOptimizedSpeedDialProps {
  actions: SpeedDialActionConfig[];
  ariaLabel?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  hidden?: boolean;
  fabSize?: 'small' | 'medium' | 'large';
  position?: {
    bottom?: string | number;
    right?: string | number;
    top?: string | number;
    left?: string | number;
  };
  icon?: React.ReactNode;
  customFabStyles?: object;
  customActionStyles?: object;
  enableHaptics?: boolean;
  showActionLabels?: boolean;
  expandOnHover?: boolean;
  closeOnAction?: boolean;
  backdropBlur?: boolean;
}

export default function MobileOptimizedSpeedDial({
  actions,
  ariaLabel = 'Speed Dial Actions',
  direction = 'up',
  hidden = false,
  fabSize,
  position,
  icon,
  customFabStyles = {},
  customActionStyles = {},
  enableHaptics = true,
  showActionLabels = true,
  expandOnHover = false,
  closeOnAction = true,
  backdropBlur = true,
}: MobileOptimizedSpeedDialProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const fabRef = useRef<HTMLButtonElement>(null);
  
  // Determine fab size based on screen size if not provided
  const effectiveFabSize = fabSize || (isSmall ? 'medium' : isMobile ? 'medium' : 'large');
  
  // Default position with mobile safe area consideration
  const defaultPosition = {
    bottom: 'calc(env(safe-area-inset-bottom) + 80px)',
    right: 16,
    ...position
  };

  // Haptic feedback function
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (enableHaptics && 'navigator' in window && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [enableHaptics]);

  // Handle touch events for swipe gesture and drag functionality
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    setDragPosition({ x: touch.clientX, y: touch.clientY });
    triggerHaptic('light');
  }, [isMobile, triggerHaptic]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragPosition.x;
    const deltaY = touch.clientY - dragPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // If speed dial is closed and user swipes up significantly, open it
    if (!open && deltaY < -30 && Math.abs(deltaX) < 50) {
      setOpen(true);
      triggerHaptic('medium');
      return;
    }
    
    // Handle dragging when open
    if (open && distance > 10) {
      setIsDragging(true);
    }
  }, [isMobile, open, dragPosition, triggerHaptic]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      triggerHaptic('medium');
    }
  }, [isDragging, triggerHaptic]);

  // Handle action click with optional haptics and auto-close
  const handleActionClick = useCallback((action: SpeedDialActionConfig) => {
    if (enableHaptics) {
      triggerHaptic('medium');
    }
    
    action.onClick();
    
    if (closeOnAction) {
      setOpen(false);
    }
  }, [enableHaptics, triggerHaptic, closeOnAction]);

  // Handle fab click/open
  const handleOpen = useCallback(() => {
    setOpen(true);
    triggerHaptic('light');
  }, [triggerHaptic]);

  const handleClose = useCallback(() => {
    setOpen(false);
    triggerHaptic('light');
  }, [triggerHaptic]);

  // Auto-expand on hover for desktop
  useEffect(() => {
    if (expandOnHover && !isMobile) {
      const fab = fabRef.current;
      if (fab) {
        const handleMouseEnter = () => setOpen(true);
        const handleMouseLeave = () => setOpen(false);
        
        fab.addEventListener('mouseenter', handleMouseEnter);
        fab.addEventListener('mouseleave', handleMouseLeave);
        
        return () => {
          fab.removeEventListener('mouseenter', handleMouseEnter);
          fab.removeEventListener('mouseleave', handleMouseLeave);
        };
      }
    }
  }, [expandOnHover, isMobile]);

  if (hidden) {
    return null;
  }

  const fabMotion = {
    scale: isDragging ? 0.95 : 1,
    transition: { type: 'spring', stiffness: 400, damping: 30 }
  };

  const backdropMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  };

  return (
    <>
      {/* Custom Backdrop for mobile */}
      <AnimatePresence>
        {open && isMobile && backdropBlur && (
          <motion.div
            {...backdropMotion}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: alpha(theme.palette.common.black, 0.3),
              backdropFilter: 'blur(8px)',
              zIndex: theme.zIndex.speedDial - 1,
            }}
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      {/* Speed Dial with enhanced mobile features */}
      <SpeedDial
        ariaLabel={ariaLabel}
        open={open}
        onOpen={handleOpen}
        onClose={handleClose}
        direction={direction}
        ref={fabRef}
        sx={{
          position: 'fixed',
          zIndex: theme.zIndex.speedDial,
          bottom: defaultPosition.bottom,
          right: defaultPosition.right,
          top: defaultPosition.top,
          left: defaultPosition.left,
          '& .MuiSpeedDial-fab': {
            width: { 
              xs: effectiveFabSize === 'small' ? 48 : 56, 
              sm: effectiveFabSize === 'large' ? 64 : 56 
            },
            height: { 
              xs: effectiveFabSize === 'small' ? 48 : 56, 
              sm: effectiveFabSize === 'large' ? 64 : 56 
            },
            background: `linear-gradient(135deg, 
              ${theme.palette.primary.main} 0%, 
              ${theme.palette.secondary.main} 100%)`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            transition: theme.transitions.create([
              'transform', 
              'box-shadow', 
              'background'
            ], {
              duration: theme.transitions.duration.short,
              easing: theme.transitions.easing.easeInOut,
            }),
            '&:hover': {
              background: `linear-gradient(135deg, 
                ${theme.palette.primary.dark} 0%, 
                ${theme.palette.secondary.dark} 100%)`,
              transform: 'scale(1.1)',
              boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
            },
            '&:active': {
              transform: 'scale(0.95)',
              transition: theme.transitions.create('transform', {
                duration: theme.transitions.duration.shortest,
              }),
            },
            // Enhanced touch area for mobile
            ...(isMobile && {
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -8,
                left: -8,
                right: -8,
                bottom: -8,
                borderRadius: '50%',
                zIndex: -1,
              },
            }),
            ...customFabStyles,
          },
          // Mobile-specific improvements
          ...(isMobile && {
            '& .MuiSpeedDial-actions': {
              paddingBottom: 8,
            },
          }),
        }}
        icon={icon || <SpeedDialIcon />}
        FabProps={{
          size: effectiveFabSize,
          onTouchStart: handleTouchStart,
          onTouchMove: handleTouchMove,
          onTouchEnd: handleTouchEnd,
        }}
      >
        {actions.map((action, index) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={showActionLabels ? action.name : ''}
            onClick={() => handleActionClick(action)}
            tooltipOpen={showActionLabels && !isMobile}
            disabled={action.disabled}
            TooltipProps={{ 
              placement: direction === 'up' ? 'left' : direction === 'down' ? 'left' : direction === 'left' ? 'top' : 'bottom',
              enterDelay: isMobile ? 0 : 200,
              enterTouchDelay: 100,
              sx: {
                '& .MuiTooltip-tooltip': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  color: theme.palette.text.primary,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`,
                },
              },
            }}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                width: { xs: isSmall ? 44 : 48, sm: 56 },
                height: { xs: isSmall ? 44 : 48, sm: 56 },
                minHeight: { xs: isSmall ? 44 : 48, sm: 56 },
                background: `linear-gradient(135deg, 
                  ${alpha(action.color || theme.palette.primary.main, 0.9)} 0%, 
                  ${alpha(action.color || theme.palette.secondary.main, 0.7)} 100%)`,
                boxShadow: `0 4px 16px ${alpha(action.color || theme.palette.primary.main, 0.3)}`,
                backdropFilter: 'blur(8px)',
                border: `1px solid ${alpha(action.color || theme.palette.primary.main, 0.3)}`,
                marginBottom: index === 0 ? (isMobile ? 0.5 : 1) : 0.5,
                transition: theme.transitions.create([
                  'transform', 
                  'box-shadow', 
                  'background'
                ], {
                  duration: theme.transitions.duration.short,
                  easing: theme.transitions.easing.easeInOut,
                }),
                '&:hover': {
                  transform: 'scale(1.1)',
                  background: `linear-gradient(135deg, 
                    ${action.color || theme.palette.primary.main} 0%, 
                    ${alpha(action.color || theme.palette.secondary.main, 0.9)} 100%)`,
                  boxShadow: `0 6px 24px ${alpha(action.color || theme.palette.primary.main, 0.4)}`,
                },
                '&:active': {
                  transform: 'scale(0.95)',
                  transition: theme.transitions.create('transform', {
                    duration: theme.transitions.duration.shortest,
                  }),
                },
                '&.Mui-disabled': {
                  background: alpha(theme.palette.action.disabled, 0.3),
                  color: theme.palette.action.disabled,
                  boxShadow: 'none',
                },
                ...(action.disabled && {
                  opacity: 0.6,
                  pointerEvents: 'none',
                }),
                // Enhanced touch area for mobile actions
                ...(isMobile && {
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -4,
                    left: -4,
                    right: -4,
                    bottom: -4,
                    borderRadius: '50%',
                    zIndex: -1,
                  },
                }),
              },
              // Mobile-specific label styling
              '& .MuiSpeedDialAction-staticTooltipLabel': {
                backgroundColor: alpha(theme.palette.background.paper, 0.95),
                color: theme.palette.text.primary,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                borderRadius: theme.shape.borderRadius,
                padding: isMobile ? '6px 10px' : '8px 12px',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                fontWeight: 500,
                boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`,
                whiteSpace: 'nowrap',
                minWidth: 'auto',
                maxWidth: isMobile ? '120px' : 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
              // Badge styling
              ...(action.badge && {
                position: 'relative',
                '&::after': {
                  content: `"${action.badge}"`,
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: theme.palette.error.main,
                  color: theme.palette.error.contrastText,
                  borderRadius: '50%',
                  width: isMobile ? 18 : 20,
                  height: isMobile ? 18 : 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: 'bold',
                  zIndex: 1,
                  border: `2px solid ${theme.palette.background.default}`,
                  minWidth: isMobile ? 18 : 20,
                  minHeight: isMobile ? 18 : 20,
                },
              }),
              ...customActionStyles,
            }}
          />
        ))}
      </SpeedDial>
    </>
  );
}

// Hook for managing SpeedDial state
export function useSpeedDial(initialOpen = false) {
  const [open, setOpen] = React.useState(initialOpen);

  const handleOpen = React.useCallback(() => setOpen(true), []);
  const handleClose = React.useCallback(() => setOpen(false), []);
  const handleToggle = React.useCallback(() => setOpen(prev => !prev), []);

  return {
    open,
    handleOpen,
    handleClose,
    handleToggle,
    setOpen
  };
}