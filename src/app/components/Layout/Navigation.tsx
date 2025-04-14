import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Chip,
  Box,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Group as UsersIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/') {
      return true;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  
  const mainMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  ];

  const inventoryItems = [
    { text: 'Products', icon: <InventoryIcon />, path: '/products' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/categories' },
  ];
  
  const salesItems = [
    { text: 'Parties', icon: <PeopleIcon />, path: '/parties' },
    { text: 'Invoices', icon: <ReceiptIcon />, path: '/invoices' },
  ];

  const reportItems = [
    { text: 'Sales Report', icon: <ReceiptIcon />, path: '/reports/sales' },
    { text: 'User Report', icon: <UsersIcon />, path: '/reports/users' },
  ];

  const adminItems = [
    { text: 'Users', icon: <UsersIcon />, path: '/users' },
  ];

  interface MenuItem {
    text: string;
    icon: React.ReactNode;
    path: string;
    isNew?: boolean;
  }

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item) => (
      <ListItem key={item.text} disablePadding>
        <Link href={item.path} style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
          <ListItemButton selected={isActive(item.path)}>
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
            {item.isNew && (
              <Chip 
                label="New" 
                color="primary" 
                size="small" 
                sx={{ height: 20, fontSize: '0.625rem' }}
              />
            )}
          </ListItemButton>
        </Link>
      </ListItem>
    ));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <List>
        {renderMenuItems(mainMenuItems)}
      </List>
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight="bold">
          INVENTORY
        </Typography>
      </Box>
      
      <List>
        {renderMenuItems(inventoryItems)}
      </List>
      
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight="bold">
          SALES
        </Typography>
      </Box>
      
      <List>
        {renderMenuItems(salesItems)}
      </List>

      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight="bold">
          REPORTS
        </Typography>
      </Box>

      <List>
        {renderMenuItems(reportItems)}
      </List>

      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight="bold">
          ADMINISTRATION
        </Typography>
      </Box>

      <List>
        {renderMenuItems(adminItems)}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider />
      
      <List>
        <ListItem disablePadding>
          <Link href="/settings" style={{ textDecoration: 'none', width: '100%', color: 'inherit' }}>
            <ListItemButton selected={isActive('/settings')}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </Link>
        </ListItem>
      </List>
    </Box>
  );
}