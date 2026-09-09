'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

export interface StatCardProps {
  label: string;
  value: number;
  format?: 'currency' | 'number' | 'percent';
  icon: React.ReactNode;
  color: string;
  trend?: number;
  trendLabel?: string;
  href?: string;
  loading?: boolean;
  delay?: number;
}

function formatValue(value: number, format: StatCardProps['format']): string {
  if (format === 'currency') {
    if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${Math.round(value)}`;
  }
  if (format === 'percent') return `${value.toFixed(1)}%`;
  return Math.round(value).toLocaleString('en-IN');
}

/** Animated count-up hook */
function useCountUp(target: number, duration = 900, enabled = true): number {
  const [display, setDisplay] = useState(enabled ? 0 : target);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(target * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, enabled]);

  return display;
}

export default function StatCard({
  label,
  value,
  format = 'number',
  icon,
  color,
  trend,
  trendLabel,
  href,
  loading = false,
  delay = 0,
}: StatCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const display = useCountUp(value);

  if (loading) {
    return (
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: 2.25 }}>
        <Skeleton width={90} height={14} />
        <Skeleton width={120} height={34} sx={{ mt: 0.75 }} />
        <Skeleton width={140} height={18} sx={{ mt: 1.25 }} />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay / 1000 }}
      whileHover={{ y: -4 }}
      style={{ height: '100%' }}
    >
      <Box
        onClick={href ? () => router.push(href) : undefined}
        sx={{
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderRadius: 3,
          border: `1px solid ${alpha(color, 0.18)}`,
          p: 2.25,
          cursor: href ? 'pointer' : 'default',
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.35)})`,
          },
          '&:hover': href
            ? {
                borderColor: alpha(color, 0.45),
                boxShadow: `0 10px 28px ${alpha(color, 0.16)}`,
                '& .stat-arrow': { opacity: 1, transform: 'translateX(0)' },
              }
            : {},
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.66rem', color: 'text.secondary' }}>
              {label}
            </Typography>
            <Typography fontWeight={800} sx={{ fontSize: { xs: '1.3rem', sm: '1.45rem' }, lineHeight: 1.15, mt: 0.4, color: theme.palette.text.primary }}>
              {formatValue(display, format)}
            </Typography>
          </Box>
          <Avatar
            variant="rounded"
            sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: alpha(color, 0.11), color, flexShrink: 0 }}
          >
            {icon}
          </Avatar>
        </Stack>

        {(trend != null || href) && (
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.5, minHeight: 24 }}>
            {trend != null && (
              <>
                {trend >= 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 15, color: 'success.main' }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 15, color: 'error.main' }} />
                )}
                <Chip
                  size="small"
                  label={`${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%${trendLabel ? ` ${trendLabel}` : ''}`}
                  color={trend >= 0 ? 'success' : 'error'}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.64rem', fontWeight: 700 }}
                />
              </>
            )}
            {href && (
              <ArrowForwardIcon
                className="stat-arrow"
                sx={{
                  ml: 'auto',
                  fontSize: 17,
                  color,
                  opacity: 0,
                  transform: 'translateX(-6px)',
                  transition: 'all 0.22s ease',
                }}
              />
            )}
          </Stack>
        )}
      </Box>
    </motion.div>
  );
}
