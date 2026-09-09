'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { alpha, useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import InputBase from '@mui/material/InputBase';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

import type { AppNotification } from './types';
import { quickActionItems } from './navConfig';
import { handleLogout } from '@/utils/authRedirects';

export interface InteractiveHeaderProps {
  title: string;
  subtitle?: string;
  isMobile: boolean;
  onMenuClick: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  userName: string;
  userRole: string;
}

const toneIcons = {
  info: <InfoIcon fontSize="small" />,
  success: <CheckCircleIcon fontSize="small" />,
  warning: <WarningIcon fontSize="small" />,
  error: <ErrorIcon fontSize="small" />,
};

function timeAgo(minutes: number): string {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function InteractiveHeader({
  title,
  subtitle,
  isMobile,
  onMenuClick,
  notifications,
  onMarkAllRead,
  userName,
  userRole,
}: InteractiveHeaderProps) {
  const theme = useTheme();
  const router = useRouter();
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const initials = userName.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const openPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: alpha('#ffffff', 0.85),
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: { xs: 56, md: 64 }, px: { xs: 1.5, md: 2.5 } }}>
        {/* Menu button */}
        {isMobile && (
          <IconButton onClick={onMenuClick} edge="start">
            <MenuIcon />
          </IconButton>
        )}

        {/* Title block */}
        <Box sx={{ minWidth: 0, flexShrink: isMobile ? 1 : undefined }}>
          <Typography noWrap fontWeight={800} sx={{ fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
            {title}
          </Typography>
          {!isMobile && subtitle && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Search trigger — desktop inline, mobile icon */}
        {!isMobile ? (
          <motion.div
            whileHover={{ scale: 1.008 }}
            style={{ flex: 1, maxWidth: 460, marginInline: 'auto' }}
          >
            <Box
              onClick={openPalette}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.75,
                py: 0.9,
                borderRadius: 2.5,
                cursor: 'pointer',
                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                bgcolor: alpha(theme.palette.action.hover, 0.35),
                transition: 'border-color 0.2s, background-color 0.2s',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                Search pages & actions…
              </Typography>
              <Chip label="Ctrl K" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
            </Box>
          </motion.div>
        ) : (
          <Box sx={{ flex: 1 }} />
        )}

        {/* Quick actions — desktop only */}
        {!isMobile && (
          <Stack direction="row" spacing={0.75}>
            {quickActionItems.slice(0, 2).map((action) => (
              <Button
                key={action.id}
                size="small"
                variant="contained"
                startIcon={<span style={{ fontWeight: 700 }}>+</span>}
                onClick={() => router.push(action.path)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 1.4,
                  boxShadow: 'none',
                  '&:hover': { transform: 'translateY(-1px)', boxShadow: theme.shadows[3] },
                  transition: 'all 0.15s ease',
                }}
              >
                {action.label.replace('New ', '')}
              </Button>
            ))}
          </Stack>
        )}

        {/* Search icon — mobile */}
        {isMobile && (
          <IconButton onClick={openPalette}>
            <SearchIcon />
          </IconButton>
        )}

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)}>
            <Badge badgeContent={unreadCount || null} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Profile */}
        <IconButton onClick={(e) => setProfileAnchor(e.currentTarget)} size="small">
          <Avatar sx={{ width: 34, height: 34, bgcolor: theme.palette.primary.main, fontSize: '0.78rem', fontWeight: 700 }}>
            {initials}
          </Avatar>
        </IconButton>
      </Toolbar>

      {/* ── Notification center ── */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: { width: 340, maxHeight: 420, mt: 1, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.7)}` },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.25, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography fontWeight={700}>Notifications</Typography>
          <Button size="small" onClick={onMarkAllRead} disabled={!unreadCount}>Mark all read</Button>
        </Box>
        {notifications.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">You're all caught up 🎉</Typography>
          </Box>
        )}
        {notifications.slice(0, 8).map((n) => (
          <MenuItem
            key={n.id}
            onClick={() => setNotifAnchor(null)}
            sx={{
              alignItems: 'flex-start',
              gap: 1.25,
              py: 1.25,
              bgcolor: n.read ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            <Box sx={{ mt: 0.25, display: 'flex' }}>{toneIcons[n.tone]}</Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={n.read ? 500 : 700}>{n.title}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{n.message}</Typography>
              <Typography variant="caption" color="text.disabled">{timeAgo(n.minutesAgo)}</Typography>
            </Box>
            {!n.read && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: theme.palette.primary.main, mt: 0.75, flexShrink: 0 }} />}
          </MenuItem>
        ))}
      </Menu>

      {/* ── Profile menu ── */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { elevation: 8, sx: { width: 230, mt: 1, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.7)}` } },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography fontWeight={700} variant="body1" noWrap>{userName}</Typography>
          <Typography variant="caption" color="text.secondary">{userRole}</Typography>
        </Box>
        <MenuItem onClick={() => { setProfileAnchor(null); router.push('/profile'); }}>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Profile" primaryTypographyProps={{ fontSize: '0.85rem' }} />
        </MenuItem>
        <MenuItem onClick={() => { setProfileAnchor(null); router.push('/settings'); }}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '0.85rem' }} />
        </MenuItem>
        <MenuItem onClick={() => { setProfileAnchor(null); router.push('/help-desk'); }}>
          <ListItemIcon><HelpIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Help Desk" primaryTypographyProps={{ fontSize: '0.85rem' }} />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => { setProfileAnchor(null); void handleLogout(undefined, router); }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.85rem' }} />
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
