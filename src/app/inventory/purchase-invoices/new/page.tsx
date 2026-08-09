"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Autocomplete,
  Tabs,
  Tab,
  Snackbar,
  Chip,
  Divider,
  Tooltip,
  Badge,
  Checkbox,
  InputAdornment,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemText,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  Summarize as SummarizeIcon,
  Percent as PercentIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationOnIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { alpha, useTheme } from '@mui/material';
import { VisuallyEnhancedDashboardLayout } from '@/components/ModernLayout';
import ModernThemeProvider from '@/contexts/ModernThemeContext';
import SupplierService from '@/services/supplierService';
import EnhancedPurchaseInvoiceService from '@/services/enhancedPurchaseInvoiceService';
import { productService } from '@/services/productService';
import { Product } from '@/types/inventory';
import { Supplier } from '@/types/purchase';
import { PurchaseInvoiceItem } from '@/types/purchase_no_gst';
import FullScreenProductSearch, { FullSearchProduct } from '@/components/invoices/FullScreenProductSearch';

interface PurchaseFormData {
  supplierInvoiceNumber: string;
  purchaseDate: string;
  dueDate?: string;
  purchaseOrderNumber: string;
  notes: string;
  paidAmount: number;
  paymentMethod: string;
  shippingCharges: number;
  otherCharges: number;
  roundOff: boolean;
  updateStock: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, index, value, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`purchase-tabpanel-${index}`}
      aria-labelledby={`purchase-tab-${index}`}
      {...other}
      style={{ padding: '20px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `purchase-tab-${index}`,
    'aria-controls': `purchase-tabpanel-${index}`,
  };
}

const MAX_ITEMS = 25;

