'use client';

import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  useTheme,
  alpha,
  styled,
  Theme,
  CSSObject,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import Link from 'next/link';

const drawerWidth = 280;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const StyledDrawer = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));

interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  {
    id: 'sales',
    title: 'Sales',
    path: '/sales',
    icon: <ShoppingCartIcon />,
    children: [
      { id: 'invoices', title: 'Invoices', path: '/sales/invoices', icon: <ReceiptIcon /> },
      { id: 'orders', title: 'Orders', path: '/sales/orders', icon: <ShoppingCartIcon /> },
    ],
  },
  { id: 'inventory', title: 'Inventory', path: '/inventory', icon: <InventoryIcon /> },
  { id: 'parties', title: 'Parties', path: '/parties', icon: <PeopleIcon /> },
  { id: 'reports', title: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
  { id: 'settings', title: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

interface SidebarProps {
  open: boolean;
}

export default function Sidebar({ open }: SidebarProps) {
  const theme = useTheme();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const handleSectionToggle = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => {
      const isSectionOpen = openSections[item.id] || false;

      if (item.children) {
        return (
          <React.Fragment key={item.id}>
            <ListItemButton onClick={() => handleSectionToggle(item.id)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
              {isSectionOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={isSectionOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {renderNavItems(item.children)}
              </List>
            </Collapse>
          </React.Fragment>
        );
      }

      return (
        <Link href={item.path} passHref key={item.id}>
          <ListItemButton>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.title} />
          </ListItemButton>
        </Link>
      );
    });
  };

  return (
    <StyledDrawer variant="permanent" open={open}>
      <List>{renderNavItems(navItems)}</List>
    </StyledDrawer>
  );
}