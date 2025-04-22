"use client";
import React, { useState } from 'react';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Collapse,
  Box,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Storage as DatabaseIcon,
  Api as ApiIcon,
  Terminal as TerminalIcon,
  BugReport as BugReportIcon,
  Build as BuildIcon,
  CloudUpload as DeployIcon,
  Folder as FolderIcon,
  GitHub as GitHubIcon,
  Bookmark as BookmarkIcon
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';

interface ProjectNavigationProps {
  onItemClick?: () => void;
}

export default function ProjectNavigation({ onItemClick }: ProjectNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  
  // State for expandable sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    projects: false,
    documentation: false,
    tools: false
  });
  
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
  
  // Toggle section expansion
  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Common styles for menu items
  const menuItemStyles = {
    borderRadius: 1,
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

  return (
    <Box sx={{ width: '100%', overflowY: 'auto' }}>
      <List component="nav" sx={{ px: 2 }}>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => handleNavigation('/dashboard')}
            selected={isActive('/dashboard')}
            sx={menuItemStyles}
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
        </ListItem>

        {/* Projects Section */}
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => handleSectionToggle('projects')}
            selected={isActiveSection('/projects')}
            sx={menuItemStyles}
          >
            <ListItemIcon>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Projects" 
              primaryTypographyProps={{ 
                fontWeight: isActiveSection('/projects') ? 600 : 400 
              }}
            />
            {expandedSections.projects ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={expandedSections.projects} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/projects/frontend')}
                selected={isActive('/projects/frontend')}
                sx={submenuItemStyles}
              >
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Frontend" 
                  primaryTypographyProps={{ 
                    fontWeight: isActive('/projects/frontend') ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/projects/backend')}
                selected={isActive('/projects/backend')}
                sx={submenuItemStyles}
              >
                <ListItemIcon>
                  <ApiIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Backend" 
                  primaryTypographyProps={{ 
                    fontWeight: isActive('/projects/backend') ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/projects/database')}
                selected={isActive('/projects/database')}
                sx={submenuItemStyles}
              >
                <ListItemIcon>
                  <DatabaseIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Database" 
                  primaryTypographyProps={{ 
                    fontWeight: isActive('/projects/database') ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        {/* Documentation Section */}
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => handleSectionToggle('documentation')}
            selected={isActiveSection('/docs')}
            sx={menuItemStyles}
          >
            <ListItemIcon>
              <DescriptionIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Documentation" 
              primaryTypographyProps={{ 
                fontWeight: isActiveSection('/docs') ? 600 : 400 
              }}
            />
            {expandedSections.documentation ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={expandedSections.documentation} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/docs/api')}
                selected={isActive('/docs/api')}
                sx={submenuItemStyles}
              >
                <ListItemIcon>
                  <ApiIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="API Reference" 
                  primaryTypographyProps={{ 
                    fontWeight: isActive('/docs/api') ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/docs/guides')}
                selected={isActive('/docs/guides')}
                sx={submenuItemStyles}
              >
                <ListItemIcon>
                  <BookmarkIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Guides" 
                  primaryTypographyProps={{ 
                    fontWeight: isActive('/docs/guides') ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        {/* Tools Section */}
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => handleSectionToggle('tools')}
            selected={isActiveSection('/tools')}
            sx={menuItemStyles}
          >
            <ListItemIcon>
              <BuildIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Tools" 
              primaryTypographyProps={{ 
                fontWeight: isActiveSection('/tools') ? 600 : 400 
              }}
            />
            {expandedSections.tools ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={expandedSections.tools} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/tools/terminal')}
                selected={isActive('/tools/terminal')}
                sx={submenuItemStyles}
              >
                <ListItemIcon>
                  <TerminalIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Terminal" 
                  primaryTypographyProps={{ 
                    fontWeight: isActive('/tools/terminal') ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/tools/debug')}
                selected={isActive('/tools/debug')}
                sx={submenuItemStyles}
              >
                <ListItemIcon>
                  <BugReportIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Debugger" 
                  primaryTypographyProps={{ 
                    fontWeight: isActive('/tools/debug') ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/tools/deploy')}
                selected={isActive('/tools/deploy')}
                sx={submenuItemStyles}
              >
                <ListItemIcon>
                  <DeployIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Deployment" 
                  primaryTypographyProps={{ 
                    fontWeight: isActive('/tools/deploy') ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        <Divider sx={{ my: 2 }} />

        {/* GitHub */}
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => handleNavigation('/github')}
            selected={isActive('/github')}
            sx={menuItemStyles}
          >
            <ListItemIcon>
              <GitHubIcon />
            </ListItemIcon>
            <ListItemText 
              primary="GitHub" 
              primaryTypographyProps={{ 
                fontWeight: isActive('/github') ? 600 : 400 
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Settings */}
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => handleNavigation('/settings')}
            selected={isActive('/settings')}
            sx={menuItemStyles}
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
        </ListItem>
      </List>
    </Box>
  );
}