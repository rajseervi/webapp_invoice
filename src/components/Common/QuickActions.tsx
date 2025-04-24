"use client";
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Tooltip,
  Zoom,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  ShoppingCart as ShoppingCartIcon,
  MoreVert as MoreVertIcon,
  Speed as SpeedIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  description: string;
}

interface QuickActionsProps {
  variant?: 'fab' | 'grid' | 'compact';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'inline';
  showLabels?: boolean;
}

export default function QuickActions({
  variant = 'grid',
  position = 'inline',
  showLabels = true,
}: QuickActionsProps) {
  const theme = useTheme();
  const router = useRouter();
  
  // State for FAB menu
  const [fabOpen, setFabOpen] = useState(false);
  
  // State for more menu
  const [moreAnchorEl, setMoreAnchorEl] = useState<null | HTMLElement>(null);
  const moreMenuOpen = Boolean(moreAnchorEl);
  
  // Define quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'new-invoice',
      label: 'New Invoice',
      icon: <ReceiptIcon />,
      path: '/invoices/new',
      color: theme.palette.primary.main,
      description: 'Create a new invoice',
    },
    {
      id: 'new-product',
      label: 'New Product',
      icon: <InventoryIcon />,
      path: '/products/new',
      color: theme.palette.success.main,
      description: 'Add a new product to inventory',
    },
    {
      id: 'new-customer',
      label: 'New Customer',
      icon: <PersonIcon />,
      path: '/parties/new',
      color: theme.palette.info.main,
      description: 'Add a new customer',
    },
    {
      id: 'new-category',
      label: 'New Category',
      icon: <CategoryIcon />,
      path: '/categories/new',
      color: theme.palette.warning.main,
      description: 'Create a new product category',
    },
    {
      id: 'new-purchase',
      label: 'New Purchase',
      icon: <ShoppingCartIcon />,
      path: '/purchase-orders/new',
      color: theme.palette.secondary.main,
      description: 'Create a new purchase order',
    },
  ];
  
  // Handle action click
  const handleActionClick = (path: string) => {
    router.push(path);
    setFabOpen(false);
    setMoreAnchorEl(null);
  };
  
  // Handle more menu open
  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setMoreAnchorEl(event.currentTarget);
  };
  
  // Handle more menu close
  const handleMoreClose = () => {
    setMoreAnchorEl(null);
  };
  
  // Toggle FAB menu
  const toggleFabMenu = () => {
    setFabOpen(!fabOpen);
  };
  
  // Get position styles for FAB
  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-right':
        return { bottom: 16, right: 16 };
      case 'bottom-left':
        return { bottom: 16, left: 16 };
      case 'top-right':
        return { top: 16, right: 16 };
      case 'top-left':
        return { top: 16, left: 16 };
      default:
        return {};
    }
  };
  
  // Render FAB variant
  const renderFab = () => {
    return (
      <Box
        sx={{
          position: position === 'inline' ? 'relative' : 'fixed',
          zIndex: 1050,
          ...getPositionStyles(),
        }}
      >
        {/* Main FAB */}
        <Tooltip title={fabOpen ? "Close menu" : "Quick actions"}>
          <Fab
            color="primary"
            aria-label="quick actions"
            onClick={toggleFabMenu}
            sx={{
              boxShadow: theme.shadows[8],
            }}
          >
            {fabOpen ? <CloseIcon /> : <SpeedIcon />}
          </Fab>
        </Tooltip>
        
        {/* Action FABs */}
        <Zoom in={fabOpen} style={{ transitionDelay: fabOpen ? '100ms' : '0ms' }}>
          <Box
            sx={{
              position: 'absolute',
              bottom: 70,
              right: position === 'bottom-left' || position === 'top-left' ? 'auto' : 0,
              left: position === 'bottom-left' || position === 'top-left' ? 0 : 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: position === 'bottom-left' || position === 'top-left' ? 'flex-start' : 'flex-end',
              gap: 1.5,
            }}
          >
            {quickActions.map((action, index) => (
              <Box
                key={action.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: position === 'bottom-left' || position === 'top-left' ? 'row' : 'row-reverse',
                  gap: 1,
                }}
              >
                {showLabels && (
                  <Paper
                    elevation={2}
                    sx={{
                      py: 0.75,
                      px: 1.5,
                      borderRadius: 2,
                      whiteSpace: 'nowrap',
                      bgcolor: alpha(theme.palette.background.paper, 0.9),
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      {action.label}
                    </Typography>
                  </Paper>
                )}
                <Tooltip title={action.description}>
                  <Fab
                    size="small"
                    aria-label={action.label}
                    onClick={() => handleActionClick(action.path)}
                    sx={{
                      bgcolor: action.color,
                      color: '#fff',
                      '&:hover': {
                        bgcolor: alpha(action.color, 0.8),
                      },
                      boxShadow: theme.shadows[4],
                    }}
                  >
                    {action.icon}
                  </Fab>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </Zoom>
      </Box>
    );
  };
  
  // Render grid variant
  const renderGrid = () => {
    const visibleActions = quickActions.slice(0, 4);
    const moreActions = quickActions.slice(4);
    
    return (
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Quick Actions
          </Typography>
          {moreActions.length > 0 && (
            <Tooltip title="More actions">
              <IconButton size="small" onClick={handleMoreClick}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <Grid container spacing={2}>
          {visibleActions.map((action) => (
            <Grid item xs={4} sm={4} md={3} key={action.id}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1, sm: 1.5 },
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: alpha(action.color, 0.1),
                  border: '1px solid',
                  borderColor: alpha(action.color, 0.2),
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: alpha(action.color, 0.15),
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[2],
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    bgcolor: alpha(action.color, 0.2),
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  minHeight: { xs: 80, sm: 100 },
                }}
                onClick={() => handleActionClick(action.path)}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                    borderRadius: '50%',
                    bgcolor: action.color,
                    color: '#fff',
                    mb: 1,
                  }}
                >
                  {action.icon}
                </Box>
                {showLabels && (
                  <Typography 
                    variant="body2" 
                    fontWeight={500} 
                    align="center"
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {action.label}
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
        
        {/* More menu */}
        <Menu
          anchorEl={moreAnchorEl}
          open={moreMenuOpen}
          onClose={handleMoreClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
              mt: 1.5,
              width: 200,
              '& .MuiMenuItem-root': {
                px: 2,
                py: 1.5,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {moreActions.map((action) => (
            <MenuItem key={action.id} onClick={() => handleActionClick(action.path)}>
              <ListItemIcon sx={{ color: action.color }}>
                {action.icon}
              </ListItemIcon>
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Paper>
    );
  };
  
  // Render compact variant
  const renderCompact = () => {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {quickActions.map((action, index) => (
            <React.Fragment key={action.id}>
              <Tooltip title={action.label}>
                <IconButton
                  size="small"
                  onClick={() => handleActionClick(action.path)}
                  sx={{
                    bgcolor: alpha(action.color, 0.1),
                    color: action.color,
                    '&:hover': {
                      bgcolor: alpha(action.color, 0.2),
                    },
                  }}
                >
                  {action.icon}
                </IconButton>
              </Tooltip>
              {index < quickActions.length - 1 && (
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Paper>
    );
  };
  
  // Render based on variant
  switch (variant) {
    case 'fab':
      return renderFab();
    case 'compact':
      return renderCompact();
    case 'grid':
    default:
      return renderGrid();
  }
}