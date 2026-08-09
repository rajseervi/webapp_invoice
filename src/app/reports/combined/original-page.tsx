"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Collapse,
  TablePagination,
  InputAdornment,
  Badge,
  alpha,
  useTheme,
  ThemeProvider,
  createTheme,
  styled,
  keyframes,
  Fab,
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  CurrencyRupee as RupeeIcon,
  ShoppingCart as CartIcon,
  FileCopy as FileIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useParties } from "@/app/hooks/useParties";
import { useProducts } from "@/app/hooks/useProducts";
import { useCategories } from "@/app/hooks/useCategories";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  partyId: string;
  partyName: string;
  partyPhone?: string;
  subtotal: number;
  discount: number;
  transportCharges: number;
  total: number;
  itemsCount: number;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    discount: number;
    finalPrice: number;
    category: string;
  }>;
}

interface ProductReportItem {
  id: string;
  name: string;
  category: string;
  price: number;
  purchasePrice?: number;
  stock: number;
  totalSales: number;
  totalRevenue: number;
  profit: number;
  margin: number;
}

interface PartyReportItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalInvoices: number;
  totalAmount: number;
  lastInvoiceDate: string;
  categoryDiscounts: Record<string, number>;
}

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.04); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// ─── Styled Components ───────────────────────────────────────────────────────

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  border: `2px solid ${alpha(theme.palette.common.black, 0.12)}`,
  boxShadow: `6px 6px 0px ${alpha(theme.palette.common.black, 0.08)}`,
  transition: "all 0.25s ease",
  overflow: "visible",
  "&:hover": {
    boxShadow: `8px 8px 0px ${alpha(theme.palette.common.black, 0.14)}`,
    transform: "translateY(-2px)",
  },
}));

const StatCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  border: `2px solid ${alpha(theme.palette.common.black, 0.14)}`,
  boxShadow: `5px 5px 0px ${alpha(theme.palette.common.black, 0.1)}`,
  transition: "all 0.25s ease",
  height: "100%",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  "&:hover": {
    boxShadow: `7px 7px 0px ${alpha(theme.palette.common.black, 0.16)}`,
    transform: "translateY(-3px)",
  },
}));

const GradientTab = styled(Tab)(({ theme }) => ({
  fontWeight: 700,
  fontSize: "0.85rem",
  textTransform: "none",
  minHeight: 56,
  transition: "all 0.2s",
  "&.Mui-selected": {
    color: theme.palette.common.white,
  },
}));

const FilterPanel = styled(Paper)(({ theme }) => ({
  borderRadius: 14,
  border: `2px solid ${alpha(theme.palette.common.black, 0.12)}`,
  boxShadow: `4px 4px 0px ${alpha(theme.palette.common.black, 0.08)}`,
  background: theme.palette.background.paper,
  overflow: "hidden",
}));

const StyledTable = styled(Table)(({ theme }) => ({
  "& thead th": {
    fontWeight: 700,
    fontSize: "0.72rem",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: alpha(theme.palette.text.secondary, 0.8),
    borderBottom: `2px solid ${alpha(theme.palette.common.black, 0.1)}`,
  },
  "& tbody tr": {
    transition: "background 0.15s",
    "&:hover": {
      background: alpha(theme.palette.primary.main, 0.04),
    },
    "&:last-child td": {
      borderBottom: "none",
    },
  },
  "& tbody td": {
    borderBottom: `1px solid ${alpha(theme.palette.common.black, 0.06)}`,
    padding: "10px 16px",
  },
}));

const GlowBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    fontWeight: 700,
    fontSize: "0.65rem",
    border: `2px solid ${theme.palette.background.paper}`,
  },
}));

const COLORS = ["#FF6B35", "#004E98", "#3A86FF", "#8338EC", "#FF006E", "#FB5607", "#FFBE0B", "#06D6A0"];

