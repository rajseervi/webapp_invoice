
'use client';
import React, { useEffect, useState, use, useMemo } from 'react';
import { Container, Typography, CircularProgress, Box, Alert, Grid, Paper, Divider, Chip, IconButton, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Collapse, useTheme, Fade, Grow, alpha, LinearProgress, Button, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import { partyService } from '@/services/partyService';
import type { Party } from '@/types/party';
import LedgerPrintView from '@/components/Ledger/LedgerPrintView';
import { 
  Person as PersonIcon, 
  Email as EmailIcon, 
  Phone as PhoneIcon, 
  LocationOn as LocationIcon, 
  Business as BusinessIcon, 
  Edit as EditIcon, 
  History as HistoryIcon,
  LocalOffer as DiscountIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FileDownload as FileDownloadIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { format, startOfMonth, endOfMonth, subMonths, isAfter, isBefore, isSameDay } from 'date-fns';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function PartyDetailPage({ params }: PageProps) {
  const router = useRouter();
  const theme = useTheme();
  const resolvedParams = use(params);
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalPayments: 0,
    invoiceCount: 0,
    purchaseCount: 0,
    paymentCount: 0
  });

  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(subMonths(new Date(), 3)));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [filterStats, setFilterStats] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalPayments: 0,
    invoiceCount: 0,
    purchaseCount: 0,
    paymentCount: 0
  });
  const [openPrintDialog, setOpenPrintDialog] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
      return (
        (isAfter(txDate, new Date(dateFrom.getTime() - 24 * 60 * 60 * 1000)) || isSameDay(txDate, dateFrom)) &&
        (isBefore(txDate, new Date(dateTo.getTime() + 24 * 60 * 60 * 1000)) || isSameDay(txDate, dateTo))
      );
    });
  }, [transactions, dateFrom, dateTo]);

  const ledgerTransactions = useMemo(() => {
    let balance = 0;
    return filteredTransactions.map(tx => {
      const txDate = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
      const debitAmount = tx.type === 'Sale' ? tx.amount : 0;
      const creditAmount = tx.type === 'Purchase' ? tx.amount : tx.type === 'Payment' ? tx.amount : 0;
      balance = balance + debitAmount - creditAmount;
      return {
        id: tx.id,
        date: format(txDate, 'yyyy-MM-dd'),
        description: tx.description,
        reference: tx.invoiceNumber || tx.referenceNumber || tx.id,
        debitAmount: debitAmount || undefined,
        creditAmount: creditAmount || undefined,
        balance: balance,
        type: debitAmount > 0 ? 'debit' : 'credit',
        amount: tx.amount
      };
    });
  }, [filteredTransactions]);

  useEffect(() => {
    let totalSales = 0, totalPurchases = 0, totalPayments = 0;
    let invoiceCount = 0, purchaseCount = 0, paymentCount = 0;

    filteredTransactions.forEach(tx => {
      if (tx.type === 'Sale') {
        totalSales += tx.amount;
        invoiceCount++;
      } else if (tx.type === 'Purchase') {
        totalPurchases += tx.amount;
        purchaseCount++;
      } else if (tx.type === 'Payment') {
        totalPayments += tx.amount;
        paymentCount++;
      }
    });

    setFilterStats({ totalSales, totalPurchases, totalPayments, invoiceCount, purchaseCount, paymentCount });
  }, [filteredTransactions]);

  useEffect(() => {
    const loadPartyData = async () => {
      try {
        const data = await partyService.getParty(resolvedParams.id);
        setParty(data);

        const allTransactions: any[] = [];
        let totalSales = 0, totalPurchases = 0, totalPayments = 0;
        let invoiceCount = 0, purchaseCount = 0, paymentCount = 0;

        try {
          const invoicesQuery = query(
            collection(db, 'invoices'),
            where('partyId', '==', resolvedParams.id),
            orderBy('createdAt', 'desc')
          );
          const invoicesSnap = await getDocs(invoicesQuery);
          invoicesSnap.forEach(doc => {
            const invoiceData = doc.data();
            const itemsTotal = (invoiceData.items || []).reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
            const amount = invoiceData.totalAmount || itemsTotal || 0;
            totalSales += amount;
            invoiceCount++;
            allTransactions.push({
              id: doc.id,
              type: 'Sale',
              amount: amount,
              date: invoiceData.date || invoiceData.createdAt,
              invoiceNumber: invoiceData.invoiceNumber,
              status: invoiceData.status || 'pending',
              description: `Invoice #${invoiceData.invoiceNumber || doc.id}`,
              items: invoiceData.items || []
            });
          });
        } catch (err) {
          console.warn('Could not fetch invoices:', err);
        }

        try {
          const purchasesQuery = query(
            collection(db, 'purchaseInvoices'),
            where('partyId', '==', resolvedParams.id),
            orderBy('createdAt', 'desc')
          );
          const purchasesSnap = await getDocs(purchasesQuery);
          purchasesSnap.forEach(doc => {
            const purchaseData = doc.data();
            const itemsTotal = (purchaseData.items || []).reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
            const amount = purchaseData.totalAmount || itemsTotal || 0;
            totalPurchases += amount;
            purchaseCount++;
            allTransactions.push({
              id: doc.id,
              type: 'Purchase',
              amount: amount,
              date: purchaseData.date || purchaseData.createdAt,
              invoiceNumber: purchaseData.invoiceNumber,
              status: purchaseData.status || 'pending',
              description: `Purchase #${purchaseData.invoiceNumber || doc.id}`,
              items: purchaseData.items || []
            });
          });
        } catch (err) {
          console.warn('Could not fetch purchases:', err);
        }

        try {
          const paymentsQuery = query(
            collection(db, 'payments'),
            where('partyId', '==', resolvedParams.id),
            orderBy('createdAt', 'desc')
          );
          const paymentsSnap = await getDocs(paymentsQuery);
          paymentsSnap.forEach(doc => {
            const paymentData = doc.data();
            totalPayments += paymentData.amount || 0;
            paymentCount++;
            allTransactions.push({
              id: doc.id,
              type: 'Payment',
              amount: paymentData.amount || 0,
              date: paymentData.date || paymentData.createdAt,
              status: 'completed',
              description: `Payment - ${paymentData.paymentMethod || 'Cash'}`,
              paymentMethod: paymentData.paymentMethod,
              referenceNumber: paymentData.referenceNumber
            });
          });
        } catch (err) {
          console.warn('Could not fetch payments:', err);
        }

        allTransactions.sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        setTransactions(allTransactions);
        setStats({
          totalSales,
          totalPurchases,
          totalPayments,
          invoiceCount,
          purchaseCount,
          paymentCount
        });
      } catch (err) {
        console.error('Error loading party:', err);
        setError('Failed to load party details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadPartyData();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <VisuallyEnhancedDashboardLayout
        title="Loading Party"
        pageType="parties"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Loading party details...
              </Typography>
            </Box>
          </Box>
        </Container>
      </VisuallyEnhancedDashboardLayout>
    );
  }

  if (error) {
    return (
      <VisuallyEnhancedDashboardLayout
        title="Error"
        pageType="parties"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </VisuallyEnhancedDashboardLayout>
    );
  }

  if (!party) {
    return (
      <VisuallyEnhancedDashboardLayout
        title="Party Not Found"
        pageType="parties"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="warning">Party not found.</Alert>
        </Container>
      </VisuallyEnhancedDashboardLayout>
    );
  }

  return (
    <VisuallyEnhancedDashboardLayout
      title={`Party: ${party.name}`}
      pageType="parties"
      enableVisualEffects={true}
      enableParticles={false}
    >
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title={`Party Details: ${party.name}`}
          subtitle="Comprehensive view of party information and associated discounts."
          icon={<PersonIcon />}
        />

        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <BusinessIcon sx={{ mr: 1, fontSize: 20 }} color="primary" /> General Information
          </Typography>
          <Divider sx={{ mb: 1.5 }} />

          <Grid container spacing={1.2} sx={{ mb: 1.5 }}>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>Name</Typography>
                <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.name}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.success.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>Business Type</Typography>
                <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 500 }}>
                  <Chip label={party.businessType} color="success" size="small" variant="outlined" sx={{ height: 20 }} />
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>Status</Typography>
                <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 500 }}>
                  <Chip label={party.isActive ? 'Active' : 'Inactive'} color={party.isActive ? 'success' : 'error'} size="small" sx={{ height: 20 }} />
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.warning.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>Contact Person</Typography>
                <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.contactPerson || 'N/A'}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '0.65rem' }}>
                  <EmailIcon sx={{ fontSize: '0.8rem', mr: 0.2 }} /> Email
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 500, wordBreak: 'break-word', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.email || 'N/A'}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '0.65rem' }}>
                  <PhoneIcon sx={{ fontSize: '0.8rem', mr: 0.2 }} /> Phone
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.phone || 'N/A'}</Typography>
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={1.2}>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.success.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>GSTIN</Typography>
                <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.gstin || 'N/A'}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.secondary.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>State Code</Typography>
                <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.stateCode || 'N/A'}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '0.65rem' }}>
                  <LocationIcon sx={{ fontSize: '0.8rem', mr: 0.2 }} /> Address
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 500, lineHeight: 1.3, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.address || 'N/A'}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.secondary.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>PAN Number</Typography>
                <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.panNumber || 'N/A'}</Typography>
              </Box>
            </Grid>

            {party.paymentTerms && (
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.warning.main, 0.05), borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>Payment Terms</Typography>
                  <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.paymentTerms}</Typography>
                </Box>
              </Grid>
            )}

            {party.preferredPaymentMethod && (
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}>Payment Method</Typography>
                  <Typography variant="body2" sx={{ mt: 0.2, fontWeight: 500 }}>
                    <Chip label={party.preferredPaymentMethod} size="small" variant="outlined" sx={{ height: 20 }} />
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.3, display: 'block', fontSize: '0.65rem' }}>Category Discounts</Typography>
                {Object.keys(party.categoryDiscounts || {}).length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                    {Object.entries(party.categoryDiscounts || {}).map(([categoryId, discount]) => (
                      <Chip key={categoryId} label={`${categoryId}: ${discount}%`} color="info" variant="outlined" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>None</Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ p: 0.8, backgroundColor: alpha(theme.palette.success.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 0.3, display: 'block', fontSize: '0.65rem' }}>Product Discounts</Typography>
                {Object.keys(party.productDiscounts || {}).length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                    {Object.entries(party.productDiscounts || {}).map(([productId, discount]) => (
                      <Chip key={productId} label={`${productId}: ${discount}%`} color="success" variant="outlined" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>None</Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, mb: 4 }}>
          <IconButton 
            color="primary" 
            aria-label="edit party" 
            onClick={() => router.push(`/parties/edit/${party.id}`)}
          >
            <EditIcon />
            <Typography variant="button" sx={{ ml: 1 }}>Edit Party</Typography>
          </IconButton>
          <IconButton 
            color="info" 
            aria-label="view history" 
            onClick={() => router.push(`/parties/${party.id}/history`)}
          >
            <HistoryIcon />
            <Typography variant="button" sx={{ ml: 1 }}>View History</Typography>
          </IconButton>
          <IconButton 
            color="secondary" 
            aria-label="print ledger" 
            onClick={() => setOpenPrintDialog(true)}
          >
            <PrintIcon />
            <Typography variant="button" sx={{ ml: 1 }}>Print Ledger</Typography>
          </IconButton>
        </Box>

        <Fade in={true}>
          <Box>
            <Paper elevation={2} sx={{ p: 3, mb: 4, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1 }} color="primary" />
                  Filter by Date Period
                </Typography>
                {(dateFrom.toDateString() !== startOfMonth(subMonths(new Date(), 3)).toDateString() || dateTo.toDateString() !== new Date().toDateString()) && (
                  <Button
                    size="small"
                    startIcon={<CloseIcon />}
                    onClick={() => {
                      setDateFrom(startOfMonth(subMonths(new Date(), 3)));
                      setDateTo(new Date());
                    }}
                    variant="outlined"
                  >
                    Reset
                  </Button>
                )}
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="From Date"
                    value={format(dateFrom, 'yyyy-MM-dd')}
                    onChange={(e) => setDateFrom(new Date(e.target.value))}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="To Date"
                    value={format(dateTo, 'yyyy-MM-dd')}
                    onChange={(e) => setDateTo(new Date(e.target.value))}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant={dateFrom.getTime() === subMonths(new Date(), 0).getTime() && dateTo.toDateString() === new Date().toDateString() ? 'contained' : 'outlined'}
                  onClick={() => {
                    setDateFrom(subMonths(new Date(), 0));
                    setDateTo(new Date());
                  }}
                >
                  Today
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setDateFrom(subMonths(new Date(), 0.23));
                    setDateTo(new Date());
                  }}
                >
                  Last 7 Days
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setDateFrom(subMonths(new Date(), 1));
                    setDateTo(new Date());
                  }}
                >
                  Last 30 Days
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setDateFrom(subMonths(new Date(), 3));
                    setDateTo(new Date());
                  }}
                >
                  Last 90 Days
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setDateFrom(startOfMonth(new Date()));
                    setDateTo(endOfMonth(new Date()));
                  }}
                >
                  Current Month
                </Button>
              </Box>
            </Paper>

            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1 }} color="primary" />
              Transaction Summary ({format(dateFrom, 'dd MMM yyyy')} to {format(dateTo, 'dd MMM yyyy')})
            </Typography>

            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Grow in={true} timeout={300}>
                  <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`, borderLeft: `4px solid ${theme.palette.success.main}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>Total Sales</Typography>
                          <Typography variant="h6">₹{filterStats.totalSales.toLocaleString('en-IN')}</Typography>
                          <Typography variant="caption" color="text.secondary">{filterStats.invoiceCount} invoices</Typography>
                        </Box>
                        <ReceiptIcon sx={{ fontSize: 40, color: theme.palette.success.main, opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Grow in={true} timeout={400}>
                  <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`, borderLeft: `4px solid ${theme.palette.info.main}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>Total Purchases</Typography>
                          <Typography variant="h6">₹{filterStats.totalPurchases.toLocaleString('en-IN')}</Typography>
                          <Typography variant="caption" color="text.secondary">{filterStats.purchaseCount} purchases</Typography>
                        </Box>
                        <ShoppingCartIcon sx={{ fontSize: 40, color: theme.palette.info.main, opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Grow in={true} timeout={500}>
                  <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`, borderLeft: `4px solid ${theme.palette.warning.main}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>Total Payments</Typography>
                          <Typography variant="h6">₹{filterStats.totalPayments.toLocaleString('en-IN')}</Typography>
                          <Typography variant="caption" color="text.secondary">{filterStats.paymentCount} payments</Typography>
                        </Box>
                        <PaymentIcon sx={{ fontSize: 40, color: theme.palette.warning.main, opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Grow in={true} timeout={600}>
                  <Card sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`, borderLeft: `4px solid ${theme.palette.secondary.main}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>Outstanding Balance</Typography>
                          <Typography variant="h6">₹{((filterStats.totalSales + filterStats.totalPurchases) - filterStats.totalPayments).toLocaleString('en-IN')}</Typography>
                          <Typography variant="caption" color="text.secondary">{filterStats.invoiceCount + filterStats.purchaseCount} transactions</Typography>
                        </Box>
                        <FileDownloadIcon sx={{ fontSize: 40, color: theme.palette.secondary.main, opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            </Grid>

            <Paper elevation={1} sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`, mb: 4, overflow: 'hidden', borderRadius: 2 }}>
              <Box sx={{ p: 2.5, borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ p: 1, backgroundColor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1.5 }}>
                    <HistoryIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.2 }}>Recent Activities</Typography>
                    <Typography variant="caption" color="text.secondary">{filteredTransactions.length} transactions</Typography>
                  </Box>
                </Box>
              </Box>

              {filteredTransactions.length === 0 ? (
                <Alert severity="info" sx={{ m: 2 }}>
                  {transactions.length === 0 
                    ? 'No transactions found for this party.' 
                    : `No transactions found for the selected period (${format(dateFrom, 'dd MMM yyyy')} to ${format(dateTo, 'dd MMM yyyy')}).`
                  }
                </Alert>
              ) : (
                <Box>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)` }}>
                          <TableCell sx={{ fontWeight: 'bold', color: theme.palette.primary.main, fontSize: '0.9rem', width: 50, py: 1.8 }}></TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: theme.palette.primary.main, fontSize: '0.9rem', py: 1.8 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: theme.palette.primary.main, fontSize: '0.9rem', py: 1.8 }}>Description</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: theme.palette.primary.main, fontSize: '0.9rem', py: 1.8 }} align="right">Amount</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: theme.palette.primary.main, fontSize: '0.9rem', py: 1.8 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: theme.palette.primary.main, fontSize: '0.9rem', py: 1.8 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredTransactions.map((tx, index) => {
                          const isExpanded = expandedRow === tx.id;
                          return (
                            <React.Fragment key={tx.id}>
                              <TableRow 
                                sx={{ 
                                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  backgroundColor: isExpanded ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                                  '&:hover': { 
                                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                    boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
                                  },
                                  cursor: 'pointer'
                                }}
                              >
                                <TableCell sx={{ py: 1.5, transition: 'transform 0.3s ease' }}>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => setExpandedRow(isExpanded ? null : tx.id)}
                                    sx={{ 
                                      transition: 'transform 0.3s ease',
                                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}
                                  >
                                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  </IconButton>
                                </TableCell>
                                <TableCell sx={{ py: 1.5 }}>
                                  <Chip
                                    icon={tx.type === 'Sale' ? <ReceiptIcon /> : tx.type === 'Purchase' ? <ShoppingCartIcon /> : <PaymentIcon />}
                                    label={tx.type}
                                    color={tx.type === 'Sale' ? 'success' : tx.type === 'Purchase' ? 'info' : 'warning'}
                                    variant="filled"
                                    size="small"
                                    sx={{ fontWeight: 600, fontSize: '0.75rem', transition: 'transform 0.2s ease', '&:hover': { transform: 'scale(1.05)' } }}
                                  />
                                </TableCell>
                                <TableCell sx={{ py: 1.5, fontWeight: 500 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" component="span">{tx.description}</Typography>
                                    {tx.invoiceNumber && (
                                      <Button
                                        size="small"
                                        variant="text"
                                        onClick={() => {
                                          if (tx.type === 'Sale') {
                                            router.push(`/invoices/${tx.id}`);
                                          } else if (tx.type === 'Purchase') {
                                            router.push(`/purchase-invoices/${tx.id}`);
                                          }
                                        }}
                                        sx={{ minWidth: 'auto', p: 0.5, textTransform: 'none', fontSize: '0.75rem' }}
                                      >
                                        View
                                      </Button>
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell align="right" sx={{ py: 1.5, fontWeight: 'bold', color: theme.palette.primary.main, fontSize: '1rem' }}>
                                  ₹{(tx.amount || 0).toLocaleString('en-IN')}
                                </TableCell>
                                <TableCell sx={{ py: 1.5, color: 'text.secondary', fontSize: '0.9rem' }}>
                                  {tx.date ? format(tx.date?.toDate ? tx.date.toDate() : new Date(tx.date), 'dd MMM yyyy') : 'N/A'}
                                </TableCell>
                                <TableCell sx={{ py: 1.5 }}>
                                  <Chip
                                    label={tx.status}
                                    color={tx.status === 'paid' || tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'}
                                    size="small"
                                    variant="filled"
                                    sx={{ fontWeight: 600, fontSize: '0.75rem', transition: 'transform 0.2s ease', '&:hover': { transform: 'scale(1.05)' } }}
                                  />
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell colSpan={6} sx={{ padding: 0, borderBottom: 'none' }}>
                                  <Collapse in={isExpanded} timeout={400} unmountOnExit>
                                    <Box sx={{ 
                                      p: 3, 
                                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                                      animation: 'slideDown 0.4s ease'
                                    }}>
                                      {tx.items && tx.items.length > 0 ? (
                                        <Box sx={{ mb: 2 }}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: theme.palette.primary.main, mr: 1 }} />
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Order Items</Typography>
                                          </Box>
                                          <Table size="small" sx={{ ml: 2 }}>
                                            <TableHead>
                                              <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.06) }}>
                                                <TableCell sx={{ fontSize: '0.8rem', fontWeight: 'bold', py: 1 }}>Product</TableCell>
                                                <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 'bold', py: 1 }}>Quantity</TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 'bold', py: 1 }}>Unit Price</TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 'bold', py: 1 }}>Total</TableCell>
                                              </TableRow>
                                            </TableHead>
                                            <TableBody>
                                              {tx.items.map((item: any, idx: number) => (
                                                <TableRow key={idx} sx={{ backgroundColor: idx % 2 === 0 ? 'transparent' : alpha(theme.palette.primary.main, 0.02) }}>
                                                  <TableCell sx={{ fontSize: '0.8rem', py: 0.8 }}>{item.productName || item.name || 'N/A'}</TableCell>
                                                  <TableCell align="center" sx={{ fontSize: '0.8rem', py: 0.8 }}>{item.quantity}</TableCell>
                                                  <TableCell align="right" sx={{ fontSize: '0.8rem', py: 0.8 }}>₹{(item.price || 0).toLocaleString('en-IN')}</TableCell>
                                                  <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 'bold', py: 0.8, color: theme.palette.primary.main }}>₹{((item.quantity || 0) * (item.price || 0)).toLocaleString('en-IN')}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </Box>
                                      ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No items details available.</Typography>
                                      )}
                                      {(tx.paymentMethod || tx.referenceNumber) && (
                                        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
                                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {tx.paymentMethod && (
                                              <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 140 }}>Payment Method:</Typography>
                                                <Chip label={tx.paymentMethod} size="small" variant="outlined" />
                                              </Box>
                                            )}
                                            {tx.referenceNumber && (
                                              <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 140 }}>Reference:</Typography>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{tx.referenceNumber}</Typography>
                                              </Box>
                                            )}
                                          </Box>
                                        </Box>
                                      )}
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>
        </Fade>

        <LedgerPrintView
          open={openPrintDialog}
          onClose={() => setOpenPrintDialog(false)}
          partyName={party.name}
          party={{
            name: party.name,
            address: party.address,
            phone: party.phone,
            email: party.email,
            gstNumber: party.gstin
          }}
          transactions={ledgerTransactions}
        />
      </Container>
    </VisuallyEnhancedDashboardLayout>
  );
}