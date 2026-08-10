"use client";
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  Dialog, AppBar, Toolbar, IconButton, Typography, Box, TextField,
  List, ListItem, ListItemAvatar, Avatar, Chip, Button, CircularProgress,
  InputAdornment, Badge, alpha, Checkbox,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  RemoveShoppingCart as RemoveIcon,
  Inventory as InventoryIcon,
  Clear as ClearIcon,
  ShoppingCartCheckout as BulkAddIcon,
} from '@mui/icons-material';
import { searchProducts, normalizeTerm } from '@/utils/productSearch';

// How many matching products to render in the list
const MAX_VISIBLE = 250;

export interface FullSearchProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  stock?: number;
  quantity?: number;
  /** SKU / barcode / HSN / SAC — any textual code that should be searchable */
  code?: string;
  sku?: string;
  hsn?: string;
  /** Description / specification text — size info is often only stored here */
  description?: string;
  specification?: string;
}

interface FullScreenProductSearchProps {
  open: boolean;
  onClose: () => void;
  products: FullSearchProduct[];
  loading?: boolean;
  cartItemIds: Set<string>;
  cartCount: number;
  /** Maps productId -> quantity currently in the cart */
  cartQuantities?: Record<string, number>;
  maxItems?: number;
  partyDiscounts?: Record<string, number>;
  onAddToCart: (product: FullSearchProduct, quantity: number) => void;
  onIncrementInCart: (productId: string) => void;
  onRemoveFromCart?: (productId: string) => void;
  onCreateNew?: (searchText: string) => void;
}

