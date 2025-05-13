'use client';
import React from 'react';
import { Container, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/Layout/Layout';
import PartyForm from '@/components/PartyForm';
import { partyService } from '@/services/partyService';
import type { PartyFormData } from '@/types/party';

export default function NewParty() {
  const router = useRouter();

  const handleSubmit = async (data: PartyFormData) => {
    try {
      await partyService.createParty(data);
      router.push('/parties');
    } catch (error) {
      console.error('Error creating party:', error);
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>Add New Party</Typography>
        <PartyForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/parties')}
        />
      </Container>
    </DashboardLayout>
  );
}