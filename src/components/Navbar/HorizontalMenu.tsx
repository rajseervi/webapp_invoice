"use client";
import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText, 
  Divider,
  Tooltip,
  Badge,
  alpha,
  useTheme,
  Grow,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Category as CategoryIcon,
  Store as StoreIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Payments as PaymentsIcon,
  LocalShipping as LocalShippingIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Security as SecurityIcon,
  Tune as TuneIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Info as InfoIcon,
  ContactSupport as ContactSupportIcon,
  MenuBook as MenuBookIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { AppRoutes } from '@/config/routes'; // Assuming the config file path

interface MenuItemType {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number | null;
  permission?: string;
  children?: MenuItemType[];
  isNew?: boolean;
}

interface MenuCategoryType {
  title: string;
  items: MenuItemType[];
}

interface HorizontalMenuProps {
  onItemClick?: () => void;
}

export default function HorizontalMenu({ onItemClick }: HorizontalMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userRole, hasPermission } = useAuth();
  const theme = useTheme();
  
  // State for open dropdown menus
  const [openMenus, setOpenMenus] = useState<Record<string, HTMLElement | null>>({});
  
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
    // Close all menus
    handleCloseAllMenus();
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, menuId: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: event.currentTarget
    }));
  };
  
  // Handle menu close
  const handleMenuClose = (menuId: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: null
    }));
  };
  
  // Handle close all menus
  const handleCloseAllMenus = () => {
    setOpenMenus({});
  };
  
  // Define menu categories based on user role
  const getMenuCategories = (): MenuCategoryType[] => {
    // Base menu items for all users
    const baseMenuItems: MenuCategoryType[] = [
      {
        title: "Main",
        items: [
          {
            title: "Dashboard",
            path: AppRoutes.DASHBOARD, // Use constant here
            icon: <DashboardIcon fontSize="small" />
          }
        ]
      },
      {
        title: "Sales",
        items: [
          {
            title: "Orders",
            path: AppRoutes.ORDERS, // Use constant here
            icon: <ShoppingCartIcon fontSize="small" />,
            children: [
              {
                title: "All Orders",
                path: AppRoutes.ORDERS, // Use constant here
                icon: <ShoppingCartIcon fontSize="small" />
              },
              {
                title: "Create Order",
                path: AppRoutes.NEW_ORDER, // Use constant here
                icon: <ShoppingCartIcon fontSize="small" />
              }
            ]
          },
          {
            title: "Invoices",
            path: AppRoutes.INVOICES, // Use constant here
            icon: <ReceiptIcon fontSize="small" />,
            badge: 5,
            children: [
              {
                title: "All Invoices",
                path: AppRoutes.INVOICES, // Use constant here
                icon: <ReceiptIcon fontSize="small" />
              },
              {
                title: "Create Invoice",
                path: AppRoutes.NEW_INVOICE, // Use constant here
                icon: <ReceiptIcon fontSize="small" />
              }
            ]
          },
          {
            title: "Customers",
            path: AppRoutes.PARTIES, // Use constant here
            icon: <PeopleIcon fontSize="small" />
          }
        ]
      },
      {
        title: "Inventory",
        items: [
          {
            title: "Products",
            path: AppRoutes.PRODUCTS, // Use constant here
            icon: <StoreIcon fontSize="small" />
          },
          {
            title: "Categories",
            path: AppRoutes.CATEGORIES, // Use constant here
            icon: <CategoryIcon fontSize="small" />
          }
        ]
      }
    ];
    
    // Admin-specific menu items
    const adminMenuItems: MenuCategoryType[] = [
      {
        title: "Administration",
        items: [
          {
            title: "User Management",
            path: "/admin/users",
            icon: <GroupIcon fontSize="small" />
          },
          {
            title: "Business Settings",
            path: "/admin/business",
            icon: <BusinessIcon fontSize="small" />
          },
          {
            title: "Security",
            path: "/admin/security",
            icon: <SecurityIcon fontSize="small" />
          }
        ]
      },
      {
        title: "Reports",
        items: [
          {
            title: "Sales Reports",
            path: "/reports/sales",
            icon: <BarChartIcon fontSize="small" />,
            children: [
              {
                title: "Daily Sales",
                path: "/reports/sales/daily",
                icon: <TrendingUpIcon fontSize="small" />
              },
              {
                title: "Monthly Sales",
                path: "/reports/sales/monthly",
                icon: <TrendingUpIcon fontSize="small" />
              },
              {
                title: "Yearly Sales",
                path: "/reports/sales/yearly",
                icon: <TrendingUpIcon fontSize="small" />
              }
            ]
          },
          {
            title: "Inventory Reports",
            path: "/reports/inventory",
            icon: <AssessmentIcon fontSize="small" />
          },
          {
            title: "Financial Reports",
            path: "/reports/financial",
            icon: <AttachMoneyIcon fontSize="small" />
          }
        ]
      }
    ];
    
    // Manager-specific menu items
    const managerMenuItems: MenuCategoryType[] = [
      {
        title: "Management",
        items: [
          {
            title: "Payments",
            path: "/payments",
            icon: <PaymentsIcon fontSize="small" />
          },
          {
            title: "Purchase Orders",
            path: "/purchase-orders",
            icon: <ShoppingCartIcon fontSize="small" />
          },
          {
            title: "Suppliers",
            path: "/suppliers",
            icon: <LocalShippingIcon fontSize="small" />
          }
        ]
      },
      {
        title: "Reports",
        items: [
          {
            title: "Sales Reports",
            path: "/reports/sales",
            icon: <BarChartIcon fontSize="small" />
          },
          {
            title: "Inventory Reports",
            path: "/reports/inventory",
            icon: <AssessmentIcon fontSize="small" />
          }
        ]
      }
    ];
    
    // Common menu items for all users
    const commonMenuItems: MenuCategoryType[] = [
      {
        title: "Settings",
        items: [
          {
            title: "Settings",
            path: "/settings",
            icon: <SettingsIcon fontSize="small" />,
            children: [
              {
                title: "General",
                path: "/settings/general",
                icon: <TuneIcon fontSize="small" />
              },
              {
                title: "Appearance",
                path: "/settings/appearance",
                icon: <PaletteIcon fontSize="small" />
              },
              {
                title: "Notifications",
                path: "/settings/notifications",
                icon: <NotificationsIcon fontSize="small" />
              }
            ]
          },
          {
            title: "Help & Support",
            path: "/help",
            icon: <HelpIcon fontSize="small" />,
            children: [
              {
                title: "Documentation",
                path: "/help/docs",
                icon: <MenuBookIcon fontSize="small" />
              },
              {
                title: "FAQs",
                path: "/help/faqs",
                icon: <InfoIcon fontSize="small" />
              },
              {
                title: "Contact Support",
                path: "/help/contact",
                icon: <ContactSupportIcon fontSize="small" />
              }
            ]
          }
        ]
      }
    ];
    
    // Combine menu items based on user role
    let menuCategories = [...baseMenuItems];
    
    if (userRole === 'admin') {
      menuCategories = [...menuCategories, ...adminMenuItems];
    } else if (userRole === 'manager') {
      menuCategories = [...menuCategories, ...managerMenuItems];
    }
    
    // Add common menu items
    menuCategories = [...menuCategories, ...commonMenuItems];
    
    return menuCategories;
  };
  
  // Get menu categories based on user role
  const menuCategories = getMenuCategories();
  
  // Render menu items
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      height: '100%',
      ml: 2,
      flexGrow: 1,
      overflow: 'auto',
      '&::-webkit-scrollbar': {
        height: '4px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: alpha(theme.palette.common.white, 0.3),
        borderRadius: '4px',
      },
    }}>
      {menuCategories.map(category => (
        <Box 
          key={category.title} 
          sx={{ 
            position: 'relative', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center',
            mx: 0.5
          }}
        >
          {category.items.map(item => {
            // Skip items that require permissions the user doesn't have
            if (item.permission && !hasPermission('page', item.permission)) {
              return null;
            }
            
            const menuId = `menu-${item.title.toLowerCase().replace(/\s+/g, '-')}`;
            const isMenuOpen = Boolean(openMenus[menuId]);
            const isItemActive = isActive(item.path);
            const isItemSectionActive = item.children ? 
              item.children.some(child => isActive(child.path)) || isActiveSection(item.path) : 
              false;
            
            return (
              <React.Fragment key={item.path}>
                <Button
                  color="inherit"
                  onClick={item.children ? 
                    (e) => handleMenuOpen(e, menuId) : 
                    () => handleNavigation(item.path)
                  }
                  sx={{
                    px: 1.5,
                    py: 1,
                    mx: 0.5,
                    color: (isItemActive || isItemSectionActive || isMenuOpen) ? 
                      theme.palette.common.white : 
                      alpha(theme.palette.common.white, 0.85),
                    fontWeight: (isItemActive || isItemSectionActive) ? 600 : 500,
                    position: 'relative',
                    height: '100%',
                    borderRadius: 0,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    minWidth: 'auto',
                    letterSpacing: '0.2px',
                    transition: 'all 0.2s ease',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: (isItemActive || isItemSectionActive) ? '60%' : '0%',
                      height: '3px',
                      backgroundColor: (isItemActive || isItemSectionActive) ? 
                        theme.palette.secondary.main : 
                        'transparent',
                      transition: 'all 0.3s ease',
                      borderRadius: '3px 3px 0 0',
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.common.white, 0.1),
                      '&::after': {
                        width: '40%',
                        backgroundColor: (isItemActive || isItemSectionActive) ? 
                          theme.palette.secondary.main : 
                          alpha(theme.palette.common.white, 0.5),
                      }
                    }
                  }}
                  endIcon={item.children && 
                    <KeyboardArrowDownIcon 
                      sx={{ 
                        transition: 'transform 0.3s ease',
                        transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        fontSize: '1.1rem',
                        ml: -0.5
                      }} 
                    />
                  }
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    '& .MuiSvgIcon-root': {
                      transition: 'all 0.2s ease',
                      color: (isItemActive || isItemSectionActive) ? 
                        theme.palette.secondary.main : 
                        alpha(theme.palette.common.white, 0.7),
                    }
                  }}>
                    <Box sx={{ 
                      mr: 0.75, 
                      display: 'flex', 
                      alignItems: 'center',
                      fontSize: '1.1rem'
                    }}>
                      {item.badge ? (
                        <Badge 
                          badgeContent={item.badge} 
                          color="error"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.65rem',
                              height: 16,
                              minWidth: 16,
                              padding: '0 4px',
                              top: -2,
                              right: -2
                            }
                          }}
                        >
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )}
                    </Box>
                    {item.title}
                    {item.isNew && (
                      <Box
                        component="span"
                        sx={{
                          ml: 0.75,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          backgroundColor: theme.palette.secondary.main,
                          color: theme.palette.secondary.contrastText,
                          px: 0.5,
                          py: 0.1,
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 16,
                          lineHeight: 1,
                        }}
                      >
                        New
                      </Box>
                    )}
                  </Box>
                </Button>
                
                {item.children && (
                  <Menu
                    id={menuId}
                    anchorEl={openMenus[menuId]}
                    open={isMenuOpen}
                    onClose={() => handleMenuClose(menuId)}
                    MenuListProps={{
                      'aria-labelledby': menuId,
                      dense: true,
                    }}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'left',
                    }}
                    PaperProps={{
                      elevation: 6,
                      sx: {
                        mt: 0.5,
                        minWidth: 220,
                        overflow: 'visible',
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        '&:before': {
                          content: '""',
                          display: 'block',
                          position: 'absolute',
                          top: 0,
                          left: 20,
                          width: 12,
                          height: 12,
                          bgcolor: 'background.paper',
                          transform: 'translateY(-50%) rotate(45deg)',
                          zIndex: 0,
                          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        },
                        '& .MuiList-root': {
                          py: 1,
                        },
                      },
                    }}
                    TransitionComponent={Grow}
                    transitionDuration={200}
                  >
                    {item.children.map(child => {
                      const isChildActive = isActive(child.path);
                      return (
                        <MenuItem 
                          key={child.path} 
                          onClick={() => handleNavigation(child.path)}
                          selected={isChildActive}
                          sx={{
                            py: 1.25,
                            px: 2,
                            mx: 1,
                            my: 0.25,
                            borderRadius: 1.5,
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            '&.Mui-selected': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.08),
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                              },
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 4,
                                height: '60%',
                                backgroundColor: theme.palette.primary.main,
                                borderRadius: '0 4px 4px 0',
                              },
                            },
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            },
                          }}
                        >
                          <ListItemIcon 
                            sx={{ 
                              minWidth: 36,
                              color: isChildActive ? theme.palette.primary.main : 'inherit',
                            }}
                          >
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={child.title} 
                            primaryTypographyProps={{ 
                              fontWeight: isChildActive ? 600 : 400,
                              fontSize: '0.9rem',
                              color: isChildActive ? theme.palette.primary.main : 'inherit',
                            }}
                          />
                          {child.badge && (
                            <Badge 
                              badgeContent={child.badge} 
                              color="error"
                              sx={{
                                '& .MuiBadge-badge': {
                                  fontSize: '0.65rem',
                                  height: 16,
                                  minWidth: 16,
                                  padding: '0 4px',
                                }
                              }}
                            />
                          )}
                          {child.isNew && (
                            <Box
                              component="span"
                              sx={{
                                ml: 1,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                backgroundColor: theme.palette.secondary.main,
                                color: theme.palette.secondary.contrastText,
                                px: 0.5,
                                py: 0.1,
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: 16,
                                lineHeight: 1,
                              }}
                            >
                              New
                            </Box>
                          )}
                        </MenuItem>
                      );
                    })}
                  </Menu>
                )}
              </React.Fragment>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}