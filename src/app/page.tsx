"use client";

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Paper,
  Link as MuiLink,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ArrowForward,
  Inventory,
  ShoppingCart,
  LocalShipping,
  Assessment,
  Menu as MenuIcon,
  Facebook,
  Twitter,
  LinkedIn,
  // Add new icons for the demo section
  PersonSearch,
  PlaylistAddCheck,
  Send,
  FormatQuote, // Added for Testimonials
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// Placeholder for navigation items if you have them for the landing page
const navItems = [
  { id: 'features', label: 'Features' },
  { id: 'demo', label: 'How it Works' }, // Added demo link
  { id: 'testimonials', label: 'Testimonials' }, // Added Testimonials link
  { id: 'cta', label: 'Get Started' },
  { id: 'contact', label: 'Contact' },
];

export default function HomePage() {
  const router = useRouter();
  const theme = useTheme();
  // Placeholder for login state - replace with your actual auth state
  const [isUserLoggedIn, setIsUserLoggedIn] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string | null>(null); // Added userRole state
  const [activeSection, setActiveSection] = React.useState<string | null>(null); // New state for active section

  // Placeholder function to simulate login/logout - replace with actual auth logic
  const handleLogout = () => {
    setIsUserLoggedIn(false);
    setUserRole(null); // Reset user role on logout
    // Add actual logout logic here (e.g., clear token, redirect)
    router.push('/'); // Redirect to home or login page after logout
  };

  // REMOVED handleLogin function

  React.useEffect(() => {
    // Simulate checking auth status on page load
    // In a real app, you would check for a token, call an API, etc.
    // For demonstration, let's assume the user is logged in by default.
    const loggedIn = true; // Change this to false to see the "Login" / "Sign Up" buttons by default.
    setIsUserLoggedIn(loggedIn);
    if (loggedIn) {
      // Simulate fetching user role. Replace with actual role from your auth context/API
      setUserRole('admin'); // Example: set user role to 'admin'. Change to 'user' or null to test other paths.
    } else {
      setUserRole(null);
    }
  }, []); // Empty dependency array ensures this runs only once on mount


  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId); // Set active section on click
      // Update URL hash without triggering a full page reload for better UX
      if (window.history.pushState) {
        window.history.pushState(null, '', `#${sectionId}`);
      } else {
        window.location.hash = sectionId;
      }
    }
  };

  // Effect to update active section on scroll
  React.useEffect(() => {
    const handleScroll = () => {
      let currentSection: string | null = null;
      navItems.forEach((item) => {
        const sectionElement = document.getElementById(item.id);
        if (sectionElement) {
          const rect = sectionElement.getBoundingClientRect();
          // Check if section is in viewport (adjust offset as needed)
          // A section is considered active if its top is within the top 1/3 of the viewport
          if (rect.top <= window.innerHeight / 3 && rect.bottom >= window.innerHeight / 3) {
            currentSection = item.id;
          }
        }
      });

      // If no section is actively in the "main" part of the viewport,
      // check if we've scrolled past the first section (for header stickiness)
      // or if we are at the very top.
      if (!currentSection && navItems.length > 0) {
        const firstSectionElement = document.getElementById(navItems[0].id);
        if (firstSectionElement && firstSectionElement.getBoundingClientRect().top > window.innerHeight / 2) {
          // If the top of the first section is far down, no section is "active" yet (or show home)
           setActiveSection(null); // Or navItems[0].id if you want first to be default
        } else if (window.scrollY === 0 && navItems.length > 0) {
           setActiveSection(navItems[0].id); // Default to first item if at top
        }
      }


      if (currentSection && currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Call it once to set initial state based on current scroll position
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]); // Rerun if activeSection changes to avoid stale closure issues (though navItems is stable here)


  const handleDashboardRedirect = () => {
    if (userRole === 'admin') {
      router.push('/admin/dashboard');
    } else {
      // Default dashboard for other roles or if role is not specifically 'admin'
      router.push('/dashboard');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          color: theme.palette.text.primary,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, fontWeight: 'bold', color: theme.palette.primary.main }}
            >
              IMS Pro
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  color="inherit"
                  onClick={() => scrollToSection(item.id)}
                  sx={{
                    fontWeight: activeSection === item.id ? 600 : 500, // Bolder font for active item
                    color: activeSection === item.id ? theme.palette.primary.main : theme.palette.text.primary,
                    position: 'relative',
                    px: 2, // Added some padding
                    py: 1,
                    transition: 'color 0.3s ease, font-weight 0.3s ease',
                    '&:hover': {
                      color: theme.palette.primary.dark,
                      backgroundColor: alpha(theme.palette.primary.light, 0.1), // Subtle background on hover
                    },
                    // Underline effect for active/hover
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: activeSection === item.id ? '60%' : '0%', // Wider for active
                      height: '2px',
                      backgroundColor: theme.palette.primary.main,
                      transition: 'width 0.3s ease-in-out',
                    },
                    '&:hover::after': {
                        width: '40%', // Slightly less wide for hover if not active
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
              {isUserLoggedIn ? (
                <>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleDashboardRedirect} // Updated onClick handler
                    sx={{ ml: 2 }}
                  >
                    View Dashboard
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      router.push('/login'); // Navigate to login page
                    }}
                    sx={{ ml: 2 }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => router.push('/signup')}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </Box>
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              {/* Add mobile menu logic here if needed */}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          pt: 8,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6} data-aos="fade-right">
              <Typography variant="h2" gutterBottom fontWeight="bold">
                Inventory Management System
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                Streamline your business operations with our powerful inventory solution
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{ 
                  backgroundColor: 'white',
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.common.white, 0.9),
                  }
                }}
                onClick={() => router.push('/dashboard')}
              >
                Get Started
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component={motion.div}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  height: '400px',
                }}
              >
                <Box
                  component={motion.div}
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  initial={false}
                  sx={{
                    width: '80%',
                    height: '300px',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 4,
                    p: 3,
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  {[...Array(3)].map((_, index) => (
                    <Box
                      key={index}
                      component={motion.div}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.2 }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        component={motion.div}
                        whileHover={{ scale: 1.1 }}
                        sx={{ color: 'white' }}
                      >
                        <Inventory />
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Product {index + 1}
                        </Typography>
                        <Box
                          component={motion.div}
                          animate={{
                            width: ['60%', '80%', '60%'],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          initial={false}
                          sx={{
                            height: 4,
                            mt: 1,
                            bgcolor: 'rgba(255, 255, 255, 0.3)',
                            borderRadius: 1,
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'white' }}>
                        {15 + index * 20} units
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box component="section" id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ fontWeight: 600, mb: 6 }}>
            Why Choose IMS Pro?
          </Typography>
          <Grid container spacing={4}>
            {[
              {
                icon: <Inventory sx={{ fontSize: 40 }} />,
                title: 'Real-time Tracking',
                description: 'Monitor stock levels, orders, and sales as they happen with live updates.',
              },
              {
                icon: <ShoppingCart sx={{ fontSize: 40 }} />,
                title: 'Order Management',
                description: 'Efficiently process purchase orders and sales orders in one centralized system.',
              },
              {
                icon: <LocalShipping sx={{ fontSize: 40 }} />,
                title: 'Shipping Integrations',
                description: 'Seamlessly connect with popular shipping carriers for streamlined logistics.',
              },
              {
                icon: <Assessment sx={{ fontSize: 40 }} />,
                title: 'Insightful Analytics',
                description: 'Gain valuable insights with robust reporting and AI-powered demand forecasting.',
              },
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  elevation={0}
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    height: '100%',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                      borderColor: theme.palette.primary.main,
                    }
                  }}
                >
                  <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Invoice Creation Demo Section */}
      <Box component="section" id="demo" sx={{ py: { xs: 8, md: 12 }, bgcolor: alpha(theme.palette.secondary.light, 0.05) }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ fontWeight: 600, mb: 8 }}>
            Create an Invoice in 3 Easy Steps
          </Typography>
          <Grid container spacing={6} alignItems="center">
            {/* Left Side: Step-by-step guide */}
            <Grid item xs={12} md={5}>
              <Box display="flex" flexDirection="column" gap={4}>
                {[
                  {
                    icon: <PersonSearch sx={{ fontSize: 32, color: theme.palette.secondary.main }} />,
                    title: '1. Select Customer & Details',
                    description: 'Quickly find existing customers or add new ones. Fill in essential invoice details like due date and invoice number.',
                  },
                  {
                    icon: <PlaylistAddCheck sx={{ fontSize: 32, color: theme.palette.secondary.main }} />,
                    title: '2. Add Products or Services',
                    description: 'Easily add line items from your product catalog or enter custom services with quantities and prices.',
                  },
                  {
                    icon: <Send sx={{ fontSize: 32, color: theme.palette.secondary.main }} />,
                    title: '3. Preview & Send',
                    description: 'Review the generated invoice, add notes or discounts, and send it directly to your client via email or download as PDF.',
                  },
                ].map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                  >
                    <Box display="flex" alignItems="flex-start" gap={2.5}>
                      <Box sx={{ mt: 0.5 }}>
                        {step.icon}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 500, mb: 0.5 }}>{step.title}</Typography>
                        <Typography variant="body1" color="text.secondary">
                          {step.description}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Grid>
            {/* Right Side: Mock UI Image/Animation */}
            <Grid item xs={12} md={7}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Paper
                  elevation={8}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    height: { xs: 320, sm: 420, md: 480 },
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: `0 10px 30px ${alpha(theme.palette.secondary.main, 0.1)}`,
                  }}
                >
                  {/* Mock Invoice Header */}
                  <Box sx={{ p: {xs: 1.5, sm: 2}, bgcolor: alpha(theme.palette.grey[100], 0.8), borderRadius: 1.5, mb: {xs: 1.5, sm: 2} }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.secondary.dark }}>INVOICE</Typography>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">Invoice #IMS-2024-001</Typography>
                      <Typography variant="caption" color="text.secondary">Date: {new Date().toLocaleDateString()}</Typography>
                    </Box>
                  </Box>
                  {/* Mock Invoice Body */}
                  <Box sx={{ p: {xs: 1, sm: 1.5}, flexGrow: 1, overflowY: 'auto' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1.5, color: theme.palette.text.primary }}>
                      Bill To: Awesome Client Inc.
                    </Typography>
                    {[
                      { item: 'Premium Widget', qty: 2, price: 75 },
                      { item: 'Consulting Services (5hr)', qty: 1, price: 250 },
                      { item: 'Standard Gadget', qty: 10, price: 15 },
                    ].map((line, i) => (
                      <Box key={i} display="flex" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: `1px dashed ${theme.palette.divider}`, '&:last-child': { borderBottom: 'none'} }}>
                        <Typography variant="body2" sx={{ flex: 2 }}>{line.item}</Typography>
                        <Typography variant="body2" align="center" sx={{ flex: 1 }}>{line.qty} x ${line.price.toFixed(2)}</Typography>
                        <Typography variant="body2" align="right" sx={{ flex: 1, fontWeight: 500 }}>${(line.qty * line.price).toFixed(2)}</Typography>
                      </Box>
                    ))}
                  </Box>
                  {/* Mock Invoice Footer */}
                  <Box sx={{ p: {xs: 1.5, sm: 2}, mt: 'auto', borderTop: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.grey[50], 0.5) }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Total:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.secondary.dark }}>$550.00</Typography>
                    </Box>
                    <Button variant="contained" size="medium" sx={{ width: '100%' }} color="secondary" startIcon={<Send />}>
                      Send Invoice & Get Paid
                    </Button>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box component="section" id="testimonials" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ fontWeight: 600, mb: 6 }}>
            Loved by Businesses Like Yours
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {[
              {
                quote: "IMS Pro has revolutionized how we manage our stock. It's intuitive, powerful, and has saved us countless hours.",
                name: 'Jane Doe',
                title: 'CEO, Tech Solutions Inc.',
              },
              {
                quote: "The real-time tracking and reporting features are game-changers. We finally have a clear view of our inventory.",
                name: 'John Smith',
                title: 'Operations Manager, Retail Goods Co.',
              },
            ].map((testimonial, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Paper
                  elevation={0}
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  sx={{
                    p: 3,
                    height: '100%',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    '&:hover': {
                      boxShadow: theme.shadows[3],
                    }
                  }}
                >
                  <FormatQuote sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }} />
                  <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 2, flexGrow: 1 }}>
                    "{testimonial.quote}"
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {testimonial.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {testimonial.title}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box component="section" id="cta" sx={{ py: { xs: 8, md: 12 }, bgcolor: theme.palette.primary.main, color: 'white' }}>
        <Container maxWidth="md">
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            sx={{ textAlign: 'center' }}
          >
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              Ready to Transform Your Inventory Management?
            </Typography>
            <Typography sx={{ mb: 4, opacity: 0.9, fontSize: '1.1rem' }}>
              Join thousands of businesses optimizing their operations with IMS Pro.
              Start your free trial today and experience the difference.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/signup')}
              component={motion.button}
              whileHover={{ scale: 1.05, backgroundColor: theme.palette.common.white, color: theme.palette.primary.main }}
              whileTap={{ scale: 0.95 }}
              sx={{
                py: 1.5, px: 5, fontSize: '1.1rem', borderRadius: '50px',
                bgcolor: theme.palette.common.white,
                color: theme.palette.primary.main,
                border: `2px solid ${theme.palette.common.white}`,
              }}
            >
              Sign Up Now
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" id="contact" sx={{ bgcolor: theme.palette.grey[900], color: theme.palette.grey[400], py: 6, mt: 'auto' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="space-between">
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.common.white, fontWeight: 600 }}>
                IMS Pro
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                The ultimate solution for modern inventory management. Helping businesses streamline operations and maximize efficiency.
              </Typography>
              <Box>
                <IconButton href="#" color="inherit" aria-label="Facebook"><Facebook /></IconButton>
                <IconButton href="#" color="inherit" aria-label="Twitter"><Twitter /></IconButton>
                <IconButton href="#" color="inherit" aria-label="LinkedIn"><LinkedIn /></IconButton>
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.common.white, fontWeight: 500 }}>
                Product
              </Typography>
              <MuiLink href="#" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: theme.palette.primary.light } }}>Features</MuiLink>
              <MuiLink href="#" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: theme.palette.primary.light } }}>Pricing</MuiLink>
              <MuiLink href="#" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: theme.palette.primary.light } }}>Integrations</MuiLink>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.common.white, fontWeight: 500 }}>
                Company
              </Typography>
              <MuiLink href="#" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: theme.palette.primary.light } }}>About Us</MuiLink>
              <MuiLink href="#" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: theme.palette.primary.light } }}>Careers</MuiLink>
              <MuiLink href="#" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: theme.palette.primary.light } }}>Contact</MuiLink>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.common.white, fontWeight: 500 }}>
                Support
              </Typography>
              <MuiLink href="#" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: theme.palette.primary.light } }}>Help Center</MuiLink>
              <MuiLink href="#" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: theme.palette.primary.light } }}>FAQs</MuiLink>
              <MuiLink href="#" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: theme.palette.primary.light } }}>API Status</MuiLink>
            </Grid>
            <Grid item xs={6} md={2}> {/* Added Legal column */}
              <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.common.white, fontWeight: 500 }}>
                Legal
              </Typography>
              <MuiLink href="/privacy-policy" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: theme.palette.primary.light } }}>Privacy Policy</MuiLink>
              <MuiLink href="/terms-of-service" color="inherit" display="block" sx={{ mb: 1, '&:hover': { color: theme.palette.primary.light } }}>Terms of Service</MuiLink>
            </Grid>
          </Grid>
          <Typography variant="body2" align="center" sx={{ mt: 5, borderTop: `1px solid ${theme.palette.grey[700]}`, pt: 3 }}>
            © {new Date().getFullYear()} IMS Pro. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}