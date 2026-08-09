import { db } from '@/firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  where,
  QueryConstraint,
} from 'firebase/firestore';
import { UserData, UserRole, UserStatus, ROLE_PERMISSIONS } from '@/types/permissions';

export const permissionService = {
  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? (userDoc.data() as UserData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      throw error;
    }
  },

  async getAllUsers(): Promise<UserData[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      return usersSnapshot.docs.map((doc) => doc.data() as UserData);
    } catch (error) {
      console.error('Failed to get all users:', error);
      throw error;
    }
  },

  async getUsersByRole(role: UserRole): Promise<UserData[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', role) as QueryConstraint
      );
      const usersSnapshot = await getDocs(q);
      return usersSnapshot.docs.map((doc) => doc.data() as UserData);
    } catch (error) {
      console.error('Failed to get users by role:', error);
      throw error;
    }
  },

  async getUsersByStatus(status: UserStatus): Promise<UserData[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('status', '==', status) as QueryConstraint
      );
      const usersSnapshot = await getDocs(q);
      return usersSnapshot.docs.map((doc) => doc.data() as UserData);
    } catch (error) {
      console.error('Failed to get users by status:', error);
      throw error;
    }
  },

  async updateUserRole(uid: string, newRole: UserRole): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  },

  async updateUserStatus(uid: string, status: UserStatus): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update user status:', error);
      throw error;
    }
  },

  async updateUserPermissions(uid: string, permissions: Record<string, boolean>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        permissions,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to update user permissions:', error);
      throw error;
    }
  },

  async bulkUpdateUserRole(userIds: string[], newRole: UserRole): Promise<void> {
    try {
      const promises = userIds.map((uid) => this.updateUserRole(uid, newRole));
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to bulk update user roles:', error);
      throw error;
    }
  },

  async getRolePermissions(role: UserRole): Promise<string[]> {
    return ROLE_PERMISSIONS[role] || [];
  },

  async getUserPermissions(uid: string): Promise<string[]> {
    try {
      const userData = await this.getUserData(uid);
      if (!userData) return [];

      const rolePermissions = ROLE_PERMISSIONS[userData.role] || [];
      const customPermissions = userData.permissions ? Object.keys(userData.permissions).filter((key) => userData.permissions![key]) : [];

      return Array.from(new Set([...rolePermissions, ...customPermissions]));
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      throw error;
    }
  },

  async hasPermission(uid: string, permissionId: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(uid);
      return permissions.includes(permissionId);
    } catch (error) {
      console.error('Failed to check permission:', error);
      return false;
    }
  },

  async assignPermissionToRole(role: UserRole, permissionId: string): Promise<void> {
    try {
      const usersWithRole = await this.getUsersByRole(role);
      const promises = usersWithRole.map((user) =>
        this.addPermissionToUser(user.uid, permissionId)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to assign permission to role:', error);
      throw error;
    }
  },

  async addPermissionToUser(uid: string, permissionId: string): Promise<void> {
    try {
      const userData = await this.getUserData(uid);
      if (!userData) throw new Error('User not found');

      const updatedPermissions = {
        ...userData.permissions,
        [permissionId]: true,
      };

      await this.updateUserPermissions(uid, updatedPermissions);
    } catch (error) {
      console.error('Failed to add permission to user:', error);
      throw error;
    }
  },

  async removePermissionFromUser(uid: string, permissionId: string): Promise<void> {
    try {
      const userData = await this.getUserData(uid);
      if (!userData) throw new Error('User not found');

      const updatedPermissions = { ...userData.permissions };
      delete updatedPermissions[permissionId];

      await this.updateUserPermissions(uid, updatedPermissions);
    } catch (error) {
      console.error('Failed to remove permission from user:', error);
      throw error;
    }
  },

  async syncUserPermissionsWithRole(uid: string): Promise<void> {
    try {
      const userData = await this.getUserData(uid);
      if (!userData) throw new Error('User not found');

      const rolePermissions = ROLE_PERMISSIONS[userData.role] || [];
      const permissionsMap = rolePermissions.reduce(
        (acc, perm) => {
          acc[perm] = true;
          return acc;
        },
        {} as Record<string, boolean>
      );

      await this.updateUserPermissions(uid, permissionsMap);
    } catch (error) {
      console.error('Failed to sync user permissions:', error);
      throw error;
    }
  },
};
