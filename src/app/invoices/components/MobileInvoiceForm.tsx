"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Paper, IconButton,
  CircularProgress, Alert, Snackbar, Chip, Divider,
  Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions,
  Badge, Fade, Grow, Avatar,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Percent as PercentIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  Note as NoteIcon,
  Inventory2 as InventoryIcon,
  Store as StoreIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  collection, addDoc, getDoc, serverTimestamp, query, where, getDocs,
  limit, orderBy, doc as firestoreDoc, updateDoc as firestoreUpdateDoc
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { executeWithRetry, getFirestoreErrorMessage } from '@/utils/firestoreHelpers';
import { useParties } from "@/app/hooks/useParties";
import { useProducts } from '@/app/hooks/useProducts';
import { useCategories } from '@/app/hooks/useCategories';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import CategoryDiscountEditor from '@/components/invoices/CategoryDiscountEditor';
import CentralizedInvoiceService from '@/services/centralizedInvoiceService';
import InvoiceWithStockService from '@/services/invoiceWithStockService';
import StockValidationConfigService from '@/services/stockValidationConfig';
import { useRouter } from 'next/navigation';
import { alpha } from '@mui/material/styles';
import { searchProducts } from '@/utils/productSearch';

interface Party {
  id: string; name: string; email: string; phone: string; address: string;
  categoryDiscounts: Record<string, number>;
  productDiscounts?: Record<string, number>;
}

interface InvoiceLineItem {
  productId: string; name: string; description?: string;
  quantity: number; price: number; category: string;
  discount: number; discountType: 'none' | 'category' | 'product' | 'custom';
  finalPrice: number;
}

interface MobileInvoiceFormProps {
  onSuccess?: (invoiceId?: string) => void;
  invoiceId?: string;
}

const palette = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryDark: '#1E40AF',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  success: '#10B981',
  successLight: '#D1FAE5',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  surface: '#F8FAFC',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  text: '#1E293B',
  textSecondary: '#64748B',
  white: '#FFFFFF',
};

const styles = {
  input: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1.5,
      bgcolor: palette.surface,
      '& fieldset': { borderColor: palette.border },
      '&:hover fieldset': { borderColor: palette.primary },
      '&.Mui-focused fieldset': { borderColor: palette.primary, borderWidth: 2 },
    },
  },
  chip: (bg: string, fg: string) => ({
    bgcolor: bg, color: fg, fontWeight: 600, borderRadius: 1.5,
    fontSize: '0.7rem', height: 22, '& .MuiChip-label': { px: 1 },
  }),
  btnPrimary: {
    borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.85rem',
    bgcolor: palette.primary, boxShadow: `0 2px 8px ${alpha(palette.primary, 0.3)}`,
    '&:hover': { bgcolor: palette.primaryDark, boxShadow: `0 4px 12px ${alpha(palette.primary, 0.4)}` },
  },
  btnOutline: {
    borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
    border: `1.5px solid ${palette.border}`, color: palette.text,
    '&:hover': { borderColor: palette.primary, bgcolor: palette.primaryLight },
  },
};

