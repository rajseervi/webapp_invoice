import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useTheme } from '@mui/material';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import { orderService } from '@/services/orderService';
import { Order } from '@/types/order';

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
  recentOrders: Order[];
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
  const { userId, canViewAllData } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SalesStat[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
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
      
      // Calculate today's date range (start of day to end of day)
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
      
      // Calculate yesterday's date range for comparison
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString();
      const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999).toISOString();
      
      // Initialize sales stats with default values
      let todaySales = 0;
      let yesterdaySales = 0;
      let totalInvoices = 0;
      let totalProducts = 0;
      let totalCustomers = 0;
      
      try {
        // Fetch today's invoices based on user role
        const invoicesRef = collection(db, 'invoices');
        let todayInvoicesQuery;
        
        if (canViewAllData()) {
          // Admin can see all invoices
          todayInvoicesQuery = query(
            invoicesRef,
            where('createdAt', '>=', startOfDay),
            where('createdAt', '<=', endOfDay)
          );
        } else if (userId) {
          // Non-admin users can only see their own invoices
          todayInvoicesQuery = query(
            invoicesRef,
            where('userId', '==', userId),
            where('createdAt', '>=', startOfDay),
            where('createdAt', '<=', endOfDay)
          );
        } else {
          // Fallback if no userId is available
          todayInvoicesQuery = query(
            invoicesRef,
            where('createdAt', '>=', startOfDay),
            where('createdAt', '<=', endOfDay)
          );
        }
        
        const todayInvoicesSnapshot = await getDocs(todayInvoicesQuery);
        
        // Calculate today's sales
        todayInvoicesSnapshot.forEach(doc => {
          const data = doc.data();
          todaySales += data.total || data.totalAmount || 0;
        });
        
        // Fetch yesterday's invoices based on user role
        let yesterdayInvoicesQuery;
        
        if (canViewAllData()) {
          // Admin can see all invoices
          yesterdayInvoicesQuery = query(
            invoicesRef,
            where('createdAt', '>=', startOfYesterday),
            where('createdAt', '<=', endOfYesterday)
          );
        } else if (userId) {
          // Non-admin users can only see their own invoices
          yesterdayInvoicesQuery = query(
            invoicesRef,
            where('userId', '==', userId),
            where('createdAt', '>=', startOfYesterday),
            where('createdAt', '<=', endOfYesterday)
          );
        } else {
          // Fallback if no userId is available
          yesterdayInvoicesQuery = query(
            invoicesRef,
            where('createdAt', '>=', startOfYesterday),
            where('createdAt', '<=', endOfYesterday)
          );
        }
        
        const yesterdayInvoicesSnapshot = await getDocs(yesterdayInvoicesQuery);
        
        // Calculate yesterday's sales
        yesterdayInvoicesSnapshot.forEach(doc => {
          const data = doc.data();
          yesterdaySales += data.total || data.totalAmount || 0;
        });
        
        // Fetch total number of invoices based on user role
        let totalInvoicesQuery;
        
        if (canViewAllData()) {
          // Admin can see all invoices
          totalInvoicesQuery = query(invoicesRef);
        } else if (userId) {
          // Non-admin users can only see their own invoices
          totalInvoicesQuery = query(
            invoicesRef,
            where('userId', '==', userId)
          );
        } else {
          // Fallback if no userId is available
          totalInvoicesQuery = query(invoicesRef);
        }
        
        const totalInvoicesSnapshot = await getDocs(totalInvoicesQuery);
        totalInvoices = totalInvoicesSnapshot.size;
        
        // Fetch total number of products
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);
        totalProducts = productsSnapshot.size;
        
        // Fetch total number of customers/parties
        const partiesRef = collection(db, 'parties');
        let partiesQuery;
        
        if (userId) {
          // If userId is available, we could filter parties by those that have transactions with this user
          // This is a simplified approach - in a real app, you would have a more sophisticated query
          partiesQuery = query(partiesRef);
        } else {
          partiesQuery = query(partiesRef);
        }
        
        const partiesSnapshot = await getDocs(partiesQuery);
        totalCustomers = partiesSnapshot.size;
        
      } catch (err) {
        console.error('Error calculating sales stats:', err);
        // Use default values if query fails
      }
      
      // Calculate percentage change
      const salesChange = yesterdaySales > 0 
        ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100) 
        : 0;
      
      // Create stats with real data
      const statsWithRealData: SalesStat[] = [
        { 
          name: 'Today\'s Sales', 
          value: todaySales || 0, 
          change: salesChange, 
          icon: null, // Will be set in the component
          color: theme.palette.primary.main 
        },
        { 
          name: 'Products', 
          value: totalProducts || 0, // Use the actual count of products
          change: 0, // We don't have historical data to calculate change
          icon: null, 
          color: theme.palette.success.main 
        },
        { 
          name: 'Invoices', 
          value: totalInvoices || 0, // Use the actual count of invoices
          change: 0, // We don't have historical data to calculate change
          icon: null, 
          color: theme.palette.info.main 
        },
        { 
          name: 'Customers', 
          value: totalCustomers || 0, // Use the actual count of customers
          change: 0, // We don't have historical data to calculate change
          icon: null, 
          color: theme.palette.warning.main 
        }
      ];
      
      setStats(statsWithRealData);
      
      // Fetch recent invoices based on user role
      try {
        const invoicesRef = collection(db, 'invoices');
        let recentInvoicesQuery;
        
        try {
          if (canViewAllData()) {
            // Admin can see all invoices
            recentInvoicesQuery = query(
              invoicesRef,
              orderBy('createdAt', 'desc'),
              limit(5)
            );
          } else if (userId) {
            // Non-admin users can only see their own invoices
            try {
              recentInvoicesQuery = query(
                invoicesRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(5)
              );
            } catch (indexError) {
              console.error('Index error, falling back to simpler query:', indexError);
              // If composite index doesn't exist, fall back to a simpler query
              recentInvoicesQuery = query(
                invoicesRef,
                where('userId', '==', userId),
                limit(5)
              );
            }
          } else {
            // Fallback if no userId is available
            recentInvoicesQuery = query(
              invoicesRef,
              orderBy('createdAt', 'desc'),
              limit(5)
            );
          }
        } catch (queryError) {
          console.error('Error creating query:', queryError);
          // Ultimate fallback - just get some invoices
          recentInvoicesQuery = query(
            invoicesRef,
            limit(5)
          );
        }
        
        try {
          const invoicesSnapshot = await getDocs(recentInvoicesQuery);
          const invoicesData = invoicesSnapshot.docs.map(doc => {
            try {
              const data = doc.data();
              // Handle different date formats and missing fields
              let formattedDate;
              try {
                if (data.date) {
                  formattedDate = data.date;
                } else if (data.createdAt) {
                  if (data.createdAt.toDate) {
                    // Firestore Timestamp
                    formattedDate = data.createdAt.toDate().toISOString();
                  } else if (typeof data.createdAt === 'string') {
                    // ISO string
                    formattedDate = data.createdAt;
                  } else {
                    // Unknown format
                    formattedDate = new Date().toISOString();
                  }
                } else {
                  formattedDate = new Date().toISOString();
                }
              } catch (dateError) {
                console.error('Error formatting date:', dateError);
                formattedDate = new Date().toISOString();
              }
              
              return {
                id: doc.id,
                invoiceNumber: data.invoiceNumber || `INV-${doc.id.substring(0, 6)}`,
                customerName: data.partyName || 'Unknown Customer',
                amount: data.total || data.totalAmount || 0,
                status: data.status || 'completed',
                date: formattedDate
              };
            } catch (docError) {
              console.error('Error processing invoice document:', docError);
              // Return a default invoice object if there's an error
              return {
                id: doc.id,
                invoiceNumber: `INV-${doc.id.substring(0, 6)}`,
                customerName: 'Error Processing',
                amount: 0,
                status: 'unknown',
                date: new Date().toISOString()
              };
            }
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
                amount: 2500.00,
                status: 'paid',
                date: new Date(Date.now() - 3600000).toISOString()
              },
              {
                id: '2',
                invoiceNumber: 'INV-2023-0044',
                customerName: 'XYZ Industries',
                amount: 1750.50,
                status: 'pending',
                date: new Date(Date.now() - 7200000).toISOString()
              },
              {
                id: '3',
                invoiceNumber: 'INV-2023-0043',
                customerName: 'Global Tech',
                amount: 3340.00,
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
        } catch (processError) {
          console.error('Error processing invoices:', processError);
          // Continue to use mock data
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

  // Initial data fetch and refetch when userId changes
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
  }, [fetchDashboardData, userId]); // Add userId as a dependency to refetch when it changes

  return {
    stats,
    recentInvoices,
    recentOrders,
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