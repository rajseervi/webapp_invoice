'use client';
import React, { useEffect, useState, use } from 'react';
import { Container, Typography, CircularProgress, Box, Alert, Snackbar } from '@mui/material';
import { useRouter } from 'next/navigation';
import EnhancedDashboardLayout from '@/components/DashboardLayout/EnhancedDashboardLayout';
import PageHeader from '@/components/PageHeader/PageHeader';
import EnhancedPartyForm from '@/components/EnhancedPartyForm';
import { partyService } from '@/services/partyService';
import type { Party, PartyFormData } from '@/types/party';
import { Edit as EditIcon } from '@mui/icons-material';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function EditParty({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadParty();
  }, []);

  const loadParty = async () => {
    try {
      const data = await partyService.getParty(resolvedParams.id);
      setParty(data);
    } catch (error) {
      console.error('Error loading party:', error);
      setError('Failed to load party details');
      setTimeout(() => router.push('/parties'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: PartyFormData) => {
    try {
      setSaving(true);
      setError(null);
      
      await partyService.updateParty(resolvedParams.id, data);
      setSuccess('Party updated successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/parties');
      }, 2000);
    } catch (error) {
      console.error('Error updating party:', error);
      setError('Failed to update party. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <EnhancedDashboardLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Loading party details...
              </Typography>
            </Box>
          </Box>
        </Container>
      </EnhancedDashboardLayout>
    );
  }

  if (!party) {
    return (
      <EnhancedDashboardLayout>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            Party not found. Redirecting to parties list...
          </Alert>
        </Container>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <PageHeader
          title={`Edit Party: ${party.name}`}
          subtitle="Update party information and GST details"
          icon={<EditIcon />}
        />
        
        <EnhancedPartyForm
          initialData={party}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/parties')}
        />

        {/* Success Message */}
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert
            onClose={() => setSuccess(null)}
            severity="success"
            sx={{ width: '100%' }}
          >
            {success}
          </Alert>
        </Snackbar>

        {/* Error Message */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </EnhancedDashboardLayout>
  );
}