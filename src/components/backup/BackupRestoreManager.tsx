"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Paper,
  Divider,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch
} from '@mui/material';
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Folder as FolderIcon,
  CloudUpload as CloudUploadIcon,
  History as HistoryIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { 
  backupService, 
  BackupData, 
  BackupMetadata, 
  BackupProgress, 
  RestoreProgress, 
  BACKUP_COLLECTIONS,
  BackupCollection 
} from '@/services/backupService';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';

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
      id={`backup-tabpanel-${index}`}
      aria-labelledby={`backup-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function BackupRestoreManager() {
  const { userId } = useCurrentUser();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Backup state
  const [createBackupDialog, setCreateBackupDialog] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<BackupCollection[]>([...BACKUP_COLLECTIONS]);
  const [backupProgress, setBackupProgress] = useState<BackupProgress[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  
  // Restore state
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupMetadata | null>(null);
  const [restoreOptions, setRestoreOptions] = useState({
    overwriteExisting: false,
    createBackupBeforeRestore: true,
    collectionsToRestore: [...BACKUP_COLLECTIONS] as BackupCollection[]
  });
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgress[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Import/Export state
  const [importDialog, setImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  
  // Stats state
  const [stats, setStats] = useState({
    totalBackups: 0,
    totalSize: 0,
    lastBackup: undefined as string | undefined,
    autoBackupsCount: 0,
    manualBackupsCount: 0
  });

  // Load data on component mount
  useEffect(() => {
    loadBackups();
    loadStats();
  }, [userId]);

  const loadBackups = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const backupList = await backupService.getBackupList(userId);
      setBackups(backupList);
    } catch (err: any) {
      setError('Failed to load backups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!userId) return;
    
    try {
      const backupStats = await backupService.getBackupStats(userId);
      setStats(backupStats);
    } catch (err) {
      console.error('Failed to load backup stats:', err);
    }
  };

  const handleCreateBackup = async () => {
    if (!userId || !backupName.trim()) return;
    
    try {
      setIsCreatingBackup(true);
      setBackupProgress([]);
      setError(null);
      
      const backup = await backupService.createBackup(
        backupName.trim(),
        userId,
        backupDescription.trim() || undefined,
        selectedCollections,
        (progress) => {
          setBackupProgress(prev => {
            const existing = prev.find(p => p.collection === progress.collection);
            if (existing) {
              return prev.map(p => p.collection === progress.collection ? progress : p);
            } else {
              return [...prev, progress];
            }
          });
        }
      );
      
      setSuccess(`Backup "${backupName}" created successfully with ${backup.metadata.totalDocuments} documents`);
      setCreateBackupDialog(false);
      setBackupName('');
      setBackupDescription('');
      setSelectedCollections([...BACKUP_COLLECTIONS]);
      
      // Reload backups and stats
      await loadBackups();
      await loadStats();
    } catch (err: any) {
      setError(`Failed to create backup: ${err.message}`);
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress([]);
    }
  };

  const handleRestoreBackup = async (backupData: BackupData) => {
    if (!userId) return;
    
    try {
      setIsRestoring(true);
      setRestoreProgress([]);
      setError(null);
      
      await backupService.restoreBackup(
        backupData,
        userId,
        restoreOptions,
        (progress) => {
          setRestoreProgress(prev => {
            const existing = prev.find(p => p.collection === progress.collection);
            if (existing) {
              return prev.map(p => p.collection === progress.collection ? progress : p);
            } else {
              return [...prev, progress];
            }
          });
        }
      );
      
      setSuccess('Backup restored successfully');
      setRestoreDialog(false);
      
      // Reload data
      await loadBackups();
      await loadStats();
    } catch (err: any) {
      setError(`Failed to restore backup: ${err.message}`);
    } finally {
      setIsRestoring(false);
      setRestoreProgress([]);
    }
  };

  const handleDeleteBackup = async (backupId: string, backupName: string) => {
    if (!confirm(`Are you sure you want to delete backup "${backupName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await backupService.deleteBackup(backupId);
      setSuccess('Backup deleted successfully');
      await loadBackups();
      await loadStats();
    } catch (err: any) {
      setError(`Failed to delete backup: ${err.message}`);
    }
  };

  const handleExportBackup = async (backup: BackupMetadata) => {
    try {
      setLoading(true);
      // For export, we need to recreate the backup data
      // In a real implementation, you might store the full backup data
      setError('Export functionality requires full backup data. Please create a new backup to export.');
    } catch (err: any) {
      setError(`Failed to export backup: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async () => {
    if (!importFile) return;
    
    try {
      setLoading(true);
      const backupData = await backupService.importFromFile(importFile);
      
      // Show restore dialog with imported data
      setSelectedBackup(backupData.metadata);
      setImportDialog(false);
      setRestoreDialog(true);
      setImportFile(null);
    } catch (err: any) {
      setError(`Failed to import backup: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAutoBackup = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      await backupService.createAutoBackup(userId);
      setSuccess('Automatic backup created successfully');
      await loadBackups();
      await loadStats();
    } catch (err: any) {
      setError(`Failed to create automatic backup: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'processing':
        return <CircularProgress size={20} />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Backup & Restore Manager
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create, manage, and restore data backups for your GST application
        </Typography>
      </Box>

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StorageIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.totalBackups}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Backups
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FolderIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{formatFileSize(stats.totalSize)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Size
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats.autoBackupsCount}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Auto Backups
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <HistoryIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {stats.lastBackup ? formatDate(stats.lastBackup).split(' ')[0] : 'Never'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Backup
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Backup Management" icon={<BackupIcon />} />
            <Tab label="Restore Data" icon={<RestoreIcon />} />
            <Tab label="Import/Export" icon={<CloudUploadIcon />} />
            <Tab label="Settings" icon={<SettingsIcon />} />
          </Tabs>
        </Box>

        {/* Backup Management Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Backup Management</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ScheduleIcon />}
                onClick={handleCreateAutoBackup}
                disabled={loading}
              >
                Auto Backup
              </Button>
              <Button
                variant="contained"
                startIcon={<BackupIcon />}
                onClick={() => setCreateBackupDialog(true)}
              >
                Create Backup
              </Button>
            </Box>
          </Box>

          {/* Backup List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {backups.map((backup) => (
                <ListItem key={backup.id} divider>
                  <ListItemIcon>
                    {backup.isAutoBackup ? <ScheduleIcon /> : <BackupIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">{backup.name}</Typography>
                        {backup.isAutoBackup && (
                          <Chip label="Auto" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Typography variant="body2" color="text.secondary" component="span" display="block">
                          {backup.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="span" display="block">
                          Created: {formatDate(backup.createdAt)} • 
                          Documents: {backup.totalDocuments} • 
                          Size: {formatFileSize(backup.fileSize)}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {backup.collections.map((collection) => (
                            <Chip
                              key={collection}
                              label={collection}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Restore">
                        <IconButton
                          onClick={() => {
                            setSelectedBackup(backup);
                            setRestoreDialog(true);
                          }}
                        >
                          <RestoreIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Export">
                        <IconButton onClick={() => handleExportBackup(backup)}>
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDeleteBackup(backup.id, backup.name)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              
              {backups.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No backups found"
                    secondary="Create your first backup to get started"
                  />
                </ListItem>
              )}
            </List>
          )}
        </TabPanel>

        {/* Restore Data Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Restore Data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a backup to restore your data. You can choose which collections to restore and whether to overwrite existing data.
          </Typography>

          {/* Restore Progress */}
          {restoreProgress.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Restore Progress
              </Typography>
              {restoreProgress.map((progress) => (
                <Box key={progress.collection} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getStatusIcon(progress.status)}
                    <Typography variant="body2" sx={{ ml: 1, flex: 1 }}>
                      {progress.collection}: {progress.message}
                    </Typography>
                    <Typography variant="caption">
                      {progress.processed}/{progress.total}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress.percentage}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </Paper>
          )}

          {/* Available Backups for Restore */}
          <List>
            {backups.map((backup) => (
              <ListItem key={backup.id} divider>
                <ListItemIcon>
                  {backup.isAutoBackup ? <ScheduleIcon /> : <BackupIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={backup.name}
                  secondary={`${formatDate(backup.createdAt)} • ${backup.totalDocuments} documents`}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    startIcon={<RestoreIcon />}
                    onClick={() => {
                      setSelectedBackup(backup);
                      setRestoreDialog(true);
                    }}
                    disabled={isRestoring}
                  >
                    Restore
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Import/Export Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Import & Export
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Import Backup
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Import a backup file from your computer
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => setImportDialog(true)}
                    fullWidth
                  >
                    Import Backup File
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Export Backup
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Export existing backups to files
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => setActiveTab(0)}
                    fullWidth
                  >
                    Go to Backup List
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Backup Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Automatic Backups
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure automatic backup settings
                  </Typography>
                  
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable automatic backups"
                  />
                  
                  <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Backup Frequency</InputLabel>
                      <Select defaultValue="daily" label="Backup Frequency">
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Keep backups for (days)"
                      type="number"
                      defaultValue={30}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Storage Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Manage backup storage and cleanup
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    onClick={() => backupService.cleanupOldBackups(userId!, 10)}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Clean Up Old Backups
                  </Button>
                  
                  <Alert severity="info">
                    <Typography variant="body2">
                      Current storage usage: {formatFileSize(stats.totalSize)}
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Create Backup Dialog */}
      <Dialog open={createBackupDialog} onClose={() => setCreateBackupDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Backup</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Backup Name"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
            
            <TextField
              fullWidth
              label="Description (Optional)"
              value={backupDescription}
              onChange={(e) => setBackupDescription(e.target.value)}
              multiline
              rows={2}
              sx={{ mb: 3 }}
            />
            
            <Typography variant="subtitle1" gutterBottom>
              Select Collections to Backup:
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Button
                size="small"
                onClick={() => setSelectedCollections([...BACKUP_COLLECTIONS])}
              >
                Select All
              </Button>
              <Button
                size="small"
                onClick={() => setSelectedCollections([])}
              >
                Select None
              </Button>
            </Box>
            
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {BACKUP_COLLECTIONS.map((collection) => (
                <FormControlLabel
                  key={collection}
                  control={
                    <Checkbox
                      checked={selectedCollections.includes(collection)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCollections([...selectedCollections, collection]);
                        } else {
                          setSelectedCollections(selectedCollections.filter(c => c !== collection));
                        }
                      }}
                    />
                  }
                  label={collection}
                />
              ))}
            </Box>
            
            {/* Backup Progress */}
            {backupProgress.length > 0 && (
              <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Backup Progress
                </Typography>
                {backupProgress.map((progress) => (
                  <Box key={progress.collection} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getStatusIcon(progress.status)}
                      <Typography variant="body2" sx={{ ml: 1, flex: 1 }}>
                        {progress.collection}: {progress.message}
                      </Typography>
                      <Typography variant="caption">
                        {progress.processed}/{progress.total}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progress.percentage}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateBackupDialog(false)} disabled={isCreatingBackup}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateBackup}
            variant="contained"
            disabled={!backupName.trim() || selectedCollections.length === 0 || isCreatingBackup}
            startIcon={isCreatingBackup ? <CircularProgress size={20} /> : <BackupIcon />}
          >
            {isCreatingBackup ? 'Creating...' : 'Create Backup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialog} onClose={() => setRestoreDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Restore Backup</DialogTitle>
        <DialogContent>
          {selectedBackup && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Warning:</strong> Restoring data will modify your current database. 
                  Make sure you have a recent backup before proceeding.
                </Typography>
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Backup Details
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Name:</strong> {selectedBackup.name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Created:</strong> {formatDate(selectedBackup.createdAt)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                <strong>Documents:</strong> {selectedBackup.totalDocuments}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Restore Options:
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={restoreOptions.overwriteExisting}
                    onChange={(e) => setRestoreOptions({
                      ...restoreOptions,
                      overwriteExisting: e.target.checked
                    })}
                  />
                }
                label="Overwrite existing data"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={restoreOptions.createBackupBeforeRestore}
                    onChange={(e) => setRestoreOptions({
                      ...restoreOptions,
                      createBackupBeforeRestore: e.target.checked
                    })}
                  />
                }
                label="Create backup before restore"
              />
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Collections to Restore:
              </Typography>
              
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {selectedBackup.collections.map((collection) => (
                  <FormControlLabel
                    key={collection}
                    control={
                      <Checkbox
                        checked={restoreOptions.collectionsToRestore.includes(collection)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRestoreOptions({
                              ...restoreOptions,
                              collectionsToRestore: [...restoreOptions.collectionsToRestore, collection]
                            });
                          } else {
                            setRestoreOptions({
                              ...restoreOptions,
                              collectionsToRestore: restoreOptions.collectionsToRestore.filter(c => c !== collection)
                            });
                          }
                        }}
                      />
                    }
                    label={collection}
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog(false)} disabled={isRestoring}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              // For now, we'll show an alert since we need the full backup data
              alert('Restore functionality requires full backup data implementation');
            }}
            variant="contained"
            color="warning"
            disabled={isRestoring || restoreOptions.collectionsToRestore.length === 0}
            startIcon={isRestoring ? <CircularProgress size={20} /> : <RestoreIcon />}
          >
            {isRestoring ? 'Restoring...' : 'Restore Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Backup File</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a backup JSON file to import
            </Typography>
            
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              style={{ width: '100%', padding: '10px', border: '1px dashed #ccc', borderRadius: '4px' }}
            />
            
            {importFile && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Selected: {importFile.name} ({formatFileSize(importFile.size)})
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImportBackup}
            variant="contained"
            disabled={!importFile || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {loading ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}