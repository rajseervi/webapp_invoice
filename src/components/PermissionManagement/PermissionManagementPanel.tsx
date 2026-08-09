'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Checkbox,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { usePermissionManagement } from '@/hooks/usePermissionManagement';
import { UserRole, UserStatus, ROLE_PERMISSIONS } from '@/types/permissions';

export default function PermissionManagementPanel() {
  const {
    users,
    loading,
    error,
    loadUsers,
    updateUserRole,
    updateUserStatus,
    addPermissionToUser,
    removePermissionFromUser,
    permissionDefinitions,
  } = usePermissionManagement();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openPermissionDialog, setOpenPermissionDialog] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newStatus, setNewStatus] = useState<UserStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    await updateUserRole(userId, role);
  };

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    await updateUserStatus(userId, status);
  };

  const handleOpenDetails = (userId: string) => {
    setSelectedUser(userId);
    const user = users.find((u) => u.uid === userId);
    if (user) {
      setNewRole(user.role);
      setNewStatus(user.status);
    }
    setOpenDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setOpenDetailsDialog(false);
    setSelectedUser(null);
  };

  const handleOpenPermissions = (userId: string) => {
    setSelectedUser(userId);
    setOpenPermissionDialog(true);
  };

  const handleClosePermissions = () => {
    setOpenPermissionDialog(false);
    setSelectedUser(null);
  };

  const handlePermissionToggle = async (permissionId: string, checked: boolean) => {
    if (!selectedUser) return;

    if (checked) {
      await addPermissionToUser(selectedUser, permissionId);
    } else {
      await removePermissionFromUser(selectedUser, permissionId);
    }
  };

  const selectedUserData = users.find((u) => u.uid === selectedUser);
  const userPermissions = selectedUserData?.permissions || {};

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'inactive':
        return 'default';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          title="User Permission Management"
          subheader="Manage user roles, status, and permissions"
          action={
            <Button
              variant="contained"
              onClick={loadUsers}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              Refresh
            </Button>
          }
        />

        <CardContent>
          <TextField
            fullWidth
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
          />

          {loading && users.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Email</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.uid} hover>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.displayName || '-'}</TableCell>
                        <TableCell>
                          <FormControl size="small">
                            <Select
                              value={user.role}
                              onChange={(e) =>
                                handleRoleChange(user.uid, e.target.value as UserRole)
                              }
                            >
                              <MenuItem value="admin">Admin</MenuItem>
                              <MenuItem value="manager">Manager</MenuItem>
                              <MenuItem value="accountant">Accountant</MenuItem>
                              <MenuItem value="viewer">Viewer</MenuItem>
                              <MenuItem value="user">User</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl size="small">
                            <Select
                              value={user.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  user.uid,
                                  e.target.value as UserStatus
                                )
                              }
                            >
                              <MenuItem value="active">Active</MenuItem>
                              <MenuItem value="pending">Pending</MenuItem>
                              <MenuItem value="inactive">Inactive</MenuItem>
                              <MenuItem value="suspended">Suspended</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDetails(user.uid)}
                            title="View details"
                          >
                            <InfoIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenPermissions(user.uid)}
                            title="Manage permissions"
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDetailsDialog} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUserData && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Email"
                value={selectedUserData.email}
                disabled
              />
              <TextField
                fullWidth
                label="Name"
                value={selectedUserData.displayName || '-'}
                disabled
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newRole}
                  label="Role"
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="accountant">Accountant</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newStatus}
                  label="Status"
                  onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="subtitle2">Role Permissions:</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {ROLE_PERMISSIONS[selectedUserData.role]?.map((perm) => (
                  <Chip key={perm} label={perm} size="small" />
                ))}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPermissionDialog} onClose={handleClosePermissions} maxWidth="sm" fullWidth>
        <DialogTitle>Manage User Permissions</DialogTitle>
        <DialogContent>
          {selectedUserData && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Email: {selectedUserData.email}</Typography>
              <Typography variant="subtitle2">Current Role: {selectedUserData.role}</Typography>
              <Typography variant="subtitle2">Custom Permissions:</Typography>

              {permissionDefinitions.map((permission) => (
                <Stack key={permission.id} direction="row" spacing={1} alignItems="flex-start">
                  <Checkbox
                    checked={userPermissions[permission.id] === true}
                    onChange={(e) =>
                      handlePermissionToggle(permission.id, e.target.checked)
                    }
                  />
                  <Stack flex={1}>
                    <Typography variant="body2" fontWeight={500}>
                      {permission.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {permission.description}
                    </Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePermissions}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
