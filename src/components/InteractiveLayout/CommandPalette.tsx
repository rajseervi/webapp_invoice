'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Backdrop from '@mui/material/Backdrop';
import {
  Search as SearchIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardReturn as EnterIcon,
  Add as AddIcon,
} from '@mui/icons-material';

import type { CommandItem } from './types';
import { navSections, quickActionItems } from './navConfig';

const PALETTE_OPEN_EVENT = 'open-command-palette';

export default function CommandPalette() {
  const theme = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Build commands from nav config + quick actions
  const commands: CommandItem[] = useMemo(() => {
    const pageCommands: CommandItem[] = navSections.flatMap((section) =>
      section.items.map((item) => ({
        id: item.id,
        label: item.label,
        group: 'Pages' as const,
        keywords: [item.label.toLowerCase(), item.path, section.title.toLowerCase()],
        icon: item.icon,
        run: () => router.push(item.path),
      })),
    );

    const actionCommands: CommandItem[] = quickActionItems.map((action) => ({
      id: action.id,
      label: action.label,
      group: 'Actions' as const,
      keywords: [action.label.toLowerCase(), 'create', 'new'],
      icon: <AddIcon fontSize="small" />,
      run: () => router.push(action.path),
    }));

    return [...pageCommands, ...actionCommands];
  }, [router]);

  // Open via header event or Ctrl+K
  useEffect(() => {
    const onOpenEvent = () => setOpen(true);

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener(PALETTE_OPEN_EVENT, onOpenEvent);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener(PALETTE_OPEN_EVENT, onOpenEvent);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Reset state when opened/closed
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  // Fuzzy-ish filter: match label, path or keywords
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.keywords.some((k) => k.includes(q)),
    );
  }, [commands, query]);

  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filtered.forEach((cmd) => {
      groups[cmd.group] = groups[cmd.group] || [];
      groups[cmd.group].push(cmd);
    });
    return Object.entries(groups);
  }, [filtered]);

  // Keep active item in view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const executeCommand = (cmd: CommandItem | undefined) => {
    if (!cmd) return;
    setOpen(false);
    cmd.run();
  };

  const onKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(filtered[activeIndex]);
    }
  };

  let flatIndexCounter = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ position: 'fixed', inset: 0, zIndex: 1400 }}
        >
          <Backdrop open invisible onClick={() => setOpen(false)} />
          <Box sx={{ position: 'absolute', inset: 0 }} onClick={() => setOpen(false)}>
            {/* Centered dialog panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -14 }}
              animate={{ opacity: 1, scale: 1, y: 24 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              style={{
                position: 'relative',
                maxWidth: 580,
                margin: '0 auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Box
                onKeyDown={onKeyDownInput}
                sx={{
                  mt: { xs: 2, sm: 8 },
                  mx: 2,
                  bgcolor: '#ffffff',
                  borderRadius: 4,
                  boxShadow: `0 24px 64px ${alpha('#000000', 0.22)}, 0 0 0 1px ${alpha(theme.palette.divider, 0.6)}`,
                  overflow: 'hidden',
                }}
              >
                {/* Search input */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.25, py: 1.75 }}>
                  <SearchIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                  <InputBase
                    autoFocus
                    fullWidth
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                    placeholder="Type a command or search pages…"
                    sx={{ fontSize: '0.95rem' }}
                  />
                  <Chip label="ESC" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 600 }} />
                </Stack>

                <Box sx={{ borderTop: `1px solid ${theme.palette.divider}` }} />

                {/* Results */}
                <div ref={listRef}>
                  {filtered.length === 0 ? (
                    <Box sx={{ py: 5, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No matches for “{query}”
                      </Typography>
                    </Box>
                  ) : (
                    <List disablePadding sx={{ maxHeight: 380, overflowY: 'auto', py: 1 }}>
                      {grouped.map(([groupName, items]) => (
                        <React.Fragment key={groupName}>
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            sx={{ px: 2.25, pt: 1.25, pb: 0.5, display: 'block', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.7 }}
                          >
                            {groupName}
                          </Typography>
                          {items.map((cmd) => {
                            flatIndexCounter += 1;
                            const idx = flatIndexCounter;
                            const active = idx === activeIndex;
                            return (
                              <ListItemButton
                                key={cmd.id}
                                data-index={idx}
                                onClick={() => executeCommand(cmd)}
                                onMouseEnter={() => setActiveIndex(idx)}
                                sx={{
                                  mx: 1,
                                  borderRadius: 2,
                                  py: 0.9,
                                  ...(active && { bgcolor: alpha(theme.palette.primary.main, 0.09) }),
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 38, color: active ? theme.palette.primary.main : 'text.secondary' }}>
                                  {cmd.icon}
                                </ListItemIcon>
                                <ListItemText
                                  primary={cmd.label}
                                  primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: active ? 700 : 500 }}
                                />
                                {active && (
                                  <Chip
                                    label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>↵ enter</span>}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.62rem', fontWeight: 600 }}
                                  />
                                )}
                              </ListItemButton>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </div>

                {/* Footer hints */}
                <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', px: 2.25, py: 1.15, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.action.hover, 0.25) }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: theme.palette.text.secondary }}>
                    <ArrowUpIcon sx={{ fontSize: 13 }} /><ArrowDownIcon sx={{ fontSize: 13 }} /> navigate
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: theme.palette.text.secondary }}>
                    <EnterIcon sx={{ fontSize: 13 }} /> select
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: theme.palette.text.secondary }}>
                    {filtered.length} result{filtered.length === 1 ? '' : 's'}
                  </span>
                </Box>
              </Box>
            </motion.div>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
