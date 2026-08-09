'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { ROLE_PERMISSIONS, PERMISSION_DEFINITIONS, UserRole } from '@/types/permissions';

const roles: UserRole[] = ['admin', 'manager', 'accountant', 'viewer', 'user'];

const roleDescriptions: Record<UserRole, string> = {
  admin: 'Full system access with all permissions',
  manager: 'Can manage invoices, products, and view reports',
  accountant: 'Access to accounting and financial data',
  viewer: 'Read-only access to all data',
  user: 'Limited access to own data',
};

export default function RoleOverviewPanel() {
  const getPermissionCategory = (permissionId: string) => {
    return PERMISSION_DEFINITIONS.find((p) => p.id === permissionId)?.category || 'other';
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {/* Role Cards */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            User Roles
          </Typography>
          <Grid container spacing={2}>
            {roles.map((role) => (
              <Grid item xs={12} sm={6} md={4} key={role}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1, textTransform: 'capitalize' }}>
                      {role}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {roleDescriptions[role]}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {ROLE_PERMISSIONS[role]?.slice(0, 3).map((perm) => (
                        <Chip key={perm} label={perm} size="small" variant="outlined" />
                      ))}
                      {(ROLE_PERMISSIONS[role]?.length || 0) > 3 && (
                        <Chip
                          label={`+${(ROLE_PERMISSIONS[role]?.length || 0) - 3} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Detailed Permissions Table */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Permissions by Role"
              subheader="Detailed view of all permissions assigned to each role"
            />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Permission</TableCell>
                      <TableCell align="center">Admin</TableCell>
                      <TableCell align="center">Manager</TableCell>
                      <TableCell align="center">Accountant</TableCell>
                      <TableCell align="center">Viewer</TableCell>
                      <TableCell align="center">User</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {PERMISSION_DEFINITIONS.map((permission) => (
                      <TableRow key={permission.id} hover>
                        <TableCell>
                          <Stack>
                            <Typography variant="body2" fontWeight={500}>
                              {permission.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {permission.description}
                            </Typography>
                          </Stack>
                        </TableCell>
                        {roles.map((role) => (
                          <TableCell key={`${permission.id}-${role}`} align="center">
                            {ROLE_PERMISSIONS[role]?.includes(permission.id) ? (
                              <Chip
                                label="✓"
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.disabled">
                                -
                              </Typography>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Permissions by Category */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Permissions by Category
          </Typography>
          <Grid container spacing={2}>
            {['invoices', 'products', 'customers', 'accounting', 'reports', 'settings', 'admin'].map(
              (category) => {
                const categoryPermissions = PERMISSION_DEFINITIONS.filter(
                  (p) => p.category === category
                );
                return (
                  <Grid item xs={12} sm={6} md={4} key={category}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="h6"
                          sx={{ mb: 1, textTransform: 'capitalize', fontSize: '1rem' }}
                        >
                          {category}
                        </Typography>
                        <Stack spacing={1}>
                          {categoryPermissions.map((perm) => (
                            <Box
                              key={perm.id}
                              sx={{
                                p: 1,
                                backgroundColor: '#f5f5f5',
                                borderRadius: 1,
                              }}
                            >
                              <Typography variant="caption" fontWeight={500}>
                                {perm.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {perm.description}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              }
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
