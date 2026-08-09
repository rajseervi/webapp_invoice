export type UserRole = 'admin' | 'manager' | 'accountant' | 'viewer' | 'user';

export type UserStatus = 'active' | 'pending' | 'inactive' | 'suspended';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'invoices' | 'products' | 'customers' | 'accounting' | 'reports' | 'settings' | 'admin';
}

export interface RolePermissions {
  role: UserRole;
  permissions: string[];
}

export interface UserPermissions {
  pages: Record<string, boolean>;
  features: Record<string, boolean>;
}

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  permissions?: UserPermissions;
  subscription?: {
    isActive: boolean;
    startDate?: string;
    endDate?: string;
    plan?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'view_all_invoices',
    'edit_all_invoices',
    'delete_all_invoices',
    'view_all_products',
    'edit_all_products',
    'delete_all_products',
    'view_all_customers',
    'edit_all_customers',
    'delete_all_customers',
    'view_accounting',
    'edit_accounting',
    'view_reports',
    'view_settings',
    'edit_settings',
    'manage_users',
    'manage_roles',
    'manage_permissions',
  ],
  manager: [
    'view_all_invoices',
    'edit_all_invoices',
    'view_all_products',
    'edit_all_products',
    'view_all_customers',
    'edit_all_customers',
    'view_accounting',
    'view_reports',
  ],
  accountant: [
    'view_all_invoices',
    'view_all_products',
    'view_all_customers',
    'view_accounting',
    'edit_accounting',
    'view_reports',
  ],
  viewer: [
    'view_all_invoices',
    'view_all_products',
    'view_all_customers',
    'view_reports',
  ],
  user: [
    'view_own_invoices',
    'view_own_customers',
  ],
};

export const PERMISSION_DEFINITIONS: Permission[] = [
  {
    id: 'view_all_invoices',
    name: 'View All Invoices',
    description: 'View all invoices in the system',
    category: 'invoices',
  },
  {
    id: 'edit_all_invoices',
    name: 'Edit All Invoices',
    description: 'Create, edit, and modify all invoices',
    category: 'invoices',
  },
  {
    id: 'delete_all_invoices',
    name: 'Delete All Invoices',
    description: 'Delete invoices from the system',
    category: 'invoices',
  },
  {
    id: 'view_all_products',
    name: 'View All Products',
    description: 'View all products in inventory',
    category: 'products',
  },
  {
    id: 'edit_all_products',
    name: 'Edit All Products',
    description: 'Create, edit, and modify products',
    category: 'products',
  },
  {
    id: 'delete_all_products',
    name: 'Delete All Products',
    description: 'Delete products from inventory',
    category: 'products',
  },
  {
    id: 'view_all_customers',
    name: 'View All Customers',
    description: 'View all customer/party information',
    category: 'customers',
  },
  {
    id: 'edit_all_customers',
    name: 'Edit All Customers',
    description: 'Create, edit, and modify customer information',
    category: 'customers',
  },
  {
    id: 'delete_all_customers',
    name: 'Delete All Customers',
    description: 'Delete customer records',
    category: 'customers',
  },
  {
    id: 'view_accounting',
    name: 'View Accounting',
    description: 'View accounting journals, ledgers, and statements',
    category: 'accounting',
  },
  {
    id: 'edit_accounting',
    name: 'Edit Accounting',
    description: 'Modify accounting entries and journals',
    category: 'accounting',
  },
  {
    id: 'view_reports',
    name: 'View Reports',
    description: 'Access all reports and analytics',
    category: 'reports',
  },
  {
    id: 'view_settings',
    name: 'View Settings',
    description: 'Access application settings',
    category: 'settings',
  },
  {
    id: 'edit_settings',
    name: 'Edit Settings',
    description: 'Modify application settings',
    category: 'settings',
  },
  {
    id: 'manage_users',
    name: 'Manage Users',
    description: 'Create, edit, and manage user accounts',
    category: 'admin',
  },
  {
    id: 'manage_roles',
    name: 'Manage Roles',
    description: 'Create and modify user roles',
    category: 'admin',
  },
  {
    id: 'manage_permissions',
    name: 'Manage Permissions',
    description: 'Assign and revoke user permissions',
    category: 'admin',
  },
  {
    id: 'view_own_invoices',
    name: 'View Own Invoices',
    description: 'View only own created invoices',
    category: 'invoices',
  },
  {
    id: 'view_own_customers',
    name: 'View Own Customers',
    description: 'View only own added customers',
    category: 'customers',
  },
];
