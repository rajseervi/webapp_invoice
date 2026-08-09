import { useState, useCallback } from 'react';
import { permissionService } from '@/services/permissionService';
import { UserData, UserRole, UserStatus, PERMISSION_DEFINITIONS } from '@/types/permissions';

export function usePermissionManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allUsers = await permissionService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = useCallback(
    async (uid: string, newRole: UserRole) => {
      try {
        setError(null);
        await permissionService.updateUserRole(uid, newRole);
        await permissionService.syncUserPermissionsWithRole(uid);
        await loadUsers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update user role');
      }
    },
    [loadUsers]
  );

  const updateUserStatus = useCallback(
    async (uid: string, status: UserStatus) => {
      try {
        setError(null);
        await permissionService.updateUserStatus(uid, status);
        await loadUsers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update user status');
      }
    },
    [loadUsers]
  );

  const addPermissionToUser = useCallback(
    async (uid: string, permissionId: string) => {
      try {
        setError(null);
        await permissionService.addPermissionToUser(uid, permissionId);
        await loadUsers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add permission');
      }
    },
    [loadUsers]
  );

  const removePermissionFromUser = useCallback(
    async (uid: string, permissionId: string) => {
      try {
        setError(null);
        await permissionService.removePermissionFromUser(uid, permissionId);
        await loadUsers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove permission');
      }
    },
    [loadUsers]
  );

  const bulkUpdateUserRole = useCallback(
    async (userIds: string[], newRole: UserRole) => {
      try {
        setError(null);
        await permissionService.bulkUpdateUserRole(userIds, newRole);
        await loadUsers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to bulk update roles');
      }
    },
    [loadUsers]
  );

  return {
    users,
    loading,
    error,
    loadUsers,
    updateUserRole,
    updateUserStatus,
    addPermissionToUser,
    removePermissionFromUser,
    bulkUpdateUserRole,
    permissionDefinitions: PERMISSION_DEFINITIONS,
  };
}