export default function NewPurchaseInvoicePage() {
  const router = useRouter();
  const theme = useTheme();

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState(0);

  // ── Data ──
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<PurchaseInvoiceItem[]>([]);

  // ── UI state ──
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openFullScreenSearch, setOpenFullScreenSearch] = useState(false);

  // ── Form data ──
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [formData, setFormData] = useState<PurchaseFormData>({
    supplierInvoiceNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    dueDate: undefined,
    purchaseOrderNumber: '',
    notes: '',
    paidAmount: 0,
    paymentMethod: '',
    shippingCharges: 0,
    otherCharges: 0,
    roundOff: true,
    updateStock: true,
  });
  const [editablePriceItems, setEditablePriceItems] = useState<Record<number, boolean>>({});

  // ── Supplier dialog ──
  const [openSupplierDialog, setOpenSupplierDialog] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    contactPerson: '',
  });

  // ── New product dialog ──
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPurchasePrice, setNewProductPurchasePrice] = useState<number>(0);
  const [newProductSalePrice, setNewProductSalePrice] = useState<number>(0);
  const [newProductStock, setNewProductStock] = useState<number>(0);
  const [newProductCategory, setNewProductCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId) || null;

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      const cat = p.categoryName;
      if (cat) cats.add(cat);
    });
    return Array.from(cats).sort();
  }, [products]);

  // ── Load initial data ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [productData, supplierData] = await Promise.all([
          productService.getProducts({ status: 'active' }),
          SupplierService.getActiveSuppliers(),
        ]);
        setProducts(productData.products || []);
        setSuppliers(supplierData || []);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load products and suppliers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Totals ──
  const totals = useMemo(() => {
    return EnhancedPurchaseInvoiceService.calculateInvoiceTotals(
      items,
      formData.shippingCharges,
      formData.otherCharges,
      formData.roundOff
    );
  }, [items, formData.shippingCharges, formData.otherCharges, formData.roundOff]);

  const balanceAmount = totals.finalAmount - formData.paidAmount;

  // ── Item helpers ──
  const applyDiscountToItem = useCallback((item: PurchaseInvoiceItem): PurchaseInvoiceItem => {
    const calculated = EnhancedPurchaseInvoiceService.calculateItemTotal(item);
    return {
      ...item,
      discountAmount: calculated.discountAmount,
      totalAmount: calculated.totalAmount,
    };
  }, []);

  const cartItemIds = useMemo(() => new Set(items.map(i => i.productId)), [items]);

  const handleAddToCart = useCallback((product: FullSearchProduct, quantity: number) => {
    if (items.length >= MAX_ITEMS) {
      setError(`Maximum ${MAX_ITEMS} items allowed per invoice. Remove some items first.`);
      return;
    }
    const newItem: PurchaseInvoiceItem = applyDiscountToItem({
      productId: product.id,
      productName: product.name,
      quantity: quantity >= 1 ? quantity : 1,
      unitPrice: product.price,
      discountType: 'percentage',
      discountValue: 0,
      unitOfMeasurement: 'PCS',
      totalAmount: 0,
    });
    setItems(prev => [...prev, newItem]);
  }, [items.length, applyDiscountToItem]);

  const handleIncrementInCart = useCallback((productId: string) => {
    setItems(prev => prev.map(item => {
      if (item.productId !== productId) return item;
      return applyDiscountToItem({ ...item, quantity: item.quantity + 1 });
    }));
  }, [applyDiscountToItem]);

  const handleRemoveFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
  }, []);

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const validQuantity = Math.max(1, quantity || 1);
    setItems(prev => prev.map((item, i) =>
      i === index ? applyDiscountToItem({ ...item, quantity: validQuantity }) : item
    ));
  };

  const handleUpdatePrice = (index: number, price: number) => {
    const validPrice = Math.max(0, price || 0);
    setItems(prev => prev.map((item, i) =>
      i === index ? applyDiscountToItem({ ...item, unitPrice: validPrice }) : item
    ));
  };

  const handleUpdateDiscount = (index: number, discountValue: number) => {
    const validDiscount = Math.max(0, Math.min(100, discountValue || 0));
    setItems(prev => prev.map((item, i) =>
      i === index ? applyDiscountToItem({ ...item, discountValue: validDiscount }) : item
    ));
  };

  const togglePriceEditMode = (index: number) => {
    setEditablePriceItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // ── Supplier handlers ──
  const handleOpenSupplierDialog = () => {
    setNewSupplier({ name: '', phone: '', email: '', address: '', gstin: '', contactPerson: '' });
    setOpenSupplierDialog(true);
  };

  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim()) {
      setError('Supplier name is required');
      return;
    }
    try {
      setCreatingSupplier(true);
      setError(null);

      const supplierId = await SupplierService.createSupplier({
        name: newSupplier.name.trim(),
        phone: newSupplier.phone.trim(),
        email: newSupplier.email.trim(),
        address: newSupplier.address.trim(),
        gstin: newSupplier.gstin.trim(),
        contactPerson: newSupplier.contactPerson.trim(),
        isActive: true,
      });

      const newSupplierData: Supplier = {
        id: supplierId,
        name: newSupplier.name.trim(),
        phone: newSupplier.phone.trim(),
        email: newSupplier.email.trim(),
        address: newSupplier.address.trim(),
        contactPerson: newSupplier.contactPerson.trim(),
        gstin: newSupplier.gstin.trim(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSuppliers(prev => [...prev, newSupplierData]);
      setSelectedSupplierId(supplierId);
      setOpenSupplierDialog(false);
      setSuccessMessage('Supplier created successfully');
    } catch (err) {
      console.error('Error creating supplier:', err);
      setError('Failed to create supplier');
    } finally {
      setCreatingSupplier(false);
    }
  };

  // ── Product handlers ──
  const handleOpenProductDialog = () => {
    setNewProductName('');
    setNewProductPurchasePrice(0);
    setNewProductSalePrice(0);
    setNewProductStock(0);
    setNewProductCategory('');
    setCustomCategory('');
    setUseCustomCategory(false);
    setError(null);
    setOpenProductDialog(true);
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) {
      setError('Product name is required');
      return;
    }
    if (newProductPurchasePrice <= 0) {
      setError('Purchase price must be greater than 0');
      return;
    }
    if (useCustomCategory && !customCategory.trim()) {
      setError('Custom category cannot be empty');
      return;
    }

    try {
      setCreatingProduct(true);
      setError(null);

      const finalCategory = useCustomCategory ? customCategory.trim() : newProductCategory;

      const productData = {
        name: newProductName.trim(),
        categoryId: '',
        categoryName: finalCategory,
        category: finalCategory,
        price: newProductSalePrice > 0 ? newProductSalePrice : newProductPurchasePrice,
        purchasePrice: newProductPurchasePrice,
        salePrice: newProductSalePrice > 0 ? newProductSalePrice : newProductPurchasePrice,
        quantity: newProductStock,
        unitOfMeasurement: 'PCS',
        isService: false,
        isActive: true,
      };

      const productRef = await productService.createProduct(productData as any);

      const newProduct = {
        id: productRef,
        name: newProductName.trim(),
        price: newProductSalePrice > 0 ? newProductSalePrice : newProductPurchasePrice,
        purchasePrice: newProductPurchasePrice,
        category: finalCategory,
        quantity: newProductStock,
      };

      setProducts(prev => [...prev, newProduct as Product]);
      setItems(prev => [
        ...prev,
        applyDiscountToItem({
          productId: productRef,
          productName: newProductName.trim(),
          quantity: 1,
          unitPrice: newProductPurchasePrice,
          discountType: 'percentage',
          discountValue: 0,
          unitOfMeasurement: 'PCS',
          totalAmount: 0,
        }),
      ]);

      setOpenProductDialog(false);
      setSuccessMessage(`✓ Product "${newProductName.trim()}" created and added to invoice`);
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setCreatingProduct(false);
    }
  };

  // ── Navigation ──
  const canProceedToProducts = !!selectedSupplierId && !!formData.supplierInvoiceNumber.trim() && !!formData.purchaseDate;
  const canProceedToSummary = items.length > 0;

  const handleNext = () => setActiveTab(prev => prev + 1);
  const handleBack = () => setActiveTab(prev => prev - 1);
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setActiveTab(newValue);

  // ── Save ──
  const handleSaveInvoice = async () => {
    if (!selectedSupplier || items.length === 0) {
      setError('Please select a supplier and add at least one product');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const invoiceData = {
        invoiceNumber: EnhancedPurchaseInvoiceService.generateInvoiceNumber(),
        supplierInvoiceNumber: formData.supplierInvoiceNumber.trim(),
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        supplierAddress: selectedSupplier.address || '',
        supplierPhone: selectedSupplier.phone || '',
        supplierEmail: selectedSupplier.email || '',
        purchaseDate: formData.purchaseDate,
        dueDate: formData.dueDate,
        items,
        subtotal: totals.subtotal,
        totalDiscountAmount: totals.totalDiscountAmount,
        totalAmount: totals.totalAmount,
        shippingCharges: formData.shippingCharges,
        otherCharges: formData.otherCharges,
        roundOffAmount: totals.roundOffAmount,
        finalAmount: totals.finalAmount,
        paymentStatus: formData.paidAmount >= totals.finalAmount ? 'paid' :
          formData.paidAmount > 0 ? 'partial' : 'pending',
        paidAmount: formData.paidAmount,
        balanceAmount: balanceAmount,
        paymentMethod: formData.paymentMethod || undefined,
        notes: formData.notes,
        purchaseOrderNumber: formData.purchaseOrderNumber,
      };

      const invoiceId = await EnhancedPurchaseInvoiceService.createPurchaseInvoice(
        invoiceData as any,
        formData.updateStock
      );

      setSuccessMessage('Purchase invoice created successfully!');
      setTimeout(() => {
        router.push(`/inventory/purchase-invoices/${invoiceId}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating purchase invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to create purchase invoice');
    } finally {
      setSaving(false);
    }
  };

  const searchProducts = useMemo<FullSearchProduct[]>(() => {
    return products.map(p => ({
      id: p.id || '',
      name: p.name,
      price: p.purchasePrice > 0 ? p.purchasePrice : p.price,
      category: p.categoryName || '',
      stock: p.quantity,
      code: p.sku || p.barcode || '',
    }));
  }, [products]);

  return (
    <ModernThemeProvider>
      <VisuallyEnhancedDashboardLayout
        title="Create Purchase Invoice"
        pageType="Add a new purchase invoice"
        enableVisualEffects={true}
        enableParticles={false}
      >
        <Box sx={{ maxWidth: 'lg', mx: 'auto', py: 2 }}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="h5" component="h1">
              Create Purchase Invoice
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Snackbar
            open={!!successMessage}
            autoHideDuration={6000}
            onClose={() => setSuccessMessage(null)}
            message={successMessage}
          />

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  aria-label="purchase invoice creation tabs"
                  variant="fullWidth"
                >
                  <Tab
                    label="Invoice Details"
                    icon={<ReceiptIcon />}
                    iconPosition="start"
                    {...a11yProps(0)}
                  />
                  <Tab
                    label="Products"
                    icon={<ShoppingCartIcon />}
                    iconPosition="start"
                    {...a11yProps(1)}
                    disabled={!canProceedToProducts}
                  />
                  <Tab
                    label="Summary"
                    icon={<SummarizeIcon />}
                    iconPosition="start"
                    {...a11yProps(2)}
                    disabled={!canProceedToSummary}
                  />
                </Tabs>
              </Box>

              {/* ═══════════ Tab 1: Invoice Details ═══════════ */}
              <TabPanel value={activeTab} index={0}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>

                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 2, sm: 3 },
                  mb: 3,
                  '& > *': { flex: 1 },
                }}>
                  <TextField
                    fullWidth
                    label="Supplier Invoice Number"
                    value={formData.supplierInvoiceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierInvoiceNumber: e.target.value }))}
                    size="small"
                    required
                    error={!formData.supplierInvoiceNumber}
                    helperText={!formData.supplierInvoiceNumber ? "Supplier invoice number is required" : ""}
                  />

                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Purchase Date"
                      value={formData.purchaseDate ? new Date(formData.purchaseDate) : null}
                      onChange={(date) => setFormData(prev => ({
                        ...prev,
                        purchaseDate: date ? date.toISOString().split('T')[0] : '',
                      }))}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          required: true,
                          error: !formData.purchaseDate,
                          helperText: !formData.purchaseDate ? "Purchase date is required" : "",
                        },
                      }}
                    />
                  </LocalizationProvider>

                  <TextField
                    fullWidth
                    label="Purchase Order Number"
                    value={formData.purchaseOrderNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseOrderNumber: e.target.value }))}
                    size="small"
                  />
                </Box>

                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Supplier Information
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2 }}>
                    <Autocomplete
                      fullWidth
                      options={suppliers}
                      getOptionLabel={(option) => {
                        let label = option.name;
                        if (option.phone) label += ` • ${option.phone}`;
                        return label;
                      }}
                      value={selectedSupplier}
                      onChange={(_, newValue) => setSelectedSupplierId(newValue?.id || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Search Supplier"
                          size="small"
                          required
                          error={!selectedSupplierId}
                          helperText={!selectedSupplierId ? "Please select a supplier" : ""}
                        />
                      )}
                      filterOptions={(options, state) => {
                        const inputValue = state.inputValue.toLowerCase().trim();
                        return options.filter(option =>
                          option.name.toLowerCase().includes(inputValue) ||
                          (option.phone && option.phone.includes(inputValue)) ||
                          (option.email && option.email.toLowerCase().includes(inputValue))
                        );
                      }}
                      renderOption={(props, option) => {
                        const { key, ...otherProps } = props;
                        return (
                          <Box component="li" key={key} {...otherProps}>
                            <ListItemText
                              primary={option.name}
                              secondary={`${option.phone || ''}${option.phone && option.email ? ' • ' : ''}${option.email || ''}`}
                            />
                          </Box>
                        );
                      }}
                    />

                    <Button
                      variant="outlined"
                      onClick={handleOpenSupplierDialog}
                      size="small"
                      sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                      startIcon={<PersonIcon />}
                    >
                      New Supplier
                    </Button>
                  </Box>
                </Box>

                {selectedSupplier && (
                  <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {selectedSupplier.name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedSupplier.email && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon fontSize="small" color="action" />
                          <strong>Email:</strong> {selectedSupplier.email}
                        </Typography>
                      )}
                      {selectedSupplier.phone && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <strong>Phone:</strong> {selectedSupplier.phone}
                        </Typography>
                      )}
                      {selectedSupplier.address && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOnIcon fontSize="small" color="action" />
                          <strong>Address:</strong> {selectedSupplier.address}
                        </Typography>
                      )}
                      {selectedSupplier.gstin && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BusinessIcon fontSize="small" color="action" />
                          <strong>GSTIN:</strong> {selectedSupplier.gstin}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    endIcon={<ArrowForwardIcon />}
                    disabled={!canProceedToProducts}
                  >
                    Next: Add Products
                  </Button>
                </Box>
              </TabPanel>

              {/* ═══════════ Tab 2: Products ═══════════ */}
              <TabPanel value={activeTab} index={1}>
                {selectedSupplier && (
                  <Box sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                  }}>
                    <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 600 }}>
                      📋 Purchase Invoice from: {selectedSupplier.name}
                    </Typography>
                    {selectedSupplier.address && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {selectedSupplier.address}
                      </Typography>
                    )}
                    {(selectedSupplier.phone || selectedSupplier.email) && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {selectedSupplier.phone && selectedSupplier.phone}
                        {selectedSupplier.phone && selectedSupplier.email && ' • '}
                        {selectedSupplier.email && selectedSupplier.email}
                      </Typography>
                    )}
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" component="h3">
                      Invoice Items
                    </Typography>
                    <Chip
                      label={`${items.length}/${MAX_ITEMS} items`}
                      color={items.length >= MAX_ITEMS ? 'error' : items.length >= 22 ? 'warning' : 'primary'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                {items.length >= 18 && (
                  <Alert severity={items.length >= MAX_ITEMS ? 'error' : 'warning'} sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      {items.length >= MAX_ITEMS ? (
                        <><strong>Maximum items reached!</strong> You have added the maximum allowed {MAX_ITEMS} items. Remove some items first.</>
                      ) : (
                        <><strong>Approaching limit!</strong> {MAX_ITEMS - items.length} item{MAX_ITEMS - items.length !== 1 ? 's' : ''} remaining.</>
                      )}
                    </Typography>
                  </Alert>
                )}

                <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', maxHeight: { xs: 400, sm: 'none' }, mb: 2 }}>
                  <Table sx={{ minWidth: 650 }} size="small" aria-label="purchase-items-table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 150 }}>Product</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80 }}>Purchase Price</TableCell>
                        <TableCell align="right" sx={{ minWidth: 100 }}>Quantity</TableCell>
                        <TableCell align="right" sx={{ minWidth: 100 }}>Discount</TableCell>
                        <TableCell align="right" sx={{ minWidth: 100 }}>Total</TableCell>
                        <TableCell align="center" sx={{ minWidth: 80 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No products added
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item, index) => (
                          <TableRow key={`${item.productId}-${index}`}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                {editablePriceItems[index] ? (
                                  <>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={item.unitPrice}
                                      onChange={(e) => handleUpdatePrice(index, parseFloat(e.target.value) || 0)}
                                      onFocus={(e) => e.target.select()}
                                      inputProps={{ min: 0, step: 0.01 }}
                                      sx={{ width: { xs: '80px', sm: '90px' } }}
                                      InputProps={{
                                        startAdornment: <span style={{ fontSize: '0.8rem', marginRight: '2px' }}>₹</span>,
                                      }}
                                      autoFocus
                                    />
                                    <IconButton size="small" color="primary" onClick={() => togglePriceEditMode(index)} sx={{ ml: 0.5 }}>
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                ) : (
                                  <>
                                    <Typography variant="body2" sx={{ mr: 1 }}>₹{item.unitPrice}</Typography>
                                    <IconButton size="small" color="primary" onClick={() => togglePriceEditMode(index)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                                onFocus={(e) => e.target.select()}
                                inputProps={{ min: 1 }}
                                sx={{ width: { xs: '60px', sm: '70px' } }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                value={item.discountValue || 0}
                                onChange={(e) => handleUpdateDiscount(index, parseFloat(e.target.value) || 0)}
                                onFocus={(e) => e.target.select()}
                                inputProps={{ min: 0, max: 100, step: 0.5 }}
                                sx={{ width: { xs: '70px', sm: '80px' } }}
                                InputProps={{
                                  endAdornment: <span style={{ fontSize: '0.8rem', marginLeft: '2px' }}>%</span>,
                                }}
                              />
                              <Tooltip title="Discount is applied as a percentage of the line total">
                                <IconButton size="small" sx={{ ml: 0.5 }}>
                                  <PercentIcon fontSize="small" color="action" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>₹{item.totalAmount}</TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="error" onClick={() => handleRemoveFromCart(item.productId)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3, alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                      onClick={() => setOpenFullScreenSearch(true)}
                      startIcon={<ShoppingCartIcon />}
                      disabled={items.length >= MAX_ITEMS}
                      sx={{ py: 1.5, fontSize: '0.95rem', textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                    >
                      🔍 Search Products to Add to Invoice ({items.length}/{MAX_ITEMS})
                    </Button>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleOpenProductDialog}
                    disabled={items.length >= MAX_ITEMS}
                    sx={{ textTransform: 'none', whiteSpace: 'nowrap', alignSelf: 'flex-start', mt: 0.5 }}
                  >
                    New Product
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBackIcon />}>
                    Back to Details
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    endIcon={<ArrowForwardIcon />}
                    disabled={!canProceedToSummary}
                  >
                    Next: Review
                  </Button>
                </Box>
              </TabPanel>

              {/* ═══════════ Tab 3: Summary ═══════════ */}
              <TabPanel value={activeTab} index={2}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Invoice Summary
                  </Typography>

                  <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" fontWeight="medium">Supplier Invoice Number:</Typography>
                        <Typography variant="body1">{formData.supplierInvoiceNumber}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" fontWeight="medium">Date:</Typography>
                        <Typography variant="body1">{formData.purchaseDate}</Typography>
                      </Box>
                      {formData.purchaseOrderNumber && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1" fontWeight="medium">PO Number:</Typography>
                          <Typography variant="body1">{formData.purchaseOrderNumber}</Typography>
                        </Box>
                      )}
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" fontWeight="medium">Supplier:</Typography>
                        <Typography variant="body1">{selectedSupplier?.name}</Typography>
                      </Box>
                      {selectedSupplier?.email && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1" fontWeight="medium">Email:</Typography>
                          <Typography variant="body1">{selectedSupplier.email}</Typography>
                        </Box>
                      )}
                      {selectedSupplier?.phone && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1" fontWeight="medium">Phone:</Typography>
                          <Typography variant="body1">{selectedSupplier.phone}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  <Typography variant="h6" gutterBottom>
                    Products
                  </Typography>

                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Discount</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={`${item.productId}-${index}`}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell align="right">₹{item.unitPrice}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{item.discountValue || 0}%</TableCell>
                            <TableCell align="right">₹{item.totalAmount}</TableCell>
                          </TableRow>
                        ))}

                        <TableRow>
                          <TableCell colSpan={4} align="right">
                            <Typography variant="subtitle2">Subtotal:</Typography>
                          </TableCell>
                          <TableCell align="right">₹{totals.subtotal.toFixed(2)}</TableCell>
                        </TableRow>

                        {totals.totalDiscountAmount > 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="right">
                              <Typography variant="subtitle2" color="error">Discount:</Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'error.main' }}>-₹{totals.totalDiscountAmount.toFixed(2)}</TableCell>
                          </TableRow>
                        )}

                        {formData.shippingCharges > 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="right">
                              <Typography variant="subtitle2">Shipping Charges:</Typography>
                            </TableCell>
                            <TableCell align="right">₹{formData.shippingCharges.toFixed(2)}</TableCell>
                          </TableRow>
                        )}

                        {formData.otherCharges > 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="right">
                              <Typography variant="subtitle2">Other Charges:</Typography>
                            </TableCell>
                            <TableCell align="right">₹{formData.otherCharges.toFixed(2)}</TableCell>
                          </TableRow>
                        )}

                        {formData.roundOff && totals.roundOffAmount !== 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="right">
                              <Typography variant="subtitle2" color={totals.roundOffAmount >= 0 ? 'success.main' : 'error.main'}>
                                Round Off:
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle2" color={totals.roundOffAmount >= 0 ? 'success.main' : 'error.main'}>
                                {totals.roundOffAmount >= 0 ? '+' : ''}₹{totals.roundOffAmount.toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}

                        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                          <TableCell colSpan={4} align="right">
                            <Typography variant="subtitle1" fontWeight="bold">Grand Total:</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle1" fontWeight="bold">₹{totals.finalAmount.toFixed(2)}</Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Payment Details */}
                  <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentIcon fontSize="small" color="primary" />
                      Payment Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <TextField
                          type="number"
                          size="small"
                          label="Shipping Charges"
                          value={formData.shippingCharges}
                          onChange={(e) => setFormData(prev => ({ ...prev, shippingCharges: parseFloat(e.target.value) || 0 }))}
                          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, inputProps: { min: 0, step: 0.01 } }}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          type="number"
                          size="small"
                          label="Other Charges"
                          value={formData.otherCharges}
                          onChange={(e) => setFormData(prev => ({ ...prev, otherCharges: parseFloat(e.target.value) || 0 }))}
                          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, inputProps: { min: 0, step: 0.01 } }}
                          sx={{ flex: 1 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <TextField
                          type="number"
                          size="small"
                          label="Paid Amount"
                          value={formData.paidAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
                          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, inputProps: { min: 0, step: 0.01 } }}
                          helperText={`Balance: ₹${Math.max(0, balanceAmount).toFixed(2)}`}
                          sx={{ flex: 1 }}
                        />
                        <FormControl size="small" sx={{ flex: 1 }}>
                          <InputLabel>Payment Method</InputLabel>
                          <Select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            label="Payment Method"
                          >
                            <MenuItem value="cash">Cash</MenuItem>
                            <MenuItem value="bank">Bank Transfer</MenuItem>
                            <MenuItem value="cheque">Cheque</MenuItem>
                            <MenuItem value="upi">UPI</MenuItem>
                            <MenuItem value="card">Card</MenuItem>
                            <MenuItem value="credit">Credit</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.updateStock}
                              onChange={(e) => setFormData(prev => ({ ...prev, updateStock: e.target.checked }))}
                            />
                          }
                          label="Update Stock Automatically"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.roundOff}
                              onChange={(e) => setFormData(prev => ({ ...prev, roundOff: e.target.checked }))}
                            />
                          }
                          label="Round Off Amount"
                        />
                      </Box>
                    </Box>
                  </Paper>

                  {/* Notes */}
                  <TextField
                    label="Notes"
                    multiline
                    rows={3}
                    fullWidth
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    variant="outlined"
                    size="small"
                    placeholder="Add any additional notes here..."
                    sx={{ mb: 3 }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                    <Box sx={{ p: 1.5, flex: 1, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.05), textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Grand Total</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        ₹{totals.finalAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.5, flex: 1, borderRadius: 1, bgcolor: balanceAmount > 0 ? alpha(theme.palette.warning.main, 0.08) : alpha(theme.palette.success.main, 0.08), textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Balance Due</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: balanceAmount > 0 ? theme.palette.warning.main : theme.palette.success.main }}>
                        ₹{Math.max(0, balanceAmount).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBackIcon />}>
                    Back to Products
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveInvoice}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    Create Purchase Invoice
                  </Button>
                </Box>
              </TabPanel>
            </Paper>
          )}

          {/* ═══════════ New Supplier Dialog ═══════════ */}
          <Dialog open={openSupplierDialog} onClose={() => setOpenSupplierDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Supplier</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Supplier Name"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  required
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Phone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                    fullWidth
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="GSTIN"
                    value={newSupplier.gstin}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, gstin: e.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label="Contact Person"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
                    fullWidth
                  />
                </Box>
                <TextField
                  label="Address"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenSupplierDialog(false)}>Cancel</Button>
              <Button
                onClick={handleCreateSupplier}
                variant="contained"
                disabled={creatingSupplier || !newSupplier.name.trim()}
                startIcon={creatingSupplier ? <CircularProgress size={20} /> : null}
              >
                Create
              </Button>
            </DialogActions>
          </Dialog>

          {/* ═══════════ New Product Dialog ═══════════ */}
          <Dialog open={openProductDialog} onClose={() => setOpenProductDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Product Name"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  fullWidth
                  required
                  autoFocus
                  placeholder="e.g., Laptop, Shirt, Food Items"
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Purchase Price"
                    type="number"
                    value={newProductPurchasePrice}
                    onChange={(e) => setNewProductPurchasePrice(parseFloat(e.target.value) || 0)}
                    fullWidth
                    required
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText="Cost price"
                  />
                  <TextField
                    label="Sale Price"
                    type="number"
                    value={newProductSalePrice}
                    onChange={(e) => setNewProductSalePrice(parseFloat(e.target.value) || 0)}
                    fullWidth
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText="Optional"
                  />
                </Box>
                <TextField
                  label="Stock Quantity"
                  type="number"
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(parseInt(e.target.value) || 0)}
                  fullWidth
                  inputProps={{ min: 0, step: 1 }}
                  helperText="Initial stock"
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth disabled={useCustomCategory}>
                    <InputLabel id="new-product-category-label">Category</InputLabel>
                    <Select
                      labelId="new-product-category-label"
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      label="Category"
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {availableCategories.map((category) => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                    <Checkbox
                      checked={useCustomCategory}
                      onChange={(e) => {
                        setUseCustomCategory(e.target.checked);
                        if (e.target.checked) setNewProductCategory('');
                        else setCustomCategory('');
                      }}
                      id="use-custom-category"
                      color="primary"
                    />
                    <Typography component="label" htmlFor="use-custom-category" sx={{ fontWeight: useCustomCategory ? 'bold' : 'normal' }}>
                      Enter a custom category instead
                    </Typography>
                  </Box>

                  {useCustomCategory && (
                    <TextField
                      label="Custom Category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      fullWidth
                      required
                      placeholder="e.g., Electronics, Clothing, etc."
                    />
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenProductDialog(false)}>Cancel</Button>
              <Button
                onClick={handleCreateProduct}
                variant="contained"
                disabled={
                  creatingProduct ||
                  !newProductName.trim() ||
                  newProductPurchasePrice <= 0 ||
                  (useCustomCategory && !customCategory.trim())
                }
                startIcon={creatingProduct ? <CircularProgress size={20} /> : <AddIcon />}
              >
                {creatingProduct ? 'Creating...' : 'Create & Add to Invoice'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* ═══════════ Full-Screen Product Search ═══════════ */}
          <FullScreenProductSearch
            open={openFullScreenSearch}
            onClose={() => setOpenFullScreenSearch(false)}
            products={searchProducts}
            loading={loading}
            cartItemIds={cartItemIds}
            cartCount={items.length}
            maxItems={MAX_ITEMS}
            onAddToCart={handleAddToCart}
            onIncrementInCart={handleIncrementInCart}
            onRemoveFromCart={handleRemoveFromCart}
            onCreateNew={(searchText) => {
              setOpenFullScreenSearch(false);
              setNewProductName(searchText);
              setOpenProductDialog(true);
            }}
          />
        </Box>
      </VisuallyEnhancedDashboardLayout>
    </ModernThemeProvider>
  );
}
