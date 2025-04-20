import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useTheme } from '@mui/material';

// Define interfaces
interface SalesStat {
  name: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  date: string;
}

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  category: string;
}

interface TopCustomer {
  id: string;
  name: string;
  totalPurchases: number;
  lastPurchase: string;
}

interface MonthlySales {
  name: string;
  sales: number;
  target: number;
}

interface CategorySales {
  name: string;
  value: number;
}

interface DailySales {
  date: string;
  amount: number;
}

interface DashboardData {
  stats: SalesStat[];
  recentInvoices: RecentInvoice[];
  lowStockItems: LowStockItem[];
  topCustomers: TopCustomer[];
  monthlySalesData: MonthlySales[];
  categorySalesData: CategorySales[];
  dailySalesData: DailySales[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboardData = (): DashboardData => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SalesStat[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlySales[]>([]);
  const [categorySalesData, setCategorySalesData] = useState<CategorySales[]>([]);
  const [dailySalesData, setDailySalesData] = useState<DailySales[]>([]);

  // Generate mock data for charts
  const generateChartData = useCallback(() => {
    // Generate monthly sales data for chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    const monthlySales = months.map((month, index) => {
      // Generate realistic sales data with an upward trend and seasonal variations
      const baseSales = 5000 + (index * 500); // Base increasing trend
      const seasonalFactor = 1 + 0.3 * Math.sin((index / 12) * 2 * Math.PI); // Seasonal variation
      const randomFactor = 0.8 + (Math.random() * 0.4); // Random variation between 0.8 and 1.2
      
      const sales = Math.round(baseSales * seasonalFactor * randomFactor);
      const target = Math.round(sales * (1 + (Math.random() * 0.3))); // Target is 0-30% higher than actual
      
      return {
        name: month,
        sales: sales,
        target: target
      };
    });
    
    // Only show the last 6 months
    const lastSixMonths = [];
    for (let i = 0; i < 6; i++) {
      const monthIndex = (currentMonth - 5 + i + 12) % 12; // Ensure positive index
      lastSixMonths.push(monthlySales[monthIndex]);
    }
    
    setMonthlySalesData(lastSixMonths);
    
    // Generate category sales data for pie chart
    const categories = [
      { name: 'Electronics', value: 35 },
      { name: 'Clothing', value: 25 },
      { name: 'Food', value: 20 },
      { name: 'Books', value: 10 },
      { name: 'Others', value: 10 }
    ];
    setCategorySalesData(categories);
    
    // Generate daily sales data for area chart
    const dailySales = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate sales with weekly pattern (weekends have higher sales)
      const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const baseSales = isWeekend ? 2000 : 1000;
      const randomFactor = 0.7 + (Math.random() * 0.6); // Random variation
      
      dailySales.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: Math.round(baseSales * randomFactor)
      });
    }
    
    setDailySalesData(dailySales);
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch sales stats
      const mockStats: SalesStat[] = [
        { 
          name: 'Today\'s Sales', 
          value: 4250, 
          change: 12, 
          icon: null, // Will be set in the component
          color: theme.palette.primary.main 
        },
        { 
          name: 'Products', 
          value: 156, 
          change: 8, 
          icon: null, 
          color: theme.palette.success.main 
        },
        { 
          name: 'Invoices', 
          value: 89, 
          change: 23, 
          icon: null, 
          color: theme.palette.info.main 
        },
        { 
          name: 'Customers', 
          value: 42, 
          change: 15, 
          icon: null, 
          color: theme.palette.warning.main 
        }
      ];
      setStats(mockStats);
      
      // Fetch recent invoices
      try {
        const invoicesRef = collection(db, 'invoices');
        const recentInvoicesQuery = query(
          invoicesRef,
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const invoicesSnapshot = await getDocs(recentInvoicesQuery);
        const invoicesData = invoicesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            invoiceNumber: data.invoiceNumber,
            customerName: data.partyName,
            amount: data.total || 0,
            status: 'completed',
            date: data.date || data.createdAt
          };
        });
        
        if (invoicesData.length > 0) {
          setRecentInvoices(invoicesData);
        } else {
          // Use mock data if no invoices found
          setRecentInvoices([
            {
              id: '1',
              invoiceNumber: 'INV-2023-0045',
              customerName: 'Acme Corp',
              amount: 1250.00,
              status: 'paid',
              date: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: '2',
              invoiceNumber: 'INV-2023-0044',
              customerName: 'XYZ Industries',
              amount: 875.50,
              status: 'pending',
              date: new Date(Date.now() - 7200000).toISOString()
            },
            {
              id: '3',
              invoiceNumber: 'INV-2023-0043',
              customerName: 'Global Tech',
              amount: 2340.00,
              status: 'paid',
              date: new Date(Date.now() - 10800000).toISOString()
            },
            {
              id: '4',
              invoiceNumber: 'INV-2023-0042',
              customerName: 'Local Business',
              amount: 450.75,
              status: 'overdue',
              date: new Date(Date.now() - 14400000).toISOString()
            },
            {
              id: '5',
              invoiceNumber: 'INV-2023-0041',
              customerName: 'Tech Solutions',
              amount: 1875.25,
              status: 'paid',
              date: new Date(Date.now() - 18000000).toISOString()
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching invoices:', err);
        // Use mock data if Firestore query fails
        setRecentInvoices([
          {
            id: '1',
            invoiceNumber: 'INV-2023-0045',
            customerName: 'Acme Corp',
            amount: 1250.00,
            status: 'paid',
            date: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '2',
            invoiceNumber: 'INV-2023-0044',
            customerName: 'XYZ Industries',
            amount: 875.50,
            status: 'pending',
            date: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: '3',
            invoiceNumber: 'INV-2023-0043',
            customerName: 'Global Tech',
            amount: 2340.00,
            status: 'paid',
            date: new Date(Date.now() - 10800000).toISOString()
          },
          {
            id: '4',
            invoiceNumber: 'INV-2023-0042',
            customerName: 'Local Business',
            amount: 450.75,
            status: 'overdue',
            date: new Date(Date.now() - 14400000).toISOString()
          },
          {
            id: '5',
            invoiceNumber: 'INV-2023-0041',
            customerName: 'Tech Solutions',
            amount: 1875.25,
            status: 'paid',
            date: new Date(Date.now() - 18000000).toISOString()
          }
        ]);
      }
      
      // Fetch low stock items
      try {
        const productsRef = collection(db, 'products');
        const lowStockQuery = query(
          productsRef,
          where('stock', '<', 10),
          orderBy('stock', 'asc'),
          limit(5)
        );
        
        const lowStockSnapshot = await getDocs(lowStockQuery);
        const lowStockData = lowStockSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            stock: data.stock,
            category: data.category
          };
        });
        setLowStockItems(lowStockData);
      } catch (err) {
        console.error('Error fetching low stock items:', err);
        // Use mock data if Firestore query fails
        setLowStockItems([
          { id: '1', name: 'Laptop XPS 15', stock: 3, category: 'Electronics' },
          { id: '2', name: 'Wireless Mouse', stock: 5, category: 'Accessories' },
          { id: '3', name: 'USB-C Cable', stock: 7, category: 'Accessories' },
          { id: '4', name: 'Bluetooth Speaker', stock: 2, category: 'Electronics' },
          { id: '5', name: 'Mechanical Keyboard', stock: 4, category: 'Accessories' }
        ]);
      }
      
      // Fetch top customers
      try {
        const partiesRef = collection(db, 'parties');
        const partiesSnapshot = await getDocs(partiesRef);
        
        // This is a simplified approach - in a real app, you would calculate
        // top customers based on their total purchases from invoices
        const customersData = partiesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            totalPurchases: Math.floor(Math.random() * 10000) + 1000, // Mock data
            lastPurchase: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString()
          };
        }).sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, 5);
        
        if (customersData.length > 0) {
          setTopCustomers(customersData);
        } else {
          // Use mock data if no customers found
          const mockTopCustomers = [
            {
              id: '1',
              name: 'Acme Corp',
              totalPurchases: 12500.00,
              lastPurchase: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: '2',
              name: 'XYZ Industries',
              totalPurchases: 8750.50,
              lastPurchase: new Date(Date.now() - 172800000).toISOString()
            },
            {
              id: '3',
              name: 'Global Tech',
              totalPurchases: 6340.00,
              lastPurchase: new Date(Date.now() - 259200000).toISOString()
            },
            {
              id: '4',
              name: 'Local Business',
              totalPurchases: 4500.75,
              lastPurchase: new Date(Date.now() - 345600000).toISOString()
            },
            {
              id: '5',
              name: 'Tech Solutions',
              totalPurchases: 3875.25,
              lastPurchase: new Date(Date.now() - 432000000).toISOString()
            }
          ];
          setTopCustomers(mockTopCustomers);
        }
      } catch (err) {
        console.error('Error fetching top customers:', err);
        // Use mock data if Firestore query fails
        const mockTopCustomers = [
          {
            id: '1',
            name: 'Acme Corp',
            totalPurchases: 12500.00,
            lastPurchase: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '2',
            name: 'XYZ Industries',
            totalPurchases: 8750.50,
            lastPurchase: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: '3',
            name: 'Global Tech',
            totalPurchases: 6340.00,
            lastPurchase: new Date(Date.now() - 259200000).toISOString()
          },
          {
            id: '4',
            name: 'Local Business',
            totalPurchases: 4500.75,
            lastPurchase: new Date(Date.now() - 345600000).toISOString()
          },
          {
            id: '5',
            name: 'Tech Solutions',
            totalPurchases: 3875.25,
            lastPurchase: new Date(Date.now() - 432000000).toISOString()
          }
        ];
        setTopCustomers(mockTopCustomers);
      }
      
      // Generate chart data
      generateChartData();
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [theme.palette, generateChartData]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
    
    // Set up cache expiration (30 minutes)
    const cacheTimeout = setTimeout(() => {
      // Clear cached data after timeout
      localStorage.removeItem('dashboardDataTimestamp');
    }, 30 * 60 * 1000);
    
    return () => {
      clearTimeout(cacheTimeout);
    };
  }, [fetchDashboardData]);

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
};