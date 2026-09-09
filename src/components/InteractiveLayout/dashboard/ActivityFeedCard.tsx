'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentsIcon from '@mui/icons-material/Payments';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import type { ActivityEntry } from '../types';
import { formatMinutesAgo } from './format';

export interface ActivityFeedCardProps {
  entries: ActivityEntry[];
  loading?: boolean;
  maxVisible?: number;
}

const KIND_ICONS: Record<ActivityEntry['kind'], React.ReactNode> = {
  invoice: <ReceiptIcon sx={{ fontSize: 16 }} />,
  payment: <PaymentsIcon sx={{ fontSize: 16 }} />,
  party: <GroupAddIcon sx={{ fontSize: 16 }} />,
  product: <Inventory2Icon sx={{ fontSize: 16 }} />,
};

const TONE_COLORS = {
  success: '#16a34a',
  info: '#2563eb',
  warning: '#d97706',
} as const;

export default function ActivityFeedCard({
  entries,
  loading = false,
  maxVisible = 6,
}: ActivityFeedCardProps) {
  const theme = useTheme();
  const router = useRouter();

  const visible = entries.slice(0, maxVisible);

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton width={110} height={22} />
          {Array.from({ length: 5 }).map((_, i) => (
            <Stack key={i} direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.75 }}>
              <Skeleton variant="circular" width={30} height={30} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="70%" height={14} />
                <Skeleton width="45%" height={12} sx={{ mt: 0.4 }} />
              </Box>
            </Stack>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} style={{ height: '100%' }}>
      <Card
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardContent sx={{ p: 2.5, pb: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <Typography fontWeight={700} sx={{ fontSize: '0.95rem' }}>
            Recent Activity
          </Typography>

          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', mt: 0.75 }}>
            {visible.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No recent activity
                </Typography>
              </Box>
            ) : (
              visible.map((entry, idx) => {
                const toneColor = TONE_COLORS[entry.tone] ?? TONE_COLORS.info;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.03 * idx }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{
                        py: 0.9,
                        px: 0.75,
                        mx: -0.75,
                        borderRadius: 1.5,
                        '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.6) },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 30,
                          height: 30,
                          bgcolor: alpha(toneColor, 0.12),
                          color: toneColor,
                          flexShrink: 0,
                        }}
                      >
                        {KIND_ICONS[entry.kind]}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: '0.8rem' }}>
                          {entry.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontSize: '0.7rem' }}>
                          {entry.detail}
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        {typeof entry.amount === 'number' && (
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color={entry.tone === 'warning' ? 'warning.main' : 'success.main'}
                            sx={{ display: 'block', fontSize: '0.72rem' }}
                          >
                            ₹{entry.amount.toLocaleString('en-IN')}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem' }}>
                          {formatMinutesAgo(entry.minutesAgo)}
                        </Typography>
                      </Box>
                    </Stack>
                  </motion.div>
                );
              })
            )}
          </Box>

          <Button
            size="small"
            fullWidth
            variant="outlined"
            onClick={() => router.push('/invoices')}
            sx={{ mt: 1.5, flexShrink: 0, borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
          >
            View All Invoices
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
