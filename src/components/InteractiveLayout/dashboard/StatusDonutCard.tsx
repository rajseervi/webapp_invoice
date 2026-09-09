'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { StatusSlice } from '../types';
import { formatNumber } from './format';

export interface StatusDonutCardProps {
  data: StatusSlice[];
  loading?: boolean;
  title?: string;
}

const EMPTY_STATE = 'No status data available';

interface ActiveSector {
  id: string;
  label: string;
  value: number;
  color: string;
  share: number;
}

function buildActive(slice: StatusSlice | undefined, total: number): ActiveSector | null {
  if (!slice) return null;
  return { ...slice, share: total > 0 ? (slice.value / total) * 100 : 0 };
}

export default function StatusDonutCard({
  data,
  loading = false,
  title = 'Invoice Status',
}: StatusDonutCardProps) {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = useMemo(() => data.reduce((sum, s) => sum + s.value, 0), [data]);
  const active = activeIndex != null ? buildActive(data[activeIndex], total) : null;

  const handleEnter = (_data: unknown, index: number) => setActiveIndex(index);
  const handleLeave = () => setActiveIndex(null);
  const handleClick = (index: number) =>
    setActiveIndex((prev) => (prev === index ? null : index));

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton width={120} height={22} />
          <Skeleton variant="circular" width={170} height={170} sx={{ mx: 'auto', mt: 2 }} />
          <Skeleton width="80%" height={14} sx={{ mx: 'auto', mt: 2.5 }} />
          <Skeleton width="60%" height={14} sx={{ mx: 'auto', mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  const hasData = data.some((s) => s.value > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} style={{ height: '100%' }}>
      <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
        <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography fontWeight={700} sx={{ fontSize: '0.95rem' }}>
            {title}
          </Typography>

          {!hasData ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {EMPTY_STATE}
              </Typography>
            </Box>
          ) : (
            <>
              {/* Donut */}
              <Box sx={{ position: 'relative', width: 200, height: 200, mx: 'auto', my: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={total > 1 ? 3 : 0}
                      cornerRadius={6}
                      startAngle={90}
                      endAngle={-270}
                      onMouseEnter={handleEnter}
                      onMouseLeave={handleLeave}
                      onClick={(_: any, index: number) => handleClick(index)}
                      isAnimationActive
                      animationDuration={600}
                    >
                      {data.map((slice, i) => {
                        const isActive = i === activeIndex;
                        return (
                          <Cell
                            key={slice.id}
                            fill={slice.color}
                            stroke={isActive ? theme.palette.text.primary : 'transparent'}
                            strokeWidth={isActive ? 1.5 : 0}
                            style={{
                              cursor: 'pointer',
                              transition: 'opacity .25s ease',
                              opacity: activeIndex == null || isActive ? 1 : 0.35,
                            }}
                          />
                        );
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Center readout */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    px: 3,
                  }}
                >
                  {active ? (
                    <>
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: active.color, flexShrink: 0 }} />
                        <Typography variant="caption" fontWeight={700} noWrap sx={{ maxWidth: 110 }}>
                          {active.label}
                        </Typography>
                      </Stack>
                      <Typography fontWeight={800} sx={{ fontSize: '1.15rem', lineHeight: 1.15 }}>
                        {formatNumber(active.value)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {active.share.toFixed(0)}% of total
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        TOTAL
                      </Typography>
                      <Typography fontWeight={800} sx={{ fontSize: '1.35rem', lineHeight: 1.15 }}>
                        {formatNumber(total)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        invoices
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>

              {/* Legend */}
              <Stack spacing={0.75} sx={{ mt: 'auto' }}>
                {data.map((slice, i) => {
                  const share = total > 0 ? (slice.value / total) * 100 : 0;
                  const isActive = i === activeIndex;
                  return (
                    <Stack
                      key={slice.id}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      onClick={() => handleClick(i)}
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(null)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1,
                        px: 0.75,
                        py: 0.4,
                        bgcolor: isActive ? alpha(slice.color, 0.08) : 'transparent',
                        transition: 'background-color .2s ease',
                      }}
                    >
                      <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: slice.color, flexShrink: 0 }} />
                      <Typography
                        variant="caption"
                        fontWeight={isActive ? 800 : 600}
                        sx={{ flex: 1, minWidth: 0 }}
                        noWrap
                      >
                        {slice.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        {formatNumber(slice.value)}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ width: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {share.toFixed(0)}%
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
