'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { InvoiceRow } from '../types';
import { formatDateShort } from './format';

export interface RecentInvoicesCardProps {
  invoices: InvoiceRow[];
  loading?: boolean;
  maxVisible?: number;
}

const STATUS_TONES = {
  paid: { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)', label: 'Paid' },
  pending: { color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', label: 'Pending' },
  overdue: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', label: 'Overdue' },
} as const;

function statusTone(status: string): { color: string; bg: string; label: string } {
  const key = status.toLowerCase();
  if (key.includes('paid')) return STATUS_TONES.paid;
  if (key.includes('overdue')) return STATUS_TONES.overdue;
  return STATUS_TONES.pending;
}

export default function RecentInvoicesCard({
  invoices,
  loading = false,
  maxVisible = 6,
}: RecentInvoicesCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const visible = invoices.slice(0, maxVisible);

  if (loading) {
    return (
      <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: 2.5 }}>
          <Skeleton width={150} height={22} />
          <Box sx={{ mt: 2 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={40} sx={{ mb: 0.75, borderRadius: 1.5 }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const openInvoice = (id: string) => router.push(`/invoices/${id}`);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
      <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: 2.5, pt: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography fontWeight={700} sx={{ fontSize: '0.95rem' }}>
              Recent Invoices
            </Typography>
            <Button
              size="small"
              endIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
              onClick={() => router.push('/invoices')}
              sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700 }}
            >
              View All
            </Button>
          </Stack>

          {visible.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No invoices yet
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ mx: -1.25, width: 'calc(100% + 20px)', px: 0 }}>
              <Table size="small" sx={{ minWidth: 520 }}>
                <TableHead>
                  <TableRow>
                    {['Invoice', 'Customer', 'Amount', 'Status', 'Date'].map((heading) => (
                      <TableCell
                        key={heading}
                        align={heading === 'Amount' || heading === 'Date' ? 'right' : 'left'}
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 700,
                          fontSize: '0.66rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.6,
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {heading}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visible.map((inv, idx) => {
                    const tone = statusTone(inv.status);
                    const isHovered = hoveredId === inv.id;
                    return (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, delay: 0.03 * idx }}
                        onMouseEnter={() => setHoveredId(inv.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => openInvoice(inv.id)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isHovered ? alpha('#2563eb', 0.05) : 'transparent',
                          transition: 'background-color .18s ease',
                        }}
                      >
                        <TableCell sx={{ borderBottom: `1px solid ${theme.palette.divider}`, whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.78rem' }}>
                            {inv.invoiceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: `1px solid ${theme.palette.divider}`, maxWidth: 160 }}>
                          <Typography variant="body2" noWrap sx={{ fontSize: '0.78rem' }}>
                            {inv.customer}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ borderBottom: `1px solid ${theme.palette.divider}`, whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.78rem' }}>
                            ₹{inv.amount.toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: `1px solid ${theme.palette.divider}`, whiteSpace: 'nowrap' }}>
                          <Chip
                            label={tone.label}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.64rem',
                              fontWeight: 700,
                              color: tone.color,
                              bgcolor: tone.bg,
                              border: `1px solid ${tone.color}33`,
                              '& .MuiChip-label': { px: 1 },
                            }}
                          />
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            whiteSpace: 'nowrap',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                            {formatDateShort(inv.date)}
                          </Typography>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
