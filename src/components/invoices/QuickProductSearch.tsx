"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  TextField,
  Typography,
  Paper,
  IconButton,
  Button,
  CircularProgress,
  InputAdornment,
  Chip,
  Avatar,
  Popper,
  Grow,
  ClickAwayListener,
  alpha,
  useTheme,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Inventory as InventoryIcon,
  RemoveShoppingCart as RemoveIcon,
  ShoppingCartCheckout as BulkAddIcon,
} from "@mui/icons-material";

export interface QuickSearchProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  stock?: number;
  quantity?: number;
}

interface QuickProductSearchProps {
  products: QuickSearchProduct[];
  loading?: boolean;
  onAddToCart: (product: QuickSearchProduct, quantity: number) => void;
  onIncrementInCart: (productId: string) => void;
  onRemoveFromCart?: (productId: string) => void;
  cartItemIds: Set<string>;
  maxItems?: number;
  onCreateNew?: (searchText: string) => void;
  cartCount?: number;
  partyDiscounts?: Record<string, number>;
  /** Called when product is added via main-area click. Parent should focus invoice table qty. */
  onProductAdded?: () => void;
  /** External ref to programmatically focus the search input (e.g., after Enter in cart qty field) */
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

// ─── Search utilities ─────────────────────────────────────────────────────────

function normalizeTerm(t: string): string {
  return t.toLowerCase().replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ").trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreProduct(name: string, category: string | undefined, q: string): number {
  const nLow = name.toLowerCase();
  const cLow = (category ?? "").toLowerCase();
  let score = 0;
  if (!q) return 0;
  if (nLow === q) return 120;
  if (nLow.startsWith(q)) score = 90;
  if (!score && new RegExp(`\\b${escapeRegex(q)}\\b`, "i").test(name)) score = 70;
  if (!score && nLow.includes(q)) score = 50;
  if (cLow.includes(q)) score = Math.max(score, 40);
  if (!score) {
    let ci = 0;
    for (let i = 0; i < nLow.length && ci < q.length; i++) {
      if (nLow[i] === q[ci]) ci++;
    }
    if (ci === q.length) score = 30;
  }
  if (q.includes("/")) {
    const segments = q.split("/").map((s) => s.trim()).filter(Boolean);
    const matchedSegments = segments.filter((seg) => nLow.includes(seg)).length;
    if (matchedSegments > 0) score += matchedSegments * 20;
    const fractionStr = q.replace("/", "");
    if (nLow.includes(fractionStr)) score += 15;
  }
  if (/^\d+$/.test(q) && q.length <= 2) {
    if (nLow.startsWith(q)) score = Math.max(score, 85);
    else if (nLow.includes(` ${q}`) || nLow.includes(`${q} `)) score = Math.max(score, 60);
  }
  return score;
}

function sortByScore(arr: { product: QuickSearchProduct; score: number }[]): QuickSearchProduct[] {
  return arr
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.product.name.length - b.product.name.length;
    })
    .map((e) => e.product);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuickProductSearch({
  products,
  loading = false,
  onAddToCart,
  onIncrementInCart,
  onRemoveFromCart,
  cartItemIds,
  maxItems = 25,
  onCreateNew,
  cartCount = 0,
  partyDiscounts = {},
  onProductAdded,
  searchInputRef,
}: QuickProductSearchProps) {
  const theme = useTheme();
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || internalRef;
  const listRef = useRef<HTMLDivElement>(null);

  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const justClosedRef = useRef(false);
  const [selectedQty, setSelectedQty] = useState<Record<string, number | ''>>({});
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [selectedForCart, setSelectedForCart] = useState<Set<string>>(new Set());
  // Tracks how many times each product has been added to cart (across all searches)
  const [frequencyMap, setFrequencyMap] = useState<Record<string, number>>({});

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(rawQuery);
    }, 150);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [rawQuery]);

  const query = normalizeTerm(debouncedQuery);

  const filteredProducts = useMemo(() => {
    if (!query) return [];
    const scored: { product: QuickSearchProduct; score: number }[] = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const s = scoreProduct(p.name, p.category, query);
      if (s > 0) {
        // Boost score based on how often the product has been added to cart
        const freq = frequencyMap[p.id] ?? 0;
        const freqBoost = Math.min(freq * 15, 60); // cap boost at +60
        scored.push({ product: p, score: s + freqBoost });
      }
      if (scored.length > 200 && i > products.length / 2) break;
    }
    return sortByScore(scored);
  }, [products, query, frequencyMap]);

  const displayResults = useMemo(() => filteredProducts.slice(0, 50), [filteredProducts]);
  // Hide already-in-cart items from the search results
  const visibleResults = useMemo(() => displayResults.filter(p => !cartItemIds.has(p.id)), [displayResults, cartItemIds]);
  const recentProducts = useMemo(() => products.slice(0, 5), [products]);
  const hasResults = visibleResults.length > 0;
  const showRecent = !query && rawQuery.length === 0 && recentProducts.length > 0;
  const atMaxItems = cartCount >= maxItems;

  const activeList = useMemo(() => {
    if (showRecent) return recentProducts;
    return displayResults;
  }, [showRecent, recentProducts, displayResults]);

  // Filter out already-in-cart items from the selected set when they are removed
  useEffect(() => {
    setSelectedForCart((prev) => {
      const next = new Set(prev);
      for (const id of next) {
        if (cartItemIds.has(id)) next.delete(id);
      }
      return next;
    });
  }, [cartItemIds]);

  useEffect(() => { setFocusedIndex(-1); }, [activeList.length]);

  // Scroll focused row into view on keyboard navigation
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLElement>("[data-row-index]");
      const target = items[focusedIndex];
      if (target) {
        target.scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex]);

  // Keep dropdown open once user has searched — only close via Escape or clear
  const handleClose = useCallback(() => {
    if (rawQuery) return; // don't close if user has typed a search
    setOpen(false);
    setFocusedIndex(-1);
  }, [rawQuery]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawQuery(e.target.value);
    setOpen(true);
    setFocusedIndex(-1);
  };

  const handleFocus = () => {
    // Only open if there is a query — onFocus alone never opens the dropdown
    if (rawQuery) setOpen(true);
  };

  // Helper: increment frequency for a set of product ids
  const incrementFrequency = useCallback((productIds: string[]) => {
    setFrequencyMap((prev) => {
      const next = { ...prev };
      for (const id of productIds) {
        next[id] = (next[id] ?? 0) + 1;
      }
      return next;
    });
  }, []);

  // Helper: close dropdown with guard + clear query to prevent handleFocus reopening
  const closeWithGuard = useCallback(() => {
    justClosedRef.current = true;
    setOpen(false);
    setFocusedIndex(-1);
    setRawQuery("");
    setDebouncedQuery("");
    inputRef.current?.blur();
    setTimeout(() => { justClosedRef.current = false; }, 500);
  }, [inputRef]);

  // Adds a single product (used by keyboard Enter/Alt+A — only the focused row)
  const handleAddSingleProduct = useCallback(
    (product: QuickSearchProduct) => {
      const qty = selectedQty[product.id] || 1;
      onAddToCart(product, typeof qty === 'number' ? qty : 1);
      incrementFrequency([product.id]);
      setSelectedQty((prev) => ({ ...prev, [product.id]: '' }));
      closeWithGuard();
    },
    [selectedQty, onAddToCart, incrementFrequency, closeWithGuard]
  );

  // Alt+A: adds a single product but keeps the dropdown + query open for rapid multi-add
  const handleAddKeepOpen = useCallback(
    (product: QuickSearchProduct) => {
      const qty = selectedQty[product.id] || 1;
      onAddToCart(product, typeof qty === 'number' ? qty : 1);
      incrementFrequency([product.id]);
      setSelectedQty((prev) => ({ ...prev, [product.id]: '' }));
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    },
    [selectedQty, onAddToCart, incrementFrequency, inputRef]
  );

  // Adds the product + all other selected items (used by "+" button and row click)
  const handleAddProduct = useCallback(
    (product: QuickSearchProduct) => {
      const addedIds: string[] = [product.id];
      const qty = selectedQty[product.id] || 1;
      onAddToCart(product, typeof qty === 'number' ? qty : 1);
      // Also add ALL other selected items (across all searches) that aren't in cart yet
      for (const otherProduct of products) {
        if (otherProduct.id === product.id) continue;
        if (cartItemIds.has(otherProduct.id)) continue;
        if (!selectedForCart.has(otherProduct.id)) continue;
        const otherQty = selectedQty[otherProduct.id] || 1;
        onAddToCart(otherProduct, typeof otherQty === 'number' ? otherQty : 1);
        addedIds.push(otherProduct.id);
      }
      incrementFrequency(addedIds);
      setSelectedQty((prev) => ({ ...prev, [product.id]: '' }));
      setSelectedForCart(new Set());
      closeWithGuard();
    },
    [selectedQty, onAddToCart, products, cartItemIds, selectedForCart, incrementFrequency, closeWithGuard]
  );

  const handleIncrement = useCallback(
    (productId: string) => {
      onIncrementInCart(productId);
      setSelectedQty((prev) => ({ ...prev, [productId]: '' }));
    },
    [onIncrementInCart]
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, activeList.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
        if (focusedIndex <= 0 && inputRef.current) inputRef.current.focus();
      } else if (e.key === "Enter" && focusedIndex >= 0 && focusedIndex < activeList.length) {
        e.preventDefault();
        const product = activeList[focusedIndex];
        if (product) {
          if (cartItemIds.has(product.id)) handleIncrement(product.id);
          else handleAddSingleProduct(product);
          inputRef.current?.focus();
          setFocusedIndex(-1);
        }
      } else if (e.key === "Escape") {
        setOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
      }
    },
    [activeList, focusedIndex, cartItemIds, handleAddProduct, handleIncrement, inputRef]
  );

  const handleQtyKeyDown = useCallback(
    (e: React.KeyboardEvent, product: QuickSearchProduct, index: number) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (cartItemIds.has(product.id)) handleIncrement(product.id);
        else handleAddSingleProduct(product);
        setFocusedIndex(-1);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        const nextIdx = Math.min(index + 1, activeList.length - 1);
        setFocusedIndex(nextIdx);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        if (index > 0) {
          setFocusedIndex(index - 1);
        } else {
          setFocusedIndex(-1);
          inputRef.current?.focus();
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          if (index > 0) setFocusedIndex(index - 1);
          else { setFocusedIndex(-1); setTimeout(() => inputRef.current?.focus(), 50); }
        } else {
          const nextRow = activeList[index + 1];
          if (nextRow) setFocusedIndex(index + 1);
          else { setFocusedIndex(-1); setTimeout(() => inputRef.current?.focus(), 50); }
        }
      }
    },
    [activeList, cartItemIds, handleAddProduct, handleIncrement, inputRef]
  );

  const focusSearchInput = useCallback(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
  }, [inputRef]);

  const handleRowMainClick = useCallback(
    (product: QuickSearchProduct) => {
      if (cartItemIds.has(product.id)) handleIncrement(product.id);
      else handleAddProduct(product);
      setFocusedIndex(-1);
      // Don't refocus search input here — dropdown is closing, let it close
      setTimeout(() => { if (onProductAdded) onProductAdded(); }, 50);
    },
    [cartItemIds, handleAddProduct, handleIncrement, onProductAdded]
  );

  const handleClear = () => {
    setRawQuery("");
    setDebouncedQuery("");
    setSelectedQty({});
    setOpen(true);
    setFocusedIndex(-1);
    setSelectedForCart(new Set());
    focusSearchInput();
  };

  const handleCreateNew = () => {
    if (onCreateNew && rawQuery.trim()) { onCreateNew(rawQuery.trim()); setOpen(false); }
  };

  // ─── Bulk add selected products ──────────────────────────────────────────────
  const handleBulkAdd = useCallback(() => {
    // Filter by ALL products, not just activeList — so selections across multiple searches are included
    let productsToAdd = products.filter((p) => selectedForCart.has(p.id));
    const remainingSlots = maxItems! - cartCount;
    if (productsToAdd.length > remainingSlots) {
      productsToAdd = productsToAdd.slice(0, remainingSlots);
    }
    const addedIds: string[] = [];
    for (const product of productsToAdd) {
      if (cartItemIds.has(product.id)) continue; // skip already in cart
      const qty = selectedQty[product.id] || 1;
      onAddToCart(product, typeof qty === 'number' ? qty : 1);
      addedIds.push(product.id);
    }
    incrementFrequency(addedIds);
    setSelectedForCart(new Set());
  }, [products, selectedForCart, selectedQty, cartItemIds, cartCount, maxItems, onAddToCart, incrementFrequency]);

  const handleToggleSelect = useCallback((productId: string) => {
    setSelectedForCart((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  // Alt+F shortcut to focus/select search input, Alt+A to add focused row to cart
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.altKey && e.key === 'a') {
        e.preventDefault();
        const idx = focusedIndex >= 0 ? focusedIndex : 0;
        const product = activeList[idx];
        if (product) {
          // Keep the search list + query open for rapid multi-add
          if (cartItemIds.has(product.id)) handleIncrement(product.id);
          else handleAddKeepOpen(product);
          setFocusedIndex(-1);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inputRef, activeList, focusedIndex, cartItemIds, handleAddKeepOpen, handleIncrement]);

  const handleSelectAll = useCallback(() => {
    const selectable = activeList.filter((p) => !cartItemIds.has(p.id));
    const allSelected = selectable.every((p) => selectedForCart.has(p.id));
    setSelectedForCart((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        selectable.forEach((p) => next.delete(p.id));
      } else {
        selectable.forEach((p) => next.add(p.id));
      }
      return next;
    });
  }, [activeList, cartItemIds, selectedForCart]);

  const showNoResults = query && !hasResults && !loading && rawQuery.length > 0;
  const selectedCount = selectedForCart.size;
  const canBulkAdd = selectedCount > 0 && !atMaxItems;

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box sx={{ position: "relative", width: "100%" }}>
          <TextField
          fullWidth
          size="small"
          placeholder="🔍 Search products by name or category…"
          value={rawQuery}
          onChange={handleQueryChange}
          onFocus={handleFocus}
          onKeyDown={handleSearchKeyDown}
          inputRef={inputRef}
          disabled={loading}
          autoComplete="off"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
              transition: "all 0.2s",
              "&:focus-within": { boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}` },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} /></InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading ? <CircularProgress size={18} /> : rawQuery ? (
                  <IconButton size="small" onClick={handleClear}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
                ) : null}
              </InputAdornment>
            ),
          }}
        />

        <Popper
          open={open}
          anchorEl={inputRef.current}
          placement="bottom-start"
          sx={{ zIndex: 1300, width: inputRef.current?.offsetWidth ?? "100%" }}
          transition
          popperOptions={{
            modifiers: [
              // Always keep the results list BELOW the search bar — never flip above
              { name: "flip", enabled: false },
            ],
          }}
        >
          {({ TransitionProps }) => (
            <Grow {...TransitionProps} timeout={200}>
              <Paper elevation={8} sx={{
                mt: 0.5, borderRadius: 2, maxHeight: 520, overflow: "hidden",
                display: "flex", flexDirection: "column",
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              }}>
                <Box sx={{
                  px: 1.5, py: 1, display: "flex", justifyContent: "space-between",
                  alignItems: "center", borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.03),
                  flexWrap: "wrap", gap: 0.5,
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {query ? `${visibleResults.length} result${visibleResults.length !== 1 ? "s" : ""}` : `${products.length} products`}
                    </Typography>
                    <Chip label={`${cartCount}/${maxItems} in cart`} size="small"
                      color={atMaxItems ? "error" : "primary"} variant="filled"
                      sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
                    />
                    {selectedCount > 0 && (
                      <Chip label={`${selectedCount} selected`} size="small" color="secondary"
                        onDelete={() => setSelectedForCart(new Set())}
                        sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
                      />
                    )}
                  </Box>
                  {hasResults && !showRecent && (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Button size="small" variant="text"
                        onClick={handleSelectAll}
                        sx={{ fontSize: "0.7rem", fontWeight: 600, minWidth: 0, px: 1, textTransform: "none" }}
                      >
                        {activeList.filter((p) => !cartItemIds.has(p.id)).every((p) => selectedForCart.has(p.id)) && selectedCount > 0 ? "Deselect all" : "Select all"}
                      </Button>
                      {canBulkAdd && (
                        <Button size="small" variant="contained" color="primary"
                          startIcon={<BulkAddIcon sx={{ fontSize: 14 }} />}
                          onClick={handleBulkAdd}
                          sx={{ fontSize: "0.7rem", fontWeight: 700, minWidth: 0, px: 1.5, textTransform: "none", borderRadius: 1.5, height: 28 }}
                        >
                          Add {selectedCount} to Cart
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>

                {/* Column header strip — aligns with product rows */}
                {hasResults && !showRecent && (
                  <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 0.5, px: 0.5, py: 0.5, bgcolor: alpha(theme.palette.grey[500], 0.05), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <Box sx={{ width: 26, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Product
                      </Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: 0.5, width: 64, textAlign: "right", flexShrink: 0 }}>
                      Price
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: 0.5, width: 68, textAlign: "center", flexShrink: 0 }}>
                      Qty
                    </Typography>
                    <Box sx={{ width: 56, flexShrink: 0 }} />
                  </Box>
                )}

                <Box ref={listRef} sx={{ overflowY: "auto", flex: 1 }} role="listbox">
                  {/* ── Create new product button (when query present) ── */}
                  {rawQuery.trim() && onCreateNew ? (
                    <Box sx={{ p: 1 }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="text"
                        startIcon={<AddIcon />}
                        onClick={handleCreateNew}
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          color: "primary.main",
                          borderRadius: 1.5,
                          py: 1,
                          border: `1px dashed ${alpha(theme.palette.primary.main, 0.4)}`,
                          justifyContent: "flex-start",
                          px: 1.5,
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                        }}
                      >
                        <AddIcon sx={{ fontSize: 16 }} /> Create New Product "{rawQuery.trim()}"
                      </Button>
                    </Box>
                  ) : null}

                  {/* ── Show recent products when no query ── */}
                  {showRecent && (
                    <>
                      <Typography variant="caption" fontWeight={700} sx={{
                        px: 1.5, py: 0.5, display: "block", color: "text.secondary",
                        fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5,
                      }}>
                        Recent Products
                      </Typography>
                      {recentProducts.map((product, idx) => (
                        <ProductSearchRow
                          key={product.id} product={product} index={idx}
                          focused={focusedIndex === idx}
                          quantity={selectedQty[product.id] ?? ''}
                          onQuantityChange={(qty) => {
                            setSelectedQty((prev) => ({ ...prev, [product.id]: qty }));
                            setSelectedForCart((prev) => {
                              const next = new Set(prev);
                              const hasQty = qty !== '' && parseInt(qty as any) > 0;
                              if (hasQty) next.add(product.id); else next.delete(product.id);
                              return next;
                            });
                          }}
                          onAdd={() => handleAddProduct(product)}
                          onIncrement={() => handleIncrement(product.id)}
                          onRemove={() => onRemoveFromCart?.(product.id)}
                          onMainClick={() => handleRowMainClick(product)}
                          isInCart={cartItemIds.has(product.id)}
                          onQtyKeyDown={(e) => handleQtyKeyDown(e, product, idx)}
                          partyDiscount={partyDiscounts[product.category ?? ""]}
                          atMaxItems={atMaxItems}
                          isSelected={selectedForCart.has(product.id)}
                          onToggleSelect={() => handleToggleSelect(product.id)}
                          onFocusSearch={focusSearchInput}
                        />
                      ))}
                    </>
                  )}

                  {/* ── Other search results (excluding in-cart) ── */}
                  {hasResults ? (() => {
                    const otherResults = visibleResults;
                    if (otherResults.length === 0 && cartItemIds.size > 0) return (
                      <Box sx={{ py: 2, px: 2, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary">All shown products are already in cart</Typography>
                      </Box>
                    );
                    return otherResults.map((product, idx) => (
                      <ProductSearchRow
                        key={product.id} product={product} index={idx}
                        focused={focusedIndex === idx}
                        quantity={selectedQty[product.id] ?? ''}
                        onQuantityChange={(qty) => {
                          setSelectedQty((prev) => ({ ...prev, [product.id]: qty }));
                          setSelectedForCart((prev) => {
                            const next = new Set(prev);
                            const hasQty = qty !== '' && parseInt(qty as any) > 0;
                            if (hasQty) next.add(product.id); else next.delete(product.id);
                            return next;
                          });
                        }}
                        onAdd={() => handleAddProduct(product)}
                        onIncrement={() => handleIncrement(product.id)}
                        onRemove={() => onRemoveFromCart?.(product.id)}
                        onMainClick={() => handleRowMainClick(product)}
                        isInCart={false}
                        onQtyKeyDown={(e) => handleQtyKeyDown(e, product, idx)}
                        partyDiscount={partyDiscounts[product.category ?? ""]}
                        atMaxItems={atMaxItems}
                        isSelected={selectedForCart.has(product.id)}
                        onToggleSelect={() => handleToggleSelect(product.id)}
                        onFocusSearch={focusSearchInput}
                      />
                    ));
                  })() : null}

                  {/* Suggestions hidden — no "no results" or "type to search" messages */}
                </Box>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}

// ─── Individual product row ───────────────────────────────────────────────────

interface ProductSearchRowProps {
  product: QuickSearchProduct;
  index: number;
  focused: boolean;
  quantity: number | '';
  onQuantityChange: (qty: number | '') => void;
  onAdd: () => void;
  onIncrement: () => void;
  onRemove: () => void;
  onMainClick: () => void;
  isInCart: boolean;
  onQtyKeyDown: (e: React.KeyboardEvent) => void;
  partyDiscount?: number;
  atMaxItems: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  /** Called to refocus the search input after an action completes (supports rapid multi-add) */
  onFocusSearch?: () => void;
}

function ProductSearchRow({
  product, index, focused, quantity,
  onQuantityChange, onAdd, onIncrement, onRemove, onMainClick,
  isInCart, onQtyKeyDown, partyDiscount, atMaxItems,
  isSelected, onToggleSelect, onFocusSearch,
}: ProductSearchRowProps) {
  const theme = useTheme();
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const stock = product.stock ?? product.quantity ?? 0;
  const inStock = stock > 0;
  const lowStock = stock > 0 && stock <= 5;

  useEffect(() => {
    if (focused && qtyInputRef.current) { qtyInputRef.current.focus(); qtyInputRef.current.select(); }
  }, [focused]);

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onQuantityChange('');
    } else {
      const num = parseInt(val);
      if (!isNaN(num) && num >= 1) {
        onQuantityChange(num);
      }
    }
  };

  return (
    <Box
      data-row-index={index}
      role="option"
      aria-selected={focused}
      tabIndex={-1}
      sx={{
        display: "flex", alignItems: "center", gap: 0.5, px: 0.5, py: 0.5,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        transition: "background 0.15s",
        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
        "&:last-of-type": { borderBottom: 0 }, cursor: "pointer",
        bgcolor: focused ? alpha(theme.palette.primary.main, 0.08)
          : isInCart ? alpha(theme.palette.success.main, 0.04)
          : isSelected ? alpha(theme.palette.primary.main, 0.06)
          : "transparent",
        outline: focused ? `2px solid ${alpha(theme.palette.primary.main, 0.5)}` : "none",
        outlineOffset: -2, borderRadius: 0.5,
      }}
    >
      {/* Checkbox for multi-select */}
      {onToggleSelect && !isInCart && (
        <Checkbox
          size="small"
          checked={!!isSelected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          sx={{ p: 0.25, '& .MuiSvgIcon-root': { fontSize: 18 } }}
        />
      )}
      {isInCart && <Box sx={{ width: 26 }} />}

      {/* Clickable main area */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 0 }}
        onClick={(e) => { e.stopPropagation(); onMainClick(); }}
      >
        <Avatar sx={{
          width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main, fontSize: "0.75rem", fontWeight: 800, flexShrink: 0,
        }}>
          {product.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap sx={{ fontSize: "0.8rem" }}>
            {product.name}
            {isInCart && <CheckCircleIcon sx={{ fontSize: 14, color: "success.main", ml: 0.5, verticalAlign: "middle" }} />}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.1 }}>
            {product.category && <Chip label={product.category} size="small" sx={{ height: 18, fontSize: "0.6rem", bgcolor: alpha(theme.palette.grey[500], 0.12) }} />}
            {!inStock && <Chip label="Out of stock" size="small" sx={{ height: 18, fontSize: "0.6rem", bgcolor: alpha(theme.palette.error.main, 0.1), color: "error.main" }} />}
            {lowStock && inStock && <Chip label={`Only ${stock} left`} size="small" sx={{ height: 18, fontSize: "0.6rem", bgcolor: alpha(theme.palette.warning.main, 0.1), color: "warning.main" }} />}
            {partyDiscount && partyDiscount > 0 && <Chip label={`-${partyDiscount}%`} size="small" sx={{ height: 18, fontSize: "0.6rem", bgcolor: alpha(theme.palette.success.main, 0.1), color: "success.main" }} />}
          </Box>
        </Box>
      </Box>

      {/* Price — fixed width to align with column header */}
      <Typography variant="body2" fontWeight={800} color="primary" sx={{ fontSize: "0.85rem", whiteSpace: "nowrap", width: 64, textAlign: "right", flexShrink: 0, pr: 0.5 }}>
        ₹{product.price}
      </Typography>

      {/* Quantity input - empty by default */}
      <TextField
        type="number" size="small" value={quantity}
        onChange={handleQtyChange}
        placeholder="Qty"
        onKeyDown={onQtyKeyDown}
        onClick={(e) => e.stopPropagation()}
        inputRef={qtyInputRef}
        inputProps={{ min: 1, style: { fontWeight: 700, fontSize: "0.85rem", textAlign: "center", padding: "2px" } }}
        sx={{ width: 68, flexShrink: 0, "& .MuiOutlinedInput-root": { height: 34, bgcolor: alpha(theme.palette.background.default, 0.6) }, "& input": { px: 0.5 } }}
      />

      {/* Remove button — only for items in cart */}
      {isInCart ? (
        <>
                <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onRemove(); onFocusSearch?.(); }}
            sx={{
              color: "error.main", bgcolor: alpha(theme.palette.error.main, 0.08),
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.2) },
              borderRadius: 1.5, width: 34, height: 34, flexShrink: 0,
            }}
          >
            <RemoveIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Button
            size="small" variant="outlined" color="success"
            onClick={(e) => { e.stopPropagation(); onIncrement(); onFocusSearch?.(); }}
            disabled={atMaxItems}
            sx={{ minWidth: 42, height: 34, px: 0.5, borderRadius: 1.5, fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}
          >
            +{quantity || 1}
          </Button>
        </>
      ) : (
          <Button
          size="small" variant="contained"
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          disabled={atMaxItems || (!inStock && false)}
          sx={{ width: 56, height: 34, px: 0, borderRadius: 1.5, fontSize: "0.75rem", fontWeight: 700, flexShrink: 0, boxShadow: "none" }}
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
        >
          {quantity || 1}
        </Button>
      )}
    </Box>
  );
}
