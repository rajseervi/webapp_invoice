'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Skeleton from '@mui/material/Skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TrendPoint } from '../types';
import { formatCurrencyCompact } from './format';

export interface RevenueTrendCardProps {
  data: TrendPoint[];
  loading?: boolean;
}

type RangeKey = '6' | '12';

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: '6', label: '6M' },
  { value: '12', label: '12M' },
];

export default function RevenueTrendCard({ data, loading = false }: RevenueTrendCardProps) {
  const theme = useTheme();
  const [range, setRange] = useState<RangeKey>('12');
  const [hover, setHover] = useState<TrendPoint | null>(null);

  const visibleData = useMemo(() => (range === '6' ? data.slice(-6) : data), [data, range]);

  const total = useMemo(() => visibleData.reduce((sum, p) => sum + p.value, 0), [visibleData]);
  const growth = useMemo(() => {
    if (visibleData.length < 2) return null;
    const first = visibleData[0].value;
    const last = visibleData[visibleData.length - 1].value;
    if (first <= 0) return null;
    return ((last - first) / first) * 100;
  }, [visibleData]);

  const accent = theme.palette.primary.main;

  const handleRangeChange = (_e: React.MouseEvent<HTMLElement>, next: RangeKey | null) => {
    if (next) setRange(next);
  };

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton width={130} height={22} />
          <Skeleton width={180} height={16} sx={{ mt: 0.5 }} />
          <Skeleton variant="rectangular" height={240} sx={{ mt: 2.5, borderRadius: 2 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ height: '100%' }}>
      <Card
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardContent sx={{ p: 2.5, pb: 1, flexShrink: 0 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={700} sx={{ fontSize: '0.95rem' }}>
                Revenue Trend
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Monthly revenue · last {range === '6' ? '6' : '12'} months
              </Typography>
            </Box>

            <ToggleButtonGroup
              size="small"
              exclusive
              value={range}
              onChange={handleRangeChange}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.25,
                  py: 0.25,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  lineHeight: 1.4,
                  textTransform: 'none',
                },
              }}
            >
              {RANGE_OPTIONS.map((opt) => (
                <ToggleButton key={opt.value} value={opt.value}>
                  {opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>

          {/* Headline figures */}
          <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mt: 1.5 }}>
            <Typography fontWeight={800} sx={{ fontSize: '1.35rem', lineHeight: 1.1 }}>
              {formatCurrencyCompact(total)}
            </Typography>
            {growth != null && (
              <Typography
                component="span"
                fontWeight={700}
                sx={{ fontSize: '0.75rem', color: growth >= 0 ? 'success.main' : 'error.main' }}
              >
                {growth >= 0 ? '+' : ''}
                {growth.toFixed(1)}%
              </Typography>
            )}
            {hover && (
              <Typography component="span" variant="caption" color="text.secondary" noWrap>
                · {hover.label}: {formatCurrencyCompact(hover.value)}
              </Typography>
            )}
          </Stack>
        </CardContent>

        <Box sx={{ flex: 1, minHeight: 0, px: 1, pb: 1.5 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={visibleData}
              margin={{ top: 8, right: 12, bottom: 0, left: 4 }}
              onMouseMove={(state: any) => {
                const point = state?.activePayload?.[0]?.payload as TrendPoint | undefined;
                setHover(point ?? null);
              }}
              onMouseLeave={() => setHover(null)}
            >
              <defs>
                <linearGradient id="revenueAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.5)} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v: number) => formatCurrencyCompact(v)}
                tickLine={false}
                axisLine={false}
                width={58}
                tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
              />
              <ReTooltip
                cursor={{ stroke: alpha(accent, 0.35), strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 10,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: theme.shadows[4],
                  fontSize: 12,
                }}
                formatter={(value) => [formatCurrencyCompact(Number(value)), 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="value"
                name="Revenue"
                stroke={accent}
                strokeWidth={2.5}
                fill="url(#revenueAreaFill)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </motion.div>
  );
}
