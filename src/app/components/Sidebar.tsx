"use client";
import React, { useState, useEffect } from 'react';
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
  Collapse,
  Badge,
  Tooltip,
  Avatar,
  Button
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
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Define sidebar width
const DRAWER_WIDTH = 240;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'persistent' | 'temporary';
  sidebarItems: SidebarItem[];
}

interface SidebarItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  children?: SidebarItem[];
  notificationCount?: number; // Added for badge example
}

const Sidebar = ({ open, onClose, variant = 'temporary' }: SidebarProps) => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    sales: false,
    inventory: false,
  });

  const handleToggleMenu = (menu: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const isActive = (path: string) => {
    if (path === '#') return false;
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  // Consolidated and correctly scoped renderIcon function
  const renderStyledIcon = (icon: React.ReactNode, active: boolean, isMotion: boolean = false) => {
    const iconBox = (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 1,
        bgcolor: active ? `${theme.palette.primary.main}15` : 'transparent',
        color: active ? theme.palette.primary.main : 'inherit',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'scale(1.05)', // Kept hover effect from one of the versions
          bgcolor: active ? `${theme.palette.primary.main}25` : `${theme.palette.action.hover}`
        }
      }}>
        {icon}
      </Box>
    );

    if (isMotion) {
      return (
        <motion.div
          whileHover={{ scale: 1.1 }} // Framer motion effect
          whileTap={{ scale: 0.95 }}
        >
          {iconBox}
        </motion.div>
      );
    }
    return iconBox;
  };
  
  // For primary navigation items (like Dashboard) - moved inside
  const PrimaryIcon = ({ icon, active }: { icon: React.ReactNode, active: boolean }) => (
    <Box sx={{
      position: 'relative',
      width: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '&::before': active ? {
        content: '""',
        position: 'absolute',
        inset: 0,
        borderRadius: 1,
        padding: '2px',
        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
      } : {}
    }}>
      {icon}
    </Box>
  );

  // Create a custom icon component - moved inside
  const CustomSvgIcon = ({ path, active }: { path: string, active: boolean }) => (
    <Box sx={{
      width: 24,
      height: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: active ? theme.palette.primary.main : 'inherit',
    }}>
      <img 
        src={path} 
        alt="icon" 
        style={{ 
          width: '100%', 
          height: '100%',
          filter: active ? 'none' : theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
        }} 
      />
    </Box>
  );



  const renderSidebarItems = (items: SidebarItem[]) => {
    return items?.map((item) => {
      const active = isActive(item.path);
      const isParentActive = item.children?.some(child => isActive(child.path));
      const menuOpen = openMenus[item.title.toLowerCase()];

      if (item.children) {
        return (
          <React.Fragment key={item.title}>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleToggleMenu(item.title.toLowerCase())}
                sx={{ 
                  py: 1.5,
                  bgcolor: menuOpen || isParentActive ? `${theme.palette.action.selected}` : 'transparent',
                  '&:hover': {
                    bgcolor: `${theme.palette.action.hover}`,
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: menuOpen || isParentActive ? theme.palette.primary.main : 'inherit'
                }}>
                  {/* Use the icon directly from sidebarItems which is already styled */}
                  {item.icon} 
                </ListItemIcon>
                <ListItemText 
                  primary={item.title} 
                  primaryTypographyProps={{ 
                    fontWeight: menuOpen || isParentActive ? 600 : 400,
                    color: menuOpen || isParentActive ? theme.palette.primary.main : 'inherit'
                  }}
                />
                {menuOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            
            <Collapse in={menuOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ pl: 2 }}>
                {item.children.map((child) => {
                  const childActive = isActive(child.path);
                  return (
                    <ListItem key={child.title} disablePadding>
                       <Tooltip title={child.title} placement="right" arrow disableHoverListener={open} >
                        <ListItemButton 
                          component={Link}
                          href={child.path}
                          sx={{ 
                            pl: 2, // Adjusted padding for children
                            py: 1.25,
                            bgcolor: childActive ? `${theme.palette.primary.main}1A` : 'transparent',
                            borderRadius: 1,
                            my: 0.5,
                            '&:hover': {
                              bgcolor: childActive 
                                ? `${theme.palette.primary.main}30`
                                : `${theme.palette.action.hover}`,
                            }
                          }}
                        >
                          <ListItemIcon sx={{ 
                            minWidth: 35, // Slightly smaller for children
                            color: childActive ? theme.palette.primary.main : 'inherit'
                          }}>
                            {/* Use the icon from child item, already styled */}
                            {/* If child.icon is not pre-styled, call renderStyledIcon here */}
                            {/* e.g. child.icon or renderStyledIcon(THE_ICON_COMPONENT, childActive) */} 
                            {child.icon} 
                          </ListItemIcon>
                          <ListItemText 
                            primary={child.title} 
                            primaryTypographyProps={{ 
                              fontWeight: childActive ? 600 : 400,
                              color: childActive ? theme.palette.primary.main : 'inherit'
                            }}
                          />
                           {/* Example of using Badge for child items */}
                           {child.notificationCount && child.notificationCount > 0 && (
                            <Badge badgeContent={child.notificationCount} color="error" sx={{ ml: 'auto', mr: 1}} />
                          )}
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </React.Fragment>
        );
      }
      
      return (
        <ListItem key={item.title} disablePadding>
          <Tooltip title={item.title} placement="right" arrow disableHoverListener={open}>
            <ListItemButton 
              component={Link}
              href={item.path}
              sx={{ 
                py: 1.5,
                bgcolor: active ? `${theme.palette.primary.main}1A` : 'transparent',
                borderRadius: 1,
                my: 0.5,
                '&:hover': {
                  bgcolor: active 
                    ? `${theme.palette.primary.main}30`
                    : `${theme.palette.action.hover}`,
                }
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40,
                color: active ? theme.palette.primary.main : 'inherit'
              }}>
                {/* Use the icon from item, already styled */}
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.title} 
                primaryTypographyProps={{ 
                  fontWeight: active ? 600 : 400,
                  color: active ? theme.palette.primary.main : 'inherit'
                }}
              />
              {/* Example of using Badge for top-level items */}
              {item.notificationCount && item.notificationCount > 0 && (
                <Badge badgeContent={item.notificationCount} color="error" sx={{ ml: 'auto', mr: 1}} />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      );
    });
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: theme.palette.primary.main,
              mr: 1.5
            }}
          >
            M
          </Avatar>
          <Typography variant="h6" fontWeight="bold" color="primary">
            Mastermind
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={onClose}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <Divider />
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}> {/* Added padding for better spacing */}
        <List sx={{ pt: 1, px: 1 }}> {/* Added padding to list */}
          {renderSidebarItems(sidebarItems)}
        </List>
      </Box>
      {/* User Info / Logout Footer */}
      <Box sx={{ 
        p: 2, 
        mt: 'auto', 
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: theme.palette.primary.main }}>
            <AccountCircleIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">John Doe</Typography>
            <Typography variant="caption" color="text.secondary">Administrator</Typography>
          </Box>
        </Box>
        <Button 
          variant="outlined" 
          color="primary" 
          fullWidth 
          startIcon={<LogoutIcon />}
          size="small"
          sx={{ borderRadius: 2 }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              boxShadow: theme.shadows[3],
              bgcolor: theme.palette.background.default // Ensure consistent background
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant={variant} // Use the variant prop passed from DashboardLayout
          open={open} // Controlled by DashboardLayout state
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              bgcolor: theme.palette.background.default, // Ensure consistent background
              position: 'relative', // Ensure it's part of the layout flow
              height: '100%'
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