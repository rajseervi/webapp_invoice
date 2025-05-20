import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Box } from '@mui/material';
import { Home as HomeIcon, NavigateNext as NavigateNextIcon } from '@mui/icons-material';

interface BreadcrumbsProps {
  customPaths?: { path: string; label: string }[];
  showHome?: boolean;
}

const pathNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  invoices: 'Invoices',
  parties: 'Parties',
  products: 'Products',
  transactions: 'Transactions',
  reports: 'Reports',
  settings: 'Settings',
  users: 'Users',
  profile: 'Profile',
  new: 'New',
  edit: 'Edit',
};

export default function Breadcrumbs({ customPaths, showHome = true }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Skip rendering breadcrumbs on the home page
  if (pathname === '/') return null;
  
  // Generate breadcrumb items from the current path
  const generateBreadcrumbs = () => {
    // If custom paths are provided, use them
    if (customPaths) {
      return customPaths.map((item, index) => {
        const isLast = index === customPaths.length - 1;
        
        return isLast ? (
          <Typography key={item.path} color="text.primary" sx={{ fontWeight: 'medium' }}>
            {item.label}
          </Typography>
        ) : (
          <Link key={item.path} href={item.path} style={{ textDecoration: 'none' }}>
            <Typography color="primary" sx={{ '&:hover': { textDecoration: 'underline' } }}>
              {item.label}
            </Typography>
          </Link>
        );
      });
    }
    
    // Otherwise, generate from the current path
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // Create breadcrumb items
    const breadcrumbs = pathSegments.map((segment, index) => {
      // Create the path for this breadcrumb
      const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
      
      // Check if this is an ID (UUID format or numeric)
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^\d+$/.test(segment);
      
      // Get a readable name for this segment
      let label = pathNameMap[segment] || segment;
      
      // Capitalize first letter if not found in map
      if (!pathNameMap[segment] && !isId) {
        label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }
      
      // For IDs, use a more descriptive label based on the previous segment
      if (isId && index > 0) {
        const prevSegment = pathSegments[index - 1];
        // Remove trailing 's' if it exists (e.g., 'invoices' -> 'invoice')
        const singularForm = prevSegment.endsWith('s') 
          ? prevSegment.slice(0, -1) 
          : prevSegment;
        
        label = `${singularForm.charAt(0).toUpperCase() + singularForm.slice(1)} Details`;
      }
      
      // Check if this is the last item
      const isLast = index === pathSegments.length - 1;
      
      return isLast ? (
        <Typography key={path} color="text.primary" sx={{ fontWeight: 'medium' }}>
          {label}
        </Typography>
      ) : (
        <Link key={path} href={path} style={{ textDecoration: 'none' }}>
          <Typography color="primary" sx={{ '&:hover': { textDecoration: 'underline' } }}>
            {label}
          </Typography>
        </Link>
      );
    });
    
    // Add home link at the beginning if needed
    if (showHome) {
      breadcrumbs.unshift(
        <Link key="home" href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <HomeIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
          <Typography color="primary" sx={{ '&:hover': { textDecoration: 'underline' } }}>
            Home
          </Typography>
        </Link>
      );
    }
    
    return breadcrumbs;
  };
  
  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
      >
        {generateBreadcrumbs()}
      </MuiBreadcrumbs>
    </Box>
  );
}