"use client";
import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationProps {
  onItemClick?: () => void;
  miniDrawer?: boolean;
  onExpandDrawer?: () => void;
}

export default function SimpleNavigation({ onItemClick, miniDrawer = false, onExpandDrawer }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  
  // Check if current path is active
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  // Handle navigation
  const handleNavigation = (path: string) => {
    router.push(path);
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <List component="nav">
      <ListItem disablePadding>
        <ListItemButton 
          onClick={() => handleNavigation('/dashboard')}
          selected={isActive('/dashboard')}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
      </ListItem>
    </List>
  );
}