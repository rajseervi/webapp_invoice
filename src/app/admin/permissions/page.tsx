"use client";
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  Button, 
  CircularProgress,
  useTheme,
  Grid,
  IconButton,
  Chip,
  alpha,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Alert,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Card,
  CardContent,
  Tab,
  Tabs
} from '@mui/material';
import { 
  People as PeopleIcon, 
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  LockOpen as LockOpenIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Define interfaces for type safety
interface User {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  status: string;
  lastLogin?: string;
  createdAt?: string;
  permissions?: UserPermissions;
}

interface UserPermissions {
  pages?: {
    [key: string]: boolean;
  };
  features?: {
    [key: string]: boolean;
  };
}

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: UserPermissions;
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
      id={`permissions-tabpanel-${index}`}
      aria-labelledby={`permissions-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function PermissionsPage() {
  const theme = useTheme();
  const router = useRouter();
  const { currentUser, userRole } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PermissionTemplate | null>(null);
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editedPermissions, setEditedPermissions] = useState<UserPermissions>({
    pages: {},
    features: {}
  });
  const [editedTemplate, setEditedTemplate] = useState<PermissionTemplate>({
    id: '',
    name: '',
    description: '',
    permissions: {
      pages: {},
      features: {}
    }
  });
  
  // Available pages and features for permissions
  const availablePages = [
    { id: 'dashboard', name: 'Dashboard', description: 'Access to the main dashboard' },
    { id: 'invoices', name: 'Invoices', description: 'View and manage invoices' },
    { id: 'products', name: 'Products', description: 'View and manage products' },
    { id: 'categories', name: 'Categories', description: 'View and manage product categories' },
    { id: 'parties', name: 'Parties', description: 'View and manage business parties' },
    { id: 'reports', name: 'Reports', description: 'Access to business reports' },
    { id: 'settings', name: 'Settings', description: 'Access to system settings' },
    { id: 'profile', name: 'Profile', description: 'Access to user profile' },
    { id: 'users', name: 'Users', description: 'Manage system users' },
    { id: 'admin', name: 'Admin Panel', description: 'Access to admin features' },
  ];
  
  const availableFeatures = [
    { id: 'create_invoice', name: 'Create Invoice', description: 'Create new invoices' },
    { id: 'edit_invoice', name: 'Edit Invoice', description: 'Edit existing invoices' },
    { id: 'delete_invoice', name: 'Delete Invoice', description: 'Delete invoices' },
    { id: 'create_product', name: 'Create Product', description: 'Add new products' },
    { id: 'edit_product', name: 'Edit Product', description: 'Edit existing products' },
    { id: 'delete_product', name: 'Delete Product', description: 'Delete products' },
    { id: 'create_party', name: 'Create Party', description: 'Add new parties' },
    { id: 'edit_party', name: 'Edit Party', description: 'Edit existing parties' },
    { id: 'delete_party', name: 'Delete Party', description: 'Delete parties' },
    { id: 'view_reports', name: 'View Reports', description: 'Access to view reports' },
    { id: 'export_data', name: 'Export Data', description: 'Export data from the system' },
    { id: 'import_data', name: 'Import Data', description: 'Import data into the system' },
    { id: 'manage_users', name: 'Manage Users', description: 'Add, edit, and delete users' },
    { id: 'manage_permissions', name: 'Manage Permissions', description: 'Set user permissions' },
    { id: 'view_logs', name: 'View Logs', description: 'Access to system logs' },
  ];
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        
        const usersList: User[] = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        
        setUsers(usersList);
        
        // Fetch permission templates
        const templatesCollection = collection(db, 'permissionTemplates');
        const templatesSnapshot = await getDocs(templatesCollection);
        
        const templatesList: PermissionTemplate[] = templatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PermissionTemplate));
        
        setTemplates(templatesList);
        
        // If no templates exist, create default ones
        if (templatesList.length === 0) {
          await createDefaultTemplates();
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const createDefaultTemplates = async () => {
    try {
      const defaultTemplates: PermissionTemplate[] = [
        {
          id: 'admin',
          name: 'Administrator',
          description: 'Full access to all features',
          permissions: {
            pages: availablePages.reduce((acc, page) => ({ ...acc, [page.id]: true }), {}),
            features: availableFeatures.reduce((acc, feature) => ({ ...acc, [feature.id]: true }), {})
          }
        },
        {
          id: 'manager',
          name: 'Manager',
          description: 'Access to most features except admin settings',
          permissions: {
            pages: availablePages.reduce((acc, page) => ({ 
              ...acc, 
              [page.id]: page.id !== 'admin' && page.id !== 'users'
            }), {}),
            features: availableFeatures.reduce((acc, feature) => ({ 
              ...acc, 
              [feature.id]: !feature.id.includes('manage_') && feature.id !== 'view_logs'
            }), {})
          }
        },
        {
          id: 'user',
          name: 'Basic User',
          description: 'Limited access to essential features',
          permissions: {
            pages: {
              dashboard: true,
              invoices: true,
              products: true,
              parties: true,
              profile: true,
              settings: true,
              reports: false,
              categories: false,
              users: false,
              admin: false
            },
            features: {
              create_invoice: true,
              edit_invoice: true,
              delete_invoice: false,
              create_product: false,
              edit_product: false,
              delete_product: false,
              create_party: true,
              edit_party: true,
              delete_party: false,
              view_reports: false,
              export_data: true,
              import_data: false,
              manage_users: false,
              manage_permissions: false,
              view_logs: false
            }
          }
        }
      ];
      
      // Save default templates to Firestore
      for (const template of defaultTemplates) {
        const templateRef = doc(db, 'permissionTemplates', template.id);
        await setDoc(templateRef, template);
      }
      
      setTemplates(defaultTemplates);
    } catch (err) {
      console.error('Error creating default templates:', err);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setEditedPermissions({
      pages: user.permissions?.pages || {},
      features: user.permissions?.features || {}
    });
  };
  
  const handleTemplateSelect = (template: PermissionTemplate) => {
    setSelectedTemplate(template);
    setEditedTemplate({...template});
  };
  
  const handleEditPermissions = () => {
    setIsEditingPermissions(true);
  };
  
  const handleEditTemplate = () => {
    setIsEditingTemplate(true);
  };
  
  const handleCreateTemplate = () => {
    setIsCreatingTemplate(true);
    setEditedTemplate({
      id: '',
      name: 'New Template',
      description: 'Description',
      permissions: {
        pages: {},
        features: {}
      }
    });
    setSelectedTemplate(null);
  };
  
  const handleCancelEdit = () => {
    setIsEditingPermissions(false);
    if (selectedUser) {
      setEditedPermissions({
        pages: selectedUser.permissions?.pages || {},
        features: selectedUser.permissions?.features || {}
      });
    }
  };
  
  const handleCancelTemplateEdit = () => {
    setIsEditingTemplate(false);
    setIsCreatingTemplate(false);
    if (selectedTemplate) {
      setEditedTemplate({...selectedTemplate});
    }
  };
  
  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      
      await updateDoc(userRef, {
        permissions: editedPermissions
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, permissions: editedPermissions } 
          : user
      ));
      
      setSelectedUser({
        ...selectedUser,
        permissions: editedPermissions
      });
      
      setIsEditingPermissions(false);
    } catch (err) {
      console.error('Error updating permissions:', err);
    }
  };
  
  const handleSaveTemplate = async () => {
    try {
      const templateId = isCreatingTemplate 
        ? `template_${Date.now()}` 
        : editedTemplate.id;
      
      const templateRef = doc(db, 'permissionTemplates', templateId);
      
      const templateData = {
        ...editedTemplate,
        id: templateId
      };
      
      await setDoc(templateRef, templateData);
      
      // Update local state
      if (isCreatingTemplate) {
        setTemplates([...templates, templateData]);
        setSelectedTemplate(templateData);
      } else {
        setTemplates(templates.map(template => 
          template.id === templateId 
            ? templateData 
            : template
        ));
        setSelectedTemplate(templateData);
      }
      
      setIsEditingTemplate(false);
      setIsCreatingTemplate(false);
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };
  
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      const templateRef = doc(db, 'permissionTemplates', selectedTemplate.id);
      await updateDoc(templateRef, { deleted: true });
      
      // Update local state
      setTemplates(templates.filter(template => template.id !== selectedTemplate.id));
      setSelectedTemplate(null);
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };
  
  const handlePermissionChange = (type: 'pages' | 'features', id: string, value: boolean) => {
    setEditedPermissions(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [id]: value
      }
    }));
  };
  
  const handleTemplatePermissionChange = (type: 'pages' | 'features', id: string, value: boolean) => {
    setEditedTemplate(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [type]: {
          ...prev.permissions[type],
          [id]: value
        }
      }
    }));
  };
  
  const handleApplyTemplate = async () => {
    if (!selectedUser || !selectedTemplate) return;
    
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      
      await updateDoc(userRef, {
        permissions: selectedTemplate.permissions
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, permissions: selectedTemplate.permissions } 
          : user
      ));
      
      setSelectedUser({
        ...selectedUser,
        permissions: selectedTemplate.permissions
      });
      
      setEditedPermissions(selectedTemplate.permissions);
    } catch (err) {
      console.error('Error applying template:', err);
    }
  };
  
  const handleTemplateFieldChange = (field: string, value: string) => {
    setEditedTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: 'calc(100vh - 88px)',
          gap: 2
        }}>
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            Loading permissions management...
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }
  
  // Redirect if not admin
  if (userRole !== 'admin') {
    return (
      <DashboardLayout>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: 'calc(100vh - 88px)',
          gap: 2,
          p: 3
        }}>
          <SecurityIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            You don't have permission to access this page.
            Only administrators can manage user permissions.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => router.push('/dashboard')}
            sx={{ mt: 3 }}
          >
            Return to Dashboard
          </Button>
        </Box>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <Box sx={{ 
        width: '100%', 
        p: { xs: 2, sm: 3 },
        overflow: 'hidden'
      }}>
        {/* Page Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Permissions Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Control what users can access and do in the system
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh data">
              <IconButton 
                onClick={() => window.location.reload()}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                py: 2,
                minHeight: 'auto'
              }
            }}
          >
            <Tab 
              label="User Permissions" 
              icon={<PeopleIcon />} 
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
            <Tab 
              label="Permission Templates" 
              icon={<SecurityIcon />} 
              iconPosition="start"
              sx={{ textTransform: 'none' }}
            />
          </Tabs>
        </Paper>
        
        {/* User Permissions Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Select User
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Search users"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      sx: { borderRadius: 2 }
                    }}
                  />
                </Box>
                
                <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                  {filteredUsers.map((user) => (
                    <ListItem 
                      key={user.id}
                      button
                      selected={selectedUser?.id === user.id}
                      onClick={() => handleUserSelect(user)}
                      sx={{ 
                        borderRadius: 1,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.15),
                          }
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: user.role === 'admin' 
                              ? theme.palette.error.main 
                              : user.role === 'manager'
                                ? theme.palette.warning.main
                                : theme.palette.primary.main
                          }}
                        >
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={user.displayName || 'Unnamed User'} 
                        secondary={
                          <>
                            {user.email}
                            <br />
                            <Chip 
                              label={user.role} 
                              size="small" 
                              sx={{ mr: 0.5, mt: 0.5 }}
                              color={
                                user.role === 'admin' 
                                  ? 'error' 
                                  : user.role === 'manager'
                                    ? 'warning'
                                    : 'primary'
                              }
                            />
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                {selectedUser ? (
                  <>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            mr: 2, 
                            bgcolor: selectedUser.role === 'admin' 
                              ? theme.palette.error.main 
                              : selectedUser.role === 'manager'
                                ? theme.palette.warning.main
                                : theme.palette.primary.main,
                            width: 48,
                            height: 48
                          }}
                        >
                          {selectedUser.displayName?.charAt(0) || selectedUser.email?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {selectedUser.displayName || 'Unnamed User'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedUser.email} • {selectedUser.role}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box>
                        {isEditingPermissions ? (
                          <>
                            <Button 
                              variant="outlined" 
                              color="inherit"
                              onClick={handleCancelEdit}
                              sx={{ mr: 1 }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="contained" 
                              color="primary"
                              onClick={handleSavePermissions}
                            >
                              Save Changes
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              variant="outlined" 
                              color="primary"
                              startIcon={<SecurityIcon />}
                              onClick={() => setTabValue(1)}
                              sx={{ mr: 1 }}
                            >
                              Templates
                            </Button>
                            <Button 
                              variant="contained" 
                              color="primary"
                              startIcon={<EditIcon />}
                              onClick={handleEditPermissions}
                              disabled={selectedUser.role === 'admin'}
                            >
                              Edit Permissions
                            </Button>
                          </>
                        )}
                      </Box>
                    </Box>
                    
                    <Divider sx={{ mb: 3 }} />
                    
                    {templates.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                          Apply Permission Template
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {templates.map(template => (
                            <Grid item xs={12} sm={6} md={4} key={template.id}>
                              <Card 
                                variant="outlined" 
                                sx={{ 
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  borderColor: selectedTemplate?.id === template.id 
                                    ? theme.palette.primary.main 
                                    : theme.palette.divider,
                                  bgcolor: selectedTemplate?.id === template.id 
                                    ? alpha(theme.palette.primary.main, 0.05)
                                    : 'transparent',
                                  '&:hover': {
                                    borderColor: theme.palette.primary.main,
                                    bgcolor: alpha(theme.palette.primary.main, 0.05)
                                  }
                                }}
                                onClick={() => handleTemplateSelect(template)}
                              >
                                <CardContent>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {template.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {template.description}
                                  </Typography>
                                  
                                  {selectedTemplate?.id === template.id && (
                                    <Button 
                                      variant="contained" 
                                      size="small" 
                                      fullWidth
                                      onClick={handleApplyTemplate}
                                      disabled={selectedUser.role === 'admin'}
                                    >
                                      Apply to User
                                    </Button>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                    
                    <Divider sx={{ mb: 3 }} />
                    
                    <Grid container spacing={3}>
                      {/* Page Permissions */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                          Page Access
                        </Typography>
                        
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Page</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Access</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {availablePages.map((page) => (
                                <TableRow key={page.id}>
                                  <TableCell>{page.name}</TableCell>
                                  <TableCell>{page.description}</TableCell>
                                  <TableCell align="right">
                                    <Switch
                                      checked={!!editedPermissions.pages?.[page.id]}
                                      onChange={(e) => handlePermissionChange('pages', page.id, e.target.checked)}
                                      disabled={!isEditingPermissions || selectedUser.role === 'admin'}
                                      color="primary"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                      
                      {/* Feature Permissions */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                          Feature Access
                        </Typography>
                        
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Feature</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Access</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {availableFeatures.map((feature) => (
                                <TableRow key={feature.id}>
                                  <TableCell>{feature.name}</TableCell>
                                  <TableCell>{feature.description}</TableCell>
                                  <TableCell align="right">
                                    <Switch
                                      checked={!!editedPermissions.features?.[feature.id]}
                                      onChange={(e) => handlePermissionChange('features', feature.id, e.target.checked)}
                                      disabled={!isEditingPermissions || selectedUser.role === 'admin'}
                                      color="primary"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    </Grid>
                    
                    {selectedUser.role === 'admin' && (
                      <Alert severity="info" sx={{ mt: 3 }}>
                        Admin users automatically have access to all pages and features. Individual permissions cannot be modified.
                      </Alert>
                    )}
                  </>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center',
                    py: 8
                  }}>
                    <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.7 }} />
                    <Typography variant="h6" color="text.secondary">
                      Select a user to manage permissions
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      You can control which pages and features each user can access
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Permission Templates Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Typography variant="h6">
                    Permission Templates
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateTemplate}
                    size="small"
                  >
                    New Template
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                  {templates.map((template) => (
                    <ListItem 
                      key={template.id}
                      button
                      selected={selectedTemplate?.id === template.id}
                      onClick={() => handleTemplateSelect(template)}
                      sx={{ 
                        borderRadius: 1,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.15),
                          }
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          <SecurityIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={template.name} 
                        secondary={template.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                {(selectedTemplate || isCreatingTemplate) ? (
                  <>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Box>
                        {isEditingTemplate || isCreatingTemplate ? (
                          <TextField
                            value={editedTemplate.name}
                            onChange={(e) => handleTemplateFieldChange('name', e.target.value)}
                            variant="standard"
                            fullWidth
                            sx={{ mb: 1 }}
                            inputProps={{ style: { fontSize: '1.25rem', fontWeight: 'bold' } }}
                          />
                        ) : (
                          <Typography variant="h6">
                            {selectedTemplate?.name}
                          </Typography>
                        )}
                        
                        {isEditingTemplate || isCreatingTemplate ? (
                          <TextField
                            value={editedTemplate.description}
                            onChange={(e) => handleTemplateFieldChange('description', e.target.value)}
                            variant="standard"
                            fullWidth
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {selectedTemplate?.description}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box>
                        {isEditingTemplate || isCreatingTemplate ? (
                          <>
                            <Button 
                              variant="outlined" 
                              color="inherit"
                              onClick={handleCancelTemplateEdit}
                              sx={{ mr: 1 }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="contained" 
                              color="primary"
                              onClick={handleSaveTemplate}
                            >
                              Save Template
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              variant="outlined" 
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={handleDeleteTemplate}
                              sx={{ mr: 1 }}
                              disabled={['admin', 'manager', 'user'].includes(selectedTemplate?.id || '')}
                            >
                              Delete
                            </Button>
                            <Button 
                              variant="contained" 
                              color="primary"
                              startIcon={<EditIcon />}
                              onClick={handleEditTemplate}
                              disabled={['admin', 'manager', 'user'].includes(selectedTemplate?.id || '')}
                            >
                              Edit Template
                            </Button>
                          </>
                        )}
                      </Box>
                    </Box>
                    
                    <Divider sx={{ mb: 3 }} />
                    
                    <Grid container spacing={3}>
                      {/* Page Permissions */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                          Page Access
                        </Typography>
                        
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Page</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Access</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {availablePages.map((page) => (
                                <TableRow key={page.id}>
                                  <TableCell>{page.name}</TableCell>
                                  <TableCell>{page.description}</TableCell>
                                  <TableCell align="right">
                                    <Switch
                                      checked={!!editedTemplate.permissions.pages?.[page.id]}
                                      onChange={(e) => handleTemplatePermissionChange('pages', page.id, e.target.checked)}
                                      disabled={!isEditingTemplate && !isCreatingTemplate}
                                      color="primary"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                      
                      {/* Feature Permissions */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                          Feature Access
                        </Typography>
                        
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Feature</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Access</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {availableFeatures.map((feature) => (
                                <TableRow key={feature.id}>
                                  <TableCell>{feature.name}</TableCell>
                                  <TableCell>{feature.description}</TableCell>
                                  <TableCell align="right">
                                    <Switch
                                      checked={!!editedTemplate.permissions.features?.[feature.id]}
                                      onChange={(e) => handleTemplatePermissionChange('features', feature.id, e.target.checked)}
                                      disabled={!isEditingTemplate && !isCreatingTemplate}
                                      color="primary"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    </Grid>
                    
                    {['admin', 'manager', 'user'].includes(selectedTemplate?.id || '') && !isCreatingTemplate && (
                      <Alert severity="info" sx={{ mt: 3 }}>
                        This is a system default template and cannot be modified or deleted.
                      </Alert>
                    )}
                  </>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center',
                    py: 8
                  }}>
                    <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.7 }} />
                    <Typography variant="h6" color="text.secondary">
                      Select a template or create a new one
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Templates make it easy to apply consistent permissions to multiple users
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleCreateTemplate}
                      sx={{ mt: 3 }}
                    >
                      Create New Template
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </DashboardLayout>
  );
}