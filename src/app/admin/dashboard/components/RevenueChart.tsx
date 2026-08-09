"use client";

import React, { memo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import { useTheme, alpha } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';

// Static imports for chart.js — tree-shaken and code-split at the page level via React.lazy
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface RevenueChartProps {
  labels: string[];
  data: number[];
  loading?: boolean;
}

const RevenueChart = memo(function RevenueChart({ labels, data, loading }: RevenueChartProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <Card sx={{ height: 400, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="40%" height={28} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="60%" height={18} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    );
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data,
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        borderColor: theme.palette.primary.main,
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: theme.palette.primary.main,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: alpha('#000', 0.8),
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => `₹${Number(ctx.parsed.y).toLocaleString('en-IN')}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: alpha(theme.palette.divider, 0.15) },
        border: { display: false },
        ticks: {
          color: theme.palette.text.secondary,
          font: { size: 11 },
          callback: (v: any) => {
            if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
            if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
            return `₹${v}`;
          },
        },
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: theme.palette.text.secondary,
          font: { size: 11 },
          maxTicksLimit: 12,
        },
      },
    },
    interaction: { mode: 'index' as const, intersect: false },
    animation: { duration: 600 },
  };

  return (
    <Card sx={{ height: 400, borderRadius: 3 }}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, flexShrink: 0 }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem' }}>
              Revenue Trend
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Monthly revenue over last 12 months
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip icon={<TimelineIcon />} label="12 months" size="small" variant="outlined" sx={{ height: 24, fontSize: '0.7rem' }} />
            {data.length >= 2 && (
              <Chip
                icon={<TrendingUpIcon />}
                label={`+${(((data[data.length - 1] - data[0]) / data[0]) * 100).toFixed(1)}%`}
                size="small"
                color="success"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.7rem' }}
              />
            )}
          </Stack>
        </Stack>
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <Line data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
});

export default RevenueChart;
