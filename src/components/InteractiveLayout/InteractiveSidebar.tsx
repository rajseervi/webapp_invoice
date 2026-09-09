'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

import type { NavSection } from './types';
import { handleLogout } from '@/utils/authRedirects';

const EXPANDED_WIDTH = 272;
const MINI_WIDTH = 76;

export interface InteractiveSidebarProps {
  sections: NavSection[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isMobile: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  userName: string;
  userRole: string;
}

export default function InteractiveSidebar({
  sections,
  collapsed,
  onToggleCollapsed,
  isMobile,
  mobileOpen,
  onCloseMobile,
  userName,
  userRole,
}: InteractiveSidebarProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({ overview: true }));

  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

  const navigate = (path: string) => {
    router.push(path);
    if (isMobile) onCloseMobile();
  };

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  // ── Section block ──
  const renderSection = (section: NavSection, index: number) => {
    const expanded = openSections[section.id] ?? false;

    return (
      <Box key={section.id} component="div">
        {index > 0 && <Divider sx={{ mx: 1.5, my: 1 }} />}

        {/* Section header */}
        <Tooltip title={collapsed ? section.title : ''} placement="right" arrow disableHoverListener={!collapsed}>
          <ListItemButton
            onClick={() => toggleSection(section.id)}
            sx={{
              borderRadius: 2,
              mx: 1,
              my: 0.25,
              minHeight: 42,
              justifyContent: collapsed ? 'center' : 'space-between',
              px: collapsed ? 0 : 1.5,
              transition: 'background-color 0.2s',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box sx={{ color: theme.palette.primary.main, display: 'flex', width: collapsed ? 'auto' : 24, justifyContent: 'center' }}>
                {section.icon}
              </Box>
              {!collapsed && (
                <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: 0.8, textTransform: 'uppercase', color: 'text.secondary' }}>
                  {section.title}
                </Typography>
              )}
            </Stack>
            {!collapsed && (
              <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}>
                <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </motion.span>
            )}
          </ListItemButton>
        </Tooltip>

        {/* Items */}
        <Collapse in={expanded && !collapsed} timeout={220} unmountOnExit>
          <List disablePadding sx={{ pb: 0.75 }}>
            {section.items.map((item) => {
              const active = isActive(item.path);
              return (
                <ListItemButton
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  selected={active}
                  sx={{
                    mx: 1,
                    my: 0.15,
                    minHeight: 38,
                    borderRadius: 2,
                    pl: collapsed ? 0 : 4.4,
                    pr: 1.2,
                    justifyContent: 'center',
                    position: 'relative',
                    transition: 'all 0.18s ease',
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      '& .MuiListItemText-primary': { color: theme.palette.primary.main, fontWeight: 700 },
                      '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.07),
                      transform: 'translateX(3px)',
                    },
                  }}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      style={{
                        position: 'absolute',
                        left: 6,
                        top: '50%',
                        translateY: '-50%',
                        width: 3.5,
                        height: 20,
                        borderRadius: 4,
                        background: theme.palette.primary.main,
                      }}
                    />
                  )}
                  <ListItemIcon sx={{ minWidth: 28, justifyContent: 'center', mr: collapsed ? 0 : 1 }}>{item.icon}</ListItemIcon>
                  {!collapsed && (
                    <>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: active ? 700 : 500 }}
                      />
                      {item.isNew && (
                        <Chip label="New" size="small" color="secondary" sx={{ height: 18, fontSize: '0.62rem', '& .MuiChip-label': { px: 0.75 } }} />
                      )}
                      {item.badge != null && (
                        <Badge badgeContent={item.badge} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.62rem', minWidth: 16, height: 16 } }} />
                      )}
                    </>
                  )}
                </ListItemButton>
              );
            })}
          </List>
        </Collapse>

        {/* Mini mode: icons only, tooltip navigation */}
        {collapsed && !isMobile && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, py: 0.25 }}>
            {section.items.map((item) => (
              <Tooltip key={item.id} title={item.label} placement="right" arrow>
                <IconButton onClick={() => navigate(item.path)} size="small">
                  <Badge
                    badgeContent={item.badge}
                    color="error"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.58rem', minWidth: 14, height: 14 } }}
                  >
                    <Box sx={{
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                      bgcolor: isActive(item.path) ? alpha(theme.palette.primary.main, 0.14) : 'transparent',
                      color: isActive(item.path) ? theme.palette.primary.main : theme.palette.text.secondary,
                      transition: 'all 0.2s',
                    }}>
                      {item.icon}
                    </Box>
                  </Badge>
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const sidebarBody = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#ffffff',
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
      }}
    >
      {/* Brand */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent={collapsed ? 'center' : 'space-between'}
        sx={{ px: 2, py: 2, flexShrink: 0 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
              <Typography fontWeight={800} sx={{ fontSize: '1.05rem', background: `linear-gradient(45deg, ${theme.palette.primary.main}, #21cbf3)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MASTERMIND
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
        <IconButton size="small" onClick={onToggleCollapsed}>
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} style={{ display: 'flex' }}>
            <ChevronLeftIcon fontSize="small" />
          </motion.span>
        </IconButton>
      </Stack>

      {/* Nav scroll area */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 0.75, scrollbarWidth: 'thin' }}>
        {sections.map(renderSection)}
      </Box>

      {/* User footer */}
      <Divider />
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ p: 1.5, flexShrink: 0 }}
        justifyContent={collapsed ? 'center' : 'flex-start'}
      >
        <Avatar sx={{ width: 34, height: 34, bgcolor: theme.palette.primary.main, fontSize: '0.8rem', fontWeight: 700 }}>
          {initials}
        </Avatar>
        {!collapsed && (
          <>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap fontWeight={600}>{userName}</Typography>
              <Typography variant="caption" noWrap color="text.secondary">{userRole}</Typography>
            </Box>
            <Tooltip title="Sign out">
              <IconButton
                size="small"
                onClick={() => handleLogout(undefined, router)}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Stack>
    </Box>
  );

  // ── Desktop ──
  if (!isMobile) {
    return (
      <Box
        sx={{
          flexShrink: 0,
          width: collapsed ? MINI_WIDTH : EXPANDED_WIDTH,
          transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        {sidebarBody}
      </Box>
    );
  }

  // ── Mobile drawer ──
  return (
    <AnimatePresence>
      {mobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1199,
              backgroundColor: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(2px)',
            }}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 1200,
              width: EXPANDED_WIDTH,
              maxWidth: '85vw',
            }}
          >
            {sidebarBody}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
