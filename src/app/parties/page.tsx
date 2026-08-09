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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Add,
  Search,
  VisibilityOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreVert,
  Group,
  Person,
  AccountBalance,
  LocalOffer,
  CheckCircle,
  Cancel,
  ChevronLeft,
  ChevronRight,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
  People,
  Business,
} from "@mui/icons-material";
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { VisuallyEnhancedDashboardLayout } from "@/components/ModernLayout";
import { Party, PartyFormData } from "@/types/party";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_SIZE = 25;

interface Category {
  id: string;
  name: string;
}

export default function PartiesPage() {
  const router = useRouter();
  const theme = useTheme();
  const { currentUser } = useAuth();

  // Core data
  const [parties, setParties] = useState<Party[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & pagination
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Action menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuParty, setMenuParty] = useState<Party | null>(null);

  // Add/Edit dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<PartyFormData>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    businessType: "Customer",
    isActive: true,
    creditLimit: 0,
    outstandingBalance: 0,
    categoryDiscounts: {},
  });

  // Discount dialog
  const [openDiscountDialog, setOpenDiscountDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [discountValue, setDiscountValue] = useState(0);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "", severity: "info" });

  const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info") =>
    setSnackbar({ open: true, message, severity });

  // Fetch data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const partiesSnapshot = await getDocs(collection(db, "parties"));
        if (!mounted) return;
        const partiesList = partiesSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          categoryDiscounts: d.data().categoryDiscounts || {},
          productDiscounts: d.data().productDiscounts || {},
        } as Party));
        setParties(partiesList);
        setError(null);

        // Fetch categories for discount dialog
        const catSnapshot = await getDocs(collection(db, "categories"));
        if (mounted) {
          setCategories(
            catSnapshot.docs.map((d) => ({ id: d.id, name: d.data().name } as Category))
          );
        }
      } catch {
        setError("Failed to load parties");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const total = parties.length;
    const active = parties.filter((p) => p.isActive !== false).length;
    const totalOutstanding = parties.reduce((sum, p) => sum + (p.outstandingBalance || 0), 0);
    const totalCreditLimit = parties.reduce((sum, p) => sum + (p.creditLimit || 0), 0);
    const withDiscounts = parties.filter(
      (p) => Object.keys(p.categoryDiscounts || {}).length > 0
    ).length;
    return { total, active, totalOutstanding, totalCreditLimit, withDiscounts };
  }, [parties]);

  // Filtering
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.phone || "").includes(q) ||
        (p.address || "").toLowerCase().includes(q)
    );
  }, [parties, query]);

  // Sorting: by name ascending
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, currentPage]);

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

  // Helpers
  const formatCurrency = (n?: number) => {
    const v = typeof n === "number" ? n : 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(v);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  const avatarColor = (name: string) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.success.main,
    ];
    return colors[name.length % colors.length];
  };

  const handleView = (party: Party) => {
    if (party.id) router.push(`/parties/${party.id}`);
  };

  const handleEdit = (party: Party) => {
    setSelectedParty(party);
    setFormData({
      name: party.name,
      email: party.email || "",
      phone: party.phone || "",
      address: party.address || "",
      businessType: party.businessType,
      isActive: party.isActive,
      creditLimit: party.creditLimit || 0,
      outstandingBalance: party.outstandingBalance || 0,
      categoryDiscounts: party.categoryDiscounts || {},
    });
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setSelectedParty(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      businessType: "Customer",
      isActive: true,
      creditLimit: 0,
      outstandingBalance: 0,
      categoryDiscounts: {},
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      showSnackbar("Party name is required", "error");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        email: formData.email || "",
        phone: formData.phone || "",
        address: formData.address || "",
        businessType: formData.businessType || "Customer",
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        creditLimit: formData.creditLimit || 0,
        outstandingBalance: formData.outstandingBalance || 0,
        categoryDiscounts: formData.categoryDiscounts || {},
        updatedAt: new Date().toISOString(),
        userId: currentUser?.uid,
      };

      if (selectedParty?.id) {
        await updateDoc(doc(db, "parties", selectedParty.id), payload);
        setParties((prev) =>
          prev.map((p) => (p.id === selectedParty.id ? { ...p, ...payload } : p))
        );
        showSnackbar("Party updated successfully", "success");
      } else {
        const docRef = await addDoc(collection(db, "parties"), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        setParties((prev) => [...prev, { id: docRef.id, ...payload } as Party]);
        showSnackbar("Party created successfully", "success");
      }
      setOpenDialog(false);
    } catch {
      showSnackbar("Failed to save party", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (party: Party) => {
    if (!party.id) return;
    if (!window.confirm(`Are you sure you want to delete "${party.name}"?`)) return;
    try {
      await deleteDoc(doc(db, "parties", party.id));
      setParties((prev) => prev.filter((p) => p.id !== party.id));
      showSnackbar("Party deleted successfully", "success");
    } catch {
      showSnackbar("Failed to delete party", "error");
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, party: Party) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuParty(party);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuParty(null);
  };

  // Discount management
  const handleAddDiscountOpen = () => {
    setSelectedCategory("");
    setDiscountValue(0);
    setOpenDiscountDialog(true);
  };

  const handleSaveDiscount = () => {
    if (!selectedCategory) return;
    setFormData((prev) => ({
      ...prev,
      categoryDiscounts: {
        ...prev.categoryDiscounts,
        [selectedCategory]: discountValue,
      },
    }));
    setOpenDiscountDialog(false);
  };

  const handleRemoveDiscount = (category: string) => {
    const updated = { ...formData.categoryDiscounts };
    delete updated[category];
    setFormData((prev) => ({ ...prev, categoryDiscounts: updated }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Stat cards config
  const statCards = [
    {
      label: "Total Parties",
      value: stats.total.toLocaleString(),
      icon: <People />,
      color: theme.palette.primary.main,
    },
    {
      label: "Active",
      value: stats.active.toLocaleString(),
      icon: <CheckCircle />,
      color: theme.palette.success.main,
    },
    {
      label: "Outstanding",
      value: formatCurrency(stats.totalOutstanding),
      icon: <AccountBalance />,
      color: theme.palette.warning.main,
    },
    {
      label: "Credit Limit",
      value: formatCurrency(stats.totalCreditLimit),
      icon: <Business />,
      color: theme.palette.info.main,
    },
    {
      label: "With Discounts",
      value: stats.withDiscounts.toString(),
      icon: <LocalOffer />,
      color: theme.palette.secondary.main,
    },
  ];

  return (
    <VisuallyEnhancedDashboardLayout
      title="Parties"
      pageType="parties"
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
              <Group />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Parties
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your customers and suppliers
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={handleAdd}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: 3,
            }}
          >
            New Party
          </Button>
        </Box>

        {/* Stat Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {statCards.map((card, idx) => (
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={idx}>
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

        {/* Search Bar */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            display: "flex",
            gap: 2,
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            placeholder="Search by name, email, phone, or address"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
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
              Loading parties...
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
        ) : (
          <>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                overflow: "hidden",
              }}
            >
              <Table sx={{ minWidth: 650 }} aria-label="parties">
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, py: 2 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Party Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Outstanding
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Credit Limit
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageItems.map((party, idx) => {
                    const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <TableRow
                        key={party.id || idx}
                        hover
                        sx={{
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onClick={() => handleView(party)}
                      >
                        <TableCell sx={{ color: "text.secondary", width: 40 }}>
                          {rowNum}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                bgcolor: avatarColor(party.name),
                                width: 32,
                                height: 32,
                                fontSize: "0.8rem",
                                fontWeight: 600,
                              }}
                            >
                              {getInitials(party.name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {party.name}
                              </Typography>
                              {party.address && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    maxWidth: 200,
                                  }}
                                >
                                  {party.address}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{party.email || "-"}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {party.phone || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={party.businessType || "Customer"}
                            size="small"
                            color={party.businessType === "Supplier" ? "secondary" : "primary"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color={
                              party.outstandingBalance && party.outstandingBalance > 0
                                ? "error.main"
                                : "text.secondary"
                            }
                          >
                            {party.outstandingBalance
                              ? formatCurrency(party.outstandingBalance)
                              : "-"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={500} color="success.main">
                            {party.creditLimit ? formatCurrency(party.creditLimit) : "-"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={party.isActive === false ? "Inactive" : "Active"}
                            size="small"
                            color={party.isActive === false ? "error" : "success"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, party)}
                            sx={{
                              "&:hover": {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                              },
                            }}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {pageItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Person
                          sx={{
                            fontSize: 56,
                            color: alpha(theme.palette.text.secondary, 0.4),
                            mb: 2,
                          }}
                        />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No parties found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {parties.length > 0
                            ? "Try adjusting your search to see more results."
                            : "Add your first party to get started."}
                        </Typography>
                        {parties.length === 0 && (
                          <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={handleAdd}
                            sx={{ mt: 2, borderRadius: 2 }}
                          >
                            Add First Party
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
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
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} parties
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
                Showing all {filtered.length} part{filtered.length === 1 ? "y" : "ies"}
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
            if (menuParty) handleView(menuParty);
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
            if (menuParty) handleEdit(menuParty);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Party</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            if (menuParty) handleDelete(menuParty);
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteOutlined fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add/Edit Party Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Person />
            {selectedParty ? "Edit Party" : "Add New Party"}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Party Name"
                  name="name"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Phone"
                  name="phone"
                  fullWidth
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Business Type</InputLabel>
                  <Select
                    value={formData.businessType || "Customer"}
                    label="Business Type"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        businessType: e.target.value as PartyFormData["businessType"],
                      }))
                    }
                  >
                    <MenuItem value="Customer">Customer</MenuItem>
                    <MenuItem value="Supplier">Supplier</MenuItem>
                    <MenuItem value="B2B">B2B</MenuItem>
                    <MenuItem value="B2C">B2C</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive !== false}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                      }
                    />
                  }
                  label="Active"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Address"
                  name="address"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Credit Limit"
                  name="creditLimit"
                  type="number"
                  fullWidth
                  value={formData.creditLimit || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, creditLimit: Number(e.target.value) }))
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Outstanding Balance"
                  name="outstandingBalance"
                  type="number"
                  fullWidth
                  value={formData.outstandingBalance || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      outstandingBalance: Number(e.target.value),
                    }))
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    Category Discounts
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Add />}
                    onClick={handleAddDiscountOpen}
                    variant="outlined"
                  >
                    Add Discount
                  </Button>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {Object.entries(formData.categoryDiscounts || {}).map(
                    ([category, discount]) => (
                      <Chip
                        key={category}
                        label={`${category}: ${discount}%`}
                        onDelete={() => handleRemoveDiscount(category)}
                        color="primary"
                        variant="outlined"
                      />
                    )
                  )}
                  {Object.keys(formData.categoryDiscounts || {}).length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ p: 2, textAlign: "center", width: "100%" }}
                    >
                      No category discounts added yet
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name || saving}
            startIcon={saving ? <CircularProgress size={20} /> : undefined}
          >
            {selectedParty ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Discount Dialog */}
      <Dialog
        open={openDiscountDialog}
        onClose={() => setOpenDiscountDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Category Discount</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <MenuItem
                    key={cat.id}
                    value={cat.name}
                    disabled={formData.categoryDiscounts?.[cat.name] !== undefined}
                  >
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Discount Percentage"
              type="number"
              fullWidth
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              InputProps={{
                inputProps: { min: 0, max: 100, step: 0.1 },
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              helperText="Enter discount percentage (0-100)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDiscountDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveDiscount}
            variant="contained"
            disabled={!selectedCategory || discountValue < 0 || discountValue > 100}
          >
            Add Discount
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </VisuallyEnhancedDashboardLayout>
  );
}
