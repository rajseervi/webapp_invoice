"use client";
import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  useTheme, 
  alpha,
  Tooltip
} from '@mui/material';
import Link from 'next/link';
import { 
  ReceiptLong as InvoiceIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Settings as SettingsIcon,
  Category as CategoryIcon,
  ShoppingCart as ShoppingCartIcon,
  BarChart as ReportsIcon,
  Person as ProfileIcon
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

interface QuickLinkProps {
  title: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  disabled?: boolean;
}

const QuickLinkButton = ({ title, icon, href, color, disabled = false }: QuickLinkProps) => {
  const theme = useTheme();
  
  return (
    <Grid item xs={6} sm={4} md={3}>
      <Tooltip title={disabled ? "Requires active subscription" : title}>
        <Button
          component={Link}
          href={href}
          disabled={disabled}
          variant="outlined"
          fullWidth
          sx={{
            p: 2,
            borderRadius: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            borderColor: disabled ? 'divider' : color,
            color: disabled ? 'text.disabled' : color,
            bgcolor: disabled ? 'background.paper' : alpha(theme.palette.getContrastText(theme.palette.background.paper) === '#fff' ? color : theme.palette.background.paper, 0.05),
            '&:hover': {
              bgcolor: disabled ? 'background.paper' : alpha(theme.palette.getContrastText(theme.palette.background.paper) === '#fff' ? color : theme.palette.background.paper, 0.1),
              borderColor: disabled ? 'divider' : color,
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <Box sx={{ 
            p: 1.5, 
            borderRadius: '50%', 
            bgcolor: disabled ? alpha(theme.palette.text.disabled, 0.1) : alpha(color, 0.1),
            mb: 1
          }}>
            {icon}
          </Box>
          <Typography variant="body2" fontWeight="medium">
            {title}
          </Typography>
        </Button>
      </Tooltip>
    </Grid>
  );
};

export default function QuickLinks() {
  const theme = useTheme();
  const { subscriptionActive, userRole } = useAuth();
  
  const isAdmin = userRole === 'admin';
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        mb: 4
      }}
    >
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
        Quick Links
      </Typography>
      
      <Grid container spacing={2}>
        <QuickLinkButton 
          title="Invoices" 
          icon={<InvoiceIcon />} 
          href="/invoices" 
          color={theme.palette.primary.main}
          disabled={!subscriptionActive && !isAdmin}
        />
        
        <QuickLinkButton 
          title="Parties" 
          icon={<PeopleIcon />} 
          href="/parties" 
          color={theme.palette.secondary.main}
          disabled={!subscriptionActive && !isAdmin}
        />
        
        <QuickLinkButton 
          title="Products" 
          icon={<InventoryIcon />} 
          href="/products" 
          color={theme.palette.success.main}
          disabled={!subscriptionActive && !isAdmin}
        />
        
        <QuickLinkButton 
          title="Categories" 
          icon={<CategoryIcon />} 
          href="/categories" 
          color={theme.palette.info.main}
          disabled={!subscriptionActive && !isAdmin}
        />
        
        <QuickLinkButton 
          title="Purchase Orders" 
          icon={<ShoppingCartIcon />} 
          href="/purchase-orders" 
          color={theme.palette.warning.main}
          disabled={!subscriptionActive && !isAdmin}
        />
        
        <QuickLinkButton 
          title="Reports" 
          icon={<ReportsIcon />} 
          href="/reports" 
          color={theme.palette.error.main}
          disabled={!subscriptionActive && !isAdmin}
        />
        
        <QuickLinkButton 
          title="Profile" 
          icon={<ProfileIcon />} 
          href="/profile" 
          color={theme.palette.grey[700]}
        />
        
        <QuickLinkButton 
          title="Settings" 
          icon={<SettingsIcon />} 
          href="/settings" 
          color={theme.palette.grey[800]}
          disabled={!subscriptionActive && !isAdmin}
        />
      </Grid>
    </Paper>
  );
}