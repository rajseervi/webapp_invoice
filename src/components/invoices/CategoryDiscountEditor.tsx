"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Chip,
  Avatar,
  Fade,
  InputAdornment,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Percent as PercentIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { alpha } from '@mui/material/styles';

interface Category {
  id: string;
  name: string;
  defaultDiscount?: number;
  defaultDp?: number;
}

interface CategoryDiscount {
  categoryId: string;
  categoryName: string;
  discount: number;
  dp?: number;
}

interface CategoryDiscountEditorProps {
  open: boolean;
  onClose: () => void;
  partyId: string;
  // Support legacy number or new object shape: { discount, dp }
  categoryDiscounts: Record<string, any>;
  onSave: (updatedDiscounts: Record<string, any>) => void;
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

const CategoryDiscountEditor: React.FC<CategoryDiscountEditorProps> = ({
  open,
  onClose,
  partyId,
  categoryDiscounts,
  onSave
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [discounts, setDiscounts] = useState<CategoryDiscount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  // DP+ edit value state (new)
  const [editDpValue, setEditDpValue] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDiscountsCount, setActiveDiscountsCount] = useState<number>(0);
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesCollection = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesCollection);
        const categoriesList = categoriesSnapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, name: data.name, defaultDiscount: data.defaultDiscount || 0, defaultDp: data.defaultDp || 0 };
        });
        setCategories(categoriesList);
        const discountsList = categoriesList.map(category => {
          const raw = categoryDiscounts?.[category.name];
          if (raw == null) {
            return {
              categoryId: category.id,
              categoryName: category.name,
              discount: 0,
              dp: 0
            };
          }

          if (typeof raw === 'number') {
            return {
              categoryId: category.id,
              categoryName: category.name,
              discount: raw,
              dp: 0
            };
          }

          // Assume object { discount, dp }
          return {
            categoryId: category.id,
            categoryName: category.name,
            discount: raw.discount || 0,
            dp: raw.dp || 0
          };
        });
        setDiscounts(discountsList);
        setError(null);
      } catch (err: any) {
        const msg = err?.message || '';
        if (msg.includes('query requires an index') || msg.includes('requires a composite index')) {
          setError('⚠️ Firestore index required. Create the composite index for the "categories" collection (isActive + name + __name__) or contact your admin to run the deployment script.');
        } else if (msg.includes('Missing or insufficient permissions')) {
          setError('Permission denied. You do not have read access to categories.');
        } else {
          setError(`Failed to load categories: ${msg || 'Please try again.'}`);
        }
      } finally {
        setLoading(false);
      }
    };
    if (open) fetchCategories();
  }, [open, categoryDiscounts]);

  useEffect(() => {
    setActiveDiscountsCount(discounts.filter(item => (item.discount > 0 || (item.dp && item.dp > 0))).length);
  }, [discounts]);

  const discountInputRef = React.useRef<HTMLInputElement>(null);

  const handleStartEditing = (categoryId: string, currentDiscount: number, currentDp: number = 0) => {
    setEditingCategoryId(categoryId);
    setEditValue(currentDiscount);
    setEditDpValue(currentDp);
    setTimeout(() => {
      if (discountInputRef.current) {
        discountInputRef.current.focus();
        discountInputRef.current.select();
      }
    }, 100);
  };

  const handleSaveDiscount = (categoryId: string) => {
    const validDiscount = Math.min(100, Math.max(0, editValue));
    const validDp = Math.max(0, editDpValue || 0);
    setDiscounts(prev =>
      prev.map(item =>
        item.categoryId === categoryId ? { ...item, discount: validDiscount, dp: validDp } : item
      )
    );
    setEditingCategoryId(null);
  };

  const handleSaveAllDiscounts = () => {
    const updatedDiscounts: Record<string, any> = {};
    discounts.forEach(item => {
      // Store as object with discount and dp
      updatedDiscounts[item.categoryName] = { discount: item.discount, dp: item.dp || 0 };
    });
    onSave(updatedDiscounts);
    onClose();
  };

  const handleResetToDefaults = () => {
    setDiscounts(
      categories.map(category => ({
        categoryId: category.id,
        categoryName: category.name,
        discount: category.defaultDiscount || 0,
        dp: category.defaultDp || 0
      }))
    );
  };

  const handleClearAllDiscounts = () => {
    setDiscounts(
      categories.map(category => ({
        categoryId: category.id,
        categoryName: category.name,
        discount: 0,
        dp: 0
      }))
    );
  };

  const filteredDiscounts = discounts.filter(item => {
    if (showOnlyActive && (item.discount <= 0 && !(item.dp && item.dp > 0))) return false;
    return searchQuery === '' || item.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={true}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          maxWidth: { sm: 560 },
          mx: 'auto',
          bgcolor: palette.surface,
        }
      }}
    >
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 1.5, borderBottom: `1px solid ${palette.border}`,
        bgcolor: palette.white,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: palette.primaryLight }}>
            <PercentIcon sx={{ fontSize: 20, color: palette.primary }} />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color={palette.text} lineHeight={1.2}>
              Category Discounts
            </Typography>
            <Typography variant="caption" color={palette.textSecondary}>
              {activeDiscountsCount} active
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: palette.textSecondary }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 2, bgcolor: palette.surface }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Typography variant="body2" color={palette.textSecondary} sx={{ mb: 2 }}>
          Set discount percentages for each category. These will apply to all products in that category for this party.
        </Typography>

        {/* Search & Filters */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
          <TextField
            id="category-search-input"
            placeholder="Search categories..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            sx={styles.input}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: palette.textSecondary }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')} edge="end">
                    <ClearIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showOnlyActive}
                  onChange={(e) => setShowOnlyActive(e.target.checked)}
                  color="primary"
                />
              }
              label={<Typography variant="caption" color={palette.textSecondary}>Active only</Typography>}
            />
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button size="small" variant="outlined" onClick={handleClearAllDiscounts}
                sx={{ ...styles.btnOutline, fontSize: '0.65rem', py: 0.3, px: 1.2 }}>
                Clear All
              </Button>
              <Button size="small" variant="outlined" onClick={handleResetToDefaults}
                sx={{ ...styles.btnOutline, fontSize: '0.65rem', py: 0.3, px: 1.2 }}>
                <RefreshIcon sx={{ fontSize: 14, mr: 0.3 }} /> Reset
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Category Cards */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
            <CircularProgress />
          </Box>
        ) : filteredDiscounts.length === 0 ? (
          <Box sx={{
            textAlign: 'center', py: 6, border: `2px dashed ${palette.border}`,
            borderRadius: 3, bgcolor: palette.white,
          }}>
            <CategoryIcon sx={{ fontSize: 48, color: palette.border, mb: 1 }} />
            <Typography variant="body2" fontWeight={600} color={palette.textSecondary}>
              {searchQuery ? `No categories matching "${searchQuery}"` : 'No categories found'}
            </Typography>
            <Typography variant="caption" color={palette.textSecondary}>
              {showOnlyActive && !searchQuery ? 'Enable a discount to see it here' : 'Try a different search'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredDiscounts.map((item, idx) => {
              const isEditing = editingCategoryId === item.categoryId;
              const isActive = item.discount > 0;
              const bgColor = isEditing
                ? palette.primaryLight
                : isActive
                  ? palette.successLight
                  : palette.white;

              return (
                <Fade in key={item.categoryId} timeout={200 + idx * 30}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1.5, borderRadius: 2.5,
                    bgcolor: bgColor,
                    border: `1px solid ${isEditing ? palette.primary : isActive ? palette.success : palette.border}`,
                    transition: 'all 0.2s',
                  }}>
                    {/* Category avatar */}
                    <Avatar sx={{
                      width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700,
                      bgcolor: isActive ? palette.successLight : palette.surfaceAlt,
                      color: isActive ? palette.success : palette.textSecondary,
                    }}>
                      {item.categoryName.charAt(0).toUpperCase()}
                    </Avatar>

                    {/* Name */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} color={palette.text}
                        sx={{ wordBreak: 'break-word' }}>
                        {item.categoryName}
                      </Typography>
                      {isActive && !isEditing && (
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                          label={`${item.discount}% off`}
                          size="small"
                          sx={styles.chip(palette.successLight, palette.success)}
                        />
                      )}
                    </Box>

                    {/* Discount input or value */}
                    {isEditing ? (
                                          // Make inputs responsive: wrap on small screens so DP field stays visible
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                                            <TextField
                                              type="number"
                                              size="small"
                                              value={editValue}
                                              onChange={(e) => {
                                                let value = Number(e.target.value);
                                                if (isNaN(value)) value = 0;
                                                value = Math.min(100, Math.max(0, value));
                                                setEditValue(value);
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveDiscount(item.categoryId);
                                                if (e.key === 'Escape') setEditingCategoryId(null);
                                              }}
                                              inputProps={{ min: 0, max: 100, step: 0.5 }}
                                              // Use responsive width so it doesn't push DP out of view
                                              sx={{ width: { xs: '48%', sm: 92 }, minWidth: 84, ...styles.input }}
                                              inputRef={discountInputRef}
                                              InputProps={{
                                                endAdornment: <InputAdornment position="end" sx={{ '& p': { fontSize: '0.75rem' } }}>%</InputAdornment>,
                                              }}
                                              autoFocus
                                            />
                                            <TextField
                                              type="number"
                                              size="small"
                                              value={editDpValue}
                                              onChange={(e) => {
                                                let v = Number(e.target.value);
                                                if (isNaN(v)) v = 0;
                                                setEditDpValue(v);
                                              }}
                                              inputProps={{ min: 0, step: 0.5 }}
                                              // Ensure DP field has enough width and a minWidth so the value stays fully visible
                                              sx={{ width: { xs: '48%', sm: 128 }, minWidth: 110, ...styles.input }}
                                              InputProps={{
                                                endAdornment: <InputAdornment position="end" sx={{ '& p': { fontSize: '0.75rem', whiteSpace: 'nowrap' } }}>DP%</InputAdornment>,
                                              }}
                                            />
                                            <IconButton size="small" onClick={() => handleSaveDiscount(item.categoryId)}
                                              sx={{ bgcolor: palette.success, color: palette.white, '&:hover': { bgcolor: '#059669' }, borderRadius: 1.5, width: 34, height: 34, ml: { xs: 0, sm: 0.5 } }}>
                                              <CheckCircleIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                          </Box>
                                        ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={isActive ? palette.success : palette.textSecondary}
                          sx={{ minWidth: 40, textAlign: 'right', whiteSpace: 'nowrap' }}
                        >
                          {item.discount}%
                        </Typography>
                        {(item.dp ?? 0) > 0 && (
                          <Chip
                            label={`DP+ ${item.dp}%`}
                            size="small"
                            sx={{ ml: 1, maxWidth: '100%' }}
                          />
                        )}
                        <IconButton size="small" onClick={() => handleStartEditing(item.categoryId, item.discount, item.dp || 0)}
                          sx={{ bgcolor: palette.surface, '&:hover': { bgcolor: palette.primaryLight, color: palette.primary }, borderRadius: 1.5, width: 30, height: 30 }}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Fade>
              );
            })}
          </Box>
        )}
      </DialogContent>

      {/* Sticky Footer */}
      <Box sx={{
        position: 'sticky', bottom: 0, left: 0, right: 0,
        bgcolor: palette.white, borderTop: `1px solid ${palette.border}`,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        px: 2, py: 1.5,
        display: 'flex', gap: 1.5,
      }}>
        <Button onClick={onClose} fullWidth sx={{ ...styles.btnOutline, py: 1.2, fontSize: '0.85rem' }}>
          Cancel
        </Button>
        <Button onClick={handleSaveAllDiscounts} variant="contained" fullWidth
          disabled={loading}
          sx={{ ...styles.btnPrimary, py: 1.2, fontSize: '0.85rem' }}>
          Apply Discounts
        </Button>
      </Box>
    </Dialog>
  );
};

export default CategoryDiscountEditor;
