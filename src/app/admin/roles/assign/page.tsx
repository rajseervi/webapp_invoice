"use client"
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Define interfaces
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: any;
  updatedAt: any;
}

interface User {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
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
      id={`role-tabpanel-${index}`}
      aria-labelledby={`role-tab-${index}`}
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

export default function RoleAssignmentPage() {
  const router = useRouter();
  const { userRole } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [bulkAssignRole, setBulkAssignRole] = useState('');
  
  // Check if user has admin role
  useEffect(() => {
    if (userRole !== 'admin') {
      router.push('/unauthorized');
    }
  }, [userRole, router]);

  // Fetch roles and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch roles
        const rolesRef = collection(db, 'roles');
        const rolesSnapshot = await getDocs(rolesRef);
        const rolesList = rolesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Role[];
        
        setRoles(rolesList);
        
        // Fetch users
        const usersRef = collection(db, 'users');
        const usersQuery = query(usersRef, orderBy('createdAt', 'desc'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersList = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.firstName && data.lastName 
              ? `${data.firstName} ${data.lastName}`
              : data.name || data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: data.role || 'user',
            status: data.status || 'active',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
        }) as User[];
        
        setUsers(usersList);
        setFilteredUsers(usersList);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter users when search query or filters change
  useEffect(() => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [searchQuery, statusFilter, roleFilter, users]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    // Reset selected users when changing roles
    setSelectedUsers([]);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAllUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleOpenConfirmDialog = () => {
    if (selectedRole && selectedUsers.length > 0) {
      setConfirmDialogOpen(true);
    } else {
      setError('Please select a role and at least one user');
    }
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };

  const handleOpenBulkAssignDialog = () => {
    if (selectedUsers.length > 0) {
      setBulkAssignDialogOpen(true);
    } else {
      setError('Please select at least one user');
    }
  };

  const handleCloseBulkAssignDialog = () => {
    setBulkAssignDialogOpen(false);
  };

  const handleAssignRole = async () => {
    if (!selectedRole || selectedUsers.length === 0) return;
    
    try {
      setLoading(true);
      
      // Update each selected user
      for (const userId of selectedUsers) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          role: selectedRole.id,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Update local state
      setUsers(users.map(user => 
        selectedUsers.includes(user.id)
          ? { ...user, role: selectedRole.id, updatedAt: new Date().toISOString() }
          : user
      ));
      
      setSuccess(`Successfully assigned role "${selectedRole.name}" to ${selectedUsers.length} user(s)`);
      setSelectedUsers([]);
      setConfirmDialogOpen(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      console.error('Error assigning role:', err);
      setError('Failed to assign role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssignRole = async () => {
    if (!bulkAssignRole || selectedUsers.length === 0) return;
    
    try {
      setLoading(true);
      
      // Update each selected user
      for (const userId of selectedUsers) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          role: bulkAssignRole,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Update local state
      setUsers(users.map(user => 
        selectedUsers.includes(user.id)
          ? { ...user, role: bulkAssignRole, updatedAt: new Date().toISOString() }
          : user
      ));
      
      const roleName = roles.find(r => r.id === bulkAssignRole)?.name || bulkAssignRole;
      setSuccess(`Successfully assigned role "${roleName}" to ${selectedUsers.length} user(s)`);
      setSelectedUsers([]);
      setBulkAssignDialogOpen(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: any) {
      console.error('Error assigning role:', err);
      setError('Failed to assign role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleChipColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'staff':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : roleId;
  };

  if (loading && users.length === 0) {
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
            Loading role assignment...
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Role Assignment
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Assign roles to users and manage role assignments
            </Typography>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={<ArrowForwardIcon />}
              onClick={() => router.push('/admin/roles')}
              sx={{ mr: 2 }}
            >
              Manage Roles
            </Button>
            <Button
              variant="contained"
              startIcon={<SecurityIcon />}
              onClick={handleOpenBulkAssignDialog}
              disabled={selectedUsers.length === 0}
            >
              Bulk Assign Role
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="role assignment tabs">
            <Tab label="By User" id="role-tab-0" aria-controls="role-tabpanel-0" />
            <Tab label="By Role" id="role-tab-1" aria-controls="role-tabpanel-1" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Paper sx={{ mb: 4, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Users
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  placeholder="Search users..."
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 250 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="role-filter-label">Role</InputLabel>
                  <Select
                    labelId="role-filter-label"
                    value={roleFilter}
                    label="Role"
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length}
                        checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                        onChange={(e) => handleSelectAllUsers(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Current Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow 
                        key={user.id}
                        selected={selectedUsers.includes(user.id)}
                        hover
                        onClick={() => handleUserSelect(user.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserSelect(user.id);
                            }}
                          />
                        </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={getRoleName(user.role)}
                            color={getRoleChipColor(user.role) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.status}
                            color={getStatusChipColor(user.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {selectedUsers.length > 0 && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  {selectedUsers.length} user(s) selected
                </Typography>
                <Box>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => setSelectedUsers([])}
                    sx={{ mr: 2 }}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SecurityIcon />}
                    onClick={handleOpenBulkAssignDialog}
                  >
                    Assign Role
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Available Roles
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {roles.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No roles found
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {roles.map((role) => (
                      <Card 
                        key={role.id} 
                        variant="outlined"
                        sx={{ 
                          cursor: 'pointer',
                          bgcolor: selectedRole?.id === role.id ? 'action.selected' : 'background.paper',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: 1
                          }
                        }}
                        onClick={() => handleRoleSelect(role)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" component="div">
                              {role.name}
                            </Typography>
                            <Chip 
                              label={users.filter(u => u.role === role.id).length} 
                              color="primary" 
                              size="small"
                              title="Number of users with this role"
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {role.description}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/roles?edit=${role.id}`);
                            }}
                          >
                            Edit Role
                          </Button>
                          <Button 
                            size="small" 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRoleSelect(role);
                            }}
                          >
                            Select
                          </Button>
                        </CardActions>
                      </Card>
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                {selectedRole ? (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box>
                        <Typography variant="h6">
                          Users with role: {selectedRole.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {users.filter(u => u.role === selectedRole.id).length} user(s)
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        onClick={handleOpenConfirmDialog}
                        disabled={selectedUsers.length === 0}
                      >
                        Assign to Selected
                      </Button>
                    </Box>
                    
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox">
                              <Checkbox
                                indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length}
                                checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                                onChange={(e) => handleSelectAllUsers(e.target.checked)}
                              />
                            </TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Current Role</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                No users found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredUsers.map((user) => (
                              <TableRow 
                                key={user.id}
                                selected={selectedUsers.includes(user.id)}
                                hover
                                onClick={() => handleUserSelect(user.id)}
                                sx={{ 
                                  cursor: 'pointer',
                                  bgcolor: user.role === selectedRole.id ? 'action.hover' : 'inherit'
                                }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUserSelect(user.id);
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={getRoleName(user.role)}
                                    color={getRoleChipColor(user.role) as any}
                                    size="small"
                                    icon={user.role === selectedRole.id ? <CheckIcon /> : undefined}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={user.status}
                                    color={getStatusChipColor(user.status) as any}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    py: 8
                  }}>
                    <SecurityIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Role Selected
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400, mb: 3 }}>
                      Please select a role from the list to view and manage users with that role.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Confirm Dialog */}
        <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
          <DialogTitle>
            Confirm Role Assignment
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to assign the role "{selectedRole?.name}" to {selectedUsers.length} selected user(s)?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This will change their current role and permissions.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={handleAssignRole} 
              color="primary" 
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
              disabled={loading}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Bulk Assign Dialog */}
        <Dialog open={bulkAssignDialogOpen} onClose={handleCloseBulkAssignDialog}>
          <DialogTitle>
            Bulk Assign Role
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
              Select a role to assign to {selectedUsers.length} selected user(s):
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="bulk-role-label">Role</InputLabel>
              <Select
                labelId="bulk-role-label"
                value={bulkAssignRole}
                label="Role"
                onChange={(e) => setBulkAssignRole(e.target.value)}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseBulkAssignDialog} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={handleBulkAssignRole} 
              color="primary" 
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading || !bulkAssignRole}
            >
              Assign Role
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}