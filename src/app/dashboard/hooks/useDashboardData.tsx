"use client";
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Define types for dashboard data
export interface DashboardStat {
  name: string;
  value: number;
  change: number;
  color: string;
}

export interface Invoice {
  id: string;
  customer: string;
  customerId: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
}

export interface Customer {
  id: string;
  name: string;
  totalSpent: number;
  ordersCount: number;
}

export interface SalesData {
  name: string;
  sales: number;
  target?: number;
  amount?: number;
  value?: number;
}

// Define context type
interface DashboardDataContextType {
  stats: DashboardStat[];
  recentInvoices: Invoice[];
  lowStockItems: LowStockItem[];
  topCustomers: Customer[];
  monthlySalesData: SalesData[];
  categorySalesData: SalesData[];
  dailySalesData: SalesData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Create context with default values
const DashboardDataContext = createContext<DashboardDataContextType>({
  stats: [],
  recentInvoices: [],
  lowStockItems: [],
  topCustomers: [],
  monthlySalesData: [],
  categorySalesData: [],
  dailySalesData: [],
  loading: false,
  error: null,
  refetch: () => {},
});

// Provider component
export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const dashboardData = useDashboardDataFetcher();
  
  return (
    <DashboardDataContext.Provider value={dashboardData}>
      {children}
    </DashboardDataContext.Provider>
  );
}

// Hook to use the dashboard data context
export function useDashboardData() {
  return useContext(DashboardDataContext);
}

// Internal hook to fetch dashboard data
function useDashboardDataFetcher() {
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<SalesData[]>([]);
  const [categorySalesData, setCategorySalesData] = useState<SalesData[]>([]);
  const [dailySalesData, setDailySalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for stats
      const mockStats = [
        {
          name: "Today's Sales",
          value: 45000,
          change: 12.5,
          color: '#4361ee'
        },
        {
          name: 'Products',
          value: 128,
          change: 3.2,
          color: '#3a0ca3'
        },
        {
          name: 'Invoices',
          value: 56,
          change: 8.4,
          color: '#7209b7'
        },
        {
          name: 'Customers',
          value: 38,
          change: -2.1,
          color: '#f72585'
        }
      ];
      
      // Mock data for recent invoices
      const mockRecentInvoices = [
        {
          id: 'INV-001',
          customer: 'Acme Corporation',
          customerId: 'cust-001',
          amount: 12500,
          date: '2023-05-15',
          status: 'paid' as const
        },
        {
          id: 'INV-002',
          customer: 'Globex Industries',
          customerId: 'cust-002',
          amount: 8750,
          date: '2023-05-12',
          status: 'pending' as const
        },
        {
          id: 'INV-003',
          customer: 'Stark Enterprises',
          customerId: 'cust-003',
          amount: 15000,
          date: '2023-05-10',
          status: 'overdue' as const
        },
        {
          id: 'INV-004',
          customer: 'Wayne Industries',
          customerId: 'cust-004',
          amount: 9200,
          date: '2023-05-08',
          status: 'paid' as const
        },
        {
          id: 'INV-005',
          customer: 'Oscorp',
          customerId: 'cust-005',
          amount: 6800,
          date: '2023-05-05',
          status: 'pending' as const
        }
      ];
      
      // Mock data for low stock items
      const mockLowStockItems = [
        {
          id: 'prod-001',
          name: 'Laptop XPS 15',
          sku: 'LPT-XPS-15',
          currentStock: 5,
          minStock: 10
        },
        {
          id: 'prod-002',
          name: 'Wireless Mouse',
          sku: 'ACC-MS-001',
          currentStock: 8,
          minStock: 20
        },
        {
          id: 'prod-003',
          name: 'USB-C Dock',
          sku: 'ACC-DK-001',
          currentStock: 3,
          minStock: 15
        },
        {
          id: 'prod-004',
          name: 'Monitor 27"',
          sku: 'MON-27-001',
          currentStock: 2,
          minStock: 8
        },
        {
          id: 'prod-005',
          name: 'Mechanical Keyboard',
          sku: 'ACC-KB-001',
          currentStock: 4,
          minStock: 12
        }
      ];
      
      // Mock data for top customers
      const mockTopCustomers = [
        {
          id: 'cust-001',
          name: 'Acme Corporation',
          totalSpent: 45000,
          ordersCount: 12
        },
        {
          id: 'cust-002',
          name: 'Globex Industries',
          totalSpent: 38500,
          ordersCount: 10
        },
        {
          id: 'cust-003',
          name: 'Stark Enterprises',
          totalSpent: 32000,
          ordersCount: 8
        },
        {
          id: 'cust-004',
          name: 'Wayne Industries',
          totalSpent: 28500,
          ordersCount: 7
        },
        {
          id: 'cust-005',
          name: 'Oscorp',
          totalSpent: 25000,
          ordersCount: 6
        }
      ];
      
      // Mock data for monthly sales
      const mockMonthlySalesData = [
        {
          name: 'Jan',
          sales: 120000,
          target: 100000
        },
        {
          name: 'Feb',
          sales: 135000,
          target: 120000
        },
        {
          name: 'Mar',
          sales: 115000,
          target: 130000
        },
        {
          name: 'Apr',
          sales: 150000,
          target: 140000
        },
        {
          name: 'May',
          sales: 180000,
          target: 160000
        },
        {
          name: 'Jun',
          sales: 170000,
          target: 180000
        }
      ];
      
      // Mock data for category sales
      const mockCategorySalesData = [
        { name: 'Electronics', value: 35 },
        { name: 'Furniture', value: 25 },
        { name: 'Clothing', value: 20 },
        { name: 'Books', value: 10 },
        { name: 'Others', value: 10 }
      ];
      
      // Mock data for daily sales
      const mockDailySalesData = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Format date as DD/MM
        const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
        
        // Generate random sales amount with a slight upward trend
        const baseAmount = 10000 + (i * 100);
        const randomFactor = 0.8 + Math.random() * 0.4; // Random factor between 0.8 and 1.2
        const amount = Math.round(baseAmount * randomFactor);
        
        mockDailySalesData.push({
          name: formattedDate,
          amount
        });
      }
      
      // Set state with mock data
      setStats(mockStats);
      setRecentInvoices(mockRecentInvoices);
      setLowStockItems(mockLowStockItems);
      setTopCustomers(mockTopCustomers);
      setMonthlySalesData(mockMonthlySalesData);
      setCategorySalesData(mockCategorySalesData);
      setDailySalesData(mockDailySalesData);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  return {
    stats,
    recentInvoices,
    lowStockItems,
    topCustomers,
    monthlySalesData,
    categorySalesData,
    dailySalesData,
    loading,
    error,
    refetch: fetchDashboardData
  };
}