"use client";
import React, { useState, useEffect } from 'react';
import { Box, Skeleton, Paper, alpha, useTheme } from '@mui/material';

interface ProgressiveLoadingSectionProps {
  loading: boolean;
  children: React.ReactNode;
  height?: number | string;
  skeletonVariant?: 'rectangular' | 'circular' | 'text' | 'rounded';
  delay?: number; // Delay in ms before showing content
  fadeInDuration?: number; // Duration of fade-in animation in ms
}

const ProgressiveLoadingSection: React.FC<ProgressiveLoadingSectionProps> = ({
  loading,
  children,
  height = 200,
  skeletonVariant = 'rectangular',
  delay = 0,
  fadeInDuration = 300
}) => {
  const theme = useTheme();
  const [showContent, setShowContent] = useState(!delay);
  const [fadeIn, setFadeIn] = useState(!delay);

  useEffect(() => {
    if (delay) {
      const showTimer = setTimeout(() => {
        setShowContent(true);
        
        // Start fade-in animation after content is ready to be shown
        const fadeTimer = setTimeout(() => {
          setFadeIn(true);
        }, 50); // Small delay to ensure DOM update
        
        return () => clearTimeout(fadeTimer);
      }, delay);
      
      return () => clearTimeout(showTimer);
    }
  }, [delay]);

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          height: height,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: theme.palette.background.paper,
        }}
      >
        <Skeleton 
          variant={skeletonVariant} 
          width="100%" 
          height="100%" 
          sx={{ 
            borderRadius: 1,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} 
        />
      </Paper>
    );
  }

  if (!showContent) {
    return (
      <Box sx={{ height: height, visibility: 'hidden' }} />
    );
  }

  return (
    <Box
      sx={{
        opacity: fadeIn ? 1 : 0,
        transition: `opacity ${fadeInDuration}ms ease-in-out`,
        height: '100%',
      }}
    >
      {children}
    </Box>
  );
};

export default ProgressiveLoadingSection;