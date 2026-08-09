'use client';

import React from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  useTheme,
  Stack,
  Grid,
  alpha,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  PlayArrow, 
  CheckCircle, 
  Rocket,
  TrendingUp,
  Security,
  Support
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function CTA() {
  const theme = useTheme();
  const router = useRouter();

  const benefits = [
    { icon: <CheckCircle />, text: '30-day free trial' },
    { icon: <Security />, text: 'No credit card required' },
    { icon: <Support />, text: '24/7 customer support' },
    { icon: <TrendingUp />, text: 'Cancel anytime' },
  ];

  return (
    <Box 
      component="section" 
      id="cta" 
      sx={{ 
        py: { xs: 10, md: 15 },
        position: 'relative',
        overflow: 'hidden',
        background: `
          linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.secondary.main} 100%)
        `,
        color: 'white',
      }}
    >
      {/* Background decorations */}
      <Box
        component={motion.div}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          border: `2px solid ${alpha('#fff', 0.1)}`,
          zIndex: 0,
        }}
      />
      <Box
        component={motion.div}
        animate={{
          rotate: [360, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        sx={{
          position: 'absolute',
          bottom: '15%',
          right: '15%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          border: `2px solid ${alpha('#fff', 0.1)}`,
          zIndex: 0,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Stack spacing={4}>
                <Box>
                  <Chip 
                    icon={<Rocket />}
                    label="Limited Time Offer" 
                    sx={{ 
                      mb: 3,
                      bgcolor: alpha('#fff', 0.2),
                      color: 'white',
                      fontWeight: 600,
                      '& .MuiChip-icon': {
                        color: 'white'
                      }
                    }}
                  />
                  <Typography 
                    variant="h3" 
                    component="h2" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 800,
                      fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
                      lineHeight: 1.2,
                      mb: 3
                    }}
                  >
                    Ready to Transform Your Business?
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.9, 
                      lineHeight: 1.6,
                      fontWeight: 400,
                      mb: 4
                    }}
                  >
                    Join over 10,000+ businesses already using our platform to streamline 
                    their inventory management and boost productivity by 50%.
                  </Typography>
                </Box>

                <Stack direction="row" spacing={3} flexWrap="wrap">
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={() => router.push('/register')}
                    component={motion.button}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                    }}
                    whileTap={{ scale: 0.95 }}
                    sx={{
                      py: 2, 
                      px: 4, 
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      bgcolor: 'white',
                      color: theme.palette.primary.main,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: alpha('#fff', 0.95),
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Start Free Trial
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                    component={motion.button}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    sx={{
                      py: 2, 
                      px: 4, 
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      borderColor: 'white',
                      color: 'white',
                      textTransform: 'none',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        bgcolor: alpha('#fff', 0.1),
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Watch Demo
                  </Button>
                </Stack>
              </Stack>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Box
                sx={{
                  p: 4,
                  borderRadius: 4,
                  bgcolor: alpha('#fff', 0.1),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha('#fff', 0.2)}`,
                }}
              >
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, textAlign: 'center' }}>
                  What You Get
                </Typography>
                
                <Stack spacing={3}>
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            color: theme.palette.success.light,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {benefit.icon}
                        </Box>
                        <Typography variant="body1" fontWeight="500">
                          {benefit.text}
                        </Typography>
                      </Stack>
                    </motion.div>
                  ))}
                </Stack>

                <Box
                  sx={{
                    mt: 4,
                    p: 3,
                    borderRadius: 3,
                    bgcolor: alpha('#fff', 0.1),
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                    ₹0
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    for the first 30 days
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                    Then starting at ₹999/month
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Grid>
        </Grid>

        {/* Trust indicators */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
              Trusted by businesses worldwide
            </Typography>
            <Stack 
              direction="row" 
              spacing={4} 
              justifyContent="center" 
              alignItems="center"
              flexWrap="wrap"
            >
              {['10K+ Users', '99.9% Uptime', '24/7 Support', 'SOC 2 Compliant'].map((item, index) => (
                <Typography 
                  key={index}
                  variant="caption" 
                  sx={{ 
                    opacity: 0.7,
                    fontWeight: 500,
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: alpha('#fff', 0.1),
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
}