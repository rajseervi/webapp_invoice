import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Stack,
  Badge,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  LocalOffer as LocalOfferIcon,
  TrendingDown as TrendingDownIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AutoAwesome as AutoAwesomeIcon,
  Percent as PercentIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { Category } from '@/types/inventory';
import { Party } from '@/types/party';

interface CategoryDiscountRule {
  categoryId: string;
  categoryName: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minQuantity?: number;
  maxDiscount?: number;
  isActive: boolean;
  description?: string;
}

interface PartyDiscountRule {
  partyId: string;
  partyName: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minOrderValue?: number;
  maxDiscount?: number;
  isActive: boolean;
  validUntil?: string;
}

interface BulkDiscountTier {
  id: string;
  minAmount: number;
  maxAmount?: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  isActive: boolean;
}

interface DiscountConfigurationModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  selectedParty: Party | null;
  categoryDiscountRules: CategoryDiscountRule[];
  partyDiscountRules: PartyDiscountRule[];
  globalDiscount: number;
  globalDiscountType: 'percentage' | 'fixed';
  bulkDiscountEnabled: boolean;
  bulkDiscountThreshold: number;
  bulkDiscountRate: number;
  onUpdateCategoryDiscount: (categoryId: string, field: keyof CategoryDiscountRule, value: any) => void;
  onUpdatePartyDiscount: (partyId: string, field: keyof PartyDiscountRule, value: any) => void;
  onUpdateGlobalDiscount: (discount: number) => void;
  onUpdateGlobalDiscountType: (type: 'percentage' | 'fixed') => void;
  onUpdateBulkDiscount: (enabled: boolean, threshold: number, rate: number) => void;
  lineItems?: any[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`discount-tabpanel-${index}`}
      aria-labelledby={`discount-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export const DiscountConfigurationModal: React.FC<DiscountConfigurationModalProps> = ({
  open,
  onClose,
  categories,
  selectedParty,
  categoryDiscountRules,
  partyDiscountRules,
  globalDiscount,
  globalDiscountType,
  bulkDiscountEnabled,
  bulkDiscountThreshold,
  bulkDiscountRate,
  onUpdateCategoryDiscount,
  onUpdatePartyDiscount,
  onUpdateGlobalDiscount,
  onUpdateGlobalDiscountType,
  onUpdateBulkDiscount,
  lineItems = []
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bulkTiers, setBulkTiers] = useState<BulkDiscountTier[]>([
    {
      id: '1',
      minAmount: 10000,
      maxAmount: 25000,
      discount: 5,
      discountType: 'percentage',
      isActive: true
    },
    {
      id: '2',
      minAmount: 25000,
      maxAmount: 50000,
      discount: 10,
      discountType: 'percentage',
      isActive: true
    },
    {
      id: '3',
      minAmount: 50000,
      discount: 15,
      discountType: 'percentage',
      isActive: true
    }
  ]);

  // Calculate statistics
  const stats = {
    totalCategories: categoryDiscountRules.length,
    activeCategories: categoryDiscountRules.filter(r => r.isActive).length,
    totalSavings: lineItems.reduce((sum, item) => sum + (item.totalDiscount || 0), 0),
    categorySavings: lineItems.reduce((sum, item) => sum + (item.categoryDiscount || 0), 0),
    partySavings: lineItems.reduce((sum, item) => sum + (item.partyDiscount || 0), 0),
    averageDiscount: lineItems.length > 0 
      ? lineItems.reduce((sum, item) => {
          const baseAmount = (item.price || 0) * (item.quantity || 0);
          return sum + (baseAmount > 0 ? ((item.totalDiscount || 0) / baseAmount) * 100 : 0);
        }, 0) / lineItems.length 
      : 0
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleQuickApply = (percentage: number) => {
    categoryDiscountRules.forEach(rule => {
      onUpdateCategoryDiscount(rule.categoryId, 'isActive', true);
      onUpdateCategoryDiscount(rule.categoryId, 'discount', percentage);
    });
  };

  const handleClearAll = () => {
    categoryDiscountRules.forEach(rule => {
      onUpdateCategoryDiscount(rule.categoryId, 'isActive', false);
      onUpdateCategoryDiscount(rule.categoryId, 'discount', 0);
    });
  };

  const handleOptimizeDiscounts = () => {
    // Smart optimization logic
    categoryDiscountRules.forEach(rule => {
      const categoryItems = lineItems.filter(item => item.category === rule.categoryId);
      const categoryTotal = categoryItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
      
      if (categoryTotal > 50000) {
        onUpdateCategoryDiscount(rule.categoryId, 'discount', 15);
      } else if (categoryTotal > 25000) {
        onUpdateCategoryDiscount(rule.categoryId, 'discount', 10);
      } else if (categoryTotal > 10000) {
        onUpdateCategoryDiscount(rule.categoryId, 'discount', 5);
      } else {
        onUpdateCategoryDiscount(rule.categoryId, 'discount', 2);
      }
      onUpdateCategoryDiscount(rule.categoryId, 'isActive', categoryTotal > 5000);
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', maxHeight: '900px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocalOfferIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Advanced Discount Configuration</Typography>
            <Chip 
              label={`${stats.activeCategories}/${stats.totalCategories} Active`} 
              size="small" 
              color="primary" 
              sx={{ ml: 2 }} 
            />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Statistics Overview */}
        <Card sx={{ mb: 3, bgcolor: 'primary.light' }}>
          <CardContent sx={{ py: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary.dark">
                    ₹{stats.totalSavings.toFixed(0)}
                  </Typography>
                  <Typography variant="caption" color="primary.dark">
                    Total Savings
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">
                    {stats.averageDiscount.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg Discount
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="info.main">
                    {stats.activeCategories}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active Rules
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="warning.main">
                    {lineItems.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Items
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <AutoAwesomeIcon sx={{ mr: 1 }} />
              Quick Actions
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6} sm={2}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickApply(5)}
                >
                  5% All
                </Button>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickApply(10)}
                >
                  10% All
                </Button>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={handleOptimizeDiscounts}
                >
                  Optimize
                </Button>
              </Grid>
              <Grid item xs={6} sm={2}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={handleClearAll}
                >
                  Clear All
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showAdvanced}
                      onChange={(e) => setShowAdvanced(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Advanced Options"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              label="Category Discounts" 
              icon={<CategoryIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Global & Bulk" 
              icon={<AttachMoneyIcon />} 
              iconPosition="start"
            />
            {selectedParty && (
              <Tab 
                label="Party Specific" 
                icon={<PersonIcon />} 
                iconPosition="start"
              />
            )}
            <Tab 
              label="Preview & Summary" 
              icon={<VisibilityIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          {/* Category Discounts */}
          <Grid container spacing={2}>
            {categoryDiscountRules.map((rule) => {
              const categoryItems = lineItems.filter(item => item.category === rule.categoryId);
              const categoryTotal = categoryItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
              const categorySavings = categoryItems.reduce((sum, item) => sum + (item.categoryDiscount || 0), 0);

              return (
                <Grid item xs={12} md={6} key={rule.categoryId}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight="medium">
                            {rule.categoryName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {categoryItems.length} items • ₹{categoryTotal.toFixed(0)}
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={rule.isActive}
                              onChange={(e) => onUpdateCategoryDiscount(rule.categoryId, 'isActive', e.target.checked)}
                            />
                          }
                          label=""
                        />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="body2" gutterBottom>
                            Discount Percentage
                          </Typography>
                          <Slider
                            value={rule.discount}
                            onChange={(_, value) => onUpdateCategoryDiscount(rule.categoryId, 'discount', value)}
                            min={0}
                            max={50}
                            step={0.5}
                            marks={[
                              { value: 0, label: '0%' },
                              { value: 25, label: '25%' },
                              { value: 50, label: '50%' }
                            ]}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${value}%`}
                            disabled={!rule.isActive}
                          />
                        </Grid>

                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Discount %"
                            type="number"
                            value={rule.discount}
                            onChange={(e) => onUpdateCategoryDiscount(rule.categoryId, 'discount', Number(e.target.value))}
                            InputProps={{ 
                              endAdornment: '%',
                              inputProps: { min: 0, max: 50, step: 0.5 }
                            }}
                            disabled={!rule.isActive}
                          />
                        </Grid>

                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Min Quantity"
                            type="number"
                            value={rule.minQuantity || 1}
                            onChange={(e) => onUpdateCategoryDiscount(rule.categoryId, 'minQuantity', Number(e.target.value))}
                            disabled={!rule.isActive}
                            inputProps={{ min: 1, step: 1 }}
                          />
                        </Grid>

                        {showAdvanced && (
                          <>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Max Discount Amount"
                                type="number"
                                value={rule.maxDiscount || ''}
                                onChange={(e) => onUpdateCategoryDiscount(rule.categoryId, 'maxDiscount', Number(e.target.value))}
                                InputProps={{ startAdornment: '₹' }}
                                disabled={!rule.isActive}
                                placeholder="No limit"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Description"
                                value={rule.description || ''}
                                onChange={(e) => onUpdateCategoryDiscount(rule.categoryId, 'description', e.target.value)}
                                disabled={!rule.isActive}
                                placeholder="Optional description"
                              />
                            </Grid>
                          </>
                        )}
                      </Grid>

                      {rule.isActive && categorySavings > 0 && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          <Typography variant="caption">
                            <strong>Current Savings:</strong> ₹{categorySavings.toFixed(2)} 
                            ({categoryTotal > 0 ? ((categorySavings / categoryTotal) * 100).toFixed(1) : 0}%)
                          </Typography>
                        </Alert>
                      )}

                      {rule.isActive && categoryItems.length === 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="caption">
                            No items in this category yet
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Global & Bulk Discounts */}
          <Grid container spacing={3}>
            {/* Global Discount */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoneyIcon sx={{ mr: 1, color: 'success.main' }} />
                    Global Discount
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom>
                        Discount Amount
                      </Typography>
                      <Slider
                        value={globalDiscount}
                        onChange={(_, value) => onUpdateGlobalDiscount(value as number)}
                        min={0}
                        max={globalDiscountType === 'percentage' ? 50 : 10000}
                        step={globalDiscountType === 'percentage' ? 0.5 : 100}
                        marks={globalDiscountType === 'percentage' ? [
                          { value: 0, label: '0%' },
                          { value: 25, label: '25%' },
                          { value: 50, label: '50%' }
                        ] : [
                          { value: 0, label: '₹0' },
                          { value: 5000, label: '₹5K' },
                          { value: 10000, label: '₹10K' }
                        ]}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => globalDiscountType === 'percentage' ? `${value}%` : `₹${value}`}
                      />
                    </Grid>

                    <Grid item xs={8}>
                      <TextField
                        fullWidth
                        label="Global Discount"
                        type="number"
                        value={globalDiscount}
                        onChange={(e) => onUpdateGlobalDiscount(Number(e.target.value))}
                        InputProps={{
                          endAdornment: globalDiscountType === 'percentage' ? '%' : '₹',
                          inputProps: { 
                            min: 0, 
                            max: globalDiscountType === 'percentage' ? 50 : 10000, 
                            step: globalDiscountType === 'percentage' ? 0.5 : 100 
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={globalDiscountType}
                          label="Type"
                          onChange={(e) => onUpdateGlobalDiscountType(e.target.value as 'percentage' | 'fixed')}
                        >
                          <MenuItem value="percentage">%</MenuItem>
                          <MenuItem value="fixed">₹</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {globalDiscount > 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="caption">
                        This discount will be applied to all invoice items
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Bulk Discount */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingDownIcon sx={{ mr: 1, color: 'secondary.main' }} />
                      Bulk Discount
                    </Typography>
                    <Switch
                      checked={bulkDiscountEnabled}
                      onChange={(e) => onUpdateBulkDiscount(e.target.checked, bulkDiscountThreshold, bulkDiscountRate)}
                    />
                  </Box>

                  {bulkDiscountEnabled && (
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Threshold"
                          type="number"
                          value={bulkDiscountThreshold}
                          onChange={(e) => onUpdateBulkDiscount(bulkDiscountEnabled, Number(e.target.value), bulkDiscountRate)}
                          InputProps={{ startAdornment: '₹' }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Discount Rate"
                          type="number"
                          value={bulkDiscountRate}
                          onChange={(e) => onUpdateBulkDiscount(bulkDiscountEnabled, bulkDiscountThreshold, Number(e.target.value))}
                          InputProps={{ endAdornment: '%' }}
                        />
                      </Grid>

                      {showAdvanced && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>
                            Bulk Discount Tiers
                          </Typography>
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Min Amount</TableCell>
                                  <TableCell>Max Amount</TableCell>
                                  <TableCell>Discount</TableCell>
                                  <TableCell>Active</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {bulkTiers.map((tier) => (
                                  <TableRow key={tier.id}>
                                    <TableCell>₹{tier.minAmount.toLocaleString()}</TableCell>
                                    <TableCell>
                                      {tier.maxAmount ? `₹${tier.maxAmount.toLocaleString()}` : 'No limit'}
                                    </TableCell>
                                    <TableCell>{tier.discount}%</TableCell>
                                    <TableCell>
                                      <Switch checked={tier.isActive} size="small" />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      )}
                    </Grid>
                  )}

                  {!bulkDiscountEnabled && (
                    <Alert severity="info">
                      <Typography variant="caption">
                        Enable bulk discount to offer volume-based pricing
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {selectedParty && (
          <TabPanel value={activeTab} index={2}>
            {/* Party Specific Discounts */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1, color: 'warning.main' }} />
                  Discount for {selectedParty.name}
                </Typography>

                {partyDiscountRules.filter(rule => rule.partyId === selectedParty.id).map((rule) => (
                  <Grid container spacing={2} key={rule.partyId}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={rule.isActive}
                            onChange={(e) => onUpdatePartyDiscount(rule.partyId, 'isActive', e.target.checked)}
                          />
                        }
                        label={`Enable special discount for ${rule.partyName}`}
                      />
                    </Grid>

                    {rule.isActive && (
                      <>
                        <Grid item xs={12}>
                          <Typography variant="body2" gutterBottom>
                            Discount Percentage
                          </Typography>
                          <Slider
                            value={rule.discount}
                            onChange={(_, value) => onUpdatePartyDiscount(rule.partyId, 'discount', value)}
                            min={0}
                            max={25}
                            step={0.5}
                            marks={[
                              { value: 0, label: '0%' },
                              { value: 12.5, label: '12.5%' },
                              { value: 25, label: '25%' }
                            ]}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${value}%`}
                          />
                        </Grid>

                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Discount Rate"
                            type="number"
                            value={rule.discount}
                            onChange={(e) => onUpdatePartyDiscount(rule.partyId, 'discount', Number(e.target.value))}
                            InputProps={{ endAdornment: '%' }}
                          />
                        </Grid>

                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Min Order Value"
                            type="number"
                            value={rule.minOrderValue}
                            onChange={(e) => onUpdatePartyDiscount(rule.partyId, 'minOrderValue', Number(e.target.value))}
                            InputProps={{ startAdornment: '₹' }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Valid Until"
                            value={rule.validUntil}
                            onChange={(e) => onUpdatePartyDiscount(rule.partyId, 'validUntil', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>

                        {showAdvanced && (
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Max Discount Amount"
                              type="number"
                              value={rule.maxDiscount || ''}
                              onChange={(e) => onUpdatePartyDiscount(rule.partyId, 'maxDiscount', Number(e.target.value))}
                              InputProps={{ startAdornment: '₹' }}
                              placeholder="No limit"
                            />
                          </Grid>
                        )}
                      </>
                    )}
                  </Grid>
                ))}
              </CardContent>
            </Card>
          </TabPanel>
        )}

        <TabPanel value={activeTab} index={selectedParty ? 3 : 2}>
          {/* Preview & Summary */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalculateIcon sx={{ mr: 1, color: 'primary.main' }} />
                    Discount Summary
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Category Discounts:</Typography>
                      <Typography variant="body2" color="success.main">
                        ₹{stats.categorySavings.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Party Discounts:</Typography>
                      <Typography variant="body2" color="info.main">
                        ₹{stats.partySavings.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Global Discount:</Typography>
                      <Typography variant="body2" color="warning.main">
                        {globalDiscount > 0 ? `${globalDiscount}${globalDiscountType === 'percentage' ? '%' : '₹'}` : '₹0.00'}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" fontWeight="bold">Total Savings:</Typography>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        ₹{stats.totalSavings.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
                    Active Rules
                  </Typography>

                  <Stack spacing={1}>
                    {categoryDiscountRules.filter(r => r.isActive).map(rule => (
                      <Chip
                        key={rule.categoryId}
                        label={`${rule.categoryName}: ${rule.discount}%`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    
                    {globalDiscount > 0 && (
                      <Chip
                        label={`Global: ${globalDiscount}${globalDiscountType === 'percentage' ? '%' : '₹'}`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                    
                    {bulkDiscountEnabled && (
                      <Chip
                        label={`Bulk: ${bulkDiscountRate}% (₹${bulkDiscountThreshold}+)`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                    
                    {partyDiscountRules.filter(r => r.isActive && r.partyId === selectedParty?.id).map(rule => (
                      <Chip
                        key={rule.partyId}
                        label={`${rule.partyName}: ${rule.discount}%`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    ))}
                  </Stack>

                  {stats.totalSavings > 0 && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        🎉 Total potential savings: ₹{stats.totalSavings.toFixed(2)}
                        {lineItems.length > 0 && ` (${stats.averageDiscount.toFixed(1)}% average)`}
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={onClose} variant="contained" startIcon={<SaveIcon />}>
          Apply & Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiscountConfigurationModal;