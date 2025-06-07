import React, { useState, useEffect } from 'react';
import { Select, MenuItem, FormControl, InputLabel, Box, Typography, SelectChangeEvent } from '@mui/material';

// PartySearchDropdown component for selecting and displaying party accounts
  const PartySearchDropdown = ({ onPartySelect }: { onPartySelect: (party: string) => void }) => {
  const [parties, setParties] = useState([
    { id: 1, name: 'Party A' },
    { id: 2, name: 'Party B' },
    { id: 3, name: 'Party C' }
  ]);
  const [selectedParty, setSelectedParty] = useState('');


  // Handle party selection
  const handlePartyChange = (event: SelectChangeEvent<string>) => {
    const selected = event.target.value;
    setSelectedParty(selected);
    onPartySelect(selected);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>Search by Party Name</Typography>
      <FormControl fullWidth>
        <InputLabel>Parties</InputLabel>
        <Select
          value={selectedParty}
          onChange={handlePartyChange}
          sx={{ borderRadius: 2 }}
        >
          {parties.map((party: { id: number, name: string }) => (
            <MenuItem key={party.id} value={party.name}>
              {party.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default PartySearchDropdown;
