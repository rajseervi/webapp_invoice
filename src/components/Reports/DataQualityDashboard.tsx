"use client";
import React from 'react';
import { Box, Typography, Card, CardContent, Grid, LinearProgress, List, ListItem, ListItemText } from '@mui/material';

// Minimal Data Quality dashboard placeholder to satisfy imports
export default function DataQualityDashboard() {
  const checks = [
    { name: 'Missing Party Emails', percent: 65 },
    { name: 'Products Without HSN', percent: 40 },
    { name: 'Invoices Without Party Link', percent: 10 },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Data Quality Overview
      </Typography>

      <Grid container spacing={2}>
        {checks.map((c) => (
          <Grid key={c.name} item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  {c.name}
                </Typography>
                <LinearProgress variant="determinate" value={c.percent} />
                <Typography variant="caption" color="text.secondary">
                  {c.percent}% issues detected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Recent Issues
          </Typography>
          <List dense>
            <ListItem><ListItemText primary="Party XYZ missing GSTIN" /></ListItem>
            <ListItem><ListItemText primary="Product ABC missing category" /></ListItem>
            <ListItem><ListItemText primary="Invoice #123 missing due date" /></ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}