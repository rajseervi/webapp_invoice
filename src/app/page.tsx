"use client"
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent, 
  useTheme,
  alpha,
  AppBar,
  Toolbar,
  Link as MuiLink,
} from '@mui/material';
import {
  Inventory,
  Assessment,
  Security,
  Speed, 
  ArrowForward,
  BarChart,
  People,
  Support,
  DeviceHub,
  LocalShipping, 
  ShoppingCart,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Features', id: 'features' },
  { label: 'Solutions', id: 'solutions' },
  { label: 'Statistics', id: 'statistics' },
  { label: 'Integrations', id: 'integrations' },
];

export default function Home() {
  const theme = useTheme();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box>
      <AppBar 
        position="fixed" 
        sx={{ 
          bgcolor: isScrolled ? 'rgba(255,255,255,0.9)' : 'transparent',
          boxShadow: isScrolled ? theme.shadows[4] : 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: isScrolled ? 'blur(8px)' : 'none',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" color={isScrolled ? 'primary' : 'white'}>IMS</Typography>
          <Box sx={{ display: 'flex', gap: 4 }}>
            {navItems.map((item) => (
              <MuiLink
                key={item.id}
                component="button"
                underline="none"
                color={isScrolled ? 'inherit' : 'white'}
                onClick={() => scrollToSection(item.id)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { color: isScrolled ? 'primary.main' : alpha(theme.palette.common.white, 0.8) }
                }}
              >
                {item.label}
              </MuiLink>
            ))}
          </Box>
          <Button 
            variant={isScrolled ? "contained" : "outlined"} 
            color={isScrolled ? "primary" : "inherit"}
            onClick={() => router.push('/dashboard')}
          >
            Login
          </Button>
        </Toolbar>
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
      <Box id="features" sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom data-aos="fade-up">
            Key Features
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            {[
              {
                icon: <Inventory fontSize="large" />,
                title: 'Real-time Tracking',
                description: 'Monitor your inventory levels in real-time with accurate tracking',
              },
              {
                icon: <Assessment fontSize="large" />,
                title: 'Advanced Analytics',
                description: 'Make data-driven decisions with comprehensive analytics',
              },
              {
                icon: <Security fontSize="large" />,
                title: 'Secure System',
                description: 'Your data is protected with enterprise-grade security',
              },
              {
                icon: <Speed fontSize="large" />,
                title: 'Fast Performance',
                description: 'Lightning-fast operations for seamless management',
              },
            ].map((feature, index) => (
              <Grid item xs={12} md={6} lg={3} key={index}>
                <Box
                  component={motion.div}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card sx={{ height: '100%', p: 3 }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Statistics Section */}
      <Box id="statistics" sx={{ py: 10, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {[
              { icon: <BarChart />, value: '50K+', label: 'Products Tracked' },
              { icon: <People />, value: '10K+', label: 'Happy Customers' },
              { icon: <Support />, value: '24/7', label: 'Support' },
              { icon: <DeviceHub />, value: '99.9%', label: 'Uptime' },
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Card sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ color: theme.palette.primary.main }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="h3" sx={{ my: 2 }}>
                      {stat.value}
                    </Typography>
                    <Typography color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Card>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Interactive Stock Management Demo */}
      <Box id="demo" sx={{ py: 12, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom data-aos="fade-up">
            Live Stock Management
          </Typography>
          
          <Grid container spacing={6} sx={{ mt: 4 }}>
            <Grid item xs={12} md={6}>
              <Box
                component={motion.div}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                sx={{
                  p: 4,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  height: '400px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {[...Array(5)].map((_, index) => (
                  <Box
                    key={index}
                    component={motion.div}
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.2 }}
                    sx={{
                      p: 2,
                      m: 1,
                      bgcolor: 'white',
                      borderRadius: 1,
                      boxShadow: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Box
                      component={motion.div}
                      whileHover={{ scale: 1.1 }}
                      sx={{ color: theme.palette.primary.main }}
                    >
                      <Inventory />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1">Product {index + 1}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          component={motion.div}
                          animate={{
                            backgroundColor: ['#4CAF50', '#FFA726', '#4CAF50'],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          initial={false}
                          sx={{ width: 8, height: 8, borderRadius: '50%' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Live Tracking
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      component={motion.div}
                      animate={{
                        y: [0, -5, 0],
                      }}
                      transition={{ duration: 1, repeat: Infinity }}
                      initial={false}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.success.main }}
                      >
                        In Stock: {Math.floor(Math.random() * 100)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  {
                    icon: <ShoppingCart />,
                    title: 'Real-time Updates',
                    description: 'See stock levels change in real-time as orders are processed',
                  },
                  {
                    icon: <LocalShipping />,
                    title: 'Shipping Integration',
                    description: 'Automatic stock adjustments when shipments are received',
                  },
                  {
                    icon: <Assessment />,
                    title: 'Smart Analytics',
                    description: 'AI-powered insights for inventory optimization',
                  },
                ].map((feature, index) => (
                  <Box
                    key={index}
                    component={motion.div}
                    whileHover={{ x: 10 }}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                    }}
                  >
                    <Box sx={{ color: theme.palette.primary.main }}>
                      {feature.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6">{feature.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="md">
          <Box
            component={motion.div}
            whileHover={{ scale: 1.02 }}
            sx={{
              textAlign: 'center',
              p: 6,
              borderRadius: 4,
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <Typography variant="h4" gutterBottom>
              Ready to Get Started?
            </Typography>
            <Typography sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of businesses managing their inventory efficiently
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{ bgcolor: 'white', color: 'primary.main' }}
              endIcon={<ArrowForward />}
              onClick={() => router.push('/dashboard')}
            >
              Start Now
            </Button>
          </Box>
        </Container>
      </Box>

      <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'white', py: 6, mt: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>About IMS</Typography>
              <Typography variant="body2">
                Leading inventory management solution helping businesses streamline their operations.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Quick Links</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {navItems.map((item) => (
                  <MuiLink
                    key={item.id}
                    component="button"
                    color="inherit"
                    onClick={() => scrollToSection(item.id)}
                    sx={{ cursor: 'pointer', textAlign: 'left' }}
                  >
                    {item.label}
                  </MuiLink>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Contact</Typography>
              <Typography variant="body2">
                Email: support@ims.com<br />
                Phone: +1 234 567 890<br />
                Address: 123 Business Street
              </Typography>
            </Grid>
          </Grid>
          <Typography variant="body2" sx={{ mt: 4, textAlign: 'center' }}>
            © {new Date().getFullYear()} Inventory Management System. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
