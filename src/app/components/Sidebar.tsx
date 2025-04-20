"use client";
import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandLess,
  ExpandMore,
  BarChart as BarChartIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Payments as PaymentsIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

// Define sidebar width
const DRAWER_WIDTH = 240;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
}

interface SidebarItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  children?: SidebarItem[];
}

const Sidebar = ({ open, onClose, variant = 'temporary' }: SidebarProps) => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Track which nested menus are open
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    sales: false,
    inventory: false
  });

  // Toggle nested menu
  const handleToggleMenu = (menu: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  // Define sidebar items with nested structure
  const sidebarItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />
    },
    {
      title: 'Sales',
      path: '#',
      icon: <BarChartIcon />,
      children: [
        {
          title: 'Invoices',
          path: '/invoices',
          icon: <ReceiptIcon />
        },
        {
          title: 'Payments',
          path: '/payments',
          icon: <PaymentsIcon />
        },
        {
          title: 'Customers',
          path: '/parties',
          icon: <PeopleIcon />
        }
      ]
    },
    {
      title: 'Inventory',
      path: '#',
      icon: <InventoryIcon />,
      children: [
        {
          title: 'Products',
          path: '/products',
          icon: <ShoppingCartIcon />
        },
        {
          title: 'Suppliers',
          path: '/suppliers',
          icon: <LocalShippingIcon />
        }
      ]
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: <SettingsIcon />
    },
    {
      title: 'Profile',
      path: '/profile',
      icon: <AccountCircleIcon />
    }
  ];

  // Check if a path is active
  const isActive = (path: string) => {
    if (path === '#') return false;
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  // Render sidebar items recursively
  const renderSidebarItems = (items: SidebarItem[]) => {
    return items.map((item) => {
      const active = isActive(item.path);
      
      // If item has children, render a collapsible menu
      if (item.children) {
        const menuOpen = openMenus[item.title.toLowerCase()];
        
        return (
          <React.Fragment key={item.title}>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleToggleMenu(item.title.toLowerCase())}
                sx={{ 
                  py: 1.5,
                  '&:hover': {
                    bgcolor: `${theme.palette.primary.main}10`,
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: menuOpen ? theme.palette.primary.main : 'inherit'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.title} 
                  primaryTypographyProps={{ 
                    fontWeight: menuOpen ? 600 : 400,
                    color: menuOpen ? theme.palette.primary.main : 'inherit'
                  }}
                />
                {menuOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            
            <Collapse in={menuOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.children.map((child) => {
                  const childActive = isActive(child.path);
                  
                  return (
                    <ListItem key={child.title} disablePadding>
                      <ListItemButton 
                        component={Link}
                        href={child.path}
                        sx={{ 
                          pl: 4,
                          py: 1.25,
                          bgcolor: childActive ? `${theme.palette.primary.main}10` : 'transparent',
                          '&:hover': {
                            bgcolor: childActive 
                              ? `${theme.palette.primary.main}20`
                              : `${theme.palette.primary.main}10`,
                          }
                        }}
                      >
                        <ListItemIcon sx={{ 
                          minWidth: 40,
                          color: childActive ? theme.palette.primary.main : 'inherit'
                        }}>
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={child.title} 
                          primaryTypographyProps={{ 
                            fontWeight: childActive ? 600 : 400,
                            color: childActive ? theme.palette.primary.main : 'inherit'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </React.Fragment>
        );
      }
      
      // Regular menu item without children
      return (
        <ListItem key={item.title} disablePadding>
          <ListItemButton 
            component={Link}
            href={item.path}
            sx={{ 
              py: 1.5,
              bgcolor: active ? `${theme.palette.primary.main}10` : 'transparent',
              '&:hover': {
                bgcolor: active 
                  ? `${theme.palette.primary.main}20`
                  : `${theme.palette.primary.main}10`,
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 40,
              color: active ? theme.palette.primary.main : 'inherit'
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.title} 
              primaryTypographyProps={{ 
                fontWeight: active ? 600 : 400,
                color: active ? theme.palette.primary.main : 'inherit'
              }}
            />
          </ListItemButton>
        </ListItem>
      );
    });
  };

  const drawerContent = (
    <>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2
      }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          Mastermind
        </Typography>
        {isMobile && (
          <IconButton onClick={onClose}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />
      <List sx={{ pt: 1 }}>
        {renderSidebarItems(sidebarItems)}
      </List>
    </>
  );

  return (
    <>
      {/* Mobile drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              boxShadow: 3
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        // Desktop drawer
        <Drawer
          variant={variant}
          open={open}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;