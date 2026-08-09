"use client";

import React, { memo } from 'react';
import dynamic from 'next/dynamic';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { useTheme, alpha } from '@mui/material/styles';

// Register chart.js once at module level
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

const Doughnut = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Doughnut),
  { ssr: false, loading: () => <Skeleton variant="circular" width={160} height={160} sx={{ mx: 'auto' }} /> }
);

interface InvoiceStatusChartProps {
  loading?: boolean;
}

const InvoiceStatusChart = memo(function InvoiceStatusChart({ loading }: InvoiceStatusChartProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <Card sx={{ height: 220, borderRadius: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton variant="text" width="50%" height={24} sx={{ mb: 2 }} />
          <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto' }} />
        </CardContent>
      </Card>
    );
  }

  const data = {
    labels: ['Paid', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: ['#16a34a', '#d97706', '#dc2626'],
        borderColor: ['#15803d', '#b45309', '#b91c1c'],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          padding: 12,
          usePointStyle: true,
          font: { size: 11 },
          color: theme.palette.text.secondary,
        },
      },
      tooltip: {
        backgroundColor: alpha('#000', 0.8),
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx: any) => `${ctx.label}: ${ctx.parsed}%`,
        },
      },
    },
    animation: { duration: 500 },
  };

  return (
    <Card sx={{ height: 220, borderRadius: 3 }}>
      <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, fontSize: '0.9rem' }}>
          Invoice Status
        </Typography>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ width: 150, height: 150 }}>
            <Doughnut data={data} options={options} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

export default InvoiceStatusChart;