export default function MobileInvoiceForm({ onSuccess, invoiceId }: MobileInvoiceFormProps) {
  const router = useRouter();
  const { parties, loading: loadingParties } = useParties();
  const { products, loading: loadingProducts } = useProducts();
  const { categories } = useCategories();
  const { userId } = useCurrentUser();

  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [transportCharges, setTransportCharges] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [showTotals, setShowTotals] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [pendingQtyProduct, setPendingQtyProduct] = useState<InvoiceLineItem | null>(null);
  const [pendingQty, setPendingQty] = useState<number | ''>('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBatchAdding, setIsBatchAdding] = useState(false);

  const [openPartyDialog, setOpenPartyDialog] = useState(false);
  const [newParty, setNewParty] = useState({
    name: '', email: '', phone: '', address: '',
  });
  const [creatingParty, setCreatingParty] = useState(false);

  const [openCategoryDiscountEditor, setOpenCategoryDiscountEditor] = useState(false);

  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number>(0);
  const [newProductStock, setNewProductStock] = useState<number>(0);
  const [newProductCategory, setNewProductCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  // Track unsaved changes (after all state declarations)
  // Store initial snapshot of loaded invoice data for edit mode
  const [initialSnapshot, setInitialSnapshot] = useState<{
    partyId: string;
    items: InvoiceLineItem[];
    transportCharges: number;
    notes: string;
  } | null>(null);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const hasUnsavedChanges = useMemo(() => {
    if (invoiceId && !dataLoaded) return false;
    
    // For edit mode: compare against snapshot
    if (invoiceId && initialSnapshot) {
      if (selectedPartyId !== initialSnapshot.partyId) return true;
      if (transportCharges !== initialSnapshot.transportCharges) return true;
      if (notes !== initialSnapshot.notes) return true;
      if (lineItems.length !== initialSnapshot.items.length) return true;
      for (let i = 0; i < lineItems.length; i++) {
        const cur = lineItems[i];
        const orig = initialSnapshot.items[i];
        if (!orig) return true;
        if (cur.quantity !== orig.quantity) return true;
        if (cur.price !== orig.price) return true;
        if (cur.name !== orig.name) return true;
      }
      return false;
    }
    
    // For new invoices: any data means unsaved
    return selectedPartyId !== '' || lineItems.length > 0 || transportCharges > 0 || notes.trim() !== '';
  }, [selectedPartyId, lineItems, transportCharges, notes, invoiceId, dataLoaded, initialSnapshot]);

  // Save snapshot after initial data load in edit mode
  useEffect(() => {
    if (invoiceId && dataLoaded && !initialSnapshot) {
      setInitialSnapshot({
        partyId: selectedPartyId,
        items: JSON.parse(JSON.stringify(lineItems)),
        transportCharges,
        notes,
      });
    }
  }, [invoiceId, dataLoaded, initialSnapshot, selectedPartyId, lineItems, transportCharges, notes]);

  // Clear snapshot after successful save (so back button doesn't re-prompt)
  const clearSnapshot = useCallback(() => {
    setInitialSnapshot(null);
  }, []);

  // Browser back/refresh protection + popstate for back button
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    
    const handlePopState = () => {
      setShowLeaveConfirm(true);
      // Push state back to prevent immediate navigation
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    } else {
      // No pending navigation = back button was pressed. Go back in history.
      window.history.back();
    }
  };

  const cancelLeave = () => {
    setShowLeaveConfirm(false);
    setPendingNavigation(null);
  };

  const selectedParty = parties.find(p => p.id === selectedPartyId) || null;

  const availableCategories = useMemo(() => {
    const names = new Set<string>();
    categories.forEach(c => { if (c.name) names.add(c.name); });
    products.forEach(p => { if (p.category) names.add(p.category); });
    return Array.from(names).sort();
  }, [categories, products]);

  const qtyInputRef = React.useRef<HTMLInputElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // State to hide party search section after selection
  const [partySelected, setPartySelected] = useState(false);

  // Handle party selection: collapse party section & focus product search
  const handlePartySelect = useCallback((_: any, v: Party | null) => {
    setSelectedPartyId(v?.id || '');
    if (v?.id) {
      setPartySelected(true);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
        const productSection = document.getElementById('mobile-product-section');
        if (productSection) {
          productSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
    }
  }, []);

  // Load existing invoice data when editing
  useEffect(() => {
    if (!invoiceId || !parties.length || !products.length) return;
    
    const loadInvoiceData = async () => {
      try {
        setLoading(true);
        const invoiceRef = firestoreDoc(db, 'invoices', invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);
        
        if (!invoiceSnap.exists()) {
          setError('Invoice not found');
          return;
        }
        
        const data = invoiceSnap.data();
        setInvoiceNumber(data.invoiceNumber || '');
        setInvoiceDate(data.date || new Date().toISOString().split('T')[0]);
        setSelectedPartyId(data.partyId || '');
        setPartySelected(!!data.partyId);
        setTransportCharges(data.transportCharges || 0);
        setNotes(data.notes || '');
        
        if (data.items && Array.isArray(data.items)) {
          const mappedItems: InvoiceLineItem[] = data.items.map((item: any) => {
            let discount = 0;
            let discountType: 'none' | 'category' | 'product' | 'custom' = 'none';
            
            if (item.discountType === 'category' || item.discountType === 'product' || item.discountType === 'custom') {
              discount = item.discount || 0;
              discountType = item.discountType;
            } else {
              const party = parties.find(p => p.id === data.partyId);
              if (party) {
                const catDiscount = party.categoryDiscounts?.[item.category || ''] || 0;
                if (catDiscount > 0) { discount = catDiscount; discountType = 'category'; }
              }
            }
            
            return {
              productId: item.productId,
              name: item.name,
              description: item.description || '',
              quantity: item.quantity || 1,
              price: item.price || 0,
              category: item.category || '',
              discount,
              discountType,
              finalPrice: parseFloat((item.finalPrice || item.price * item.quantity).toFixed(2)),
            };
          });
          setLineItems(mappedItems);
        }
        
        setDataLoaded(true);
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError(getFirestoreErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    
    loadInvoiceData();
  }, [invoiceId, parties.length, products.length]);

  // Generate invoice number for new invoices
  useEffect(() => {
    if (invoiceId) return;
    const generateInvoiceNumber = async () => {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      try {
        const result = await executeWithRetry(async () => {
          const q = query(
            collection(db, 'invoices'),
            where('invoiceNumber', '>=', `INV-${year}${month}-000`),
            where('invoiceNumber', '<=', `INV-${year}${month}-999`),
            orderBy('invoiceNumber', 'desc'), limit(1)
          );
          const snap = await getDocs(q);
          let seq = 1;
          if (!snap.empty) {
            const currentSeq = parseInt(snap.docs[0].data().invoiceNumber.split('-')[2]);
            seq = Math.min(currentSeq + 1, 999);
          }
          return `INV-${year}${month}-${seq.toString().padStart(3, '0')}`;
        });
        if (result) setInvoiceNumber(result);
      } catch { setInvoiceNumber(`INV-${Date.now()}`); }
    };
    generateInvoiceNumber();
  }, [invoiceId]);

  const calculateItemDiscounts = useCallback((item: InvoiceLineItem, party: Party | null) => {
    if (!party) return { ...item, discount: 0, discountType: 'none' as const, finalPrice: parseFloat((item.price * item.quantity).toFixed(2)) };
    const product = products.find(p => p.id === item.productId);
    if (!product) return item;
    const catDiscount = party.categoryDiscounts[product.category] || 0;
    const discount = catDiscount;
    const discountType = discount > 0 ? 'category' as const : 'none' as const;
    return {
      ...item, discount, discountType,
      finalPrice: parseFloat((item.price * (1 - discount / 100) * item.quantity).toFixed(2)),
    };
  }, [products]);

  useEffect(() => {
    if (!selectedParty) {
      setLineItems(prev => prev.map(item => ({
        ...item,
        discount: 0,
        discountType: 'none' as const,
        finalPrice: parseFloat((item.price * item.quantity).toFixed(2)),
      })));
      return;
    }
    setLineItems(prev => prev.map(item => calculateItemDiscounts(item, selectedParty)));
  }, [selectedPartyId, calculateItemDiscounts]);

  const triggerQtyPrompt = useCallback((productId: string) => {
    if (lineItems.length >= 25) { setWarningMessage('Max 25 items per invoice'); return; }
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existingIndex = lineItems.findIndex(item => item.productId === productId);
    if (existingIndex >= 0) {
      setLineItems(prev => prev.map((item, i) => i === existingIndex
        ? calculateItemDiscounts({ ...item, quantity: item.quantity + 1 }, selectedParty)
        : item));
      setSelectedProductId('');
      // Keep search open and query preserved — rapid multi-add workflow
      setProductSearchOpen(true);
      setTimeout(() => { searchInputRef.current?.focus(); searchInputRef.current?.select(); }, 200);
      return;
    }
    let discount = 0;
    let discountType: 'none' | 'category' | 'product' | 'custom' = 'none';
    if (selectedParty) {
      const cd = selectedParty.categoryDiscounts[product.category] || 0;
      if (cd > 0) { discount = cd; discountType = 'category'; }
    }
    const newItem: InvoiceLineItem = {
      productId: product.id, name: product.name, quantity: 1,
      price: product.price, category: product.category || '',
      discount, discountType,
      finalPrice: parseFloat((product.price * (1 - discount / 100)).toFixed(2)),
    };
    setPendingQtyProduct(newItem);
    setPendingQty('');
    // Keep search dropdown open with current query — qty prompt overlays on top
    setProductSearchOpen(true);
    setTimeout(() => {
      if (qtyInputRef.current) { qtyInputRef.current.focus(); qtyInputRef.current.select(); }
    }, 100);
  }, [lineItems, products, selectedParty, calculateItemDiscounts]);

  const handleAddProduct = () => { if (!selectedProductId) return; triggerQtyPrompt(selectedProductId); };

  const confirmPendingQty = () => {
    if (!pendingQtyProduct) return;
    const qty = Math.max(1, pendingQty);
    const updatedItem = calculateItemDiscounts({ ...pendingQtyProduct, quantity: qty }, selectedParty);
    setLineItems(prev => [...prev, updatedItem]);
    setPendingQtyProduct(null);
    setPendingQty('');
    setSelectedProductId('');
    // Keep search open and query preserved — rapid multi-add workflow
    setProductSearchOpen(true);
    setTimeout(() => { searchInputRef.current?.focus(); searchInputRef.current?.select(); }, 200);
  };

  const cancelPendingQty = () => {
    setPendingQtyProduct(null);
    setPendingQty('');
    setSelectedProductId('');
    // Keep search dropdown visible with query intact
    setProductSearchOpen(true);
    setTimeout(() => { searchInputRef.current?.focus(); searchInputRef.current?.select(); }, 100);
  };

  const handleUpdateQuantity = (index: number, qty: number) =>
    setLineItems(prev => prev.map((item, i) => i === index
      ? calculateItemDiscounts({ ...item, quantity: Math.max(1, qty) }, selectedParty)
      : item));

  const handleUpdatePrice = (index: number, price: number) =>
    setLineItems(prev => prev.map((item, i) => i === index
      ? calculateItemDiscounts({ ...item, price: Math.max(0, price) }, selectedParty)
      : item));

  const handleRemoveItem = (index: number) => setLineItems(prev => prev.filter((_, i) => i !== index));

  const handleUpdateCategoryDiscounts = async (updatedDiscounts: Record<string, number>) => {
    if (!selectedParty) return;
    const idx = parties.findIndex(p => p.id === selectedParty.id);
    if (idx !== -1) {
      parties[idx] = { ...selectedParty, categoryDiscounts: updatedDiscounts };
    }
    setLineItems(prev => prev.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (product && updatedDiscounts.hasOwnProperty(product.category)) {
        const d = updatedDiscounts[product.category];
        return {
          ...item, discount: d, discountType: 'category' as const,
          finalPrice: parseFloat((item.price * (1 - d / 100) * item.quantity).toFixed(2)),
        };
      }
      return {
        ...item, discount: 0, discountType: 'none' as const,
        finalPrice: parseFloat((item.price * item.quantity).toFixed(2)),
      };
    }));
    setSuccessMessage('Discounts applied');
    try {
      setLoading(true);
      await firestoreUpdateDoc(firestoreDoc(db, 'parties', selectedParty.id), {
        categoryDiscounts: updatedDiscounts,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      setWarningMessage('Discounts applied for this session only (sync failed)');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateParty = async () => {
    if (!newParty.name) { setError('Party name is required'); return; }
    try {
      setCreatingParty(true);
      const partyRef = await executeWithRetry(async () =>
        addDoc(collection(db, 'parties'), { ...newParty, categoryDiscounts: {}, productDiscounts: {}, createdAt: serverTimestamp() }), 3);
      parties.push({ ...newParty, id: partyRef.id, categoryDiscounts: {}, productDiscounts: {} });
      setSelectedPartyId(partyRef.id);
      setPartySelected(true);
      setOpenPartyDialog(false);
      setSuccessMessage('Party created');
    } catch (err) { setError(getFirestoreErrorMessage(err)); }
    finally { setCreatingParty(false); }
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) { setError('Product name required'); return; }
    if (newProductPrice <= 0) { setError('Price must be > 0'); return; }
    try {
      setCreatingProduct(true);
      const finalCategory = useCustomCategory ? customCategory.trim() : newProductCategory;
      const productRef = await executeWithRetry(async () =>
        addDoc(collection(db, 'products'), {
          name: newProductName.trim(), price: newProductPrice, category: finalCategory,
          categoryName: finalCategory, quantity: newProductStock, stock: newProductStock,
          isActive: true, gstRate: 18, unitOfMeasurement: 'PCS',
          createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        }), 3);
      products.push({ id: productRef.id, name: newProductName.trim(), price: newProductPrice, category: finalCategory });
      let discount = 0;
      let discountType: 'none' | 'category' | 'product' | 'custom' = 'none';
      if (selectedParty && finalCategory) {
        const cd = selectedParty.categoryDiscounts[finalCategory] || 0;
        if (cd > 0) { discount = cd; discountType = 'category'; }
      }
      setLineItems(prev => [...prev, {
        productId: productRef.id, name: newProductName.trim(), quantity: 1,
        price: newProductPrice, category: finalCategory, discount, discountType,
        finalPrice: parseFloat((newProductPrice * (1 - discount / 100)).toFixed(2))
      }]);
      setOpenProductDialog(false);
      setSuccessMessage('Product created & added');
    } catch (err) { setError(getFirestoreErrorMessage(err)); }
    finally { setCreatingProduct(false); }
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal - lineItems.reduce((sum, item) => sum + item.finalPrice, 0);
  const total = Math.round(subtotal - discountAmount + transportCharges);

  const handleSaveInvoice = async () => {
    if (!selectedPartyId || lineItems.length === 0) { setError('Select a party and add at least one product'); return; }
    setLoading(true);
    setError(null);
    try {
      const invoiceData: any = {
        invoiceNumber, date: invoiceDate,
        partyId: selectedParty?.id || '', partyName: selectedParty?.name || '',
        partyAddress: selectedParty?.address || '', partyEmail: selectedParty?.email || '',
        partyPhone: selectedParty?.phone || '', partyGstin: (selectedParty as any)?.gstin || '',
        userId: userId || 'default-user', type: 'sales',
        items: lineItems.map(item => ({
          productId: item.productId, name: item.name,
          description: item.description || '', quantity: item.quantity,
          price: item.price, discount: item.discount, discountType: item.discountType,
          finalPrice: item.finalPrice, category: item.category
        })),
        subtotal, discount: discountAmount, total, transportCharges, notes,
        categoryDiscounts: selectedParty?.categoryDiscounts || {},
        isGstInvoice: false, stockUpdated: false
      };
      
      if (invoiceId) {
        // Update existing invoice
        const updateResult = await InvoiceWithStockService.updateInvoiceWithStock(
          invoiceId,
          invoiceData,
          true // adjustStock
        );
        if (!updateResult.success) {
          setError(updateResult.errors?.join(', ') || 'Failed to update invoice');
          return;
        }
        setSuccessMessage('Invoice updated successfully!');
      } else {
        // Create new invoice
        const stockConfig = StockValidationConfigService.getConfigForInvoiceType('sales');
        const createResult = await CentralizedInvoiceService.createInvoice(invoiceData, stockConfig);
        if (!createResult.success) {
          setError(createResult.blockingErrors?.join('\n') || createResult.errors?.join(', ') || 'Failed');
          return;
        }
        setSuccessMessage('Invoice created successfully!');
      }
      setTimeout(() => { if (onSuccess) onSuccess(invoiceId || undefined); else router.push('/invoices'); }, 1200);
    } catch (err) { setError(getFirestoreErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const sectionCardXs = useMemo(() => ({
    mx: 1, mb: 1, borderRadius: 2.5,
    bgcolor: palette.white,
    border: `1px solid ${palette.border}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  }), []);

  const sectionLabelSx = { display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 };
  const sectionTitleSx = {
    fontWeight: 700, color: palette.text, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontSize: '0.7rem',
  };

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', pb: 16, bgcolor: palette.surface, minHeight: '100vh' }}>
      {error && <Alert severity="error" sx={{ mx: 1, mt: 1, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage(null)} message={successMessage} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ bottom: 80 }} />
      <Snackbar open={!!warningMessage} autoHideDuration={3000} onClose={() => setWarningMessage(null)} message={warningMessage} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />

      {/* --- INITIAL LOADING (for edit mode) --- */}
      {invoiceId && loading && !dataLoaded && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
          <CircularProgress size={40} sx={{ color: palette.primary }} />
          <Typography variant="body2" fontWeight={600} color={palette.textSecondary}>
            Loading invoice data...
          </Typography>
        </Box>
      )}
      
      {/* Hide form body while loading initial data in edit mode */}
      {(!invoiceId || dataLoaded) && (
      <>
      
      {/* --- HEADER --- */}
      <Box sx={{ px: 1.5, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: palette.primary, boxShadow: `0 2px 8px ${alpha(palette.primary, 0.35)}` }}>
          <ReceiptIcon sx={{ fontSize: 18 }} />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={800} color={palette.text} lineHeight={1.2} sx={{ fontSize: '1rem' }}>
            {invoiceId ? 'Edit Invoice' : 'New Invoice'}
          </Typography>
          <Typography variant="caption" color={palette.textSecondary}>
            {new Date(invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Typography>
        </Box>
        {invoiceNumber && (
          <Chip label={`#${invoiceNumber.split('-').pop()}`} size="small" sx={styles.chip(palette.primaryLight, palette.primary)} />
        )}
      </Box>

      {/* --- PARTY SECTION (collapses after selection) --- */}
      <Paper variant="outlined" sx={sectionCardXs}>
        <Box sx={{ p: 1.5 }}>
          {partySelected && selectedParty ? (
            /* Collapsed: compact chip bar when party selected */
            <Fade in>
              <Box>
                <Box sx={sectionLabelSx}>
                  <PersonIcon sx={{ fontSize: 16, color: palette.primary }} />
                  <Typography sx={sectionTitleSx}>Customer</Typography>
                  <Chip icon={<CheckCircleIcon sx={{ fontSize: 11 }} />} label="Selected" size="small" sx={{ ...styles.chip(palette.successLight, palette.success), height: 20, fontSize: '0.65rem' }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: palette.successLight, borderRadius: 2, p: 1 }}>
                  <PersonIcon sx={{ fontSize: 20, color: palette.success }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={700} color={palette.text} sx={{ fontSize: '0.85rem' }}>
                      {selectedParty.name}
                    </Typography>
                    {selectedParty.phone && (
                      <Typography variant="caption" color={palette.textSecondary} sx={{ fontSize: '0.7rem' }}>
                        {selectedParty.phone}
                      </Typography>
                    )}
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => { setPartySelected(false); setSelectedPartyId(''); }}
                    sx={{ ...styles.btnOutline, height: 26, fontSize: '0.65rem', py: 0, minWidth: 50 }}>
                    Change
                  </Button>
                </Box>
              </Box>
            </Fade>
          ) : (
            /* Expanded: search + new party button */
            <>
              <Box sx={sectionLabelSx}>
                <PersonIcon sx={{ fontSize: 16, color: palette.primary }} />
                <Typography sx={sectionTitleSx}>Customer / Party</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.75 }}>
                <Autocomplete
                  fullWidth options={parties}
                  getOptionLabel={(o) => {
                    let label = o.name;
                    if (o.phone) label += ` • ${o.phone}`;
                    return label;
                  }}
                  value={selectedParty} onChange={handlePartySelect}
                  disabled={loadingParties} size="small"
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Search by name, phone or email..."
                      sx={styles.input}
                      InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start"><PersonIcon sx={{ color: palette.textSecondary, fontSize: 16 }} /></InputAdornment>) }}
                    />
                  )}
                  filterOptions={(options, state) => {
                    const v = state.inputValue.toLowerCase().trim();
                    return options.filter(o => o.name.toLowerCase().includes(v) || (o.phone?.includes(v)) || (o.email?.toLowerCase().includes(v)));
                  }}
                  loading={loadingParties}
                />
                <Button variant="outlined" onClick={() => setOpenPartyDialog(true)}
                  sx={{ ...styles.btnOutline, minWidth: 40, px: 1, whiteSpace: 'nowrap', fontSize: '0.7rem', height: 36 }}>
                  + New
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>

      {/* --- ADD PRODUCT SECTION --- */}
      <Paper variant="outlined" id="mobile-product-section" sx={sectionCardXs}>
        <Box sx={{ p: 1.5 }}>
          <Box sx={sectionLabelSx}>
            <CartIcon sx={{ fontSize: 16, color: palette.accent }} />
            <Typography sx={sectionTitleSx}>Add Products</Typography>
            {lineItems.length > 0 && <Chip label={`${lineItems.length} item${lineItems.length > 1 ? 's' : ''}`} size="small" sx={{ ...styles.chip(palette.primaryLight, palette.primary), height: 20, fontSize: '0.65rem' }} />}
          </Box>
          {/* Product search input */}
          <TextField
            fullWidth
            size="small"
            placeholder="🔍 Search products by name, category..."
            value={productSearchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setProductSearchQuery(val);
              setSelectedProductId('');
              setProductSearchOpen(val.trim().length > 0);
            }}
            onFocus={() => {
              if (productSearchQuery.trim().length > 0) {
                setProductSearchOpen(true);
              }
            }}
            onBlur={() => {
              // Only close if we're not interacting with the dropdown or qty prompt
              setTimeout(() => {
                if (!pendingQtyProduct) {
                  setProductSearchOpen(false);
                }
              }, 250);
            }}
            inputRef={searchInputRef}
            sx={{
              mb: 0.75,
              ...styles.input,
              '& .MuiOutlinedInput-root': { height: 40 }
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><InventoryIcon sx={{ color: palette.textSecondary, fontSize: 16 }} /></InputAdornment>,
              endAdornment: productSearchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onMouseDown={(e) => e.preventDefault()} onClick={() => { setProductSearchQuery(''); setSelectedProductId(''); setProductSearchOpen(false); }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          {/* Product results dropdown */}
          {productSearchOpen && (
            <Paper variant="outlined" sx={{ mb: 1, borderRadius: 2.5, maxHeight: '50vh', overflowY: 'auto', border: `2px solid ${palette.primary}` }}>
              {loadingProducts ? (
                <Box sx={{ textAlign: 'center', py: 2 }}><CircularProgress size={24} /></Box>
              ) : (
                searchProducts(products, productSearchQuery, 30).map(p => (
                  <Box key={p.id} onMouseDown={(e) => {
                    // Prevent blur from closing search while clicking a product
                    e.preventDefault();
                  }} onClick={() => {
                    setSelectedProductId(p.id);
                    // Keep search dropdown open and query preserved — handles both increment and qty-prompt cases
                    setProductSearchOpen(true);
                    triggerQtyPrompt(p.id);
                  }} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    py: 1.2, px: 1.5, borderBottom: `1px solid ${palette.border}`,
                    bgcolor: selectedProductId === p.id ? palette.primaryLight : 'transparent',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: palette.primaryLight },
                    '&:active': { bgcolor: palette.primaryLight },
                  }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: palette.accentLight, color: palette.accent, fontSize: '0.8rem', fontWeight: 700 }}>
                      {p.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: '0.85rem' }}>
                        {p.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.2 }}>
                        {p.category && <Chip label={p.category} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: palette.surfaceAlt }} />}
                        {(p as any).stock !== undefined && (
                          <Chip label={`Stock: ${(p as any).stock}`} size="small" sx={{ height: 18, fontSize: '0.6rem', color: (p as any).stock > 0 ? palette.success : palette.danger, bgcolor: (p as any).stock > 0 ? palette.successLight : palette.dangerLight }} />
                        )}
                      </Box>
                    </Box>
                    <Typography variant="body2" fontWeight={800} color={palette.primary} sx={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                      ₹{p.price}
                    </Typography>
                  </Box>
                ))
              )}
              {!loadingProducts && products.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color={palette.textSecondary} sx={{ fontSize: '0.8rem' }}>No products found.</Typography>
                  <Button size="small" variant="contained" onClick={() => setOpenProductDialog(true)} sx={{ ...styles.btnPrimary, fontSize: '0.75rem', mt: 0.5 }}>Create Product</Button>
                </Box>
              )}
            </Paper>
          )}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button variant="contained" onClick={() => { if (selectedProductId) handleAddProduct(); }} disabled={!selectedProductId}
              sx={{ ...styles.btnPrimary, height: 34, fontSize: '0.75rem', px: 1.5, flex: 1 }}>
              <AddIcon sx={{ fontSize: 16, mr: 0.3 }} /> Add to Invoice
            </Button>
            <Button variant="outlined" onClick={() => setOpenProductDialog(true)}
              sx={{ ...styles.btnOutline, height: 34, fontSize: '0.7rem', px: 1.5, flexShrink: 0 }}>
              + New Product
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* --- QTY PROMPT --- */}
      {pendingQtyProduct && (
        <Fade in>
          <Paper variant="outlined" sx={{
            mx: 1, mb: 1, borderRadius: 2.5,
            border: `2px solid ${palette.primary}`,
            bgcolor: palette.primaryLight,
            overflow: 'hidden',
          }}>
            <Box sx={{ px: 1.5, py: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <Typography variant="body2" fontWeight={700} color={palette.primary} sx={{ fontSize: '0.8rem', flex: 1 }}>
                  Quantity for <strong>{pendingQtyProduct.name}</strong>
                </Typography>
                <Chip label={`₹${pendingQtyProduct.price}`} size="small" sx={{ ...styles.chip(palette.accentLight, palette.accent), height: 20, fontSize: '0.65rem' }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <TextField
                  type="number" size="small" placeholder="Enter qty..."
                  value={pendingQty} onChange={(e) => setPendingQty(parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1, inputMode: 'numeric', pattern: '[0-9]*' }}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') confirmPendingQty(); if (e.key === 'Escape') cancelPendingQty(); }}
                  inputRef={qtyInputRef}
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { height: 36 }, '& input': { fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' } }}
                />
                <Button variant="outlined" onClick={cancelPendingQty}
                  sx={{ ...styles.btnOutline, height: 36, minWidth: 36, px: 0.5 }}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </Button>
                <Button variant="contained" onClick={confirmPendingQty}
                  sx={{ ...styles.btnPrimary, height: 36, minWidth: 50, px: 1, fontSize: '0.75rem' }}>
                  Add
                </Button>
              </Box>
            </Box>
          </Paper>
        </Fade>
      )}

      {/* --- LINE ITEMS --- */}
      {lineItems.length === 0 && !pendingQtyProduct ? (
        <Box sx={{ mx: 1, my: 3, py: 4, textAlign: 'center', border: `2px dashed ${palette.border}`, borderRadius: 2.5, bgcolor: palette.white }}>
          <InventoryIcon sx={{ fontSize: 40, color: palette.border, mb: 1 }} />
          <Typography variant="body2" fontWeight={600} color={palette.textSecondary} gutterBottom sx={{ fontSize: '0.85rem' }}>No products added yet</Typography>
          <Typography variant="caption" color={palette.textSecondary} sx={{ fontSize: '0.75rem' }}>Search a product above or tap "+ New" to create one</Typography>
        </Box>
      ) : (
        <Box sx={{ px: 1 }}>
          {lineItems.map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            const accentColor = item.discount > 0 ? palette.success : palette.primary;
            return (
              <Grow in key={`${item.productId}-${index}`} timeout={150 + index * 30}>
                <Paper variant="outlined" sx={{
                  mb: 1, borderRadius: 2.5, overflow: 'hidden',
                  border: `1.5px solid ${palette.border}`,
                  borderLeft: `4px solid ${accentColor}`,
                  boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                  bgcolor: palette.white,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 1.25, gap: 1.25 }}>
                    <Box sx={{
                      width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: alpha(accentColor, 0.12), color: accentColor, border: `1.5px solid ${accentColor}`,
                      fontSize: '0.65rem', fontWeight: 800, flexShrink: 0,
                    }}>
                      {index + 1}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" fontWeight={800} color={palette.text} noWrap sx={{ fontSize: '0.8rem', maxWidth: 120 }}>
                          {item.name}
                        </Typography>
                        {product?.category && (
                          <Typography variant="caption" fontWeight={600} color={palette.textSecondary} noWrap sx={{ fontSize: '0.65rem' }}>
                            {product.category}
                          </Typography>
                        )}
                        {item.discount > 0 && (
                          <Box sx={{ bgcolor: palette.success, color: palette.white, fontWeight: 800, borderRadius: 1, fontSize: '0.6rem', px: 0.5, lineHeight: '16px' }}>
                            -{item.discount}%
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <TextField
                          type="number" size="small" value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                          inputProps={{ min: 1, style: { fontWeight: 700, fontSize: '0.75rem', textAlign: 'center', padding: '2px 1px' } }}
                          sx={{ width: 42, '& .MuiOutlinedInput-input': { py: 0.4 }, '& .MuiOutlinedInput-root': { height: 28 } }}
                        />
                        <Typography variant="caption" fontWeight={600} color={palette.textSecondary}>×</Typography>
                        <TextField
                          type="number" size="small" value={item.price}
                          onChange={(e) => handleUpdatePrice(index, parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, step: 0.01, style: { fontWeight: 700, fontSize: '0.75rem', padding: '2px 2px' } }}
                          sx={{ width: 76, '& .MuiOutlinedInput-input': { py: 0.4 }, '& .MuiOutlinedInput-root': { height: 28 } }}
                          InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mr: -0.3, '& p': { fontSize: '0.7rem', fontWeight: 700 } }}>₹</InputAdornment> }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 0.2 }}>
                      <Typography variant="body2" fontWeight={900} color={palette.primary} sx={{ fontSize: '0.85rem', lineHeight: 1.2 }}>
                        ₹{item.finalPrice.toFixed(2)}
                      </Typography>
                      <IconButton size="small" onClick={() => handleRemoveItem(index)}
                        sx={{ color: palette.danger, bgcolor: alpha(palette.danger, 0.08), border: `1px solid ${alpha(palette.danger, 0.3)}`, '&:hover': { bgcolor: palette.danger, color: palette.white }, borderRadius: 1.5, width: 22, height: 22 }}>
                        <CloseIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              </Grow>
            );
          })}
        </Box>
      )}

      {/* --- EXTRAS --- */}
      {lineItems.length > 0 && (
        <Paper variant="outlined" sx={sectionCardXs}>
          <Box sx={{ p: 1.5 }}>
            <Box sx={sectionLabelSx}>
              <NoteIcon sx={{ fontSize: 16, color: palette.textSecondary }} />
              <Typography sx={sectionTitleSx}>Additional Details</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField type="number" size="small" placeholder="Shipping / Transport charges" value={transportCharges}
                onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)} inputProps={{ min: 0 }} sx={styles.input}
                InputProps={{ startAdornment: <InputAdornment position="start"><ShippingIcon sx={{ fontSize: 16, color: palette.textSecondary }} /></InputAdornment> }}
              />
              <TextField size="small" placeholder="Notes (delivery instructions, remarks...)" value={notes}
                onChange={(e) => setNotes(e.target.value)} sx={styles.input} multiline maxRows={2}
                InputProps={{ startAdornment: <InputAdornment position="start"><NoteIcon sx={{ fontSize: 16, color: palette.textSecondary }} /></InputAdornment> }}
              />
            </Box>
          </Box>
        </Paper>
      )}

      {/* --- STICKY BOTTOM BAR --- */}
      {lineItems.length > 0 && (
        <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100, bgcolor: palette.white, borderTop: `1px solid ${palette.border}`, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', px: 1.5, py: 1, maxWidth: 560, mx: 'auto' }}>
          <Box onClick={() => setShowTotals(!showTotals)} sx={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color={palette.textSecondary} fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                {lineItems.length} item{lineItems.length > 1 ? 's' : ''}
              </Typography>
              <Typography variant="caption" color={palette.textSecondary} sx={{ fontSize: '0.7rem' }}>• {showTotals ? 'Hide' : 'Show'} breakdown</Typography>
            </Box>
            <Typography variant="h6" fontWeight={800} color={palette.primary} sx={{ fontSize: '1.1rem' }}>₹{total.toFixed(2)}</Typography>
          </Box>
          {showTotals && (
            <Fade in>
              <Box sx={{ bgcolor: palette.surfaceAlt, p: 1, borderRadius: 1.5, mb: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}><Typography variant="caption" color={palette.textSecondary}>Subtotal</Typography><Typography variant="caption" fontWeight={600}>₹{subtotal.toFixed(2)}</Typography></Box>
                {discountAmount > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}><Typography variant="caption" color={palette.success}>Discount</Typography><Typography variant="caption" fontWeight={600} color={palette.success}>-₹{discountAmount.toFixed(2)}</Typography></Box>}
                {transportCharges > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}><Typography variant="caption" color={palette.textSecondary}>Shipping</Typography><Typography variant="caption" fontWeight={600}>₹{transportCharges.toFixed(2)}</Typography></Box>}
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" fontWeight={800}>Grand Total</Typography><Typography variant="body2" fontWeight={800} color={palette.primary}>₹{total.toFixed(2)}</Typography></Box>
              </Box>
            </Fade>
          )}
          <Button variant="contained" fullWidth size="medium" onClick={handleSaveInvoice} disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon sx={{ fontSize: 18 }} />}
            sx={{ bgcolor: loading ? palette.textSecondary : palette.primary, borderRadius: 2.5, textTransform: 'none', fontWeight: 800, fontSize: '0.9rem', py: 1.2, boxShadow: `0 4px 16px ${alpha(palette.primary, 0.35)}`, '&:hover': { bgcolor: palette.primaryDark, boxShadow: `0 6px 20px ${alpha(palette.primary, 0.5)}` }, '&:active': { transform: 'scale(0.98)' }, '&:disabled': { bgcolor: alpha(palette.primary, 0.5) } }}>
            {loading ? (invoiceId ? 'Updating...' : 'Creating...') : `${invoiceId ? 'Update' : 'Create'} Invoice — ₹${total.toFixed(2)}`}
          </Button>
        </Box>
      )}

      {/* Party Dialog */}
      <Dialog open={openPartyDialog} onClose={() => setOpenPartyDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${palette.border}`, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: palette.primaryLight }}><StoreIcon sx={{ fontSize: 18, color: palette.primary }} /></Avatar>
          Add New Party
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Party Name *" value={newParty.name} onChange={e => setNewParty(p => ({ ...p, name: e.target.value }))} fullWidth size="small" sx={styles.input} />
            <TextField label="Phone" value={newParty.phone} onChange={e => setNewParty(p => ({ ...p, phone: e.target.value }))} fullWidth size="small" sx={styles.input} />
            <TextField label="Email" value={newParty.email} onChange={e => setNewParty(p => ({ ...p, email: e.target.value }))} fullWidth size="small" sx={styles.input} />
            <TextField label="Address" value={newParty.address} onChange={e => setNewParty(p => ({ ...p, address: e.target.value }))} fullWidth multiline rows={2} size="small" sx={styles.input} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${palette.border}`, p: 2, gap: 1 }}>
          <Button onClick={() => setOpenPartyDialog(false)} sx={{ ...styles.btnOutline }}>Cancel</Button>
          <Button onClick={handleCreateParty} variant="contained" disabled={creatingParty || !newParty.name} sx={styles.btnPrimary}>
            {creatingParty ? <CircularProgress size={20} color="inherit" /> : 'Create Party'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={openProductDialog} onClose={() => setOpenProductDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${palette.border}`, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: palette.accentLight }}><InventoryIcon sx={{ fontSize: 18, color: palette.accent }} /></Avatar>
          Add New Product
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Product Name *" value={newProductName} onChange={e => setNewProductName(e.target.value)} fullWidth size="small" sx={styles.input} />
            <TextField label="Price (₹)" type="number" value={newProductPrice} onChange={e => setNewProductPrice(parseFloat(e.target.value) || 0)} fullWidth size="small" inputProps={{ min: 0, step: 0.01 }} sx={styles.input} />
            <TextField label="Initial Stock" type="number" value={newProductStock} onChange={e => setNewProductStock(parseInt(e.target.value) || 0)} fullWidth size="small" inputProps={{ min: 0 }} sx={styles.input} />
            {!useCustomCategory && (
              <Autocomplete options={availableCategories} value={newProductCategory || null}
                onChange={(_, v) => setNewProductCategory(v || '')}
                renderInput={(params) => <TextField {...params} label="Category" size="small" sx={styles.input} />}
                freeSolo
              />
            )}
            <Box onClick={() => setUseCustomCategory(!useCustomCategory)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2, cursor: 'pointer', bgcolor: useCustomCategory ? palette.primaryLight : palette.surfaceAlt, border: `1px solid ${useCustomCategory ? palette.primary : palette.border}`, transition: 'all 0.2s' }}>
              <Avatar sx={{ width: 24, height: 24, bgcolor: useCustomCategory ? palette.primary : palette.textSecondary, fontSize: '0.7rem' }}>
                {useCustomCategory ? '✓' : '+'}
              </Avatar>
              <Typography variant="body2" fontWeight={600} color={useCustomCategory ? palette.primary : palette.textSecondary}>Custom category</Typography>
            </Box>
            {useCustomCategory && (
              <TextField label="Category Name" value={customCategory} onChange={e => setCustomCategory(e.target.value)} fullWidth size="small" sx={styles.input} placeholder="e.g. Electronics" />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${palette.border}`, p: 2, gap: 1 }}>
          <Button onClick={() => setOpenProductDialog(false)} sx={{ ...styles.btnOutline }}>Cancel</Button>
          <Button onClick={handleCreateProduct} variant="contained" disabled={creatingProduct || !newProductName.trim() || newProductPrice <= 0} sx={styles.btnPrimary}>
            {creatingProduct ? <CircularProgress size={20} color="inherit" /> : 'Create & Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {selectedParty && (
        <CategoryDiscountEditor
          open={openCategoryDiscountEditor}
          onClose={() => setOpenCategoryDiscountEditor(false)}
          partyId={selectedParty.id}
          categoryDiscounts={selectedParty.categoryDiscounts}
          onSave={handleUpdateCategoryDiscounts}
        />
      )}
      
      {/* --- LEAVE CONFIRMATION DIALOG --- */}
      <Dialog open={showLeaveConfirm} onClose={cancelLeave} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
          Unsaved Changes
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            You have unsaved changes in this invoice. Are you sure you want to leave? Any changes will be lost.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={cancelLeave} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            Stay
          </Button>
          <Button onClick={confirmLeave} variant="contained" color="error" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            Leave Anyway
          </Button>
        </DialogActions>
      </Dialog>
      </>
      )}
    </Box>
  );
}
