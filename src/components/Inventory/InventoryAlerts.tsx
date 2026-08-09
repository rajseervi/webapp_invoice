"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  AlertTitle,
  Badge,
  Avatar,
  Stack,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  useTheme,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Delete as DeleteIcon,
  MarkAsUnread as MarkAsUnreadIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Inventory as InventoryIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
  AttachMoney as MoneyIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

interface InventoryAlertsProps {
  notifications: any[];
  onNotificationUpdate: () => void;
  stats: any;
}

interface AlertRule {
  id: string;
  name: string;
  type: 'stock' | 'expiry' | 'reorder' | 'quality' | 'financial' | 'system';
  condition: string;
  threshold: number;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
}

const alertTypes = {
  stock: { icon: <InventoryIcon />, color: 'warning', label: 'Stock Alert' },
  expiry: { icon: <ScheduleIcon />, color: 'error', label: 'Expiry Alert' },
  reorder: { icon: <TrendingDownIcon />, color: 'info', label: 'Reorder Alert' },
  quality: { icon: <AssessmentIcon />, color: 'warning', label: 'Quality Alert' },
  financial: { icon: <MoneyIcon />, color: 'error', label: 'Financial Alert' },
  system: { icon: <SecurityIcon />, color: 'info', label: 'System Alert' }
};

const priorityColors = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error'
};

