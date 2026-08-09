"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
  Tooltip,
  alpha,
  Divider,
  useTheme,
  Card,
  CardContent,
  Avatar,
  Grid,
  Chip,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox,
} from "@mui/material";
import {
  Add,
  Search,
  VisibilityOutlined,
  EditOutlined,
  DeleteOutlined,
  PrintOutlined,
  MoreVert,
  ReceiptLong,
  Receipt,
  CurrencyRupee,
  PendingActions,
  CheckCircle,
  ErrorOutline,
  FilePresent,
  ChevronLeft,
  ChevronRight,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
  CalendarMonth,
  Print as PrintIcon,
  LocalPrintshop,
} from "@mui/icons-material";
import { invoiceService } from "@/services/invoiceService";
import { VisuallyEnhancedDashboardLayout } from "@/components/ModernLayout";

interface InvoiceItem {
  id?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  party?: { name?: string; phone?: string } | null;
  partyName?: string;
  partyPhone?: string;
  customer?: { name?: string; phone?: string } | null;
  date?: string;
  saleDate?: string;
  createdAt?: string;
  total?: number;
  totalAmount?: number;
  status?: string;
}

const PAGE_SIZE = 25;

export default function InvoicesPage() {
  const router = useRouter();
  const theme = useTheme();

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  const isToday = useCallback((dateStr?: string) => {
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    return d === todayStr;
  }, [todayStr]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuInvoice, setMenuInvoice] = useState<InvoiceItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const list = await invoiceService.getInvoices();
        if (!mounted) return;
        const sorted = [...list].sort((a: InvoiceItem, b: InvoiceItem) => {
          const da = new Date(a.date || a.saleDate || a.createdAt || 0).getTime();
          const db = new Date(b.date || b.saleDate || b.createdAt || 0).getTime();
          return db - da;
        });
        setInvoices(sorted);
        setError(null);
      } catch {
        setError("Failed to load invoices");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter((i) => (i.status || "pending").toLowerCase() === "paid").length;
    const pending = invoices.filter((i) => (i.status || "pending").toLowerCase() === "pending").length;
    const overdue = invoices.filter((i) => (i.status || "").toLowerCase() === "overdue").length;
    const totalValue = invoices.reduce(
      (sum, i) => sum + (i.total ?? i.totalAmount ?? 0),
      0
    );
    const todayInvoices = invoices.filter((i) =>
      isToday(i.date || i.saleDate || i.createdAt)
    );
    const todayCount = todayInvoices.length;
    const todayValue = todayInvoices.reduce(
      (sum, i) => sum + (i.total ?? i.totalAmount ?? 0),
      0
    );
    return { total, paid, pending, overdue, totalValue, todayCount, todayValue };
  }, [invoices, isToday]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = invoices.filter((inv) => {
      // Search filter
      if (q) {
        const number = (inv.invoiceNumber || inv.invoiceId || "").toString().toLowerCase();
        const party = (inv.party?.name || inv.partyName || "").toLowerCase();
        if (!number.includes(q) && !party.includes(q)) return false;
      }
      // Date range filter
      const invDate = (inv.date || inv.saleDate || inv.createdAt || "").slice(0, 10);
      if (startDate && invDate < startDate) return false;
      if (endDate && invDate > endDate) return false;
      return true;
    });

    // Apply sorting
    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortField) {
        case 'invoiceNumber':
          valA = a.invoiceNumber || a.invoiceId || '';
          valB = b.invoiceNumber || b.invoiceId || '';
          return valA.localeCompare(valB) * dir;
        case 'party': {
          valA = a.party?.name || a.partyName || '';
          valB = b.party?.name || b.partyName || '';
          return valA.localeCompare(valB) * dir;
        }
        case 'total':
          valA = a.total ?? a.totalAmount ?? 0;
          valB = b.total ?? b.totalAmount ?? 0;
          return ((valA as number) - (valB as number)) * dir;
        case 'date':
        default: {
          const da = new Date(a.date || a.saleDate || a.createdAt || 0).getTime();
          const db = new Date(b.date || b.saleDate || b.createdAt || 0).getTime();
          return (da - db) * dir;
        }
      }
    });

    return result;
  }, [invoices, query, startDate, endDate, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const d = new Date(value);
    return isNaN(d.getTime())
      ? "-"
      : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatAmount = (n?: number) => {
    const v = typeof n === "number" ? n : 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(v);
  };

  const handleNewInvoice = () => router.push("/invoices/new");
  const handleView = (inv: InvoiceItem) => {
    const id = inv.id || inv.invoiceId || inv.invoiceNumber;
    if (id) router.push(`/invoices/${id}`);
  };
  const handleEdit = (inv: InvoiceItem) => {
    const id = inv.id || inv.invoiceId || inv.invoiceNumber;
    if (id) router.push(`/invoices/${id}/edit`);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, inv: InvoiceItem) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuInvoice(inv);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuInvoice(null);
  };

  const handleSort = (field: string) => {
    setPage(1);
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pageItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageItems.map((inv) => inv.id || inv.invoiceId || inv.invoiceNumber || "").filter(Boolean)));
    }
  };

  const handleBatchPrint = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const params = ids.map((id) => `id=${encodeURIComponent(id)}`).join("&");
    router.push(`/invoices/print-multiple?${params}`);
  };

  const handleDeleteClick = (invoice: InvoiceItem) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    try {
      setIsDeleting(true);
      const id = invoiceToDelete.id || invoiceToDelete.invoiceId || invoiceToDelete.invoiceNumber;
      if (id) {
        await invoiceService.deleteInvoice(id);
        setInvoices(prev => prev.filter(inv => (inv.id || inv.invoiceId || inv.invoiceNumber) !== id));
        setDeleteDialogOpen(false);
        setInvoiceToDelete(null);
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
      alert('Failed to delete invoice');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(`Delete ${selectedIds.size} invoice(s)? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const idsArray = Array.from(selectedIds);
      await Promise.all(
        idsArray.map(id => invoiceService.deleteInvoice(id))
      );
      setInvoices(prev =>
        prev.filter(inv => !idsArray.includes(inv.id || inv.invoiceId || inv.invoiceNumber || ""))
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Error deleting invoices:', err);
      alert('Failed to delete some invoices');
    } finally {
      setIsDeleting(false);
    }
  };

  const statCards = [
    {
      label: "Today's Invoices",
      value: stats.todayCount.toLocaleString(),
      icon: <CalendarMonth />,
      color: theme.palette.success.dark,
    },
    {
      label: "Today's Value",
      value: formatAmount(stats.todayValue),
      icon: <CurrencyRupee />,
      color: theme.palette.info.dark,
    },
    {
      label: "Total Invoices",
      value: stats.total.toLocaleString(),
      icon: <ReceiptLong />,
      color: theme.palette.primary.main,
    },
    {
      label: "Total Value",
      value: formatAmount(stats.totalValue),
      icon: <CurrencyRupee />,
      color: theme.palette.info.main,
    },
    {
      label: "Paid",
      value: stats.paid.toString(),
      icon: <CheckCircle />,
      color: theme.palette.success.main,
    },
    {
      label: "Pending",
      value: stats.pending.toString(),
      icon: <PendingActions />,
      color: theme.palette.warning.main,
    },
    {
      label: "Overdue",
      value: stats.overdue.toString(),
      icon: <ErrorOutline />,
      color: theme.palette.error.main,
    },
  ];

  return (
    <VisuallyEnhancedDashboardLayout
      title="Invoices"
      pageType="invoices"
      enableVisualEffects={true}
      enableParticles={false}
    >
      <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 1, sm: 2, md: 3 }, py: 2 }}>
        {/* Page Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 42,
                height: 42,
              }}
            >
              <Receipt />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Invoices
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and track all invoices
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={handleNewInvoice}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: 3,
            }}
          >
            New Invoice
          </Button>
        </Box>

        {/* Stat Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {statCards.map((card, idx) => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={idx}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  background: alpha(card.color, 0.04),
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 6px 20px ${alpha(card.color, 0.12)}`,
                    borderColor: alpha(card.color, 0.3),
                  },
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(card.color, 0.12),
                        color: card.color,
                        width: 36,
                        height: 36,
                      }}
                    >
                      {card.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                        {card.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {card.label}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Search & Date Filter Bar */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1, sm: 2 },
            alignItems: { xs: "stretch", sm: "center" },
          }}
        >
          <TextField
            size="small"
            placeholder="Search by invoice # or party name"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            sx={{ flex: { sm: 1 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              type="date"
              size="small"
              label="From"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 150 }}
            />
            {(startDate || endDate) && (
              <Button
                size="small"
                variant="text"
                color="error"
                onClick={clearDateFilter}
                sx={{ textTransform: "none", whiteSpace: "nowrap" }}
              >
                Clear
              </Button>
            )}
            {selectedIds.size > 0 && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<PrintIcon />}
                  onClick={handleBatchPrint}
                  sx={{ textTransform: "none", whiteSpace: "nowrap", borderRadius: 2 }}
                >
                  Print ({selectedIds.size})
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<DeleteOutlined />}
                  onClick={handleBatchDelete}
                  disabled={isDeleting}
                  sx={{ textTransform: "none", whiteSpace: "nowrap", borderRadius: 2 }}
                >
                  Delete ({selectedIds.size})
                </Button>
              </>
            )}
          </Box>
        </Paper>

        {/* Content */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 320,
              gap: 2,
            }}
          >
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Loading invoices...
            </Typography>
          </Box>
        ) : error ? (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              bgcolor: alpha(theme.palette.error.main, 0.04),
            }}
          >
            <Typography color="error" fontWeight={500}>
              {error}
            </Typography>
          </Paper>
        ) : isMobile ? (
          <>
            {/* === MOBILE CARD LIST === */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
              {pageItems.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{ p: 4, textAlign: "center", borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}
                >
                  <FilePresent sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.4), mb: 1 }} />
                  <Typography variant="body1" color="text.secondary" fontWeight={600}>
                    {invoices.length > 0 ? "No matching invoices" : "No invoices yet"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {invoices.length > 0 ? "Try a different search term." : "Tap + to create your first invoice."}
                  </Typography>
                </Paper>
              ) : (
                pageItems.map((inv, idx) => {
                  const id = inv.id || inv.invoiceId || inv.invoiceNumber || `row-${idx}`;
                  const partyName = inv.party?.name || inv.partyName || "-";
                  const partyPhone = inv.party?.phone || inv.partyPhone || "";
                  const invNum = inv.invoiceNumber || inv.invoiceId || "-";
                  const invDate = formatDate(inv.date || inv.saleDate || inv.createdAt);
                  const invTotal = formatAmount(inv.total ?? inv.totalAmount);
                  const status = (inv.status || "pending").toLowerCase();
                  
                  return (
                    <Card
                      key={id}
                      elevation={0}
                      onClick={() => handleView(inv)}
                      sx={{
                        borderRadius: 2.5,
                        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:active": { transform: "scale(0.98)", bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      }}
                    >
                      <Box sx={{ p: 1.5 }}>
                        {/* Top row: inv# + actions */}
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar
                              sx={{
                                width: 32, height: 32,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                fontSize: "0.75rem",
                                fontWeight: 800,
                              }}
                            >
                              {invNum.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700} lineHeight={1.2}>
                                {invNum}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {invDate}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Chip
                              label={status}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 0.3,
                                bgcolor:
                                  status === "paid"
                                    ? alpha(theme.palette.success.main, 0.12)
                                    : status === "overdue"
                                    ? alpha(theme.palette.error.main, 0.12)
                                    : alpha(theme.palette.warning.main, 0.12),
                                color:
                                  status === "paid"
                                    ? theme.palette.success.main
                                    : status === "overdue"
                                    ? theme.palette.error.main
                                    : theme.palette.warning.main,
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, inv)}
                              sx={{ "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Party info */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1 }}>
                            {partyName}
                          </Typography>
                          {partyPhone && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {partyPhone}
                            </Typography>
                          )}
                        </Box>

                        {/* Total row */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            pt: 1,
                            borderTop: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Total
                          </Typography>
                          <Typography variant="body1" fontWeight={800} color={theme.palette.primary.main}>
                            {invTotal}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  );
                })
              )}
            </Box>

            {/* Mobile Pagination */}
            {filtered.length > PAGE_SIZE && (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mt: 1, mb: 2, flexWrap: "wrap" }}>
                <IconButton size="small" disabled={currentPage <= 1} onClick={() => setPage(1)}>
                  <KeyboardDoubleArrowLeft fontSize="small" />
                </IconButton>
                <IconButton size="small" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft fontSize="small" />
                </IconButton>
                <Typography variant="caption" color="text.secondary" sx={{ px: 1, fontWeight: 600 }}>
                  Page {currentPage} of {totalPages}
                </Typography>
                <IconButton size="small" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight fontSize="small" />
                </IconButton>
                <IconButton size="small" disabled={currentPage >= totalPages} onClick={() => setPage(totalPages)}>
                  <KeyboardDoubleArrowRight fontSize="small" />
                </IconButton>
              </Box>
            )}
          </>
        ) : (
          <>
            {/* === DESKTOP TABLE === */}
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                overflow: "hidden",
              }}
            >
              <Table sx={{ minWidth: 600 }} aria-label="invoices">
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, py: 2, width: 48 }}>
                      <Checkbox
                        size="small"
                        indeterminate={selectedIds.size > 0 && selectedIds.size < pageItems.length}
                        checked={pageItems.length > 0 && selectedIds.size === pageItems.length}
                        onChange={toggleSelectAll}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <TableSortLabel
                        active={sortField === 'invoiceNumber'}
                        direction={sortField === 'invoiceNumber' ? sortDir : 'asc'}
                        onClick={() => handleSort('invoiceNumber')}
                      >
                        Invoice #
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <TableSortLabel
                        active={sortField === 'party'}
                        direction={sortField === 'party' ? sortDir : 'asc'}
                        onClick={() => handleSort('party')}
                      >
                        Party
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      <TableSortLabel
                        active={sortField === 'date'}
                        direction={sortField === 'date' ? sortDir : 'asc'}
                        onClick={() => handleSort('date')}
                      >
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      <TableSortLabel
                        active={sortField === 'total'}
                        direction={sortField === 'total' ? sortDir : 'asc'}
                        onClick={() => handleSort('total')}
                      >
                        Total
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
              {pageItems.map((inv, idx) => {
                    const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;
                    const id = inv.id || inv.invoiceId || inv.invoiceNumber || `row-${idx}`;
                    const isSelected = selectedIds.has(id);
                    return (
                      <TableRow
                        key={id}
                        hover
                        selected={isSelected}
                        sx={{
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onClick={() => handleView(inv)}
                      >
                        <TableCell sx={{ width: 48 }} onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={() => toggleSelect(id)}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", width: 40 }}>
                          {rowNum}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {inv.invoiceNumber || inv.invoiceId || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {inv.party?.name || inv.partyName || "-"}
                            </Typography>
                            {(inv.party?.phone || inv.partyPhone) && (
                              <Typography variant="caption" color="text.secondary">
                                {inv.party?.phone || inv.partyPhone}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(inv.date || inv.saleDate || inv.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700}>
                            {formatAmount(inv.total ?? inv.totalAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <Tooltip title="Quick Print">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const id = inv.id || inv.invoiceId || inv.invoiceNumber;
                                  if (id) router.push(`/invoices/${id}/print/enhanced`);
                                }}
                                sx={{
                                  color: theme.palette.info.main,
                                  "&:hover": { bgcolor: alpha(theme.palette.info.main, 0.1) },
                                }}
                              >
                                <LocalPrintshop fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, inv)}
                              sx={{
                                "&:hover": {
                                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                                },
                              }}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {pageItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                        <FilePresent
                          sx={{
                            fontSize: 56,
                            color: alpha(theme.palette.text.secondary, 0.4),
                            mb: 2,
                          }}
                        />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No invoices found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {invoices.length > 0
                            ? "Try adjusting your search to see more results."
                            : "Create your first invoice to get started."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Desktop Pagination */}
            {filtered.length > PAGE_SIZE && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mt: 2,
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length} invoices
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Tooltip title="First Page">
                    <span>
                      <IconButton
                        size="small"
                        disabled={currentPage <= 1}
                        onClick={() => setPage(1)}
                      >
                        <KeyboardDoubleArrowLeft fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Previous">
                    <span>
                      <IconButton
                        size="small"
                        disabled={currentPage <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        <ChevronLeft fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>

                  {getPageNumbers().map((p, i) =>
                    typeof p === "string" ? (
                      <Typography
                        key={`dots-${i}`}
                        variant="body2"
                        sx={{ px: 0.5, color: "text.disabled" }}
                      >
                        ...
                      </Typography>
                    ) : (
                      <Button
                        key={p}
                        size="small"
                        variant={p === currentPage ? "contained" : "text"}
                        onClick={() => setPage(p)}
                        sx={{
                          minWidth: 32,
                          px: 1,
                          fontWeight: p === currentPage ? 700 : 400,
                          color: p === currentPage ? undefined : "text.primary",
                        }}
                      >
                        {p}
                      </Button>
                    )
                  )}

                  <Tooltip title="Next">
                    <span>
                      <IconButton
                        size="small"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Last Page">
                    <span>
                      <IconButton
                        size="small"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage(totalPages)}
                      >
                        <KeyboardDoubleArrowRight fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            )}

            {filtered.length > 0 && filtered.length <= PAGE_SIZE && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1.5, textAlign: "right" }}
              >
                Showing all {filtered.length} invoice(s)
              </Typography>
            )}
          </>
        )}
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            mt: 0.5,
            borderRadius: 2,
            minWidth: 160,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuInvoice) handleView(menuInvoice);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <VisibilityOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuInvoice) handleEdit(menuInvoice);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Invoice</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuInvoice) {
              const id = menuInvoice.id || menuInvoice.invoiceId || menuInvoice.invoiceNumber;
              if (id) window.open(`/invoices/${id}/print/enhanced?autoprint=true`, '_blank');
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <LocalPrintshop fontSize="small" />
          </ListItemIcon>
          <ListItemText>Quick Print</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuInvoice) {
              const id = menuInvoice.id || menuInvoice.invoiceId || menuInvoice.invoiceNumber;
              if (id) router.push(`/invoices/${id}/print/enhanced`);
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <PrintOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print Preview</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            if (menuInvoice) handleDeleteClick(menuInvoice);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteOutlined fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Delete Invoice
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mt: 1 }}>
            Are you sure you want to delete invoice <strong>{invoiceToDelete?.invoiceNumber || invoiceToDelete?.invoiceId}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </VisuallyEnhancedDashboardLayout>
  );
}