// ─── Tab Panel ───────────────────────────────────────────────────────────────

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanelComp(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`combined-tabpanel-${index}`} {...other}>
      {value === index && (
        <Box sx={{ animation: `${fadeIn} 0.35s ease-out`, pt: 3 }}>{children}</Box>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CombinedReportPage() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { parties } = useParties();
  const { products } = useProducts();
  const { categories } = useCategories();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // ── Invoice filters ──
  const [invDateFrom, setInvDateFrom] = useState("");
  const [invDateTo, setInvDateTo] = useState("");
  const [invSearch, setInvSearch] = useState("");
  const [invMinAmount, setInvMinAmount] = useState("");
  const [invMaxAmount, setInvMaxAmount] = useState("");
  const [showInvFilters, setShowInvFilters] = useState(true);

  // ── Product filters ──
  const [prodCategory, setProdCategory] = useState("");
  const [prodSearch, setProdSearch] = useState("");
  const [prodPriceMin, setProdPriceMin] = useState("");
  const [prodPriceMax, setProdPriceMax] = useState("");
  const [prodStockStatus, setProdStockStatus] = useState("all");
  const [showProdFilters, setShowProdFilters] = useState(true);

  // ── Party filters ──
  const [partySearch, setPartySearch] = useState("");
  const [partyMinInvoices, setPartyMinInvoices] = useState("");
  const [partyMinAmount, setPartyMinAmount] = useState("");
  const [showPartyFilters, setShowPartyFilters] = useState(true);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ─── Load invoices ─────────────────────────────────────────────────────────

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const snapshot = await getDocs(collection(db, "invoices"));
      const list: InvoiceData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const items = data.items || [];
        return {
          id: doc.id,
          invoiceNumber: data.invoiceNumber || "",
          date: data.date || "",
          partyId: data.partyId || "",
          partyName: data.partyName || "",
          partyPhone: data.partyPhone || "",
          subtotal: data.subtotal || 0,
          discount: data.discount || 0,
          transportCharges: data.transportCharges || 0,
          total: data.total || 0,
          itemsCount: items.length,
          items: items.map((i: any) => ({
            productId: i.productId || "",
            name: i.name || "",
            quantity: i.quantity || 0,
            price: i.price || 0,
            discount: i.discount || 0,
            finalPrice: i.finalPrice || 0,
            category: i.category || "",
          })),
        };
      });
      setInvoices(list);
    } catch (err) {
      setError("Failed to load invoices for reports");
    } finally {
      setLoadingInvoices(false);
      setLoading(false);
    }
  };

  // ─── Computed data ─────────────────────────────────────────────────────────

  const productReportData: ProductReportItem[] = useMemo(() => {
    return products.map((p) => {
      const sales = invoices
        .flatMap((inv) => inv.items)
        .filter((item) => item.productId === p.id);
      const totalQty = sales.reduce((sum, s) => sum + s.quantity, 0);
      const totalRev = sales.reduce((sum, s) => sum + s.finalPrice, 0);
      const cost = (p.purchasePrice || p.price) * totalQty;
      const profit = totalRev - cost;
      const margin = totalRev > 0 ? (profit / totalRev) * 100 : 0;
      return {
        id: p.id,
        name: p.name,
        category: p.category || "Uncategorized",
        price: p.price,
        purchasePrice: p.purchasePrice,
        stock: p.stock ?? p.quantity ?? 0,
        totalSales: totalQty,
        totalRevenue: totalRev,
        profit,
        margin,
      };
    });
  }, [products, invoices]);

  const partyReportData: PartyReportItem[] = useMemo(() => {
    return parties.map((p) => {
      const partyInvoices = invoices.filter(
        (inv) => inv.partyId === p.id || inv.partyName === p.name
      );
      const totalAmount = partyInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const dates = partyInvoices.map((inv) => inv.date).filter(Boolean).sort();
      return {
        id: p.id,
        name: p.name,
        phone: p.phone || "",
        email: p.email || "",
        address: p.address || "",
        totalInvoices: partyInvoices.length,
        totalAmount,
        lastInvoiceDate: dates.length > 0 ? dates[dates.length - 1] : "N/A",
        categoryDiscounts: p.categoryDiscounts || {},
      };
    });
  }, [parties, invoices]);

  // ─── Filters ───────────────────────────────────────────────────────────────

  const filteredInvoices = useMemo(() => {
    let result = [...invoices];
    if (invDateFrom) result = result.filter((inv) => inv.date >= invDateFrom);
    if (invDateTo) result = result.filter((inv) => inv.date <= invDateTo);
    if (invSearch) {
      const q = invSearch.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.partyName.toLowerCase().includes(q) ||
          inv.items.some((item) => item.name.toLowerCase().includes(q))
      );
    }
    if (invMinAmount) {
      const min = parseFloat(invMinAmount);
      if (!isNaN(min)) result = result.filter((inv) => inv.total >= min);
    }
    if (invMaxAmount) {
      const max = parseFloat(invMaxAmount);
      if (!isNaN(max)) result = result.filter((inv) => inv.total <= max);
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [invoices, invDateFrom, invDateTo, invSearch, invMinAmount, invMaxAmount]);

  const filteredProducts = useMemo(() => {
    let result = [...productReportData];
    if (prodCategory) result = result.filter((p) => p.category === prodCategory);
    if (prodSearch) {
      const q = prodSearch.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (prodPriceMin) {
      const min = parseFloat(prodPriceMin);
      if (!isNaN(min)) result = result.filter((p) => p.price >= min);
    }
    if (prodPriceMax) {
      const max = parseFloat(prodPriceMax);
      if (!isNaN(max)) result = result.filter((p) => p.price <= max);
    }
    if (prodStockStatus === "in_stock") result = result.filter((p) => p.stock > 0);
    else if (prodStockStatus === "low_stock") result = result.filter((p) => p.stock > 0 && p.stock <= 5);
    else if (prodStockStatus === "out_of_stock") result = result.filter((p) => p.stock === 0);
    return result;
  }, [productReportData, prodCategory, prodSearch, prodPriceMin, prodPriceMax, prodStockStatus]);

  const filteredParties = useMemo(() => {
    let result = [...partyReportData];
    if (partySearch) {
      const q = partySearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.email.toLowerCase().includes(q)
      );
    }
    if (partyMinInvoices) {
      const min = parseInt(partyMinInvoices);
      if (!isNaN(min)) result = result.filter((p) => p.totalInvoices >= min);
    }
    if (partyMinAmount) {
      const min = parseFloat(partyMinAmount);
      if (!isNaN(min)) result = result.filter((p) => p.totalAmount >= min);
    }
    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [partyReportData, partySearch, partyMinInvoices, partyMinAmount]);

  // ─── Charts ────────────────────────────────────────────────────────────────

  const monthlyInvoiceData = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    filteredInvoices.forEach((inv) => {
      const month = inv.date.substring(0, 7);
      const existing = map.get(month) || { count: 0, amount: 0 };
      existing.count++;
      existing.amount += inv.total;
      map.set(month, existing);
    });
    return Array.from(map.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [filteredInvoices]);

  const categorySalesData = useMemo(() => {
    const map = new Map<string, number>();
    filteredInvoices.forEach((inv) =>
      inv.items.forEach((item) => {
        const cat = item.category || "Uncategorized";
        map.set(cat, (map.get(cat) || 0) + item.finalPrice);
      })
    );
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredInvoices]);

  const productCategoryDist = useMemo(() => {
    const map = new Map<string, number>();
    filteredProducts.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1));
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredProducts]);

  const partyTopData = useMemo(() => filteredParties.slice(0, 10), [filteredParties]);

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const totalRevenue = useMemo(() => filteredInvoices.reduce((s, i) => s + i.total, 0), [filteredInvoices]);
  const totalDiscount = useMemo(() => filteredInvoices.reduce((s, i) => s + i.discount, 0), [filteredInvoices]);
  const avgPerInvoice = filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0;

  const tabIcons = [<ReceiptIcon key="inv" />, <InventoryIcon key="prod" />, <PeopleIcon key="party" />];
  const tabLabels = ["Invoice Report", "Product Report", "Party Report"];

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={52} thickness={4} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary" fontWeight={600}>
            Loading reports…
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ animation: `${fadeIn} 0.4s ease-out` }}>
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 3, border: `2px solid ${alpha(theme.palette.error.main, 0.3)}` }}
          action={
            <Button size="small" color="inherit" onClick={loadInvoices}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 4,
          border: `2px solid ${alpha(theme.palette.common.black, 0.12)}`,
          boxShadow: `6px 6px 0px ${alpha(theme.palette.common.black, 0.08)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.5rem", md: "2rem" }, letterSpacing: "-0.5px" }}>
              📊 Reports Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
              Invoice, product & party analytics with live filters
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => { setLoading(true); loadInvoices(); }}
            sx={{ borderRadius: 3, borderWidth: 2, fontWeight: 700 }}
          >
            Refresh Data
          </Button>
        </Box>
      </Box>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {[
          {
            label: "Total Invoices",
            value: invoices.length,
            filtered: filteredInvoices.length,
            icon: <ReceiptIcon />,
            color: theme.palette.primary.main,
          },
          {
            label: "Total Revenue",
            value: fmtCurrency(totalRevenue),
            filtered: `${filteredInvoices.length} invoices`,
            icon: <RupeeIcon />,
            color: theme.palette.success.main,
          },
          {
            label: "Products",
            value: products.length,
            filtered: `${filteredProducts.length} filtered`,
            icon: <InventoryIcon />,
            color: theme.palette.warning.main,
          },
          {
            label: "Parties",
            value: parties.length,
            filtered: `${filteredParties.length} filtered`,
            icon: <PeopleIcon />,
            color: theme.palette.info.main,
          },
          {
            label: "Avg / Invoice",
            value: fmtCurrency(avgPerInvoice),
            filtered: `${filteredInvoices.length} invoices`,
            icon: <TrendingUpIcon />,
            color: theme.palette.secondary.main,
          },
          {
            label: "Total Discount",
            value: fmtCurrency(totalDiscount),
            filtered: "across invoices",
            icon: <CartIcon />,
            color: theme.palette.error.main,
          },
        ].map((stat, i) => (
          <Grid item xs={6} sm={4} md={2} key={i}>
            <StatCard>
              <Box sx={{ "&::before": { background: stat.color } }} />
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: 0.8 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5, lineHeight: 1.1 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <AvatarCircle color={stat.color}>{stat.icon}</AvatarCircle>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", fontWeight: 600 }}>
                  {stat.filtered}
                </Typography>
              </CardContent>
            </StatCard>
          </Grid>
        ))}
      </Grid>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <FilterPanel sx={{ mb: 0, borderRadius: "14px 14px 0 0" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: 56,
            "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.82rem",
              minHeight: 56,
              transition: "all 0.2s",
            },
          }}
        >
          {tabLabels.map((label, i) => (
            <Tab
              key={label}
              icon={tabIcons[i]}
              iconPosition="start"
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {label}
                  <Chip
                    label={[filteredInvoices.length, filteredProducts.length, filteredParties.length][i]}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, ml: 0.5 }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
      </FilterPanel>

      {/* ════════════════════════════════════════════════════════════════
          TAB 1: INVOICE REPORT
          ════════════════════════════════════════════════════════════════ */}
      <TabPanelComp value={tabValue} index={0}>
        {/* Filters */}
        <FilterPanel sx={{ mb: 3 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, cursor: "pointer", userSelect: "none" }}
            onClick={() => setShowInvFilters(!showInvFilters)}
          >
            <Typography variant="subtitle1" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterIcon sx={{ fontSize: 20 }} />
              Advanced Filters
              <GlowBadge
                badgeContent={[invDateFrom, invDateTo, invSearch, invMinAmount, invMaxAmount].filter(Boolean).length}
                color="primary"
                sx={{ ml: 0.5 }}
              >
                <Chip label={`${filteredInvoices.length} results`} size="small" sx={{ fontWeight: 700, height: 22, fontSize: "0.65rem" }} />
              </GlowBadge>
            </Typography>
            <IconButton size="small">{showInvFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
          </Box>
          <Collapse in={showInvFilters}>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth size="small" label="Search" value={invSearch} onChange={(e) => setInvSearch(e.target.value)}
                    placeholder="Invoice #, Party, Product…"
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField fullWidth size="small" label="From" type="date" value={invDateFrom} onChange={(e) => setInvDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField fullWidth size="small" label="To" type="date" value={invDateTo} onChange={(e) => setInvDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField fullWidth size="small" label="Min (₹)" type="number" value={invMinAmount} onChange={(e) => setInvMinAmount(e.target.value)} />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField fullWidth size="small" label="Max (₹)" type="number" value={invMaxAmount} onChange={(e) => setInvMaxAmount(e.target.value)} />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button variant="outlined" size="small" onClick={() => { setInvDateFrom(""); setInvDateTo(""); setInvSearch(""); setInvMinAmount(""); setInvMaxAmount(""); }}
                    sx={{ height: "100%", minWidth: 40, borderRadius: 2, borderWidth: 2 }}>
                    <ClearIcon fontSize="small" />
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </FilterPanel>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={7}>
            <StyledCard>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  📈 Monthly Invoice Trend
                </Typography>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyInvoiceData}>
                      <defs>
                        <linearGradient id="amtGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.4)} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(value: number) => fmtCurrency(value)} />
                      <Area type="monotone" dataKey="amount" stroke={theme.palette.primary.main} fill="url(#amtGrad)" strokeWidth={3} name="Amount" />
                      <Bar dataKey="count" fill={theme.palette.success.main} opacity={0.5} name="Count" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
          <Grid item xs={12} md={5}>
            <StyledCard>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  🥧 Revenue by Category
                </Typography>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categorySalesData.slice(0, 6)} cx="50%" cy="50%" outerRadius={90}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} dataKey="value">
                        {categorySalesData.slice(0, 6).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} stroke={alpha(theme.palette.common.black, 0.1)} strokeWidth={2} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => fmtCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                  {categorySalesData.slice(0, 6).map((c, i) => (
                    <Chip key={c.name} label={`${c.name}`} size="small"
                      sx={{ bgcolor: alpha(COLORS[i % COLORS.length], 0.15), color: COLORS[i % COLORS.length], fontWeight: 700, fontSize: "0.6rem" }} />
                  ))}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        {/* Table */}
        <StyledCard>
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, pt: 2.5, pb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                📄 Invoice Details <Chip label={filteredInvoices.length} size="small" color="primary" sx={{ ml: 1, fontWeight: 700 }} />
              </Typography>
              <TablePagination
                component="div"
                count={filteredInvoices.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                sx={{ ".MuiTablePagination-toolbar": { pl: 0 }, ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": { fontSize: "0.75rem", fontWeight: 600 } }}
              />
            </Box>
            <TableContainer>
              <StyledTable>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Party</TableCell>
                    <TableCell align="right">Items</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="right">Discount</TableCell>
                    <TableCell align="right">Transport</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary" fontWeight={600}>No invoices match your filters</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((inv) => (
                      <TableRow key={inv.id} hover>
                        <TableCell><Typography fontWeight={700} variant="body2">{inv.invoiceNumber}</Typography></TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <CalendarTodayIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                            <Typography variant="body2">{inv.date}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{inv.partyName}</Typography>
                          {inv.partyPhone && <Typography variant="caption" color="text.secondary">{inv.partyPhone}</Typography>}
                        </TableCell>
                        <TableCell align="right"><Chip label={inv.itemsCount} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: "0.65rem" }} /></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight={600}>{fmtCurrency(inv.subtotal)}</Typography></TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: inv.discount > 0 ? theme.palette.error.main : "inherit", fontWeight: inv.discount > 0 ? 700 : 400 }}>
                            {inv.discount > 0 ? `-${fmtCurrency(inv.discount)}` : "—"}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{inv.transportCharges > 0 ? fmtCurrency(inv.transportCharges) : "—"}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={800} color="primary.main">
                            {fmtCurrency(inv.total)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </StyledTable>
            </TableContainer>
          </CardContent>
        </StyledCard>
      </TabPanelComp>

      {/* ════════════════════════════════════════════════════════════════
          TAB 2: PRODUCT REPORT
          ════════════════════════════════════════════════════════════════ */}
      <TabPanelComp value={tabValue} index={1}>
        <FilterPanel sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, cursor: "pointer", userSelect: "none" }}
            onClick={() => setShowProdFilters(!showProdFilters)}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterIcon sx={{ fontSize: 20 }} /> Advanced Filters
              <GlowBadge badgeContent={[prodSearch, prodCategory, prodPriceMin, prodPriceMax, prodStockStatus !== "all" ? 1 : ""].filter(Boolean).length} color="primary" sx={{ ml: 0.5 }}>
                <Chip label={`${filteredProducts.length} results`} size="small" sx={{ fontWeight: 700, height: 22, fontSize: "0.65rem" }} />
              </GlowBadge>
            </Typography>
            <IconButton size="small">{showProdFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
          </Box>
          <Collapse in={showProdFilters}>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth size="small" label="Search Product" value={prodSearch} onChange={(e) => setProdSearch(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select value={prodCategory} label="Category" onChange={(e) => setProdCategory(e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      {categories.map((c) => (<MenuItem key={c.id || c.name} value={c.name}>{c.name}</MenuItem>))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Stock</InputLabel>
                    <Select value={prodStockStatus} label="Stock" onChange={(e) => setProdStockStatus(e.target.value)}>
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="in_stock">In Stock</MenuItem>
                      <MenuItem value="low_stock">Low Stock (≤5)</MenuItem>
                      <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField fullWidth size="small" label="Min Price (₹)" type="number" value={prodPriceMin} onChange={(e) => setProdPriceMin(e.target.value)} />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField fullWidth size="small" label="Max Price (₹)" type="number" value={prodPriceMax} onChange={(e) => setProdPriceMax(e.target.value)} />
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button variant="outlined" size="small" onClick={() => { setProdCategory(""); setProdSearch(""); setProdPriceMin(""); setProdPriceMax(""); setProdStockStatus("all"); }}
                    sx={{ height: "100%", minWidth: 40, borderRadius: 2, borderWidth: 2 }}>
                    <ClearIcon fontSize="small" />
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </FilterPanel>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>🥧 Category Distribution</Typography>
                <Box sx={{ height: 270 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={productCategoryDist} cx="50%" cy="50%" outerRadius={85}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} dataKey="count">
                        {productCategoryDist.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} stroke={alpha(theme.palette.common.black, 0.1)} strokeWidth={2} />))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                  {productCategoryDist.map((c, i) => (
                    <Chip key={c.name} label={`${c.name} (${c.count})`} size="small"
                      sx={{ bgcolor: alpha(COLORS[i % COLORS.length], 0.12), color: COLORS[i % COLORS.length], fontWeight: 700, fontSize: "0.6rem" }} />
                  ))}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>📊 Stock Status</Typography>
                <Box sx={{ height: 270 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: "🟢 In Stock", value: filteredProducts.filter((p) => p.stock > 0).length },
                      { name: "🟡 Low Stock", value: filteredProducts.filter((p) => p.stock > 0 && p.stock <= 5).length },
                      { name: "🔴 Out", value: filteredProducts.filter((p) => p.stock === 0).length },
                    ]} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.4)} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fontWeight: 600 }} />
                      <RechartsTooltip />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        <Cell fill="#4CAF50" />
                        <Cell fill="#FFA500" />
                        <Cell fill="#FF4444" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        <StyledCard>
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, pt: 2.5, pb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                📦 Product Details <Chip label={filteredProducts.length} size="small" color="primary" sx={{ ml: 1, fontWeight: 700 }} />
              </Typography>
              <TablePagination
                component="div"
                count={filteredProducts.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                sx={{ ".MuiTablePagination-toolbar": { pl: 0 }, ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": { fontSize: "0.75rem", fontWeight: 600 } }}
              />
            </Box>
            <TableContainer>
              <StyledTable>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Purchase</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell align="right">Sales</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Profit</TableCell>
                    <TableCell align="right">Margin</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary" fontWeight={600}>No products match your filters</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={700}>{p.name}</Typography></TableCell>
                        <TableCell><Chip label={p.category} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.6rem" }} /></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight={600}>{fmtCurrency(p.price)}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2">{p.purchasePrice ? fmtCurrency(p.purchasePrice) : "—"}</Typography></TableCell>
                        <TableCell align="right">
                          <Chip label={p.stock} size="small"
                            color={p.stock === 0 ? "error" : p.stock <= 5 ? "warning" : "success"}
                            variant="outlined" sx={{ fontWeight: 700, fontSize: "0.65rem", minWidth: 40 }} />
                        </TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight={600}>{p.totalSales}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight={600}>{fmtCurrency(p.totalRevenue)}</Typography></TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color={p.profit >= 0 ? "success.main" : "error.main"}>
                            {p.profit >= 0 ? "+" : ""}{fmtCurrency(p.profit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={`${p.margin.toFixed(1)}%`} size="small"
                            color={p.margin >= 20 ? "success" : p.margin >= 10 ? "warning" : "error"}
                            variant={p.margin >= 20 ? "filled" : "outlined"}
                            sx={{ fontWeight: 700, fontSize: "0.65rem" }} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </StyledTable>
            </TableContainer>
          </CardContent>
        </StyledCard>
      </TabPanelComp>

      {/* ════════════════════════════════════════════════════════════════
          TAB 3: PARTY REPORT
          ════════════════════════════════════════════════════════════════ */}
      <TabPanelComp value={tabValue} index={2}>
        <FilterPanel sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, cursor: "pointer", userSelect: "none" }}
            onClick={() => setShowPartyFilters(!showPartyFilters)}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterIcon sx={{ fontSize: 20 }} /> Advanced Filters
              <GlowBadge badgeContent={[partySearch, partyMinInvoices, partyMinAmount].filter(Boolean).length} color="primary" sx={{ ml: 0.5 }}>
                <Chip label={`${filteredParties.length} results`} size="small" sx={{ fontWeight: 700, height: 22, fontSize: "0.65rem" }} />
              </GlowBadge>
            </Typography>
            <IconButton size="small">{showPartyFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
          </Box>
          <Collapse in={showPartyFilters}>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth size="small" label="Search Party" value={partySearch} onChange={(e) => setPartySearch(e.target.value)}
                    placeholder="Name, Phone or Email…"
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField fullWidth size="small" label="Min Invoices" type="number" value={partyMinInvoices} onChange={(e) => setPartyMinInvoices(e.target.value)} />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField fullWidth size="small" label="Min Total (₹)" type="number" value={partyMinAmount} onChange={(e) => setPartyMinAmount(e.target.value)} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button variant="outlined" size="small" onClick={() => { setPartySearch(""); setPartyMinInvoices(""); setPartyMinAmount(""); }}
                    sx={{ height: "100%", minWidth: 40, borderRadius: 2, borderWidth: 2 }}>
                    <ClearIcon fontSize="small" />
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </FilterPanel>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>🏆 Top Parties by Revenue</Typography>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={partyTopData} layout="vertical" margin={{ left: 120 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.4)} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fontWeight: 600 }} />
                      <RechartsTooltip formatter={(value: number) => fmtCurrency(value)} />
                      <Bar dataKey="totalAmount" radius={[0, 8, 8, 0]}>
                        {partyTopData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <StyledCard>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>📊 Party Engagement</Typography>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: "1-5 Invoices", value: filteredParties.filter((p) => p.totalInvoices >= 1 && p.totalInvoices <= 5).length },
                        { name: "6-20 Invoices", value: filteredParties.filter((p) => p.totalInvoices >= 6 && p.totalInvoices <= 20).length },
                        { name: "20+ Invoices", value: filteredParties.filter((p) => p.totalInvoices > 20).length },
                        { name: "No Invoices", value: filteredParties.filter((p) => p.totalInvoices === 0).length },
                      ]} cx="50%" cy="50%" outerRadius={90}
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} dataKey="value">
                        {[0, 1, 2, 3].map((i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} stroke={alpha(theme.palette.common.black, 0.1)} strokeWidth={2} />))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                  {["1-5 Invoices", "6-20 Invoices", "20+ Invoices", "No Invoices"].map((label, i) => {
                    const val = [filteredParties.filter((p) => p.totalInvoices >= 1 && p.totalInvoices <= 5).length,
                    filteredParties.filter((p) => p.totalInvoices >= 6 && p.totalInvoices <= 20).length,
                    filteredParties.filter((p) => p.totalInvoices > 20).length,
                    filteredParties.filter((p) => p.totalInvoices === 0).length][i];
                    return <Chip key={label} label={`${label}: ${val}`} size="small"
                      sx={{ bgcolor: alpha(COLORS[i % COLORS.length], 0.12), color: COLORS[i % COLORS.length], fontWeight: 700, fontSize: "0.6rem" }} />;
                  })}
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>

        <StyledCard>
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, pt: 2.5, pb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                👥 Party Details <Chip label={filteredParties.length} size="small" color="primary" sx={{ ml: 1, fontWeight: 700 }} />
              </Typography>
              <TablePagination
                component="div"
                count={filteredParties.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                sx={{ ".MuiTablePagination-toolbar": { pl: 0 }, ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": { fontSize: "0.75rem", fontWeight: 600 } }}
              />
            </Box>
            <TableContainer>
              <StyledTable>
                <TableHead>
                  <TableRow>
                    <TableCell>Party</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell align="right">Invoices</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell>Last Invoice</TableCell>
                    <TableCell>Discounts</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredParties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary" fontWeight={600}>No parties match your filters</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParties.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>{p.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
                            {p.phone && (
                              <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <PhoneIcon sx={{ fontSize: 12, opacity: 0.5 }} /> {p.phone}
                              </Typography>
                            )}
                            {p.email && (
                              <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <EmailIcon sx={{ fontSize: 12, opacity: 0.5 }} /> {p.email}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={p.totalInvoices} size="small"
                            color={p.totalInvoices > 0 ? "primary" : "default"}
                            variant="outlined" sx={{ fontWeight: 700, fontSize: "0.65rem", minWidth: 36 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={800} color="primary.main">
                            {fmtCurrency(p.totalAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{p.lastInvoiceDate}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                            {Object.entries(p.categoryDiscounts || {}).filter(([, d]) => d > 0).slice(0, 3).map(([cat, disc]) => (
                              <Chip key={cat} label={`${cat}: ${disc}%`} size="small"
                                variant="outlined" color="success"
                                sx={{ height: 20, fontSize: "0.55rem", fontWeight: 700 }} />
                            ))}
                            {Object.keys(p.categoryDiscounts || {}).filter((k) => (p.categoryDiscounts?.[k] || 0) > 0).length > 3 && (
                              <Chip label={`+${Object.keys(p.categoryDiscounts).length - 3}`} size="small" variant="outlined"
                                sx={{ height: 20, fontSize: "0.55rem", fontWeight: 700 }} />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </StyledTable>
            </TableContainer>
          </CardContent>
        </StyledCard>
      </TabPanelComp>
    </Box>
  );
}

// ─── Helper: AvatarCircle ─────────────────────────────────────────────────────

function AvatarCircle({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: alpha(color, 0.12),
        color,
        border: `2px solid ${alpha(color, 0.25)}`,
        flexShrink: 0,
        "& svg": { fontSize: 18 },
      }}
    >
      {children}
    </Box>
  );
}

// ─── Missing icon ─────────────────────────────────────────────────────────────

function CalendarTodayIcon({ sx }: { sx?: any }) {
  return (
    <svg style={{ width: 12, height: 12, ...sx }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
    </svg>
  );
}