export default function InventoryAlerts({ 
  notifications, 
  onNotificationUpdate, 
  stats 
}: InventoryAlertsProps) {
  const theme = useTheme();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRead, setShowRead] = useState(true);
  const [alertRulesDialog, setAlertRulesDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [alertDetailsDialog, setAlertDetailsDialog] = useState(false);

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'stock',
      priority: 'critical',
      title: 'Critical Stock Level',
      message: 'Product A has only 2 units left in stock',
      details: 'Current stock: 2 units, Minimum required: 20 units',
      timestamp: new Date(),
      read: false,
      actionRequired: true,
      productId: 'prod-001',
      productName: 'Product A'
    },
    {
      id: 2,
      type: 'expiry',
      priority: 'high',
      title: 'Products Expiring Soon',
      message: '5 products will expire within 7 days',
      details: 'Products: Product B (3 days), Product C (5 days), Product D (7 days)',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      actionRequired: true,
      affectedProducts: ['prod-002', 'prod-003', 'prod-004']
    },
    {
      id: 3,
      type: 'reorder',
      priority: 'medium',
      title: 'Reorder Point Reached',
      message: 'Product E has reached its reorder point',
      details: 'Current stock: 15 units, Reorder point: 15 units',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      read: true,
      actionRequired: false,
      productId: 'prod-005',
      productName: 'Product E'
    },
    {
      id: 4,
      type: 'financial',
      priority: 'high',
      title: 'High Inventory Value',
      message: 'Inventory value has exceeded budget threshold',
      details: 'Current value: ₹5,50,000, Budget threshold: ₹5,00,000',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      read: false,
      actionRequired: true
    },
    {
      id: 5,
      type: 'quality',
      priority: 'medium',
      title: 'Quality Check Due',
      message: '8 products are due for quality inspection',
      details: 'Products pending quality check for more than 30 days',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      read: true,
      actionRequired: false
    },
    {
      id: 6,
      type: 'system',
      priority: 'low',
      title: 'System Backup Completed',
      message: 'Daily inventory backup completed successfully',
      details: 'Backup size: 2.5 GB, Duration: 15 minutes',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      read: true,
      actionRequired: false
    }
  ]);

  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: 'rule-001',
      name: 'Low Stock Alert',
      type: 'stock',
      condition: 'stock_level_below',
      threshold: 10,
      enabled: true,
      priority: 'high',
      recipients: ['admin@company.com', 'inventory@company.com']
    },
    {
      id: 'rule-002',
      name: 'Critical Stock Alert',
      type: 'stock',
      condition: 'stock_level_below',
      threshold: 5,
      enabled: true,
      priority: 'critical',
      recipients: ['admin@company.com', 'manager@company.com']
    },
    {
      id: 'rule-003',
      name: 'Expiry Warning',
      type: 'expiry',
      condition: 'expires_within_days',
      threshold: 7,
      enabled: true,
      priority: 'medium',
      recipients: ['inventory@company.com']
    }
  ]);

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || alert.type === filter;
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReadStatus = showRead || !alert.read;
    
    return matchesFilter && matchesSearch && matchesReadStatus;
  });

  const unreadCount = alerts.filter(alert => !alert.read).length;
  const criticalCount = alerts.filter(alert => alert.priority === 'critical' && !alert.read).length;
  const actionRequiredCount = alerts.filter(alert => alert.actionRequired && !alert.read).length;

  const handleMarkAsRead = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const handleMarkAsUnread = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, read: false } : alert
    ));
  };

  const handleDeleteAlert = (alertId: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleViewDetails = (alert: any) => {
    setSelectedAlert(alert);
    setAlertDetailsDialog(true);
  };

  const getAlertIcon = (type: string, priority: string) => {
    const typeConfig = alertTypes[type as keyof typeof alertTypes];
    if (priority === 'critical') {
      return <ErrorIcon color="error" />;
    }
    return React.cloneElement(typeConfig.icon, { color: typeConfig.color as any });
  };

  const AlertCard = ({ alert }: { alert: any }) => (
    <Card 
      sx={{ 
        mb: 2,
        border: alert.priority === 'critical' ? '2px solid' : '1px solid',
        borderColor: alert.priority === 'critical' ? 'error.main' : 'divider',
        backgroundColor: alert.read ? 'background.paper' : 'action.hover',
        '&:hover': {
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Avatar sx={{ 
            bgcolor: `${priorityColors[alert.priority as keyof typeof priorityColors]}.main`,
            width: 40,
            height: 40
          }}>
            {getAlertIcon(alert.type, alert.priority)}
          </Avatar>
          
          <Box flexGrow={1}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Box>
                <Typography variant="h6" component="div" sx={{ fontWeight: alert.read ? 'normal' : 'bold' }}>
                  {alert.title}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                  <Chip 
                    size="small" 
                    label={alertTypes[alert.type as keyof typeof alertTypes].label}
                    color={alertTypes[alert.type as keyof typeof alertTypes].color as any}
                    variant="outlined"
                  />
                  <Chip 
                    size="small" 
                    label={alert.priority.toUpperCase()}
                    color={priorityColors[alert.priority as keyof typeof priorityColors] as any}
                    variant={alert.priority === 'critical' ? 'filled' : 'outlined'}
                  />
                  {alert.actionRequired && (
                    <Chip size="small" label="Action Required" color="warning" />
                  )}
                </Stack>
              </Box>
              
              <Typography variant="caption" color="textSecondary">
                {format(alert.timestamp, 'MMM dd, HH:mm')}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="textSecondary" mb={2}>
              {alert.message}
            </Typography>
            
            <Stack direction="row" spacing={1}>
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => handleViewDetails(alert)}
              >
                View Details
              </Button>
              
              {alert.actionRequired && (
                <Button 
                  size="small" 
                  variant="contained" 
                  color="primary"
                >
                  Take Action
                </Button>
              )}
              
              <IconButton 
                size="small"
                onClick={() => alert.read ? handleMarkAsUnread(alert.id) : handleMarkAsRead(alert.id)}
              >
                {alert.read ? <MarkAsUnreadIcon /> : <MarkEmailReadIcon />}
              </IconButton>
              
              <IconButton 
                size="small"
                onClick={() => handleDeleteAlert(alert.id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Alerts Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Badge badgeContent={unreadCount} color="error">
                <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                  <NotificationsIcon />
                </Avatar>
              </Badge>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Inventory Alerts
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Monitor and manage inventory notifications
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setAlertRulesDialog(true)}
              >
                Alert Rules
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={onNotificationUpdate}
              >
                Refresh
              </Button>
            </Stack>
          </Box>

          {/* Alert Summary */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
                <Typography variant="h4" fontWeight="bold">
                  {criticalCount}
                </Typography>
                <Typography variant="body2">
                  Critical Alerts
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <Typography variant="h4" fontWeight="bold">
                  {actionRequiredCount}
                </Typography>
                <Typography variant="body2">
                  Action Required
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                <Typography variant="h4" fontWeight="bold">
                  {unreadCount}
                </Typography>
                <Typography variant="body2">
                  Unread Alerts
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Typography variant="h4" fontWeight="bold">
                  {alerts.length}
                </Typography>
                <Typography variant="body2">
                  Total Alerts
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Filters and Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={filter}
                label="Filter by Type"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="stock">Stock Alerts</MenuItem>
                <MenuItem value="expiry">Expiry Alerts</MenuItem>
                <MenuItem value="reorder">Reorder Alerts</MenuItem>
                <MenuItem value="quality">Quality Alerts</MenuItem>
                <MenuItem value="financial">Financial Alerts</MenuItem>
                <MenuItem value="system">System Alerts</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={showRead}
                  onChange={(e) => setShowRead(e.target.checked)}
                />
              }
              label="Show Read Alerts"
            />

            <Button
              variant="outlined"
              onClick={() => {
                setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
              }}
            >
              Mark All as Read
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Box>
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <NotificationsOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No alerts found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'All caught up! No new alerts at the moment.'
                }
              </Typography>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        )}
      </Box>

      {/* Alert Rules Dialog */}
      <Dialog 
        open={alertRulesDialog} 
        onClose={() => setAlertRulesDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Alert Rules Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {alertRules.map((rule) => (
              <Accordion key={rule.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Switch checked={rule.enabled} />
                    <Typography variant="h6">{rule.name}</Typography>
                    <Chip 
                      size="small" 
                      label={rule.priority.toUpperCase()}
                      color={priorityColors[rule.priority as keyof typeof priorityColors] as any}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Rule Name"
                        value={rule.name}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Priority</InputLabel>
                        <Select value={rule.priority} label="Priority">
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="critical">Critical</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Threshold"
                        type="number"
                        value={rule.threshold}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Condition</InputLabel>
                        <Select value={rule.condition} label="Condition">
                          <MenuItem value="stock_level_below">Stock Level Below</MenuItem>
                          <MenuItem value="expires_within_days">Expires Within Days</MenuItem>
                          <MenuItem value="value_exceeds">Value Exceeds</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Recipients (comma separated)"
                        value={rule.recipients.join(', ')}
                        size="small"
                        multiline
                        rows={2}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertRulesDialog(false)}>Cancel</Button>
          <Button variant="contained">Save Rules</Button>
        </DialogActions>
      </Dialog>

      {/* Alert Details Dialog */}
      <Dialog 
        open={alertDetailsDialog} 
        onClose={() => setAlertDetailsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Alert Details</DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box sx={{ mt: 2 }}>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ 
                    bgcolor: `${priorityColors[selectedAlert.priority as keyof typeof priorityColors]}.main`
                  }}>
                    {getAlertIcon(selectedAlert.type, selectedAlert.priority)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedAlert.title}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {format(selectedAlert.timestamp, 'PPpp')}
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Message
                  </Typography>
                  <Typography variant="body2">
                    {selectedAlert.message}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Details
                  </Typography>
                  <Typography variant="body2">
                    {selectedAlert.details}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Chip 
                    size="small" 
                    label={alertTypes[selectedAlert.type as keyof typeof alertTypes].label}
                    color={alertTypes[selectedAlert.type as keyof typeof alertTypes].color as any}
                  />
                  <Chip 
                    size="small" 
                    label={selectedAlert.priority.toUpperCase()}
                    color={priorityColors[selectedAlert.priority as keyof typeof priorityColors] as any}
                  />
                  {selectedAlert.actionRequired && (
                    <Chip size="small" label="Action Required" color="warning" />
                  )}
                </Stack>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDetailsDialog(false)}>Close</Button>
          {selectedAlert?.actionRequired && (
            <Button variant="contained" color="primary">
              Take Action
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}