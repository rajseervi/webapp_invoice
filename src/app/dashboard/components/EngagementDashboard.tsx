"use client";
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  Tabs,
  Tab,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  alpha,
  Skeleton,
  CardHeader,
  CardActions,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Add as AddIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  CalendarViewWeek as CalendarViewWeekIcon,
  CalendarViewMonth as CalendarViewMonthIcon,
  CalendarToday as CalendarTodayIcon,
  DateRange as DateRangeIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  BubbleChart as BubbleChartIcon,
  DonutLarge as DonutLargeIcon,
  Visibility as VisibilityIcon,
  TouchApp as TouchAppIcon,
  Timer as TimerIcon,
  Repeat as RepeatIcon,
  ExitToApp as ExitToAppIcon,
  DeviceHub as DeviceHubIcon,
  Public as PublicIcon,
  Devices as DevicesIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Scatter,
  ScatterChart,
  ZAxis,
  Treemap,
  RadialBarChart,
  RadialBar,
} from 'recharts';

// Define interfaces for data types
interface EngagementStat {
  name: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface PageView {
  page: string;
  views: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgTimeOnPage: number;
}

interface UserSource {
  source: string;
  users: number;
  percentage: number;
}

interface DeviceData {
  name: string;
  value: number;
}

interface SessionDuration {
  duration: string;
  sessions: number;
  percentage: number;
}

interface DailyEngagement {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
}

interface UserJourney {
  step: string;
  users: number;
  dropoff: number;
}

interface UserRetention {
  cohort: string;
  week0: number;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
}

interface GeographicData {
  country: string;
  users: number;
  engagementScore: number;
}

// Define color schemes
const COLORS = ['#4361ee', '#3a0ca3', '#4895ef', '#4cc9f0', '#f72585', '#7209b7', '#3f37c9', '#4cc9f0', '#480ca8', '#b5179e'];
const SEQUENTIAL_COLORS = ['#caf0f8', '#90e0ef', '#00b4d8', '#0077b6', '#03045e'];
const DIVERGING_COLORS = ['#d8f3dc', '#95d5b2', '#52b788', '#2d6a4f', '#081c15'];

export default function EngagementDashboard() {
  const theme = useTheme();
  const router = useRouter();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area');
  const [tabValue, setTabValue] = useState(0);
  
  // Data states
  const [engagementStats, setEngagementStats] = useState<EngagementStat[]>([]);
  const [pageViewsData, setPageViewsData] = useState<PageView[]>([]);
  const [userSourceData, setUserSourceData] = useState<UserSource[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [sessionDurationData, setSessionDurationData] = useState<SessionDuration[]>([]);
  const [dailyEngagementData, setDailyEngagementData] = useState<DailyEngagement[]>([]);
  const [userJourneyData, setUserJourneyData] = useState<UserJourney[]>([]);
  const [userRetentionData, setUserRetentionData] = useState<UserRetention[]>([]);
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle time range change
  const handleTimeRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeRange: 'day' | 'week' | 'month' | 'year' | null,
  ) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };
  
