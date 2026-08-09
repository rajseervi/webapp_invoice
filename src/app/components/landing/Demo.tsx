'use client';

import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  PersonSearch,
  PlaylistAddCheck,
  Send,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: <PersonSearch sx={{ fontSize: 32 }} />,
    title: '1. Select Customer & Details',
    description: 'Quickly find existing customers or add new ones. Fill in essential invoice details like due date and invoice number.',
  },
  {
    icon: <PlaylistAddCheck sx={{ fontSize: 32 }} />,
    title: '2. Add Products or Services',
    description: 'Easily add line items from your product catalog or enter custom services with quantities and prices.',
  },
  {
    icon: <Send sx={{ fontSize: 32 }} />,
    title: '3. Preview & Send',
    description: 'Review the generated invoice, add notes or discounts, and send it directly to your client via email or download as PDF.',
  },
];

export default function Demo() {
  const theme = useTheme();

  return (
    <Box component="section" id="demo" sx={{ py: { xs: 8, md: 12 }, bgcolor: alpha(theme.palette.secondary.light, 0.05) }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ fontWeight: 600, mb: 8 }}>
          Create an Invoice in 3 Easy Steps
        </Typography>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={5}>
            <Box display="flex" flexDirection="column" gap={4}>
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                  <Box display="flex" alignItems="flex-start" gap={2.5}>
                    <Box sx={{ mt: 0.5, color: theme.palette.secondary.main }}>
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
                <Box sx={{ p: {xs: 1.5, sm: 2}, bgcolor: alpha(theme.palette.grey[100], 0.8), borderRadius: 1.5, mb: {xs: 1.5, sm: 2} }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.secondary.dark }}>INVOICE</Typography>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Invoice #IMS-2024-001</Typography>
                    <Typography variant="caption" color="text.secondary">Date: {new Date().toLocaleDateString()}</Typography>
                  </Box>
                </Box>
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
  );
}