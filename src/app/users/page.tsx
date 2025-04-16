"use client"
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  CardMembership as CardMembershipIcon
} from '@mui/icons-material';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

// Define interfaces
interface ApprovalStatus {
  isApproved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string | null;
}

interface Subscription {
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  plan: string | null;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  approvalStatus?: ApprovalStatus;
  subscription?: Subscription;
}

export default function UsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openSubscriptionDialog, setOpenSubscriptionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'manager' | 'user',
    status: 'active' as 'active' | 'inactive' | 'pending',
    approvalStatus: {
      isApproved: true,
      approvedBy: null as string | null,
      approvedAt: null as string | null,
      notes: null as string | null
    },
    subscription: {
      isActive: false,
      startDate: null as string | null,
      endDate: null as string | null,
      plan: null as string | null
    }
  });
  
  // Subscription plans
  const subscriptionPlans = [
    { value: 'basic', label: 'Basic' },
    { value: 'premium', label: 'Premium' },
    { value: 'enterprise', label: 'Enterprise' }
  ];

  // Fetch users from Firebase
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        user =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersList);
      setFilteredUsers(usersList);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'user',
      status: 'active',
      approvalStatus: {
        isApproved: true,
        approvedBy: null,
        approvedAt: null,
        notes: null
      },
      subscription: {
        isActive: false,
        startDate: null,
        endDate: null,
        plan: null
      }
    });
    setOpenDialog(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      approvalStatus: user.approvalStatus || {
        isApproved: user.status !== 'pending',
        approvedBy: null,
        approvedAt: null,
        notes: null
      },
      subscription: user.subscription || {
        isActive: false,
        startDate: null,
        endDate: null,
        plan: null
      }
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }
      
      // Get current user email for approval tracking
      const currentUserEmail = currentUser?.email || 'system';
      
      // Prepare user data with approval status
      const userData = {
        ...formData,
        updatedAt: new Date().toISOString()
      };
      
      // If status is changed to active and was previously pending, update approval status
      if (selectedUser && selectedUser.status === 'pending' && formData.status === 'active') {
        userData.approvalStatus = {
          isApproved: true,
          approvedBy: currentUserEmail,
          approvedAt: new Date().toISOString(),
          notes: formData.approvalStatus.notes || 'Approved during user edit'
        };
      }
      
      // If subscription dates are provided, ensure they're valid
      if (formData.subscription.startDate && formData.subscription.endDate) {
        const startDate = new Date(formData.subscription.startDate);
        const endDate = new Date(formData.subscription.endDate);
        
        if (endDate <= startDate) {
          setError('Subscription end date must be after start date.');
          setLoading(false);
          return;
        }
        
        // Check if subscription is active based on dates
        const now = new Date();
        userData.subscription.isActive = startDate <= now && endDate > now;
      }

      if (selectedUser) {
        // Update existing user
        const userRef = doc(db, 'users', selectedUser.id);
        await updateDoc(userRef, userData);
        
        // Update local state
        setUsers(users.map(u =>
          u.id === selectedUser.id
            ? { ...u, ...userData }
            : u
        ));
      } else {
        // Check if email already exists
        const emailQuery = query(
          collection(db, 'users'),
          where('email', '==', formData.email)
        );
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          setError('A user with this email already exists.');
          setLoading(false);
          return;
        }

        // Create new user
        const usersCollection = collection(db, 'users');
        const newUserData = {
          ...userData,
          createdAt: new Date().toISOString(),
          // For new users, set approval status based on their initial status
          approvalStatus: formData.status === 'pending' 
            ? { isApproved: false, approvedBy: null, approvedAt: null, notes: null }
            : { isApproved: true, approvedBy: currentUserEmail, approvedAt: new Date().toISOString(), notes: 'Approved at creation' }
        };
        
        const docRef = await addDoc(usersCollection, newUserData);
        
        // Add to local state
        setUsers([...users, {
          id: docRef.id,
          ...newUserData
        } as User]);
      }
      
      setOpenDialog(false);
      setError(null);
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Failed to save user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const userRef = doc(db, 'users', user.id);
      
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setUsers(users.map(u =>
        u.id === user.id
          ? { ...u, status: newStatus, updatedAt: new Date().toISOString() }
          : u
      ));

      setError(null);
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status. Please try again.');
    }
  };
  
  const handleApproveUser = async (user: User) => {
    try {
      setLoading(true);
      const userRef = doc(db, 'users', user.id);
      
      // Get current user email for approval tracking
      const approverEmail = currentUser?.email || 'system';
      
      // Update user document with approval
      await updateDoc(userRef, {
        status: 'active',
        approvalStatus: {
          isApproved: true,
          approvedBy: approverEmail,
          approvedAt: new Date().toISOString(),
          notes: 'Approved by administrator'
        },
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setUsers(users.map(u =>
        u.id === user.id
          ? { 
              ...u, 
              status: 'active', 
              approvalStatus: {
                isApproved: true,
                approvedBy: approverEmail,
                approvedAt: new Date().toISOString(),
                notes: 'Approved by administrator'
              },
              updatedAt: new Date().toISOString() 
            }
          : u
      ));
      
      setError(null);
    } catch (err) {
      console.error('Error approving user:', err);
      setError('Failed to approve user. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateSubscription = async (user: User, subscription: Subscription) => {
    try {
      setLoading(true);
      const userRef = doc(db, 'users', user.id);
      
      // Update user document with subscription
      await updateDoc(userRef, {
        subscription: subscription,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setUsers(users.map(u =>
        u.id === user.id
          ? { 
              ...u, 
              subscription: subscription,
              updatedAt: new Date().toISOString() 
            }
          : u
      ));
      
      setError(null);
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError('Failed to update subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setLoading(true);
        
        // Delete from Firebase
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
        
        // Remove from local state
        setUsers(users.filter(u => u.id !== userId));
        setError(null);
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getRoleChipColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
   <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5">User Management</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {userRole === 'admin' && (
              <Button
                variant="outlined"
                startIcon={<SecurityIcon />}
                onClick={() => router.push('/admin/roles/assign')}
              >
                Assign Roles
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddUser}
            >
              Add User
            </Button>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Subscription</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={getRoleChipColor(user.role) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.status === 'pending' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label="Pending Approval"
                              color="warning"
                              size="small"
                            />
                            <IconButton
                              onClick={() => handleApproveUser(user)}
                              color="success"
                              size="small"
                              title="Approve User"
                            >
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={user.status === 'active'}
                                onChange={() => handleToggleStatus(user)}
                                color="primary"
                              />
                            }
                            label={user.status}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.subscription?.isActive ? (
                          <Box>
                            <Chip
                              label={user.subscription.plan || 'Active'}
                              color="success"
                              size="small"
                              sx={{ mb: 0.5 }}
                            />
                            {user.subscription.endDate && (
                              <Typography variant="caption" display="block">
                                Expires: {new Date(user.subscription.endDate).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Chip
                            label="Inactive"
                            color="default"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleEditUser(user)}
                          size="small"
                          title="Edit User"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            // Open subscription dialog
                            setSelectedUser(user);
                            setFormData({
                              ...formData,
                              subscription: user.subscription || {
                                isActive: false,
                                startDate: null,
                                endDate: null,
                                plan: null
                              }
                            });
                            setOpenSubscriptionDialog(true);
                          }}
                          color="primary"
                          size="small"
                          title="Manage Subscription"
                        >
                          <CardMembershipIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteUser(user.id)}
                          color="error"
                          size="small"
                          title="Delete User"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Add/Edit User Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Name"
                name="name"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleSelectChange}
                  label="Role"
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleSelectChange}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="pending">Pending Approval</MenuItem>
                </Select>
              </FormControl>
              
              {/* Approval Notes (only shown for pending users) */}
              {formData.status === 'pending' && (
                <TextField
                  label="Approval Notes"
                  name="approvalNotes"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.approvalStatus.notes || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      approvalStatus: {
                        ...formData.approvalStatus,
                        notes: e.target.value
                      }
                    });
                  }}
                  placeholder="Add notes about this user's approval status"
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSaveUser}
              variant="contained"
              disabled={loading || !formData.name || !formData.email}
            >
              {loading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Subscription Management Dialog */}
        <Dialog 
          open={openSubscriptionDialog} 
          onClose={() => setOpenSubscriptionDialog(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            Manage Subscription for {selectedUser?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.subscription.isActive}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        subscription: {
                          ...formData.subscription,
                          isActive: e.target.checked
                        }
                      });
                    }}
                    color="primary"
                  />
                }
                label="Subscription Active"
              />
              
              <FormControl fullWidth>
                <InputLabel>Subscription Plan</InputLabel>
                <Select
                  value={formData.subscription.plan || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      subscription: {
                        ...formData.subscription,
                        plan: e.target.value
                      }
                    });
                  }}
                  label="Subscription Plan"
                >
                  <MenuItem value="">None</MenuItem>
                  {subscriptionPlans.map(plan => (
                    <MenuItem key={plan.value} value={plan.value}>
                      {plan.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={formData.subscription.startDate || ''}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    subscription: {
                      ...formData.subscription,
                      startDate: e.target.value
                    }
                  });
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={formData.subscription.endDate || ''}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    subscription: {
                      ...formData.subscription,
                      endDate: e.target.value
                    }
                  });
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSubscriptionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  handleUpdateSubscription(selectedUser, formData.subscription);
                  setOpenSubscriptionDialog(false);
                }
              }}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Subscription'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
   </DashboardLayout>
  );
}