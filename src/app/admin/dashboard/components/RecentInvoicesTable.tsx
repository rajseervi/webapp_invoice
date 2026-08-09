"use client";

import React, { useEffect, useState, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import { useTheme, alpha } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CircularProgress from '@mui/material/CircularProgress';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  amount: number;
  date: string;
  status: string;
}

interface RecentInvoicesTableProps {
  loading?: boolean;
}

const RecentInvoicesTable = memo(function RecentInvoicesTable({ loading: parentLoading }: RecentInvoicesTableProps) {
  const router = useRouter();
  const theme = useTheme();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvoices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!parentLoading) setLoading(true);

    try {
      const res = await fetch('/api/invoices/recent?limit=8&days=90');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setInvoices(json.data.slice(0, 8));
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error('Failed to fetch recent invoices:', err);
      setInvoices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [parentLoading]);

  useEffect(() => {
    if (!parentLoading) fetchInvoices();
  }, [parentLoading, fetchInvoices]);

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  if (parentLoading || loading) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
            <Skeleton variant="text" width="30%" height={32} />
            <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 2 }} />
          </Stack>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
              Recent Invoices
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Latest 8 invoices from the past 90 days
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={() => fetchInvoices(true)} disabled={refreshing}>
                <RefreshIcon sx={{ fontSize: 20, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              size="small"
              onClick={() => router.push('/invoices')}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.8rem' }}
            >
              View All
            </Button>
          </Stack>
        </Stack>

        {invoices.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5, opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No invoices found in the last 90 days
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => router.push('/invoices/new')}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Create Invoice
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', letterSpacing: 0.3 }}>
                    Invoice #
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', letterSpacing: 0.3 }}>
                    Customer
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', letterSpacing: 0.3 }}>
                    Amount
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', letterSpacing: 0.3 }}>
                    Date
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', letterSpacing: 0.3 }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', letterSpacing: 0.3 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow
                    key={inv.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      '& td': { py: 1.2 },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ fontSize: '0.8rem' }}>
                        {inv.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {inv.customer}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                        ₹{Number(inv.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                        {new Date(inv.date).toLocaleDateString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={inv.status}
                        size="small"
                        color={statusColor(inv.status) as any}
                        variant="filled"
                        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Invoice">
                        <IconButton
                          size="small"
                          onClick={() => router.push(`/invoices/${inv.id}`)}
                          sx={{
                            color: theme.palette.primary.main,
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                          }}
                        >
                          <VisibilityIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
});

export default RecentInvoicesTable;
