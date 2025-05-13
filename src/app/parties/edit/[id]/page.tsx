'use client';
import React, { useEffect, useState } from 'react';
import { Container, Typography, CircularProgress, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/Layout/Layout';
import PartyForm from '@/components/PartyForm';
import { partyService } from '@/services/partyService';
import type { Party, PartyFormData } from '@/types/party';

type PageProps = {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function EditParty({ params }: PageProps) {
  const router = useRouter();
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParty();
  }, []);

  const loadParty = async () => {
    try {
      const data = await partyService.getParty(params.id);
      setParty(data);
    } catch (error) {
      console.error('Error loading party:', error);
      router.push('/parties');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: PartyFormData) => {
    try {
      await partyService.updateParty(params.id, data);
      router.push('/parties');
    } catch (error) {
      console.error('Error updating party:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 4 }}>Edit Party</Typography>
        {party && (
          <PartyForm
            initialData={party}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/parties')}
          />
        )}
      </Container>
    </DashboardLayout>
  );
}