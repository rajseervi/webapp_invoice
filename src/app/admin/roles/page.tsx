"use client"
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
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
  FormControlLabel,
  FormGroup,
  Switch,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material'; 
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Security as SecurityIcon, 
} from '@mui/icons-material';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Define interfaces
interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: any;
  updatedAt: any;
}

interface Module {
  name: string;
  permissions: Permission[];
}

export default function RolesAndPermissionsPage() {
  const router = useRouter();
  const { userRole } = useAuth();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  
  // Check if user has admin role
  useEffect(() => {
    if (userRole !== 'admin') {
      router.push('/unauthorized');
    }
  }, [userRole, router]);

  // Fetch roles and permissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch permissions
        const permissionsRef = collection(db, 'permissions');
        const permissionsSnapshot = await getDocs(permissionsRef);
        const permissionsList = permissionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Permission[];
        
        setPermissions(permissionsList);
        
        // Group permissions by module
        const moduleMap = new Map<string, Permission[]>();
        permissionsList.forEach(permission => {
          if (!moduleMap.has(permission.module)) {
            moduleMap.set(permission.module, []);
          }
          moduleMap.get(permission.module)?.push(permission);
        });
        
        const modulesList: Module[] = [];
        moduleMap.forEach((permissions, name) => {
          modulesList.push({ name, permissions });
        });
        
        setModules(modulesList);
        
        // Fetch roles
        const rolesRef = collection(db, 'roles');
        const rolesSnapshot = await getDocs(rolesRef);
        const rolesList = rolesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Role[];
        
        setRoles(rolesList);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching roles and permissions:', err);
        setError('Failed to fetch roles and permissions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleAddRole = () => {
    setSelectedRole(null);
    setRoleFormData({
      name: '',
      description: '',
      permissions: []
    });
    setOpenRoleDialog(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions || []
    });
    setOpenRoleDialog(true);
  };

  const handleCloseRoleDialog = () => {
    setOpenRoleDialog(false);
  };

  const handleRoleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRoleFormData({
      ...roleFormData,
      [name]: value
    });
  };

  const handlePermissionToggle = (permissionId: string) => {
    setRoleFormData(prev => {
      const permissions = [...prev.permissions];
      const index = permissions.indexOf(permissionId);
      
      if (index === -1) {
        permissions.push(permissionId);
      } else {
        permissions.splice(index, 1);
      }
      
      return {
        ...prev,
        permissions
      };
    });
  };

  const handleModuleToggle = (moduleName: string) => {
    const modulePermissions = modules
      .find(m => m.name === moduleName)
      ?.permissions.map(p => p.id) || [];
    
    const allSelected = modulePermissions.every(id => 
      roleFormData.permissions.includes(id)
    );
    
    if (allSelected) {
      // Remove all permissions for this module
      setRoleFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => 
          !modulePermissions.includes(id)
        )
      }));
    } else {
      // Add all permissions for this module
      setRoleFormData(prev => {
        const newPermissions = [...prev.permissions];
        
        modulePermissions.forEach(id => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id);
          }
        });
        
        return {
          ...prev,
          permissions: newPermissions
        };
      });
    }
  };

  const handleSaveRole = async () => {
    try {
      setLoading(true);
      
      const timestamp = serverTimestamp();
      
      if (selectedRole) {
        // Update existing role
        const roleRef = doc(db, 'roles', selectedRole.id);
        await updateDoc(roleRef, {
          name: roleFormData.name,
          description: roleFormData.description,
          permissions: roleFormData.permissions,
          updatedAt: timestamp
        });
        
        // Update local state
        setRoles(roles.map(role => 
          role.id === selectedRole.id
            ? {
                ...role,
                name: roleFormData.name,
                description: roleFormData.description,
                permissions: roleFormData.permissions,
                updatedAt: new Date().toISOString()
              }
            : role
        ));
      } else {
        // Create new role
        const rolesRef = collection(db, 'roles');
        const docRef = await addDoc(rolesRef, {
          name: roleFormData.name,
          description: roleFormData.description,
          permissions: roleFormData.permissions,
          createdAt: timestamp,
          updatedAt: timestamp
        });
        
        // Add to local state
        setRoles([
          ...roles,
          {
            id: docRef.id,
            name: roleFormData.name,
            description: roleFormData.description,
            permissions: roleFormData.permissions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      }
      
      setOpenRoleDialog(false);
      setError(null);
    } catch (err: any) {
      console.error('Error saving role:', err);
      setError('Failed to save role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        setLoading(true);
        
        // Delete from Firestore
        const roleRef = doc(db, 'roles', roleId);
        await deleteDoc(roleRef);
        
        // Update local state
        setRoles(roles.filter(role => role.id !== roleId));
        
        setError(null);
      } catch (err: any) {
        console.error('Error deleting role:', err);
        setError('Failed to delete role. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Get permission name by ID
  const getPermissionName = (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission ? permission.name : 'Unknown Permission';
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Roles & Permissions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage system roles and their permissions
            </Typography>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={<InfoIcon />}
              onClick={() => router.push('/admin/roles/assign')}
              sx={{ mr: 2 }}
            >
              Assign Roles
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddRole}
            >
              Add Role
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading && roles.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Roles Table */}
            <Paper sx={{ mb: 4, overflow: 'hidden' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Role Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Permissions</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No roles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell>{role.name}</TableCell>
                          <TableCell>{role.description}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {role.permissions && role.permissions.length > 0 ? (
                                role.permissions.slice(0, 3).map((permissionId) => (
                                  <Chip 
                                    key={permissionId} 
                                    label={getPermissionName(permissionId)} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                ))
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No permissions assigned
                                </Typography>
                              )}
                              {role.permissions && role.permissions.length > 3 && (
                                <Chip 
                                  label={`+${role.permissions.length - 3} more`} 
                                  size="small" 
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={() => handleEditRole(role)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => handleDeleteRole(role.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            
            {/* Permissions List */}
            <Typography variant="h5" gutterBottom>
              Available Permissions
            </Typography>
            <Paper sx={{ p: 2 }}>
              {modules.map((module) => (
                <Box key={module.name} sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {module.name}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Permission</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {module.permissions.map((permission) => (
                          <TableRow key={permission.id}>
                            <TableCell>{permission.name}</TableCell>
                            <TableCell>{permission.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))}
            </Paper>
          </>
        )}
        
        {/* Role Dialog */}
        <Dialog open={openRoleDialog} onClose={handleCloseRoleDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedRole ? 'Edit Role' : 'Add New Role'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ p: 1 }}>
              <TextField
                fullWidth
                label="Role Name"
                name="name"
                value={roleFormData.name}
                onChange={handleRoleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={roleFormData.description}
                onChange={handleRoleInputChange}
                margin="normal"
                multiline
                rows={2}
              />
              
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Assign Permissions
              </Typography>
              
              {modules.map((module) => (
                <Box key={module.name} sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={module.permissions.every(p => 
                          roleFormData.permissions.includes(p.id)
                        )}
                        indeterminate={
                          module.permissions.some(p => roleFormData.permissions.includes(p.id)) &&
                          !module.permissions.every(p => roleFormData.permissions.includes(p.id))
                        }
                        onChange={() => handleModuleToggle(module.name)}
                      />
                    }
                    label={
                      <Typography variant="subtitle1">
                        {module.name}
                      </Typography>
                    }
                  />
                  <Box sx={{ ml: 4 }}>
                    <FormGroup>
                      {module.permissions.map((permission) => (
                        <FormControlLabel
                          key={permission.id}
                          control={
                            <Checkbox
                              checked={roleFormData.permissions.includes(permission.id)}
                              onChange={() => handlePermissionToggle(permission.id)}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2">
                                {permission.name}
                              </Typography>
                              <Tooltip title={permission.description}>
                                <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                              </Tooltip>
                            </Box>
                          }
                        />
                      ))}
                    </FormGroup>
                  </Box>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRoleDialog}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleSaveRole}
              disabled={!roleFormData.name.trim()}
            >
              {selectedRole ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}