export default function FullScreenProductSearch({
  open, onClose, products, loading = false, cartItemIds, cartCount,
  cartQuantities = {}, maxItems = 25, partyDiscounts = {}, onAddToCart, onIncrementInCart,
  onRemoveFromCart, onCreateNew,
}: FullScreenProductSearchProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Holds refs to each visible row's Qty input so arrow-key navigation can focus them directly
  const qtyInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [query, setQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number | ''>>({});
  const [addedFlash, setAddedFlash] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  // Products selected for bulk add (via checkbox or entering a qty)
  const [selectedForCart, setSelectedForCart] = useState<Set<string>>(new Set());
  // Tracks how often each product has been added — boosts it in search results
  const [frequencyMap, setFrequencyMap] = useState<Record<string, number>>({});

  // Number of products selected for bulk add (declared before the keyboard-shortcut effect below)
  const selectedCount = selectedForCart.size;

  const q = normalizeTerm(query);

  const results = useMemo(
    () => searchProducts(products, query, MAX_VISIBLE, frequencyMap),
    [products, query, frequencyMap]
  );

  // Reset + focus search every time the dialog opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setQuantities({});
      setAddedFlash(null);
      setFocusedIndex(-1);
      setSelectedForCart(new Set());
      setTimeout(() => searchRef.current?.focus(), 250);
    }
  }, [open]);

  // Reset highlight when results change
  useEffect(() => { setFocusedIndex(-1); }, [results.length, q]);

  // Drop selections for products that are now in the cart
  useEffect(() => {
    setSelectedForCart((prev) => {
      const next = new Set(prev);
      for (const id of next) {
        if (cartItemIds.has(id)) next.delete(id);
      }
      return next;
    });
  }, [cartItemIds]);

  // Focus the Qty input of a row (after render) so the user can type a quantity directly
  const focusQtyInput = useCallback((index: number) => {
    setTimeout(() => {
      const input = qtyInputRefs.current[index];
      if (input && input.isConnected) {
        input.focus();
        input.select();
      } else {
        searchRef.current?.focus();
      }
    }, 0);
  }, []);

  // Scroll focused row into view AND focus its Qty input on keyboard navigation
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLElement>("[data-row-index]");
      const target = items[focusedIndex];
      if (target) target.scrollIntoView({ block: "nearest" });
      focusQtyInput(focusedIndex);
    }
  }, [focusedIndex, focusQtyInput]);

  const atMax = cartCount >= maxItems;

  // Indexes of results that still show a Qty input (i.e. not already in cart)
  const qtyAbleIndexes = useMemo(() => {
    const maxIdx = Math.min(results.length, MAX_VISIBLE) - 1;
    const idxs: number[] = [];
    for (let i = 0; i <= maxIdx; i++) {
      if (!cartItemIds.has(results[i].id)) idxs.push(i);
    }
    return idxs;
  }, [results, cartItemIds]);

  // Next/prev qty-editable row index (wraps around), or -1 if none exists
  const nextQtyIndex = useCallback((from: number, dir: 1 | -1): number => {
    if (qtyAbleIndexes.length === 0) return -1;
    if (dir === 1) {
      const found = qtyAbleIndexes.find(i => i > from);
      return found ?? qtyAbleIndexes[0];
    }
    let found = -1;
    for (const i of qtyAbleIndexes) {
      if (i < from) found = i;
      else break;
    }
    return found >= 0 ? found : qtyAbleIndexes[qtyAbleIndexes.length - 1];
  }, [qtyAbleIndexes]);

  // Keyboard navigation on the search input:
  // ArrowDown → focus next row's Qty input so qty can be typed directly.
  // ArrowUp → go back to the previous row's Qty input, or stay in search.
  // Enter → add the focused product.
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = nextQtyIndex(focusedIndex, 1);
      if (idx >= 0) setFocusedIndex(idx);
      else setFocusedIndex(Math.min(focusedIndex + 1, Math.min(results.length, MAX_VISIBLE) - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (focusedIndex >= 0) {
        const idx = nextQtyIndex(focusedIndex, -1);
        setFocusedIndex(idx >= 0 ? idx : -1);
        if (idx < 0) searchRef.current?.focus();
      } else {
        searchRef.current?.focus();
      }
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && focusedIndex < results.length) {
        e.preventDefault();
        const product = results[focusedIndex];
        if (cartItemIds.has(product.id)) onIncrementInCart(product.id);
        else handleAdd(product);
        setFocusedIndex(-1);
        searchRef.current?.focus();
      }
    }
  };

  // Keyboard navigation inside a row's Qty input:
  // Enter → add product with entered qty and return to search for rapid multi-add.
  // ArrowDown / ArrowUp → move to the next / previous row's Qty input.
  const handleQtyKeyDown = (e: React.KeyboardEvent, product: FullSearchProduct, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleAdd(product);
      setFocusedIndex(-1);
      setTimeout(() => {
        searchRef.current?.focus();
        searchRef.current?.select();
      }, 50);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      const idx = nextQtyIndex(index, 1);
      setFocusedIndex(idx >= 0 ? idx : index);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      const idx = nextQtyIndex(index, -1);
      if (idx >= 0) {
        setFocusedIndex(idx);
      } else {
        setFocusedIndex(-1);
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
  };

  const handleQtyChange = (id: string, value: string) => {
    if (value === '') {
      setQuantities(prev => ({ ...prev, [id]: '' }));
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1) {
      setQuantities(prev => ({ ...prev, [id]: num }));
      // Typing a qty also marks the product as selected for bulk add
      setSelectedForCart(prev => new Set(prev).add(id));
    }
  };

  const handleToggleSelect = (productId: string) => {
    setSelectedForCart(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectable = results.filter(p => !cartItemIds.has(p.id));
    const allSelected = selectable.length > 0 && selectable.every(p => selectedForCart.has(p.id));
    setSelectedForCart(prev => {
      const next = new Set(prev);
      if (allSelected) {
        selectable.forEach(p => next.delete(p.id));
      } else {
        selectable.forEach(p => next.add(p.id));
      }
      return next;
    });
  };

  const handleAdd = (product: FullSearchProduct) => {
    const qty = typeof quantities[product.id] === 'number' ? (quantities[product.id] as number) : 1;
    onAddToCart(product, qty);
    setQuantities(prev => ({ ...prev, [product.id]: '' }));
    setSelectedForCart(prev => {
      const next = new Set(prev);
      next.delete(product.id);
      return next;
    });
    setFrequencyMap(prev => ({ ...prev, [product.id]: (prev[product.id] ?? 0) + 1 }));
    setAddedFlash(product.id);
    setTimeout(() => setAddedFlash(null), 900);
  };

  // Add every selected product (with its entered qty) to the cart in one click
  const handleBulkAdd = () => {
    const remainingSlots = maxItems - cartCount;
    let toAdd = results.filter(p => selectedForCart.has(p.id) && !cartItemIds.has(p.id));
    if (toAdd.length > remainingSlots) toAdd = toAdd.slice(0, remainingSlots);

    const addedIds: string[] = [];
    toAdd.forEach((product) => {
      const qty = typeof quantities[product.id] === 'number' ? (quantities[product.id] as number) : 1;
      onAddToCart(product, qty);
      addedIds.push(product.id);
    });
    if (addedIds.length > 0) {
      setFrequencyMap(prev => {
        const next = { ...prev };
        for (const id of addedIds) next[id] = (next[id] ?? 0) + 1;
        return next;
      });
    }
    setQuantities(prev => {
      const next = { ...prev };
      toAdd.forEach(p => { delete next[p.id]; });
      return next;
    });
    setSelectedForCart(new Set());
    // Keep search open + query intact so users can rapidly keep adding
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  // Global keyboard shortcuts:
  //   Alt+F → focus + select the search box
  //   Alt+A → add selected products to cart (or focused row if none selected),
  //           keeping the dialog open for rapid multi-add
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      const key = e.key.toLowerCase();
      if (e.altKey && key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.altKey && key === 'a') {
        e.preventDefault();
        if (selectedCount > 0) {
          handleBulkAdd();
          return;
        }
        const idx = focusedIndex >= 0 ? focusedIndex : 0;
        const product = results[idx];
        if (product) {
          if (cartItemIds.has(product.id)) onIncrementInCart(product.id);
          else handleAdd(product);
          setFocusedIndex(-1);
          // Keep search focused for rapid multi-add
          setTimeout(() => {
            searchRef.current?.focus();
            searchRef.current?.select();
          }, 50);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, focusedIndex, results, cartItemIds, selectedCount, handleAdd, handleBulkAdd, onIncrementInCart]);

  const handleRowTap = (product: FullSearchProduct) => {
    if (cartItemIds.has(product.id)) { onIncrementInCart(product.id); return; }
    handleAdd(product);
  };

  const stockOf = (p: FullSearchProduct) => p.stock ?? p.quantity ?? 0;

  const canBulkAdd = selectedCount > 0 && !atMax;

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      {/* ─── Header: back + cart count + big search bar ─── */}
      <AppBar position="sticky" color="inherit" elevation={0}
        sx={{ borderBottom: `1px solid ${(t: any) => t.palette.divider}` }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" onClick={onClose} aria-label="close">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 800, fontSize: '1.05rem' }}>
            Select Product
          </Typography>
          <Badge badgeContent={cartCount} color="primary" showZero>
            <Chip
              label={`${cartCount}/${maxItems} in cart`}
              size="small"
              color={atMax ? 'error' : 'primary'}
              variant="filled"
              sx={{ height: 22, fontWeight: 700, fontSize: '0.7rem' }}
            />
          </Badge>
        </Toolbar>
        <Box sx={{ px: 2, pb: 1.5 }}>
          <TextField
            fullWidth
            autoFocus
            inputRef={searchRef}
            placeholder="🔍 Search product name, category or code (SKU/HSN)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setQuery(''); searchRef.current?.focus(); }} aria-label="clear">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3, fontSize: '1rem',
                bgcolor: (t: any) => t.palette.action.hover,
                '& input': { fontWeight: 600 },
              },
            }}
          />
          {/* Select-all shortcut bar */}
          {results.length > 0 && (
            <Box
              sx={{
                mt: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {q ? `${results.length} result${results.length !== 1 ? 's' : ''}` : `${results.length} products`}
              </Typography>
              <Box sx={{ flex: 1 }} />
              {results.some(p => !cartItemIds.has(p.id)) && (
                <Button
                  size="small"
                  variant="text"
                  onClick={toggleSelectAll}
                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', minWidth: 0, px: 1 }}
                >
                  {results.filter(p => !cartItemIds.has(p.id)).every(p => selectedForCart.has(p.id)) && selectedCount > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </AppBar>

      {/* ─── Bulk add bar (appears when ≥1 product selected) ─── */}
      {selectedCount > 0 && (
        <Box
          sx={{
            px: 2, py: 1,
            borderBottom: `1px solid ${(t: any) => t.palette.divider}`,
            bgcolor: (t: any) => alpha(t.palette.primary.main, 0.06),
            display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
          }}
        >
          <Chip
            label={`${selectedCount} selected`}
            size="small"
            color="primary"
            onDelete={() => setSelectedForCart(new Set())}
            sx={{ height: 24, fontWeight: 700, fontSize: '0.7rem' }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Enter qty per product, then add all at once.
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<BulkAddIcon sx={{ fontSize: 16 }} />}
            onClick={handleBulkAdd}
            disabled={!canBulkAdd}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, fontSize: '0.75rem', py: 0.6 }}
          >
            Add {selectedCount} to Cart
          </Button>
        </Box>
      )}

      {/* ─── Product list ─── */}
      <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: (t: any) => t.palette.background.default, pb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 10 }}>
            <CircularProgress />
            <Typography color="text.secondary" fontWeight={600}>Loading products…</Typography>
          </Box>
        ) : results.length === 0 ? (
          <Box sx={{ py: 10, px: 3, textAlign: 'center' }}>
            <InventoryIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body1" fontWeight={800} gutterBottom sx={{ fontSize: '1rem' }}>
              {q ? `No products found for "${q}"` : 'No products available'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {q ? 'Try a different search term, or create the product below.' : 'Add products from your inventory first.'}
            </Typography>
            {q && onCreateNew && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => onCreateNew(q)}
                sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 800 }}>
                Create "{q}"
              </Button>
            )}
          </Box>
        ) : (
          <List disablePadding ref={listRef} role="listbox">
            {results.slice(0, MAX_VISIBLE).map((product, index) => {
              const inCart = cartItemIds.has(product.id);
              const stock = stockOf(product);
              const discount = partyDiscounts[product.category ?? ''] || 0;
              const isFocused = focusedIndex === index;
              const isSelected = selectedForCart.has(product.id);
              return (
                <ListItem
                  key={product.id}
                  data-row-index={index}
                  alignItems="center"
                  divider
                  role="option"
                  aria-selected={isFocused}
                  onClick={() => handleRowTap(product)}
                  sx={{
                    py: 1.25, px: 2, gap: 1, cursor: 'pointer',
                    bgcolor: isFocused
                      ? (t: any) => alpha(t.palette.primary.main, 0.1)
                      : addedFlash === product.id
                        ? (t: any) => alpha(t.palette.success.main, 0.14)
                        : isSelected
                          ? (t: any) => alpha(t.palette.primary.main, 0.05)
                          : 'background.paper',
                    outline: isFocused ? (t: any) => `2px solid ${alpha(t.palette.primary.main, 0.5)}` : 'none',
                    outlineOffset: -2,
                    transition: 'background 0.3s',
                    '&:hover': { bgcolor: (t: any) => t.palette.action.hover },
                  }}
                >
                  {/* Multi-select checkbox */}
                  {!inCart && (
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(product.id)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ p: 0.25, '& .MuiSvgIcon-root': { fontSize: 19 }, flexShrink: 0 }}
                    />
                  )}
                  {inCart && <Box sx={{ width: 26, flexShrink: 0 }} />}

                  <ListItemAvatar sx={{ mr: 1.5, minWidth: 40 }}>
                    <Avatar sx={{ width: 38, height: 38, bgcolor: (t: any) => alpha(t.palette.primary.main, 0.12), color: 'primary.main', fontWeight: 800, fontSize: '0.9rem' }}>
                      {product.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>

                  {/* Name + chips */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                      <Typography variant="body1" noWrap sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                        {product.name}
                      </Typography>
                      {inCart && (
                        <>
                          <Chip icon={<CheckCircleIcon sx={{ fontSize: 13 }} />} label="In Cart" size="small" color="success"
                            sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                          <Chip
                            label={`Qty: ${cartQuantities[product.id] ?? 1}`}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800 }}
                          />
                        </>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.3 }}>
                      {product.category && (
                        <Chip label={product.category} size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: (t: any) => t.palette.grey[200] }} />
                      )}
                      <Chip
                        label={stock > 0 ? `Stock: ${stock}` : 'Out of stock'}
                        size="small"
                        sx={{
                          height: 18, fontSize: '0.62rem', fontWeight: 700,
                          color: stock > 0 ? 'success.main' : 'error.main',
                          bgcolor: stock > 0 ? (t: any) => alpha(t.palette.success.main, 0.1) : (t: any) => alpha(t.palette.error.main, 0.1),
                        }}
                      />
                      {discount > 0 && (
                        <Chip label={`-${discount}%`} size="small"
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, color: 'success.main', bgcolor: (t: any) => alpha(t.palette.success.main, 0.1) }} />
                      )}
                    </Box>
                  </Box>

                  {/* Price + actions */}
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25, flexShrink: 0, ml: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Typography variant="body1" fontWeight={900} color="primary" sx={{ fontSize: '0.95rem', pr: 0.25, lineHeight: 1.4 }}>
                      ₹{product.price}
                    </Typography>
                    {inCart && cartQuantities[product.id] != null && (
                      <Typography variant="caption" fontWeight={700} color="success.main" sx={{ fontSize: '0.68rem', lineHeight: 1.3 }}>
                        Total: ₹{(product.price * cartQuantities[product.id]).toFixed(2)}
                      </Typography>
                    )}

                    {inCart ? (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {onRemoveFromCart && (
                          <IconButton size="small" onClick={() => onRemoveFromCart(product.id)} aria-label="remove"
                            sx={{ color: 'error.main', border: (t: any) => `1px solid ${alpha(t.palette.error.main, 0.35)}`, bgcolor: (t: any) => alpha(t.palette.error.main, 0.06), borderRadius: 1.5, width: 32, height: 32 }}>
                            <RemoveIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                        <Button size="small" variant="contained" color="success" onClick={() => onIncrementInCart(product.id)} disabled={atMax}
                          sx={{ minWidth: 44, height: 32, fontSize: '0.75rem', fontWeight: 800, borderRadius: 1.5, boxShadow: 'none' }}>
                          +1
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <TextField
                          type="number" size="small" value={quantities[product.id] ?? ''}
                          inputRef={(el) => { qtyInputRefs.current[index] = el; }}
                          onChange={(e) => handleQtyChange(product.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => handleQtyKeyDown(e, product, index)}
                          placeholder="Qty"
                          inputProps={{ min: 1, style: { fontWeight: 700, fontSize: '0.8rem', textAlign: 'center', padding: '2px' } }}
                          sx={{ width: 58, '& .MuiOutlinedInput-root': { height: 32, borderRadius: 1.5 } }}
                        />
                        <Button
                          size="small" variant="contained" disabled={atMax}
                          onClick={() => handleAdd(product)}
                          startIcon={<AddIcon sx={{ fontSize: 15 }} />}
                          sx={{ minWidth: 54, height: 32, px: 0.75, fontSize: '0.7rem', fontWeight: 800, borderRadius: 1.5, boxShadow: 'none' }}
                        >
                          Add
                        </Button>
                      </Box>
                    )}
                  </Box>
                </ListItem>
              );
            })}
            {results.length > MAX_VISIBLE && (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Showing first {MAX_VISIBLE} of {results.length} results — refine your search.
                </Typography>
              </Box>
            )}
          </List>
        )}
      </Box>

      {/* ─── Sticky bottom bar ─── */}
      <Box sx={{ p: 1.5, borderTop: (t: any) => `1px solid ${t.palette.divider}`, bgcolor: 'background.paper' }}>
        {atMax && (
          <Typography align="center" color="error" variant="body2" fontWeight={700} sx={{ mb: 1 }}>
            Maximum {maxItems} items reached — remove some to add more.
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {selectedCount > 0 && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<BulkAddIcon />}
              onClick={handleBulkAdd}
              disabled={!canBulkAdd}
              sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 800, py: 1.2, flex: 1 }}
            >
              Add {selectedCount} Selected
            </Button>
          )}
          <Button variant="contained" fullWidth={selectedCount === 0} size="large" onClick={onClose}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 800, py: 1.2 }}>
            {cartCount > 0
              ? `Done — ${cartCount} item${cartCount !== 1 ? 's' : ''} in cart`
              : 'Cancel'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
