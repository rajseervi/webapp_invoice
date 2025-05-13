"use client"
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
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
  FormControlLabel,
  Tooltip,
  TablePagination
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/utils/dateUtils'; // Assuming you have this utility
import VpnKeyIcon from '@mui/icons-material/VpnKey'; // Import password icon

// Define interfaces (similar to users/page.tsx but maybe with more admin fields)
interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string; // Combined or fallback
  email: string;
  role: string; // Changed from 'admin' | 'manager' | 'user' to string (to hold Role ID)
  status: 'active' | 'inactive' | 'pending';
  createdAt: Timestamp | string | Date; // Allow Date type as well
  lastLogin?: Timestamp | string | Date; // Allow Date type as well
}

// Define the Role interface (similar to roles/page.tsx)
interface Role {
  id: string;
  name: string;
  // Add other role properties if needed
}

export default function AdminUsersPage() { // Assuming this is the component name
  const { userRole } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form state for editing user role/status
  const [editFormData, setEditFormData] = useState({
    role: '',
    status: 'active' as 'active' | 'inactive' | 'pending',
  });

  // --- State for Change Password Dialog ---
  const [openChangePasswordDialog, setOpenChangePasswordDialog] = useState(false);
  const [userToChangePassword, setUserToChangePassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);
  // --- End State for Change Password Dialog ---
  
  // --- State for Delete User Dialog ---
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // --- End State for Delete User Dialog ---


  // Check if user has admin role
  useEffect(() => {
    if (userRole === null) return; // Wait for role to load
    if (userRole !== 'admin') {
      router.push('/unauthorized'); // Redirect if not admin
    } else {
      // Fetch data only if the user is an admin
      fetchData(); // Ensure fetchData is called here
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, router]); // Dependencies are correct

  // Combined function to fetch users and roles
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Fetch Roles
      const rolesCollection = collection(db, 'roles');
      const rolesSnapshot = await getDocs(rolesCollection);
      const rolesList = rolesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name, // Assuming 'name' field exists
        ...doc.data()
      })) as Role[];
      setAvailableRoles(rolesList);

      // Fetch Users
      const usersCollection = collection(db, 'users');
      const usersQuery = query(usersCollection, orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersList = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.firstName && data.lastName
            ? `${data.firstName} ${data.lastName}`
            : data.name || data.email, // Fallback name
          email: data.email,
          // Ensure role is stored (it should be the role ID)
          role: data.role || '', // Default to empty string if no role
          status: data.status || 'active',
          createdAt: data.createdAt, // Keep as Timestamp or Date
          lastLogin: data.lastLogin,
          ...data // Include other potential fields
        } as User;
      });
      setUsers(usersList);
      // Apply initial filtering after fetching users
      // (Assuming filtering logic is handled correctly, e.g., in a useEffect)
      // For now, just set filteredUsers initially. Proper filtering useEffect is recommended.
      setFilteredUsers(usersList);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch users or roles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      // Set role ID from user data
      role: user.role || '', // Use empty string if role is missing
      status: user.status,
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedUser(null);
  };

  const handleEditInputChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    // Validate if a role is selected
    if (!editFormData.role) {
        setError('Please select a role for the user.');
        return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        // Save the selected role ID
        role: editFormData.role,
        status: editFormData.status,
        updatedAt: Timestamp.now() // Add an updated timestamp
      });
      setSuccess('User updated successfully!');
      handleCloseEditDialog();
      fetchData(); // Refresh the data (users and roles)
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
      setLoading(false); // Keep dialog open on error
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async (userId: string) => {
    // This is now just a helper function to open the dialog
    const user = users.find(u => u.id === userId);
    if (user) {
      handleOpenDeleteDialog(user);
    }
  };
  
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setDeleteLoading(true);
      setError(null);
      setSuccess(null);
      
      const userRef = doc(db, 'users', userToDelete.id);
      await deleteDoc(userRef);
      
      setSuccess('User deleted successfully!');
      handleCloseDeleteDialog();
      fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format Timestamp or Date object
  const formatTimestamp = (timestamp: Timestamp | string | Date | undefined): string => {
    if (!timestamp) return 'N/A';
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return 'Invalid Date';
    }
    return formatDate(date); // Use your existing formatDate utility
  };

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // If the role is not admin and still loading, show loading indicator
  if (userRole !== 'admin' && loading) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </DashboardLayout>
    );
  }

  // If role is loaded and not admin, the redirect should handle it, but we can show an empty state or message
  if (userRole !== 'admin') {
     return (
       <DashboardLayout>
         <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
           {/* Optional: Add an unauthorized message here if needed, though redirect is preferred */}
         </Container>
       </DashboardLayout>
     );
  }

  // Debounce search term to avoid excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Helper function to get role name by ID
  function getRoleNameById(roleId: string) {
    const role = availableRoles.find(r => r.id === roleId);
    return role ? role.name : roleId;
  }

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (debouncedSearchTerm) {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(lowerSearchTerm) ||
        user.email.toLowerCase().includes(lowerSearchTerm)
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
    // Reset to first page when filters change
    setPage(0);
  }, [users, debouncedSearchTerm, statusFilter, roleFilter]);

  // Calculate paginated data
  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Manage Users</Typography>
          <Box>
             <Button
               variant="outlined"
               startIcon={<RefreshIcon />}
               onClick={fetchData}
               disabled={loading}
               sx={{ mr: 1 }}
             >
               Refresh
             </Button>
             <Button
               variant="contained"
               color="primary"
               startIcon={<PersonAddIcon />}
               onClick={() => router.push('/admin/users/new')}
             >
               Add User
             </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
           <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
             <TextField
               placeholder="Search by name or email..."
               variant="outlined"
               size="small"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               InputProps={{
                 startAdornment: (
                   <InputAdornment position="start">
                     <SearchIcon fontSize="small" />
                   </InputAdornment>
                 ),
               }}
               sx={{ flexGrow: 1, minWidth: '250px' }}
             />
             <FormControl size="small" sx={{ minWidth: 120 }}>
               <InputLabel>Status</InputLabel>
               <Select
                 value={statusFilter}
                 label="Status"
                 onChange={(e) => setStatusFilter(e.target.value)}
               >
                 <MenuItem value="all">All Statuses</MenuItem>
                 <MenuItem value="active">Active</MenuItem>
                 <MenuItem value="inactive">Inactive</MenuItem>
                 <MenuItem value="pending">Pending</MenuItem>
               </Select>
             </FormControl>
             <FormControl size="small" sx={{ minWidth: 120 }}>
               <InputLabel>Role</InputLabel>
               <Select
                 value={roleFilter}
                 label="Role"
                 onChange={(e) => setRoleFilter(e.target.value)}
                 disabled={availableRoles.length === 0}
               >
                 <MenuItem value="all">All Roles</MenuItem>
                 {availableRoles.map((role) => (
                   <MenuItem key={role.id} value={role.id}>
                     {role.name}
                   </MenuItem>
                 ))}
               </Select>
             </FormControl>
           </Box>
         </Paper>


        {/* Conditional Rendering for Loading/Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          // Wrap the conditional content in a Fragment
          <>
            {filteredUsers.length === 0 ? (
              // Empty state view
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No users found matching your criteria.
                </Typography>
              </Box>
            ) : (
              // Table view - Wrap table and pagination in a Paper component
              <Paper sx={{ width: '100%', overflow: 'hidden', mt: 3 }}>
                <TableContainer>
                  <Table stickyHeader aria-label="user table">
                    <TableHead>
                      {/* ... Table Headers ... */}
                    </TableHead>
                    <TableBody>
                      {paginatedUsers.map((user) => ( // Assuming pagination logic exists and provides paginatedUsers
                        <TableRow hover role="checkbox" tabIndex={-1} key={user.id}>
                          {/* ... Table Cells for user data ... */}
                           <TableCell>
                             {/* Example: User Name and Email */}
                             <Box sx={{ display: 'flex', alignItems: 'center' }}>
                               <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                 {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                               </Avatar>
                               <Box>
                                 <Typography variant="body2" fontWeight="medium">
                                   {user.name || 'N/A'}
                                 </Typography>
                                 <Typography variant="caption" color="text.secondary">
                                   {user.email}
                                 </Typography>
                               </Box>
                             </Box>
                           </TableCell>
                           <TableCell>
                             {/* Example: Role Chip */}
                             <Chip
                               label={availableRoles.find(r => r.id === user.role)?.name || user.role || 'N/A'}
                               size="small"
                               color={user.role === 'admin' ? 'secondary' : 'default'}
                             />
                           </TableCell>
                           <TableCell>
                             {/* Example: Status Chip */}
                             <Chip
                               label={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                               size="small"
                               color={user.status === 'active' ? 'success' : user.status === 'inactive' ? 'error' : 'warning'}
                             />
                           </TableCell>
                           <TableCell>
                             {/* Example: Last Login */}
                             {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                           </TableCell>
                           <TableCell>
                             {/* Example: Actions */}
                             <Tooltip title="Edit User Role/Status">
                               <IconButton size="small" onClick={() => handleEditUser(user)}>
                                 <EditIcon fontSize="small" />
                               </IconButton>
                             </Tooltip>
                             <Tooltip title="Change Password">
                               <IconButton size="small" onClick={() => handleOpenChangePasswordDialog(user)}>
                                 <VpnKeyIcon fontSize="small" />
                               </IconButton>
                             </Tooltip>
                             <Tooltip title="Delete User">
                               <IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(user)}>
                                 <DeleteIcon fontSize="small" />
                               </IconButton>
                             </Tooltip>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredUsers.length} // Use filteredUsers length for count
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </Paper>
            )}
          </>
        )}

        {/* ... Dialogs (Edit, Delete, Change Password) ... */}

      </Container>
    </DashboardLayout>
  );
}


  // --- Handlers for Change Password Dialog ---
  const handleOpenChangePasswordDialog = (user: User) => {
    setUserToChangePassword(user);
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordError(null);
    setChangePasswordSuccess(null);
    setOpenChangePasswordDialog(true);
  };

  const handleCloseChangePasswordDialog = () => {
    setOpenChangePasswordDialog(false);
    setUserToChangePassword(null); // Clear selected user on close
  };

  const handlePasswordChangeSubmit = async () => {
    setChangePasswordError(null);
    setChangePasswordSuccess(null);

    if (!userToChangePassword) {
      setChangePasswordError("No user selected.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setChangePasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError("Passwords do not match.");
      return;
    }

    try {
      setChangePasswordLoading(true);
      
      console.log(`Simulating password change for user ${userToChangePassword.id}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setChangePasswordSuccess("Password updated successfully!");
      handleCloseChangePasswordDialog();
    } catch (err) {
      console.error("Error changing password:", err);
      setChangePasswordError("Failed to change password. Please try again.");
    } finally {
      setChangePasswordLoading(false);
    }
  }; 
