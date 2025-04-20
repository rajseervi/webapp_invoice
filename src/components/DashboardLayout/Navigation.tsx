"use client";
import React, { useEffect, useState } from 'react';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Collapse,
  Box,
  Tooltip,
  Badge,
  alpha,
  useTheme,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  AccountBalance as AccountBalanceIcon,
  ExpandLess,
  ExpandMore,
  Category as CategoryIcon,
  Store as StoreIcon,
  Link as LinkIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGuard from '@/components/PermissionGuard';

interface NavigationProps {
  onItemClick?: () => void;
  miniDrawer?: boolean;
  onExpandDrawer?: () => void;
}

export default function Navigation({ onItemClick, miniDrawer = false, onExpandDrawer }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userRole } = useAuth();
  const theme = useTheme();
  
  // State for expandable sections
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  
  // Check if current path is active
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  // Check if current path is in a section
  const isActiveSection = (path: string) => {
    return pathname?.startsWith(path);
  };
  
  // Handle navigation
  const handleNavigation = (path: string) => {
    router.push(path);
    if (onItemClick) {
      onItemClick();
    }
  };
  
  // Toggle inventory section
  const handleInventoryClick = () => {
    setInventoryOpen(!inventoryOpen);
  };
  
  // Toggle reports section
  const handleReportsClick = () => {
    setReportsOpen(!reportsOpen);
  };
  
  // Handle click when in mini drawer mode
  const handleMiniDrawerClick = (event: React.MouseEvent) => {
    if (miniDrawer && onExpandDrawer) {
      event.preventDefault();
      event.stopPropagation();
      onExpandDrawer();
      return true;
    }
    return false;
  };

  // Common styles for menu items
  const menuItemStyles = {
    borderRadius: 1.5,
    mb: 0.5,
    py: 1,
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      width: '3px',
      backgroundColor: 'transparent',
      transition: 'all 0.2s ease',
    },
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      '&::before': {
        backgroundColor: theme.palette.primary.main,
      },
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.12),
      },
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.main,
      },
      '& .MuiListItemText-primary': {
        fontWeight: 600,
        color: theme.palette.primary.main,
      },
    },
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
      transform: 'translateX(4px)',
      '&::before': {
        backgroundColor: alpha(theme.palette.primary.main, 0.5),
      },
    },
  };

  // Submenu item styles
  const submenuItemStyles = {
    ...menuItemStyles,
    pl: 4,
    py: 0.75,
    '&.Mui-selected': {
      ...menuItemStyles['&.Mui-selected'],
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
      },
    },
    '&::before': {
      left: '12px',
      width: '2px',
    },
  };

  const listStyles = { 
    px: miniDrawer ? 0.5 : 1.5,
    '& .MuiListItemText-root': {
      opacity: miniDrawer ? 0 : 1,
      transition: theme.transitions.create('opacity', {
        duration: theme.transitions.duration.shorter,
      }),
      whiteSpace: 'nowrap',
    },
    '& .MuiListItemIcon-root': {
      minWidth: miniDrawer ? 0 : 36,
      mr: miniDrawer ? 'auto' : 2,
      ml: miniDrawer ? 'auto' : 0,
      justifyContent: miniDrawer ? 'center' : 'flex-start',
    },
    '& .MuiListItemButton-root': {
      px: miniDrawer ? 1 : 2,
      justifyContent: miniDrawer ? 'center' : 'flex-start',
    },
    '& .MuiCollapse-root': {
      display: miniDrawer ? 'none' : 'block',
    },
    '& .MuiBadge-root': {
      '& .MuiBadge-badge': {
        right: miniDrawer ? -3 : -10,
      }
    },
    '& .MuiChip-root': {
      display: miniDrawer ? 'none' : 'flex',
    },
  };

  return (
    <List component="nav" sx={listStyles}>
      {/* Dashboard - All users */}
      <ListItem disablePadding>
        <Tooltip title={miniDrawer ? "Dashboard" : ""} placement="right" arrow>
          <ListItemButton 
            onClick={(e) => {
              if (!handleMiniDrawerClick(e)) {
                handleNavigation('/dashboard');
              }
            }}
            selected={isActive('/dashboard')}
            sx={{
              ...menuItemStyles,
              justifyContent: miniDrawer ? 'center' : 'flex-start',
            }}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Dashboard" 
              primaryTypographyProps={{ 
                fontWeight: isActive('/dashboard') ? 600 : 400 
              }}
            />
          </ListItemButton>
        </Tooltip>
      </ListItem>

      {/* Inventory - All users */}
      <ListItem disablePadding>
        <Tooltip title={miniDrawer ? "Inventory" : ""} placement="right" arrow>
          <ListItemButton 
            onClick={(e) => {
              if (!handleMiniDrawerClick(e)) {
                handleInventoryClick();
              }
            }}
            selected={isActiveSection('/inventory') || isActiveSection('/products') || isActiveSection('/categories')}
            sx={{
              ...menuItemStyles,
              justifyContent: miniDrawer ? 'center' : 'flex-start',
            }}
          >
            <ListItemIcon>
              <InventoryIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Inventory" 
              primaryTypographyProps={{ 
                fontWeight: isActiveSection('/inventory') || isActiveSection('/products') || isActiveSection('/categories') ? 600 : 400 
              }}
            />
            {inventoryOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </Tooltip>
      </ListItem>
      
      <Collapse in={inventoryOpen && !miniDrawer} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => handleNavigation('/products')}
              selected={isActive('/products')}
              sx={submenuItemStyles}
            >
              <ListItemIcon>
                <StoreIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Products" 
                primaryTypographyProps={{ 
                  fontWeight: isActive('/products') ? 600 : 400,
                  fontSize: '0.9rem'
                }}
              />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => handleNavigation('/categories')}
              selected={isActive('/categories')}
              sx={submenuItemStyles}
            >
              <ListItemIcon>
                <CategoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Categories" 
                primaryTypographyProps={{ 
                  fontWeight: isActive('/categories') ? 600 : 400,
                  fontSize: '0.9rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Collapse>

      {/* Invoices - Admin and Manager */}
      <PermissionGuard pageId="invoices">
        <ListItem disablePadding>
          <Tooltip title={miniDrawer ? "Invoices" : ""} placement="right" arrow>
            <ListItemButton 
              onClick={(e) => {
                if (!handleMiniDrawerClick(e)) {
                  handleNavigation('/invoices');
                }
              }}
              selected={isActive('/invoices')}
              sx={{
                ...menuItemStyles,
                justifyContent: miniDrawer ? 'center' : 'flex-start',
              }}
            >
              <ListItemIcon>
                <ReceiptIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Invoices" 
                primaryTypographyProps={{ 
                  fontWeight: isActive('/invoices') ? 600 : 400 
                }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </PermissionGuard>

      {/* Purchase Orders - Admin only */}
      <PermissionGuard pageId="purchase-orders">
        <ListItem disablePadding>
          <Tooltip title={miniDrawer ? "Purchase Orders" : ""} placement="right" arrow>
            <ListItemButton 
              onClick={(e) => {
                if (!handleMiniDrawerClick(e)) {
                  handleNavigation('/purchase-orders');
                }
              }}
              selected={isActive('/purchase-orders')}
              sx={{
                ...menuItemStyles,
                justifyContent: miniDrawer ? 'center' : 'flex-start',
              }}
            >
              <ListItemIcon>
                <ShoppingCartIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Purchase Orders" 
                primaryTypographyProps={{ 
                  fontWeight: isActive('/purchase-orders') ? 600 : 400 
                }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </PermissionGuard>

      {/* Parties/Customers - All users */}
      <ListItem disablePadding>
        <Tooltip title={miniDrawer ? "Customers" : ""} placement="right" arrow>
          <ListItemButton 
            onClick={(e) => {
              if (!handleMiniDrawerClick(e)) {
                handleNavigation('/parties');
              }
            }}
            selected={isActive('/parties')}
            sx={{
              ...menuItemStyles,
              justifyContent: miniDrawer ? 'center' : 'flex-start',
            }}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Customers" 
              primaryTypographyProps={{ 
                fontWeight: isActive('/parties') ? 600 : 400 
              }}
            />
          </ListItemButton>
        </Tooltip>
      </ListItem>

      {/* Reports - Admin and Manager */}
      <PermissionGuard pageId="reports">
        <ListItem disablePadding>
          <Tooltip title={miniDrawer ? "Reports" : ""} placement="right" arrow>
            <ListItemButton 
              onClick={(e) => {
                if (!handleMiniDrawerClick(e)) {
                  handleReportsClick();
                }
              }}
              selected={isActiveSection('/reports')}
              sx={{
                ...menuItemStyles,
                justifyContent: miniDrawer ? 'center' : 'flex-start',
              }}
            >
              <ListItemIcon>
                <AssessmentIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Reports" 
                primaryTypographyProps={{ 
                  fontWeight: isActiveSection('/reports') ? 600 : 400 
                }}
              />
              {reportsOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        
        <Collapse in={reportsOpen && !miniDrawer} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/reports/sales')}
                selected={isActive('/reports/sales')}
                sx={submenuItemStyles}
              >
                <ListItemIcon>
                  <AssessmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Sales Reports" 
                  primaryTypographyProps={{ 
                    fontWeight: isActive('/reports/sales') ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/reports/inventory')}
                selected={isActive('/reports/inventory')}
                sx={submenuItemStyles}
              >
                <ListItemIcon>
                  <InventoryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Inventory Reports" 
                  primaryTypographyProps={{ 
                    fontWeight: isActive('/reports/inventory') ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/reports/financial')}
                selected={isActive('/reports/financial')}
                sx={submenuItemStyles}
              >
                <ListItemIcon>
                  <AccountBalanceIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Financial Reports" 
                  primaryTypographyProps={{ 
                    fontWeight: isActive('/reports/financial') ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>
      </PermissionGuard>

      {/* Accounting - Admin and Manager */}
      <PermissionGuard pageId="accounting">
        <ListItem disablePadding>
          <Tooltip title={miniDrawer ? "Accounting" : ""} placement="right" arrow>
            <ListItemButton 
              onClick={(e) => {
                if (!handleMiniDrawerClick(e)) {
                  handleNavigation('/accounting');
                }
              }}
              selected={isActive('/accounting')}
              sx={{
                ...menuItemStyles,
                justifyContent: miniDrawer ? 'center' : 'flex-start',
              }}
            >
              <ListItemIcon>
                <AccountBalanceIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Accounting" 
                primaryTypographyProps={{ 
                  fontWeight: isActive('/accounting') ? 600 : 400 
                }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </PermissionGuard>

      <Divider sx={{ my: 1.5 }} />

      {/* Quick Links - All users */}
      <ListItem disablePadding>
        <Tooltip title={miniDrawer ? "Quick Links" : ""} placement="right" arrow>
          <ListItemButton 
            onClick={(e) => {
              if (!handleMiniDrawerClick(e)) {
                handleNavigation('/quick-links');
              }
            }}
            selected={isActive('/quick-links')}
            sx={{
              ...menuItemStyles,
              justifyContent: miniDrawer ? 'center' : 'flex-start',
            }}
          >
            <ListItemIcon>
              <LinkIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Quick Links" 
              primaryTypographyProps={{ 
                fontWeight: isActive('/quick-links') ? 600 : 400 
              }}
            />
          </ListItemButton>
        </Tooltip>
      </ListItem>

      {/* User Management - Admin only */}
      {userRole === 'admin' && (
        <ListItem disablePadding>
          <Tooltip title={miniDrawer ? "User Management" : ""} placement="right" arrow>
            <ListItemButton 
              onClick={(e) => {
                if (!handleMiniDrawerClick(e)) {
                  handleNavigation('/users');
                }
              }}
              selected={isActive('/users')}
              sx={{
                ...menuItemStyles,
                justifyContent: miniDrawer ? 'center' : 'flex-start',
              }}
            >
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText 
                primary="User Management" 
                primaryTypographyProps={{ 
                  fontWeight: isActive('/users') ? 600 : 400 
                }}
              />
              <Chip 
                label="2" 
                size="small" 
                color="warning" 
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      )}

      {/* Settings - All users */}
      <ListItem disablePadding>
        <Tooltip title={miniDrawer ? "Settings" : ""} placement="right" arrow>
          <ListItemButton 
            onClick={(e) => {
              if (!handleMiniDrawerClick(e)) {
                handleNavigation('/settings');
              }
            }}
            selected={isActive('/settings')}
            sx={{
              ...menuItemStyles,
              justifyContent: miniDrawer ? 'center' : 'flex-start',
            }}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Settings" 
              primaryTypographyProps={{ 
                fontWeight: isActive('/settings') ? 600 : 400 
              }}
            />
          </ListItemButton>
        </Tooltip>
      </ListItem>

      {/* Help & Support */}
      <ListItem disablePadding>
        <Tooltip title={miniDrawer ? "Help & Support" : ""} placement="right" arrow>
          <ListItemButton 
            onClick={(e) => {
              if (!handleMiniDrawerClick(e)) {
                handleNavigation('/help');
              }
            }}
            selected={isActive('/help')}
            sx={{
              ...menuItemStyles,
              justifyContent: miniDrawer ? 'center' : 'flex-start',
            }}
          >
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Help & Support" 
              primaryTypographyProps={{ 
                fontWeight: isActive('/help') ? 600 : 400 
              }}
            />
          </ListItemButton>
        </Tooltip>
      </ListItem>

      {/* Notifications - All users */}
      <ListItem disablePadding>
        <Tooltip title={miniDrawer ? "Notifications" : ""} placement="right" arrow>
          <ListItemButton 
            onClick={(e) => {
              if (!handleMiniDrawerClick(e)) {
                handleNavigation('/notifications');
              }
            }}
            selected={isActive('/notifications')}
            sx={{
              ...menuItemStyles,
              justifyContent: miniDrawer ? 'center' : 'flex-start',
            }}
          >
            <ListItemIcon>
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </ListItemIcon>
            <ListItemText 
              primary="Notifications" 
              primaryTypographyProps={{ 
                fontWeight: isActive('/notifications') ? 600 : 400 
              }}
            />
          </ListItemButton>
        </Tooltip>
      </ListItem>
    </List>
  );
}