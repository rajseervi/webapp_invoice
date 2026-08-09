'use client';

import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link as MuiLink,
  IconButton,
  useTheme,
} from '@mui/material';
import { Facebook, Twitter, LinkedIn } from '@mui/icons-material';

export default function Footer() {
  const theme = useTheme();

  return (
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
          <Grid item xs={6} md={2}>
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
  );
}