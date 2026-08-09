import {
  Dashboard as DashboardIcon,
  ReceiptLong as ReceiptLongIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  {
    text: 'Sales',
    icon: <ReceiptLongIcon />,
    children: [
      { text: 'Invoices', icon: <ReceiptLongIcon />, path: '/invoices' },
      { text: 'Parties', icon: <PeopleIcon />, path: '/parties' }
    ]
  },
  {
    text: 'Inventory',
    icon: <InventoryIcon />,
    children: [
      { text: 'Products', icon: <InventoryIcon />, path: '/products' },
      { text: 'Categories', icon: <CategoryIcon />, path: '/products/categories' }
    ]
  },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
];

export default navItems;