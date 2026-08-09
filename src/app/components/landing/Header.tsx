'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  alpha,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Stack,
  Chip,
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Close as CloseIcon,
  Inventory,
  Dashboard,
  Login,
  PersonAdd
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface NavItem {
  id: string;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'features', label: 'Features' },
  { id: 'demo', label: 'Demo' },
  { id: 'testimonials', label: 'Reviews' },
  { id: 'cta', label: 'Pricing' },
];

interface HeaderProps {
  isUserLoggedIn: boolean;
  userRole: string | null;
  onLogout: () => void;
  onDashboardRedirect: () => void;
  activeSection: string | null;
  scrollToSection: (sectionId: string) => void;
}

export default function Header({ 
  isUserLoggedIn, 
  userRole, 
  onLogout, 
  onDashboardRedirect, 
  activeSection, 
  scrollToSection 
}: HeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ width: 250, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          IMS Pro
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem 
            key={item.id}
            onClick={() => {
              scrollToSection(item.id);
              handleDrawerToggle();
            }}
            sx={{ 
              cursor: 'pointer',
              borderRadius: 2,
              mb: 1,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }
            }}
          >
            <ListItemText 
              primary={item.label}
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: activeSection === item.id ? 600 : 400,
                  color: activeSection === item.id ? theme.palette.primary.main : theme.palette.text.primary,
                }
              }}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 3 }}>
        {isUserLoggedIn ? (
          <Stack spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Dashboard />}
              onClick={() => {
                onDashboardRedirect();
                handleDrawerToggle();
              }}
            >
              Dashboard
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                onLogout();
                handleDrawerToggle();
              }}
            >
              Logout
            </Button>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Login />}
              onClick={() => {
                router.push('/login');
                handleDrawerToggle();
              }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              fullWidth
              startIcon={<PersonAdd />}
              onClick={() => {
                router.push('/register');
                handleDrawerToggle();
              }}
            >
              Sign Up
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        component={motion.div}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1 }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  color: 'white'
                }}
              >
                <Inventory />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ 
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  SmartIMS
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  Intelligent Inventory Management
                </Typography>
              </Box>
            </Box>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  color="inherit"
                  onClick={() => scrollToSection(item.id)}
                  sx={{
                    fontWeight: 500,
                    color: activeSection === item.id ? theme.palette.primary.main : theme.palette.text.primary,
                    position: 'relative',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      transform: 'translateY(-1px)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 4,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: activeSection === item.id ? '60%' : '0%',
                      height: '2px',
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 1,
                      transition: 'width 0.3s ease-in-out',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}

              {/* Action Buttons */}
              <Box sx={{ ml: 3, display: 'flex', gap: 1 }}>
                {isUserLoggedIn ? (
                  <>
                    <Chip
                      label={userRole === 'admin' ? 'Admin' : 'User'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Dashboard />}
                      onClick={onDashboardRedirect}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        fontWeight: 500,
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={onLogout}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        fontWeight: 500,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                        }
                      }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Login />}
                      onClick={() => router.push('/login')}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        fontWeight: 500,
                        borderWidth: 1.5,
                        '&:hover': {
                          borderWidth: 1.5,
                          transform: 'translateY(-1px)',
                        }
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PersonAdd />}
                      onClick={() => router.push('/register')}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        fontWeight: 500,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                          transform: 'translateY(-1px)',
                          boxShadow: theme.shadows[4],
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Start Free
                    </Button>
                  </>
                )}
              </Box>
            </Box>

            {/* Mobile Menu Button */}
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  }
                }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 250,
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}