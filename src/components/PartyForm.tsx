'use client';
import React from 'react';
import {
  Paper,
  Grid,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { PartyFormData } from '@/types/party';

interface PartyFormProps {
  initialData?: Partial<PartyFormData>;
  onSubmit: (data: PartyFormData) => void;
  onCancel: () => void;
}

export default function PartyForm({ initialData, onSubmit, onCancel }: PartyFormProps) {
  const [formData, setFormData] = React.useState<PartyFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    gstin: initialData?.gstin || '',
    creditLimit: initialData?.creditLimit || 0,
    outstandingBalance: initialData?.outstandingBalance || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="GSTIN"
            value={formData.gstin}
            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Credit Limit"
            value={formData.creditLimit}
            onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Outstanding Balance"
            value={formData.outstandingBalance}
            onChange={(e) => setFormData({ ...formData, outstandingBalance: Number(e.target.value) })}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="contained" type="submit">
              Save
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}