  // Handle chart type change
  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: 'line' | 'bar' | 'area' | null,
  ) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate engagement stats
        const mockEngagementStats: EngagementStat[] = [
          { 
            name: 'Page Views', 
            value: 24750, 
            change: 12.5, 
            icon: <VisibilityIcon />, 
            color: theme.palette.primary.main 
          },
          { 
            name: 'Unique Visitors', 
            value: 8320, 
            change: 8.3, 
            icon: <PeopleIcon />, 
            color: theme.palette.success.main 
          },
          { 
            name: 'Avg. Session', 
            value: 3.2, 
            change: -2.1, 
            icon: <TimerIcon />, 
            color: theme.palette.info.main 
          },
          { 
            name: 'Bounce Rate', 
            value: 42.8, 
            change: -5.4, 
            icon: <ExitToAppIcon />, 
            color: theme.palette.warning.main 
          }
        ];
        setEngagementStats(mockEngagementStats);
        
        // Generate page views data
        const mockPageViewsData: PageView[] = [
          { page: '/dashboard', views: 5240, uniqueVisitors: 3120, bounceRate: 32.5, avgTimeOnPage: 4.2 },
          { page: '/products', views: 4180, uniqueVisitors: 2840, bounceRate: 38.2, avgTimeOnPage: 3.8 },
          { page: '/invoices', views: 3750, uniqueVisitors: 2210, bounceRate: 41.5, avgTimeOnPage: 5.1 },
          { page: '/reports', views: 2980, uniqueVisitors: 1840, bounceRate: 45.8, avgTimeOnPage: 6.3 },
          { page: '/settings', views: 2340, uniqueVisitors: 1620, bounceRate: 28.4, avgTimeOnPage: 3.5 },
        ];
        setPageViewsData(mockPageViewsData);
        
        // Generate user source data
        const mockUserSourceData: UserSource[] = [
          { source: 'Direct', users: 3240, percentage: 38.9 },
          { source: 'Organic Search', users: 2180, percentage: 26.2 },
          { source: 'Referral', users: 1450, percentage: 17.4 },
          { source: 'Social Media', users: 980, percentage: 11.8 },
          { source: 'Email', users: 470, percentage: 5.7 },
        ];
        setUserSourceData(mockUserSourceData);
        
        // Generate device data
        const mockDeviceData: DeviceData[] = [
          { name: 'Desktop', value: 4980 },
          { name: 'Mobile', value: 2840 },
          { name: 'Tablet', value: 500 },
        ];
        setDeviceData(mockDeviceData);
        
        // Generate session duration data
        const mockSessionDurationData: SessionDuration[] = [
          { duration: '0-10 sec', sessions: 1240, percentage: 14.9 },
          { duration: '11-30 sec', sessions: 1860, percentage: 22.4 },
          { duration: '31-60 sec', sessions: 2140, percentage: 25.7 },
          { duration: '1-3 min', sessions: 1780, percentage: 21.4 },
          { duration: '3+ min', sessions: 1300, percentage: 15.6 },
        ];
        setSessionDurationData(mockSessionDurationData);
        
        // Generate daily engagement data based on selected time range
        let mockDailyEngagementData: DailyEngagement[] = [];
        const today = new Date();
        
        switch (timeRange) {
          case 'day':
            // Last 24 hours (hourly data)
            for (let i = 0; i < 24; i++) {
              const hour = new Date(today);
              hour.setHours(today.getHours() - 23 + i);
              
              const hourLabel = hour.toLocaleTimeString([], { hour: '2-digit', hour12: true });
              
              // Generate realistic data with a daily pattern
              const baseViews = 800 + Math.sin((i / 24) * Math.PI * 2) * 500;
              const randomFactor = 0.8 + Math.random() * 0.4;
              
              mockDailyEngagementData.push({
                date: hourLabel,
                pageViews: Math.round(baseViews * randomFactor),
                uniqueVisitors: Math.round((baseViews * randomFactor) * 0.4),
                avgSessionDuration: 2 + Math.random() * 3,
              });
            }
            break;
            
          case 'week':
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
              const day = new Date(today);
              day.setDate(today.getDate() - i);
              
              const dayLabel = day.toLocaleDateString([], { weekday: 'short' });
              
              // Generate realistic data with a weekly pattern
              const baseViews = 3000 + Math.sin((i / 7) * Math.PI * 2) * 1500;
              const randomFactor = 0.8 + Math.random() * 0.4;
              
              mockDailyEngagementData.push({
                date: dayLabel,
                pageViews: Math.round(baseViews * randomFactor),
                uniqueVisitors: Math.round((baseViews * randomFactor) * 0.4),
                avgSessionDuration: 2 + Math.random() * 3,
              });
            }
            break;
            
          case 'month':
            // Last 30 days
            for (let i = 29; i >= 0; i--) {
              const day = new Date(today);
              day.setDate(today.getDate() - i);
              
              const dayLabel = `${day.getDate()}/${day.getMonth() + 1}`;
              
              // Generate realistic data with a monthly pattern
              const baseViews = 3000 + Math.sin((i / 30) * Math.PI * 2) * 1500;
              const weekdayFactor = [0.8, 1.1, 1.2, 1.15, 1.1, 0.9, 0.7][day.getDay()]; // Weekend dip
              const randomFactor = 0.9 + Math.random() * 0.2;
              
              mockDailyEngagementData.push({
                date: dayLabel,
                pageViews: Math.round(baseViews * weekdayFactor * randomFactor),
                uniqueVisitors: Math.round((baseViews * weekdayFactor * randomFactor) * 0.4),
                avgSessionDuration: 2 + Math.random() * 3,
              });
            }
            break;
            
          case 'year':
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
              const month = new Date(today);
              month.setMonth(today.getMonth() - i);
              
              const monthLabel = month.toLocaleDateString([], { month: 'short' });
              
              // Generate realistic data with a yearly pattern and growth trend
              const seasonalFactor = 1 + 0.3 * Math.sin((month.getMonth() / 12) * Math.PI * 2);
              const growthFactor = 1 + (0.05 * (12 - i) / 12); // 5% growth over the year
              const baseViews = 80000 * seasonalFactor * growthFactor;
              const randomFactor = 0.95 + Math.random() * 0.1;
              
              mockDailyEngagementData.push({
                date: monthLabel,
                pageViews: Math.round(baseViews * randomFactor),
                uniqueVisitors: Math.round((baseViews * randomFactor) * 0.4),
                avgSessionDuration: 2 + Math.random() * 3,
              });
            }
            break;
        }
        
        setDailyEngagementData(mockDailyEngagementData);
        
        // Generate user journey data
        const mockUserJourneyData: UserJourney[] = [
          { step: 'Visit Homepage', users: 10000, dropoff: 0 },
          { step: 'Browse Products', users: 7500, dropoff: 25 },
          { step: 'Add to Cart', users: 4200, dropoff: 44 },
          { step: 'Begin Checkout', users: 3100, dropoff: 26 },
          { step: 'Complete Purchase', users: 2200, dropoff: 29 },
        ];
        setUserJourneyData(mockUserJourneyData);
        
        // Generate user retention data
        const mockUserRetentionData: UserRetention[] = [
          { cohort: 'Week 1', week0: 100, week1: 65, week2: 48, week3: 35, week4: 28 },
          { cohort: 'Week 2', week0: 100, week1: 68, week2: 50, week3: 38, week4: 30 },
          { cohort: 'Week 3', week0: 100, week1: 70, week2: 53, week3: 40, week4: 32 },
          { cohort: 'Week 4', week0: 100, week1: 72, week2: 55, week3: 42, week4: 34 },
        ];
        setUserRetentionData(mockUserRetentionData);
        
        // Generate geographic data
        const mockGeographicData: GeographicData[] = [
          { country: 'United States', users: 3240, engagementScore: 8.7 },
          { country: 'United Kingdom', users: 1450, engagementScore: 7.9 },
          { country: 'Germany', users: 980, engagementScore: 8.2 },
          { country: 'India', users: 850, engagementScore: 6.8 },
          { country: 'Canada', users: 720, engagementScore: 8.5 },
          { country: 'Australia', users: 580, engagementScore: 7.6 },
          { country: 'France', users: 520, engagementScore: 7.3 },
          { country: 'Brazil', users: 480, engagementScore: 6.5 },
        ];
        setGeographicData(mockGeographicData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [theme.palette, timeRange]);
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Format time (minutes) to minutes and seconds
  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    return `${mins}m ${secs}s`;
  };
  
  // Render engagement stats cards
  const renderEngagementStats = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={30} />
                  <Skeleton variant="text" width="40%" height={60} />
                  <Skeleton variant="text" width="80%" height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {engagementStats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.name}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[6],
                },
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  backgroundColor: stat.color,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(stat.color, 0.1),
                      color: stat.color,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Typography 
                    variant="subtitle1" 
                    color="text.secondary"
                    sx={{ ml: 1.5, fontWeight: 500 }}
                  >
                    {stat.name}
                  </Typography>
                </Box>
                
                <Typography 
                  variant="h4" 
                  component="div" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 1,
                    display: 'flex',
                    alignItems: 'baseline'
                  }}
                >
                  {stat.name === 'Avg. Session' ? formatTime(stat.value) : 
                   stat.name === 'Bounce Rate' ? `${stat.value}%` : 
                   formatNumber(stat.value)}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip
                    size="small"
                    icon={
                      <TrendingUpIcon 
                        sx={{ 
                          transform: stat.change < 0 ? 'rotate(180deg)' : 'none',
                          fontSize: '1rem !important',
                        }} 
                      />
                    }
                    label={`${Math.abs(stat.change)}%`}
                    color={stat.change >= 0 ? 'success' : 'error'}
                    sx={{ 
                      height: 24,
                      '& .MuiChip-label': {
                        px: 1,
                        fontSize: '0.75rem',
                      },
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    vs. previous period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  // Render time range selector
  const renderTimeRangeSelector = () => {
    return (
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          User Engagement Overview
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            aria-label="time range"
            size="small"
            sx={{ mr: 2 }}
          >
            <ToggleButton value="day" aria-label="day">
              <Tooltip title="Last 24 hours">
                <CalendarTodayIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="week" aria-label="week">
              <Tooltip title="Last 7 days">
                <CalendarViewWeekIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="month" aria-label="month">
              <Tooltip title="Last 30 days">
                <CalendarViewMonthIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="year" aria-label="year">
              <Tooltip title="Last 12 months">
                <DateRangeIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            aria-label="chart type"
            size="small"
          >
            <ToggleButton value="line" aria-label="line chart">
              <Tooltip title="Line chart">
                <TimelineIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="bar" aria-label="bar chart">
              <Tooltip title="Bar chart">
                <BarChartIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="area" aria-label="area chart">
              <Tooltip title="Area chart">
                <BubbleChartIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
    );
  };
  
  // Render engagement over time chart
  const renderEngagementChart = () => {
    if (loading) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={300} />
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart
                  data={dailyEngagementData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: theme.palette.divider }}
                    tickLine={{ stroke: theme.palette.divider }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: theme.palette.divider }}
                    tickLine={{ stroke: theme.palette.divider }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 10]}
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: theme.palette.divider }}
                    tickLine={{ stroke: theme.palette.divider }}
                    label={{ value: 'Minutes', angle: 90, position: 'insideRight', fill: theme.palette.text.secondary }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      boxShadow: theme.shadows[3],
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'avgSessionDuration') {
                        return [formatTime(value), 'Avg. Session'];
                      }
                      return [formatNumber(value), name === 'pageViews' ? 'Page Views' : 'Unique Visitors'];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="pageViews" 
                    name="Page Views"
                    stroke={theme.palette.primary.main} 
                    strokeWidth={2}
                    dot={{ r: 3, fill: theme.palette.primary.main, stroke: theme.palette.primary.main }}
                    activeDot={{ r: 5, stroke: theme.palette.primary.main, strokeWidth: 1 }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="uniqueVisitors" 
                    name="Unique Visitors"
                    stroke={theme.palette.success.main} 
                    strokeWidth={2}
                    dot={{ r: 3, fill: theme.palette.success.main, stroke: theme.palette.success.main }}
                    activeDot={{ r: 5, stroke: theme.palette.success.main, strokeWidth: 1 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="avgSessionDuration" 
                    name="Avg. Session Duration"
                    stroke={theme.palette.warning.main} 
                    strokeWidth={2}
                    dot={{ r: 3, fill: theme.palette.warning.main, stroke: theme.palette.warning.main }}
                    activeDot={{ r: 5, stroke: theme.palette.warning.main, strokeWidth: 1 }}
                  />
                </LineChart>
              ) : chartType === 'bar' ? (
                <BarChart
                  data={dailyEngagementData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: theme.palette.divider }}
                    tickLine={{ stroke: theme.palette.divider }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: theme.palette.divider }}
                    tickLine={{ stroke: theme.palette.divider }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 10]}
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: theme.palette.divider }}
                    tickLine={{ stroke: theme.palette.divider }}
                    label={{ value: 'Minutes', angle: 90, position: 'insideRight', fill: theme.palette.text.secondary }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      boxShadow: theme.shadows[3],
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'avgSessionDuration') {
                        return [formatTime(value), 'Avg. Session'];
                      }
                      return [formatNumber(value), name === 'pageViews' ? 'Page Views' : 'Unique Visitors'];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="pageViews" 
                    name="Page Views"
                    fill={theme.palette.primary.main} 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="uniqueVisitors" 
                    name="Unique Visitors"
                    fill={theme.palette.success.main} 
                    radius={[4, 4, 0, 0]}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="avgSessionDuration" 
                    name="Avg. Session Duration"
                    stroke={theme.palette.warning.main} 
                    strokeWidth={2}
                    dot={{ r: 3, fill: theme.palette.warning.main, stroke: theme.palette.warning.main }}
                    activeDot={{ r: 5, stroke: theme.palette.warning.main, strokeWidth: 1 }}
                  />
                </BarChart>
              ) : (
                <AreaChart
                  data={dailyEngagementData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: theme.palette.divider }}
                    tickLine={{ stroke: theme.palette.divider }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: theme.palette.divider }}
                    tickLine={{ stroke: theme.palette.divider }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 10]}
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    axisLine={{ stroke: theme.palette.divider }}
                    tickLine={{ stroke: theme.palette.divider }}
                    label={{ value: 'Minutes', angle: 90, position: 'insideRight', fill: theme.palette.text.secondary }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      boxShadow: theme.shadows[3],
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'avgSessionDuration') {
                        return [formatTime(value), 'Avg. Session'];
                      }
                      return [formatNumber(value), name === 'pageViews' ? 'Page Views' : 'Unique Visitors'];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="pageViews" 
                    name="Page Views"
                    stroke={theme.palette.primary.main} 
                    fill={alpha(theme.palette.primary.main, 0.2)}
                    strokeWidth={2}
                    activeDot={{ r: 5, stroke: theme.palette.primary.main, strokeWidth: 1 }}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="uniqueVisitors" 
                    name="Unique Visitors"
                    stroke={theme.palette.success.main} 
                    fill={alpha(theme.palette.success.main, 0.2)}
                    strokeWidth={2}
                    activeDot={{ r: 5, stroke: theme.palette.success.main, strokeWidth: 1 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="avgSessionDuration" 
                    name="Avg. Session Duration"
                    stroke={theme.palette.warning.main} 
                    strokeWidth={2}
                    dot={{ r: 3, fill: theme.palette.warning.main, stroke: theme.palette.warning.main }}
                    activeDot={{ r: 5, stroke: theme.palette.warning.main, strokeWidth: 1 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };
  
  // Render user source and device distribution
  const renderUserDistribution = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={300} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', my: 2 }} />
                <Skeleton variant="text" width="80%" height={20} sx={{ mx: 'auto' }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    }
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="Traffic Sources" 
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              action={
                <Tooltip title="Refresh data">
                  <IconButton size="small">
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={userSourceData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                    <XAxis 
                      type="number"
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      axisLine={{ stroke: theme.palette.divider }}
                      tickLine={{ stroke: theme.palette.divider }}
                    />
                    <YAxis 
                      dataKey="source" 
                      type="category"
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      axisLine={{ stroke: theme.palette.divider }}
                      tickLine={{ stroke: theme.palette.divider }}
                      width={100}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        boxShadow: theme.shadows[3],
                      }}
                      formatter={(value: number, name: string) => {
                        return [formatNumber(value), 'Users'];
                      }}
                      labelFormatter={(label) => `Source: ${label}`}
                    />
                    <Bar 
                      dataKey="users" 
                      fill={theme.palette.primary.main}
                      radius={[0, 4, 4, 0]}
                      label={{ 
                        position: 'right', 
                        fill: theme.palette.text.secondary,
                        fontSize: 12,
                        formatter: (value: any) => `${value.value} (${userSourceData.find(item => item.source === value.source)?.percentage}%)`,
                      }}
                    >
                      {userSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="Device Distribution" 
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              action={
                <Tooltip title="Refresh data">
                  <IconButton size="small">
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        boxShadow: theme.shadows[3],
                      }}
                      formatter={(value: number) => [formatNumber(value), 'Users']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  {deviceData.map((entry, index) => (
                    <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: COLORS[index % COLORS.length],
                          mr: 0.5,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {entry.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // Render user journey funnel
  const renderUserJourney = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={300} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={300} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    }
    
    // Calculate funnel width percentages
    const maxUsers = userJourneyData[0].users;
    const funnelData = userJourneyData.map(step => ({
      ...step,
      percentage: (step.users / maxUsers) * 100
    }));
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="User Journey Funnel" 
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              action={
                <Tooltip title="Refresh data">
                  <IconButton size="small">
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {funnelData.map((step, index) => (
                  <Box key={step.step} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {step.step}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatNumber(step.users)} users
                      </Typography>
                    </Box>
                    <Box sx={{ position: 'relative', height: 30 }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: `${step.percentage}%`,
                          height: '100%',
                          bgcolor: SEQUENTIAL_COLORS[index % SEQUENTIAL_COLORS.length],
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'width 1s ease-in-out',
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'white', 
                            fontWeight: 600,
                            textShadow: '0px 0px 2px rgba(0,0,0,0.5)',
                          }}
                        >
                          {step.percentage.toFixed(0)}%
                        </Typography>
                      </Box>
                    </Box>
                    {index < funnelData.length - 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
                        <Typography variant="caption" color="error">
                          {step.dropoff}% drop-off
                        </Typography>
                        <ArrowForwardIcon 
                          sx={{ 
                            transform: 'rotate(90deg)', 
                            fontSize: 16, 
                            color: theme.palette.text.secondary,
                            mx: 1,
                          }} 
                        />
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="Session Duration Distribution" 
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
              action={
                <Tooltip title="Refresh data">
                  <IconButton size="small">
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="20%" 
                    outerRadius="90%" 
                    barSize={20} 
                    data={sessionDurationData.map((item, index) => ({
                      ...item,
                      fill: SEQUENTIAL_COLORS[index % SEQUENTIAL_COLORS.length],
                    }))}
                    startAngle={180} 
                    endAngle={0}
                  >
                    <RadialBar
                      label={{ 
                        position: 'insideStart', 
                        fill: theme.palette.text.primary,
                        fontSize: 12,
                        formatter: (value: any) => `${value.duration}: ${value.percentage}%`,
                      }}
                      background
                      dataKey="sessions"
                      nameKey="duration"
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        boxShadow: theme.shadows[3],
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        return [
                          `${formatNumber(value)} sessions (${props.payload.percentage}%)`,
                          props.payload.duration
                        ];
                      }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // Render top pages table
  const renderTopPages = () => {
    if (loading) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={300} />
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Top Pages" 
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          action={
            <Tooltip title="Refresh data">
              <IconButton size="small">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        />
        <Divider />
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 800, p: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', gap: 2, py: 1, px: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>Page</Typography>
              <Typography variant="subtitle2" fontWeight={600}>Views</Typography>
              <Typography variant="subtitle2" fontWeight={600}>Unique Visitors</Typography>
              <Typography variant="subtitle2" fontWeight={600}>Bounce Rate</Typography>
              <Typography variant="subtitle2" fontWeight={600}>Avg. Time</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            {pageViewsData.map((page, index) => (
              <Box key={page.page} sx={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', gap: 2, py: 1.5, px: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) } }}>
                <Typography variant="body2" fontWeight={500}>{page.page}</Typography>
                <Typography variant="body2">{formatNumber(page.views)}</Typography>
                <Typography variant="body2">{formatNumber(page.uniqueVisitors)}</Typography>
                <Typography variant="body2" color={page.bounceRate > 50 ? 'error.main' : page.bounceRate > 40 ? 'warning.main' : 'success.main'}>
                  {page.bounceRate}%
                </Typography>
                <Typography variant="body2">{formatTime(page.avgTimeOnPage)}</Typography>
                {index < pageViewsData.length - 1 && <Divider sx={{ gridColumn: '1 / -1', mt: 1.5 }} />}
              </Box>
            ))}
          </Box>
        </Box>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button size="small" endIcon={<ArrowForwardIcon />}>
            View All Pages
          </Button>
        </CardActions>
      </Card>
    );
  };
  
  // Render geographic distribution
  const renderGeographicDistribution = () => {
    if (loading) {
      return (
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={300} />
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardHeader 
          title="Geographic Distribution" 
          titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
          action={
            <Tooltip title="Refresh data">
              <IconButton size="small">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        />
        <Divider />
        <Box sx={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
              <XAxis 
                type="number" 
                dataKey="users" 
                name="Users" 
                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={{ stroke: theme.palette.divider }}
                label={{ value: 'Users', position: 'insideBottom', offset: -10, fill: theme.palette.text.secondary }}
              />
              <YAxis 
                type="number" 
                dataKey="engagementScore" 
                name="Engagement Score" 
                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                axisLine={{ stroke: theme.palette.divider }}
                tickLine={{ stroke: theme.palette.divider }}
                label={{ value: 'Engagement Score', angle: -90, position: 'insideLeft', fill: theme.palette.text.secondary }}
              />
              <ZAxis 
                type="number" 
                range={[60, 400]} 
                dataKey="users" 
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                  boxShadow: theme.shadows[3],
                }}
                formatter={(value: number, name: string) => {
                  return [value, name === 'engagementScore' ? 'Engagement Score' : 'Users'];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.country;
                  }
                  return label;
                }}
              />
              <Scatter 
                name="Countries" 
                data={geographicData} 
                fill={theme.palette.primary.main}
              >
                {geographicData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Box>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button size="small" endIcon={<ArrowForwardIcon />}>
            View Detailed Report
          </Button>
        </CardActions>
      </Card>
    );
  };
  
  // Main render
  return (
    <Container maxWidth="xl">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Engagement Stats */}
      {renderEngagementStats()}
      
      {/* Time Range Selector */}
      <Box sx={{ mt: 4 }}>
        {renderTimeRangeSelector()}
      </Box>
      
      {/* Engagement Chart */}
      {renderEngagementChart()}
      
      {/* User Distribution */}
      <Box sx={{ mb: 4 }}>
        {renderUserDistribution()}
      </Box>
      
      {/* Top Pages */}
      {renderTopPages()}
      
      {/* User Journey */}
      <Box sx={{ mb: 4 }}>
        {renderUserJourney()}
      </Box>
      
      {/* Geographic Distribution */}
      {renderGeographicDistribution()}
    </Container>
  );
}