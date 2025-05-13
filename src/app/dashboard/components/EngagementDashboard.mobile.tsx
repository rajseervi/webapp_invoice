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
  useMediaQuery,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
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
  FilterList as FilterListIcon,
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
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
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
  
  // Handle time range change for mobile dropdown
  const handleTimeRangeChangeDropdown = (event: SelectChangeEvent<'day' | 'week' | 'month' | 'year'>) => {
    setTimeRange(event.target.value as 'day' | 'week' | 'month' | 'year');
  };
  
  // Handle time range change for desktop toggle buttons
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
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={6} sm={6} md={3} key={item}>
              <Card sx={{ borderRadius: { xs: 1, sm: 2 } }}>
                <CardContent sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="text" width="80%" height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }
    
    return (
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        {engagementStats.map((stat) => (
          <Grid item xs={6} sm={6} md={3} key={stat.name}>
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
                borderRadius: { xs: 1, sm: 2 },
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
              <CardContent sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: { xs: 0.75, sm: 1 },
                  flexWrap: { xs: 'wrap', sm: 'nowrap' }
                }}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(stat.color, 0.1),
                      color: stat.color,
                      width: { xs: 28, sm: 32, md: 40 },
                      height: { xs: 28, sm: 32, md: 40 },
                      fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Typography 
                    variant="body2"
                    color="text.secondary"
                    sx={{ 
                      ml: { xs: 1, sm: 1.5 }, 
                      fontWeight: 500,
                      fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }
                    }}
                    noWrap
                  >
                    {stat.name}
                  </Typography>
                </Box>
                
                <Typography 
                  variant="h6"
                  component="div" 
                  sx={{ 
                    fontWeight: 700,
                    my: { xs: 0.75, sm: 1 },
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                    lineHeight: 1.2
                  }}
                >
                  {stat.name === 'Avg. Session' 
                    ? formatTime(stat.value) 
                    : stat.name === 'Bounce Rate' 
                      ? `${stat.value}%` 
                      : formatNumber(stat.value)}
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  flexWrap: { xs: 'wrap', sm: 'nowrap' }
                }}>
                  <Chip 
                    size="small"
                    label={`${stat.change > 0 ? '+' : ''}${stat.change}%`} 
                    color={stat.change > 0 ? 'success' : 'error'} 
                    variant="outlined"
                    sx={{ 
                      height: { xs: 18, sm: 20, md: 24 },
                      '& .MuiChip-label': {
                        px: { xs: 0.5, sm: 1 },
                        fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                      }
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      ml: 1, 
                      fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: { xs: '100%', sm: '60%' }
                    }}
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
      <Box sx={{ 
        mb: { xs: 2, sm: 2.5, md: 3 }, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 1.5, sm: 0 },
        width: '100%'
      }}>
        <Typography 
          variant="h6"
          component="h2" 
          sx={{ 
            fontWeight: 600, 
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
            mb: { xs: 1, sm: 0 }
          }}
        >
          User Engagement Overview
        </Typography>
        
        {/* Mobile view controls */}
        {isMobile ? (
          <Box sx={{ 
            display: 'flex', 
            width: '100%', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: 1
          }}>
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: '48%' },
                '& .MuiInputBase-root': {
                  fontSize: '0.8rem'
                }
              }}
            >
              <InputLabel id="time-range-select-label" sx={{ fontSize: '0.8rem' }}>Time Range</InputLabel>
              <Select
                labelId="time-range-select-label"
                id="time-range-select"
                value={timeRange}
                label="Time Range"
                onChange={handleTimeRangeChangeDropdown}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      '& .MuiMenuItem-root': {
                        fontSize: '0.8rem',
                        py: 0.75
                      }
                    }
                  }
                }}
              >
                <MenuItem value="day">24 Hours</MenuItem>
                <MenuItem value="week">7 Days</MenuItem>
                <MenuItem value="month">30 Days</MenuItem>
                <MenuItem value="year">12 Months</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: '48%' },
                '& .MuiInputBase-root': {
                  fontSize: '0.8rem'
                }
              }}
            >
              <InputLabel id="chart-type-select-label" sx={{ fontSize: '0.8rem' }}>Chart Type</InputLabel>
              <Select
                labelId="chart-type-select-label"
                id="chart-type-select"
                value={chartType}
                label="Chart Type"
                onChange={(e) => setChartType(e.target.value as 'line' | 'bar' | 'area')}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      '& .MuiMenuItem-root': {
                        fontSize: '0.8rem',
                        py: 0.75
                      }
                    }
                  }
                }}
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="area">Area Chart</MenuItem>
              </Select>
            </FormControl>
          </Box>
        ) : (
          /* Tablet and desktop view controls */
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            justifyContent: { xs: 'flex-end', md: 'flex-end' },
            gap: { xs: 1, md: 2 }
          }}>
            <ToggleButtonGroup
              value={timeRange}
              exclusive
              onChange={handleTimeRangeChange}
              aria-label="time range"
              size="small"
              sx={{ 
                mr: { sm: 1, md: 2 },
                '& .MuiToggleButton-root': {
                  px: { sm: 1, md: 1.5 }
                }
              }}
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
              sx={{ 
                '& .MuiToggleButton-root': {
                  px: { sm: 1, md: 1.5 }
                }
              }}
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
        )}
      </Box>
    );
  };
  
  // Render engagement over time chart
  const renderEngagementChart = () => {
    if (loading) {
      return (
        <Card 
          sx={{ 
            mb: { xs: 2.5, sm: 3, md: 4 },
            borderRadius: { xs: 1, sm: 2 },
            boxShadow: { xs: 1, sm: 2 }
          }}
        >
          <CardContent sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
            <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1.5 }} />
            <Skeleton variant="rectangular" width="100%" height={{ xs: 180, sm: 220, md: 300 }} />
          </CardContent>
        </Card>
      );
    }
    
    // Determine how many data points to show based on screen size
    const getDataInterval = () => {
      if (isMobile) {
        // For mobile, show fewer data points
        if (timeRange === 'month') return Math.ceil(dailyEngagementData.length / 10);
        if (timeRange === 'year') return Math.ceil(dailyEngagementData.length / 6);
        return 'preserveStartEnd';
      } else if (isTablet) {
        // For tablet, show more data points but still reduce
        if (timeRange === 'month') return Math.ceil(dailyEngagementData.length / 15);
        if (timeRange === 'year') return 1;
        return 0;
      }
      // For desktop, show all data points
      return 0;
    };
    
    // Common chart props for all chart types
    const commonChartProps = {
      data: dailyEngagementData,
      margin: { 
        top: 20, 
        right: { xs: 5, sm: 10, md: 30 }[theme.breakpoints.keys.find(key => 
          useMediaQuery(theme.breakpoints.only(key as any))) || 'xs'], 
        left: { xs: 0, sm: 5, md: 20 }[theme.breakpoints.keys.find(key => 
          useMediaQuery(theme.breakpoints.only(key as any))) || 'xs'], 
        bottom: 10 
      }
    };
    
    // Common axis props
    const commonXAxisProps = {
      dataKey: "date",
      tick: { 
        fill: theme.palette.text.secondary, 
        fontSize: { xs: 9, sm: 10, md: 12 }[theme.breakpoints.keys.find(key => 
          useMediaQuery(theme.breakpoints.only(key as any))) || 'xs'] 
      },
      axisLine: { stroke: theme.palette.divider },
      tickLine: { stroke: theme.palette.divider },
      interval: getDataInterval(),
      height: { xs: 30, sm: 40, md: 50 }[theme.breakpoints.keys.find(key => 
        useMediaQuery(theme.breakpoints.only(key as any))) || 'xs']
    };
    
    const commonYAxisProps = {
      tick: { 
        fill: theme.palette.text.secondary, 
        fontSize: { xs: 9, sm: 10, md: 12 }[theme.breakpoints.keys.find(key => 
          useMediaQuery(theme.breakpoints.only(key as any))) || 'xs'] 
      },
      axisLine: { stroke: theme.palette.divider },
      tickLine: { stroke: theme.palette.divider },
      tickFormatter: (value: number) => isMobile ? `${Math.round(value/1000)}k` : value.toString(),
      width: { xs: 30, sm: 40, md: 50 }[theme.breakpoints.keys.find(key => 
        useMediaQuery(theme.breakpoints.only(key as any))) || 'xs']
    };
    
    // Common tooltip props
    const commonTooltipProps = {
      contentStyle: { 
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 8,
        boxShadow: theme.shadows[3],
        fontSize: { xs: 10, sm: 12, md: 14 }[theme.breakpoints.keys.find(key => 
          useMediaQuery(theme.breakpoints.only(key as any))) || 'xs'],
        padding: { xs: '4px 8px', sm: '8px 12px', md: '10px 14px' }[theme.breakpoints.keys.find(key => 
          useMediaQuery(theme.breakpoints.only(key as any))) || 'xs'],
      },
      formatter: (value: number, name: string) => {
        if (name === 'pageViews') return [formatNumber(value), 'Page Views'];
        if (name === 'uniqueVisitors') return [formatNumber(value), 'Unique Visitors'];
        return [value.toFixed(1), 'Avg. Session Duration (min)'];
      }
    };
    
    // Common legend props
    const commonLegendProps = {
      verticalAlign: "top" as const,
      height: 36,
      wrapperStyle: { 
        fontSize: { xs: 9, sm: 10, md: 12 }[theme.breakpoints.keys.find(key => 
          useMediaQuery(theme.breakpoints.only(key as any))) || 'xs'],
        paddingTop: { xs: 4, sm: 8, md: 10 }[theme.breakpoints.keys.find(key => 
          useMediaQuery(theme.breakpoints.only(key as any))) || 'xs']
      }
    };
    
    return (
      <Card 
        sx={{ 
          mb: { xs: 2.5, sm: 3, md: 4 },
          borderRadius: { xs: 1, sm: 2 },
          boxShadow: { xs: 1, sm: 2 },
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
          <Box sx={{ 
            height: { xs: 220, sm: 280, md: 350 },
            width: '100%',
            overflow: 'hidden'
          }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart {...commonChartProps}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                  <XAxis {...commonXAxisProps} />
                  <YAxis 
                    {...commonYAxisProps}
                    yAxisId="left"
                  />
                  {!isMobile && (
                    <YAxis 
                      {...commonYAxisProps}
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => value.toFixed(1)}
                      domain={[0, 10]}
                    />
                  )}
                  <RechartsTooltip {...commonTooltipProps} />
                  <Legend {...commonLegendProps} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="pageViews"
                    name="Page Views"
                    stroke={theme.palette.primary.main}
                    strokeWidth={isMobile ? 1.5 : 2}
                    dot={false}
                    activeDot={{ r: isMobile ? 4 : 6 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="uniqueVisitors"
                    name="Unique Visitors"
                    stroke={theme.palette.success.main}
                    strokeWidth={isMobile ? 1.5 : 2}
                    dot={false}
                    activeDot={{ r: isMobile ? 4 : 6 }}
                  />
                  {!isMobile && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgSessionDuration"
                      name="Avg. Session Duration"
                      stroke={theme.palette.info.main}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              ) : chartType === 'bar' ? (
                <BarChart {...commonChartProps}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                  <XAxis {...commonXAxisProps} />
                  <YAxis {...commonYAxisProps} />
                  <RechartsTooltip {...commonTooltipProps} />
                  <Legend {...commonLegendProps} />
                  <Bar 
                    dataKey="pageViews" 
                    name="Page Views" 
                    fill={theme.palette.primary.main} 
                    radius={[4, 4, 0, 0]}
                    barSize={isMobile ? 6 : isTablet ? 10 : 20}
                  />
                  <Bar 
                    dataKey="uniqueVisitors" 
                    name="Unique Visitors" 
                    fill={theme.palette.success.main} 
                    radius={[4, 4, 0, 0]}
                    barSize={isMobile ? 6 : isTablet ? 10 : 20}
                  />
                </BarChart>
              ) : (
                <AreaChart {...commonChartProps}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                  <XAxis {...commonXAxisProps} />
                  <YAxis {...commonYAxisProps} />
                  <RechartsTooltip {...commonTooltipProps} />
                  <Legend {...commonLegendProps} />
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    name="Page Views"
                    stroke={theme.palette.primary.main}
                    fill={alpha(theme.palette.primary.main, 0.2)}
                    strokeWidth={isMobile ? 1.5 : 2}
                    activeDot={{ r: isMobile ? 4 : 6 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="uniqueVisitors"
                    name="Unique Visitors"
                    stroke={theme.palette.success.main}
                    fill={alpha(theme.palette.success.main, 0.2)}
                    strokeWidth={isMobile ? 1.5 : 2}
                    activeDot={{ r: isMobile ? 4 : 6 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };
  
  // Render user distribution section
  const renderUserDistribution = () => {
    if (loading) {
      return (
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: { xs: 1, sm: 2 },
              boxShadow: { xs: 1, sm: 2 }
            }}>
              <CardContent sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
                <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1.5 }} />
                <Skeleton variant="rectangular" width="100%" height={{ xs: 180, sm: 220, md: 300 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: { xs: 1, sm: 2 },
              boxShadow: { xs: 1, sm: 2 }
            }}>
              <CardContent sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
                <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1.5 }} />
                <Skeleton variant="rectangular" width="100%" height={{ xs: 180, sm: 220, md: 300 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    }
    
    return (
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        {/* Traffic Sources */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            borderRadius: { xs: 1, sm: 2 },
            boxShadow: { xs: 1, sm: 2 },
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: { xs: 1.25, sm: 1.5, md: 2 } }}>
              <Typography 
                variant="subtitle1"
                component="h3" 
                sx={{ 
                  mb: { xs: 1.5, sm: 2 }, 
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
                }}
              >
                Traffic Sources
              </Typography>
              <Box sx={{ 
                height: { xs: 180, sm: 220, md: 300 },
                width: '100%',
                overflow: 'hidden'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={{ xs: 70, sm: 80, md: 110 }[theme.breakpoints.keys.find(key => 
                        useMediaQuery(theme.breakpoints.only(key as any))) || 'xs']}
                      innerRadius={{ xs: 35, sm: 40, md: 70 }[theme.breakpoints.keys.find(key => 
                        useMediaQuery(theme.breakpoints.only(key as any))) || 'xs']}
                      fill="#8884d8"
                      dataKey="users"
                      nameKey="source"
                      label={({ source, percentage }) => (isMobile ? `${percentage}%` : `${source}: ${percentage}%`)}
                      labelStyle={{ fontSize: isMobile ? 10 : 12 }}
                    >
                      {userSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        boxShadow: theme.shadows[3],
                        fontSize: isMobile ? 12 : 14,
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        return [`${formatNumber(value)} users (${props.payload.percentage}%)`, props.payload.source];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Device Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                component="h3" 
                sx={{ mb: 2, fontWeight: 600 }}
              >
                Device Distribution
              </Typography>
              <Box sx={{ height: isMobile ? 220 : 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={isMobile ? 80 : 110}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SEQUENTIAL_COLORS[index % SEQUENTIAL_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        boxShadow: theme.shadows[3],
                        fontSize: isMobile ? 12 : 14,
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        const total = deviceData.reduce((sum, item) => sum + item.value, 0);
                        const percent = ((value / total) * 100).toFixed(1);
                        return [`${formatNumber(value)} users (${percent}%)`, props.payload.name];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // Render top pages section
  const renderTopPages = () => {
    if (loading) {
      return (
        <Card sx={{ mb: isMobile ? 3 : 4 }}>
          <CardContent>
            <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={250} />
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card sx={{ mb: isMobile ? 3 : 4 }}>
        <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            component="h3" 
            sx={{ mb: 2, fontWeight: 600 }}
          >
            Top Pages
          </Typography>
          
          <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ minWidth: 600 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                borderBottom: `1px solid ${theme.palette.divider}`,
                py: 1
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Page</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: 'right' }}>Views</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: 'right' }}>Visitors</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: 'right' }}>Bounce Rate</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: 'right' }}>Avg. Time</Typography>
              </Box>
              
              {pageViewsData.map((page) => (
                <Box key={page.page} sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  py: 1.5,
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{page.page}</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'right' }}>{formatNumber(page.views)}</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'right' }}>{formatNumber(page.uniqueVisitors)}</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'right' }}>{page.bounceRate}%</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'right' }}>{formatTime(page.avgTimeOnPage)}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', p: isMobile ? 1 : 2 }}>
          <Button size="small" endIcon={<ArrowForwardIcon />}>
            View All Pages
          </Button>
        </CardActions>
      </Card>
    );
  };
  
  // Render user journey section
  const renderUserJourney = () => {
    if (loading) {
      return (
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={250} />
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            component="h3" 
            sx={{ mb: 2, fontWeight: 600 }}
          >
            User Journey Funnel
          </Typography>
          
          <Box sx={{ height: isMobile ? 250 : 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userJourneyData}
                layout="vertical"
                margin={{ 
                  top: 20, 
                  right: isMobile ? 10 : 30, 
                  left: isMobile ? 80 : 100, 
                  bottom: 10 
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                <XAxis 
                  type="number" 
                  tick={{ fill: theme.palette.text.secondary, fontSize: isMobile ? 10 : 12 }}
                  axisLine={{ stroke: theme.palette.divider }}
                  tickLine={{ stroke: theme.palette.divider }}
                  tickFormatter={(value) => isMobile ? `${value/1000}k` : formatNumber(value)}
                />
                <YAxis 
                  type="category" 
                  dataKey="step" 
                  tick={{ fill: theme.palette.text.secondary, fontSize: isMobile ? 10 : 12 }}
                  axisLine={{ stroke: theme.palette.divider }}
                  tickLine={{ stroke: theme.palette.divider }}
                  width={isMobile ? 80 : 100}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    boxShadow: theme.shadows[3],
                    fontSize: isMobile ? 12 : 14,
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'users') {
                      return [formatNumber(value), 'Users'];
                    }
                    return [`${props.payload.dropoff}%`, 'Dropoff Rate'];
                  }}
                />
                <Bar 
                  dataKey="users" 
                  name="Users" 
                  fill={theme.palette.primary.main} 
                  radius={[0, 4, 4, 0]}
                  barSize={isMobile ? 20 : 30}
                  label={isMobile ? undefined : { 
                    position: 'right', 
                    formatter: (value: number) => formatNumber(value),
                    fill: theme.palette.text.secondary,
                    fontSize: 12,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', p: isMobile ? 1 : 2 }}>
          <Button size="small" endIcon={<ArrowForwardIcon />}>
            View Detailed Analysis
          </Button>
        </CardActions>
      </Card>
    );
  };
  
  // Render geographic distribution section
  const renderGeographicDistribution = () => {
    if (loading) {
      return (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={250} />
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card sx={{ mt: isMobile ? 3 : 4 }}>
        <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            component="h3" 
            sx={{ mb: 2, fontWeight: 600 }}
          >
            Geographic Distribution
          </Typography>
          
          <Box sx={{ height: isMobile ? 250 : 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ 
                  top: 20, 
                  right: isMobile ? 10 : 30, 
                  left: isMobile ? 0 : 20, 
                  bottom: 10 
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                <XAxis 
                  type="number" 
                  dataKey="users" 
                  name="Users" 
                  tick={{ fill: theme.palette.text.secondary, fontSize: isMobile ? 10 : 12 }}
                  axisLine={{ stroke: theme.palette.divider }}
                  tickLine={{ stroke: theme.palette.divider }}
                  label={isMobile ? undefined : { 
                    value: 'Users', 
                    position: 'insideBottom', 
                    offset: -10, 
                    fill: theme.palette.text.secondary 
                  }}
                  tickFormatter={(value) => isMobile ? `${value/1000}k` : formatNumber(value)}
                />
                <YAxis 
                  type="number" 
                  dataKey="engagementScore" 
                  name="Engagement Score" 
                  tick={{ fill: theme.palette.text.secondary, fontSize: isMobile ? 10 : 12 }}
                  axisLine={{ stroke: theme.palette.divider }}
                  tickLine={{ stroke: theme.palette.divider }}
                  label={isMobile ? undefined : { 
                    value: 'Engagement Score', 
                    angle: -90, 
                    position: 'insideLeft', 
                    fill: theme.palette.text.secondary 
                  }}
                />
                <ZAxis 
                  type="number" 
                  range={[isMobile ? 40 : 60, isMobile ? 200 : 400]} 
                  dataKey="users" 
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    boxShadow: theme.shadows[3],
                    fontSize: isMobile ? 12 : 14,
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
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', p: isMobile ? 1 : 2 }}>
          <Button size="small" endIcon={<ArrowForwardIcon />}>
            View Detailed Report
          </Button>
        </CardActions>
      </Card>
    );
  };
  
  // Main render
  return (
    <Container 
      maxWidth="xl" 
      disableGutters={isMobile} 
      sx={{ 
        px: { xs: 1.5, sm: 2, md: 3 },
        overflow: 'hidden', // Prevent horizontal scrolling on mobile
        width: '100%',
        maxWidth: '100vw'
      }}
    >
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: { xs: 2, sm: 3 },
            borderRadius: 1,
            width: '100%'
          }}
        >
          {error}
        </Alert>
      )}
      
      {/* Engagement Stats */}
      <Box sx={{ width: '100%', overflowX: 'hidden' }}>
        {renderEngagementStats()}
      </Box>
      
      {/* Time Range Selector */}
      <Box sx={{ 
        mt: { xs: 2.5, sm: 3, md: 4 },
        width: '100%'
      }}>
        {renderTimeRangeSelector()}
      </Box>
      
      {/* Engagement Chart */}
      <Box sx={{ 
        width: '100%',
        overflowX: 'hidden',
        overflowY: 'hidden'
      }}>
        {renderEngagementChart()}
      </Box>
      
      {/* User Distribution */}
      <Box sx={{ 
        mb: { xs: 2.5, sm: 3, md: 4 },
        width: '100%',
        overflowX: 'hidden'
      }}>
        {renderUserDistribution()}
      </Box>
      
      {/* Top Pages */}
      <Box sx={{ 
        width: '100%',
        overflowX: 'hidden'
      }}>
        {renderTopPages()}
      </Box>
      
      {/* User Journey */}
      <Box sx={{ 
        mb: { xs: 2.5, sm: 3, md: 4 },
        width: '100%',
        overflowX: 'hidden'
      }}>
        {renderUserJourney()}
      </Box>
      
      {/* Geographic Distribution */}
      <Box sx={{ 
        width: '100%',
        overflowX: 'hidden',
        mb: { xs: 2, sm: 3, md: 4 }
      }}>
        {renderGeographicDistribution()}
      </Box>
    </Container>
  );
}