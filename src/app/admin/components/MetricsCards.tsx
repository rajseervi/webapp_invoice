"use client";
import React from 'react';
import { Grid, Paper, Stack, Typography } from '@mui/material';
import { TrendingUp, MonetizationOn, ReceiptLong } from '@mui/icons-material';

interface Props {
  totalInvoices?: number;
  paid?: number;
  pending?: number;
  amount?: number;
}

export default function MetricsCards({ totalInvoices = 0, paid = 0, pending = 0, amount = 0 }: Props) {
  return (
    <Grid container spacing={2}>
      <Grid
        item
        xs={12}
        sx={{
          flexBasis: '100%',
          maxWidth: '100%',
          '@media (min-width:768px)': { flexBasis: '50%', maxWidth: '50%' },
          '@media (min-width:1024px)': { flexBasis: '25%', maxWidth: '25%' },
        }}
      >
        <Paper elevation={1} sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TrendingUp color="primary" />
            <div>
              <Typography variant="body2" color="text.secondary">Total Invoices</Typography>
              <Typography variant="h6">{totalInvoices}</Typography>
            </div>
          </Stack>
        </Paper>
      </Grid>
      <Grid
        item
        xs={12}
        sx={{
          flexBasis: '100%',
          maxWidth: '100%',
          '@media (min-width:768px)': { flexBasis: '50%', maxWidth: '50%' },
          '@media (min-width:1024px)': { flexBasis: '25%', maxWidth: '25%' },
        }}
      >
        <Paper elevation={1} sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <ReceiptLong color="success" />
            <div>
              <Typography variant="body2" color="text.secondary">Paid</Typography>
              <Typography variant="h6">{paid}</Typography>
            </div>
          </Stack>
        </Paper>
      </Grid>
      <Grid
        item
        xs={12}
        sx={{
          flexBasis: '100%',
          maxWidth: '100%',
          '@media (min-width:768px)': { flexBasis: '50%', maxWidth: '50%' },
          '@media (min-width:1024px)': { flexBasis: '25%', maxWidth: '25%' },
        }}
      >
        <Paper elevation={1} sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <MonetizationOn color="warning" />
            <div>
              <Typography variant="body2" color="text.secondary">Pending</Typography>
              <Typography variant="h6">{pending}</Typography>
            </div>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}