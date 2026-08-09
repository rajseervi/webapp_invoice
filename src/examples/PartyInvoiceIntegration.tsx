/**
 * Example: Party-Invoice Integration
 * This file demonstrates how to integrate the enhanced party system with invoice creation
 */

'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  TextField,
  Chip,
  Typography,
  Alert
} from '@mui/material';
import { Add as AddIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import StreamlinedPartyForm from '@/components/StreamlinedPartyForm';
import { partyService } from '@/services/partyService';
import { Party, PartyFormData } from '@/types/party';

interface PartyInvoiceIntegrationProps {
  onPartySelect: (party: Party) => void;
  selectedParty?: Party | null;
}

export default function PartyInvoiceIntegration({ 
  onPartySelect, 
  selectedParty 
}: PartyInvoiceIntegrationProps) {
  const router = useRouter();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    try {
      setLoading(true);
      const allParties = await partyService.getActiveParties();
      setParties(allParties);
    } catch (error) {
      console.error('Error loading parties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateParty = async (partyData: PartyFormData) => {
    try {
      const partyId = await partyService.createParty(partyData);
      
      // Reload parties to include the new one
      await loadParties();
      
      // Find and select the newly created party
      const newParty = await partyService.getParty(partyId);
      onPartySelect(newParty);
      
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating party:', error);
    }
  };

  const handleSearchParties = async (searchTerm: string) => {
    if (searchTerm.trim() === '') {
      loadParties();
      return;
    }

    try {
      const searchResults = await partyService.searchParties(searchTerm);
      setParties(searchResults);
    } catch (error) {
      console.error('Error searching parties:', error);
    }
  };

  const getPartyDisplayText = (party: Party) => {
    const gstStatus = party.isGstRegistered ? 'GST' : 'Non-GST';
    const state = party.stateName ? ` - ${party.stateName}` : '';
    return `${party.name} (${gstStatus})${state}`;
  };

  const getPartyChips = (party: Party) => {
    const chips = [];
    
    if (party.isGstRegistered) {
      chips.push(
        <Chip 
          key="gst" 
          label="GST Registered" 
          color="success" 
          size="small" 
        />
      );
    }
    
    if (party.businessType) {
      chips.push(
        <Chip 
          key="business" 
          label={party.businessType} 
          color="primary" 
          size="small" 
        />
      );
    }
    
    if (party.stateName) {
      chips.push(
        <Chip 
          key="state" 
          label={party.stateName} 
          color="secondary" 
          size="small" 
        />
      );
    }

    return chips;
  };

  return (
    <Box>
      {/* Party Selection with Create Option */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Autocomplete
            options={parties}
            getOptionLabel={getPartyDisplayText}
            value={selectedParty}
            onChange={(_, newValue) => onPartySelect(newValue)}
            onInputChange={(_, value) => {
              setSearchTerm(value);
              handleSearchParties(value);
            }}
            loading={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Party"
                placeholder="Search by name, phone, GSTIN..."
                helperText="Start typing to search existing parties"
              />
            )}
            renderOption={(props, party) => {
              const { key, ...otherProps } = props;
              return (
                <Box component="li" key={key} {...otherProps}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body1" fontWeight="medium">
                      {party.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      {getPartyChips(party)}
                    </Box>
                    {party.phone && (
                      <Typography variant="caption" color="text.secondary">
                        📞 {party.phone}
                      </Typography>
                    )}
                    {party.gstin && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                        🧾 {party.gstin}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            }}
            noOptionsText={
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No parties found
                </Typography>
                <Button
                  variant="text"
                  startIcon={<AddIcon />}
                  onClick={() => setShowCreateDialog(true)}
                  sx={{ mt: 1 }}
                >
                  Create New Party
                </Button>
              </Box>
            }
          />
        </Box>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
          sx={{ mt: 1 }}
        >
          New Party
        </Button>
      </Box>

      {/* Selected Party Information */}
      {selectedParty && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              Selected Party: {selectedParty.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {getPartyChips(selectedParty)}
            </Box>
            {selectedParty.isGstRegistered && selectedParty.gstin && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                GSTIN: {selectedParty.gstin} | 
                State: {selectedParty.stateName} |
                Tax Type: {selectedParty.stateCode === '27' ? 'Intra-State (CGST+SGST)' : 'May be Inter-State (IGST)'}
              </Typography>
            )}
          </Box>
        </Alert>
      )}

      {/* Create Party Dialog */}
      <Dialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" />
          Create New Party for Invoice
        </DialogTitle>
        <DialogContent>
          <StreamlinedPartyForm
            onSubmit={handleCreateParty}
            onCancel={() => setShowCreateDialog(false)}
            isInvoiceFlow={true}
            compactMode={true}
            initialData={{
              businessType: 'B2B',
              isGstRegistered: true
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

/**
 * Usage Example in Invoice Creation Page:
 */

export function InvoiceCreationExample() {
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [invoiceItems, setInvoiceItems] = useState([]);

  const handlePartySelect = (party: Party) => {
    setSelectedParty(party);
    
    // Update invoice calculations based on party's state
    if (party.isGstRegistered && party.stateCode) {
      // Determine if inter-state or intra-state
      // Update GST calculations accordingly
      console.log('Party selected:', party);
      console.log('GST calculations will be updated based on state:', party.stateName);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create GST Invoice
      </Typography>

      {/* Step 1: Party Selection */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          1. Select Party
        </Typography>
        <PartyInvoiceIntegration
          onPartySelect={handlePartySelect}
          selectedParty={selectedParty}
        />
      </Box>

      {/* Step 2: Invoice Items (shown only after party selection) */}
      {selectedParty && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            2. Add Invoice Items
          </Typography>
          <Alert severity="success">
            <Typography variant="body2">
              Party selected! You can now add invoice items. 
              GST will be calculated based on {selectedParty.stateName} state.
            </Typography>
          </Alert>
          {/* Invoice items form would go here */}
        </Box>
      )}

      {/* Step 3: Review & Generate (shown only after items added) */}
      {selectedParty && invoiceItems.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            3. Review & Generate Invoice
          </Typography>
          {/* Invoice review and generation would go here */}
        </Box>
      )}
    </Box>
  );
}

/**
 * Alternative: Quick Party Creation from Invoice Page
 */

export function QuickPartyCreation() {
  const router = useRouter();

  const handleQuickCreate = () => {
    // Navigate to party creation with invoice context
    router.push('/parties/new?from=invoice&returnTo=' + encodeURIComponent(window.location.pathname));
  };

  return (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={handleQuickCreate}
      fullWidth
    >
      Create New Party & Continue
    </Button>
  );
}