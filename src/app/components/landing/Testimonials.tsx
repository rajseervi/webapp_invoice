'use client';

import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  useTheme,
  Avatar,
  Stack,
  Rating,
  alpha,
  Chip,
} from '@mui/material';
import { FormatQuote, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "This platform transformed our inventory management completely. The AI-powered insights helped us reduce waste by 40% and increase efficiency dramatically.",
    name: 'Priya Sharma',
    title: 'Operations Director',
    company: 'TechFlow Solutions',
    rating: 5,
    avatar: '/api/placeholder/60/60',
    industry: 'Technology',
  },
  {
    quote: "The GST compliance features are outstanding. We've saved hours of manual work and eliminated errors in our tax filings. Highly recommended!",
    name: 'Rajesh Kumar',
    title: 'Finance Manager',
    company: 'Global Retail Corp',
    rating: 5,
    avatar: '/api/placeholder/60/60',
    industry: 'Retail',
  },
  {
    quote: "Real-time tracking and analytics have given us unprecedented visibility into our supply chain. The ROI was evident within the first month.",
    name: 'Anita Patel',
    title: 'Supply Chain Head',
    company: 'Manufacturing Plus',
    rating: 5,
    avatar: '/api/placeholder/60/60',
    industry: 'Manufacturing',
  },
];

const stats = [
  { value: '4.9/5', label: 'Average Rating' },
  { value: '10K+', label: 'Happy Customers' },
  { value: '99%', label: 'Satisfaction Rate' },
];

export default function Testimonials() {
  const theme = useTheme();

  return (
    <Box 
      component="section" 
      id="testimonials" 
      sx={{ 
        py: { xs: 10, md: 15 },
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${theme.palette.background.default} 100%)`,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box textAlign="center" sx={{ mb: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Chip 
              icon={<Star />}
              label="Customer Stories" 
              variant="outlined"
              sx={{ 
                mb: 3,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                fontWeight: 500
              }}
            />
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                background: `linear-gradient(135deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Loved by Businesses Worldwide
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}
            >
              See how companies across industries are transforming their operations 
              with our intelligent inventory management platform.
            </Typography>
          </motion.div>
        </Box>

        {/* Stats */}
        <Box sx={{ mb: 8 }}>
          <Grid container spacing={4} justifyContent="center">
            {stats.map((stat, index) => (
              <Grid item xs={4} md={2} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Box textAlign="center">
                    <Typography 
                      variant="h4" 
                      fontWeight="bold" 
                      color="primary.main"
                      sx={{ mb: 1 }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Testimonials */}
        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -8 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    background: theme.palette.background.paper,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[12],
                      borderColor: theme.palette.primary.main,
                      '& .quote-icon': {
                        transform: 'scale(1.1)',
                        color: theme.palette.primary.main,
                      }
                    }
                  }}
                >
                  {/* Background decoration */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                      zIndex: 0,
                    }}
                  />

                  <Stack spacing={3} sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
                    {/* Quote icon and rating */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <FormatQuote 
                        className="quote-icon"
                        sx={{ 
                          fontSize: 32, 
                          color: theme.palette.primary.main,
                          transition: 'all 0.3s ease',
                          opacity: 0.7
                        }} 
                      />
                      <Rating 
                        value={testimonial.rating} 
                        readOnly 
                        size="small"
                        sx={{ color: theme.palette.warning.main }}
                      />
                    </Box>

                    {/* Quote */}
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontStyle: 'italic',
                        lineHeight: 1.6,
                        flexGrow: 1,
                        color: theme.palette.text.secondary
                      }}
                    >
                      "{testimonial.quote}"
                    </Typography>

                    {/* Author info */}
                    <Box>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: theme.palette.primary.main,
                            fontSize: '1.2rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="600">
                            {testimonial.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {testimonial.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {testimonial.company}
                          </Typography>
                        </Box>
                      </Stack>
                      
                      <Chip
                        label={testimonial.industry}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontWeight: 500,
                          fontSize: '0.75rem',
                        }}
                      />
                    </Box>
                  </Stack>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Bottom section */}
        <Box textAlign="center" sx={{ mt: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Typography variant="h6" gutterBottom fontWeight="600">
              Join thousands of satisfied customers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start your free trial today and see the difference for yourself
            </Typography>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
}